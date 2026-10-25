#!/usr/bin/env node
// Branding, storage keys, relative paths, and the service-worker cache name.
const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const read = f => fs.readFileSync(path.join(root, f), 'utf8');
const issues = [];
const bad = m => issues.push(m);
const app = read('app.js'), sw = read('sw.js'), index = read('index.html'), manifest = read('manifest.webmanifest'), css = read('style.css');
const all = [app, sw, index, manifest, css, read('data.js'), read('interview.js'), read('README.md')].join('\n');

if (!/const C='byteryte-v13'/.test(sw)) bad('service worker cache is not byteryte-v13');
if (!/start_url"\s*:\s*"\.\/"/.test(manifest) || !/"scope"\s*:\s*"\.\/"/.test(manifest)) bad('manifest start_url and scope must stay relative ./');
if (!/serviceWorker\.register\('sw\.js'\)/.test(index)) bad('service worker must register as sw.js');
if (/register\(['"]\/|register\(['"]https?:/.test(index)) bad('service worker registration is not relative');
if (!app.includes("PK='byteroots-profiles'") || !app.includes("GK='byteroots-settings'")) bad('storage keys changed');
if (/peer reviewed/i.test(all)) bad('peer reviewed claim');
if (/duolingo/i.test(all)) bad('non-original brand name');
if (!/no real money involved/.test(app)) bad('gems must stay in-app only');
if (!/Just for fun: no real money involved/.test(app)) bad('shop copy missing');
for (const icon of ['icons/icon.svg', 'icons/icon-180.png', 'icons/icon-192.png', 'icons/icon-512.png']) {
  if (!fs.existsSync(path.join(root, icon))) bad('missing ' + icon);
}
if (!fs.existsSync(path.join(root, '.nojekyll'))) bad('missing .nojekyll');

if (issues.length) {
  console.error('validate-static FAIL\n' + issues.join('\n'));
  process.exit(1);
}
console.log('validate-static PASS');
