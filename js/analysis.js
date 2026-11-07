// Turns the raw exam state into a diagnostic: scores, error patterns, indicators,
// priorities and a first training plan. Pure functions, no DOM.
import { LISTENING } from '../data/listening.js';
import { READING } from '../data/reading.js';
import { SPEAKING_STEPS } from '../data/speaking.js';
import { markSection, toBand, LISTENING_BANDS, READING_BANDS, overallBand, cefr, fmtBand } from './scoring.js';
import { writingStats, tokens, mattr, repeated } from './textstats.js';

export const TYPE_LABELS = {
  form: 'Complétion de notes (audio)', mcq: 'QCM une réponse', mcq2: 'QCM deux réponses', matching: 'Appariement',
  map: 'Plan à légender', tfng: 'True / False / Not Given', ynng: 'Yes / No / Not Given', notes: 'Complétion de notes',
  headings: 'Titres de paragraphes', features: 'Appariement de chercheurs', summary: 'Résumé à compléter', endings: 'Fins de phrases'
};
export const TAG_LABELS = {
  spelling: 'Mots épelés ou difficiles', number: 'Nombres, dates, prix', distractor: 'Résister aux pièges', detail: 'Détails précis',
  paraphrase: 'Reconnaître les paraphrases', orientation: 'Se repérer sur un plan', opinion: 'Opinions et décisions à plusieurs voix',
  academic: 'Cours magistral', scanning: 'Repérage rapide (scanning)', gist: 'Idée principale (skimming)', inference: 'Inférence',
  'writer-view': 'Point de vue de l’auteur', grammar: 'Indices grammaticaux'
};
export const STATUS_LABELS = {
  ok: 'Correct', blank: 'Sans réponse', spelling: 'Orthographe', form: 'Mauvaise forme (pluriel, mot en trop…)',
  limit: 'Limite de mots dépassée', trap: 'Piège (distracteur)', wrong: 'Incorrect'
};
export const SKILL_LABELS = { L: 'Listening', R: 'Reading', W: 'Writing', S: 'Speaking' };
const READING_PACE = { 1: 17, 2: 20, 3: 23 };

const inc = (o, k, ok) => { o[k] = o[k] || { ok: 0, n: 0 }; o[k].n++; if (ok) o[k].ok++; };
const rate = x => (x && x.n ? x.ok / x.n : null);
const mins = s => Math.round((s || 0) / 60);

function summarise(m) {
  const byPart = {}, byType = {}, byTag = {}, status = {}, confusion = {};
  for (const it of m.items) {
    inc(byPart, it.part, it.ok);
    inc(byType, it.type, it.ok);
    for (const t of it.tags || []) inc(byTag, t, it.ok);
    status[it.status] = (status[it.status] || 0) + 1;
    if ((it.type === 'tfng' || it.type === 'ynng') && it.given) {
      confusion[it.correct] = confusion[it.correct] || {};
      confusion[it.correct][it.given] = (confusion[it.correct][it.given] || 0) + 1;
    }
  }
  return { raw: m.raw, items: m.items, byPart, byType, byTag, status, confusion, errors: m.items.filter(i => !i.ok) };
}

export function analyse(state) {
  const out = { profile: state.profile || {}, final: state.final || {}, generatedAt: Date.now() };
  const target = Number(out.profile.target) || null;

  const L = state.listening;
  if (L.status === 'done') {
    out.listening = summarise(markSection(LISTENING, L.answers));
    out.listening.band = toBand(out.listening.raw, LISTENING_BANDS);
    out.listening.meta = { interruptions: L.interruptions || 0, endedEarly: !!L.endedEarly, flagged: (L.flags || []).length, minutes: L.finishedAt && L.startedAt ? mins((L.finishedAt - L.startedAt) / 1000) : null };
  }

  const R = state.reading;
  if (R.status === 'done') {
    out.reading = summarise(markSection(READING, R.answers));
    out.reading.band = toBand(out.reading.raw, READING_BANDS);
    out.reading.time = { 1: mins(R.partTime?.[1]), 2: mins(R.partTime?.[2]), 3: mins(R.partTime?.[3]), used: mins(R.timeUsed), auto: !!R.autoSubmitted };
    out.reading.meta = { interruptions: R.interruptions || 0, flagged: (R.flags || []).length };
    out.reading.blanksByPart = [1, 2, 3].map(p => out.reading.items.filter(i => i.part === p && i.status === 'blank').length);
  }

  const W = state.writing;
  if (W.status === 'done') {
    out.writing = {
      t1: writingStats(W.task1, 1), t2: writingStats(W.task2, 2),
      text1: W.task1 || '', text2: W.task2 || '',
      time: { 1: mins(W.taskTime?.[1]), 2: mins(W.taskTime?.[2]), used: mins(W.timeUsed), auto: !!W.autoSubmitted },
      firstKey: W.firstKey || {},
      pastes: (W.pastes || []).filter(p => p.chars > 40),
      snapshots: W.snapshots || [],
      meta: { interruptions: W.interruptions || 0 }
    };
  }

  const S = state.speaking;
  if (S.status === 'done' || Object.keys(S.items || {}).length) {
    const items = SPEAKING_STEPS.filter(st => st.kind === 'ask' && S.items[st.id]).map(st => ({ id: st.id, ...S.items[st.id] }));
    const byPart = {};
    for (const p of [1, 2, 3]) {
      const its = items.filter(i => i.part === p && !['p1-name', 'p1-call'].includes(i.id));
      const dur = its.reduce((a, i) => a + i.duration, 0);
      const speak = its.reduce((a, i) => a + Math.max(0, i.duration - i.latency), 0);
      const wordsN = its.reduce((a, i) => a + (i.words || 0), 0);
      byPart[p] = {
        n: its.length,
        avgDuration: its.length ? Math.round(dur / its.length) : 0,
        avgLatency: its.length ? round1(its.reduce((a, i) => a + i.latency, 0) / its.length) : 0,
        wpm: speak > 5 ? Math.round(wordsN / speak * 60) : 0,
        pausesPerMin: speak > 5 ? round1(its.reduce((a, i) => a + i.pauses1, 0) / (speak / 60)) : 0,
        capped: its.filter(i => i.capped).length
      };
    }
    const all = items.map(i => i.transcript || '').join(' ');
    const tok = tokens(all);
    const transcribed = items.filter(i => (i.transcript || '').trim()).length;
    const long = items.find(i => i.id === 'p2-long');
    out.speaking = {
      done: S.status === 'done', items, byPart,
      longTurn: long ? { duration: long.duration, words: long.words, wpm: long.wpm, more: long.more } : null,
      words: tok.length, lexicalDiversity: round2(mattr(tok)), repeated: repeated(tok, 5),
      fillers: items.reduce((a, i) => a + (i.fillers || 0), 0),
      transcribedShare: items.length ? transcribed / items.length : 0,
      prepUsed: S.prepUsed ?? null, notes: S.notes || '', env: S.env || {},
      shownQuestions: items.filter(i => i.shown).length,
      meta: { interruptions: S.interruptions || 0 }
    };
  }

  const fin = out.final;
  const wSelf = numOrNull(fin.selfWriting), sSelf = numOrNull(fin.selfSpeaking);
  out.bands = {
    L: out.listening ? out.listening.band : null,
    R: out.reading ? out.reading.band : null,
    W: null, S: null, wSelf, sSelf,
    target
  };
  out.bands.overallProvisional = overallBand([out.bands.L, out.bands.R, wSelf, sSelf]);
  out.priorities = priorities(out);
  out.plan = plan(out);
  return out;
}

function numOrNull(v) { const n = Number(v); return v === '' || v == null || Number.isNaN(n) ? null : n; }

function gapFor(out, skill) {
  const t = out.bands.target;
  if (!t) return 1;
  const b = skill === 'L' ? out.bands.L : skill === 'R' ? out.bands.R : skill === 'W' ? out.bands.wSelf : out.bands.sSelf;
  if (b == null) return skill === 'W' || skill === 'S' ? 1 : 0;
  return Math.max(0, t - b);
}

// Each finding: { skill, title, why, weight(1–3), focus } — focus = what the training app should drill.
function priorities(out) {
  const f = [];
  const add = (skill, weight, title, why, focus) => f.push({ skill, weight, title, why, focus });
  const Ls = out.listening, Rs = out.reading, Ws = out.writing, Ss = out.speaking;

  if (Ls) {
    const st = Ls.status;
    const spell = Ls.items.filter(i => i.status === 'spelling' || i.status === 'form');
    if (spell.length >= 1) add('L', spell.length >= 2 ? 3 : 2, 'Orthographe et forme exacte des réponses', spell.map(i => `Q${i.q} « ${i.given} » → ${i.correct}`).join(' ; '), 'Dictées de mots épelés, noms propres, pluriels ; relecture orthographique pendant les 2 minutes de vérification.');
    const num = rate(Ls.byTag.number);
    if (num !== null && num < 0.8) add('L', num < 0.5 ? 3 : 2, 'Nombres, dates, prix et numéros', `${Ls.byTag.number.ok}/${Ls.byTag.number.n} justes sur les questions chiffrées.`, 'Dictées de nombres (double, oh, dates britanniques, prix), avec corrections de dernière minute.');
    const traps = Ls.items.filter(i => i.status === 'trap' || ((i.type === 'mcq' || i.type === 'matching' || i.type === 'mcq2') && i.status === 'wrong'));
    if (traps.length >= 2) add('L', traps.length >= 4 ? 3 : 2, 'Pièges : informations corrigées ou rejetées', `${traps.length} réponses sont tombées sur une information mentionnée puis corrigée (${traps.slice(0, 4).map(i => 'Q' + i.q).join(', ')}).`, 'Écoutes ciblées sur les marqueurs de correction (actually, in fact, no wait, instead, I thought… but) et sur les options évoquées puis écartées.');
    const map = rate(Ls.byType.map);
    if (map !== null && map < 0.67) add('L', 2, 'Plans et orientation', `${Ls.byType.map.ok}/${Ls.byType.map.n} sur le plan.`, 'Exercices de légendes de plans : vocabulaire spatial (opposite, just past, to the north-west of) et suivi d’un trajet.');
    if (Ls.byPart[3] && Ls.byPart[3].ok <= 6) add('L', 2, 'Discussions à plusieurs voix (Part 3)', `${Ls.byPart[3].ok}/10 en Part 3.`, 'Identifier qui pense quoi, accords et désaccords, décisions finales.');
    if (Ls.byPart[4] && Ls.byPart[4].ok <= 6) add('L', 2, 'Cours magistral (Part 4)', `${Ls.byPart[4].ok}/10 en Part 4.`, 'Prise de notes sur des cours de 6 à 8 minutes, anticipation de la nature du mot manquant.');
    if ((st.blank || 0) >= 3) add('L', 2, 'Ne pas décrocher de l’enregistrement', `${st.blank} questions laissées vides.`, 'Lecture anticipée des questions et repères de navigation ; ne jamais laisser de blanc.');
    const p1 = Ls.byPart[1]?.ok ?? 0, p4 = Ls.byPart[4]?.ok ?? 0;
    if (p1 - p4 >= 4) add('L', 1, 'Endurance sur 30 minutes', `De ${p1}/10 en Part 1 à ${p4}/10 en Part 4.`, 'Enchaîner des parties complètes pour tenir la concentration jusqu’au bout.');
  }

  if (Rs) {
    const tf = combine(Rs.byType.tfng, Rs.byType.ynng);
    if (tf && tf.ok / tf.n < 0.75) {
      const c = Rs.confusion;
      const ngMiss = (c['NOT GIVEN']?.FALSE || 0) + (c['NOT GIVEN']?.TRUE || 0) + (c['NOT GIVEN']?.NO || 0) + (c['NOT GIVEN']?.YES || 0);
      const toNg = (c.FALSE?.['NOT GIVEN'] || 0) + (c.TRUE?.['NOT GIVEN'] || 0) + (c.NO?.['NOT GIVEN'] || 0) + (c.YES?.['NOT GIVEN'] || 0);
      const pattern = ngMiss > toNg ? `Tu as souvent conclu à vrai ou faux alors que le texte ne disait rien (${ngMiss} fois).` : toNg > 0 ? `Tu as souvent répondu « Not Given » alors que le texte tranchait (${toNg} fois).` : 'Erreurs entre vrai et faux.';
      add('R', tf.ok / tf.n < 0.5 ? 3 : 2, 'Logique True / False / Not Given', `${tf.ok}/${tf.n} justes. ${pattern}`, 'Drills courts sur la distinction contredit / non mentionné, avec justification de chaque réponse par une phrase du texte.');
    }
    const hd = rate(Rs.byType.headings);
    if (hd !== null && hd < 0.67) add('R', 2, 'Idée principale des paragraphes', `${Rs.byType.headings.ok}/${Rs.byType.headings.n} titres justes.`, 'Lire la première et la dernière phrase, distinguer idée principale et exemple (piège des titres qui reprennent un détail).');
    const ft = rate(Rs.byType.features);
    if (ft !== null && ft < 0.75) add('R', 1, 'Associer des idées à des noms', `${Rs.byType.features.ok}/${Rs.byType.features.n} justes.`, 'Scanning des noms propres puis lecture fine de la phrase qui entoure le nom.');
    const comp = combine(Rs.byType.notes, Rs.byType.summary);
    if (comp && comp.ok / comp.n < 0.75) add('R', 2, 'Complétion : mots exacts tirés du texte', `${comp.ok}/${comp.n} justes${(Rs.status.spelling || 0) + (Rs.status.form || 0) ? `, dont ${(Rs.status.spelling || 0) + (Rs.status.form || 0)} erreur(s) d’orthographe ou de forme` : ''}.`, 'Repérage par synonymes, respect strict de la limite de mots et de la forme (pluriel, nom/verbe).');
    const mq = combine(Rs.byType.mcq, Rs.byType.endings);
    if (mq && mq.ok / mq.n < 0.75) add('R', 2, 'Questions d’inférence et fins de phrases', `${mq.ok}/${mq.n} justes.`, 'Éliminer les options vraies mais hors sujet ; utiliser la grammaire pour les fins de phrases.');
    const t = Rs.time;
    if (t[1] > READING_PACE[1] + 5 || (Rs.blanksByPart[2] >= 3) || t.auto && Rs.blanksByPart.reduce((a, b) => a + b, 0) >= 3)
      add('R', 2, 'Gestion du temps', `Temps passé : ${t[1]} / ${t[2]} / ${t[3]} min (repère : 17 / 20 / 23). ${Rs.blanksByPart.reduce((a, b) => a + b, 0)} réponse(s) vide(s).`, 'Chronos par texte, abandon des questions bloquantes, ne jamais laisser de blanc.');
    else if ((Rs.status.blank || 0) >= 2) add('R', 1, 'Ne laisser aucune réponse vide', `${Rs.status.blank} réponse(s) vide(s) ; aucune pénalité pour une mauvaise réponse.`, 'Réflexe de fin de section : remplir toutes les cases.');
  }

  if (Ws) {
    const { t1, t2, time } = Ws;
    if (t1.words < 150 || t2.words < 250) add('W', 3, 'Atteindre la longueur minimale', `Task 1 : ${t1.words} mots (min. 150) ; Task 2 : ${t2.words} mots (min. 250). Un texte trop court est pénalisé en Task Achievement / Task Response.`, 'Plans express et rédaction chronométrée.');
    if (!t1.overview) add('W', 2, 'Vue d’ensemble en Task 1', 'Aucune phrase d’overview repérée (Overall, it is clear that…). Sans overview, la Task Achievement est plafonnée à 5.', 'Écrire l’overview en premier : 2 grandes tendances, sans chiffres.');
    if (t1.numbers < 6) add('W', 1, 'Données chiffrées en Task 1', `${t1.numbers} données chiffrées citées.`, 'Sélectionner et comparer les chiffres clés (début, fin, pics, croisements).');
    if (t1.trendVariety < 5) add('W', 1, 'Vocabulaire des évolutions', `${t1.trendVariety} verbes/adverbes de tendance différents.`, 'Banque de verbes et adverbes de tendance, structures de comparaison.');
    if (!t2.position) add('W', 2, 'Position claire en Task 2', 'Opinion personnelle non repérée alors que la consigne la demande.', 'Annoncer sa position dès l’introduction et la tenir jusqu’à la conclusion.');
    if (t2.paragraphs < 4 || t1.paragraphs < 3) add('W', 2, 'Structure en paragraphes', `Task 1 : ${t1.paragraphs} paragraphe(s) ; Task 2 : ${t2.paragraphs}.`, 'Gabarits de paragraphes (intro, 2 développements, conclusion).');
    if (t2.linkerVariety < 5) add('W', 1, 'Variété des connecteurs', `${t2.linkerVariety} connecteurs différents en Task 2.`, 'Connecteurs variés et bien placés, sans excès.');
    if (t2.linkersPer100 > 6) add('W', 1, 'Connecteurs trop fréquents', `${t2.linkersPer100} connecteurs pour 100 mots : risque d’effet mécanique.`, 'Cohésion par la référence (this, such, these) plutôt que par l’accumulation de connecteurs.');
    if (t2.lexicalDiversity && t2.lexicalDiversity < 0.7) add('W', 2, 'Richesse lexicale', `Diversité lexicale ${t2.lexicalDiversity} (MATTR) ; mots répétés : ${t2.repeated.map(r => r[0]).slice(0, 4).join(', ') || '—'}.`, 'Paraphrase et collocations par thème.');
    if (t1.contractions + t2.contractions > 2) add('W', 1, 'Registre académique', `${t1.contractions + t2.contractions} contractions (don’t, it’s…).`, 'Éviter contractions et tournures orales.');
    if (time[1] > 25) add('W', 2, 'Répartition du temps 20 / 40', `Task 1 : ${time[1]} min, Task 2 : ${time[2]} min.`, 'Commencer par la Task 2 ou limiter la Task 1 à 20 minutes.');
  }

  if (Ss) {
    const p1 = Ss.byPart[1], p2 = Ss.longTurn, p3 = Ss.byPart[3];
    if (Ss.transcribedShare < 0.5) add('S', 1, 'Transcription incomplète', 'Moins de la moitié des réponses ont été transcrites : l’analyse du Speaking est partielle.', 'Refaire le Speaking sur Chrome ou Safari, ou en mode vocal avec Claude.');
    if (p1 && p1.n && p1.avgDuration < 12) add('S', 2, 'Développer les réponses en Part 1', `Réponses de ${p1.avgDuration} s en moyenne (repère : 15 à 25 s).`, 'Réponse + raison + exemple, en 2 ou 3 phrases.');
    if (p2 && p2.duration < 90) add('S', 3, 'Tenir 2 minutes en Part 2', `Monologue de ${Math.round(p2.duration)} s${p2.more ? ', relancé par l’examinatrice' : ''} (repère : 1 min 45 à 2 min).`, 'Exploiter la minute de préparation : un mot-clé par point de la carte, puis anecdote et ressenti.');
    const wpm = p2?.wpm || p3?.wpm || 0;
    if (wpm && wpm < 105) add('S', 2, 'Débit et fluidité', `Environ ${wpm} mots par minute de parole (repère C1 : 120 à 160).`, 'Shadowing, réponses chronométrées, phrases toutes faites pour gagner du temps de réflexion.');
    const ppm = Math.max(p1?.pausesPerMin || 0, p3?.pausesPerMin || 0);
    if (ppm >= 3) add('S', 2, 'Pauses et hésitations', `${ppm} pauses de plus d’une seconde par minute.`, 'Stratégies de relance (Well, let me think…, What I mean is…) et automatisation des structures courantes.');
    const lat = Math.max(p1?.avgLatency || 0, p3?.avgLatency || 0);
    if (lat > 2.5) add('S', 1, 'Démarrer sa réponse', `${lat} s avant de commencer à parler en moyenne.`, 'Amorces pour démarrer immédiatement (That’s an interesting question…).');
    if (p3 && p3.n && p3.avgDuration < 30) add('S', 2, 'Argumenter en Part 3', `Réponses de ${p3.avgDuration} s en moyenne (repère : 40 à 60 s).`, 'Structure opinion → raison → exemple → nuance, vocabulaire de l’abstraction et de la généralisation.');
    if (Ss.words > 150 && Ss.lexicalDiversity < 0.65) add('S', 1, 'Lexique à l’oral', `Diversité lexicale ${Ss.lexicalDiversity}.`, 'Collocations et expressions idiomatiques par thème courant.');
  }

  for (const x of f) x.score = x.weight * (1 + gapFor(out, x.skill));
  return f.sort((a, b) => b.score - a.score);
}

function combine(...xs) {
  const v = xs.filter(Boolean);
  if (!v.length) return null;
  return { ok: v.reduce((a, x) => a + x.ok, 0), n: v.reduce((a, x) => a + x.n, 0) };
}

function plan(out) {
  const prefs = out.final.prefs || {};
  const perDay = Number(prefs.minutes) || 30;
  const days = Number(prefs.days) || 5;
  const weekly = perDay * days;
  const weights = { L: 1, R: 1, W: 1, S: 1 };
  for (const k of Object.keys(weights)) weights[k] += gapFor(out, k) * 2;
  for (const p of out.priorities) weights[p.skill] += p.weight * 0.4;
  const total = Object.values(weights).reduce((a, b) => a + b, 0);
  const minutes = {};
  for (const [k, w] of Object.entries(weights)) minutes[k] = Math.max(15, Math.round((weekly * w / total) / 5) * 5);

  let weeks = null;
  if (out.profile.examDate) {
    const d = (new Date(out.profile.examDate) - Date.now()) / 86400000;
    if (d > 0) weeks = Math.ceil(d / 7);
  }
  const phases = [];
  if (weeks == null || weeks >= 6) {
    phases.push({ name: 'Fondations', span: 'semaines 1 à 3', content: 'Travail ciblé sur les 3 premières priorités, exercices courts et fréquents.' });
    phases.push({ name: 'Consolidation', span: 'semaines 4 à 6', content: 'Parties complètes chronométrées, correction de Writing chaque semaine.' });
    phases.push({ name: 'Conditions réelles', span: 'ensuite', content: 'Un examen blanc complet toutes les deux semaines, révision des erreurs récurrentes.' });
  } else if (weeks >= 3) {
    phases.push({ name: 'Ciblage', span: `semaines 1 à ${weeks - 1}`, content: 'Uniquement les priorités à fort impact, une partie chronométrée par jour.' });
    phases.push({ name: 'Répétition générale', span: 'dernière semaine', content: 'Un examen blanc complet en début de semaine, puis révisions légères.' });
  } else {
    phases.push({ name: 'Sprint', span: `${weeks} semaine${weeks > 1 ? 's' : ''}`, content: 'Stratégies d’examen et réflexes (gestion du temps, overview, Part 2), pas de nouvelle notion.' });
  }
  return { perDay, days, weekly, minutes, weeks, phases };
}

const round1 = x => Math.round(x * 10) / 10;
const round2 = x => Math.round(x * 100) / 100;

export { fmtBand, cefr };
