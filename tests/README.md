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
2. `validate-static.js` — storage keys stay `byteroots-profiles` and `byteroots-settings`, paths stay relative, the service worker cache is `byteryte-v13`, and the copy does not claim outside review or a paid gem.
3. `validate-docs.js` — every lesson and interview topic has an official docs URL, and each URL returns HTTP 200.
4. `validate-java.js` — every Java “what does this print?” snippet is compiled and run with `javac --release 21`.
5. `validate-swift.js` — the same for Swift, using `SWIFT` if set, otherwise `/tmp/swift/swift-6.0.3-RELEASE-ubuntu24.04/usr/bin/swift`. If no toolchain is installed the script skips and says so.
6. Playwright, against `http://127.0.0.1:8877/ByteRyte/` so the app is served the way GitHub Pages serves it.

Playwright projects:

| Project | Viewport | Theme |
| --- | --- | --- |
| phone-light | 390×844 | light |
| phone-dark | 390×844 | dark |
| desk-light | 1280×800 | light |
| desk-dark | 1280×800 | dark |

Smoke tests (every screen, counts, contrast, one lesson, settings) run in all four and fail on any console error or page error. The longer flows — all lessons, every interview topic, hearts and the clock, shop, streaks, profiles, import/export, migration, and axe — run on `phone-dark` and `desk-light`, so both sizes and both themes are covered. The offline service-worker check runs once on `desk-light`.

Useful slices:

```bash
npm run test:data
npm run test:ui
npx playwright test e2e/smoke.spec.js --project=phone-light
```
