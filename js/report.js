// The report screen: band ruler, scores, red-pen priorities, plan, export for Claude, full answer key.
import { analyse, TYPE_LABELS, TAG_LABELS, STATUS_LABELS, SKILL_LABELS } from './analysis.js';
import { buildMarkdown } from './export.js';
import { bandRuler } from './ruler.js';
import { fmtBand, cefr } from './scoring.js';
import { h, toast, dialog, formatDateFR, pct } from './util.js';
import { store, idb } from './store.js';
import { LISTENING } from '../data/listening.js';
import { READING } from '../data/reading.js';

export function reportScreen(app) {
  const st = store.state;
  const a = analyse(st);
  const md = buildMarkdown(st, a);
  const name = a.profile.name;
  const B = a.bands;

  const markers = [
    { key: 'L', label: 'Listening', band: B.L },
    { key: 'R', label: 'Reading', band: B.R },
    { key: 'W', label: 'Writing', band: B.wSelf, tentative: true },
    { key: 'S', label: 'Speaking', band: B.sSelf, tentative: true }
  ];

  const page = h('div', { class: 'report' },
    h('header', { class: 'report-head' },
      h('p', { class: 'kicker' }, `Bilan du ${formatDateFR(a.generatedAt)}`),
      h('h1', { class: 'title' }, name ? `${name}, voici ton bilan` : 'Ton bilan'),
      h('p', { class: 'lede' }, 'Listening et Reading sont corrigés. Writing et Speaking seront notés par Claude, ton examinateur, à partir du bilan que tu vas lui envoyer.')),

    sheet(
      [
        bandRuler({ target: B.target, markers, caption: 'Repères pleins : bandes obtenues. Repères creux : ton auto-évaluation, en attente de correction.' }),
        scoreRow(a)
      ],
      B.overallProvisional != null ? note(`Global provisoire : ${fmtBand(B.overallProvisional)}`) : note('Bande globale : après correction')
    ),

    sendBlock(md, name, true),

    sheet([h('h2', { class: 'section-title' }, 'Ce qu’il faut travailler en priorité'), prioritiesList(a)],
      a.priorities.length ? note('Classé par impact sur ton objectif') : null),

    sheet([h('h2', { class: 'section-title' }, 'Plan d’entraînement proposé'), planBlock(a)],
      note('À affiner avec Claude')),

    detailBlocks(a),

    sendBlock(md, name, false),

    h('footer', { class: 'report-foot' },
      h('button', { class: 'btn ghost', onclick: () => app.go('#/') }, 'Retour à l’accueil'),
      h('button', { class: 'btn ghost', onclick: () => app.go('#/questionnaire') }, 'Modifier mes réponses au questionnaire'),
      h('button', { class: 'btn danger-ghost', onclick: async () => {
        const ok = await dialog({ title: 'Recommencer l’examen ?', body: 'Toutes tes réponses, textes et enregistrements seront effacés de cet appareil. Pense à copier ton bilan avant.', actions: [{ label: 'Annuler', value: false }, { label: 'Tout effacer', value: true, kind: 'danger' }] });
        if (ok) { store.reset(); app.go('#/'); }
      } }, 'Recommencer l’examen à zéro'))
  );
  app.screen(page);
}

function sheet(body, margin) {
  return h('section', { class: 'sheet' }, h('div', { class: 'sheet-margin' }, margin || null), h('div', { class: 'sheet-body' }, body));
}
function note(text) { return h('p', { class: 'margin-note' }, text); }

function scoreRow(a) {
  const cell = (label, big, sub, extra, tentative) => h('div', { class: `score${tentative ? ' tentative' : ''}` },
    h('p', { class: 'score-label' }, label),
    h('p', { class: 'score-band' }, big),
    h('p', { class: 'score-sub' }, sub),
    extra ? h('p', { class: 'score-extra' }, extra) : null);
  const L = a.listening, R = a.reading, W = a.writing, S = a.speaking;
  return h('div', { class: 'scores' },
    cell('Listening', L ? fmtBand(L.band) : '—', L ? `${L.raw}/40` : 'non passé', L ? cefr(L.band) : null),
    cell('Reading', R ? fmtBand(R.band) : '—', R ? `${R.raw}/40` : 'non passé', R ? cefr(R.band) : null),
    cell('Writing', a.bands.wSelf != null ? fmtBand(a.bands.wSelf) : '?', W ? 'à corriger' : 'non passé', a.bands.wSelf != null ? 'ton estimation' : null, true),
    cell('Speaking', a.bands.sSelf != null ? fmtBand(a.bands.sSelf) : '?', S ? 'à évaluer' : 'non passé', a.bands.sSelf != null ? 'ton estimation' : null, true));
}

function sendBlock(md, name, primary) {
  const fileName = `bilan-ielts${name ? '-' + name.toLowerCase().replace(/[^a-z0-9]+/gi, '-') : ''}.md`;
  const copy = async () => {
    try { await navigator.clipboard.writeText(md); toast('Bilan copié. Colle-le dans ta conversation avec Claude.', 'ok'); }
    catch (e) {
      const ta = h('textarea', { class: 'copy-fallback' }); ta.value = md; document.body.append(ta); ta.select();
      try { document.execCommand('copy'); toast('Bilan copié.', 'ok'); } catch (err) { toast('Copie impossible : utilise « Télécharger ».'); }
      ta.remove();
    }
  };
  const download = () => {
    const url = URL.createObjectURL(new Blob([md], { type: 'text/markdown;charset=utf-8' }));
    const link = h('a', { href: url, download: fileName }); document.body.append(link); link.click(); link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  };
  const file = typeof File === 'function' ? new File([md], fileName, { type: 'text/markdown' }) : null;
  const canShareFile = !!(file && navigator.canShare && navigator.canShare({ files: [file] }));
  const share = () => navigator.share({ files: [file], title: 'Bilan IELTS' }).catch(() => {});

  if (!primary) {
    return h('section', { class: 'send send-compact' },
      h('p', {}, 'Prêt·e ? Envoie ce bilan à Claude pour la correction et la suite.'),
      h('div', { class: 'actions tight' }, h('button', { class: 'btn primary', onclick: copy }, 'Copier le bilan'), h('button', { class: 'btn', onclick: download }, 'Télécharger (.md)')));
  }
  const words = md.split(/\s+/).length;
  return h('section', { class: 'send' },
    h('h2', { class: 'section-title' }, 'Envoyer le bilan à Claude'),
    h('ol', { class: 'steps' },
      h('li', {}, 'Copie le bilan (ou télécharge le fichier).'),
      h('li', {}, 'Colle-le dans ta conversation avec Claude.'),
      h('li', {}, 'Claude corrige ton Writing et ton Speaking, affine le plan et construit ton application d’entraînement.')),
    h('div', { class: 'actions' },
      h('button', { class: 'btn primary', onclick: copy }, 'Copier le bilan'),
      h('button', { class: 'btn', onclick: download }, 'Télécharger (.md)'),
      canShareFile ? h('button', { class: 'btn', onclick: share }, 'Partager le fichier') : null),
    h('details', { class: 'preview' }, h('summary', {}, `Voir le contenu envoyé (${words} mots)`), h('pre', {}, md)));
}

function prioritiesList(a) {
  if (!a.priorities.length) return h('p', {}, 'Aucune faiblesse marquée n’a été détectée automatiquement. Claude affinera après correction du Writing et du Speaking.');
  return h('ol', { class: 'priorities' }, a.priorities.slice(0, 6).map(p => h('li', {},
    h('p', { class: 'prio-head' }, h('span', { class: `skill-tag skill-${p.skill}` }, SKILL_LABELS[p.skill]), ' ', h('b', {}, p.title)),
    h('p', { class: 'prio-why' }, p.why),
    h('p', { class: 'prio-focus' }, p.focus))));
}

function planBlock(a) {
  const P = a.plan;
  const max = Math.max(...Object.values(P.minutes));
  return h('div', { class: 'plan' },
    h('p', {}, `Sur la base de ${P.perDay} minutes par jour, ${P.days} jours par semaine${P.weeks ? `, avec ton examen dans ${P.weeks} semaine${P.weeks > 1 ? 's' : ''}` : ''} :`),
    h('div', { class: 'bars' }, Object.entries(P.minutes).map(([k, v]) => h('div', { class: 'bar-row' },
      h('span', { class: 'bar-label' }, SKILL_LABELS[k]),
      h('span', { class: 'bar-track' }, h('span', { class: `bar-fill skill-bg-${k}`, style: { width: `${(v / max) * 100}%` } })),
      h('span', { class: 'bar-value' }, `${v} min / sem.`)))),
    h('ol', { class: 'phases' }, P.phases.map(ph => h('li', {}, h('b', {}, `${ph.name}`), ` (${ph.span}) — ${ph.content}`))));
}

function rows(obj, labels, sort = true) {
  const list = Object.entries(obj);
  if (sort) list.sort((x, y) => (x[1].ok / x[1].n) - (y[1].ok / y[1].n));
  return list.map(([k, v]) => h('div', { class: 'bar-row' },
    h('span', { class: 'bar-label' }, labels[k] || k),
    h('span', { class: 'bar-track' }, h('span', { class: `bar-fill ${v.ok / v.n >= 0.75 ? 'good' : v.ok / v.n >= 0.5 ? 'mid' : 'low'}`, style: { width: `${pct(v.ok, v.n)}%` } })),
    h('span', { class: 'bar-value' }, `${v.ok}/${v.n}`)));
}

function detailBlocks(a) {
  const blocks = [];
  if (a.listening) {
    const L = a.listening;
    blocks.push(sheet([
      h('h2', { class: 'section-title' }, 'Listening en détail'),
      h('div', { class: 'two-col' },
        h('div', {}, h('h3', { class: 'sub' }, 'Par partie'), rows(Object.fromEntries(Object.entries(L.byPart).map(([k, v]) => [`Part ${k}`, v])), {}, false)),
        h('div', {}, h('h3', { class: 'sub' }, 'Par type de question'), rows(L.byType, TYPE_LABELS))),
      h('h3', { class: 'sub' }, 'Par compétence'), rows(L.byTag, TAG_LABELS),
      answerKey(L, 'listening')
    ], errorSummary(L)));
  }
  if (a.reading) {
    const R = a.reading;
    blocks.push(sheet([
      h('h2', { class: 'section-title' }, 'Reading en détail'),
      h('div', { class: 'two-col' },
        h('div', {}, h('h3', { class: 'sub' }, 'Par texte'), rows(Object.fromEntries(Object.entries(R.byPart).map(([k, v]) => [`Texte ${k}`, v])), {}, false),
          h('p', { class: 'small muted' }, `Temps passé : ${R.time[1]}, ${R.time[2]} et ${R.time[3]} min (repère : 17, 20, 23).`)),
        h('div', {}, h('h3', { class: 'sub' }, 'Par type de question'), rows(R.byType, TYPE_LABELS))),
      h('h3', { class: 'sub' }, 'Par compétence'), rows(R.byTag, TAG_LABELS),
      answerKey(R, 'reading')
    ], errorSummary(R)));
  }
  if (a.writing) {
    const W = a.writing;
    const tr = (label, x, y) => h('tr', {}, h('th', { scope: 'row' }, label), h('td', {}, String(x)), h('td', {}, String(y)));
    blocks.push(sheet([
      h('h2', { class: 'section-title' }, 'Writing : indicateurs'),
      h('p', { class: 'small muted' }, 'Mesures automatiques pour guider la correction. La note viendra de Claude, critère par critère.'),
      h('div', { class: 'table-wrap' }, h('table', { class: 'stats' },
        h('thead', {}, h('tr', {}, h('th', {}, ''), h('th', { scope: 'col' }, 'Task 1'), h('th', { scope: 'col' }, 'Task 2'))),
        h('tbody', {},
          tr('Mots', `${W.t1.words} / 150`, `${W.t2.words} / 250`),
          tr('Temps passé', `${W.time[1]} min`, `${W.time[2]} min`),
          tr('Paragraphes', W.t1.paragraphs, W.t2.paragraphs),
          tr('Longueur moyenne des phrases', `${W.t1.avgSentence} mots`, `${W.t2.avgSentence} mots`),
          tr('Diversité lexicale (MATTR)', W.t1.lexicalDiversity, W.t2.lexicalDiversity),
          tr('Connecteurs différents', W.t1.linkerVariety, W.t2.linkerVariety),
          tr('Subordonnées et relatives', W.t1.subordinators, W.t2.subordinators),
          tr('Overview / position', W.t1.overview ? 'repérée' : 'non repérée', W.t2.position ? 'repérée' : 'non repérée'),
          tr('Contractions', W.t1.contractions, W.t2.contractions)))),
      h('details', { class: 'fold' }, h('summary', {}, 'Relire mes textes'),
        h('h3', { class: 'sub' }, 'Task 1'), h('div', { class: 'essay-read' }, W.text1 || '(vide)'),
        h('h3', { class: 'sub' }, 'Task 2'), h('div', { class: 'essay-read' }, W.text2 || '(vide)'))
    ], note(W.t1.words < 150 || W.t2.words < 250 ? 'Longueur insuffisante' : 'Longueurs respectées')));
  }
  if (a.speaking) {
    const S = a.speaking;
    const recBtns = [];
    blocks.push(sheet([
      h('h2', { class: 'section-title' }, 'Speaking : mesures'),
      h('div', { class: 'table-wrap' }, h('table', { class: 'stats' },
        h('thead', {}, h('tr', {}, h('th', {}, ''), h('th', { scope: 'col' }, 'Part 1'), h('th', { scope: 'col' }, 'Part 2'), h('th', { scope: 'col' }, 'Part 3'))),
        h('tbody', {},
          h('tr', {}, h('th', { scope: 'row' }, 'Durée moyenne des réponses'), [1, 2, 3].map(p => h('td', {}, S.byPart[p]?.n ? `${S.byPart[p].avgDuration} s` : '—'))),
          h('tr', {}, h('th', { scope: 'row' }, 'Délai avant de parler'), [1, 2, 3].map(p => h('td', {}, S.byPart[p]?.n ? `${S.byPart[p].avgLatency} s` : '—'))),
          h('tr', {}, h('th', { scope: 'row' }, 'Mots par minute'), [1, 2, 3].map(p => h('td', {}, S.byPart[p]?.wpm || '—'))),
          h('tr', {}, h('th', { scope: 'row' }, 'Pauses > 1 s par minute'), [1, 2, 3].map(p => h('td', {}, S.byPart[p]?.n ? S.byPart[p].pausesPerMin : '—')))))),
      S.longTurn ? h('p', {}, `Monologue de la Part 2 : ${Math.round(S.longTurn.duration)} secondes${S.longTurn.more ? ' (avec relance)' : ''}.`) : null,
      h('details', { class: 'fold' }, h('summary', {}, 'Relire et réécouter mes réponses'),
        S.items.map(i => {
          const play = i.recorded ? h('button', { class: 'btn small', onclick: async e => {
            const blob = await idb.get(`sp-${i.id}`).catch(() => null);
            if (!blob) { toast('Enregistrement introuvable sur cet appareil.'); return; }
            const au = h('audio', { controls: true, src: URL.createObjectURL(blob) });
            e.target.replaceWith(au); au.play();
          } }, '▶ Réécouter') : null;
          recBtns.push(play);
          return h('div', { class: 'sp-item' },
            h('p', { class: 'sp-q' }, h('b', {}, `Part ${i.part}`), ' ', i.question),
            h('p', { class: 'small muted' }, `${i.duration} s, ${i.words} mots, ${i.wpm} mots/min, ${i.pauses1} pause(s) > 1 s`),
            h('p', { class: 'sp-t' }, i.transcript || '(pas de transcription)'),
            play);
        }))
    ], note(S.transcribedShare < 0.5 ? 'Transcription partielle' : `${S.words} mots transcrits`)));
  }
  return blocks;
}

function errorSummary(s) {
  const st = s.status;
  const parts = ['spelling', 'form', 'limit', 'trap', 'blank'].filter(k => st[k]).map(k => note(`${STATUS_LABELS[k]} : ${st[k]}`));
  return parts.length ? parts : note('Aucune erreur de forme');
}

function answerKey(s, kind) {
  const data = kind === 'listening' ? LISTENING : READING;
  return h('details', { class: 'fold' }, h('summary', {}, `Corrigé complet (${s.raw}/40)`),
    h('ol', { class: 'key-list' }, s.items.map(i => h('li', { class: `key-item ${i.ok ? 'ok' : 'ko'}`, value: i.q },
      h('p', { class: 'key-line' },
        h('span', { class: 'key-mark', 'aria-label': i.ok ? 'juste' : 'faux' }, i.ok ? '✓' : '✗'),
        ' ', h('b', {}, `Q${i.q}`), ' ',
        h('span', { class: 'key-given' }, i.given ? `« ${i.given} »` : 'sans réponse'),
        i.ok ? null : h('span', { class: 'key-correct' }, ` → ${i.correct}`),
        i.ok ? null : h('span', { class: 'key-status' }, ` ${STATUS_LABELS[i.status]}`)),
      !i.ok && data.key[i.q].ev ? h('p', { class: 'key-ev' }, data.key[i.q].ev) : null))));
}
