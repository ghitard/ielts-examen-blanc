// Builds the report sent back to Claude: readable Markdown + a JSON block for precise processing.
import { WRITING } from '../data/writing.js';
import { CUE_CARD } from '../data/speaking.js';
import { TYPE_LABELS, TAG_LABELS, STATUS_LABELS, SKILL_LABELS } from './analysis.js';
import { fmtBand, cefr } from './scoring.js';
import { formatDateFR } from './util.js';

const PURPOSE = { etudes: 'Études', travail: 'Travail', immigration: 'Immigration', autre: 'Autre' };

function line(label, x) { return x && x.n ? `${label} ${x.ok}/${x.n}` : null; }
function list(obj, labels) {
  return Object.entries(obj || {}).map(([k, v]) => `${labels[k] || k} ${v.ok}/${v.n}`).join(', ');
}

export function buildMarkdown(state, a) {
  const p = a.profile || {}, f = a.final || {}, prefs = f.prefs || {};
  const out = [];
  const name = p.name || 'Candidat·e';
  out.push(`# Bilan d’examen blanc IELTS Academic — ${name}`);
  out.push(`Examen passé le ${formatDateFR(state.listening.startedAt || state.reading.startedAt || state.createdAt)}, bilan généré le ${formatDateFR(a.generatedAt)}. Contenu original au format du test informatisé (computer-delivered).`);
  out.push('');
  out.push('## Ce que j’attends de toi');
  out.push('Tu es mon examinateur IELTS. À partir de ce bilan :');
  out.push('1. Corrige mes deux textes de Writing selon les 4 critères officiels (Task Achievement / Task Response, Coherence and Cohesion, Lexical Resource, Grammatical Range and Accuracy) : une bande par critère et par tâche, puis mes erreurs récurrentes avec leur correction.');
  out.push('2. Évalue mon Speaking à partir des transcriptions et des mesures de fluidité (Fluency and Coherence, Lexical Resource, Grammatical Range and Accuracy). La prononciation ne peut pas être évaluée sur transcription : signale ce que tu peux en déduire et ce qui reste inconnu.');
  out.push('3. Donne ma bande globale estimée et mon niveau CECRL.');
  out.push('4. Affine le pré-diagnostic et le plan ci-dessous, puis construis l’application d’entraînement la plus efficace et la plus agréable possible pour atteindre mon objectif, en tenant compte de mes préférences.');
  out.push('');
  out.push('## Profil');
  out.push(`- Objectif : bande ${fmtBand(a.bands.target)}${a.bands.target ? ` (${cefr(a.bands.target)})` : ''}`);
  out.push(`- Date d’examen : ${p.examDate ? formatDateFR(p.examDate) : 'non fixée'}${a.plan.weeks ? ` (dans ${a.plan.weeks} semaine${a.plan.weeks > 1 ? 's' : ''})` : ''}`);
  out.push(`- Raison : ${PURPOSE[p.purpose] || 'non précisée'}`);
  out.push(`- Expérience IELTS : ${p.previous === 'oui' ? `déjà passé${p.previousScore ? `, bande ${p.previousScore}` : ''}` : 'premier IELTS'}`);
  out.push('');

  out.push('## Résultats');
  out.push('| Épreuve | Score | Bande | Remarques |');
  out.push('|---|---|---|---|');
  const L = a.listening, R = a.reading, W = a.writing, S = a.speaking;
  out.push(`| Listening | ${L ? `${L.raw}/40` : 'non passé'} | ${L ? fmtBand(L.band) : '—'} | ${L ? metaNote(L.meta) : ''} |`);
  out.push(`| Reading | ${R ? `${R.raw}/40` : 'non passé'} | ${R ? fmtBand(R.band) : '—'} | ${R ? `temps ${R.time[1]}/${R.time[2]}/${R.time[3]} min ; ${metaNote(R.meta)}` : ''} |`);
  out.push(`| Writing | ${W ? 'à corriger' : 'non passé'} | ${a.bands.wSelf != null ? `auto-évaluation ${fmtBand(a.bands.wSelf)}` : '—'} | ${W ? `T1 ${W.t1.words} mots, T2 ${W.t2.words} mots` : ''} |`);
  out.push(`| Speaking | ${S ? 'à évaluer' : 'non passé'} | ${a.bands.sSelf != null ? `auto-évaluation ${fmtBand(a.bands.sSelf)}` : '—'} | ${S ? `${S.items.length} réponses, ${Math.round(S.transcribedShare * 100)} % transcrites` : ''} |`);
  if (a.bands.overallProvisional != null) out.push(`\nBande globale provisoire (avec mes auto-évaluations en Writing et Speaking) : ${fmtBand(a.bands.overallProvisional)}.`);
  out.push('');

  if (L) {
    out.push('## Listening — détail');
    out.push(`- Par partie : ${[1, 2, 3, 4].map(i => line(`P${i}`, L.byPart[i])).filter(Boolean).join(', ')}`);
    out.push(`- Par type de question : ${list(L.byType, TYPE_LABELS)}`);
    out.push(`- Par compétence : ${list(L.byTag, TAG_LABELS)}`);
    out.push(`- Types d’erreurs : ${Object.entries(L.status).filter(([k]) => k !== 'ok').map(([k, v]) => `${STATUS_LABELS[k]} ${v}`).join(', ') || 'aucune'}`);
    if (L.errors.length) {
      out.push('- Erreurs (ma réponse → attendu, catégorie) :');
      for (const e of L.errors) out.push(`  - Q${e.q} [${TYPE_LABELS[e.type]}] « ${e.given || '—'} » → ${e.correct} (${STATUS_LABELS[e.status]})`);
    }
    out.push('');
  }

  if (R) {
    out.push('## Reading — détail');
    out.push(`- Par texte : ${[1, 2, 3].map(i => line(`T${i}`, R.byPart[i])).filter(Boolean).join(', ')}`);
    out.push(`- Temps par texte : ${R.time[1]} / ${R.time[2]} / ${R.time[3]} min (repère 17 / 20 / 23), total ${R.time.used} min${R.time.auto ? ', temps écoulé' : ''}`);
    out.push(`- Par type de question : ${list(R.byType, TYPE_LABELS)}`);
    out.push(`- Par compétence : ${list(R.byTag, TAG_LABELS)}`);
    const conf = Object.entries(R.confusion).flatMap(([c, g]) => Object.entries(g).filter(([x]) => x !== c).map(([x, n]) => `${c} lu comme ${x} : ${n}`));
    if (conf.length) out.push(`- Confusions T/F/NG et Y/N/NG : ${conf.join(', ')}`);
    out.push(`- Types d’erreurs : ${Object.entries(R.status).filter(([k]) => k !== 'ok').map(([k, v]) => `${STATUS_LABELS[k]} ${v}`).join(', ') || 'aucune'}`);
    if (R.errors.length) {
      out.push('- Erreurs (ma réponse → attendu, catégorie) :');
      for (const e of R.errors) out.push(`  - Q${e.q} [${TYPE_LABELS[e.type]}] « ${e.given || '—'} » → ${e.correct} (${STATUS_LABELS[e.status]})`);
    }
    out.push('');
  }

  if (W) {
    const t1 = WRITING.task1, t2 = WRITING.task2;
    out.push('## Writing — productions à corriger');
    out.push(`Temps : Task 1 ${W.time[1]} min, Task 2 ${W.time[2]} min (total ${W.time.used} min${W.time.auto ? ', temps écoulé' : ''}). Premier mot tapé après ${secs(W.firstKey[1])} (T1) et ${secs(W.firstKey[2])} (T2).${W.pastes.length ? ` Collages de texte détectés : ${W.pastes.length}.` : ''}`);
    out.push('');
    out.push('### Task 1 — consigne');
    out.push(`> ${t1.prompt} ${t1.instruction} Write at least 150 words.`);
    out.push('');
    out.push(`Données du graphique (${t1.chart.yLabel}) :`);
    out.push(`| Méthode | ${t1.chart.years.join(' | ')} |`);
    out.push(`|---|${t1.chart.years.map(() => '---').join('|')}|`);
    for (const s of t1.chart.series) out.push(`| ${s.name} | ${s.values.join(' | ')} |`);
    out.push('');
    out.push('Points clés attendus : ' + t1.keyFeatures.join(' '));
    out.push('');
    out.push(`### Task 1 — mon texte (${W.t1.words} mots)`);
    out.push(fence(W.text1));
    out.push(`Indicateurs : ${statsLine(W.t1, 1)}`);
    out.push('');
    out.push('### Task 2 — consigne');
    out.push(`> ${t2.prompt} ${t2.question} ${t2.instruction} Write at least 250 words.`);
    out.push('');
    out.push(`### Task 2 — mon texte (${W.t2.words} mots)`);
    out.push(fence(W.text2));
    out.push(`Indicateurs : ${statsLine(W.t2, 2)}`);
    out.push('');
  }

  if (S) {
    out.push('## Speaking — transcriptions à évaluer');
    out.push(`Transcription automatique du navigateur (peut omettre les hésitations et déformer certains mots). Bruit ambiant : ${S.env.noise ?? 'inconnu'}. Questions affichées à l’écran : ${S.shownQuestions}.`);
    out.push(`Mesures par partie : ${[1, 2, 3].map(i => S.byPart[i] && S.byPart[i].n ? `P${i} durée moy. ${S.byPart[i].avgDuration} s, délai moy. ${S.byPart[i].avgLatency} s, ${S.byPart[i].wpm} mots/min, ${S.byPart[i].pausesPerMin} pauses>1 s/min${S.byPart[i].capped ? `, ${S.byPart[i].capped} interruption(s) par l’examinatrice` : ''}` : null).filter(Boolean).join(' ; ')}.`);
    out.push(`Lexique : ${S.words} mots transcrits, diversité ${S.lexicalDiversity} (MATTR)${S.repeated.length ? `, mots les plus répétés : ${S.repeated.map(r => `${r[0]} (${r[1]})`).join(', ')}` : ''}.`);
    for (const part of [1, 2, 3]) {
      const its = S.items.filter(i => i.part === part);
      if (!its.length) continue;
      out.push('');
      out.push(`### Part ${part}`);
      if (part === 2) {
        out.push(`Carte : ${CUE_CARD.title} You should say: ${CUE_CARD.points.join('; ')}; ${CUE_CARD.last}`);
        out.push(`Préparation utilisée : ${S.prepUsed ?? '—'} s.${S.notes ? ` Notes : « ${S.notes.replace(/\s+/g, ' ').slice(0, 300)} »` : ''}`);
      }
      for (const i of its) {
        out.push(`**${i.question}** — ${i.duration} s, délai ${i.latency} s, ${i.words} mots, ${i.wpm} mots/min, ${i.pauses1} pause(s) > 1 s (dont ${i.pauses2} > 2 s)${i.capped ? ', interrompu·e par l’examinatrice' : ''}${i.more ? ', relancé·e' : ''}`);
        out.push(i.transcript ? `> ${i.transcript}` : '> (aucune transcription)');
      }
    }
    out.push('');
  }

  out.push('## Ressenti et auto-évaluation');
  const diff = f.difficulty || {};
  out.push(`- Difficulté ressentie (1 = très facile, 5 = très difficile) : ${Object.entries(diff).map(([k, v]) => `${SKILL_LABELS[k]} ${v}`).join(', ') || 'non renseignée'}`);
  out.push(`- Auto-évaluation : Writing ${fmtBand(a.bands.wSelf)}, Speaking ${fmtBand(a.bands.sSelf)}`);
  out.push(`- Ce qui m’a gêné : ${(f.struggles || []).join(', ') || 'rien de signalé'}`);
  out.push('');
  out.push('## Préférences d’entraînement');
  out.push(`- Temps disponible : ${prefs.minutes || '?'} min par jour, ${prefs.days || '?'} jours par semaine, plutôt ${prefs.moment || 'à des moments variables'}`);
  out.push(`- Appareil principal : ${prefs.device || 'non précisé'}`);
  out.push(`- Ce qui me motive : ${(prefs.motivators || []).join(', ') || 'non précisé'}`);
  out.push(`- Thèmes qui m’intéressent : ${(prefs.topics || []).join(', ') || 'non précisé'}`);
  out.push(`- Parler à voix haute pour m’entraîner : ${prefs.speakAloud || 'non précisé'}`);
  if (prefs.note) out.push(`- Remarque : ${prefs.note}`);
  out.push('');

  out.push('## Pré-diagnostic et plan proposés par l’application');
  out.push('### Priorités (de la plus urgente à la moins urgente)');
  if (!a.priorities.length) out.push('Aucune faiblesse marquée détectée automatiquement.');
  a.priorities.slice(0, 8).forEach((x, i) => out.push(`${i + 1}. [${SKILL_LABELS[x.skill]}] ${x.title} — ${/[.!?)]$/.test(x.why) ? x.why : x.why + '.'} À travailler : ${x.focus}`));
  out.push('');
  out.push('### Rythme proposé');
  out.push(`${a.plan.weekly} min par semaine (${a.plan.perDay} min × ${a.plan.days} jours) : ${Object.entries(a.plan.minutes).map(([k, v]) => `${SKILL_LABELS[k]} ${v} min`).join(', ')}.`);
  out.push(a.plan.phases.map(ph => `- ${ph.name} (${ph.span}) : ${ph.content}`).join('\n'));
  out.push('');
  out.push('## Données brutes (JSON)');
  out.push('```json');
  out.push(JSON.stringify(buildJSON(state, a)));
  out.push('```');
  return out.join('\n');
}

export function buildJSON(state, a) {
  const rec = s => s ? { raw: s.raw, band: s.band, items: s.items.map(i => [i.q, i.type, i.given, i.correct, i.status]) } : null;
  return {
    app: 'ielts-examen-blanc', v: 1,
    profile: a.profile, final: a.final,
    listening: rec(a.listening), reading: a.reading ? { ...rec(a.reading), time: a.reading.time } : null,
    writing: a.writing ? { t1: strip(a.writing.t1), t2: strip(a.writing.t2), time: a.writing.time, snapshots: a.writing.snapshots } : null,
    speaking: a.speaking ? { byPart: a.speaking.byPart, items: a.speaking.items.map(i => ({ id: i.id, d: i.duration, lat: i.latency, sp: i.speech, p1: i.pauses1, p2: i.pauses2, w: i.words, wpm: i.wpm, capped: i.capped })) } : null,
    priorities: a.priorities.map(x => ({ skill: x.skill, title: x.title, weight: x.weight })),
    plan: a.plan
  };
}

function strip(s) { const { repeated, linkers, ...rest } = s; return { ...rest, repeated: repeated.map(r => r[0]) }; }
function fence(t) { return '```text\n' + (t && t.trim() ? t.trim() : '(texte vide)') + '\n```'; }
function secs(s) { return s == null ? '—' : `${Math.floor(s / 60)} min ${Math.round(s % 60)} s`; }
function metaNote(m) {
  const x = [];
  if (m.interruptions) x.push(`${m.interruptions} interruption(s)`);
  if (m.endedEarly) x.push('terminé avant la fin de l’audio');
  return x.join(', ') || 'conditions normales';
}
function statsLine(s, task) {
  const x = [`${s.paragraphs} paragraphes`, `${s.sentences} phrases (moy. ${s.avgSentence} mots, la plus longue ${s.longestSentence})`, `diversité lexicale ${s.lexicalDiversity}`, `mots longs ${Math.round(s.longWordRatio * 100)} %`, `${s.linkerVariety} connecteurs différents (${s.linkersPer100}/100 mots)`, `${s.subordinators} subordonnants`, `${s.passives} passifs`];
  if (s.contractions) x.push(`${s.contractions} contractions`);
  if (task === 1) x.push(`overview ${s.overview ? 'repérée' : 'non repérée'}`, `${s.numbers} données chiffrées`, `${s.trendVariety} mots de tendance différents`);
  if (task === 2) x.push(`position ${s.position ? 'repérée' : 'non repérée'}`, `conclusion ${s.conclusion ? 'repérée' : 'non repérée'}`);
  if (s.repeated.length) x.push(`répétitions : ${s.repeated.map(r => `${r[0]} (${r[1]})`).join(', ')}`);
  return x.join(' ; ') + '.';
}
