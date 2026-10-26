#!/usr/bin/env node
// Rytia notes: one summary per exercise, one note per wrong choice, no duplicates.
const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const src = fs.readFileSync(path.join(root, 'data.js'), 'utf8') + '\n' + fs.readFileSync(path.join(root, 'interview.js'), 'utf8');
const { TRACKS, IV } = new Function(src + '\nreturn {TRACKS, IV};')();
const self = {};
new Function('self', fs.readFileSync(path.join(root, 'rytia.js'), 'utf8'))(self);
const RYTIA = self.RYTIA;

const issues = [];
const bad = m => issues.push(m);
const flat = s => String(s == null ? '' : s).replace(/\s+/g, ' ').trim();

function sentences(text) {
  const s = String(text).replace(/\s+/g, ' ').trim();
  const out = [];
  let cur = '';
  let quote = false;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (c === '"') quote = !quote;
    cur += c;
    if (quote) continue;
    if (c !== '.' && c !== '!' && c !== '?') continue;
    const prev = s[i - 1] || '';
    const next = s[i + 1];
    const after = next === ' ' ? (s[i + 2] || '') : '';
    if (c === '.' && /\d/.test(prev) && next && /\d/.test(next)) continue;
    if (c === '.' && /[A-Za-z]/.test(prev) && next && /[A-Za-z]/.test(next)) continue;
    if (/\b(e\.g\.|i\.e\.|vs\.|Mr\.|Dr\.)$/.test(cur)) continue;
    if (next && next !== ' ') continue;
    if ((c === '!' || c === '?') && after && !/[A-Z"(]/.test(after)) continue;
    out.push(cur.trim());
    cur = '';
    if (next === ' ') i++;
  }
  if (cur.trim()) out.push(cur.trim());
  return out.filter(Boolean);
}

function mentions(summary, e) {
  if (e.t === 'ar') {
    const lines = e.lines.map(flat);
    if (lines.some(t => t.length >= 4 && t.length <= 60 && summary.includes(t))) return true;
    return (e.lines.join(' ').match(/[A-Za-z_][A-Za-z0-9_]{5,}/g) || []).some(t => summary.includes(t));
  }
  const label = e.t === 'bug' ? flat(e.lines[e.a]) : flat(e.opts[e.a]);
  if (label.length <= 80) return summary.includes(label);
  return summary.includes(label.slice(0, 24));
}

if (!RYTIA || typeof RYTIA !== 'object' || Array.isArray(RYTIA)) bad('self.RYTIA missing');
const items = [];
for (const t of TRACKS) for (const u of t.units) for (const l of u.lessons) {
  l.ex.forEach((e, i) => items.push({ key: l.id + '~' + i, e }));
}
IV.forEach((e, i) => items.push({ key: 'iv-' + i, e }));

const seen = new Map();
let notes = 0;
const keys = new Set(items.map(it => it.key));
if (RYTIA) Object.keys(RYTIA).forEach(k => { if (!keys.has(k)) bad('extra rytia key ' + k); });

for (const it of items) {
  const row = RYTIA && RYTIA[it.key];
  if (!row || typeof row.s !== 'string') { bad('missing summary ' + it.key); continue; }
  const s = flat(row.s);
  if (seen.has(s)) bad('duplicate summary ' + it.key + ' == ' + seen.get(s));
  else seen.set(s, it.key);
  if (s.length < 60 || s.length > 280) bad('summary length ' + s.length + ' ' + it.key);
  const nsent = sentences(row.s).length;
  if (nsent < 1 || nsent > 2) bad('summary sentences ' + nsent + ' ' + it.key);
  if (s === flat(it.e.why)) bad('summary copies the explanation ' + it.key);
  if (!mentions(row.s, it.e)) bad('summary misses the correct answer ' + it.key);
  if (/peer reviewed|duolingo|live (ai|model)/i.test(row.s)) bad('summary claim ' + it.key);
  if (it.e.t === 'ar') {
    if (row.n && Object.keys(row.n).length) bad('arrange notes ' + it.key);
    continue;
  }
  const list = it.e.t === 'bug' ? it.e.lines : it.e.opts;
  if (!row.n || typeof row.n !== 'object' || Array.isArray(row.n)) { bad('missing notes ' + it.key); continue; }
  const got = Object.keys(row.n).sort();
  const want = list.map((_, i) => String(i)).filter(i => Number(i) !== it.e.a).sort();
  if (got.join() !== want.join()) bad('note keys ' + it.key + ' got ' + got.join(',') + ' want ' + want.join(','));
  const local = new Set();
  for (const k of got) {
    notes++;
    const note = flat(row.n[k]);
    if (note.length < 24 || note.length > 160) bad('note length ' + note.length + ' ' + it.key + '#' + k);
    if (local.has(note)) bad('duplicate note ' + it.key + '#' + k);
    local.add(note);
    const shown = it.e.t === 'bug' ? ('Line ' + (Number(k) + 1)) : flat(list[Number(k)]);
    const need = shown.length <= 40 ? shown : shown.slice(0, 16);
    if (!note.includes(need)) bad('note does not name choice ' + it.key + '#' + k);
    if (/peer reviewed|duolingo/i.test(note)) bad('note claim ' + it.key + '#' + k);
  }
}

if (issues.length) {
  console.error('validate-rytia FAIL\n' + issues.slice(0, 40).join('\n'));
  process.exit(1);
}
console.log('validate-rytia PASS summaries=' + items.length + ' notes=' + notes);
