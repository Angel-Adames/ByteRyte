# ByteRyte regression suite

From the repository root:

```bash
cd tests
npm install
npx playwright install chromium
npm test
```

`npm test` runs, in order:

1. `validate-data.js` — every lesson and interview exercise has a known type, a correct index in range, no duplicate choices, and a real explanation. It also checks that old `java-0-0` style progress keys migrate to stable lesson ids.
2. `validate-rytia.js` — every exercise, interview item, and unit-check question has a unique Rytia summary, and every wrong choice has a note that points at that choice. Typed questions have a summary and no choice notes.
3. `validate-static.js` — storage keys stay `byteroots-profiles` and `byteroots-settings`, paths stay relative, the service worker cache is `byteryte-v27`, the page has no inline script, and the copy does not claim outside review or a paid gem.
4. `validate-docs.js` — every lesson and interview topic has an official docs URL, and each URL returns HTTP 200.
5. `validate-java.js` — every Java “what does this print?” snippet is compiled and run with `javac --release 21`.
6. `validate-swift.js` — the same for Swift, plus every typed-answer canonical line, listed alternative, and simple raw-string form. It uses `SWIFT` if set, otherwise `/tmp/swift/swift-6.0.3-RELEASE-ubuntu24.04/usr/bin/swift`. If no toolchain is installed the script skips and says so.
7. `validate-ambiguity.js` — a bug exercise’s correct line is not repeated, and a multiple-choice, fill, output, or fix answer is not repeated. Identical arrange lines are reported and allowed.
8. `validate-perf.js` — the first-load files (`index.html`, `style.css`, `app.js`, `data.js`, `interview.js`, `grade.js`, `boot.js`, `sw.js`, `manifest.webmanifest`) stay under 400000 bytes. `rytia.js` is precached for offline use and is not part of that first load.
9. Playwright, against `http://127.0.0.1:8877/ByteRyte/` (and 8878, 8879, 8880, one origin per project) so the app is served the way GitHub Pages serves it and offline caches do not share an origin.

Playwright projects:

| Project | Viewport | Theme |
| --- | --- | --- |
| phone-light | 390×844 | light |
| phone-dark | 390×844 | dark |
| desk-light | 1280×800 | light |
| desk-dark | 1280×800 | dark |

Smoke tests (every screen, counts, contrast, one lesson, settings) run in all four and fail on any console error or page error. The longer flows — all lessons, every interview topic, hearts and the clock, shop, streaks, profiles, import/export, migration, axe, the 50-lesson soak, and the slow-4G load — run on all four projects. A gzip stand-in for Pages listens on port 8881 and serves the same `/ByteRyte/` tree.

Useful slices:

```bash
npm run test:data
npm run test:ui
npx playwright test e2e/smoke.spec.js --project=phone-light
```
