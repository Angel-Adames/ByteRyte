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

# Review cycles 76–100

Batch 4. The branch starts from `cursor/cycles-51-75-3770` (the batch 3 work), not from `main`. Each cycle names what was checked, what was found, what changed, and the test that proved it. A cycle that found no defect says so.

The per-exercise explanations are the `why` on each question. Tips, sheets, and the interview bank were already read in cycles 51–75. This batch read the explanations. A scanner listed every explanation that names a different choice and does not name the keyed choice. Those hits were read one by one.

## Cycle 76 — Empty ListView selection in the lesson

Checked `fx.lists`. The sheet and the explanation say `getSelectedItem()` returns null when nothing is selected. The choices are `""`, `0`, `null`, and `Optional.empty()`. The keyed index was 1, which is `0`.

Fix: the keyed choice is `null`.

Verification: `validate-data.js` requires that question’s keyed choice to be `null`.

## Cycle 77 — The same ListView question in the interview

Checked the JavaFX interview item `ListView.getSelectionModel().getSelectedItem() with nothing selected`. The explanation says to check for null. The choices are `""`, `Optional.empty()`, `null`, and `0`. The keyed index was 1, which is `Optional.empty()`.

Fix: the keyed choice is `null`.

Verification: `validate-data.js` requires that question’s keyed choice to be `null`.

## Cycle 78 — The button handler in the interview

Checked `A button click is handled with…`. The explanation says `setOnAction`. The choices are `setOnAction`, `setOnClick`, `onClick`, and `addMouse`. The keyed index was 1, which is `setOnClick`. The lesson fill and the JavaFX fix exercise already key `setOnAction`.

Fix: the keyed choice is `setOnAction`.

Verification: `validate-data.js` requires that question’s keyed choice to be `setOnAction`.

## Cycle 79 — The name bound in a Swift catch

Checked `Inside catch, the thrown value is available as…`. The sheet and the explanation say a catch with no pattern binds `error`. The choices are `e`, `exception`, `error`, and `err`. The keyed index was 1, which is `exception`.

Fix: the keyed choice is `error`.

Verification: `validate-data.js` requires that question’s keyed choice to be `error`.

## Cycle 80 — What an interface can hold

Checked `Which can hold instance fields?`. The keyed choice, abstract classes, is right. The explanation said interfaces may only have constants. That is too strong: an interface can declare methods, including private ones, which cycle 60 already says. It still cannot hold instance fields. Its fields are public static final.

Fix: the explanation says that, and that an abstract class can hold ordinary fields.

Verification: `validate-data.js` rejects `Interfaces may only have constants` and requires `An interface cannot hold instance fields`.

## Cycle 81 — System.out::println

Checked the fill `list.forEach(System.out::___)`. The keyed blank `println` is right. The explanation called it `Class::method`. `System.out::println` is a bound instance method reference. It stands in for `x -> System.out.println(x)`.

Fix: the explanation says that.

Verification: `validate-data.js` rejects `Class::method is shorthand` and requires `bound instance method reference`.

## Cycle 82 — An enum is not two records

Checked the sealed fix that rejects `enum Shape { Circle, Square }`. The keyed declaration, `sealed interface Shape permits Circle {}`, is right. The explanation said an enum would erase the fields the records were holding. An enum of those names is a list of names. It is not two records that keep different fields.

Fix: the explanation says that.

Verification: `validate-data.js` rejects `An enum would erase the fields` and requires `not two records that keep different fields`.

## Cycle 83 — Enum == and null

Checked `Comparing two enum constants with ==`. The safe choice is right, and `==` does not throw if either side is null. The choice said `null-safe on the left`, which describes one side only.

Fix: the choice and the explanation say `==` does not throw if either side is null. The keyed index stays 1.

Verification: `validate-data.js` rejects `null-safe on the left` and requires that question’s full choice text.

## Cycle 84 — The rest of the explanation scan

Checked the scanner again after cycles 76–83. It reports an explanation that contains some other choice and does not contain the keyed choice. Fourteen hits remain.

They are explanations that mention a wrong choice on purpose (`O(n²)`, `Stack`, `static`, `mobile`, `spacing`), or a shorter word inside the real sentence (`mail` inside the mail example, `body` and `close` inside the try-with-resources sentence, `hello` inside the text-block sentence, `struct` and `enum` beside `protocol`). None of them keys the wrong choice.

Found no further wrong key. No code change.

Verification: `validate-data.js` PASS, lessons=62, exercises=683, interview=139, fixes=62, outs=217.

## Cycle 85 — Numbers that were inserted as HTML

Checked every place a saved profile is drawn. Names and avatars already go through `esc()` (cycle 6). These values were concatenated into HTML as they were stored: today’s XP, the week chart, the calendar title, a weak-spot count, the weekly lesson and answer counts, and a daily-quest count. A backup could store a string there. `plural()` and the chart title would then write that string into the page.

Fix: `sanitize()` rounds `xpLog`, `misses`, `saved`, and `badges` into finite numbers, and rounds each `dlog` day to `l`, `a`, and `c`. Quest progress is rounded the same way. A value that is not a number becomes 0. Review boxes and dues are numbers. Gate flags are booleans. `last`, `heartDay`, and `goalDay` must be `YYYY-MM-DD` or they are cleared. An unknown track becomes `java`.

Verification: `markup in imported profiles, counts, and a typed name stays text` PASS on phone-light and desk-dark in the slice before the combined run. The imported XP, miss count, lesson count, and quest count are 0. The page has no `img`, no `svg`, and no `onerror` or `onload` attribute.

## Cycle 86 — Profile ids and a name typed in the editor

Checked the switch button. `data-id` was the stored profile id, unescaped. A `"` in the id closed the attribute. Lesson and saved keys were also written straight into `data-k`. Those keys only render when they match a real lesson, so the live ones are safe. The id is not.

Fix: `esc()` on the switch id and on every `data-k`. The editor still stores the typed name, and the profile heading renders it as text.

Verification: the same test. The other profile’s id is `bob"><svg onload=self.__x=1>`. `data-id` reads back as that string, and the document HTML does not contain a raw `<svg` tag. Switching lands on that profile. Saving the name `<b>Hi</b>` shows those characters in the heading and does not create a `b` element.

## Cycle 87 — Theme, sound, and text size from a backup

Checked settings loaded from storage. `theme` was used only in comparisons, so a markup string did not render, but it was also not one of `system`, `light`, or `dark`.

Fix: `applyTheme()` keeps only those three themes and stores sound and larger text as booleans.

Verification: the same test opens Settings after a backup whose theme is a markup string. The System radio is checked. No handler runs.

## Cycle 88 — Content Security Policy

Checked `index.html`. Two inline scripts registered the service worker and replaced the boot message after 8 seconds. `script-src 'self'` cannot allow those and still block injected handlers. `frame-ancestors` does nothing in a meta tag. Style attributes are used throughout the page, so a style policy has to allow them. Export builds a `blob:` URL on a link. That navigation is not a script load.

Fix: both scripts moved to `boot.js`. The meta policy is `default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self'; connect-src 'self'; worker-src 'self'; manifest-src 'self'; base-uri 'self'; object-src 'none'; frame-src 'none'; form-action 'none'`. There is no `frame-ancestors` and no `unsafe-inline` on scripts.

Verification: `validate-static.js` requires that policy, rejects an inline script, and requires `boot.js`. `first load shows the daily goal quickly and requests the scripts` requires `boot.js` in the resource list. The markup test reads the policy back from the page. Daily goal still appears, so the external scripts ran.

## Cycle 89 — Export and the offline copy of boot.js

Checked that the policy did not block the backup download, and that a reload with no network still has `boot.js`.

Found nothing broken. The export test still receives the JSON file. The precache list includes `boot.js`.

Verification: `export and import round-trip, including the same file twice` is in the combined run. `offline reload under /ByteRyte/ uses cache v16` checks the cache name and that a cached URL ends in `/boot.js`, then reloads offline and still shows Daily goal. PASS on phone-light and desk-dark in the slice.

## Cycle 90 — Gzip under /ByteRyte/

Checked a local server on port 8881. It serves the same `/tmp/byteryte-pages` tree the suite uses, with `/ByteRyte/` mapped to this repo, and it gzips HTML, JS, CSS, SVG, and the manifest when the request asks for gzip. This is not `https://angel-adames.github.io/ByteRyte/`. That site was not requested.

Fix: `tests/gzip-server.js` starts with the other servers.

Verification: `a gzip response under /ByteRyte/ still shows the daily goal`. A Node `http.get` with `Accept-Encoding: gzip` sees `Content-Encoding: gzip` on `index.html` and on `app.js`, gunzips both, and finds the title and the storage key. Playwright then opens `http://127.0.0.1:8881/ByteRyte/` and the daily goal is visible. PASS on phone-light and desk-dark in the slice. The combined run repeats it on all four projects.

## Cycle 91 — Fifty lessons on every project

Checked the soak that cycle 70 ran only on `desk-light`. The skip is gone. Each project unlocks every lesson, finishes 50 lessons across Java, HTML & CSS, JavaFX, and Swift, and compares the Java home node count before and after. Toasts must drain. The heap is read after a garbage collection. The limit is still a 40 MB heap and a node-count change under 80.

Verification: `fifty lessons in a row leave the home screen the same size` in the combined run, on all four projects. The log line is in the final verification.

## Cycle 92 — Slow 4G on every project

Checked the throttle that cycle 55 ran only on `phone-light`. The skip is gone. Download is 1.6 Mb/s, upload is 750 Kb/s, latency is 150 ms, and the CPU is slowed to 4×. The clock starts before `boot` and stops when Daily goal is visible. The guard is still under 8 seconds. The server is the local uncompressed one, not the gzip stand-in and not GitHub Pages.

Verification: `slow 4G and a 4x CPU still reach the daily goal` in the combined run, on all four projects. The log line is in the final verification.

## Cycle 93 — The Error sentence from cycle 61

Checked cycle 61. The sheet was changed so it says `Error` is unchecked, and the only check was that `validate-data.js` still parsed the file.

Fix: the validator now requires the words `Error is also unchecked`.

Verification: `validate-data.js` PASS.

## Cycle 94 — The safe-area rules from cycle 44

Checked cycle 44. The insets were already in the CSS, and no test locked them. A device inset still cannot be measured here.

Fix: `validate-static.js` requires `env(safe-area-inset-top)` and `env(safe-area-inset-bottom)` in `style.css`.

Verification: `validate-static.js` PASS. No physical inset was measured.

## Cycle 95 — Cycles 1–75 on this branch

Checked the suite that locked those cycles: migration, the two-tab revision, the hostile prototype, hearts, the shop, import, and the screens. This branch contains that code. The new sanitize and the policy have to leave those paths working.

Found nothing that those tests rejected in the slice (edges, smoke, and offline on phone-light and desk-dark, 46 passed). The combined run is the full check.

Verification: the combined `npm test` below.

## Cycle 96 — Service worker cache v16

Checked the precache after `boot.js` and the script edits.

Fix: `sw.js` uses `byteryte-v16` and lists `boot.js`.

Verification: `validate-static.js` PASS. The offline spec in cycle 89 PASS on phone-light and desk-dark.

## Cycle 97 — Print snippets after the explanation edits

Checked that the explanation and index edits did not change a keyed print answer. The four index edits are multiple choice, not print snippets.

Verification: `validate-java.js` and `validate-swift.js` in the combined run.

## Cycle 98 — Ambiguous choices

Checked the validator that rejects a repeated correct line. The new keyed choices were already one of the four options. None was duplicated.

Found nothing wrong.

Verification: `validate-ambiguity.js` PASS, arrange-duplicates=1.

## Cycle 99 — First-load size

Checked the byte budget with `boot.js` and the policy meta included. The cap is still 400000.

Found 336412 bytes. That is inside the cap.

Verification: `validate-perf.js` PASS, bytes=336412, limit=400000.

## Cycle 100 — What the hundred cycles add up to

Checked the write-ups from cycles 1–99 and the suite this batch runs. The closing count is below. A defect is a wrong behavior or a wrong lesson sentence that a cycle changed in the app or the curriculum. Cycle 37’s four same-turn doubles are one missing lock. A cache rename, a test-only locator, and the Java harness’s directory split are not in that count.

## Final verification

`npm test` from `tests/` exited 0. Playwright reported 2.3m.

- `validate-data.js` PASS, lessons=62, exercises=683, interview=139, fixes=62, outs=217
- `validate-static.js` PASS
- `validate-docs.js` PASS, 53 URLs
- `validate-java.js` PASS, 175 snippets, JDK 21
- `validate-swift.js` PASS, 42 snippets, Swift 6.0.3
- `validate-ambiguity.js` PASS, arrange-duplicates=1
- `validate-perf.js` PASS, bytes=336412, limit=400000
- Playwright PASS, 208 passed, 0 skipped

An earlier slice of edges, gzip, smoke, and offline on phone-light and desk-dark passed 46 tests before this run. This run is the one that counts.

The four soak logs are `soak nodes 244 243` with heaps 2899164, 2899288, 2903960, and 2904136, each with 50 lessons. The four slow-4G times are 2647 ms, 2661 ms, 2681 ms, and 2688 ms.

## Closing summary

- Total cycles completed: 100.
- Total bugs found and fixed: 59. Counted once each: the two crashing exercises (1); huge XP, name and avatar markup, and the gem header (6); stale 50/50 keys and the 1–6 shortcut sentence (10); the second Check click (11); a replay counting as another lesson (13); importing the same file twice (17); the nav icon inside the button name (21); Back leaving the page, and a second Back leaving it again (26, 27); no standalone flag (28); a suspended sound (29); an array accepted as a backup (31); yesterday across the fall-back (32); a full disk becoming a page error (35); a same-turn second purchase (36); same-turn doubles on add profile, Check, opening a lesson, and sound, counted as one missing lock (37); the identical JavaFX bug lines (38); the calendar across the fall-back (40); leaving a lesson did not pop its history entry (41); guide and recap had no history entry (42); a backup setting the profile prototype (43); a second Shop entry (45); a fast second freeze after the button re-rendered (51); the wrong or over-wide sentences in cycles 56–66 (eleven sentences); four repeated interview questions (67); the shared avatar name (69); a second tab replacing a purchase (71); an import dropped by the revision check (72); the goal saved before Save (73); a v1 blob skipping migration (74); the four wrong keys (76–79); the four wrong or one-sided explanations (80–83); numeric profile fields drawn as HTML (85); an unescaped profile id (86); a theme outside system, light, and dark (87); and inline scripts that blocked `script-src 'self'` (88).
- Not in that 59: the Java harness compiling every snippet in one directory (2), the seed and locator fixes (12, 23, 25, 53), separate origins for the four projects (54), and the cache renames to v13, v14, v15, and v16 (5, 46, 75, 96).
- Final test counts: `npm test` exited 0. Validators: lessons 62, exercises 683, interview 139, fixes 62, outs 217, docs 53, Java snippets 175 (JDK 21), Swift snippets 42 (Swift 6.0.3), arrange-duplicates 1, bytes 336412 of 400000. Playwright 208 passed, 0 skipped, in 2.3m. Soak on all four projects: 244 nodes then 243, heaps 2899164–2904136, 50 lessons. Slow 4G on all four projects: 2647–2688 ms, under the 8 second guard.
- Known limitations / not testable here:
  - No physical phone, no spoken audio, and no installed home-screen icon. Offline is a Playwright context set to offline. Standalone is the mocked media query. The safe-area CSS is locked; a device inset was not measured.
  - The slow-4G times are Chromium emulation against the local uncompressed server. They are not a Lighthouse run and not the live GitHub Pages site. The gzip check is a local server on port 8881 with the `/ByteRyte/` prefix.
  - The 50-lesson soak is four projects and a heap snapshot after a garbage collection. It is not a multi-hour session and not a native memory trace.
  - Print snippets were executed. Multiple choice and fill answers were not executed; the wrong keys in this batch were found by reading the explanation against the keyed choice.
  - Swift validation skips, and says so, if the Swift toolchain is absent.
  - Lessons added after the positional map have no old key.
  - `style-src` still allows inline style attributes, because the page sets width, height, and color that way. Script sources do not allow inline scripts.

# Review cycles 101–125

Batch 1 of the next hundred. Branched from `origin/main` at `02f3957`. Each cycle names what was checked, what was found, what changed, and the test that proved the result. A cycle that found no defect says so.

Playwright runs on all four projects: `phone-light` (390×844), `phone-dark`, `desk-light` (1280×800), and `desk-dark`. The config already sets reduced motion. New cases live in `tests/e2e/fresh.spec.js`.

## Cycle 101 — Scanner before the strings bug

Read the Java strings lesson as a first explanation of input. The bug exercise used `scanner.nextLine()` and compared the result with `==`. The sheet never said what a Scanner is.

Fix: the sheet says `Scanner scanner = new Scanner(System.in)` reads typed text and `nextLine()` returns one new String, so the comparison is `equals`. The bug explanation starts with the same two sentences.

Verification: `validate-data.js` requires that Scanner sentence. PASS in the combined run.

## Cycle 102 — Hash codes before Maps

Read the `hashCode` explanation in the references lesson. It said HashMap and HashSet will misbehave. Maps & Sets is a later unit.

Fix: the explanation says equal objects need equal hash codes, and that hash-based collections, taught in Maps & Sets, look a key up by that code.

Verification: `validate-data.js` requires the Maps & Sets sentence and rejects `HashMap/HashSet will misbehave`. PASS.

## Cycle 103 — Big-O after the lookup is named

Read the maps question about a taken username. The explanation used O(1) and O(n). The Big-O lesson is Unit 5, after maps.

Fix: the explanation says a HashSet lookup is usually direct and an ArrayList walks every element, and that the Big-O lesson names those O(1) and O(n). The Big-O lesson still uses the notation in its own choices.

Verification: `validate-data.js` requires that sentence and rejects `HashSet.contains is O(1) on average vs O(n) for a list.` PASS.

## Cycle 104 — Pattern matching after the cast

Read the inheritance question about calling `purr()` on an Animal variable. The explanation offered pattern matching. Pattern matching is taught in Modern Java, after inheritance.

Fix: the explanation says the declared type decides what compiles, shows the cast `((Cat) a).purr()`, and says Modern Java writes the test and the cast as `instanceof Cat c`.

Verification: `validate-data.js` requires the Modern Java sentence and rejects `or use pattern matching.` PASS.

## Cycle 105 — Queues before the interview uses them

Read the lists lesson, then the interview questions that use ArrayDeque and PriorityQueue. The lesson drilled ArrayList and did not name either queue.

Fix: the lists sheet says ArrayDeque is a double-ended queue (`offer`/`poll` first-in first-out, `push`/`pop` last-in first-out) and a PriorityQueue hands back the smallest next. The lesson tip says the same and says this lesson drills ArrayList first.

Verification: `validate-data.js` requires both sentences. PASS.

## Cycle 106 — One printed program, one question

Compared every lesson exercise with every interview question. Five print snippets were copied exactly: a memory assignment, a refs print, two inheritance prints, and a modern pattern match. The strings concatenation, `fact(5)`, the palindrome, three Swift prints, and a List.of question were the same program with different option text. `swift.values` repeated the `swift.enums` north/south switch.

Fix: the interview copies and the values-lesson exercise were rewritten. The new prints still match their explanations: `isPal("kayak")` and `isPal("ab")` is `true false`; `fact(4)` is 24; the Integer cache uses 126 and 200; `1 + 2 + "3" + 4` is `334`; Swift interpolation is `Hi Bo`; `"xy"` prints `2 XY`; `["Zo","Amy"]` joins as `Amy,Zo`; the override prints `purr`; the constructors print `XY`; `List.of(1, 2).set(0, 9)` throws; the copied reference still prints `red`; `"hey".length` is 3. The values lesson now copies an enum and prints `true`. `validate-data.js` rejects a repeated full question key and a repeated print snippet.

Verification: `validate-data.js` PASS. `validate-java.js` PASS, 175 snippets, JDK 21. `validate-swift.js` PASS, 42 snippets, Swift 6.0.3. `validate-ambiguity.js` PASS, arrange-duplicates=1.

## Cycle 107 — Quest gems when the bar is already full

Opened a profile whose XP log was already past the daily goal and whose quests were not claimed. Quest gems were granted only inside a later quest bump, so a completed bar could sit there with the chest unpaid.

Fix: `claimQuests()` grants 15 gems for each newly finished quest and 25 for the chest. `settleRewards()` calls it. `daily()` calls `settleRewards()` before it saves, and `addXP()` calls the same helper. Claims stay idempotent through `qd.claimed` and `qd.chest`.

Verification: `a full daily bar pays the goal and the xp quest once`. Gems go from 50 to 75 (10 for the goal, 15 for the XP quest). The chest stays false. A reload stays at 75. PASS on all four projects.

## Cycle 108 — The daily goal when it is lowered

Set today’s XP to 20 with a goal of 30, then lowered the goal to 10. The +10 goal gems used to be paid only inside `addXP`, so opening the app already over the goal, or lowering the goal under today’s XP, left `goalDay` empty.

Fix: `settleRewards()` pays the 10 gems when `goalDay` is not today and `xpLog[today]` is at least the goal. Lowering the goal saves, and the next settle sees the new goal.

Verification: `lowering the daily goal pays gems that were already earned`. Gems stay 50 at a goal of 30. Choosing the 10 XP radio checks it, sets the goal to 10, sets `goalDay` to today, claims the XP quest, and lands on 75 gems. PASS on all four projects.

## Cycle 109 — Out of hearts across midnight

Sat on the out-of-hearts screen with the clock at 2026-06-15 23:59:30 and zero hearts. The screen drew once. A new day or a 30-minute regen did not redraw it, and it did not return to Learn. A question already in progress still calls `daily()` from the continue path. That path was left as it is.

Fix: `heartsDue()` is true on a new day, or when 30 minutes have passed since `heartAt` and hearts are below 5. The hearts screen keeps its own one-second watch. The watch calls `daily()` only when a heart is due, redraws only when the hearts, next-heart, or gems label changes, and returns to Learn when hearts are back. It does not save on every tick.

Verification: `out of hearts refreshes when the day rolls over`. The heading and the refill button are visible, then the clock jumps 60 seconds. Daily goal is visible, hearts are 5, and `heartDay` is 2026-06-16. PASS on all four projects.

## Cycle 110 — A lesson stays on its profile

Started a lesson, then added a profile in a second tab. The storage listener hydrated the newer blob into the active profile, so the open lesson could change identity.

Fix: a storage event during a lesson records that a newer blob exists and does not hydrate. The next save, when the stored revision is newer, copies the other profiles in and puts the in-memory lesson profile back. A newer blob while no lesson is open still hydrates and returns, which is the path the older two-tab purchase test uses.

Verification: `a lesson keeps its profile when another tab adds one`. After Bea is added, answering one question on the keyboard leaves the name Ada, and the stored names are Ada and Bea. `a second tab keeps a purchase and a goal change from the other tab` still PASS on all four projects. The goal control in that test is a radio, which is cycle 112.

## Cycle 111 — Avatar names

Opened Edit profile. The avatar buttons were the emoji with no name, so two people-at-a-computer pictures were not distinguishable.

Fix: each avatar radio is named from Fox, Panda, Octopus, Owl, Frog, Tiger, Koala, Unicorn, Penguin, Whale, Dinosaur, Robot, Woman at a computer, Man at a computer, Astronaut, and Bee, with the word avatar. The group is named Pick an avatar.

Verification: `avatars, the daily goal, and profile switches have names` expects each `name + ' avatar'` radio once, with an exact match. The first phone-light run matched two radios for Man at a computer, because the default name match is a substring and Woman at a computer contains that phrase. The assertion uses an exact name. PASS on all four projects.

## Cycle 112 — The settings goal is a radio group

Opened Settings. The daily-goal choices were plain buttons. The profile editor still uses its own goal buttons, with the words Casual, Regular, Serious, and Intense.

Fix: the settings row is a radiogroup named Daily goal. Each choice is a radio named `10 XP`, `30 XP`, `50 XP`, or `100 XP`, with `aria-checked`.

Verification: the same test. The 30 XP radio is checked and the 10 XP radio is not. The lowering-goal test in cycle 108 clicks the 10 XP radio and reads `aria-checked`. PASS on all four projects.

## Cycle 113 — Switch buttons and the calendar letters

Read the profile list and the streak calendar. Every other profile had a button named Switch. The weekday letters Su through Sa were inside a calendar image with no spoken day names.

Fix: each switch button is named `Switch to` plus the profile name. The calendar image says the last 5 weeks run Sunday through Saturday. The letters stay visible.

Verification: the same test finds an image whose name matches Sunday through Saturday. `several profiles can be added and switched by name` clicks Switch to Ada and Switch to Cam. PASS on all four projects.

## Cycle 114 — A new service worker and a leftover v16 cache

Loaded the app, planted a cache named `byteryte-v16`, and asked what an already controlled tab does when a worker takes control. The cache name was still `byteryte-v16`. Nothing told the open tab to reload. `boot.js` only registers `sw.js`. The toast belongs in `app.js`.

Fix: the cache name is `byteryte-v17`. Activate still deletes every other cache. The first `controllerchange` is the worker claiming a page that had none, and it shows no toast. A later change toasts “A new version of ByteRyte is ready. Reload to use it.”

Verification: `service worker v17 replaces a v16 cache and tells an open tab to reload`. The first draft registered `sw.js` again without a reload. Chromium did not run activate for the same script while the page stayed controlled, so v16 remained. The test now unregisters, reloads, and polls. v17 is present and v16 is absent. A dispatched `controllerchange` then shows the toast. PASS on all four projects. `offline reload under /ByteRyte/ uses cache v17` is in the combined run. This is one reload onto the worker in this build, plus a synthetic controller change. Two different `sw.js` files were not served to one long-lived tab.

## Cycle 115 — Reduced motion and confetti

Finished `java.run` with the suite’s reduced-motion setting. `confetti()` already returns before it adds pieces, and the stylesheet sets animation and transition to none.

Found nothing broken.

Verification: `reduced motion skips confetti`. The finish heading is visible, `.conf` count is 0, and an injected `.conf` has `animationName` none. PASS on all four projects.

## Cycle 116 — A long emoji name and Arabic text

Opened a profile named with twelve fox emoji, which is the 24-unit cap, and a profile named مرحبا يا عالم. The heading, the profile card, and the switch row use `min-width: 0` and `overflow-wrap: anywhere`.

The heading shows each name, and the overflow check is empty on the profile screen and on Learn. An overflow from before those rules was not measured, so this cycle does not count a layout bug.

Verification: `long emoji and right-to-left names stay on screen`. PASS on all four projects.

## Cycle 117 — Four profiles

Added Bea, Cam, and Dee from the profile screen, then switched back to Ada and on to Cam.

Found nothing broken. Add and switch already kept each profile.

Verification: `several profiles can be added and switched by name`. The stored names are Ada, Bea, Cam, and Dee. PASS on all four projects.

## Cycle 118 — The first answer from the keyboard

Opened the first lesson. Start lesson is focused. Enter starts it. The first exercise is multiple choice. Digits 1 through 9 select a visible choice, and Enter checks it.

Found nothing broken.

Verification: `the first answer can be entered from the keyboard`. The digit is the visible index of the correct choice. Continue appears, and the explanation is not empty. PASS on all four projects.

## Cycle 119 — Larger text and CSS zoom 2

Turned on larger text, then set CSS zoom to 2. `clientWidth` stays 390 or 1280. `getBoundingClientRect` is scaled, so comparing a raw rectangle with `clientWidth` reports a false overflow. The fair check divides the rectangle by the computed zoom.

The desk tabs fit after that division. The phone path did not. Lesson labels sat a few pixels past the left edge, about −4..115, −9..119, and −7..118 in layout pixels.

Fix: under 420px the path offset factor is 0.42, the path padding is 12px, and the node label max width is 112px with overflow wrap. The desktop zigzag is unchanged.

Verification: `larger text keeps the home screen inside the viewport`. `data-big` is set, the unzoomed overflow list is empty, and the zoomed layout-pixel list is empty. An earlier slice of all 14 fresh tests passed on phone-light and desk-light (28). The combined run repeats this test on all four projects. CSS zoom is the measurement. Pinch zoom was not used.

## Cycle 120 — The level formula

Read `level()`. The XP to reach level n is `25 * n * (n + 3)`, and the next level needs `100 + 50 * n`. The existing feature test checks 100, 249, and 250 XP.

Found nothing wrong. No formula change.

Verification: `levels follow the xp curve and huge xp still renders` PASS on all four projects in the combined run.

## Cycle 121 — Double XP and the daily log

Read `addXP()`. Double XP multiplies the grant before it is written to `xpLog`, so the doubled amount counts toward the daily goal.

That is the intended rule. No change, and no new test.

## Cycle 122 — Hearts, the shop, and a streak freeze

Read the heart timer, the shop debounce, and the streak freeze. A freeze covers one missed day and is all or nothing. The shop waits 400ms per item. Regeneration is 30 minutes, and a new `heartDay` refills to 5.

Found no new contradiction. No change.

Verification: `hearts regenerate, refill at midnight, and block lessons at zero`, `streak freeze covers one missed day and resets when it cannot`, and the shop cases in the combined run. PASS on all four projects.

## Cycle 123 — No saved profile

Cleared `byteroots-profiles` and loaded the app. Empty storage already builds a profile and shows onboarding. A corrupt `{` was already covered by the older boot test.

Found nothing broken.

Verification: `a fresh install with no profile reaches onboarding`. Start from scratch, Pick an avatar, and Fox avatar are visible. `corrupt storage boots instead of hanging` PASS in the combined run.

## Cycle 124 — Print snippets after the rewrites

Ran every Java and Swift print snippet after the cycle 106 edits. Multiple choice and fill answers are still not executed.

Verification: `validate-java.js` PASS, 175 snippets, JDK 21. `validate-swift.js` PASS, 42 snippets, Swift 6.0.3.

## Cycle 125 — The bundle and the combined run

Checked the byte budget after the copy, the labels, and the phone-path rules. The cap is still 400000. `boot.js` is included.

Found 339293 bytes. That is inside the cap.

Verification: `validate-perf.js` PASS, bytes=339293, limit=400000. The combined `npm test` is below. `rapid navigation lands on the last screen` and `the local day follows a timezone change` are in that run. The timezone case sets Pacific/Kiritimati, reads offset −840, and sees hearts refill to 5 on the page’s local day.

## Final verification

`npm test` from `tests/` exited 0. Playwright reported 2.5m. An earlier slice of `e2e/fresh.spec.js` on phone-light and desk-light passed 28 tests. This run is the one that counts.

- `validate-data.js` PASS, lessons=62, exercises=683, interview=139, fixes=62, outs=217
- `validate-static.js` PASS
- `validate-docs.js` PASS, 53 URLs
- `validate-java.js` PASS, 175 snippets, JDK 21
- `validate-swift.js` PASS, 42 snippets, Swift 6.0.3
- `validate-ambiguity.js` PASS, arrange-duplicates=1
- `validate-perf.js` PASS, bytes=339293, limit=400000
- Playwright PASS, 264 passed, 0 skipped

The four soak logs are `soak nodes 244 243` with heaps 2913568, 2909416, 2908144, and 2908512, each with 50 lessons. The four slow-4G times are 2640 ms, 2621 ms, 2734 ms, and 2704 ms.

## Closing summary

- Total cycles completed: 125. This batch is 101–125.
- Bugs found and fixed in this batch: 16. Counted once each: Scanner missing before the strings bug (101); HashMap named before Maps (102); Big-O notation before the Big-O lesson (103); pattern matching before Modern Java (104); ArrayDeque and PriorityQueue unnamed in the lists lesson (105); the copied print questions (106); quest gems left unpaid on an already full bar (107); the daily-goal gems skipped when the goal drops under today’s XP (108); the out-of-hearts screen standing still across midnight (109); a second tab replacing the profile under an open lesson (110); avatar buttons with no names (111); settings goals that were not radios (112); switch buttons that all said Switch, and calendar letters with no day names (113); an open tab with no reload toast when a worker takes control (114); phone path labels past the left edge at CSS zoom 2 (119).
- Not in that 16: the exact avatar locator (111), the service-worker test reloading so activate runs (114), the zoom measurement dividing by the computed zoom (119), the name wrap rules whose earlier overflow was not measured (116), and the cache rename from v16 to v17 (114). Cycles 115–118 and 120–124 found the checked behavior already working.
- Cumulative bugs across cycles 1–125: 75. The first hundred counted 59.
- Final test counts: `npm test` exited 0. Validators: lessons 62, exercises 683, interview 139, fixes 62, outs 217, docs 53, Java snippets 175 (JDK 21), Swift snippets 42 (Swift 6.0.3), arrange-duplicates 1, bytes 339293 of 400000. Playwright 264 passed, 0 skipped, in 2.5m. Soak on all four projects: 244 nodes then 243, heaps 2908144–2913568, 50 lessons. Slow 4G on all four projects: 2621–2734 ms, under the 8 second guard.
- Known limitations / not testable here:
  - No physical phone, no spoken VoiceOver, and no installed home-screen icon. The new labels are the accessible names Playwright reads. Offline is a Playwright context set to offline. CSS zoom 2 is not pinch zoom.
  - The service-worker case plants a v16 cache, reloads onto this build’s worker, and then dispatches `controllerchange`. It does not serve two different `sw.js` files to one tab that stays open the whole time.
  - A question already on screen still meets midnight through the existing continue path. The new clock jump covers the out-of-hearts screen.
  - The slow-4G times are Chromium emulation against the local uncompressed server. They are not a Lighthouse run and not the live GitHub Pages site.
  - The 50-lesson soak is four projects and a heap snapshot after a garbage collection. It is not a multi-hour session.
  - Print snippets were executed. Multiple choice and fill answers were not executed. The duplicate programs in this batch were found by comparing the question text and the code.
