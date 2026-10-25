#!/usr/bin/env node
// Run every Swift print snippet when a Swift toolchain is installed.
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawn } = require('child_process');
const root = path.resolve(__dirname, '..');
const src = fs.readFileSync(path.join(root, 'data.js'), 'utf8') + '\n' + fs.readFileSync(path.join(root, 'interview.js'), 'utf8');
const { TRACKS, IV } = new Function(src + '\nreturn {TRACKS, IV};')();

const candidates = [
  process.env.SWIFT,
  '/tmp/swift/swift-6.0.3-RELEASE-ubuntu24.04/usr/bin/swift',
  '/usr/bin/swift',
].filter(Boolean);
const swift = candidates.find(p => { try { return fs.existsSync(p); } catch (e) { return false; } });
if (!swift) {
  console.log('validate-swift SKIP no Swift toolchain on PATH or /tmp/swift. Print answers were not executed this run.');
  process.exit(0);
}

const snippets = [];
function take(code, expected, where) {
  if (!code || code.includes('System.out') || !code.includes('print(')) return;
  snippets.push({ code, expected: String(expected), where });
}
for (const t of TRACKS) for (const u of t.units) for (const l of u.lessons) {
  l.ex.forEach((e, i) => { if (e.t === 'out') take(e.code, e.opts[e.a], l.id + '~' + i); });
}
IV.forEach((e, i) => { if (e.t === 'out') take(e.code, e.opts[e.a], 'iv-' + i); });

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'byteryte-swift-'));
function run(file) {
  return new Promise(resolve => {
    const child = spawn(swift, [file], { cwd: dir });
    let out = '', err = '';
    const timer = setTimeout(() => { child.kill('SIGKILL'); err += '\nTIMEOUT'; }, 90000);
    child.stdout.on('data', d => { out += d; });
    child.stderr.on('data', d => { err += d; });
    child.on('close', code => { clearTimeout(timer); resolve({ code, out, err }); });
  });
}

(async () => {
  const bad = [];
  let cursor = 0;
  async function worker() {
    while (cursor < snippets.length) {
      const s = snippets[cursor++];
      const file = path.join(dir, 's' + cursor + '.swift');
      fs.writeFileSync(file, s.code + '\n');
      const ran = await run(file);
      const got = ran.out.replace(/\r\n/g, '\n').replace(/\n$/, '');
      if (ran.code !== 0 || got !== s.expected) bad.push(s.where + '\n expected ' + JSON.stringify(s.expected) + '\n got ' + JSON.stringify(got) + (ran.err ? '\n ' + ran.err.trim().split('\n').slice(-4).join(' | ') : ''));
    }
  }
  await Promise.all(Array.from({ length: 3 }, worker));
  if (bad.length) {
    console.error('validate-swift FAIL ' + bad.length + '/' + snippets.length + '\n' + bad.slice(0, 8).join('\n---\n'));
    process.exit(1);
  }
  const ver = await new Promise(resolve => {
    const c = spawn(swift, ['--version']);
    let o = '';
    c.stdout.on('data', d => { o += d; });
    c.on('close', () => resolve(o.split('\n')[0]));
  });
  console.log('validate-swift PASS snippets=' + snippets.length + ' ' + ver);
})();
