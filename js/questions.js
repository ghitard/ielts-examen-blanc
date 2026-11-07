// Renders IELTS question groups (gap fill, MCQ, choose two, T/F/NG, Y/N/NG, matching) and
// keeps answers in the shared `answers` object. Each question wrapper carries data-qwrap.
import { h, toast } from './util.js';

const TFNG = ['TRUE', 'FALSE', 'NOT GIVEN'];
const YNNG = ['YES', 'NO', 'NOT GIVEN'];

export function groupTitle(g) {
  const [a, b] = g.range;
  return a === b ? `Question ${a}` : `Questions ${a}–${b}`;
}

export function renderGroups(groups, ctx) {
  return h('div', { class: 'q-groups' }, groups.map(g => renderGroup(g, ctx)));
}

function header(g) {
  return [h('h3', { class: 'q-title' }, groupTitle(g)), h('p', { class: 'q-instr', html: g.instructions })];
}

function renderGroup(g, ctx) {
  switch (g.type) {
    case 'gap': return gap(g, ctx);
    case 'mcq': return mcq(g, ctx);
    case 'mcq2': return mcq2(g, ctx);
    case 'tfng': return judge(g, ctx, TFNG);
    case 'ynng': return judge(g, ctx, YNNG);
    case 'match': return g.ui === 'grid' ? matchGrid(g, ctx) : matchSelect(g, ctx);
    default: return h('p', {}, `Unknown question type ${g.type}`);
  }
}

function gap(g, ctx) {
  const html = g.html.replace(/\{\{(\d+)\}\}/g, (_, n) =>
    `<span class="gap-wrap" data-qwrap="${n}"><input class="gap" type="text" data-q="${n}" aria-label="Question ${n}" placeholder="${n}" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" maxlength="40"></span>`);
  const body = h('div', { class: 'q-body', html });
  body.querySelectorAll('input.gap').forEach(inp => {
    const q = Number(inp.dataset.q);
    inp.value = ctx.answers[q] || '';
    inp.classList.toggle('filled', !!inp.value.trim());
    inp.addEventListener('input', () => {
      inp.classList.toggle('filled', !!inp.value.trim());
      ctx.onChange(q, inp.value);
    });
  });
  return h('section', { class: 'q-group' }, header(g), body);
}

function radioOption(name, value, label, checked, onPick, key) {
  const input = h('input', { type: 'radio', name, value, checked: checked ? true : null, onchange: () => onPick(value) });
  return h('label', { class: 'opt' }, input, key ? h('span', { class: 'opt-key' }, key) : null, h('span', { class: 'opt-text' }, label));
}

function mcq(g, ctx) {
  return h('section', { class: 'q-group' }, header(g),
    g.items.map(it => h('div', { class: 'q-item', 'data-qwrap': it.q, role: 'radiogroup', 'aria-label': `Question ${it.q}` },
      h('p', { class: 'q-stem' }, h('b', { class: 'q-num' }, String(it.q)), ' ', it.stem),
      h('div', { class: 'q-options' }, Object.entries(it.options).map(([k, v]) =>
        radioOption(`q${it.q}`, k, v, ctx.answers[it.q] === k, val => ctx.onChange(it.q, val), k))))));
}

function mcq2(g, ctx) {
  const key = `${g.range[0]}-${g.range[1]}`;
  const max = g.range[1] - g.range[0] + 1;
  const picked = new Set(ctx.answers[key] || []);
  const boxes = Object.entries(g.options).map(([k, v]) => {
    const input = h('input', { type: 'checkbox', value: k, checked: picked.has(k) ? true : null });
    input.addEventListener('change', () => {
      if (input.checked && picked.size >= max) {
        input.checked = false;
        toast(`Choose ${max === 2 ? 'TWO' : max} answers only. Untick one first.`);
        return;
      }
      input.checked ? picked.add(k) : picked.delete(k);
      ctx.onChange(key, Array.from(picked).sort());
    });
    return h('label', { class: 'opt' }, input, h('span', { class: 'opt-key' }, k), h('span', { class: 'opt-text' }, v));
  });
  return h('section', { class: 'q-group' }, header(g),
    h('div', { class: 'q-item', 'data-qwrap': g.range[0] },
      h('p', { class: 'q-stem', html: `<b class="q-num">${g.range[0]}–${g.range[1]}</b> ${g.stem}` }),
      h('div', { class: 'q-options' }, boxes)),
    h('span', { 'data-qwrap': g.range[1], class: 'q-anchor', 'aria-hidden': 'true' }));
}

function judge(g, ctx, labels) {
  return h('section', { class: 'q-group' }, header(g),
    g.items.map(it => h('div', { class: 'q-item', 'data-qwrap': it.q, role: 'radiogroup', 'aria-label': `Question ${it.q}` },
      h('p', { class: 'q-stem' }, h('b', { class: 'q-num' }, String(it.q)), ' ', it.text),
      h('div', { class: 'q-options q-options-row' }, labels.map(l =>
        radioOption(`q${it.q}`, l, l, ctx.answers[it.q] === l, val => ctx.onChange(it.q, val)))))));
}

function optionBox(box) {
  if (!box) return null;
  return h('div', { class: 'q-box' },
    h('p', { class: 'q-box-title' }, box.title),
    h('dl', {}, Object.entries(box.options).flatMap(([k, v]) => [h('dt', {}, k), h('dd', {}, v)])));
}

function matchGrid(g, ctx) {
  const cols = g.letters.length;
  const head = h('div', { class: 'grid-row grid-head', style: { '--cols': cols }, 'aria-hidden': 'true' },
    h('span', { class: 'grid-label' }, g.title || ''), g.letters.map(l => h('span', { class: 'grid-cell' }, l)));
  const rows = g.items.map(it => h('div', { class: 'grid-row', style: { '--cols': cols }, 'data-qwrap': it.q, role: 'radiogroup', 'aria-label': `Question ${it.q}: ${it.text}` },
    h('span', { class: 'grid-label' }, h('b', { class: 'q-num' }, String(it.q)), ' ', it.text),
    g.letters.map(l => h('label', { class: 'grid-cell' },
      h('input', { type: 'radio', name: `q${it.q}`, value: l, 'aria-label': `${it.q} ${l}`, checked: ctx.answers[it.q] === l ? true : null, onchange: () => ctx.onChange(it.q, l) }),
      h('span', { class: 'grid-letter' }, l)))));
  return h('section', { class: 'q-group' }, header(g),
    g.figure ? h('figure', { class: 'q-figure' }, g.title ? h('figcaption', {}, g.title) : null, h('div', { html: g.figure })) : null,
    optionBox(g.box),
    h('div', { class: 'grid' }, head, rows));
}

function matchSelect(g, ctx) {
  return h('section', { class: 'q-group' }, header(g),
    optionBox(g.box),
    g.example ? h('p', { class: 'q-example', html: g.example }) : null,
    h('div', { class: 'q-selects' }, g.items.map(it => {
      const sel = h('select', { 'aria-label': `Question ${it.q}`, onchange: e => { ctx.onChange(it.q, e.target.value); sel.classList.toggle('filled', !!e.target.value); } },
        h('option', { value: '' }, '—'),
        g.letters.map(l => h('option', { value: l, selected: ctx.answers[it.q] === l ? true : null }, g.box ? `${l}  ${shorten(g.box.options[l])}` : l)));
      sel.classList.toggle('filled', !!ctx.answers[it.q]);
      return h('label', { class: 'q-select-row', 'data-qwrap': it.q },
        h('span', { class: 'q-select-text' }, h('b', { class: 'q-num' }, String(it.q)), ' ', it.text), sel);
    })));
}

function shorten(s) { return s && s.length > 64 ? s.slice(0, 62) + '…' : s; }

// Whether a question counts as answered for the navigator.
export function isAnswered(answers, q, groupsByQ) {
  const g = groupsByQ[q];
  if (g && g.type === 'mcq2') {
    const arr = answers[`${g.range[0]}-${g.range[1]}`] || [];
    return arr.length > q - g.range[0];
  }
  const v = answers[q];
  return typeof v === 'string' ? v.trim() !== '' : !!v;
}

export function indexGroups(parts) {
  const byQ = {};
  for (const p of parts) for (const g of p.groups) for (let q = g.range[0]; q <= g.range[1]; q++) byQ[q] = { ...g, part: p.id };
  return byQ;
}
