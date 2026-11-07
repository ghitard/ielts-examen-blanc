// Objective indicators for Writing and Speaking productions. They do not replace marking
// against the band descriptors; they give the examiner (and the training plan) evidence.

const STOP = new Set(('a an the and or but if of to in on at by for with from as is are was were be been being it its this that these those ' +
  'there their they them he she his her we our you your i me my mine not no so do does did have has had will would can could should ' +
  'may might must than then also very more most much many some any such which who whom whose what when where why how all each other into ' +
  'about over after before up down out off just only even both either neither while because although though since until per').split(' '));

const LINKERS = {
  addition: ['moreover', 'furthermore', 'in addition', 'additionally', 'what is more', 'besides', 'also'],
  contrast: ['however', 'nevertheless', 'nonetheless', 'on the other hand', 'whereas', 'while', 'although', 'even though', 'despite', 'in spite of', 'yet', 'conversely', 'in contrast', 'by contrast', 'on the contrary'],
  cause: ['therefore', 'thus', 'consequently', 'as a result', 'hence', 'because', 'since', 'due to', 'owing to', 'accordingly', 'for this reason'],
  example: ['for example', 'for instance', 'such as', 'in particular', 'notably', 'namely', 'to illustrate'],
  sequence: ['firstly', 'secondly', 'thirdly', 'first of all', 'finally', 'lastly', 'subsequently', 'meanwhile', 'to begin with'],
  conclusion: ['in conclusion', 'to conclude', 'to sum up', 'in summary', 'all in all', 'on balance', 'overall'],
  comparison: ['similarly', 'likewise', 'compared to', 'compared with', 'in comparison', 'by comparison', 'in the same way']
};

const TREND = ['rose', 'risen', 'increase', 'increased', 'grew', 'grown', 'climbed', 'surged', 'soared', 'jumped', 'rocketed', 'fell', 'fallen', 'declined', 'decreased', 'decrease', 'dropped', 'plummeted', 'plunged', 'dipped', 'peaked', 'peak', 'plateaued', 'plateau', 'levelled', 'leveled', 'stabilised', 'stabilized', 'remained', 'fluctuated', 'overtook', 'overtaken', 'surpassed', 'doubled', 'halved', 'tripled', 'steadily', 'sharply', 'dramatically', 'gradually', 'slightly', 'significantly', 'considerably', 'marginally', 'rapidly', 'steeply'];
const SUBORD = ['which', 'who', 'whom', 'whose', 'that', 'although', 'though', 'because', 'since', 'unless', 'whereas', 'while', 'if', 'when', 'whether', 'so that', 'in order to', 'even if', 'provided that'];
const FILLERS = ['um', 'uh', 'er', 'erm', 'hmm', 'ah', 'like', 'you know', 'i mean', 'kind of', 'sort of', 'basically', 'actually'];

export function tokens(text) {
  return (text || '').toLowerCase().replace(/[’']/g, "'").match(/[a-zà-ÿ0-9]+(?:[-'][a-zà-ÿ0-9]+)*/g) || [];
}

function countPhrase(lower, phrase) {
  const re = new RegExp(`(^|[^a-z])${phrase.replace(/ /g, '\\s+')}(?=[^a-z]|$)`, 'g');
  return (lower.match(re) || []).length;
}

// Moving-average type–token ratio over 50-token windows: stable whatever the length.
export function mattr(tok, win = 50) {
  if (tok.length === 0) return 0;
  if (tok.length <= win) return new Set(tok).size / tok.length;
  let sum = 0, n = 0;
  for (let i = 0; i + win <= tok.length; i++) { sum += new Set(tok.slice(i, i + win)).size / win; n++; }
  return sum / n;
}

export function repeated(tok, min = 4) {
  const freq = {};
  for (const t of tok) if (!STOP.has(t) && t.length > 3 && !/^\d/.test(t)) freq[t] = (freq[t] || 0) + 1;
  return Object.entries(freq).filter(([, c]) => c >= min).sort((a, b) => b[1] - a[1]).slice(0, 8);
}

export function writingStats(text, task) {
  const raw = text || '';
  const lower = raw.toLowerCase().replace(/[’]/g, "'");
  const tok = tokens(raw);
  const wordCount = raw.trim() ? raw.trim().split(/\s+/).length : 0;
  const paragraphs = raw.split(/\n\s*\n|\n(?=\s*\S)/).map(p => p.trim()).filter(p => p.split(/\s+/).length >= 3);
  const sentences = raw.replace(/\s+/g, ' ').split(/(?<=[.!?])\s+(?=[A-Z0-9"‘'])/).map(s => s.trim()).filter(s => s.split(/\s+/).length >= 3);
  const lens = sentences.map(s => s.split(/\s+/).length);
  const avg = lens.length ? lens.reduce((a, b) => a + b, 0) / lens.length : 0;
  const sd = lens.length ? Math.sqrt(lens.reduce((a, b) => a + (b - avg) ** 2, 0) / lens.length) : 0;

  const linkerHits = {};
  let linkerTotal = 0;
  for (const [cat, list] of Object.entries(LINKERS)) {
    for (const p of list) {
      const c = countPhrase(lower, p);
      if (c) { linkerHits[p] = c; linkerTotal += c; }
    }
  }
  const contractions = (lower.match(/\b(?:\w+n't|it's|that's|there's|i'm|you're|we're|they're|can't|won't|let's|i've|we've|they've|i'll|we'll|it'll|isn't|aren't|doesn't|don't|didn't)\b/g) || []).length;
  const firstPerson = (lower.match(/\b(i|me|my|mine)\b/g) || []).length;
  const numbers = (raw.match(/\b\d+(?:[.,]\d+)?\s*(?:%|per cent|percent)?/g) || []).length;
  const longWords = tok.filter(t => t.length >= 8).length;
  const subord = SUBORD.reduce((a, s) => a + countPhrase(lower, s), 0);
  const passive = (lower.match(/\b(?:is|are|was|were|be|been|being)\s+(?:\w+ly\s+)?\w+(?:ed|en|wn|lt|ught|ght)\b/g) || []).length;
  const trendWords = new Set(tok.filter(t => TREND.includes(t)));

  const firstPara = (paragraphs[0] || '').toLowerCase();
  const lastPara = (paragraphs[paragraphs.length - 1] || '').toLowerCase();
  const overview = /\b(overall|in general|generally|it is clear|it is evident|it can be seen|the most (?:striking|noticeable|significant)|in summary|to sum up)\b/.test(lower);
  const position = /\b(i (?:strongly |firmly |would |personally )?(?:believe|think|agree|disagree|argue|feel)|in my (?:opinion|view)|my (?:own )?view|from my (?:perspective|point of view)|personally)\b/.test(lower);
  const conclusion = /\b(in conclusion|to conclude|to sum up|in summary|all in all|on balance|overall)\b/.test(lastPara);
  const introRestatesPrompt = task === 2 && /sugar|fast food|tax/.test(firstPara);

  return {
    words: wordCount,
    paragraphs: paragraphs.length,
    sentences: sentences.length,
    avgSentence: round1(avg),
    sentenceSpread: round1(sd),
    longestSentence: lens.length ? Math.max(...lens) : 0,
    lexicalDiversity: round2(mattr(tok)),
    longWordRatio: tok.length ? round2(longWords / tok.length) : 0,
    linkers: linkerHits,
    linkerTotal,
    linkerVariety: Object.keys(linkerHits).length,
    linkersPer100: tok.length ? round1(linkerTotal / tok.length * 100) : 0,
    subordinators: subord,
    passives: passive,
    contractions,
    firstPerson,
    numbers,
    trendVariety: trendWords.size,
    repeated: repeated(tok),
    overview: task === 1 ? overview : undefined,
    position: task === 2 ? position : undefined,
    conclusion: task === 2 ? conclusion : undefined,
    introTopic: task === 2 ? introRestatesPrompt : undefined
  };
}

export function speechStats(text, seconds) {
  const tok = tokens(text);
  const lower = ' ' + (text || '').toLowerCase() + ' ';
  const fillers = {};
  let fillerTotal = 0;
  for (const f of FILLERS) { const c = countPhrase(lower, f); if (c) { fillers[f] = c; fillerTotal += c; } }
  return {
    words: tok.length,
    wpm: seconds > 3 ? Math.round(tok.length / seconds * 60) : 0,
    fillers, fillerTotal,
    lexicalDiversity: round2(mattr(tok)),
    longWordRatio: tok.length ? round2(tok.filter(t => t.length >= 8).length / tok.length) : 0
  };
}

const round1 = x => Math.round(x * 10) / 10;
const round2 = x => Math.round(x * 100) / 100;
