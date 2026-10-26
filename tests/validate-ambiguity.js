#!/usr/bin/env node
// A question is ambiguous when the correct bug line, or the correct option text, appears more than once.
// Arrange exercises compare the joined lines, so identical lines stay legal and are only counted.
const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const src = fs.readFileSync(path.join(root, 'data.js'), 'utf8') + '\n' + fs.readFileSync(path.join(root, 'interview.js'), 'utf8');
const { TRACKS, IV } = new Function(src + '\nreturn {TRACKS, IV};')();

const issues = [];
let arrangeDupes = 0;

function bad(msg) { issues.push(msg); }

function check(id, e) {
  if (e.t === 'ar') {
    if (Array.isArray(e.lines) && new Set(e.lines).size !== e.lines.length) arrangeDupes++;
    return;
  }
  if (e.t === 'bug') {
    if (!Array.isArray(e.lines) || !Number.isInteger(e.a)) return;
    const correct = String(e.lines[e.a]);
    const hits = e.lines.filter(line => String(line) === correct).length;
    if (hits > 1) bad(id + ' repeats the correct bug line ' + hits + ' times: ' + JSON.stringify(correct));
    return;
  }
  if (!Array.isArray(e.opts) || !Number.isInteger(e.a)) return;
  const correct = String(e.opts[e.a]).trim();
  const hits = e.opts.filter(opt => String(opt).trim() === correct).length;
  if (correct !== '' && hits > 1) bad(id + ' repeats the correct option ' + hits + ' times: ' + JSON.stringify(correct));
}

for (const t of TRACKS) for (const u of t.units) {
  for (const l of u.lessons) l.ex.forEach((e, i) => check(l.id + '~' + i, e));
  if (u.quiz) u.quiz.ex.forEach((e, i) => check(u.quiz.id + '~' + i, e));
}
IV.forEach((e, i) => check('iv-' + i, e));

if (issues.length) {
  console.error('validate-ambiguity FAIL ' + issues.length);
  console.error(issues.join('\n'));
  process.exit(1);
}
console.log('validate-ambiguity PASS arrange-duplicates=' + arrangeDupes);
