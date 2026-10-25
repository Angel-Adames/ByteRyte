#!/usr/bin/env node
// Branding, storage keys, relative paths, and the service-worker cache name.
const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const read = f => fs.readFileSync(path.join(root, f), 'utf8');
const issues = [];
const bad = m => issues.push(m);
const app = read('app.js'), sw = read('sw.js'), index = read('index.html'), manifest = read('manifest.webmanifest'), css = read('style.css'), boot = read('boot.js');
const all = [app, sw, index, manifest, css, boot, read('data.js'), read('interview.js'), read('README.md')].join('\n');

if (!/const C='byteryte-v17'/.test(sw)) bad('service worker cache is not byteryte-v17');
if (!sw.includes("'boot.js'")) bad('service worker precache is missing boot.js');
if (!/start_url"\s*:\s*"\.\/"/.test(manifest) || !/"scope"\s*:\s*"\.\/"/.test(manifest)) bad('manifest start_url and scope must stay relative ./');
if (!/serviceWorker\.register\('sw\.js'\)/.test(boot)) bad('service worker must register as sw.js');
if (/register\(['"]\/|register\(['"]https?:/.test(boot + index)) bad('service worker registration is not relative');
if (/<script(?![^>]*\bsrc=)[^>]*>/.test(index)) bad('index.html still has an inline script');
if (!/src="boot\.js"/.test(index)) bad('index.html must load boot.js');
const csp = (index.match(/Content-Security-Policy" content="([^"]+)"/) || [])[1] || '';
if (!csp) bad('missing Content-Security-Policy meta');
if (!/script-src 'self'/.test(csp)) bad('CSP script-src must be self');
if (/script-src[^;]*unsafe-inline/.test(csp)) bad('CSP script-src must not allow unsafe-inline');
if (!/style-src 'self' 'unsafe-inline'/.test(csp)) bad('CSP style-src must allow inline style attributes');
if (csp.includes('frame-ancestors')) bad('frame-ancestors is ignored in a meta tag');
if (!css.includes('env(safe-area-inset-top)') || !css.includes('env(safe-area-inset-bottom)')) bad('safe-area insets missing');
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
