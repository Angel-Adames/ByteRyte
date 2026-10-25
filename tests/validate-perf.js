#!/usr/bin/env node
// Uncompressed first-load budget. The service worker precaches these same files.
const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const files = ['index.html', 'style.css', 'app.js', 'data.js', 'interview.js', 'sw.js', 'manifest.webmanifest'];
const limit = 400000;
let total = 0;
const parts = files.map(f => {
  const n = fs.statSync(path.join(root, f)).size;
  total += n;
  return f + '=' + n;
});
if (total > limit) {
  console.error('validate-perf FAIL bytes=' + total + ' limit=' + limit + ' ' + parts.join(' '));
  process.exit(1);
}
console.log('validate-perf PASS bytes=' + total + ' limit=' + limit);
