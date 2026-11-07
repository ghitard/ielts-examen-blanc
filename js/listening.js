// Listening: sound check, one continuous recording played once, then 2 minutes to review.
import { LISTENING } from '../data/listening.js';
import { LISTENING_TIMINGS } from '../data/listening-timings.js';
import { createShell, focusQuestion } from './shell.js';
import { renderGroups, isAnswered, indexGroups } from './questions.js';
import { h, clock, minutesLabel, fetchBlobURL, dialog, isIOS } from './util.js';
import { store } from './store.js';

const REVIEW_SECONDS = 120;
const groupsByQ = indexGroups(LISTENING.parts);
let audioURL = null;

const HELP = `<p>L’enregistrement est diffusé <b>une seule fois</b>, sans pause possible. Réponds pendant l’écoute.</p>
<p>Les questions de la partie en cours s’affichent automatiquement. Tu peux aussi naviguer avec les numéros en bas de l’écran.</p>
<p><b>Review</b> marque une question à revoir. Après l’enregistrement, tu as 2 minutes pour vérifier tes réponses.</p>`;

export function listeningScreen(app) {
  const s = store.state.listening;
  if (s.status === 'done') return app.go('#/');
  if (s.status === 'active' || s.status === 'review') return resumeScreen(app);
  return soundCheck(app, false);
}

function resumeScreen(app) {
  const s = store.state.listening;
  const at = s.status === 'review' ? 'pendant le temps de vérification' : `à ${clock(s.audioPos || 0)} de l’enregistrement`;
  app.screen(h('div', { class: 'page narrow' },
    h('h1', { class: 'title' }, 'Listening interrompu'),
    h('p', { class: 'lede' }, `Le test s’est arrêté ${at}. Tes réponses sont enregistrées.`),
    h('p', {}, 'Dans le vrai examen, l’enregistrement ne s’arrête jamais. L’interruption sera signalée dans ton bilan.'),
    h('div', { class: 'actions' },
      h('button', { class: 'btn primary', onclick: () => soundCheck(app, true) }, 'Reprendre là où je me suis arrêté·e'),
      h('button', { class: 'btn ghost', onclick: () => app.go('#/') }, 'Retour à l’accueil'))));
}

function soundCheck(app, resuming) {
  const bar = h('span', { class: 'progress-fill', style: { width: '0%' } });
  const status = h('p', { class: 'small muted', 'aria-live': 'polite' }, 'Préparation de l’enregistrement…');
  const start = h('button', { class: 'btn primary', disabled: true, onclick: () => runExam(app, resuming) }, resuming ? 'Reprendre le Listening' : 'Commencer le Listening');
  const sample = new Audio('audio/soundcheck.mp3');
  const vol = Number(localStorage.getItem('ielts-volume') || 1);
  sample.volume = vol;

  const volume = isIOS()
    ? h('p', { class: 'small muted' }, 'Règle le volume avec les boutons de ton téléphone.')
    : h('label', { class: 'field inline' }, h('span', {}, 'Volume'),
      h('input', { type: 'range', min: '0.1', max: '1', step: '0.05', value: String(vol), oninput: e => { sample.volume = Number(e.target.value); localStorage.setItem('ielts-volume', e.target.value); } }));

  app.screen(h('div', { class: 'page narrow' },
    h('p', { class: 'kicker' }, 'Épreuve 1 sur 4'),
    h('h1', { class: 'title' }, 'Listening — vérification du son'),
    h('p', { class: 'lede' }, 'Mets ton casque ou tes écouteurs, puis lance l’échantillon. Tu dois entendre la voix clairement, sans forcer.'),
    h('div', { class: 'card' },
      h('button', { class: 'btn', onclick: () => { sample.currentTime = 0; sample.play(); } }, '▶ Écouter l’échantillon'),
      volume),
    resuming ? null : h('ul', { class: 'rules' },
      h('li', {}, 'Environ 30 minutes d’enregistrement, 4 parties, 40 questions.'),
      h('li', {}, 'Une seule écoute, pas de pause : réponds pendant que tu écoutes.'),
      h('li', {}, 'Avant chaque partie, un temps de lecture des questions est prévu dans l’enregistrement.'),
      h('li', {}, 'L’orthographe compte : une réponse mal orthographiée est fausse.'),
      h('li', {}, 'À la fin, 2 minutes pour vérifier, puis la section se ferme seule.')),
    h('div', { class: 'card' }, h('div', { class: 'progress' }, bar), status),
    h('div', { class: 'actions' }, start, h('button', { class: 'btn ghost', onclick: () => { sample.pause(); app.go('#/'); } }, 'Plus tard'))
  ));

  const ready = () => { status.textContent = 'Enregistrement prêt.'; bar.style.width = '100%'; start.disabled = false; };
  if (audioURL) return ready();
  fetchBlobURL('audio/listening.mp3', p => { bar.style.width = `${Math.round(p * 100)}%`; status.textContent = `Téléchargement de l’enregistrement : ${Math.round(p * 100)} %`; })
    .then(url => { audioURL = url; ready(); })
    .catch(() => { audioURL = 'audio/listening.mp3'; status.textContent = 'Préchargement impossible : l’audio sera lu en streaming. Vérifie ta connexion.'; start.disabled = false; });
}

function runExam(app, resuming) {
  const st = store.state;
  const s = st.listening;
  if (!resuming) { s.status = 'active'; s.startedAt = Date.now(); s.audioPos = 0; }
  else s.interruptions = (s.interruptions || 0) + 1;
  store.save();

  const parts = LISTENING.parts.map(p => ({ id: p.id, label: `Part ${p.id}`, qs: range(p) }));
  let shownPart = partAt(s.audioPos || 0);
  let reviewLeft = s.status === 'review' ? (s.reviewLeft ?? REVIEW_SECONDS) : null;
  let finished = false;
  let reviewTimer = null;
  let expectedPause = false;

  const shell = createShell({
    section: 'Listening',
    candidate: app.candidate(),
    parts,
    help: HELP,
    isAnswered: q => isAnswered(s.answers, q, groupsByQ),
    isFlagged: q => s.flags.includes(q),
    onFlag: (q, on) => { s.flags = on ? [...new Set([...s.flags, q])] : s.flags.filter(x => x !== q); store.save(); },
    onGoto: (part, q) => { showPart(part); if (q != null) focusQuestion(q, shell.main); },
    onSubmit: () => confirmFinish()
  });
  app.mountExam(shell);

  const audio = new Audio(audioURL || 'audio/listening.mp3');
  audio.preload = 'auto';
  audio.volume = Number(localStorage.getItem('ielts-volume') || 1);

  const overlay = h('div', { class: 'exam-overlay', hidden: true },
    h('div', { class: 'dialog' },
      h('h2', {}, 'The recording has stopped'),
      h('p', {}, 'L’enregistrement a été interrompu (appel, verrouillage de l’écran…). Reprends dès que possible.'),
      h('div', { class: 'dialog-actions' }, h('button', { class: 'btn primary', onclick: () => { overlay.hidden = true; s.interruptions = (s.interruptions || 0) + 1; audio.play(); } }, 'Resume'))));
  shell.el.append(overlay);

  function showPart(id) {
    shownPart = id;
    const p = LISTENING.parts.find(x => x.id === id);
    shell.partbar.innerHTML = '';
    shell.partbar.append(h('b', {}, `Part ${p.id}`), ' ', p.intro, app.dev ? devTools() : null);
    shell.main.innerHTML = '';
    shell.main.append(h('div', { class: 'exam-col' }, renderGroups(p.groups, {
      answers: s.answers,
      onChange: (q, v) => { s.answers[q] = v; store.save(); shell.refreshNav(); }
    })));
    shell.main.scrollTop = 0;
    shell.setPart(id);
  }

  function devTools() {
    return h('span', { class: 'dev' },
      h('button', { onclick: () => { audio.currentTime = Math.min(audio.duration - 1, audio.currentTime + 60); } }, '+60 s'),
      h('button', { onclick: () => { audio.currentTime = Math.max(0, audio.duration - 2); } }, 'Fin audio'));
  }

  function tick() {
    if (finished) return;
    if (reviewLeft != null) {
      shell.setTimer(`Review time: ${clock(reviewLeft)}`, reviewLeft <= 30);
      return;
    }
    const d = audio.duration || LISTENING_TIMINGS.duration;
    shell.setTimer(minutesLabel(d - audio.currentTime + REVIEW_SECONDS));
    const p = partAt(audio.currentTime);
    if (p !== shownPart && p > shownPart) showPart(p);
  }

  let lastSave = 0;
  audio.addEventListener('timeupdate', () => {
    tick();
    if (Date.now() - lastSave > 3000) { s.audioPos = audio.currentTime; store.save(); lastSave = Date.now(); }
  });
  audio.addEventListener('ended', startReview);
  audio.addEventListener('pause', () => {
    if (expectedPause || finished || audio.ended || reviewLeft != null) return;
    overlay.hidden = false;
  });
  audio.addEventListener('error', () => {
    dialog({ title: 'Problème audio', body: 'L’enregistrement n’a pas pu être lu. Vérifie ta connexion puis réessaie.', actions: [{ label: 'Réessayer', value: 1, kind: 'primary' }] })
      .then(() => { const pos = s.audioPos || 0; audio.src = 'audio/listening.mp3'; audio.currentTime = pos; audio.play(); });
  });

  const persist = () => { if (!finished && reviewLeft == null) { s.audioPos = audio.currentTime; store.save(); } };
  window.addEventListener('pagehide', persist);
  app.onLeave(() => { expectedPause = true; persist(); audio.pause(); clearInterval(reviewTimer); window.removeEventListener('pagehide', persist); });

  function startReview() {
    if (reviewLeft == null) reviewLeft = REVIEW_SECONDS;
    s.status = 'review'; s.audioPos = LISTENING_TIMINGS.duration; store.save();
    shell.flashTimer();
    tick();
    clearInterval(reviewTimer);
    reviewTimer = setInterval(() => {
      reviewLeft -= 1; s.reviewLeft = reviewLeft;
      if (reviewLeft % 5 === 0) store.save();
      tick();
      if (reviewLeft <= 0) finish(true);
    }, 1000);
  }

  async function confirmFinish() {
    const unanswered = parts.flatMap(p => p.qs).filter(q => !isAnswered(s.answers, q, groupsByQ)).length;
    const playing = reviewLeft == null && !audio.ended;
    const msg = (playing ? '<b>L’enregistrement n’est pas terminé.</b> ' : '') +
      (unanswered ? `Il te reste ${unanswered} question${unanswered > 1 ? 's' : ''} sans réponse. ` : '') +
      'Une fois la section terminée, tu ne pourras plus modifier tes réponses.';
    const ok = await dialog({ title: 'Terminer le Listening ?', body: msg, actions: [{ label: 'Continuer le test', value: false }, { label: 'Terminer la section', value: true, kind: 'primary' }], exam: true });
    if (ok) finish(false);
  }

  function finish(auto) {
    if (finished) return;
    finished = true; expectedPause = true;
    audio.pause(); clearInterval(reviewTimer);
    s.status = 'done'; s.finishedAt = Date.now(); s.endedEarly = !auto && !audio.ended && reviewLeft == null;
    s.audioPos = audio.currentTime || s.audioPos;
    store.save();
    app.sectionDone('listening');
  }

  showPart(shownPart);
  if (s.status === 'review') { startReview(); return; }
  const begin = () => {
    try { audio.currentTime = s.audioPos || 0; } catch (e) { /* metadata not ready */ }
    audio.play().catch(() => { overlay.hidden = false; });
  };
  if (audio.readyState >= 1) begin(); else audio.addEventListener('loadedmetadata', begin, { once: true });
  tick();
}

function range(p) {
  const qs = [];
  for (const g of p.groups) for (let q = g.range[0]; q <= g.range[1]; q++) qs.push(q);
  return qs;
}

function partAt(t) {
  let id = 1;
  for (const p of LISTENING_TIMINGS.parts) if (t >= p.start - 0.5) id = p.id;
  return id;
}
