// Typed answers: normalize, then exact-match the canonical line and the listed
// alternatives. The page cannot compile learner Swift. tests/validate-swift.js
// compiles every accepted form with the Swift toolchain.
// strict: trim the ends only. space: collapse insignificant whitespace.
// free: space rules, plus one optional trailing semicolon when semi is optional.
// quotes: fold a simple raw string #"text"# into "text" when the text has no
// quote, backslash, or hash. Semantic twins (let x: Int = 5, n = n + 1) are
// explicit alts, not guesses.
function gradeTyped(q, input) {
  if (!q || input == null) return false;
  const spec = specOf(q);
  const raw = String(input).normalize('NFC').replace(/^\s+|\s+$/g, '');
  if (!raw) return false;
  const got = normalizeTyped(input, spec);
  if (!got) return false;
  const accepted = [q.canon].concat(Array.isArray(q.alts) ? q.alts : []);
  return accepted.some(a => typeof a === 'string' && a.length > 0 && normalizeTyped(a, spec) === got);
}

function acceptedSources(q) {
  const out = [];
  const list = [q && q.canon].concat(q && Array.isArray(q.alts) ? q.alts : []);
  list.forEach(a => { if (typeof a === 'string' && a.length) out.push(a); });
  if (q && q.quotes) {
    out.slice().forEach(a => {
      const raw = a.replace(/"([^"\\\n#]*)"/g, '#"$1"#');
      if (raw !== a && gradeTyped(q, raw)) out.push(raw);
    });
  }
  return out;
}

function specOf(q) {
  return { grade: (q && q.grade) || 'free', semi: (q && q.semi) || 'optional', quotes: !!(q && q.quotes) };
}

function normalizeTyped(text, spec) {
  const mode = spec && spec.grade || 'free';
  let s = String(text == null ? '' : text).normalize('NFC');
  if (spec && spec.quotes) s = foldRawStrings(s);
  if (mode === 'strict') return s.replace(/^\s+|\s+$/g, '');
  let tokens = tokenize(s);
  if (mode === 'free' && (!spec || spec.semi !== 'required') && tokens.length && tokens[tokens.length - 1].v === ';') tokens = tokens.slice(0, -1);
  return joinTokens(tokens);
}

function foldRawStrings(src) {
  let out = '';
  let i = 0;
  while (i < src.length) {
    if (src[i] === '#' && src[i + 1] === '"') {
      let j = i + 2;
      let body = '';
      let simple = true;
      let closed = false;
      while (j < src.length) {
        const c = src[j];
        if (c === '"' && src[j + 1] === '#') {
          closed = true;
          if (simple) out += '"' + body + '"';
          else out += src.slice(i, j + 2);
          i = j + 2;
          break;
        }
        if (c === '\\' || c === '"' || c === '#' || c === '\n' || c === '\r') simple = false;
        body += c;
        j++;
      }
      if (!closed) { out += src.slice(i); break; }
      continue;
    }
    if (src[i] === '"') {
      if (src.startsWith('"""', i)) {
        const end = src.indexOf('"""', i + 3);
        if (end < 0) { out += src.slice(i); break; }
        out += src.slice(i, end + 3);
        i = end + 3;
        continue;
      }
      let j = i + 1;
      while (j < src.length) {
        if (src[j] === '\\') { j += 2; continue; }
        if (src[j] === '"') { j++; break; }
        j++;
      }
      out += src.slice(i, j);
      i = j;
      continue;
    }
    out += src[i];
    i++;
  }
  return out;
}

const TWO = { '==': 1, '!=': 1, '<=': 1, '>=': 1, '+=': 1, '-=': 1, '*=': 1, '/=': 1, '%=': 1, '->': 1, '&&': 1, '||': 1, '??': 1, '?.': 1 };
function isWs(c) { return c === ' ' || c === '\t' || c === '\n' || c === '\r' || c === '\f' || c === '\v'; }
function isPunct(c) { return '.,;:()[]{}=+*-/<>!&|?%@~^\\`'.indexOf(c) >= 0; }
function isWord(c) { return !!c && !isWs(c) && c !== '"' && c !== "'" && !isPunct(c); }

function tokenize(src) {
  const s = src;
  const n = s.length;
  const tokens = [];
  let i = 0;
  while (i < n) {
    const c = s[i];
    if (isWs(c)) { i++; continue; }
    if (c === '"') {
      if (s.startsWith('"""', i)) {
        const end = s.indexOf('"""', i + 3);
        const j = end < 0 ? n : end + 3;
        tokens.push({ k: 'str', v: s.slice(i, j) });
        i = j;
        continue;
      }
      let j = i + 1;
      while (j < n) {
        if (s[j] === '\\') { j += 2; continue; }
        if (s[j] === '"') { j++; break; }
        j++;
      }
      tokens.push({ k: 'str', v: s.slice(i, j) });
      i = j;
      continue;
    }
    if (c === '#' && s[i + 1] === '"') {
      let j = i + 2;
      let closed = false;
      while (j < n) {
        if (s[j] === '"' && s[j + 1] === '#') { j += 2; closed = true; break; }
        if (s[j] === '\\') j += 2;
        else j++;
      }
      tokens.push({ k: 'str', v: s.slice(i, closed ? j : n) });
      i = closed ? j : n;
      continue;
    }
    if (c >= '0' && c <= '9') {
      let j = i + 1;
      while (j < n && s[j] >= '0' && s[j] <= '9') j++;
      if (s[j] === '.' && s[j + 1] >= '0' && s[j + 1] <= '9') {
        j++;
        while (j < n && s[j] >= '0' && s[j] <= '9') j++;
      }
      tokens.push({ k: 'num', v: s.slice(i, j) });
      i = j;
      continue;
    }
    if (s.startsWith('...', i)) { tokens.push({ k: 'op', v: '...' }); i += 3; continue; }
    if (s.startsWith('..<', i)) { tokens.push({ k: 'op', v: '..<' }); i += 3; continue; }
    const pair = s.slice(i, i + 2);
    if (TWO[pair]) { tokens.push({ k: 'op', v: pair }); i += 2; continue; }
    if (isWord(c)) {
      let j = i + 1;
      while (j < n && isWord(s[j])) j++;
      tokens.push({ k: 'word', v: s.slice(i, j) });
      i = j;
      continue;
    }
    tokens.push({ k: 'punct', v: c });
    i++;
  }
  return tokens;
}

function glue(tok) { return tok.k === 'word' || tok.k === 'num'; }
function joinTokens(tokens) {
  let out = '';
  for (let i = 0; i < tokens.length; i++) {
    if (i > 0 && glue(tokens[i - 1]) && glue(tokens[i])) out += ' ';
    out += tokens[i].v;
  }
  return out;
}

if (typeof module !== 'undefined' && module.exports) module.exports = { gradeTyped, normalizeTyped, acceptedSources };
