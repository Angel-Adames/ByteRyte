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
2. `validate-static.js` — storage keys stay `byteroots-profiles` and `byteroots-settings`, paths stay relative, the service worker cache is `byteryte-v15`, and the copy does not claim outside review or a paid gem.
3. `validate-docs.js` — every lesson and interview topic has an official docs URL, and each URL returns HTTP 200.
4. `validate-java.js` — every Java “what does this print?” snippet is compiled and run with `javac --release 21`.
5. `validate-swift.js` — the same for Swift, using `SWIFT` if set, otherwise `/tmp/swift/swift-6.0.3-RELEASE-ubuntu24.04/usr/bin/swift`. If no toolchain is installed the script skips and says so.
6. `validate-ambiguity.js` — a bug exercise’s correct line is not repeated, and a multiple-choice, fill, output, or fix answer is not repeated. Identical arrange lines are reported and allowed.
7. `validate-perf.js` — the first-load files (`index.html`, `style.css`, `app.js`, `data.js`, `interview.js`, `sw.js`, `manifest.webmanifest`) stay under 400000 bytes.
8. Playwright, against `http://127.0.0.1:8877/ByteRyte/` (and 8878, 8879, 8880, one origin per project) so the app is served the way GitHub Pages serves it and offline caches do not share an origin.

Playwright projects:

| Project | Viewport | Theme |
| --- | --- | --- |
| phone-light | 390×844 | light |
| phone-dark | 390×844 | dark |
| desk-light | 1280×800 | light |
| desk-dark | 1280×800 | dark |

Smoke tests (every screen, counts, contrast, one lesson, settings) run in all four and fail on any console error or page error. The longer flows — all lessons, every interview topic, hearts and the clock, shop, streaks, profiles, import/export, migration, and axe — run on all four projects. The offline service-worker check runs once on `desk-light`.

Useful slices:

```bash
npm run test:data
npm run test:ui
npx playwright test e2e/smoke.spec.js --project=phone-light
```
