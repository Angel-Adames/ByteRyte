#!/usr/bin/env node
// Recompile and run every Java "what does this print?" snippet on JDK 21.
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawn } = require('child_process');
const root = path.resolve(__dirname, '..');
const src = fs.readFileSync(path.join(root, 'data.js'), 'utf8') + '\n' + fs.readFileSync(path.join(root, 'interview.js'), 'utf8');
const { TRACKS, IV } = new Function(src + '\nreturn {TRACKS, IV};')();

const snippets = [];
function take(code, expected, where) {
  if (!code || !code.includes('System.out')) return;
  snippets.push({ code, expected: String(expected), where });
}
for (const t of TRACKS) for (const u of t.units) for (const l of u.lessons) {
  l.ex.forEach((e, i) => { if (e.t === 'out') take(e.code, e.opts[e.a], l.id + '~' + i); });
}
IV.forEach((e, i) => { if (e.t === 'out') take(e.code, e.opts[e.a], 'iv-' + i + ' ' + e.tag); });

function peel(src) {
  let i = 0;
  const types = [];
  const n = src.length;
  const isWs = c => c === ' ' || c === '\n' || c === '\r' || c === '\t';
  while (i < n) {
    let j = i;
    while (j < n && isWs(src[j])) j++;
    const m = src.slice(j).match(/^(?:(?:public|private|protected|static|final|sealed|non-sealed|abstract|strictfp)\s+)*(class|interface|enum|record)\b/);
    if (!m) break;
    let k = j + m[0].length;
    while (k < n && src[k] !== '{') k++;
    if (src[k] !== '{') break;
    let depth = 0, str = null, end = k;
    for (; end < n; end++) {
      const c = src[end];
      if (str) {
        if (c === '\\') { end++; continue; }
        if (c === str) str = null;
        continue;
      }
      if (c === '"' || c === "'") { str = c; continue; }
      if (c === '{') depth++;
      else if (c === '}') { depth--; if (depth === 0) { end++; break; } }
    }
    types.push(src.slice(j, end).trim());
    i = end;
  }
  return { types, rest: src.slice(i).trim() };
}

function wrap(code, name) {
  const marker = code.indexOf('// in main:');
  let before = '', main = code.trim();
  if (marker >= 0) {
    before = code.slice(0, marker).trim();
    main = code.slice(marker + '// in main:'.length).trim();
  }
  const peeled = peel(before || (marker < 0 ? code : ''));
  const types = peeled.types;
  const members = marker >= 0 ? peeled.rest : '';
  if (marker < 0) main = peeled.rest || code.trim();
  return `import java.util.*;
import java.util.stream.*;
import java.util.concurrent.*;
import java.util.concurrent.atomic.*;
import java.nio.file.*;
${types.join('\n\n')}
public class ${name} {
${members}
  public static void main(String[] args) throws Exception {
${main}
  }
}
`;
}

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'byteryte-java-'));
snippets.forEach((s, i) => { s.name = 'Snip' + i; });

function run(cmd, args, cwd, timeout) {
  return new Promise(resolve => {
    const child = spawn(cmd, args, { cwd });
    let out = '', err = '';
    const timer = setTimeout(() => { child.kill('SIGKILL'); err += '\nTIMEOUT'; }, timeout);
    child.stdout.on('data', d => { out += d; });
    child.stderr.on('data', d => { err += d; });
    child.on('close', code => { clearTimeout(timer); resolve({ code, out, err }); });
    child.on('error', e => { clearTimeout(timer); resolve({ code: 1, out, err: err + e.message }); });
  });
}

(async () => {
  const bad = [];
  let cursor = 0;
  async function worker() {
    while (cursor < snippets.length) {
      const s = snippets[cursor++];
      const sub = path.join(dir, s.name);
      fs.mkdirSync(sub);
      fs.writeFileSync(path.join(sub, s.name + '.java'), wrap(s.code, s.name));
      const compiled = await run('javac', ['--release', '21', s.name + '.java'], sub, 20000);
      if (compiled.code !== 0) {
        bad.push(s.where + '\n javac ' + compiled.err.trim().split('\n').slice(0, 4).join(' | '));
        continue;
      }
      const ran = await run('java', [s.name], sub, 8000);
      const got = ran.out.replace(/\r\n/g, '\n').replace(/\n$/, '');
      if (ran.code !== 0 || got !== s.expected) bad.push(s.where + '\n expected ' + JSON.stringify(s.expected) + '\n got ' + JSON.stringify(got) + (ran.err ? '\n ' + ran.err.trim().split('\n').slice(0, 3).join(' | ') : ''));
    }
  }
  await Promise.all(Array.from({ length: 8 }, worker));
  if (bad.length) {
    console.error('validate-java FAIL ' + bad.length + '/' + snippets.length + '\n' + bad.slice(0, 15).join('\n---\n'));
    process.exit(1);
  }
  console.log('validate-java PASS snippets=' + snippets.length + ' jdk=21');
})();
