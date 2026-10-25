# Audit round 3

Independent check of ByteRyte after cycles 1–200. Prior PASS results were treated as unverified until this round produced its own evidence. This file does not say the app is free of defects.

Wall clock: start `2026-10-25T23:05:26Z` (`date -u` at the start of this audit). Report closed `2026-10-25T23:27:41Z`. Elapsed 22 minutes 15 seconds. The full `npm test` log at `/tmp/npm-test-audit.txt` shows Playwright traffic from `23:18:11` to `23:20:26` and `320 passed (2.6m)`. Close-out reproductions against pre-fix `app.js` ran at `23:25:15Z`.

Base commit: `96d50e0` (`origin/main` at the start, cache `byteryte-v20`). Fix commit on this branch: `f803009`. Cache shipped with the fix: `byteryte-v21`.

## Ledger

Columns: ID, component, failure hypothesis, method and input, expected, actual, evidence, status, new or regression, follow-up.

### R3-01 — level formula

- Component: `level()` in `app.js`. Requirement: XP maps to one level, progress into that level, and the XP required for the next level.
- Hypothesis: the closed form disagrees with a plain loop.
- Method: `tests/audit-logic.js` extracts `finite` and `level` from the current `app.js` and compares them with `while (T(n+1) <= xp) n++`, where `T(n) = 25*n*(n+3)`. Run twice at `2026-10-25T23:25:15Z`.
- Expected: `L`, `into`, and `need` match on every sample.
- Actual: `PASS level samples checked 122` in `America/New_York` and in `Pacific/Kiritimati`. The list length is 122. Distinct XP values are 120 (`0` and `999` are each listed twice).
- Evidence: both commands printed `audit-logic PASS` with exit 0.
- Status: PASS. Verification of current code, not a defect.
- New. Follow-up: none for this formula.

### R3-02 — dayDiff across the 2026-03-08 US spring-forward

- Component: `iso`, `shiftDay`, `dayDiff`.
- Hypothesis: a 23-hour local day makes adjacent dates look like the same day or skips a day.
- Method: same script as R3-01. `dayDiff('2026-03-07','2026-03-08')` and `dayDiff('2026-03-07','2026-03-09')`, plus `shiftDay(1)` from `2026-03-07T12:00`.
- Expected: diffs `1` and `2`. Shifted day `2026-03-08`.
- Actual: both zones printed `diffs 1,2` and `shiftDay 1 from Mar 7 2026-03-08`.
- Evidence: `audit-logic PASS` at `23:25:15Z`.
- Status: PASS. New. Follow-up: none.

### R3-03 — calendar date `2026-02-31`

- Component: `Date` parsing and `dayOk` before the round-trip check.
- Hypothesis: a regex-only `YYYY-MM-DD` check stores a day that `Date` interprets as a different day.
- Method: the same script prints `dayDiff('2026-02-31','2026-03-01')` and `new Date('2026-02-31T12:00')`. The script's own assertion is hard-coded `true`; the useful result is the printed value. Pre-fix `dayOk` is `typeof s==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(s)` (`git show 96d50e0:app.js`).
- Expected if the string were a real day: a non-negative distance of a few days, and the same calendar day after parsing.
- Actual: both zones printed `dayDiff=-2` and `Tue Mar 03 2026 12:00:00` (`GMT-0500` in New York, `GMT+1400` in Kiritimati).
- Evidence: `audit-logic` stdout at `23:25:15Z`. UI consequence is R3-08.
- Status: the observation is a confirmed fact. The script line does not fail when the diff is −2, so this row is not a failing automated assertion.
- New. Follow-up: R3-08.

### R3-04 — shop purchase while a lesson is open

- Component: `save()` conflict path. Requirement: one tab's purchase survives another tab's lesson save.
- Hypothesis: with `R` set, `save()` hydrates the newer store and then writes the in-memory profile over the other tab's row.
- Method: `tests/e2e/audit.spec.js` "a lesson tab does not drop a shop purchase from the other tab". Profile Ada, 200 gems, 0 freezes. Both pages reach the same `rev`, then one starts `java.run` and the other buys Streak freeze. The lesson tab answers the current multiple-choice item. Stored profile must keep the purchase.
- Expected: `freezes === 1`, `gems === 150`, name Ada, active `ptest`.
- Actual, pre-fix: served `git show 96d50e0:app.js` at `http://127.0.0.1:8892/ByteRyte/` (no `mergeEcon`). Phone-light failed in 485ms: `expect(stored.freezes).toBe(1)` received `0` at `audit.spec.js:38`. The name and active assertions above that line had already passed.
- Actual, fixed code: `/tmp/npm-test-audit.txt` shows the test passed on phone-light (522ms), phone-dark (448ms), desk-light (481ms), and desk-dark (432ms).
- Root cause on `96d50e0`: the conflict branch does `P=latest; hydrate(); P.list[active]=mine`. `mine` is the lesson tab's whole profile, so the other tab's freeze and gem spend are replaced.
- Status: FAIL on `96d50e0`, PASS on `f803009`. New defect. Follow-up: economy fields are merged; lesson progress fields are not (R3-S1).

### R3-05 — weak-spot practice miss count

- Component: `judge()` miss counter.
- Hypothesis: a wrong answer in practice increments `misses`, and the later correct answer is not a first try, so the count stays high.
- Method: miss the first `java.run` question, quit, open Practice on `.weak`, answer wrong again. Expect `misses['java.run']` to stay `1`.
- Expected: `1`.
- Actual, pre-fix (`96d50e0` app, same server as R3-04): received `2` at `audit.spec.js:71`. Pre-fix line is `if(!k.startsWith('iv')){ ... misses[lk]++ }` with no practice exception. The practice path only decrements on a first-try correct.
- Actual, fixed code: the suite log shows the test passed on all four projects (575ms, 485ms, 425ms, 446ms).
- Status: FAIL on `96d50e0`, PASS on `f803009`. New defect. Follow-up: review mode still increments. That path was not given its own wrong-answer run in this audit.

### R3-06 — doubleUntil hundreds of days ahead

- Component: `sanitize()` / `dblOn()`.
- Hypothesis: `finite(..., null)` keeps any finite future timestamp, so a corrupt value leaves Double XP active.
- Method: boot with `doubleUntil: Date.now()+400*86400000`. Expect `0` and no "Double XP active" text.
- Expected: `0`.
- Actual, pre-fix: received `1827530724236` at `audit.spec.js:78` (phone-light, 186ms). The pre-fix file has `p.doubleUntil=finite(p.doubleUntil,0,0,null)` and no 30-day cap.
- Actual, fixed code: passed on all four projects (155ms, 141ms, 149ms, 161ms).
- Status: FAIL on `96d50e0`, PASS on `f803009`. New defect. Follow-up: a value inside 30 days is kept. A stack of 15-minute purchases that would pass 30 days was not built; the existing "buying Double XP twice" regression passed inside the suite.

### R3-07 — corrupt profile JSON

- Component: boot when `localStorage['byteroots-profiles']` is not an object.
- Hypothesis: `'{'` or `'[]'` throws or renders a blank page.
- Method: `boot(..., { raw: '{' })` and `boot(..., { raw: '[]' })`. Expect the heading "Welcome to ByteRyte".
- Expected: heading visible, and the suite's console hook reports no page error.
- Actual: both tests passed on all four projects in `/tmp/npm-test-audit.txt` (`{` at 130/111/110/103ms, `[]` at 140/96/104/91ms).
- Status: PASS. Fault injection, not a defect found. New. Follow-up: none from these two inputs.

### R3-08 — impossible `heartDay` and `last`

- Component: `dayOk` plus `daily()`.
- Hypothesis: `2026-02-31` stays stored and the path fails to open.
- Method: boot with `heartDay` and `last` set to `2026-02-31`, streak 4, hearts 1. Expect Daily goal, `hearts > 0`, `heartDay` not that string, and `last === null`.
- Expected: those four checks.
- Actual, pre-fix: failed at `expect(s.last).toBe(null)` with received `"2026-02-31"` (`audit.spec.js:98`, 176ms). The `hearts > 0` and `heartDay !== '2026-02-31'` lines above it did not fail. Inference from that order: pre-fix `daily()` already replaced `heartDay` because it was not today. It left `last` as the impossible string. This run did not measure a streak number on screen.
- Actual, fixed code: passed on all four projects (171ms, 114ms, 134ms, 126ms). Current `dayOk` requires `!isNaN(d.getTime()) && iso(d)===s`, so `2026-02-31` becomes null before `daily()` runs.
- Status: FAIL on `96d50e0` for the stored `last` value. PASS on `f803009`. New defect. Follow-up: no separate streak-UI assertion for this date.

### R3-09 — mutation of the purchase assertion

- Component: the R3-04 test, against the fixed `app.js` with the merge call forced off.
- Hypothesis: the test still passes if `mergeEcon` is skipped, which would mean it does not detect the defect.
- Method: copy current `app.js` to `/tmp/br-mut-pages` only. Change `if(remote&&base)mergeEcon(mine,remote,base)` to `if(false&&remote&&base)mergeEcon(...)`. Serve that copy on port 8893. Run the purchase test. Do not edit `/workspace/app.js`.
- Expected if the assertion works: `freezes` received `0`.
- Actual: phone-light failed in 453ms, `Expected: 1`, `Received: 0`, at `audit.spec.js:38`.
- Evidence: `/workspace/app.js` line 139 is still `if(remote&&base)mergeEcon(mine,remote,base);`. `rg` found no `false&&` in the workspace file.
- Status: FAIL, as required for the mutation. The test can detect a skipped merge. New. Follow-up: none. The mutation was not committed.

### R3-10 — out of hearts across midnight, historical build

- Component: `outOfHearts` on commit `02f3957` (before the heart-watch refill).
- Hypothesis: the screen stays on "Out of hearts" after the clock crosses midnight.
- Method: the audit session served that commit and ran `/tmp/old-midnight.js`. This close-out did not re-execute that script. The tool output is in the session transcript.
- Expected by the current product test: hearts become 5 and the Learn screen returns.
- Actual on `02f3957`: `{"before":0,"heading":"Out of hearts","hearts":0,"heartDay":"2026-06-15","errors":[]}`.
- Actual on current code: suite test "out of hearts refreshes when the day rolls over" passed on all four projects (218ms, 202ms, 242ms, 303ms).
- Status: FAIL on `02f3957` (recorded output). PASS on the current suite for the later test. Regression verification of an older fix. Follow-up: none in this round.

### R3-11 — full `npm test` on `f803009`

- Component: validators and the Playwright suite (phone-light, phone-dark, desk-light, desk-dark).
- Hypothesis: the four edits, or the cache rename to `byteryte-v21`, break an existing check.
- Method: `npm test` from `/workspace/tests`. Log `/tmp/npm-test-audit.txt`.
- Expected: every validator PASS, Playwright exit 0, perf bytes at or under 400000.
- Actual:
  - `validate-data PASS lessons=62 exercises=687 interview=140 fixes=62 outs=218`
  - `validate-static PASS`
  - `validate-docs PASS urls=53`
  - `validate-java PASS snippets=176 jdk=21`
  - `validate-swift PASS snippets=42 Swift version 6.0.3 (swift-6.0.3-RELEASE)`
  - `validate-ambiguity PASS arrange-duplicates=1`
  - `validate-perf PASS bytes=348759 limit=400000`
  - `320 passed (2.6m)` and `EXIT:0`. The log has no skipped count.
- Arithmetic: 6 new audit tests × 4 projects = 24. 320 − 24 = 296, the previous Playwright count on `main`.
- Status: PASS. Regression. Follow-up: none from this run.

Related rows inside that same 320, all PASS on four projects (not separate campaigns):

| Check | Times in the log |
| --- | --- |
| a full disk shows a save error instead of a page error | 254, 222, 230, 222 ms |
| a lesson keeps its profile when another tab adds one | 551, 535, 590, 614 ms |
| a second tab keeps a purchase and a goal change from the other tab | 511, 483, 485, 486 ms |
| buying Double XP twice extends the window by 15 minutes each time | 509, 524, 397, 405 ms |
| slow 4G and a 4x CPU still reach the daily goal | `slow4g ms` 2678, 2724, 2737, 2706 |
| fifty lessons in a row (soak) | heaps 2932860, 2932596, 2927908, 2927888; nodes 244 then 243; 50 lessons |

The slow-4G figure is Chromium network and CPU emulation against the local server. The soak is a heap snapshot after `gc`, not a multi-hour run.

## Coverage

Executed and recorded:

- Profile save conflict for gems, freezes, and the active profile identity while a lesson is open.
- Practice miss counter.
- `doubleUntil` far in the future.
- Impossible `YYYY-MM-DD` stored in `last`.
- Boot from `'{'` and from `'[]'`.
- Level formula against an independent loop, two timezones.
- `dayDiff` / `shiftDay` across 2026-03-08, two timezones.
- Midnight hearts on `02f3957` (recorded script output) and the current suite test.
- Full-disk save error, a second tab that is not inside a lesson, stacked Double XP, soak, and emulated slow 4G, via the one full suite.
- Mutation: purchase assertion fails when the merge call is skipped.

Read, not executed as a test:

- `sw.js` fetch `catch` returns `caches.match('index.html')` for a failed request that is not a navigation (`sw.js` line 9).
- `mergeEcon` does not touch `xp`, `done`, `streak`, `misses`, `review`, `last`, or `xpLog`. No second-tab lesson completion was run.
- Pedagogy: `validate-java` and `validate-swift` executed print snippets. Multiple-choice and fill answers were not executed as a learner would answer them.

Not run, so not claimed:

- A physical phone, spoken VoiceOver, an installed home-screen icon, pinch zoom, two live GitHub Pages deploys of `sw.js`, Lighthouse, a multi-hour soak.

## Checkpoint

- A. Scope came from `app.js` save/sanitize/judge, `sw.js`, the Playwright config, and `96d50e0` as the pre-fix tree. Cache on that commit was `byteryte-v20`.
- B. First-principles checks found the whole-profile overwrite, the practice miss increment, the unbounded `doubleUntil`, and the regex-only date.
- C. Negative cases: raw `{`, raw `[]`, `doubleUntil` 400 days ahead, `heartDay`/`last` of `2026-02-31`, and the lesson-tab versus shop-tab interleaving. Storage-quota behavior was the existing full-disk test inside R3-11, not a new `setItem` throw written for this round.
- D. Level and day math used a second implementation (`while` loop and direct `Date` prints) before the post-fix UI runs. Pre-fix expectations were written in the tests, then the tests were run on `96d50e0` app.js.
- E. Smallest fixes are in `f803009`: delta-merge the economy fields, skip the miss increment in practice, cap `doubleUntil` at 30 days, and reject dates that do not round-trip through `iso`. Each failing test was run again on the fixed tree via R3-11. Cache name moved to `byteryte-v21` because `app.js` changed.
- F. R3-11 is the cross-suite run. The two-tab test that is not inside a lesson still passed, which is a different path from R3-04 (that path discards the local profile and toasts).
- G. R3-09 broke the merge and the purchase test failed. R3-03's script assertion cannot fail on a bad `dayDiff` because it passes `true`; the UI test R3-08 is the one that fails. The weakest untested spot is R3-S1. It was not given a passing result.

## Suspected, not executed

### R3-S1 — lesson progress still overwritten

`mergeEcon` adjusts gems, hearts, freezes, inventory, `doubleUntil`, goal fields, heart timers, and `stats.bought`. It does not adjust `xp`, `xpLog`, `done`, `streak`, `best`, `last`, `misses`, or `review`. The conflict branch still assigns `P.list[active]=mine`. A second tab that finishes a lesson while this tab is inside a lesson can still lose that completion on the next save. This was not run. Status: suspected from reading the code. Severity: high, because it is the same class of bug as R3-04 for the fields learners care about most.

### R3-S2 — failed script fetch answered with HTML

`sw.js` answers a failed non-navigation GET with `index.html`. A failed `app.js` fetch could be stored or executed as HTML. Not run. Severity: medium.

### R3-S3 — 30-day doubleUntil ceiling

A timestamp more than 30 days ahead is cleared, including a hypothetical stack of 15-minute purchases past that cap (2880 purchases). No test built that stack. Severity: low.

## 7. Final report

1. Duration. Start `2026-10-25T23:05:26Z`. End `2026-10-25T23:27:41Z`. Wall clock 22 minutes 15 seconds. That is the time actually recorded. It is not a 60-minute claim.

2. Scope inspected. `app.js` storage, sanitize, save conflict, hearts/`daily`, `judge` misses, and level/day helpers. `sw.js` cache name and fetch handler (read). Playwright audit spec, `audit-logic.js`, and the full `npm test` log. Pre-fix `app.js` from `96d50e0` and `outOfHearts` behavior recorded on `02f3957`.

3. Distinct tests. Ten audit rows, R3-01 through R3-10. R3-07 is one row with two inputs (`{` and `[]`). Extra executions of those rows: R3-01, R3-02, and R3-03 each ran in two timezones; R3-04, R3-05, R3-06, and R3-08 ran on pre-fix `app.js` during close-out and again on the fixed tree inside the suite; R3-09 is one mutation run. Regression, counted separately: one `npm test` (R3-11), 7 validators PASS, 320 Playwright passed. Of those 320, 24 are the 6 audit specs × 4 projects and 296 are the previous suite.

4. Coverage achieved. The rows in "Executed and recorded" above. Not covered: R3-S1, R3-S2, a second tab spending gems in the same instant (the formula `remote+(mine-base)` was not given its own test), review-mode miss increments, physical device, VoiceOver, installed PWA, pinch zoom, live GitHub Pages, Lighthouse, multi-hour soak, and executing multiple-choice or fill answers as a learner.

5. Confirmed defects, with repro.
   - R3-04. On `96d50e0`, a lesson tab's next answer wrote `freezes` 0 over the other tab's freeze purchase (`Expected: 1`, `Received: 0`). Cause: `P.list[active]=mine` after hydrate.
   - R3-05. A wrong practice answer moved `java.run` misses from 1 to 2 (`Received: 2`). Cause: the miss increment did not exclude practice.
   - R3-06. `doubleUntil` 400 days ahead was kept (`Received: 1827530724236`). Cause: no upper bound.
   - R3-08. `last` stayed `"2026-02-31"` (`Expected: null`). Cause: `dayOk` accepted any regex date. R3-03 shows that string parses as 3 March 2026 and `dayDiff` to 1 March 2026 is −2.

6. Suspected. R3-S1 lesson-progress clobber (high). R3-S2 service-worker HTML fallback for a failed script (medium). R3-S3 clearing a `doubleUntil` that is more than 30 days ahead (low).

7. Blocked or inconclusive. Device, VoiceOver, installed icon, pinch zoom, live Pages, Lighthouse, and a multi-hour soak were not run. R3-03's node check does not fail on its own. No streak number was read off the screen for `last === "2026-02-31"`. Docs URLs in this suite returned PASS for 53 URLs; this run did not record a 503.

8. Fixes in `f803009`, and how they were checked.
   - `mergeEcon` keeps a delta of the economy fields and still keeps a profile the other tab added. R3-04 passed on four projects. R3-09 failed when that call was skipped.
   - Practice no longer increments misses. R3-05 passed on four projects after failing on `96d50e0`.
   - `doubleUntil` more than 30 days ahead becomes 0. R3-06 passed on four projects after failing on `96d50e0`.
   - `dayOk` requires the round-trip `iso(d)===s`. R3-08 passed on four projects after `last` stayed `"2026-02-31"` on `96d50e0`.
   - Service worker cache renamed to `byteryte-v21` because `app.js` shipped. `validate-static` PASS. This rename is the ship step, not a product defect.

9. Regression. R3-11: 320 passed, exit 0, 348759 bytes. The not-in-lesson two-tab purchase, the new-profile-while-in-lesson case, stacked Double XP, midnight hearts, full disk, soak, and slow 4G all passed inside that run.

10. Remaining risks, highest first.
    - High: R3-S1, other tab's XP and lesson completion can still be overwritten. Not reproduced in a run.
    - Medium: R3-S2, a failed non-navigation fetch can be answered with `index.html`. Not run.
    - Low: R3-S3, the 30-day cap. Not hit by a long stack.
    - Low: the environment limits in item 7. The suite's slow 4G and soak do not stand in for a phone or a long run.

11. Single most important next action. Reproduce a second tab finishing a lesson (XP and `done`) while the first tab is inside a lesson. Then either delta-merge those fields or refuse the second writer. Do not treat R3-04's economy merge as covering that case.

The app is not claimed to be free of defects.
