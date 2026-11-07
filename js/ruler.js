// The 9-band scale, drawn as a ruler: the target in red pen, each skill as a marker.
import { h } from './util.js';
import { fmtBand } from './scoring.js';

const CEFR = [
  { label: 'B1', from: 4, to: 5 },
  { label: 'B2', from: 5.5, to: 6.5 },
  { label: 'C1', from: 7, to: 8 },
  { label: 'C2', from: 8.5, to: 9 }
];

const pos = b => `${(b / 9) * 100}%`;

// markers: [{ key: 'L', label: 'Listening', band: 6.5, tentative: false }]
export function bandRuler({ target = null, markers = [], caption = '' } = {}) {
  const ticks = [];
  for (let b = 0; b <= 9; b += 0.5) {
    const major = Number.isInteger(b);
    ticks.push(h('span', { class: `tick${major ? ' major' : ''}`, style: { left: pos(b) } }));
    if (major) ticks.push(h('span', { class: 'tick-label', style: { left: pos(b) } }, String(b)));
  }

  // Stack markers that would overlap into separate rows.
  const placed = [];
  const sorted = markers.filter(m => m.band != null).sort((a, b) => a.band - b.band);
  const minGap = typeof window !== 'undefined' && window.innerWidth < 600 ? 2.1 : 1.1;
  for (const m of sorted) {
    let row = 0;
    while (placed.some(p => p.row === row && Math.abs(p.band - m.band) < minGap)) row++;
    placed.push({ ...m, row });
  }
  const rows = placed.reduce((a, p) => Math.max(a, p.row + 1), 1);

  const marks = placed.map(m => h('span', {
    class: `mk${m.tentative ? ' tentative' : ''}`,
    style: { left: pos(m.band), '--row': m.row },
    title: `${m.label} : ${fmtBand(m.band)}${m.tentative ? ' (auto-évaluation)' : ''}`
  }, h('b', {}, m.key), h('span', {}, fmtBand(m.band))));

  const desc = [
    target != null ? `objectif ${fmtBand(target)}` : null,
    ...placed.map(m => `${m.label} ${fmtBand(m.band)}${m.tentative ? ' (auto-évaluation)' : ''}`)
  ].filter(Boolean).join(', ');

  return h('figure', { class: 'ruler', style: { '--rows': rows }, role: 'img', 'aria-label': `Échelle des bandes IELTS de 0 à 9${desc ? ' : ' + desc : ''}` },
    h('div', { class: 'ruler-track' },
      h('div', { class: `ruler-marks${placed.length ? '' : ' empty'}` }, marks),
      h('div', { class: 'ruler-scale' }, ticks),
      target != null ? h('span', { class: 'target', style: { left: pos(target) } }, h('span', { class: 'target-label' }, `objectif ${fmtBand(target)}`)) : null),
    h('div', { class: 'ruler-cefr', 'aria-hidden': 'true' }, CEFR.map(c => h('span', { class: 'cefr', style: { left: pos(c.from - 0.25), width: `calc(${((c.to - c.from + 0.5) / 9) * 100}% - 2px)` } }, c.label))),
    caption ? h('figcaption', {}, caption) : null);
}
