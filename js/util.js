// Small DOM and formatting helpers shared by every screen.

export function h(tag, attrs = {}, ...children) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v === undefined || v === null || v === false) continue;
    if (k === 'class') el.className = v;
    else if (k === 'html') el.innerHTML = v;
    else if (k === 'style' && typeof v === 'object') {
      for (const [sk, sv] of Object.entries(v)) {
        if (sk.startsWith('--')) el.style.setProperty(sk, String(sv));
        else el.style[sk] = sv;
      }
    }
    else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2).toLowerCase(), v);
    else if (k === 'dataset') Object.assign(el.dataset, v);
    else if (v === true) el.setAttribute(k, '');
    else el.setAttribute(k, v);
  }
  for (const c of children.flat(Infinity)) {
    if (c === null || c === undefined || c === false) continue;
    el.append(c instanceof Node ? c : document.createTextNode(String(c)));
  }
  return el;
}

export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

export function clock(sec) {
  sec = Math.max(0, Math.round(sec));
  const m = Math.floor(sec / 60), s = sec % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export function minutesLabel(sec) {
  const m = Math.ceil(Math.max(0, sec) / 60);
  return m <= 1 ? (sec > 0 ? `${Math.ceil(sec)} seconds left` : 'Time is up') : `${m} minutes left`;
}

export function words(text) {
  return (text || '').trim().split(/\s+/).filter(w => /[A-Za-z0-9À-ÿ]/.test(w));
}

export function debounce(fn, ms) {
  let t;
  return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); };
}

export function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

export function levenshtein(a, b) {
  if (a === b) return 0;
  const m = a.length, n = b.length;
  if (!m) return n;
  if (!n) return m;
  let prev = Array.from({ length: n + 1 }, (_, i) => i);
  for (let i = 1; i <= m; i++) {
    const cur = [i];
    for (let j = 1; j <= n; j++) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
    prev = cur;
  }
  return prev[n];
}

export const isIOS = () => /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

export function toast(message, tone = '') {
  let host = $('#toasts');
  if (!host) { host = h('div', { id: 'toasts', 'aria-live': 'polite' }); document.body.append(host); }
  const t = h('div', { class: `toast ${tone}` }, message);
  host.append(t);
  setTimeout(() => t.classList.add('out'), 3800);
  setTimeout(() => t.remove(), 4300);
}

// Promise-based dialog. actions: [{label, value, kind}] — resolves with the chosen value.
export function dialog({ title, body, actions, exam = false }) {
  return new Promise(resolve => {
    const prev = document.activeElement;
    const close = v => { wrap.remove(); prev && prev.focus && prev.focus(); resolve(v); };
    const box = h('div', { class: 'dialog', role: 'dialog', 'aria-modal': 'true', 'aria-label': title },
      h('h2', {}, title),
      typeof body === 'string' ? h('p', { html: body }) : body,
      h('div', { class: 'dialog-actions' },
        actions.map(a => h('button', { class: `btn ${a.kind || ''}`, onclick: () => close(a.value) }, a.label)))
    );
    const wrap = h('div', { class: `dialog-wrap${exam ? ' exam-font' : ''}`, onkeydown: e => { if (e.key === 'Escape') close(null); } }, box);
    document.body.append(wrap);
    const btns = $$('button', box);
    (btns[btns.length - 1] || box).focus();
  });
}

export function formatDateFR(ts) {
  return new Date(ts).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
}

export function pct(ok, n) { return n ? Math.round((ok / n) * 100) : 0; }

// Fetch with progress → object URL (so audio never buffers mid-test).
export async function fetchBlobURL(url, onProgress) {
  const res = await fetch(url, { cache: 'force-cache' });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  const total = Number(res.headers.get('content-length')) || 0;
  if (!res.body || !total) {
    const b = await res.blob(); onProgress && onProgress(1); return URL.createObjectURL(b);
  }
  const reader = res.body.getReader();
  const chunks = []; let got = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value); got += value.length;
    onProgress && onProgress(Math.min(1, got / total));
  }
  return URL.createObjectURL(new Blob(chunks, { type: res.headers.get('content-type') || 'audio/mpeg' }));
}
