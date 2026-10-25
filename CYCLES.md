# Review cycles 1–25

Batch 1 of the repeated review. Each cycle names what was checked, what was found, what changed, and the test that proved the result. A cycle that found no defect says so.

Final combined run is recorded at the bottom. Playwright deep flows run on `phone-dark` (390×844, dark) and `desk-light` (1280×800, light). Smoke runs on all four projects. The other two projects skip the deep flows on purpose, which is why the Playwright total includes skips.

## Cycle 1 — Exercise data shape

Checked every lesson exercise and every interview question for type, correct index in range, duplicate choices, and a non-empty explanation.

Found two crashing `X()` calls. `css.render` passed the options array where the code string belongs, and `swift.async` passed an extra string, so `opts.map` threw on the last question of each lesson. Identical arrange braces in `java.interfaces` and two identical `add(l)` lines in `fx.layout` were checked and left: order is preserved, and equal lines compare equal.

Fix: corrected both call signatures in `data.js`.

Verification: `validate-data.js` PASS (`lessons=62`, `exercises=683` including interview items, `interview=139`, `fixes=62`, `outs=217`). The first run failed on those two exercises.

## Cycle 2 — Java print accuracy

Checked every Java “what does this print?” snippet with `javac --release 21` and `java`.

Found no wrong answers. The first harness compiled every file in one directory and failed with duplicate class names (`Point`, `P`, `Shape`). That was the harness.

Fix: compile and run each snippet in its own directory (`tests/validate-java.js`).

Verification: `validate-java.js` PASS `snippets=175` on JDK 21.

## Cycle 3 — Swift print accuracy

Checked every Swift print snippet with Swift 6.0.3.

Found nothing wrong.

Verification: `validate-swift.js` PASS `snippets=42`, Swift 6.0.3.

## Cycle 4 — Documentation links

Checked that every lesson name and every interview tag maps to an official URL, then fetched each URL.

Found nothing wrong.

Verification: `validate-docs.js` PASS `urls=53`, each HTTP 200.

## Cycle 5 — Static rules and the cache name

Checked storage key names, relative `manifest` and `sw.js`, the gems copy, icons, `.nojekyll`, and that the copy does not say the app was peer reviewed or use another brand’s name.

Found the cache still named `byteryte-v12`.

Fix: `sw.js` now uses `byteryte-v13`.

Verification: `validate-static.js` PASS. An earlier draft of that script looked for `const GK=` and false-failed, because the keys are declared together. The assertion was corrected, then the script passed.

## Cycle 6 — Levels, huge numbers, and untrusted profile text

Checked level boundaries at 100, 249, and 250 XP, then a profile with `1e20` XP, gems, and streak, a non-numeric heart count, a goal of 0, and a name and avatar containing markup. Phone and desktop.

Found the old level loop walks one level at a time and does not return on a huge XP value. Profile names and avatars were inserted as HTML. The header printed the full gem count, which overflows a 390px screen.

Fix: closed-form `level()`, `sanitize()` caps (XP and gems `1e9`, streak `1e5`, hearts 0–5, goal forced to 10/30/50/100), `compact()` for the header and shop, `esc()` on names and avatars, and `overflow-wrap` on the big profile figures. The accessible name still has the full gem count.

Verification: `levels follow the xp curve and huge xp still renders` PASS on phone-dark and desk-light. The first UI run failed only the locator: `getByText('Level 2')` also matched the rail line `Level 2 · 0/150 XP`. The level text on screen was already right.

## Cycle 7 — Hearts, midnight, and zero hearts

Checked +1 heart after 31 minutes, a full refill when `heartDay` is yesterday, and a lesson blocked at 0 hearts while Practice and Interview still open. Clock fixed at 2026-06-15 12:00.

Found nothing wrong.

Verification: `hearts regenerate, refill at midnight, and block lessons at zero` PASS on phone-dark and desk-light.

## Cycle 8 — Streak freeze and a jumped clock

Checked one missed day with a freeze, two missed days with no freeze, and a streak whose last day is yesterday. Same fixed clock.

Found nothing wrong.

Verification: `streak freeze covers one missed day and resets when it cannot` PASS on phone-dark and desk-light.

## Cycle 9 — Shop and every power-up

Checked heart refill, streak freeze, 50/50, skip, and double XP starting from 400 gems and 3 hearts, then a second freeze up to the max of 2, then a wallet of 0 with hearts full and freezes maxed.

Found nothing wrong. Costs land on 235 gems, then 185. Full and Max buttons are disabled.

Verification: `shop buys every power-up and refuses an empty wallet` PASS on phone-dark and desk-light.

## Cycle 10 — Keyboard, 50/50, and skip

Checked Skip (no heart lost), 50/50, and key `1` selecting the first choice that is still enabled. Also checked the shortcut paragraph in Settings.

Found two mismatches. After 50/50 the number keys still counted eliminated rows, and the badges were not renumbered. Settings said keys 1–6 while the handler accepts 1–9.

Fix: disabled rows are skipped and their badges cleared; the settings sentence says 1–9.

Verification: `50/50, skip, and number keys ignore eliminated choices` PASS. `guide, quit, and one correct answer` (keys 1 and Enter) PASS on all four projects. `every screen opens` reads the 1–9 sentence PASS on all four projects.

## Cycle 11 — Two clicks on Check

Checked two real mouse clicks on the Check button, not a programmatic click.

Found the second click could land on Continue and skip the explanation.

Fix: `shield()` ignores pointer events on the feedback footer for 450ms.

Verification: `a second click does not skip the explanation` PASS on phone-dark and desk-light. The explanation stays on screen.

## Cycle 12 — Review, saved questions, and the speed challenge

Checked a wrong answer, Save, the review queue, a correct review, saved practice, Remove, and a speed challenge whose clock jumps 70 seconds.

Found no app defect. A correct answer in the saved session advances the same spaced-repetition box, so the item is no longer due today. The first test did the saved session before Review and then waited on a disabled Review button until the 180s timeout.

Fix: the test reviews first, then expects the item to be scheduled (box 1, Review disabled), then runs saved practice, removes it, and fast-forwards the challenge.

Verification: `review, saved questions, and a speed challenge` PASS on phone-dark and desk-light. A focused rerun passed in 2.3s before the full run.

## Cycle 13 — Replaying a finished lesson

Checked `java.run` completed twice.

Found a replay incremented `stats.lessons`, the daily lesson log, and the lessons quest.

Fix: those three increment only the first time. XP still increases. The perfect-lesson quest can still fire.

Verification: `replaying a lesson does not inflate the lesson count` PASS on phone-dark and desk-light.

## Cycle 14 — Placement

Checked the placement button on a new profile, then which lessons it marks done and which tracks open.

Found nothing wrong. CSS opens. JavaFX stays closed. `java.run` stays undone.

Verification: `placement opens HTML and CSS only` PASS on phone-dark and desk-light.

## Cycle 15 — Old saves

Checked an index-style profile (`java-0-0` through `java-0-4`, `java-2-3`, review `java-1-3-7`, miss `css-0-1`, saved `swift-1-2-8` and `iv-3`) and a legacy `byteroots-v1` blob with 42 XP and a streak of 3.

Found nothing wrong. Keys stay `byteroots-profiles` and `byteroots-settings`. Both branches open when the old Java unit 0 and the records lesson were done. The v1 blob becomes one profile.

Verification: `old index saves migrate and keep the storage keys` PASS. `legacy single-profile save becomes a profile` PASS. The migration unit check inside `validate-data.js` PASS.

## Cycle 16 — Profiles

Checked create Sam, switch to Ada, switch back, delete Sam from Edit profile, and the absence of Delete when one profile remains.

Found nothing wrong. Delete is on Edit profile, and it asks for confirmation.

Verification: `profiles can be created, switched, and deleted` PASS on phone-dark and desk-light.

## Cycle 17 — Export and import

Checked export of a ByteRyte v2 file, import with a changed name and 80 XP, a file that is not a backup, and importing the good file a second time.

Found the file input kept its value, so choosing the same file again did not fire `change`.

Fix: clear the input at the start of `onchange`.

Verification: `export and import round-trip, including the same file twice` PASS on phone-dark and desk-light.

## Cycle 18 — Corrupt storage

Checked `localStorage` profiles set to `{`.

Found nothing wrong. The app shows onboarding instead of throwing.

Verification: `corrupt storage boots instead of hanging` PASS on phone-dark and desk-light.

## Cycle 19 — Every interview topic

Checked every topic chip, answering every question in that topic, a score of 100, and an interview count equal to the number of topics.

Found nothing wrong.

Verification: `mock interview covers every topic` PASS on phone-dark and desk-light.

## Cycle 20 — Every lesson

Checked Java, then HTML & CSS, then JavaFX, then Swift, completing whatever lesson is current until the track has none left.

Found nothing beyond the two crashed exercises in cycle 1. With those fixed, all 62 lessons complete, hearts stay at 5, and the Java Master badge appears.

Verification: `every lesson can be completed in order` PASS on phone-dark and desk-light.

## Cycle 21 — Accessibility

Checked axe serious and critical violations on home, a lesson, practice, interview, shop, profile, and settings. Checked contrast for muted body text and the lesson kind label. Checked the accessible names of the main nav.

Found the nav icon was part of the button name (`🎯 Practice`), so a control named exactly Practice did not exist.

Fix: the decorative icon is `aria-hidden`.

Verification: `axe home`, `axe lesson`, `axe practice`, `axe interview`, `axe shop`, `axe profile`, `axe settings` PASS on phone-dark and desk-light. `body text and lesson labels meet contrast` PASS on all four projects (ratio above 4.5). `every screen opens` clicks the exact names Practice, Interview, Shop, and Profile PASS on all four projects.

## Cycle 22 — Offline under /ByteRyte/

Checked service-worker registration, cache name `byteryte-v13`, a reload while offline, and that the URL still contains `/ByteRyte/`.

Found nothing beyond the cache bump in cycle 5.

Verification: `offline reload under /ByteRyte/ uses cache v13` PASS on desk-light. It is skipped on the other projects so the offline pass runs once.

## Cycle 23 — Themes, viewports, and settings that survive reload

Checked 390×844 and 1280×800, light and dark, for overflow on every main screen plus weekly recap and settings. Checked larger text and sound after reload. Checked that home renders within 5 seconds.

Found no app defect. The first settings failure was the test seed writing `big: false` again on reload.

Fix: the seed writes once per stamp and leaves a reload alone.

Verification: `settings keep larger text, sound, and theme` PASS on all four projects. `every screen opens in this theme and viewport` PASS on all four projects. `home stays responsive` PASS on phone-dark and desk-light.

## Cycle 24 — Path counts, the guide, quit, and locked branches

Checked 0/34 Java, 0/10 CSS, 0/8 JavaFX, 0/10 Swift, the Unit 1 guide (8 cards), Quit back to home, the locked CSS and JavaFX explanations, and that Swift is open with no lock box.

Found nothing wrong.

Verification: `home shows the foundation path and accurate counts`, `guide, quit, and one correct answer`, and `locked branches explain what they wait for` PASS on all four projects.

## Cycle 25 — Console errors, the daily-goal toast, and browser Back

Checked that every Playwright test fails on a page error or a console error. Checked the toast after a perfect first lesson. Checked whether the app uses the History API.

Found no console errors and no page errors. Finishing `java.run` with a perfect score crosses the 30 XP goal and toasts `Daily goal reached`. That toast is correct. A locator for the words Daily goal also matched the toast; the tests now require an exact match. The app does not call `pushState`. Guide and weekly recap have their own Back controls, and those are covered in cycles 16 and 24. The browser Back button leaves the page, because this is a single-URL app. That was not changed.

Verification: full `npx playwright test` — 77 passed, 51 skipped, exit 0. No test failed the console check. `answering the open lesson records progress` PASS on all four projects, including the exact Daily goal heading after the toast.

## Final verification

`npm test` from `tests/` exited 0:

- `validate-data.js` PASS
- `validate-static.js` PASS
- `validate-docs.js` PASS, 53 URLs
- `validate-java.js` PASS, 175 snippets, JDK 21
- `validate-swift.js` PASS, 42 snippets, Swift 6.0.3
- Playwright PASS, 77 passed, 51 skipped (28.7s)

The 51 skips are the deep specs on `phone-light` and `desk-dark`, plus the offline spec off `desk-light`. Those flows ran on the other project in the pair.

## Not covered, and why

- The browser Back button is not wired. In-app Back is tested. Adding history was left alone so a single-URL install does not grow a second navigation model in this batch.
- Audio output was not listened to. The sound switch is stored and restored; most tests keep sound off so autoplay does not create console noise.
- A phone home-screen install outside Chromium was not tested. The offline path was tested in Chromium at `/ByteRyte/`.
- Swift is tested here because 6.0.3 is installed. `validate-swift.js` skips with exit 0 when the toolchain is absent, so a machine without Swift does not fail the suite.
