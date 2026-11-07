// The computer-delivered test frame shared by Listening, Reading and Writing:
// dark top bar (candidate, timer, tools), part bar, work area, question navigator.
import { h, $$, dialog } from './util.js';

const SIZE_KEY = 'ielts-text-size';

export function createShell({ section, candidate, parts, isAnswered, isFlagged, onFlag, onGoto, onSubmit, help, showQuestions = true, submitLabel = 'Finish' }) {
  let currentPart = parts[0].id;
  let currentQ = parts[0].qs[0] ?? null;
  const size = Number(localStorage.getItem(SIZE_KEY) || 1);

  const timer = h('div', { class: 'exam-timer', role: 'timer', 'aria-live': 'off' }, '');
  const partbar = h('div', { class: 'exam-partbar' });
  const main = h('main', { class: 'exam-main', tabindex: '-1' });
  const navParts = h('div', { class: 'nav-parts' });
  const review = h('input', { type: 'checkbox', id: 'review-flag', onchange: e => { if (currentQ != null) { onFlag && onFlag(currentQ, e.target.checked); refreshNav(); } } });

  const el = h('div', { class: 'exam', dataset: { size: String(size), section } },
    h('header', { class: 'exam-top' },
      h('div', { class: 'exam-id' },
        h('span', { class: 'exam-candidate' }, candidate || 'Candidate'),
        h('span', { class: 'exam-section' }, section)),
      timer,
      h('div', { class: 'exam-tools' },
        h('button', { class: 'tool', type: 'button', title: 'Text size', 'aria-label': 'Change text size', onclick: cycleSize }, 'Aa'),
        h('button', { class: 'tool', type: 'button', title: 'Help', 'aria-label': 'Help', onclick: () => dialog({ title: 'Aide', body: help, actions: [{ label: 'Retour au test', value: true, kind: 'primary' }], exam: true }) }, '?'))
    ),
    partbar,
    main,
    h('nav', { class: 'exam-nav', 'aria-label': 'Question navigation' },
      navParts,
      h('div', { class: 'nav-actions' },
        showQuestions && onFlag ? h('label', { class: 'nav-review', for: 'review-flag' }, review, ' Review') : null,
        showQuestions ? h('button', { class: 'nav-arrow', type: 'button', 'aria-label': 'Previous question', onclick: () => step(-1) }, '‹') : null,
        showQuestions ? h('button', { class: 'nav-arrow', type: 'button', 'aria-label': 'Next question', onclick: () => step(1) }, '›') : null,
        h('button', { class: 'nav-submit', type: 'button', onclick: () => onSubmit() }, '✓ ', submitLabel))
    )
  );

  main.addEventListener('focusin', e => {
    const w = e.target.closest('[data-qwrap]');
    if (w) { currentQ = Number(w.dataset.qwrap); refreshNav(); }
  });

  function cycleSize() {
    const next = (Number(el.dataset.size) % 3) + 1;
    el.dataset.size = String(next);
    localStorage.setItem(SIZE_KEY, String(next));
  }

  function allQs() { return parts.flatMap(p => p.qs.map(q => ({ part: p.id, q }))); }

  function step(dir) {
    const list = allQs();
    let i = list.findIndex(x => x.q === currentQ);
    i = Math.min(list.length - 1, Math.max(0, i + dir));
    const t = list[i];
    if (t) goto(t.part, t.q);
  }

  function goto(part, q) {
    currentQ = q;
    onGoto && onGoto(part, q);
  }

  function refreshNav() {
    navParts.innerHTML = '';
    for (const p of parts) {
      const done = p.qs.filter(q => isAnswered(q)).length;
      const isCur = p.id === currentPart;
      const wrap = h('div', { class: `nav-part${isCur ? ' current' : ''}` },
        h('button', { class: 'nav-part-label', type: 'button', 'aria-current': isCur ? 'true' : null, onclick: () => goto(p.id, p.qs[0] ?? null) },
          h('span', {}, p.label),
          showQuestions && !isCur ? h('span', { class: 'nav-count' }, `${done} of ${p.qs.length}`) : null,
          !showQuestions && p.meta ? h('span', { class: 'nav-count' }, p.meta()) : null));
      if (isCur && showQuestions) {
        wrap.append(h('div', { class: 'nav-qs' }, p.qs.map(q => h('button', {
          type: 'button',
          class: `nav-q${isAnswered(q) ? ' answered' : ''}${isFlagged && isFlagged(q) ? ' flagged' : ''}${q === currentQ ? ' active' : ''}`,
          'aria-label': `Question ${q}${isAnswered(q) ? ', answered' : ''}${isFlagged && isFlagged(q) ? ', flagged for review' : ''}`,
          onclick: () => goto(p.id, q)
        }, String(q)))));
      }
      navParts.append(wrap);
    }
    if (review) review.checked = !!(isFlagged && currentQ != null && isFlagged(currentQ));
  }

  return {
    el, main, partbar,
    setTimer(text, urgent = false) { timer.textContent = text; timer.classList.toggle('urgent', urgent); },
    flashTimer() { timer.classList.remove('flash'); void timer.offsetWidth; timer.classList.add('flash'); },
    setPart(id) { currentPart = id; refreshNav(); },
    setCurrentQ(q) { currentQ = q; refreshNav(); },
    get currentQ() { return currentQ; },
    refreshNav,
    mount(host) { host.innerHTML = ''; host.append(el); refreshNav(); },
    destroy() { el.remove(); }
  };
}

// Scrolls a question into view inside its scroll container and focuses its first control.
export function focusQuestion(q, root) {
  const target = root.querySelector(`[data-qwrap="${q}"]`);
  if (!target) return;
  target.scrollIntoView({ block: 'center', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  const ctl = target.matches('input,select,textarea') ? target : target.querySelector('input:not([disabled]),select,textarea');
  if (ctl) setTimeout(() => ctl.focus({ preventScroll: true }), 50);
  $$('.q-current', root).forEach(n => n.classList.remove('q-current'));
  target.classList.add('q-current');
}
