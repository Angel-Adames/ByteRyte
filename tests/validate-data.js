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
const { gradeTyped } = require(path.join(root, 'grade.js'));
const types = new Set(['mc', 'out', 'fill', 'ar', 'bug', 'fix', 'type']);

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
    if (u.quiz) checkQuiz(t.id, u);
  }
}
const swiftEss = TRACKS.find(t => t.id === 'swift').units.find(u => u.uid === 'essentials');
if (!swiftEss.quiz || swiftEss.quiz.id !== 'swift.essentials.quiz') bad('swift essentials quiz missing');
let quizCount = 0;
for (const t of TRACKS) for (const u of t.units) if (u.quiz) quizCount++;
if (quizCount !== 1) bad('quiz count ' + quizCount + ' (this pilot authors Swift Essentials only)');
const seenIv = new Map();
IV.forEach((e, i) => {
  if (!e.tag || !e.track) bad('iv meta ' + i);
  checkEx('iv-' + i + ' ' + e.tag, e);
  const key = JSON.stringify([e.t, e.q, e.code || '', e.opts || e.lines || []]);
  if (seenIv.has(key)) bad('duplicate interview ' + i + ' matches ' + seenIv.get(key));
  else seenIv.set(key, i);
});

function checkQuiz(track, u) {
  const q = u.quiz;
  if (!q.id || !/^[\w.]+$/.test(q.id)) bad('quiz id ' + track + ' ' + u.uid);
  if (q.name !== 'Unit check') bad('quiz name ' + q.id);
  if (!Array.isArray(q.ex) || q.ex.length < 5 || q.ex.length > 8) bad('quiz length ' + q.id);
  if (!Number.isInteger(q.pass) || q.pass < 1 || q.pass > q.ex.length) bad('quiz pass ' + q.id);
  if (!q.ex.some(e => e.t === 'type')) bad('quiz has no typed question ' + q.id);
  q.ex.forEach((e, i) => checkEx(q.id + '~' + i, e));
}

function checkEx(id, e) {
  exercises++;
  if (!types.has(e.t)) bad('type ' + id + ' ' + e.t);
  if (!e.why || String(e.why).trim().length < 12) bad('why ' + id);
  if (e.t === 'type') return checkTyped(id, e);
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

function checkTyped(id, e) {
  if (typeof e.q !== 'string' || e.q.length < 8) bad('typed prompt ' + id);
  if (typeof e.canon !== 'string' || !e.canon.trim()) bad('canon ' + id);
  if (!Array.isArray(e.alts)) bad('alts ' + id);
  if (!['strict', 'space', 'free'].includes(e.grade)) bad('grade ' + id + ' ' + e.grade);
  if (!['optional', 'required'].includes(e.semi)) bad('semi ' + id);
  if (e.grade !== 'free' && e.semi !== 'required') bad('non-free semi ' + id);
  if (e.out != null && typeof e.out !== 'string') bad('out ' + id);
  if (!gradeTyped(e, e.canon)) bad('canon rejected ' + id);
  e.alts.forEach(a => { if (!gradeTyped(e, a)) bad('alt rejected ' + id + ' ' + a); });
  if (gradeTyped(e, '') || gradeTyped(e, '   ')) bad('empty accepted ' + id);
  if (gradeTyped(e, e.canon + 'X')) bad('suffix accepted ' + id);
  const identGlued = e.canon.replace(/([A-Za-z_])\s+([A-Za-z_])/g, '$1$2');
  if (identGlued !== e.canon && gradeTyped(e, identGlued)) bad('ident glued accepted ' + id + ' ' + identGlued);
  if (e.grade === 'strict') {
    const messy = e.canon.replace(/ /g, '  ');
    if (messy !== e.canon && gradeTyped(e, messy)) bad('strict accepted extra space ' + id);
    if (gradeTyped(e, e.canon + ';')) bad('strict accepted semicolon ' + id);
  } else if (!gradeTyped(e, e.canon.replace(/ /g, '  '))) bad('spacing rejected ' + id);
  if (e.grade === 'free' && e.semi === 'optional' && !gradeTyped(e, e.canon + ';')) bad('free rejected semicolon ' + id);
  if ((e.grade === 'space' || e.grade === 'strict') && gradeTyped(e, e.canon + ';')) bad('semicolon accepted ' + id);
  if (e.grade === 'space' && !gradeTyped(e, e.canon.replace(/([()])/g, ' $1 '))) bad('space around punctuation rejected ' + id);
  const raw = e.canon.replace(/"([^"\\\n#]*)"/g, '#"$1"#');
  if (raw !== e.canon && e.quotes && !gradeTyped(e, raw)) bad('raw quote rejected ' + id);
  if (raw !== e.canon && !e.quotes && gradeTyped(e, raw)) bad('raw quote accepted ' + id);
  const single = e.canon.replace(/"([^"\\\n]*)"/g, "'$1'");
  if (single !== e.canon && gradeTyped(e, single)) bad('single quote accepted ' + id);
  const curly = e.canon.replace(/"([^"\\\n]*)"/g, '\u201c$1\u201d');
  if (curly !== e.canon && gradeTyped(e, curly)) bad('curly quote accepted ' + id);
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

const historical = {
  java: [['java.types','java.strings','java.control','java.methods','java.arrays'],['java.classes','java.inherit','java.interfaces','java.refs','java.exceptions'],['java.lists','java.maps','java.lambdas','java.records','java.sort'],['java.recursion','java.bigo','java.threads'],['java.solid','java.files','java.junit','java.patterns'],['java.abs','java.genmethods','java.checked','java.pipes','java.records2','java.enums','java.bigo2']],
  javafx: [['fx.life','fx.layout','fx.events','fx.css','fx.tasks'],['fx.alerts','fx.windows','fx.lists']],
  css: [['css.html','css.box','css.flex','css.responsive','css.vars'],['css.forms','css.position','css.a11y']],
  swift: [['swift.basics','swift.values','swift.errors','swift.protocols','swift.enums'],['swift.strings','swift.throws','swift.lists']],
};
const every = { done: { 'java-0-9': 1, 'note': 1 }, review: {}, misses: {}, saved: {} };
for (const [track, units] of Object.entries(historical)) {
  units.forEach((lessons, ui) => lessons.forEach((id, li) => {
    const k = track + '-' + ui + '-' + li;
    every.done[k] = 1;
    every.review[k + '-0'] = { box: 1 };
    every.misses[k] = 3;
    every.saved[k + '-2'] = 4;
  }));
}
migrateProgress(every);
for (const [track, units] of Object.entries(historical)) {
  units.forEach((lessons, ui) => lessons.forEach((id, li) => {
    const k = track + '-' + ui + '-' + li;
    assert(every.done[id] === 1 && !every.done[k], 'done ' + k + ' -> ' + id);
    assert(every.review[id + '~0'] && every.review[id + '~0'].box === 1 && !every.review[k + '-0'], 'review ' + id);
    assert(every.misses[id] === 3 && !every.misses[k], 'miss ' + id);
    assert(every.saved[id + '~2'] === 4 && !every.saved[k + '-2'], 'saved ' + id);
  }));
}
assert(every.done['java-0-9'] === 1 && every.done.note === 1, 'unknown and out-of-range keys stay');
assert(every.gates && every.gates.css && every.gates.javafx, 'complete old unit 1 opens both gates');
assert(every.curriculum === 2, 'historical stamp');
const partial = { done: { 'java-0-0': 1, 'java-0-1': 1 }, curriculum: 1 };
migrateProgress(partial);
assert(partial.done['java.types'] && partial.done['java.strings'] && !partial.done['java.control'] && !partial.gates, 'curriculum 1 partial unit does not open gates');
const blank = {};
migrateProgress(blank);
assert(blank.curriculum === 2 && blank.done && !blank.done['java.types'], 'empty save only gets the stamp');

function has(s) { if (!src.includes(s)) bad('missing wording: ' + s); }
function lacks(s) { if (src.includes(s)) bad('stale wording: ' + s); }
lacks('arrays are the next lesson');
has('Methods is the next lesson');
lacks('Tap the useless arm');
has('The default arm compiles, and it never runs');
has('runs init() on the launcher thread');
has('updateProgress and progressProperty report progress');
lacks('finally always runs');
has('unless the process exits first');
lacks('Interface methods are public. Interface fields');
has('An interface may also declare private methods');
lacks('There is no zero-argument sort on a list');
has('Collections.sort(list) or list.sort(Comparator.naturalOrder())');
lacks('own/parent font size');
has('on font-size it uses the parent');
lacks('await does not block the thread');
has('await suspends this task');
lacks('new code should not use it');
has('NavigationView is deprecated');
lacks('display: none (and visibility: hidden) remove');
has('Among these four, only display: none');
lacks('Interfaces may only have constants');
has('An interface cannot hold instance fields');
lacks('Class::method is shorthand');
has('bound instance method reference');
lacks('An enum would erase the fields');
has('not two records that keep different fields');
lacks('null-safe on the left');
has('does not throw if either side is null');
has('Error is also unchecked');
has('Scanner scanner = new Scanner(System.in) reads typed text. nextLine() returns one new String');
lacks('HashMap/HashSet will misbehave');
has('Hash-based collections, which you meet in Maps & Sets');
lacks('HashSet.contains is O(1) on average vs O(n) for a list.');
has('The Big-O lesson names these O(1) and O(n).');
lacks('or use pattern matching.');
has('A later lesson, Modern Java, writes that test and cast together as instanceof Cat c.');
has('ArrayDeque is a double-ended queue');
has('A PriorityQueue hands back the smallest next.');
lacks('the box model in the next lesson');
has('the Box Model lesson gets its sizes');
lacks('Records were the previous lessons');
has('Records, earlier in this unit, carry the fields. Sorting is its own lesson.');
lacks('That form is pattern matching.');
has('Pattern matching (instanceof String s) was the Modern Java lesson. This lesson does not add a new form of it.');
lacks('From background threads use Platform.runLater');
has('A later lesson, Concurrency & Tasks, shows Platform.runLater');
lacks('ListView displays an ObservableList of items.');
has('The Lists & Selection lesson shows the observable list');
lacks('position: absolute is positioned relative to');
has('The second argument of var() is the fallback');
lacks('map with a trailing closure');
has('An array is a struct. Assigning copies the values');
lacks('You call label.setText on a property that is currently bound.');
has('show() displays the dialog and returns immediately.');
lacks('Same idea as web CSS but -fx- prefixed.');
has('JavaFX prefixes the name so it does not collide with the web property font-weight.');
lacks('Specificity (inline, then #id, then class, then element) is how the cascade picks a winner');
has('Inside one cascade layer, specificity picks the winner');
has('Unlayered author styles sit above every cascade layer');
has('1vw is 1% of the layout viewport width');
has('The Protocols, Closures & Collections lesson, after errors, is where you write one.');
lacks('super(...) must be the first statement');
has('Java 25 allows earlier statements');
lacks('Creating threads is expensive; pools reuse them.');
has('A Java 21 virtual thread is cheap');
has('getFirst() and getLast()');
lacks('Pattern matching for instanceof (Java 16+) casts and binds s in one step.');
has('This is the pattern from the Modern Java lesson');
lacks('A classic opener question.');
has('== asks whether two variables point at the same object');
lacks('Java 8+ uses trees for big buckets: O(log n)');
has('the worst case is still O(n)');
has('Java 25 can omit the class and use void main()');
has('Pooling Java 21 virtual threads');
has('ordinary on Java 21 and Java 25');

const exKey = e => JSON.stringify([e.t, e.q || '', e.code || '', e.opts || e.lines || []]);
const seenAll = new Map();
const seenCode = new Map();
function note(id, e) {
  const k = exKey(e);
  if (seenAll.has(k)) bad('duplicate exercise ' + id + ' matches ' + seenAll.get(k));
  else seenAll.set(k, id);
  if (e.t === 'out' && e.code) {
    if (seenCode.has(e.code)) bad('duplicate output ' + id + ' matches ' + seenCode.get(e.code));
    else seenCode.set(e.code, id);
  }
}
for (const t of TRACKS) for (const u of t.units) {
  for (const l of u.lessons) l.ex.forEach((e, i) => note(l.id + '~' + i, e));
  if (u.quiz) u.quiz.ex.forEach((e, i) => note(u.quiz.id + '~' + i, e));
}
IV.forEach((e, i) => note('iv-' + i, e));

function keyed(prefix, choice) {
  const hits = [];
  const take = e => { if (e.q && e.q.startsWith(prefix)) hits.push(e); };
  for (const t of TRACKS) for (const u of t.units) for (const l of u.lessons) l.ex.forEach(take);
  IV.forEach(take);
  if (hits.length !== 1) bad('keyed lookup ' + prefix + ' hits ' + hits.length);
  else if (!hits[0].opts || hits[0].opts[hits[0].a] !== choice) bad(prefix + ' answer ' + (hits[0].opts && hits[0].opts[hits[0].a]));
}
keyed('getSelectedItem() when the user has not clicked anything returns', 'null');
keyed('ListView.getSelectionModel().getSelectedItem() with nothing selected returns', 'null');
keyed('Inside catch, the thrown value is available as', 'error');
keyed('A button click is handled with', 'setOnAction');
keyed('Comparing two enum constants with == is', 'Safe. Each constant is a singleton, and == does not throw if either side is null');

if (issues.length) {
  console.error('validate-data FAIL ' + issues.length);
  console.error(issues.join('\n'));
  process.exit(1);
}
console.log('validate-data PASS lessons=' + lessons + ' exercises=' + exercises + ' interview=' + IV.length + ' fixes=' + fixes + ' outs=' + outs);
