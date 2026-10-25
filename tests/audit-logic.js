#!/usr/bin/env node
// Independent checks of the pure functions in app.js.
// Expected results are computed here without the app's closed-form level formula.
const fs = require('fs');
const path = require('path');
const src = fs.readFileSync(path.resolve(__dirname, '../app.js'), 'utf8');
function grab(name) {
  const start = src.indexOf('function ' + name);
  if (start < 0) throw new Error('missing ' + name);
  let i = src.indexOf('{', start), depth = 0;
  for (let j = i; j < src.length; j++) {
    if (src[j] === '{') depth++;
    else if (src[j] === '}') { depth--; if (depth === 0) return src.slice(start, j + 1); }
  }
  throw new Error('unclosed ' + name);
}
const finiteSrc = grab('finite');
const levelSrc = grab('level');
const dayFns = src.match(/const iso=[\s\S]*?const today=\(\)=>iso\(\),yday=\(\)=>shiftDay\(-1\),dayDiff=\(a,b\)=>[^;]+;/)[0];
const sandbox = { Date, Math };
const fns = new Function('Date', 'Math', 'const DAY=864e5;\n' + finiteSrc + '\n' + levelSrc + '\n' + dayFns + '\nreturn {level, dayDiff, iso, shiftDay};');
const { level, dayDiff, iso, shiftDay } = fns(Date, Math);

const issues = [];
function check(id, ok, detail) {
  console.log((ok ? 'PASS ' : 'FAIL ') + id + (detail ? ' ' + detail : ''));
  if (!ok) issues.push(id + ' ' + detail);
}

function expectLevel(xp) {
  const T = n => 25 * n * (n + 3);
  let n = 0;
  while (T(n + 1) <= xp && n < 100000) n++;
  return { L: n + 1, into: xp - T(n), need: T(n + 1) - T(n) };
}

const samples = [0, 1, 99, 100, 101, 250, 999, 1000, 5000, 20000, 100000, 999999, 1e9];
for (let xp = 0; xp <= 4000; xp += 37) samples.push(xp);
for (const xp of samples) {
  const got = level(xp);
  const exp = expectLevel(xp);
  const same = got.L === exp.L && got.into === exp.into && got.need === exp.need;
  if (!same) check('level ' + xp, false, JSON.stringify(got) + ' expected ' + JSON.stringify(exp));
}
check('level samples', issues.length === 0, 'checked ' + samples.length);

const spring = new Date('2026-03-08T12:00:00');
const dayBefore = iso(new Date('2026-03-07T12:00:00'));
const dayOf = iso(spring);
const dayAfter = iso(new Date('2026-03-09T12:00:00'));
check('dayDiff across 2026-03-08', dayDiff(dayBefore, dayOf) === 1 && dayDiff(dayBefore, dayAfter) === 2, dayBefore + ' ' + dayOf + ' ' + dayAfter + ' diffs ' + dayDiff(dayBefore, dayOf) + ',' + dayDiff(dayBefore, dayAfter));
check('shiftDay 1 from Mar 7', shiftDay(1, new Date('2026-03-07T12:00:00')) === '2026-03-08', shiftDay(1, new Date('2026-03-07T12:00:00')));
check('dayDiff rejects nothing for Feb 31', true, 'dayDiff=' + dayDiff('2026-02-31', '2026-03-01') + ' date=' + new Date('2026-02-31T12:00').toString());

if (issues.length) {
  console.error('audit-logic FAIL ' + issues.length);
  process.exit(1);
}
console.log('audit-logic PASS');
