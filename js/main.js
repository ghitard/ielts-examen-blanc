// Entry point: routing, home screen, candidate profile, transitions between tests, final questionnaire.
import { h, dialog, formatDateFR } from './util.js';
import { store } from './store.js';
import { bandRuler } from './ruler.js';
import { listeningScreen } from './listening.js';
import { readingScreen } from './reading.js';
import { writingScreen } from './writing.js';
import { speakingScreen } from './speaking.js';
import { reportScreen } from './report.js';

const root = document.getElementById('app');

const SECTIONS = [
  { id: 'listening', name: 'Listening', time: '≈ 32 min', detail: '4 parties, 40 questions, une seule écoute', route: '#/listening' },
  { id: 'reading', name: 'Reading', time: '60 min', detail: '3 textes académiques, 40 questions', route: '#/reading' },
  { id: 'writing', name: 'Writing', time: '60 min', detail: 'un graphique à décrire, un essai', route: '#/writing' },
  { id: 'speaking', name: 'Speaking', time: '11–14 min', detail: 'entretien en 3 parties avec l’examinatrice', route: '#/speaking' }
];

const app = {
  dev: new URLSearchParams(location.search).has('dev'),
  leave: [],
  onLeave(fn) { this.leave.push(fn); },
  runLeave() { const fns = this.leave; this.leave = []; fns.forEach(fn => { try { fn(); } catch (e) { console.warn(e); } }); },
  screen(el, full = false) {
    document.body.classList.toggle('in-exam', full);
    root.innerHTML = '';
    root.append(full ? el : h('div', { class: 'desk' }, el));
    window.scrollTo(0, 0);
    const heading = root.querySelector('h1');
    if (heading && !full) { heading.setAttribute('tabindex', '-1'); heading.focus({ preventScroll: true }); }
  },
  mountExam(shell) {
    document.body.classList.add('in-exam');
    shell.mount(root);
  },
  go(hash) { if (location.hash === hash) render(); else location.hash = hash; },
  candidate() { const p = store.state.profile; return p && p.name ? p.name : 'Candidate'; },
  sectionDone(id) { afterSection(id); }
};

function render() {
  app.runLeave();
  const route = location.hash || '#/';
  const st = store.state;
  if (!st.profile && route !== '#/') return app.go('#/');
  switch (route) {
    case '#/listening': return listeningScreen(app);
    case '#/reading': return readingScreen(app);
    case '#/writing': return writingScreen(app);
    case '#/speaking': return speakingScreen(app);
    case '#/questionnaire': return questionnaire();
    case '#/bilan': return reportScreen(app);
    case '#/profil': return profileForm(true);
    default: return home();
  }
}

window.addEventListener('hashchange', render);
window.addEventListener('beforeunload', e => {
  const st = store.state;
  if (document.body.classList.contains('in-exam') && ['listening', 'reading', 'writing', 'speaking'].some(k => st[k].status === 'active' || st[k].status === 'review')) {
    e.preventDefault(); e.returnValue = '';
  }
});

function statusOf(id) { return store.state[id].status; }
const allDone = () => SECTIONS.every(s => statusOf(s.id) === 'done');
const anyDone = () => SECTIONS.some(s => statusOf(s.id) === 'done');

function home() {
  const st = store.state;
  if (!st.profile) return profileForm(false);
  const p = st.profile;
  const next = SECTIONS.find(s => statusOf(s.id) !== 'done');

  const row = (s, i) => {
    const status = statusOf(s.id);
    const label = status === 'done' ? 'Terminé' : status === 'todo' ? 'À faire' : 'En cours';
    const action = status === 'done' ? null
      : h('button', { class: `btn ${next && next.id === s.id ? 'primary' : ''}`, onclick: () => app.go(s.route) }, status === 'todo' ? 'Commencer' : 'Reprendre');
    return h('li', { class: `step-row status-${status}` },
      h('span', { class: 'step-num', 'aria-hidden': 'true' }, String(i + 1)),
      h('div', { class: 'step-main' },
        h('p', { class: 'step-name' }, s.name, h('span', { class: 'step-time' }, s.time)),
        h('p', { class: 'step-detail' }, s.detail)),
      h('span', { class: 'step-status' }, label),
      action);
  };

  app.screen(h('div', { class: 'page' },
    h('header', { class: 'home-head' },
      h('h1', { class: 'title display' }, 'Examen blanc IELTS Academic'),
      h('p', { class: 'lede' }, `Les quatre épreuves, dans les conditions du test sur ordinateur. À la fin, un bilan détaillé à envoyer à Claude, ton examinateur, pour construire un entraînement fait pour toi${p.name ? ', ' + p.name : ''}.`)),
    bandRuler({ target: Number(p.target) || null, caption: p.examDate ? `Examen prévu le ${formatDateFR(p.examDate)}.` : 'L’échelle IELTS va de 0 à 9, par demi-bandes. Les lettres indiquent le niveau CECRL correspondant.' }),
    h('section', { class: 'timetable', 'aria-labelledby': 'tt-title' },
      h('h2', { class: 'section-title', id: 'tt-title' }, 'Déroulé de l’examen'),
      h('p', { class: 'small muted' }, 'Comme le jour J, enchaîne Listening, Reading et Writing sans pause (2 h 40). Le Speaking peut se passer le même jour ou dans la semaine.'),
      h('ol', { class: 'steps-list' }, SECTIONS.map(row)),
      h('div', { class: `step-row bilan-row${allDone() ? ' ready' : ''}` },
        h('span', { class: 'step-num', 'aria-hidden': 'true' }, '✓'),
        h('div', { class: 'step-main' },
          h('p', { class: 'step-name' }, 'Bilan et plan d’entraînement'),
          h('p', { class: 'step-detail' }, allDone() ? 'Les quatre épreuves sont terminées.' : 'Disponible quand les quatre épreuves sont terminées.')),
        allDone()
          ? h('button', { class: 'btn primary', onclick: () => app.go(st.final ? '#/bilan' : '#/questionnaire') }, st.final ? 'Voir mon bilan' : 'Obtenir mon bilan')
          : anyDone() ? h('button', { class: 'btn ghost', onclick: async () => {
            const ok = await dialog({ title: 'Bilan partiel ?', body: 'Les épreuves non passées seront marquées comme manquantes. Tu pourras les passer ensuite et regénérer le bilan.', actions: [{ label: 'Annuler', value: false }, { label: 'Voir le bilan partiel', value: true, kind: 'primary' }] });
            if (ok) app.go(st.final ? '#/bilan' : '#/questionnaire');
          } }, 'Bilan partiel') : null)),
    h('section', { class: 'tips' },
      h('h2', { class: 'section-title' }, 'Pour un résultat fidèle'),
      h('ul', { class: 'rules' },
        h('li', {}, 'Un ordinateur, un casque et une pièce calme : c’est le format du test informatisé.'),
        h('li', {}, 'Pas de dictionnaire, de traducteur ni de correcteur orthographique.'),
        h('li', {}, 'Pas de pause pendant une épreuve. Si tu es interrompu·e, tes réponses sont gardées et l’interruption apparaîtra dans le bilan.'))),
    h('footer', { class: 'home-foot' },
      h('p', { class: 'small muted' }, 'Tes réponses, tes textes et tes enregistrements restent dans ce navigateur, sur cet appareil. Seule la transcription du Speaking passe par la reconnaissance vocale de ton navigateur. Ton bilan ne part nulle part tant que tu ne le copies pas.'),
      h('div', { class: 'actions tight' },
        h('button', { class: 'btn ghost small', onclick: () => app.go('#/profil') }, 'Modifier mon profil'),
        h('button', { class: 'btn danger-ghost small', onclick: async () => {
          const ok = await dialog({ title: 'Recommencer à zéro ?', body: 'Toutes tes réponses et ton profil seront effacés de cet appareil.', actions: [{ label: 'Annuler', value: false }, { label: 'Tout effacer', value: true, kind: 'danger' }] });
          if (ok) { store.reset(); render(); }
        } }, 'Recommencer à zéro')))
  ));
}

function select(name, options, value, attrs = {}) {
  return h('select', { name, id: name, ...attrs }, options.map(([v, l]) => h('option', { value: v, selected: String(value ?? '') === String(v) ? true : null }, l)));
}

function profileForm(editing) {
  const p = store.state.profile || { target: '7' };
  const bands = [];
  for (let b = 5; b <= 9; b += 0.5) bands.push([String(b), b.toFixed(1)]);
  const prevScore = h('div', { class: 'field', hidden: p.previous !== 'oui' },
    h('label', { for: 'previousScore' }, 'Ta meilleure bande globale'),
    select('previousScore', [['', '—'], ...[4, 4.5, 5, 5.5, 6, 6.5, 7, 7.5, 8, 8.5, 9].map(b => [String(b), b.toFixed(1)])], p.previousScore));

  const form = h('form', { class: 'form', onsubmit: e => {
    e.preventDefault();
    const d = new FormData(form);
    store.state.profile = {
      name: String(d.get('name') || '').trim(),
      target: d.get('target'),
      examDate: d.get('examDate') || '',
      purpose: d.get('purpose') || '',
      previous: d.get('previous') || 'non',
      previousScore: d.get('previous') === 'oui' ? d.get('previousScore') : ''
    };
    store.save();
    app.go('#/');
  } },
    h('div', { class: 'field' }, h('label', { for: 'name' }, 'Prénom'), h('input', { id: 'name', name: 'name', type: 'text', value: p.name || '', autocomplete: 'given-name', required: true })),
    h('div', { class: 'field-row' },
      h('div', { class: 'field' }, h('label', { for: 'target' }, 'Bande globale visée'), select('target', bands, p.target || '7')),
      h('div', { class: 'field' }, h('label', { for: 'examDate' }, 'Date de l’examen ', h('span', { class: 'muted' }, '(si tu la connais)')), h('input', { id: 'examDate', name: 'examDate', type: 'date', value: p.examDate || '' }))),
    h('div', { class: 'field' }, h('label', { for: 'purpose' }, 'L’IELTS, c’est pour…'),
      select('purpose', [['', 'Choisir'], ['etudes', 'des études'], ['travail', 'le travail'], ['immigration', 'une immigration'], ['autre', 'autre chose']], p.purpose)),
    h('fieldset', { class: 'field' }, h('legend', {}, 'As-tu déjà passé l’IELTS ?'),
      h('div', { class: 'chips' },
        ['non', 'oui'].map(v => h('label', { class: 'chip' }, h('input', { type: 'radio', name: 'previous', value: v, checked: (p.previous || 'non') === v ? true : null, onchange: () => { prevScore.hidden = v !== 'oui'; } }), h('span', {}, v === 'oui' ? 'Oui' : 'Non, c’est le premier')))),
      prevScore),
    h('div', { class: 'actions' },
      h('button', { class: 'btn primary', type: 'submit' }, editing ? 'Enregistrer' : 'Voir le déroulé de l’examen'),
      editing ? h('button', { class: 'btn ghost', type: 'button', onclick: () => app.go('#/') }, 'Annuler') : null));

  app.screen(h('div', { class: 'page narrow' },
    editing ? null : h('h1', { class: 'title display' }, 'Examen blanc IELTS Academic'),
    editing ? h('h1', { class: 'title' }, 'Ton profil') : h('p', { class: 'lede' }, 'Un examen complet, fidèle au test sur ordinateur, pour mesurer précisément ton niveau. Il produit un bilan que tu enverras à Claude pour construire ton entraînement.'),
    editing ? null : h('h2', { class: 'section-title' }, 'Avant de commencer'),
    form));
}

function afterSection(id) {
  const i = SECTIONS.findIndex(s => s.id === id);
  const next = SECTIONS.slice(i + 1).find(s => statusOf(s.id) !== 'done') || SECTIONS.find(s => statusOf(s.id) !== 'done');
  const msgs = {
    listening: 'Dans le vrai test, le Reading commence juste après, sans pause.',
    reading: 'Le Writing suit directement. Respire un coup, puis lance-toi.',
    writing: 'Le Speaking peut se passer maintenant ou un autre jour, comme dans le vrai examen.',
    speaking: ''
  };
  app.screen(h('div', { class: 'page narrow' },
    h('p', { class: 'kicker' }, 'Épreuve terminée'),
    h('h1', { class: 'title' }, `${SECTIONS[i].name} terminé`),
    h('p', { class: 'lede' }, next ? msgs[id] : 'Les quatre épreuves sont terminées. Encore deux minutes de questions, et ton bilan est prêt.'),
    h('div', { class: 'actions' },
      next ? h('button', { class: 'btn primary', onclick: () => app.go(next.route) }, `Passer au ${next.name}`)
        : h('button', { class: 'btn primary', onclick: () => app.go('#/questionnaire') }, 'Répondre aux dernières questions'),
      h('button', { class: 'btn ghost', onclick: () => app.go('#/') }, 'Retour à l’accueil'))));
  history.replaceState(null, '', '#/fin');
}

function chips(name, options, selected, multi = false) {
  const sel = new Set([].concat(selected ?? []).map(String));
  return h('div', { class: 'chips' }, options.map(o => {
    const [v, l] = Array.isArray(o) ? o : [o, o];
    return h('label', { class: 'chip' }, h('input', { type: multi ? 'checkbox' : 'radio', name, value: v, checked: sel.has(String(v)) ? true : null }), h('span', {}, l));
  }));
}

function questionnaire() {
  const st = store.state;
  const f = st.final || {};
  const prefs = f.prefs || {};
  const done = SECTIONS.filter(s => statusOf(s.id) === 'done');
  const bandOpts = [['', 'Je ne sais pas']];
  for (let b = 3; b <= 9; b += 0.5) bandOpts.push([String(b), b.toFixed(1)]);
  const keyOf = { listening: 'L', reading: 'R', writing: 'W', speaking: 'S' };

  const form = h('form', { class: 'form', onsubmit: e => {
    e.preventDefault();
    const d = new FormData(form);
    const difficulty = {};
    for (const s of done) { const v = d.get(`diff-${s.id}`); if (v) difficulty[keyOf[s.id]] = Number(v); }
    st.final = {
      completedAt: Date.now(),
      difficulty,
      selfWriting: d.get('selfWriting') || '',
      selfSpeaking: d.get('selfSpeaking') || '',
      struggles: d.getAll('struggles'),
      prefs: {
        minutes: d.get('minutes'), days: d.get('days'), moment: d.get('moment'), device: d.get('device'),
        motivators: d.getAll('motivators'), topics: d.getAll('topics'), speakAloud: d.get('speakAloud'),
        note: String(d.get('note') || '').trim()
      }
    };
    store.save();
    app.go('#/bilan');
  } },
    h('h2', { class: 'section-title' }, 'Ton ressenti'),
    done.map(s => h('fieldset', { class: 'field' }, h('legend', {}, `${s.name} : difficulté ressentie`),
      chips(`diff-${s.id}`, [['1', 'Très facile'], ['2', 'Facile'], ['3', 'Moyen'], ['4', 'Difficile'], ['5', 'Très difficile']], f.difficulty?.[keyOf[s.id]]))),
    statusOf('writing') === 'done' ? h('div', { class: 'field' }, h('label', { for: 'selfWriting' }, 'Quelle bande donnerais-tu à ton Writing ?'),
      h('p', { class: 'hint' }, '5 : compréhensible mais erreurs fréquentes. 6 : clair, quelques erreurs. 7 : fluide et varié, erreurs rares. 8 : presque sans erreur.'),
      select('selfWriting', bandOpts, f.selfWriting)) : null,
    statusOf('speaking') === 'done' ? h('div', { class: 'field' }, h('label', { for: 'selfSpeaking' }, 'Et à ton Speaking ?'),
      h('p', { class: 'hint' }, '5 : hésitations fréquentes. 6 : à l’aise mais erreurs. 7 : parle longuement, vocabulaire souple. 8 : aisance quasi totale.'),
      select('selfSpeaking', bandOpts, f.selfSpeaking)) : null,
    h('fieldset', { class: 'field' }, h('legend', {}, 'Qu’est-ce qui t’a le plus gêné·e ?'),
      chips('struggles', ['Le vocabulaire', 'La grammaire', 'Trouver des idées', 'Organiser mes idées', 'Le temps', 'Le stress', 'Comprendre les accents', 'L’orthographe', 'La concentration', 'Parler sans hésiter'], f.struggles, true)),

    h('h2', { class: 'section-title' }, 'Ton entraînement idéal'),
    h('fieldset', { class: 'field' }, h('legend', {}, 'Temps disponible par jour'), chips('minutes', [['10', '10 min'], ['20', '20 min'], ['30', '30 min'], ['45', '45 min'], ['60', '1 h'], ['90', '1 h 30']], prefs.minutes || '30')),
    h('fieldset', { class: 'field' }, h('legend', {}, 'Jours par semaine'), chips('days', ['3', '4', '5', '6', '7'], prefs.days || '5')),
    h('fieldset', { class: 'field' }, h('legend', {}, 'Plutôt'), chips('moment', [['le matin', 'Le matin'], ['le midi', 'Le midi'], ['le soir', 'Le soir'], ['à des moments variables', 'Ça dépend']], prefs.moment)),
    h('fieldset', { class: 'field' }, h('legend', {}, 'Sur quel appareil ?'), chips('device', [['téléphone', 'Téléphone'], ['ordinateur', 'Ordinateur'], ['les deux', 'Les deux']], prefs.device)),
    h('fieldset', { class: 'field' }, h('legend', {}, 'Ce qui te motive'),
      chips('motivators', ['Les séries de jours', 'Les points et niveaux', 'Les défis chronométrés', 'Voir ma bande progresser', 'Les rappels', 'Des corrections détaillées', 'La variété des exercices'], prefs.motivators, true)),
    h('fieldset', { class: 'field' }, h('legend', {}, 'Les thèmes qui t’intéressent'),
      chips('topics', ['Business et finance', 'Technologie', 'Sciences', 'Environnement', 'Culture et musique', 'Mode et design', 'Société', 'Voyages', 'Santé', 'Sport'], prefs.topics, true)),
    h('fieldset', { class: 'field' }, h('legend', {}, 'S’entraîner à parler à voix haute, pour toi, c’est…'),
      chips('speakAloud', [['facile', 'Facile'], ['possible à certains moments', 'Possible à certains moments'], ['difficile (gêne ou bruit)', 'Difficile']], prefs.speakAloud)),
    h('div', { class: 'field' }, h('label', { for: 'note' }, 'Autre chose à dire à ton examinateur ? ', h('span', { class: 'muted' }, '(facultatif)')),
      h('textarea', { id: 'note', name: 'note', rows: '3' }, prefs.note || '')),
    h('div', { class: 'actions' }, h('button', { class: 'btn primary', type: 'submit' }, 'Voir mon bilan'), h('button', { class: 'btn ghost', type: 'button', onclick: () => app.go('#/') }, 'Plus tard')));

  app.screen(h('div', { class: 'page narrow' },
    h('p', { class: 'kicker' }, 'Dernière étape'),
    h('h1', { class: 'title' }, 'Deux minutes pour affiner ton bilan'),
    h('p', { class: 'lede' }, 'Tes réponses aident Claude à corriger ton Writing et ton Speaking, puis à rendre ton entraînement efficace et agréable.'),
    form));
}

render();
