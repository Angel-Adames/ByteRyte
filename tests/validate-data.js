#!/usr/bin/env node
// Exercise shape, explanations, and saved-progress migration.
const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const src = fs.readFileSync(path.join(root, 'data.js'), 'utf8') + '\n' + fs.readFileSync(path.join(root, 'interview.js'), 'utf8');
const { TRACKS, IV, migrateProgress } = new Function(src + '\nreturn {TRACKS, migrateProgress, IV};')();

const issues = [];
const ids = new Set();
let lessons = 0, exercises = 0, fixes = 0, outs = 0;
const types = new Set(['mc', 'out', 'fill', 'ar', 'bug', 'fix']);

function bad(msg) { issues.push(msg); }

for (const t of TRACKS) {
  if (!t.id || !t.name || !Array.isArray(t.units)) bad('track ' + t.id);
  for (const u of t.units) {
    if (!u.uid || !u.name) bad('unit uid ' + t.id + ' ' + u.name);
    for (const l of u.lessons) {
      lessons++;
      if (!l.id || ids.has(l.id)) bad('lesson id ' + l.id);
      ids.add(l.id);
      if (!l.tip || l.tip.length < 40) bad('tip ' + l.id);
      if (!Array.isArray(l.sheet) || l.sheet.length < 3) bad('sheet ' + l.id);
      if (!l.ex || !l.ex.length) bad('no exercises ' + l.id);
      if (!l.ex.some(e => e.t === 'fix')) bad('no fix ' + l.id);
      l.ex.forEach((e, i) => checkEx(l.id + '~' + i, e));
    }
  }
}
IV.forEach((e, i) => {
  if (!e.tag || !e.track) bad('iv meta ' + i);
  checkEx('iv-' + i + ' ' + e.tag, e);
});

function checkEx(id, e) {
  exercises++;
  if (!types.has(e.t)) bad('type ' + id + ' ' + e.t);
  if (!e.why || String(e.why).trim().length < 12) bad('why ' + id);
  if (e.t === 'ar') {
    if (!Array.isArray(e.lines) || e.lines.length < 2) bad('ar lines ' + id);
    return;
  }
  if (e.t === 'bug') {
    if (!Array.isArray(e.lines) || e.lines.length < 2) bad('bug lines ' + id);
    if (!Number.isInteger(e.a) || e.a < 0 || e.a >= e.lines.length) bad('bug index ' + id + ' ' + e.a);
    return;
  }
  fixes += e.t === 'fix' ? 1 : 0;
  outs += e.t === 'out' ? 1 : 0;
  if (!Array.isArray(e.opts) || e.opts.length < 2) bad('opts ' + id + ' ' + typeof e.opts);
  if (!Number.isInteger(e.a) || e.a < 0 || e.a >= (e.opts ? e.opts.length : 0)) bad('answer index ' + id + ' a=' + e.a);
  if (Array.isArray(e.opts)) {
    const norm = e.opts.map(o => String(o).trim());
    if (new Set(norm).size !== norm.length) bad('duplicate options ' + id + ' ' + JSON.stringify(norm));
    if (norm[e.a] === '') bad('blank correct option ' + id);
  }
  if ((e.t === 'out' || e.t === 'fix' || e.t === 'fill') && typeof e.code !== 'string') bad('code ' + id);
  if (e.t === 'fill' && typeof e.code === 'string' && !e.code.includes('___')) bad('fill blank ' + id);
  if ((e.t === 'mc' || e.t === 'out') && !e.q && e.t !== 'out') bad('question ' + id);
}

function assert(cond, msg) { if (!cond) bad('migration ' + msg); }
const p = {
  done: { 'java-0-0': 1, 'java-0-1': 1, 'java-0-2': 1, 'java-0-3': 1, 'java-0-4': 1, 'java-2-3': 1 },
  review: { 'java-1-3-7': { box: 0, due: 1 } },
  misses: { 'css-0-1': 2 },
  saved: { 'swift-1-2-8': 9, 'iv-3': 4 },
};
migrateProgress(p);
assert(p.done['java.types'] && p.done['java.strings'] && p.done['java.control'] && p.done['java.methods'] && p.done['java.arrays'], 'drill ids');
assert(p.done['java.records'], 'records id');
assert(!p.done['java-0-0'] && !p.done['java.run'], 'old key cleared and new lesson not invented');
assert(p.gates && p.gates.css && p.gates.javafx, 'old unit 1 kept both branches open');
assert(p.review['java.refs~7'] && p.review['java.refs~7'].box === 0, 'review key');
assert(p.misses['css.box'] === 2, 'miss key');
assert(p.saved['swift.lists~8'] === 9 && p.saved['iv-3'] === 4, 'saved keys');
assert(p.curriculum === 2, 'curriculum stamp');
const again = JSON.parse(JSON.stringify(p));
migrateProgress(again);
assert(again.done['java.types'] && again.saved['iv-3'] === 4 && again.gates.css, 'second pass keeps ids');

if (issues.length) {
  console.error('validate-data FAIL ' + issues.length);
  console.error(issues.join('\n'));
  process.exit(1);
}
console.log('validate-data PASS lessons=' + lessons + ' exercises=' + exercises + ' interview=' + IV.length + ' fixes=' + fixes + ' outs=' + outs);
