// Academic Writing: 60 minutes for Task 1 (graph) and Task 2 (essay), no spellchecker, live word count.
import { WRITING } from '../data/writing.js';
import { createShell } from './shell.js';
import { h, clock, minutesLabel, dialog, toast, debounce } from './util.js';
import { store } from './store.js';

const HELP = `<p>60 minutes au total pour les deux tâches. Passe de l’une à l’autre avec « Part 1 » et « Part 2 » en bas de l’écran.</p>
<p>Task 1 : au moins 150 mots (environ 20 minutes). Task 2 : au moins 250 mots (environ 40 minutes). La Task 2 compte deux fois plus que la Task 1.</p>
<p>Comme au vrai test, il n’y a ni correcteur orthographique ni suggestions.</p>`;

export function writingScreen(app) {
  const s = store.state.writing;
  if (s.status === 'done') return app.go('#/');
  if (s.status === 'active') return resume(app);
  return briefing(app);
}

function briefing(app) {
  app.screen(h('div', { class: 'page narrow' },
    h('p', { class: 'kicker' }, 'Épreuve 3 sur 4'),
    h('h1', { class: 'title' }, 'Writing'),
    h('p', { class: 'lede' }, 'Deux tâches en 60 minutes : décrire un graphique, puis rédiger un essai argumenté.'),
    h('ul', { class: 'rules' },
      h('li', {}, 'Task 1 : au moins 150 mots. Compte environ 20 minutes.'),
      h('li', {}, 'Task 2 : au moins 250 mots. Compte environ 40 minutes, elle pèse le double.'),
      h('li', {}, 'Pas de correcteur orthographique : désactive aussi les extensions de type Grammarly.'),
      h('li', {}, 'Le compteur de mots est affiché sous la zone de texte.'),
      h('li', {}, 'Tes textes seront corrigés selon les 4 critères officiels quand tu enverras ton bilan.')),
    h('div', { class: 'actions' },
      h('button', { class: 'btn primary', onclick: () => run(app) }, 'Commencer le Writing'),
      h('button', { class: 'btn ghost', onclick: () => app.go('#/') }, 'Plus tard'))));
}

function resume(app) {
  const s = store.state.writing;
  app.screen(h('div', { class: 'page narrow' },
    h('h1', { class: 'title' }, 'Writing interrompu'),
    h('p', { class: 'lede' }, `Il te restait ${clock(s.timeLeft)}. Tes textes sont enregistrés.`),
    h('div', { class: 'actions' },
      h('button', { class: 'btn primary', onclick: () => { s.interruptions = (s.interruptions || 0) + 1; run(app, true); } }, 'Reprendre'),
      h('button', { class: 'btn ghost', onclick: () => app.go('#/') }, 'Retour à l’accueil'))));
}

const countWords = t => (t.trim() ? t.trim().split(/\s+/).length : 0);

function run(app, resuming = false) {
  const s = store.state.writing;
  if (!resuming) { s.status = 'active'; s.startedAt = Date.now(); s.timeLeft = 3600; s.taskTime = { 1: 0, 2: 0 }; s.snapshots = []; s.pastes = []; s.firstKey = {}; }
  s.firstKey = s.firstKey || {}; s.pastes = s.pastes || []; s.snapshots = s.snapshots || []; s.taskTime = s.taskTime || { 1: 0, 2: 0 };
  store.save();

  let current = 1;
  let finished = false;
  let mobileView = 'prompt';
  const alerts = new Set();

  const shell = createShell({
    section: 'Writing',
    candidate: app.candidate(),
    parts: [
      { id: 1, label: 'Part 1', qs: [], meta: () => `${countWords(s.task1)} words` },
      { id: 2, label: 'Part 2', qs: [], meta: () => `${countWords(s.task2)} words` }
    ],
    showQuestions: false,
    help: HELP,
    isAnswered: () => false,
    onGoto: part => show(part),
    onSubmit: () => confirmFinish()
  });
  app.mountExam(shell);

  const saveSoon = debounce(() => store.save(), 400);

  function show(id) {
    current = id;
    const t = id === 1 ? WRITING.task1 : WRITING.task2;
    shell.partbar.innerHTML = '';
    shell.partbar.append(h('b', {}, `Part ${id}`), ' ', id === 1 ? 'You should spend about 20 minutes on this task. Write at least 150 words.' : 'You should spend about 40 minutes on this task. Write at least 250 words.',
      app.dev ? h('span', { class: 'dev' }, h('button', { onclick: () => { s.timeLeft = 65; } }, '→ 1 min')) : null);

    const prompt = id === 1
      ? h('div', { class: 'prompt' },
        h('div', { class: 'prompt-box' }, h('p', {}, t.prompt), h('p', {}, t.instruction)),
        h('figure', { class: 'chart' }, h('div', { html: lineChart(t.chart) })))
      : h('div', { class: 'prompt' },
        h('p', {}, t.intro),
        h('div', { class: 'prompt-box' }, h('p', {}, t.prompt), h('p', {}, h('b', {}, t.question))),
        h('p', {}, t.instruction));

    const field = id === 1 ? 'task1' : 'task2';
    const counter = h('p', { class: 'word-count', 'aria-live': 'polite' });
    const area = h('textarea', {
      class: 'essay', 'aria-label': `Your answer for Writing Part ${id}`,
      spellcheck: 'false', autocorrect: 'off', autocapitalize: 'off', autocomplete: 'off',
      'data-gramm': 'false', 'data-gramm_editor': 'false', 'data-enable-grammarly': 'false'
    });
    area.value = s[field] || '';
    const updateCount = () => { counter.textContent = `Words: ${countWords(area.value)}`; };
    area.addEventListener('input', () => {
      s[field] = area.value;
      if (!s.firstKey[id] && area.value.trim()) s.firstKey[id] = Math.round(3600 - s.timeLeft);
      updateCount(); saveSoon(); shell.refreshNav();
    });
    area.addEventListener('paste', e => {
      const txt = (e.clipboardData && e.clipboardData.getData('text')) || '';
      s.pastes.push({ task: id, chars: txt.length, at: Math.round(3600 - s.timeLeft) });
    });
    updateCount();

    const left = h('div', { class: 'pane pane-text' }, prompt);
    const right = h('div', { class: 'pane pane-editor' }, area, counter);
    const split = h('div', { class: 'split', dataset: { view: mobileView === 'prompt' ? 'text' : 'questions' } }, left, h('div', { class: 'divider', 'aria-hidden': 'true' }), right);
    const switcher = h('div', { class: 'pane-switch', role: 'tablist' },
      h('button', { role: 'tab', type: 'button', 'aria-selected': String(mobileView === 'prompt'), onclick: () => setMobile('prompt') }, 'Task'),
      h('button', { role: 'tab', type: 'button', 'aria-selected': String(mobileView === 'answer'), onclick: () => setMobile('answer') }, 'Your answer'));
    shell.main.innerHTML = '';
    shell.main.classList.add('main-split');
    shell.main.append(switcher, split);
    shell.setPart(id);
    if (matchMedia('(min-width: 821px)').matches) area.focus();
  }

  function setMobile(v) {
    mobileView = v;
    const split = shell.main.querySelector('.split');
    if (split) split.dataset.view = v === 'prompt' ? 'text' : 'questions';
    shell.main.querySelectorAll('.pane-switch button').forEach((b, i) => b.setAttribute('aria-selected', String((i === 0) === (v === 'prompt'))));
  }

  let last = performance.now();
  let lastSnap = 3600 - s.timeLeft;
  const timer = setInterval(() => {
    if (finished) return;
    const now = performance.now();
    const dt = (now - last) / 1000; last = now;
    s.timeLeft = Math.max(0, s.timeLeft - dt);
    s.taskTime[current] = (s.taskTime[current] || 0) + dt;
    const elapsed = 3600 - s.timeLeft;
    if (elapsed - lastSnap >= 60) { lastSnap = elapsed; s.snapshots.push({ t: Math.round(elapsed), w1: countWords(s.task1), w2: countWords(s.task2), on: current }); }
    shell.setTimer(minutesLabel(s.timeLeft), s.timeLeft <= 300);
    for (const m of [10, 5]) if (s.timeLeft <= m * 60 && !alerts.has(m)) { alerts.add(m); shell.flashTimer(); toast(`${m} minutes remaining`, 'exam'); }
    if (Math.round(s.timeLeft) % 10 === 0) store.save();
    if (s.timeLeft <= 0) { finish(true); dialog({ title: 'Time is up', body: 'Le temps du Writing est écoulé. Tes textes ont été enregistrés.', actions: [{ label: 'OK', value: 1, kind: 'primary' }] }); }
  }, 500);

  const persist = () => store.save();
  window.addEventListener('pagehide', persist);
  app.onLeave(() => { clearInterval(timer); window.removeEventListener('pagehide', persist); store.save(); });

  async function confirmFinish() {
    const w1 = countWords(s.task1), w2 = countWords(s.task2);
    const warn = [w1 < 150 ? `Task 1 : ${w1} mots (minimum 150)` : null, w2 < 250 ? `Task 2 : ${w2} mots (minimum 250)` : null].filter(Boolean);
    const ok = await dialog({
      title: 'Terminer le Writing ?',
      body: `Il te reste ${clock(s.timeLeft)}.${warn.length ? '<br><b>' + warn.join('<br>') + '</b>' : ''}<br>Une fois la section terminée, tu ne pourras plus modifier tes textes.`,
      actions: [{ label: 'Continuer le test', value: false }, { label: 'Terminer la section', value: true, kind: 'primary' }], exam: true
    });
    if (ok) finish(false);
  }

  function finish(auto) {
    if (finished) return;
    finished = true;
    clearInterval(timer);
    s.snapshots.push({ t: Math.round(3600 - s.timeLeft), w1: countWords(s.task1), w2: countWords(s.task2), on: current });
    s.status = 'done'; s.finishedAt = Date.now(); s.timeUsed = 3600 - s.timeLeft; s.autoSubmitted = auto;
    store.save();
    app.sectionDone('writing');
  }

  show(1);
  shell.setTimer(minutesLabel(s.timeLeft));
}

// Black-and-white line graph, as printed in the test booklet.
export function lineChart(c) {
  const W = 560, H = 360, m = { l: 52, r: 18, t: 34, b: 86 };
  const iw = W - m.l - m.r, ih = H - m.t - m.b;
  const x = i => m.l + (i * iw) / (c.years.length - 1);
  const y = v => m.t + (1 - v / c.max) * ih;
  const markers = [
    (px, py) => `<circle cx="${px}" cy="${py}" r="4.2"/>`,
    (px, py) => `<rect x="${px - 4}" y="${py - 4}" width="8" height="8"/>`,
    (px, py) => `<path d="M${px} ${py - 5} L${px + 5} ${py + 4} L${px - 5} ${py + 4} Z"/>`,
    (px, py) => `<path d="M${px} ${py - 5.5} L${px + 5.5} ${py} L${px} ${py + 5.5} L${px - 5.5} ${py} Z"/>`
  ];
  let g = `<text x="${W / 2}" y="18" text-anchor="middle" class="c-title">${c.title}</text>`;
  for (let v = 0; v <= c.max; v += 20) {
    g += `<line x1="${m.l}" x2="${W - m.r}" y1="${y(v)}" y2="${y(v)}" class="c-grid"/>`;
    g += `<text x="${m.l - 8}" y="${y(v) + 4}" text-anchor="end" class="c-tick">${v}</text>`;
  }
  g += `<text x="14" y="${m.t + ih / 2}" transform="rotate(-90 14 ${m.t + ih / 2})" text-anchor="middle" class="c-axis">${c.yLabel}</text>`;
  c.years.forEach((yr, i) => { g += `<text x="${x(i)}" y="${H - m.b + 20}" text-anchor="middle" class="c-tick">${yr}</text>`; });
  g += `<line x1="${m.l}" x2="${W - m.r}" y1="${y(0)}" y2="${y(0)}" class="c-axisline"/>`;
  c.series.forEach((s, k) => {
    const pts = s.values.map((v, i) => `${x(i)},${y(v)}`).join(' ');
    g += `<polyline points="${pts}" class="c-line" stroke-dasharray="${s.dash}"/>`;
    s.values.forEach((v, i) => { g += `<g class="c-mark">${markers[k](x(i), y(v))}</g>`; });
  });
  const lw = iw / 2;
  c.series.forEach((s, k) => {
    const lx = m.l + (k % 2) * lw + 6, ly = H - 40 + Math.floor(k / 2) * 22;
    g += `<line x1="${lx}" x2="${lx + 34}" y1="${ly}" y2="${ly}" class="c-line" stroke-dasharray="${s.dash}"/><g class="c-mark">${markers[k](lx + 17, ly)}</g>`;
    g += `<text x="${lx + 44}" y="${ly + 4}" class="c-legend">${s.name}</text>`;
  });
  return `<svg viewBox="0 0 ${W} ${H}" class="line-chart" role="img" aria-label="${c.title}: line graph of ${c.series.map(s => s.name).join(', ')} from ${c.years[0]} to ${c.years[c.years.length - 1]}">${g}</svg>`;
}
