#!/usr/bin/env node
// Copy the static site into www/ for the iOS shell. GitHub Pages keeps serving the repository root.
const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const dest = path.join(root, 'www');
const files = [
  'index.html', 'style.css', 'app.js', 'data.js', 'interview.js', 'grade.js',
  'boot.js', 'sw.js', 'manifest.webmanifest', 'onboarding.js', 'courses.js',
  'chest.js', 'rytia.js',
];
fs.rmSync(dest, { recursive: true, force: true });
fs.mkdirSync(dest, { recursive: true });
for (const file of files) fs.copyFileSync(path.join(root, file), path.join(dest, file));
fs.cpSync(path.join(root, 'icons'), path.join(dest, 'icons'), { recursive: true });
fs.copyFileSync(path.join(root, 'scripts', 'native.js'), path.join(dest, 'native.js'));
const indexPath = path.join(dest, 'index.html');
let html = fs.readFileSync(indexPath, 'utf8');
html = html.replace(
  'width=device-width, initial-scale=1, viewport-fit=cover',
  'width=device-width, initial-scale=1, viewport-fit=cover, interactive-widget=resizes-content'
);
if (!html.includes('native.js')) {
  html = html.replace('<script src="boot.js"></script>', '<script src="native.js"></script><script src="boot.js"></script>');
}
fs.writeFileSync(indexPath, html);
console.log('bundled', files.length + 1, 'files into www/');
