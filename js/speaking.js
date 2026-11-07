// Speaking: recorded examiner, candidate answers recorded and transcribed in the browser,
// with fluency measures (response delay, speaking time, pauses) taken from the microphone level.
import { SPEAKING_STEPS, CUE_CARD, SPEAKING_PROMPT_IDS } from '../data/speaking.js';
import { h, clock, fetchBlobURL, isIOS } from './util.js';
import { store, idb } from './store.js';
import { speechStats } from './textstats.js';

const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
let mic = null;
const promptURLs = {};

export function speakingScreen(app) {
  const s = store.state.speaking;
  if (s.status === 'done') return app.go('#/');
  return setup(app, s.status === 'active');
}

function greetId() {
  const hr = new Date().getHours();
  return hr < 12 ? 'greet_morning' : hr < 18 ? 'greet_afternoon' : 'greet_evening';
}

function setup(app, resuming) {
  const s = store.state.speaking;
  const meter = h('span', { class: 'meter-fill' });
  const micStatus = h('p', { class: 'small', 'aria-live': 'polite' }, 'Le micro n’est pas encore activé.');
  const srStatus = h('p', { class: 'small', 'aria-live': 'polite' }, SR ? 'Transcription automatique disponible. Elle passe par le service de reconnaissance vocale de ton navigateur (Google pour Chrome, Apple pour Safari) ; l’audio enregistré, lui, reste sur cet appareil.' : 'Ce navigateur ne propose pas la transcription automatique. Tes réponses seront enregistrées, mais le bilan Speaking sera moins précis. Utilise Chrome (ordinateur ou Android) ou Safari pour une transcription.');
  const heard = h('p', { class: 'heard' });
  const loadBar = h('span', { class: 'progress-fill', style: { width: '0%' } });
  const loadStatus = h('p', { class: 'small muted' }, 'Chargement de la voix de l’examinatrice…');
  const recordToggle = h('input', { type: 'checkbox', id: 'rec-audio', checked: (s.env.recordAudio ?? !isIOS()) ? true : null });
  let micOK = false, loaded = false;
  const start = h('button', { class: 'btn primary', disabled: true, onclick: () => { s.env.recordAudio = recordToggle.checked; begin(app, resuming); } }, resuming ? 'Reprendre le Speaking' : 'Commencer le Speaking');
  const refresh = () => { start.disabled = !(micOK && loaded); };

  const testBtn = h('button', { class: 'btn', disabled: true, onclick: () => testRecognition() }, 'Tester la transcription');

  async function enableMic() {
    try {
      await openMic();
      micOK = true; testBtn.disabled = !SR;
      micStatus.textContent = 'Micro activé. Reste silencieux·se deux secondes : mesure du bruit ambiant…';
      const iv = setInterval(() => { if (!document.body.contains(meter)) { clearInterval(iv); return; } meter.style.width = `${Math.min(100, level() * 900)}%`; }, 80);
      app.onLeave(() => { clearInterval(iv); if (store.state.speaking.status !== 'active') closeMic(); });
      mic.noise = await measureNoise(2000);
      micStatus.textContent = `Micro prêt (bruit ambiant ${mic.noise < 0.01 ? 'faible' : mic.noise < 0.025 ? 'modéré' : 'élevé — cherche un endroit plus calme'}).`;
      s.env.noise = Number(mic.noise.toFixed(4));
      refresh();
    } catch (e) {
      micStatus.textContent = 'Accès au micro refusé ou impossible. Autorise le micro pour ce site dans les réglages du navigateur, puis recharge la page.';
    }
  }

  function testRecognition() {
    heard.textContent = 'Parle maintenant : « I’m ready for my speaking test. »';
    const r = startRecognition(txt => { heard.textContent = txt || '…'; });
    if (!r) return;
    setTimeout(async () => {
      const out = await r.stop();
      heard.textContent = out.text ? `Entendu : « ${out.text} »` : 'Rien n’a été transcrit. Vérifie que le micro est autorisé, ou continue : tes réponses seront tout de même enregistrées.';
      s.env.srTest = out.text || '';
    }, 6000);
  }

  app.screen(h('div', { class: 'page narrow' },
    h('p', { class: 'kicker' }, 'Épreuve 4 sur 4'),
    h('h1', { class: 'title' }, 'Speaking'),
    h('p', { class: 'lede' }, 'Un entretien de 11 à 14 minutes avec une examinatrice enregistrée, en trois parties.'),
    resuming ? h('p', {}, 'Le Speaking a été interrompu. Il reprendra à la question suivante.') : h('ul', { class: 'rules' },
      h('li', {}, 'Part 1 (4–5 min) : questions sur toi et sur des sujets du quotidien.'),
      h('li', {}, 'Part 2 (3–4 min) : 1 minute de préparation avec une carte sujet, puis 1 à 2 minutes de parole sans interruption.'),
      h('li', {}, 'Part 3 (4–5 min) : discussion plus abstraite liée au sujet de la Part 2.'),
      h('li', {}, 'L’examinatrice pose la question, puis tu réponds. Appuie sur « J’ai fini » (ou Espace) quand tu as terminé ; si tu parles trop longtemps, elle t’interrompt, comme en vrai.'),
      h('li', {}, 'Installe-toi au calme, de préférence avec un casque et un micro.')),
    h('div', { class: 'card' },
      h('h2', { class: 'card-title' }, 'Micro'),
      h('div', { class: 'meter', 'aria-hidden': 'true' }, meter),
      micStatus,
      h('div', { class: 'actions tight' }, h('button', { class: 'btn', onclick: enableMic }, 'Activer le micro'), testBtn),
      srStatus, heard,
      h('label', { class: 'check' }, recordToggle, ' Enregistrer aussi l’audio de mes réponses pour les réécouter (reste sur cet appareil)')),
    h('div', { class: 'card' }, h('div', { class: 'progress' }, loadBar), loadStatus),
    h('div', { class: 'actions' }, start, h('button', { class: 'btn ghost', onclick: () => app.go('#/') }, 'Plus tard'))));

  const ids = SPEAKING_PROMPT_IDS.filter(id => !promptURLs[id]);
  let doneCount = SPEAKING_PROMPT_IDS.length - ids.length;
  const step = () => {
    loadBar.style.width = `${Math.round((doneCount / SPEAKING_PROMPT_IDS.length) * 100)}%`;
    if (doneCount >= SPEAKING_PROMPT_IDS.length) { loaded = true; loadStatus.textContent = 'Voix de l’examinatrice prête.'; refresh(); }
  };
  step();
  ids.forEach(id => fetchBlobURL(`audio/speaking/${id}.mp3`).then(u => { promptURLs[id] = u; }).catch(() => { promptURLs[id] = `audio/speaking/${id}.mp3`; }).finally(() => { doneCount++; step(); }));
}

async function openMic() {
  if (mic) return mic;
  const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } });
  const ctx = new (window.AudioContext || window.webkitAudioContext)();
  const src = ctx.createMediaStreamSource(stream);
  const analyser = ctx.createAnalyser();
  analyser.fftSize = 1024;
  src.connect(analyser);
  mic = { stream, ctx, analyser, buf: new Float32Array(analyser.fftSize), noise: 0.01 };
  return mic;
}

function level() {
  if (!mic) return 0;
  mic.analyser.getFloatTimeDomainData(mic.buf);
  let sum = 0;
  for (let i = 0; i < mic.buf.length; i++) sum += mic.buf[i] * mic.buf[i];
  return Math.sqrt(sum / mic.buf.length);
}

function measureNoise(ms) {
  return new Promise(resolve => {
    const vals = [];
    const iv = setInterval(() => vals.push(level()), 50);
    setTimeout(() => { clearInterval(iv); vals.sort((a, b) => a - b); resolve(vals[Math.floor(vals.length * 0.5)] || 0.01); }, ms);
  });
}

function startRecognition(onUpdate) {
  if (!SR) return null;
  const rec = new SR();
  rec.lang = 'en-GB';
  rec.continuous = true;
  rec.interimResults = true;
  let finals = [], interim = '', confs = [], active = true, error = null, endResolve = null;
  rec.onresult = e => {
    interim = '';
    for (let i = e.resultIndex; i < e.results.length; i++) {
      const r = e.results[i];
      if (r.isFinal) { finals.push(r[0].transcript.trim()); if (r[0].confidence) confs.push(r[0].confidence); }
      else interim += r[0].transcript;
    }
    onUpdate && onUpdate((finals.join(' ') + ' ' + interim).trim());
  };
  rec.onerror = e => { error = e.error; if (['not-allowed', 'service-not-allowed', 'audio-capture'].includes(e.error)) active = false; };
  rec.onend = () => {
    if (active) { try { rec.start(); return; } catch (e) { /* already started */ } }
    endResolve && endResolve();
  };
  try { rec.start(); } catch (e) { error = 'start-failed'; }
  return {
    stop() {
      active = false;
      return new Promise(resolve => {
        const done = () => resolve({ text: (finals.join(' ') + ' ' + interim).replace(/\s+/g, ' ').trim(), conf: confs.length ? confs.reduce((a, b) => a + b, 0) / confs.length : null, error });
        endResolve = done;
        try { rec.stop(); } catch (e) { done(); }
        setTimeout(done, 1500);
      });
    }
  };
}

// Voice activity from the mic level, sampled every 50 ms.
function startVAD(onLevel) {
  const thr = Math.min(0.06, Math.max(0.008, (mic.noise || 0.01) * 3.2));
  const frames = [];
  const iv = setInterval(() => {
    const l = level();
    frames.push(l > thr);
    onLevel && onLevel(l);
  }, 50);
  return {
    stop() {
      clearInterval(iv);
      const dt = 0.05;
      const first = frames.indexOf(true), last = frames.lastIndexOf(true);
      if (first < 0) return { latency: frames.length * dt, speech: 0, pauses1: 0, pauses2: 0, longest: 0 };
      let run = 0, pauses1 = 0, pauses2 = 0, longest = 0, voiced = 0;
      for (let i = first; i <= last; i++) {
        if (frames[i]) {
          voiced++;
          if (run) { const sec = run * dt; if (sec >= 1) pauses1++; if (sec >= 2) pauses2++; longest = Math.max(longest, sec); }
          run = 0;
        } else run++;
      }
      return { latency: round1(first * dt), speech: round1(voiced * dt), pauses1, pauses2, longest: round1(longest) };
    }
  };
}

function recorderFor(stream) {
  if (!window.MediaRecorder) return null;
  const type = ['audio/webm;codecs=opus', 'audio/mp4', 'audio/webm', 'audio/ogg'].find(t => MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(t));
  try { return new MediaRecorder(stream, type ? { mimeType: type } : undefined); } catch (e) { return null; }
}

async function begin(app, resuming) {
  const st = store.state;
  const s = st.speaking;
  if (!resuming) { s.status = 'active'; s.startedAt = Date.now(); s.idx = 0; s.items = {}; }
  else s.interruptions = (s.interruptions || 0) + 1;
  store.save();
  if (mic && mic.ctx.state === 'suspended') await mic.ctx.resume();

  const player = new Audio();
  let leaving = false;
  let finishTurn = null;

  const partLabel = h('span', { class: 'sp-part' });
  const topicLabel = h('span', { class: 'sp-topic' });
  const examiner = h('div', { class: 'speaker examiner' },
    h('div', { class: 'speaker-name' }, 'Examiner'),
    h('div', { class: 'talk-bars', 'aria-hidden': 'true' }, h('i'), h('i'), h('i'), h('i'), h('i')),
    h('div', { class: 'speaker-state' }, ''));
  const youMeter = h('span', { class: 'meter-fill' });
  const youClock = h('span', { class: 'sp-clock' }, '0:00');
  const you = h('div', { class: 'speaker you' },
    h('div', { class: 'speaker-name' }, st.profile?.name || 'You'),
    h('div', { class: 'meter', 'aria-hidden': 'true' }, youMeter),
    h('div', { class: 'speaker-state' }, youClock));
  const card = h('div', { class: 'cue-card', hidden: true },
    h('p', { class: 'cue-title' }, CUE_CARD.title),
    h('p', {}, 'You should say:'),
    h('ul', {}, CUE_CARD.points.map(p => h('li', {}, p))),
    h('p', {}, CUE_CARD.last));
  const notes = h('textarea', { class: 'notes-area', placeholder: 'Your notes (optional)', 'aria-label': 'Notes for Part 2', spellcheck: 'false', hidden: true });
  notes.value = s.notes || '';
  notes.addEventListener('input', () => { s.notes = notes.value; store.save(); });
  const question = h('p', { class: 'sp-question', hidden: true });
  const showQ = h('button', { class: 'btn ghost small', type: 'button', hidden: true }, 'Afficher la question');
  const doneBtn = h('button', { class: 'btn primary big', type: 'button', disabled: true, onclick: () => finishTurn && finishTurn('done') }, 'J’ai fini de répondre');
  const prepBtn = h('button', { class: 'btn primary big', type: 'button', hidden: true }, 'Je suis prêt·e à parler');
  const hint = h('p', { class: 'sp-hint small muted' }, '');

  const stage = h('div', { class: 'speak' },
    h('header', { class: 'speak-top' }, h('span', { class: 'sp-title' }, 'Speaking'), partLabel, topicLabel,
      app.dev ? h('span', { class: 'dev' }, h('button', { onclick: () => finishTurn && finishTurn('done') }, 'skip'), h('button', { onclick: () => { player.currentTime = player.duration || 0; } }, 'skip audio')) : null),
    h('div', { class: 'speak-stage' },
      h('div', { class: 'speakers' }, examiner, you),
      card, notes, question,
      h('div', { class: 'speak-actions' }, showQ, prepBtn, doneBtn),
      hint));
  app.screen(stage, true);

  const onKey = e => {
    if (e.code !== 'Space' || e.target.matches('textarea, input, button')) return;
    e.preventDefault();
    if (!doneBtn.disabled) finishTurn && finishTurn('done');
  };
  document.addEventListener('keydown', onKey);
  app.onLeave(() => {
    leaving = true; player.pause(); document.removeEventListener('keydown', onKey);
    finishTurn && finishTurn('leave'); store.save();
    setTimeout(closeMic, 1600);
  });

  function say(promptId) {
    return new Promise(resolve => {
      examiner.classList.add('speaking');
      examiner.querySelector('.speaker-state').textContent = 'is speaking…';
      hint.textContent = 'Écoute la question.';
      youClock.textContent = '';
      player.src = promptURLs[promptId] || `audio/speaking/${promptId}.mp3`;
      const end = () => { examiner.classList.remove('speaking'); examiner.querySelector('.speaker-state').textContent = ''; resolve(); };
      player.onended = end;
      player.onerror = () => setTimeout(end, 400);
      player.play().catch(() => setTimeout(end, 400));
    });
  }

  async function turn(step, capSeconds) {
    const t0 = performance.now();
    you.classList.add('active');
    doneBtn.disabled = false;
    hint.textContent = 'Réponds à voix haute, puis appuie sur « J’ai fini » (ou Espace).';
    const vad = startVAD(l => { youMeter.style.width = `${Math.min(100, l * 900)}%`; });
    const rec = startRecognition(null);
    let recorder = null; const chunks = [];
    if (s.env.recordAudio) {
      recorder = recorderFor(mic.stream);
      if (recorder) { recorder.ondataavailable = e => e.data.size && chunks.push(e.data); try { recorder.start(1000); } catch (e) { recorder = null; } }
    }
    const tick = setInterval(() => {
      const el = (performance.now() - t0) / 1000;
      youClock.textContent = step.part === 2 && step.cap === 120 ? `${clock(el)} / 2:00` : clock(el);
    }, 250);
    const reason = await new Promise(resolve => {
      finishTurn = resolve;
      setTimeout(() => resolve('cap'), capSeconds * 1000);
    });
    finishTurn = null;
    clearInterval(tick);
    doneBtn.disabled = true;
    you.classList.remove('active');
    youMeter.style.width = '0%';
    const duration = (performance.now() - t0) / 1000;
    const v = vad.stop();
    let blob = null;
    if (recorder) {
      blob = await new Promise(res => { recorder.onstop = () => res(new Blob(chunks, { type: recorder.mimeType || 'audio/webm' })); try { recorder.stop(); } catch (e) { res(null); } });
    }
    const r = rec ? await rec.stop() : { text: '', conf: null, error: 'unsupported' };
    return { reason, duration: round1(duration), ...v, text: r.text, conf: r.conf, srError: r.error, blob };
  }

  for (let i = s.idx; i < SPEAKING_STEPS.length; i++) {
    if (leaving) return;
    const step = SPEAKING_STEPS[i];
    partLabel.textContent = `Part ${step.part}`;
    topicLabel.textContent = step.topic || (step.part === 2 ? 'Long turn' : '');
    question.hidden = true; showQ.hidden = true;
    if (step.kind === 'say') {
      if (step.part === 2) { card.hidden = false; notes.hidden = false; }
      if (step.part === 3) { card.hidden = true; notes.hidden = true; }
      await say(step.prompt);
    } else if (step.kind === 'prep') {
      card.hidden = false; notes.hidden = false;
      hint.textContent = 'Prépare-toi : tu as une minute. Note quelques idées si tu veux.';
      prepBtn.hidden = false;
      let left = step.secs;
      youClock.textContent = `Preparation ${clock(left)}`;
      await new Promise(resolve => {
        const iv = setInterval(() => { left -= 1; youClock.textContent = `Preparation ${clock(left)}`; if (left <= 0) { clearInterval(iv); resolve(); } }, 1000);
        prepBtn.onclick = () => { clearInterval(iv); s.prepUsed = step.secs - left; resolve(); };
        app.onLeave(() => clearInterval(iv));
      });
      s.prepUsed = s.prepUsed ?? step.secs;
      prepBtn.hidden = true;
    } else {
      if (step.part === 3 || step.part === 1) { card.hidden = true; notes.hidden = true; }
      if (step.id === 'p2-round-1') { card.hidden = true; notes.hidden = true; }
      const promptId = step.prompt === 'greet' ? greetId() : step.prompt;
      let shown = false;
      question.textContent = step.text;
      showQ.onclick = () => { shown = true; question.hidden = false; showQ.hidden = true; };
      await say(promptId);
      if (leaving) return;
      showQ.hidden = step.part === 2 && step.cap === 120;
      let res = await turn(step, step.cap);
      if (res.reason === 'leave') return;
      let more = false;
      if (step.min && res.reason === 'done' && res.duration < step.min && step.more) {
        more = true;
        await say(step.more);
        const extra = await turn(step, Math.max(10, step.cap - res.duration));
        if (extra.reason === 'leave') return;
        res = merge(res, extra);
      }
      if (res.reason === 'cap') await say(step.end || 'thanks');
      else if (step.end) await say(step.end);
      const stats = speechStats(res.text, Math.max(1, res.duration - res.latency));
      s.items[step.id] = {
        part: step.part, topic: step.topic, question: step.text,
        duration: res.duration, latency: res.latency, speech: res.speech, pauses1: res.pauses1, pauses2: res.pauses2, longest: res.longest,
        transcript: res.text, conf: res.conf != null ? Math.round(res.conf * 100) / 100 : null, srError: res.srError || null,
        words: stats.words, wpm: stats.wpm, fillers: stats.fillerTotal,
        capped: res.reason === 'cap', shown, more, recorded: !!res.blob
      };
      if (res.blob) idb.put(`sp-${step.id}`, res.blob).catch(() => {});
    }
    s.idx = i + 1;
    store.save();
  }

  s.status = 'done';
  s.finishedAt = Date.now();
  store.save();
  closeMic();
  app.sectionDone('speaking');
}

function closeMic() {
  if (!mic) return;
  mic.stream.getTracks().forEach(t => t.stop());
  mic.ctx.close().catch(() => {});
  mic = null;
}

function merge(a, b) {
  return {
    reason: b.reason, duration: round1(a.duration + b.duration), latency: a.latency, speech: round1(a.speech + b.speech),
    pauses1: a.pauses1 + b.pauses1 + 1, pauses2: a.pauses2 + b.pauses2, longest: Math.max(a.longest, b.longest),
    text: `${a.text} ${b.text}`.trim(), conf: a.conf ?? b.conf, srError: a.srError || b.srError,
    blob: a.blob || b.blob
  };
}

const round1 = x => Math.round(x * 10) / 10;

export function micAvailable() { return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia); }
export const speechRecognitionSupported = !!SR;
