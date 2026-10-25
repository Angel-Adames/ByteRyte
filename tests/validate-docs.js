#!/usr/bin/env node
// Every lesson and interview topic should point at a current official page that resolves.
const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');
const root = path.resolve(__dirname, '..');
const app = fs.readFileSync(path.join(root, 'app.js'), 'utf8');
const data = fs.readFileSync(path.join(root, 'data.js'), 'utf8') + '\n' + fs.readFileSync(path.join(root, 'interview.js'), 'utf8');
const start = app.indexOf('const DJ=');
const end = app.indexOf('const plural=');
if (start < 0 || end < 0) {
  console.error('validate-docs FAIL could not find DOCS block');
  process.exit(1);
}
const { DOCS, IVDOC } = new Function(app.slice(start, end) + '\nreturn {DOCS, IVDOC};')();
const { TRACKS, IV } = new Function(data + '\nreturn {TRACKS, IV};')();
const issues = [];
for (const t of TRACKS) for (const u of t.units) for (const l of u.lessons) {
  if (!DOCS[l.name]) issues.push('no doc for lesson ' + l.name);
}
for (const tag of new Set(IV.map(q => q.tag))) {
  if (!IVDOC[tag]) issues.push('no doc for interview tag ' + tag);
}
const urls = [...new Set([...Object.values(DOCS), ...Object.values(IVDOC)])];
if (issues.length) {
  console.error(issues.join('\n'));
  process.exit(1);
}

function get(url, hops = 0) {
  return new Promise((resolve) => {
    const lib = url.startsWith('https:') ? https : http;
    const req = lib.get(url, { headers: { 'user-agent': 'ByteRyte-curriculum-check' }, timeout: 20000 }, res => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location && hops < 5) {
        res.resume();
        const next = new URL(res.headers.location, url).href;
        resolve(get(next, hops + 1));
        return;
      }
      res.resume();
      resolve(res.statusCode);
    });
    req.on('timeout', () => { req.destroy(); resolve('timeout'); });
    req.on('error', e => resolve(e.code || e.message));
  });
}

(async () => {
  const bad = [];
  let i = 0;
  async function worker() {
    while (i < urls.length) {
      const url = urls[i++];
      const status = await get(url);
      if (status !== 200) bad.push(status + ' ' + url);
    }
  }
  await Promise.all(Array.from({ length: 6 }, worker));
  if (bad.length) {
    console.error('validate-docs FAIL\n' + bad.join('\n'));
    process.exit(1);
  }
  console.log('validate-docs PASS urls=' + urls.length);
})();
