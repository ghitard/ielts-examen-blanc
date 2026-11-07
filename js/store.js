// Persistent exam state (localStorage) + recordings (IndexedDB).
// Everything stays in the candidate's browser; nothing is sent anywhere.

const KEY = 'ielts-examen-blanc-v1';

function blank() {
  return {
    v: 1,
    createdAt: Date.now(),
    profile: null,
    listening: { status: 'todo', answers: {}, flags: [], audioPos: 0, interruptions: 0 },
    reading: { status: 'todo', answers: {}, flags: [], timeLeft: 3600, partTime: { 1: 0, 2: 0, 3: 0 }, interruptions: 0, highlights: {} },
    writing: { status: 'todo', task1: '', task2: '', timeLeft: 3600, taskTime: { 1: 0, 2: 0 }, snapshots: [], pastes: [], interruptions: 0 },
    speaking: { status: 'todo', idx: 0, items: {}, notes: '', interruptions: 0, env: {} },
    final: null
  };
}

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return blank();
    const s = JSON.parse(raw);
    const b = blank();
    for (const k of Object.keys(b)) if (s[k] === undefined) s[k] = b[k];
    return s;
  } catch (e) {
    return blank();
  }
}

export const store = {
  state: load(),
  save() {
    try { localStorage.setItem(KEY, JSON.stringify(this.state)); }
    catch (e) { console.warn('save failed', e); }
  },
  reset() {
    this.state = blank();
    this.save();
    idb.clear().catch(() => {});
  }
};

// Minimal IndexedDB wrapper for speaking recordings.
const DB = 'ielts-examen-blanc', OS = 'recordings';
function open() {
  return new Promise((resolve, reject) => {
    const r = indexedDB.open(DB, 1);
    r.onupgradeneeded = () => r.result.createObjectStore(OS);
    r.onsuccess = () => resolve(r.result);
    r.onerror = () => reject(r.error);
  });
}
function tx(mode, fn) {
  return open().then(db => new Promise((resolve, reject) => {
    const t = db.transaction(OS, mode);
    const req = fn(t.objectStore(OS));
    t.oncomplete = () => resolve(req && req.result);
    t.onerror = () => reject(t.error);
  }));
}
export const idb = {
  put: (key, blob) => tx('readwrite', s => s.put(blob, key)),
  get: key => tx('readonly', s => s.get(key)),
  clear: () => tx('readwrite', s => s.clear())
};
