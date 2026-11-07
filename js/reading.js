// Academic Reading: 60 minutes, 3 passages, split screen, highlighter, question navigator.
import { READING } from '../data/reading.js';
import { createShell, focusQuestion } from './shell.js';
import { renderGroups, isAnswered, indexGroups } from './questions.js';
import { h, clock, minutesLabel, dialog, toast } from './util.js';
import { store } from './store.js';

const groupsByQ = indexGroups(READING.parts);
const HELP = `<p>60 minutes pour les 3 textes, sans temps supplémentaire pour reporter les réponses.</p>
<p><b>Surligner</b> : sélectionne un passage du texte puis appuie sur « Highlight ». Touche un passage surligné pour l’effacer.</p>
<p>Tu peux changer de partie à tout moment avec la barre du bas. <b>Review</b> marque une question à revoir.</p>
<p>Conseil de rythme : environ 17, 20 puis 23 minutes.</p>`;

export function readingScreen(app) {
  const s = store.state.reading;
  if (s.status === 'done') return app.go('#/');
  if (s.status === 'active') return resume(app);
  return briefing(app);
}

function briefing(app) {
  app.screen(h('div', { class: 'page narrow' },
    h('p', { class: 'kicker' }, 'Épreuve 2 sur 4'),
    h('h1', { class: 'title' }, 'Reading'),
    h('p', { class: 'lede' }, 'Trois textes académiques de difficulté croissante et 40 questions, en 60 minutes.'),
    h('ul', { class: 'rules' },
      h('li', {}, 'Le chronomètre tourne dès que tu commences, sans pause.'),
      h('li', {}, 'Le texte est à gauche, les questions à droite (sur téléphone, bascule entre les deux).'),
      h('li', {}, 'Tu peux surligner le texte, comme sur le test informatisé.'),
      h('li', {}, 'L’orthographe des réponses recopiées du texte doit être exacte.'),
      h('li', {}, 'Une alerte apparaît à 10 et à 5 minutes de la fin.')),
    h('div', { class: 'actions' },
      h('button', { class: 'btn primary', onclick: () => run(app) }, 'Commencer le Reading'),
      h('button', { class: 'btn ghost', onclick: () => app.go('#/') }, 'Plus tard'))));
}

function resume(app) {
  const s = store.state.reading;
  app.screen(h('div', { class: 'page narrow' },
    h('h1', { class: 'title' }, 'Reading interrompu'),
    h('p', { class: 'lede' }, `Il te restait ${clock(s.timeLeft)}. Tes réponses sont enregistrées.`),
    h('p', {}, 'Le chronomètre reprend où il s’était arrêté. L’interruption sera signalée dans ton bilan.'),
    h('div', { class: 'actions' },
      h('button', { class: 'btn primary', onclick: () => { s.interruptions = (s.interruptions || 0) + 1; run(app, true); } }, 'Reprendre'),
      h('button', { class: 'btn ghost', onclick: () => app.go('#/') }, 'Retour à l’accueil'))));
}

function run(app, resuming = false) {
  const s = store.state.reading;
  if (!resuming) { s.status = 'active'; s.startedAt = Date.now(); s.timeLeft = 3600; s.partTime = { 1: 0, 2: 0, 3: 0 }; }
  store.save();

  const parts = READING.parts.map(p => ({ id: p.id, label: `Part ${p.id}`, qs: qsOf(p) }));
  let current = 1;
  let finished = false;
  let mobileView = 'text';
  const alerts = new Set();

  const shell = createShell({
    section: 'Reading',
    candidate: app.candidate(),
    parts,
    help: HELP,
    isAnswered: q => isAnswered(s.answers, q, groupsByQ),
    isFlagged: q => s.flags.includes(q),
    onFlag: (q, on) => { s.flags = on ? [...new Set([...s.flags, q])] : s.flags.filter(x => x !== q); store.save(); },
    onGoto: (part, q) => { if (part !== current) show(part); if (q != null) { setMobile('questions'); focusQuestion(q, shell.main); } },
    onSubmit: () => confirmFinish()
  });
  app.mountExam(shell);

  const selTool = h('button', { class: 'hl-tool', type: 'button', hidden: true, onmousedown: e => e.preventDefault(), onclick: () => doHighlight() }, 'Highlight');
  shell.el.append(selTool);

  function show(id) {
    current = id;
    const p = READING.parts.find(x => x.id === id);
    shell.partbar.innerHTML = '';
    shell.partbar.append(h('b', {}, `Part ${p.id}`), ' ', p.intro, app.dev ? h('span', { class: 'dev' }, h('button', { onclick: () => { s.timeLeft = 65; } }, '→ 1 min')) : null);
    const passage = h('article', { class: 'passage', 'aria-label': `Reading passage ${p.id}` });
    passage.innerHTML = s.highlights[id] || `<p class="advice">${p.advice}</p><h2 class="passage-title">${p.title}</h2>${p.passage}`;
    passage.addEventListener('mouseup', () => setTimeout(placeTool, 0));
    passage.addEventListener('touchend', () => setTimeout(placeTool, 250));
    passage.addEventListener('click', e => {
      const m = e.target.closest('mark.hl');
      if (m && window.getSelection().isCollapsed) { unwrap(m); saveHl(passage); }
    });
    const questions = h('div', { class: 'questions' }, renderGroups(p.groups, {
      answers: s.answers,
      onChange: (q, v) => { s.answers[q] = v; store.save(); shell.refreshNav(); }
    }));
    const left = h('div', { class: 'pane pane-text' }, passage);
    const right = h('div', { class: 'pane pane-questions' }, questions);
    const divider = h('div', { class: 'divider', role: 'separator', 'aria-orientation': 'vertical', tabindex: '0', title: 'Drag to resize' });
    const split = h('div', { class: 'split', dataset: { view: mobileView } }, left, divider, right);
    enableDrag(divider, split);
    const switcher = h('div', { class: 'pane-switch', role: 'tablist' },
      h('button', { role: 'tab', type: 'button', 'aria-selected': String(mobileView === 'text'), onclick: () => setMobile('text') }, 'Text'),
      h('button', { role: 'tab', type: 'button', 'aria-selected': String(mobileView === 'questions'), onclick: () => setMobile('questions') }, 'Questions'));
    shell.main.innerHTML = '';
    shell.main.classList.add('main-split');
    shell.main.append(switcher, split);
    shell.setPart(id);
  }

  function setMobile(v) {
    mobileView = v;
    const split = shell.main.querySelector('.split');
    if (split) split.dataset.view = v;
    shell.main.querySelectorAll('.pane-switch button').forEach((b, i) => b.setAttribute('aria-selected', String((i === 0) === (v === 'text'))));
  }

  function placeTool() {
    const sel = window.getSelection();
    const passage = shell.main.querySelector('.passage');
    if (!sel.rangeCount || sel.isCollapsed || !passage || !passage.contains(sel.anchorNode)) { selTool.hidden = true; return; }
    const r = sel.getRangeAt(0).getBoundingClientRect();
    selTool.style.top = `${Math.max(8, r.top - 44)}px`;
    selTool.style.left = `${Math.min(window.innerWidth - 110, Math.max(8, r.left + r.width / 2 - 50))}px`;
    selTool.hidden = false;
  }
  document.addEventListener('selectionchange', onSel);
  function onSel() { if (window.getSelection().isCollapsed) selTool.hidden = true; }

  function doHighlight() {
    const passage = shell.main.querySelector('.passage');
    highlight(passage);
    selTool.hidden = true;
    saveHl(passage);
  }
  function saveHl(passage) { s.highlights[current] = passage.innerHTML; store.save(); }

  let last = performance.now();
  const timer = setInterval(() => {
    if (finished) return;
    const now = performance.now();
    const dt = (now - last) / 1000; last = now;
    s.timeLeft = Math.max(0, s.timeLeft - dt);
    s.partTime[current] = (s.partTime[current] || 0) + dt;
    const left = s.timeLeft;
    shell.setTimer(minutesLabel(left), left <= 300);
    for (const m of [10, 5]) {
      if (left <= m * 60 && !alerts.has(m)) { alerts.add(m); shell.flashTimer(); toast(`${m} minutes remaining`, 'exam'); }
    }
    if (Math.round(left) % 5 === 0) store.save();
    if (left <= 0) { finish(true); dialog({ title: 'Time is up', body: 'Le temps du Reading est écoulé. Tes réponses ont été enregistrées.', actions: [{ label: 'OK', value: 1, kind: 'primary' }] }); }
  }, 500);

  const persist = () => store.save();
  window.addEventListener('pagehide', persist);
  app.onLeave(() => { clearInterval(timer); document.removeEventListener('selectionchange', onSel); window.removeEventListener('pagehide', persist); store.save(); });

  async function confirmFinish() {
    const unanswered = parts.flatMap(p => p.qs).filter(q => !isAnswered(s.answers, q, groupsByQ)).length;
    const ok = await dialog({
      title: 'Terminer le Reading ?',
      body: `Il te reste ${clock(s.timeLeft)}${unanswered ? ` et ${unanswered} question${unanswered > 1 ? 's' : ''} sans réponse` : ''}. Une fois la section terminée, tu ne pourras plus modifier tes réponses.`,
      actions: [{ label: 'Continuer le test', value: false }, { label: 'Terminer la section', value: true, kind: 'primary' }], exam: true
    });
    if (ok) finish(false);
  }

  function finish(auto) {
    if (finished) return;
    finished = true;
    clearInterval(timer);
    s.status = 'done'; s.finishedAt = Date.now(); s.timeUsed = 3600 - s.timeLeft; s.autoSubmitted = auto;
    store.save();
    app.sectionDone('reading');
  }

  show(1);
  shell.setTimer(minutesLabel(s.timeLeft));
}

function qsOf(p) {
  const qs = [];
  for (const g of p.groups) for (let q = g.range[0]; q <= g.range[1]; q++) qs.push(q);
  return qs;
}

function highlight(container) {
  const sel = window.getSelection();
  if (!sel.rangeCount || sel.isCollapsed) return;
  const range = sel.getRangeAt(0);
  if (!container.contains(range.commonAncestorContainer)) return;
  const root = range.commonAncestorContainer.nodeType === 1 ? range.commonAncestorContainer : range.commonAncestorContainer.parentNode;
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, { acceptNode: n => range.intersectsNode(n) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT });
  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);
  for (const node of nodes) {
    const start = node === range.startContainer ? range.startOffset : 0;
    const end = node === range.endContainer ? range.endOffset : node.length;
    if (start >= end || !node.textContent.trim() || node.parentNode.closest('mark.hl')) continue;
    const mid = node.splitText(start);
    mid.splitText(end - start);
    const mark = document.createElement('mark');
    mark.className = 'hl';
    mid.parentNode.replaceChild(mark, mid);
    mark.appendChild(mid);
  }
  sel.removeAllRanges();
}

function unwrap(mark) {
  const parent = mark.parentNode;
  while (mark.firstChild) parent.insertBefore(mark.firstChild, mark);
  parent.removeChild(mark);
  parent.normalize();
}

function enableDrag(divider, split) {
  let dragging = false;
  const move = x => {
    const r = split.getBoundingClientRect();
    const pct = Math.min(75, Math.max(25, ((x - r.left) / r.width) * 100));
    split.style.setProperty('--left', `${pct}%`);
  };
  divider.addEventListener('pointerdown', e => { dragging = true; divider.setPointerCapture(e.pointerId); });
  divider.addEventListener('pointermove', e => { if (dragging) move(e.clientX); });
  divider.addEventListener('pointerup', () => { dragging = false; });
  divider.addEventListener('keydown', e => {
    const cur = parseFloat(split.style.getPropertyValue('--left')) || 50;
    if (e.key === 'ArrowLeft') split.style.setProperty('--left', `${Math.max(25, cur - 5)}%`);
    if (e.key === 'ArrowRight') split.style.setProperty('--left', `${Math.min(75, cur + 5)}%`);
  });
}
