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

# Review cycles 26–50

Batch 2. Deep flows now run on all four projects. The offline check still runs once. A cycle that found no defect says so.

The fixes landed together. `npm test` was run on that set and failed (20 failed, 153 passed, 3 skipped): a 450ms lock on Back and on each shop item also blocked a real second freeze and the next lesson’s Continue. The lock was narrowed to a second call in the same turn. The failed tests were rerun on `phone-light` (8 passed), then the full suite was rerun. The counts below are from that green run unless a cycle names an earlier one.

## Cycle 26 — Browser Back

Checked Shop, then the browser Back button.

Found the app never called `pushState`, so Back left the page.

Fix: each screen pushes a same-URL history entry. In-app Back calls `history.back()`.

Verification: `browser Back returns in the app and a second Back stays on ByteRyte` PASS on all four projects.

## Cycle 27 — Back from the root

Checked a second Back after returning to Learn, which is the swipe that would close a standalone app.

Found the first history entry was the document itself, so one more Back left `/ByteRyte/`.

Fix: that entry is replaced with a sentinel. Popping it pushes Learn again.

Verification: the same test, second `goBack`, still shows Daily goal and the URL still contains `/ByteRyte/`. A reload starts again at Learn (or the welcome screen). Saved settings still survive reload, which cycle 23 covers. Restoring the exact screen after reload was not kept, because a second load in the same tab was reviving a stale entry.

## Cycle 28 — Standalone display mode

Checked `matchMedia('(display-mode: standalone)')` and a Back from the root.

Found no standalone signal in the page.

Fix: `applyTheme` sets `data-standalone` when the display mode matches, or when `navigator.standalone` is true. The header, lesson bar, footer, nav, toast, question, and welcome screen already pad with `safe-area-inset`. No CSS change.

Verification: `standalone display mode keeps Back inside the app` PASS on all four projects. This is a mocked media query in Chromium, not an installed home screen.

## Cycle 29 — Sound

Checked a correct answer with sound on. The test forces `AudioContext.state` to `suspended` and records `createOscillator().start` and `resume`.

Found `tone()` never called `resume()`, so a suspended context could schedule tones that never started.

Fix: call `resume()` when the context is suspended. The success pair is still 660 then 880.

Verification: `a correct answer starts the success tones` PASS on all four projects. The spy saw both frequencies and at least one `resume()`. Nothing was played through speakers.

## Cycle 30 — Deep flows on every project

Checked the long flows (all lessons, every interview topic, shop, streaks, profiles, import, migration, axe) which used to skip `phone-light` and `desk-dark`.

Found no defect that belonged to only one project. The shared fixes in this batch are what those runs needed.

Verification: green `npm test`, Playwright 173 passed, 3 skipped. The skips are the offline spec off `desk-light`.

## Cycle 31 — Malformed import

Checked `{`, `[]`, `null`, a ByteRyte object with no profiles, `profiles: null`, a list that is an array, and a list whose profile is not an object.

Found the importer treated any truthy `profiles.list` as a backup, including an array.

Fix: require a plain object for `profiles` and for `profiles.list`. Anything else toasts and does not open the confirm dialog.

Verification: `malformed backups are rejected and a hostile file cannot change the prototype` PASS on all four projects. A good file after those still imports, in this test and in the existing round-trip test.

## Cycle 32 — Fall-back evening streak

Checked 2026-11-01 23:30 in `America/New_York`, with the last lesson on 2026-10-31 and a streak of 4, then completed `java.run`.

Found `yday()` subtracted 24 hours. On that evening the local date 24 hours earlier is still November 1, so `addXP` reset the streak to 1 instead of making it 5. `dayDiff` was already safe because it compares the dates at noon.

Fix: `shiftDay` uses `setDate`, and `yday()` is the previous calendar day.

Verification: `a fall-back evening increments the streak and the calendar stays unique` PASS on all four projects. Streak 5, last day 2026-11-01, best 5.

## Cycle 33 — Spring-forward noon

Checked 2026-03-08 12:00 in `America/New_York`, last day 2026-03-07, streak 4.

Found nothing wrong. Subtracting 24 hours from that noon already lands on March 7. The fall-back evening in cycle 32 is the case that did not.

Verification: `a spring-forward noon increments the streak` PASS on all four projects. Streak 5, last day 2026-03-08.

## Cycle 34 — Pacific midnight

Checked `America/Los_Angeles` at 2026-06-15 06:59 UTC and 07:00 UTC, with 1 heart and `heartDay` 2026-06-14.

Found nothing wrong. `today()` is already the local calendar day, so the refill follows the zone the page is in.

Verification: `one minute before Pacific midnight does not refill hearts` and `Pacific midnight refills hearts` PASS on all four projects. Hearts stay 1, then become 5 with `heartDay` 2026-06-15.

## Cycle 35 — localStorage quota

Checked a `QuotaExceededError` from `setItem` on `byteroots-profiles` while buying a streak freeze.

Found `save()` let the exception become a page error.

Fix: `writeStore` catches it and toasts `This browser blocked saving. Free some space and try again.` The purchase stays in memory for the session. The stored profile does not change.

Verification: `a full disk shows a save error instead of a page error` PASS on all four projects. The toast is visible, freezes are 1 in memory, and the stored freeze count stays 0. The console check stayed empty.

## Cycle 36 — Second freeze versus a double buy

Checked two clicks on the new freeze button in one turn, and the existing shop test that buys a second freeze on purpose after the other items.

Found one click re-rendered an enabled button, so a second click in that turn bought another freeze.

Fix: a per-item lock ignores another buy of that same item until the current turn yields. A later click still buys the second freeze.

Verification: `rapid double taps buy, add, answer, and toggle once` expects 1 freeze and 350 gems. `shop buys every power-up and refuses an empty wallet` still expects 2 freezes. Both PASS on all four projects. A double tap that arrives on a later turn can still buy again; blocking that would also block the real second freeze.

## Cycle 37 — Other same-turn doubles

Checked Add profile, Check, opening a lesson, and the sound switch, each with two clicks on the control in one turn. Also checked an arrange chip: the second tap is how a line is undone, so it stays that way.

Found Add profile created a second profile, Check recorded a second answer, the lesson node opened a second session, and the sound switch flipped back.

Fix: the same one-turn lock on those actions. Check also ignores a second click on the same button.

Verification: the double-tap test PASS on all four projects. One new profile, `stats.answered` 1 with Continue still showing, one lesson screen, sound ends on.

## Cycle 38 — Ambiguous exercises

Checked every lesson and interview exercise for a correct bug line that is repeated exactly, and for a correct option whose trimmed text is repeated. Collapsing all whitespace was tried and rejected: `java.methods` has two `}` lines that differ by indent, and the Swift `stride` print has a newline answer and a space answer on purpose.

Found one real duplicate: `fx.layout` asked which line throws and both add lines were `box.getChildren().add(l);`, with the correct index on the second.

Fix: the second line is `box.getChildren().add(l); // same node again`. The index and the explanation stay. `java.interfaces` still has two identical arrange lines, because arrange compares the joined text.

Verification: `validate-ambiguity.js` PASS, `arrange-duplicates=1`.

## Cycle 39 — First load

Checked uncompressed size of `index.html`, `style.css`, `app.js`, `data.js`, `interview.js`, `sw.js`, and `manifest.webmanifest`, and the time until Daily goal, and that the scripts were requested.

Found no overrun. The total is 331479 bytes. The cap is 400000.

Verification: `validate-perf.js` PASS. `first load shows the daily goal quickly and requests the scripts` PASS on all four projects, under 5 seconds, with `data.js` and `app.js` in the resource list. This is localhost. Transfer size and a throttled network were not measured; a service-worker response can report a decoded size of 0, so the file size is the budget.

## Cycle 40 — Calendar across the fall-back

Checked the profile calendar at the cycle 32 instant.

Found the week and the calendar used `Date.now() - n * 24h`, which repeats November 1 and drops October 31 on that evening.

Fix: those labels use `shiftDay` too. The badge “new this week” window is still the last 7×24 hours, because it is an elapsed span rather than a labeled day.

Verification: the fall-back test reads `.cal i[title]`. The dates are unique and include `2026-10-31` and `2026-11-01`. PASS on all four projects.

## Cycle 41 — Back out of a lesson

Checked browser Back on the lesson intro. The X button on a question still asks before quitting.

Found Back left the session entry in place only if the intro X rendered home without popping. A confirm on Back would fight a history entry that had already moved.

Fix: the intro X and the completion button pop the session entry. Hardware Back does not confirm. The question X still confirms.

Verification: `guide, recap, and a lesson all return on browser Back` PASS on all four projects. After Back, `__BR.cur()` is empty and Daily goal is showing. `guide, quit, and one correct answer` still PASS, including the keyboard answer after Quit.

## Cycle 42 — Guide and recap Back

Checked browser Back from the Unit 1 guide and from weekly recap, and the in-app Back buttons.

Found both screens rendered on top of Learn or Profile without their own history entry, so browser Back skipped them.

Fix: guide and recap push their own entries. Their Back buttons pop.

Verification: the cycle 41 test PASS. `every screen opens in this theme and viewport` still uses Back to profile and PASS on all four projects.

## Cycle 43 — Hostile backup keys

Checked a backup whose list has a `__proto__` id and a profile with an own `__proto__` field.

Found `Object.assign` from that object sets the profile’s prototype, so the profile gains the attacker’s fields. `JSON.parse` itself does not change `Object.prototype`.

Fix: drop ids `__proto__`, `constructor`, and `prototype`. Copy the remaining fields with `ownCopy`, which skips those keys. The kept profile imports.

Verification: the cycle 31 test PASS. Name `Kept`, 15 XP, `admin` absent on the profile, its prototype, and a plain object.

## Cycle 44 — Safe area

Checked the CSS for notch padding while adding the standalone flag.

Found `env(safe-area-inset-top)` and `env(safe-area-inset-bottom)` already on `.top`, `.lhead`, `.foot`, `.bnav`, `.toast`, `.qmain`, and `.onb`.

No change. A device inset was not measured. Cycle 28 is the standalone check that did run.

## Cycle 45 — Double-tapped nav

Checked two clicks on the Shop tab in one turn, then one Back.

Found a second `go('shop')` would push a second Shop entry if the state was not compared.

Fix: `histPush` skips an entry whose screen, track, unit, and back target already match.

Verification: the cycle 26 test double-clicks Shop and one `goBack` shows Daily goal. PASS on all four projects.

## Cycle 46 — Offline cache v14

Checked service-worker registration, the cache name, a reload while offline, and `/ByteRyte/` in the URL.

Found the cache still named `byteryte-v13`.

Fix: `sw.js` uses `byteryte-v14`.

Verification: `offline reload under /ByteRyte/ uses cache v14` PASS on `desk-light`. It is skipped on the other three projects so two workers do not fight one offline cache. That is the 3 Playwright skips.

## Cycle 47 — axe on the other two projects

Checked axe serious and critical violations on home, a lesson, practice, interview, shop, profile, and settings, now including `phone-light` and `desk-dark`.

Found no new violation.

Verification: `axe home`, `axe lesson`, `axe practice`, `axe interview`, `axe shop`, `axe profile`, `axe settings` PASS on all four projects.

## Cycle 48 — Corrupt storage

Checked a profiles value of `{`, which cannot be parsed.

Found nothing wrong. The app still offers a new profile.

Verification: `corrupt storage boots instead of hanging` PASS on all four projects.

## Cycle 49 — Keyboard after Back

Checked 1 and Enter on the first question after Quit, which now pops history.

Found nothing wrong.

Verification: `guide, quit, and one correct answer` PASS on all four projects. The explanation footer is visible and hearts stay above 0.

## Cycle 50 — Console and page errors

Checked that every Playwright test fails on a page error or a console error, including the quota toast, the sound spy, and the hostile import.

Found no console error and no page error in the green run.

Verification: full `npm test` exit 0, recorded below. No test failed the console check.

## Final verification

`npm test` from `tests/` exited 0 (about 107s, Playwright 57.5s):

- `validate-data.js` PASS, lessons=62, exercises=683, interview=139, fixes=62, outs=217
- `validate-static.js` PASS
- `validate-docs.js` PASS, 53 URLs
- `validate-java.js` PASS, 175 snippets, JDK 21
- `validate-swift.js` PASS, 42 snippets, Swift 6.0.3
- `validate-ambiguity.js` PASS, arrange-duplicates=1
- `validate-perf.js` PASS, bytes=331479, limit=400000
- Playwright PASS, 173 passed, 3 skipped

An earlier full run of the same suite failed, 20 failed and 153 passed, because Back and shop buys were locked for 450ms. That lock was removed before this run. The edge tests had already passed on `desk-light` (12 passed) before that failure.

## Not covered in this batch, and why

- A physical iPhone swipe and a real installed home screen were not available. Back is tested with `page.goBack()`, and standalone is a mocked `matchMedia('(display-mode: standalone)')`.
- Speaker audio was not heard. The test spies on oscillator `start` and `resume`.
- A double tap that arrives after the current turn can still buy a second freeze. The shop test buys that second freeze on purpose.
- First-load time is on localhost with no CPU or network throttle. The byte budget is uncompressed file size.
- The offline spec still runs only on `desk-light`.
- Swift still skips with exit 0 when the toolchain is absent. It ran here on Swift 6.0.3.

# Review cycles 51–75

Batch 3. Same rules: a cycle names what was checked, what was found, and the test that proved it. A cycle that found no defect says so.

## Cycle 51 — A later click on the same shop item

Checked a second Streak freeze click about 150ms after the first. The previous lock cleared on the next microtask, so this click bought a second freeze.

Fix: each shop item ignores another buy for 400ms. A click after that window still buys.

Verification: `a freeze click a moment later does not buy a second one` PASS on all four projects. At 150ms the profile still has 1 freeze and 350 gems. After 420ms it has 2 freezes and 300 gems.

## Cycle 52 — Same-turn double click

Checked two clicks on the freeze button in one turn, plus the same pattern for adding a profile, answering, and the sound switch.

Found nothing new. The 400ms window also covers the same-turn case the microtask lock used to cover.

Verification: `rapid double taps buy, add, answer, and toggle once` PASS on all four projects.

## Cycle 53 — A deliberate second freeze in the shop flow

Checked the shop path that buys every item and then a second freeze on purpose.

Found the second freeze could now fall inside the 400ms window, because the clicks are fast.

Fix: that test waits 420ms before the second freeze, which is the deliberate purchase.

Verification: `shop buys every power-up and refuses an empty wallet` PASS on all four projects. Freezes end at 2, then the button is disabled at the max.

## Cycle 54 — Offline cache isolated per project

Checked why the offline spec ran on one project. All four projects shared `127.0.0.1:8877`, so they shared one service-worker origin.

Fix: phone-light, phone-dark, desk-light, and desk-dark use ports 8877–8880. Each project has its own origin and its own cache. The spec no longer skips.

Verification: `offline reload under /ByteRyte/ uses cache v15` PASS on all four projects. The reloaded page is still under `/ByteRyte/` and shows Daily goal while offline.

## Cycle 55 — Slow 4G first load

Checked the first view of Daily goal with Chromium's slow-4G network (1.6 Mb/s down, 750 Kb/s up, 150ms latency) and a 4× CPU throttle, on the 390×844 phone.

Found 2168ms in the final run (2182ms on the earlier run). That is inside an 8 second guard. The scripts are still the blocking tags in `index.html`. No loader change.

Verification: `slow 4G and a 4x CPU still reach the daily goal` PASS on `phone-light`. It is skipped on the other three projects so the suite measures it once. Python's server does not gzip; GitHub Pages does, so a production first load should be faster than this number.

## Cycle 56 — JavaFX init thread

Checked the App Lifecycle tip and cheat sheet. They read as if `init()` ran on the JavaFX Application Thread.

Fix: the text now says `launch()` runs `init()` on the launcher thread, then `start` and `stop` on the JavaFX Application Thread, and that `init()` must not build a Scene or Stage.

Verification: `validate-data.js` requires the launcher-thread sentence and no longer accepts the old sheet line.

## Cycle 57 — finally

Checked the Exceptions tip, which said `finally` always runs.

Fix: it runs on the way out, including after a return, unless the process exits first. The sample's explanation now says finally prints C on the way out, which is what that snippet does.

Verification: `validate-data.js` rejects `finally always runs`.

## Cycle 58 — What comes after control flow

Checked the Control Flow tip. It said arrays were the next lesson. The path is Control Flow, then Methods, then Arrays.

Fix: the tip names Methods as next and arrays after that.

Verification: `validate-data.js` rejects `arrays are the next lesson` and requires `Methods is the next lesson`.

## Cycle 59 — A default arm on a sealed switch

Checked the sealed-type bug exercise. It said the switch did not compile. On JDK 21 a switch that already covers Circle still compiles when a `default` arm is added. The arm is dead, and it hides a future `permits` change.

Fix: the prompt asks for the arm that can never run. The correct line is still the `default`.

Verification: `validate-data.js` requires the new explanation. The print snippet in that lesson still passes `validate-java.js`.

## Cycle 60 — Interface methods

Checked the Abstract vs Interface sheet line "Interface methods are public." Interfaces have been allowed private methods since Java 9. The Dog exercise is about the public `name()` method, and that part was already right.

Fix: the sheet says methods an implementer must provide are public, and private methods stay inside the interface. The exercise why now says `Pet.name()` is public.

Verification: `validate-data.js` requires the private-method sentence.

## Cycle 61 — Unchecked Error

Checked the Checked & Unchecked sheet. It said unchecked exceptions extend RuntimeException and stopped there. `Error` is also unchecked.

Fix: the sheet says that, and still names NullPointerException and IllegalArgumentException as the unchecked exceptions learners meet.

Verification: the sheet text is in `data.js` and `validate-data.js` still parses the lesson.

## Cycle 62 — Sorting a list

Checked the sort sheet, which said there is no zero-argument sort on a list. `List.sort()` does need a comparator. `Collections.sort(list)` is the zero-argument natural-order call, and an earlier lesson already uses it.

Fix: the sheet and the fix-the-bug why name both `Collections.sort(list)` and `list.sort(Comparator.naturalOrder())`.

Verification: `validate-data.js` rejects the old "no zero-argument sort" line.

## Cycle 63 — Method references and Task progress

Checked two sheet lines. "Method references are lambdas" overstates it. "succeed and the message property publish progress" names the wrong Task API. Progress is `updateProgress` / `progressProperty`. `messageProperty` is status text. The result is handled in `onSucceeded`.

Fix: both sheet lines say that.

Verification: `validate-data.js` requires `updateProgress and progressProperty report progress`.

## Cycle 64 — Accessibility tree wording

Checked Accessible CSS. The tip said both `display: none` and `visibility: hidden` leave the accessibility tree. The multiple-choice why said the same while the choices only included `display: none`. The sheet mentioned only `display: none`.

Fix: the sheet matches the tip. The why now says that among the four choices, only `display: none` removes the element.

Verification: `validate-data.js` requires that why and rejects the old parenthetical.

## Cycle 65 — rem, sticky, and the paint pipeline

Checked the responsive `rem` explanation, two interview `rem` explanations, the sticky choice, and the interview line "Parse, then layout, then paint."

`em` is not simply "the element's own font size." On `font-size` it uses the parent. Sticky sticks inside its container, not the viewport. The pipeline includes the CSSOM, styles, and the render tree before layout.

Fix: those sentences. The keyed answers did not change.

Verification: `validate-data.js` requires the font-size sentence and rejects `own/parent font size`.

## Cycle 66 — await and NavigationView

Checked the Swift concurrency sheet ("await does not block the thread") and the SwiftUI navigation copy ("new code should not use it"). `await` suspends the task; the runtime may run other tasks on that thread. `NavigationView` is deprecated, not deleted.

Fix: the sheet, the tip, and the multiple-choice why say that.

Verification: `validate-data.js` requires `await suspends this task` and `NavigationView is deprecated`. `validate-swift.js` PASS, 42 snippets.

## Cycle 67 — Repeated interview questions

Checked the bank for the same snippet twice. Integer cache identity, a three-push stack peek, a discarded `concat`, and a `try?` fallback were copies of questions already in the bank or in a lesson.

Fix: those four now ask about `Integer.valueOf(200)`, `substring`, `replace` leaving the original string, and `do/catch`. A validator rejects two interview items with the same type, prompt, code, and choices.

Verification: `validate-data.js` PASS, interview=139, no duplicate. `validate-java.js` PASS, 175 snippets, including the new Java prints. `validate-swift.js` PASS, including the new `do/catch` print.

## Cycle 68 — Print snippets after the wording edits

Checked that the explanation edits did not change a keyed print answer.

Found nothing wrong.

Verification: `validate-java.js` PASS, 175 snippets, JDK 21. `validate-swift.js` PASS, 42 snippets, Swift 6.0.3.

## Cycle 69 — Screens across themes

Checked screenshots of home, the lesson intro, the first question, the shop, profile, and settings at 390×844 and 1280×800, light and dark. Measured the four track tabs.

Phone tabs sit in a 2×2 grid inside x 16–374 of a 390px width. Desk tabs sit in one row inside x 300–825 of 1280px. Light and dark report the same boxes. Question screens use the same header, choices, and Check button in both themes. No layout change.

Found one name clash: the avatar button and the Edit profile link were both named "Edit profile."

Fix: the avatar's accessible name is "Change Ada's avatar" (using the profile name).

Verification: the screenshots were taken on all four projects during this batch. `canceling profile edit keeps the previous daily goal` clicks the Edit profile link and PASS on all four projects. `body text and lesson labels meet contrast` PASS on all four projects.

## Cycle 70 — Fifty lessons

Checked 50 lessons back to back on the desk, with unlock-all so the path can cross Java, HTML & CSS, JavaFX, and Swift. Compared the Java home node count before and after, waited until the toast queue was empty, and read the JS heap after a garbage collection.

Found 50 lessons recorded, 244 nodes before and 243 after, heap about 2.9 MB. No growing DOM and no leftover toast or confetti. No code change.

Verification: `fifty lessons in a row leave the home screen the same size` PASS on `desk-light` (about 29s). Skipped on the other three projects so the suite does not run the soak four times. The final run logged `soak nodes 244 243 heap 2895620 lessons 50`.

## Cycle 71 — Two tabs

Checked a second tab opened on the same origin. It kept its own copy of the profile and a later save could replace the first tab's purchase.

Fix: the profile blob has a `rev`. A `storage` event adopts a newer blob and redraws, unless a lesson is in progress. A save that sees a newer stored rev keeps that copy instead of writing over it. The redraw does not itself save, so the two tabs do not bounce revisions. Settings follow the same event for theme, sound, and text size.

Verification: `a second tab keeps a purchase and a goal change from the other tab` PASS on all four projects. The second tab shows "1 streak freeze ready", then a goal of 50 XP, and the first tab keeps the freeze. The other tab's theme radio updates the first tab.

## Cycle 72 — Import versus the stored revision

Checked the hostile-backup test after the revision counter existed. The import was thrown away: the name stayed Ada. `save()` saw the on-disk `rev` and treated the backup as stale.

Fix: before the import is written, its `rev` is raised to the copy already on disk, then `save()` stores the backup as the newer one.

Verification: the full suite failed this test on all four projects (4 failed, 190 passed, 6 skipped). After the fix, `malformed backups are rejected and a hostile file cannot change the prototype` PASS on all four projects, and the suite below is green.

## Cycle 73 — Cancel on the profile editor

Checked Edit profile. Choosing Intense wrote `goal` on the live profile immediately. Cancel left that change in memory, and the next save kept it.

Fix: the editor holds the goal locally and writes it on Save.

Verification: `canceling profile edit keeps the previous daily goal` PASS on all four projects. After Cancel and a reload the goal is still 30.

## Cycle 74 — Old save shapes

Checked `migrateProgress` against the positional map from before lesson ids, and the `byteroots-v1` importer. The v1 path built the profile with `curriculum: 2`, so positional keys inside a v1 blob were never migrated.

Fix: a v1 blob keeps its own curriculum stamp (usually absent), so hydration migrates it. The importer also keeps `misses` and `saved` when they are present.

Verification:
- `validate-data.js` walks every java, javafx, css, and swift key in that map, including review, miss, and saved exercise suffixes. Out-of-range and unknown keys stay. A partial unit does not open the gates. Curriculum 1 migrates. An empty object only receives the stamp. A second pass keeps the ids.
- `legacy single-profile positional keys migrate` PASS on all four projects: the five old unit-1 keys become `java.types` through `java.arrays`, both gates open, and `css.flex`, `swift.strings`, and `fx.lists` keys move.
- `old index saves migrate and keep the storage keys` and `legacy single-profile save becomes a profile` PASS on all four projects.

Lessons added after that map (`java.run`, `java.memory`, `java.debug`, and the later branch lessons) have no positional key. They did not exist in that save.

## Cycle 75 — Service worker cache v15

Checked the precache name after this batch's script and text changes.

Fix: `sw.js` uses `byteryte-v15`.

Verification: `validate-static.js` PASS. The offline spec in cycle 54 PASS on all four projects.

## Final verification

`npm test` from `tests/` exited 0. Playwright reported 1.3m. The command that included a first pass of the hostile-backup test and then `npm test` took about 131s.

- `validate-data.js` PASS, lessons=62, exercises=683, interview=139, fixes=62, outs=217
- `validate-static.js` PASS
- `validate-docs.js` PASS, 53 URLs
- `validate-java.js` PASS, 175 snippets, JDK 21
- `validate-swift.js` PASS, 42 snippets, Swift 6.0.3
- `validate-ambiguity.js` PASS, arrange-duplicates=1
- `validate-perf.js` PASS, bytes=333678, limit=400000
- Playwright PASS, 194 passed, 6 skipped

An earlier full run failed with 4 failed and 190 passed. All four were the hostile-backup test from cycle 72. That was fixed before this run.

The 6 skips are `fifty lessons in a row` on the three projects other than `desk-light`, and `slow 4G and a 4x CPU` on the three projects other than `phone-light`.

## Not covered in this batch, and why

- A physical phone, a spoken audio check, and an installed home-screen icon were not available. Offline is a Playwright context set to offline. Standalone display mode is still the mocked media query from batch 2.
- The slow-4G number is Chromium emulation against an uncompressed Python server. It is not a Lighthouse run and not GitHub Pages.
- The 50-lesson soak is one desk project, then a heap snapshot. It is not a multi-hour session and not a native memory trace.
- Tips, cheat sheets, and the interview bank were read for wrong or conflicting rules. Every Java and Swift print snippet was executed. Not every one of the 683 explanations was rewritten; the ones that were wrong are the cycles above.
- Positional migration covers the keys that map existed for. Lessons added later have no old key.
