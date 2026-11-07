// Marking: answer normalisation, error classification, band conversion.
import { levenshtein } from './util.js';
import { indexGroups } from './questions.js';

// Usual raw score → band conversions (Academic). Band descriptors vary slightly by test version.
export const LISTENING_BANDS = [[39, 9], [37, 8.5], [35, 8], [32, 7.5], [30, 7], [26, 6.5], [23, 6], [18, 5.5], [16, 5], [13, 4.5], [10, 4], [8, 3.5], [6, 3], [4, 2.5], [2, 2], [1, 1], [0, 0]];
export const READING_BANDS = [[39, 9], [37, 8.5], [35, 8], [33, 7.5], [30, 7], [27, 6.5], [23, 6], [19, 5.5], [15, 5], [13, 4.5], [10, 4], [8, 3.5], [6, 3], [4, 2.5], [2, 2], [1, 1], [0, 0]];

export function toBand(raw, table) {
  for (const [min, b] of table) if (raw >= min) return b;
  return 0;
}

// IELTS rounding: x.25 → x.5, x.75 → x+1.
export function overallBand(list) {
  const v = list.filter(b => typeof b === 'number');
  if (v.length < 4) return null;
  return Math.round((v.reduce((a, b) => a + b, 0) / 4) * 2) / 2;
}

export function cefr(b) {
  if (b == null) return '';
  if (b >= 8.5) return 'C2';
  if (b >= 7) return 'C1';
  if (b >= 5.5) return 'B2';
  if (b >= 4) return 'B1';
  return 'A2 ou moins';
}

export function fmtBand(b) { return b == null ? '—' : (Number.isInteger(b) ? `${b}.0` : String(b)); }

export function normalize(s) {
  return String(s || '').normalize('NFKC').toLowerCase()
    .replace(/[’‘`´]/g, "'")
    .replace(/[£$€]/g, '')
    .replace(/(\d),(\d{3})\b/g, '$1$2')
    .replace(/\s+/g, ' ')
    .replace(/^[\s.,;:!?"'()-]+|[\s.,;:!?"'()]+$/g, '')
    .trim();
}

const isNum = w => /^\d[\d.:/-]*(st|nd|rd|th)?$/.test(w);

function withinLimit(n, g) {
  const ws = n.split(' ').filter(Boolean);
  if (g.allowNumber) {
    const nums = ws.filter(isNum).length;
    return ws.length - nums <= g.limitWords && nums <= 1;
  }
  return ws.length <= g.limitWords;
}

function singularPluralMatch(n, accepted) {
  return accepted.some(a => {
    const variants = [a + 's', a + 'es', a.replace(/ies$/, 'y'), a.replace(/s$/, ''), a.replace(/es$/, ''), a.replace(/y$/, 'ies')];
    return a !== n && variants.includes(n);
  });
}

function containsWord(n, a) {
  return new RegExp(`(^|\\s)${a.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(\\s|$)`).test(n);
}

export function checkGap(given, key, g) {
  const n = normalize(given);
  if (!n) return 'blank';
  if (key.digits) {
    const d = n.replace(/\D/g, '');
    if (d === key.digits) return 'ok';
    return d.length >= key.digits.length - 1 && levenshtein(d, key.digits) <= 2 ? 'spelling' : 'wrong';
  }
  const acc = key.a.map(normalize);
  if (acc.includes(n)) return withinLimit(n, g) ? 'ok' : 'limit';
  if ((key.trap || []).map(normalize).includes(n)) return 'trap';
  if (acc.some(a => containsWord(n, a))) return withinLimit(n, g) ? 'form' : 'limit';
  if (singularPluralMatch(n, acc)) return 'form';
  const best = Math.min(...acc.filter(a => /[a-z]/.test(a)).map(a => levenshtein(n, a)), 99);
  const len = Math.max(...acc.map(a => a.length));
  if ((len >= 7 && best <= 2) || (len >= 4 && best <= 1) || (len <= 3 && best === 1 && n[0] === acc[0][0])) return 'spelling';
  if ((key.trap || []).map(normalize).some(t => containsWord(n, t) || levenshtein(n, t) <= 1)) return 'trap';
  return 'wrong';
}

// Marks a whole section. Returns one record per question.
export function markSection(data, answers) {
  const groups = indexGroups(data.parts);
  const items = [];
  const done = new Set();
  for (let q = 1; q <= 40; q++) {
    const g = groups[q];
    const key = data.key[q];
    if (g.type === 'mcq2') {
      const gk = `${g.range[0]}-${g.range[1]}`;
      if (done.has(gk)) continue;
      done.add(gk);
      const picked = answers[gk] || [];
      const hits = picked.filter(x => key.a.includes(x)).length;
      for (let i = g.range[0]; i <= g.range[1]; i++) {
        const k = data.key[i];
        const idx = i - g.range[0];
        const status = hits > idx ? 'ok' : (picked.length > idx ? 'wrong' : 'blank');
        items.push({ q: i, part: g.part, type: k.type, tags: k.tags, given: picked.join(', '), correct: key.a.join(' + '), status, ok: status === 'ok', ev: k.ev });
      }
      continue;
    }
    const given = answers[q] ?? '';
    let status;
    if (g.type === 'gap') status = checkGap(given, key, g);
    else status = !given ? 'blank' : (key.a.includes(given) ? 'ok' : 'wrong');
    items.push({ q, part: g.part, type: key.type, tags: key.tags, given: String(given), correct: key.show || key.a[0], status, ok: status === 'ok', ev: key.ev });
  }
  const raw = items.filter(i => i.ok).length;
  return { raw, items };
}
