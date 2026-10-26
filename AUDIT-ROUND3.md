# Audit round 3

Independent check of ByteRyte after cycles 1–200. Prior PASS results were treated as unverified until this round produced its own evidence. This file does not say the app is free of defects.

Part 1 wall clock: start `2026-10-25T23:05:26Z` (`date -u` at the start of this audit). Part 1 report closed `2026-10-25T23:27:41Z` (22 minutes 15 seconds). The full `npm test` log at `/tmp/npm-test-audit.txt` shows Playwright traffic from `23:18:11` to `23:20:26` and `320 passed (2.6m)`. Close-out reproductions against pre-fix `app.js` ran at `23:25:15Z`.

Part 2 started `2026-10-25T23:29:15Z` from `origin/main` `8dbc279` and closed `2026-10-25T23:44:02Z` (14 minutes 47 seconds). Active time for parts 1 and 2, not counting the gap between them, is 37 minutes 2 seconds.

Part 3 started `2026-10-25T23:46:17Z` from `origin/main` `daaa413` (cache `byteryte-v23`) and closed `2026-10-26T00:00:29Z` (14 minutes 12 seconds). Active time for all three parts, not counting the gaps between user messages, is 51 minutes 14 seconds. Fix commit on this branch: `7840da4`. Cache shipped with the fix: `byteryte-v24`.

Part 4 started `2026-10-26T00:28:34Z` from `origin/main` `70a9a02` (cache `byteryte-v24`) and closed `2026-10-26T00:36:49Z` (8 minutes 15 seconds). This part is after the round 3 total above. Fix commit: `20a56e1`. Cache shipped with the fix: `byteryte-v25`.

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

Part 1 left these unread by a test. Part 2 ran them. See R3-12 and R3-13.

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
- G. R3-09 broke the merge and the purchase test failed. R3-03's script assertion cannot fail on a bad `dayDiff` because it passes `true`; the UI test R3-08 is the one that fails. The weakest untested spot at the end of part 1 was R3-S1.
- Part 2, from `8dbc279`. R3-12 reproduced the XP/`done` clobber and `mergeProg` fixed it. R3-13 reproduced the non-navigation HTML fallback and the fetch handler now rejects those requests. R3-14 through R3-17 measured gems, review misses, the impossible-`last` streak, and the 30-day `doubleUntil` line. R3-18 through R3-20 broke each new assertion and the tests failed. R3-22 then showed the same save still dropped badges `first` and `perfect`; the merge now unions badges and same-day quest counters. R3-23 is the suite on that tree. Cache on the branch is `byteryte-v23`.

## Suspected, not executed

### R3-S1 — lesson progress still overwritten

Part 1 status: suspected from reading `mergeEcon`. Part 2 reproduced it as R3-12 and the badge gap as R3-22. Not still open.

### R3-S2 — failed script fetch answered with HTML

Part 1 status: read, not run. Part 2 reproduced it as R3-13 and changed the handler. Not still open.

### R3-S3 — 30-day doubleUntil ceiling

Part 1 had not measured the boundary. R3-17 did: a value at exactly 30 days stayed, and 30 days plus one 15-minute step was cleared. No one clicked 2880 purchases. Severity of the remaining unclicked stack: low.

## Part 2 ledger

Continued from `8dbc279` (`origin/main` after PR #16). New rows start at R3-12.

### R3-12 — second tab finishes a lesson while this tab is in one

- Component: `save()` while `R` is set. Requirement: the other tab's XP, `done`, streak, and lesson count survive this tab's next answer.
- Hypothesis: `mergeEcon` keeps gems and the whole profile write still drops lesson progress.
- Method: both pages share a profile. Revs match. This tab starts `java.run` and stays on the first question. The other tab finishes that lesson with `answerSession`. This tab then answers one question, which calls `save()`.
- Expected: stored `done['java.run']` stays true, and XP, `stats.lessons`, streak, and `last` stay equal to the values saved by the finishing tab.
- Actual, before `mergeProg`, on `8dbc279`: the finishing tab had written `{"xp":31,"done":true,"lessons":1,"streak":1,"last":"2026-10-25"}`. After this tab answered, `expect(stored.done).toBe(true)` received `false` at `audit.spec.js:140`.
- Actual, after `mergeProg`: phone-light passed in 839ms. The final suite passed it on phone-light (the log line is in `/tmp/npm-test-r3b2.txt`), phone-dark, desk-light, and desk-dark.
- Status: FAIL on `8dbc279`, PASS after the fix. New defect. Follow-up: R3-22 (badges were still dropped by that first merge).

### R3-13 — failed script fetch answered with the page

- Component: `sw.js` fetch `catch`.
- Hypothesis: a cache miss plus a network failure for a non-navigation request is answered with `index.html`.
- Method: boot, wait for a service-worker controller, `setOffline(true)`, `fetch('./not-a-real-asset.js')`.
- Expected: the fetch rejects. The body is not HTML.
- Actual, before the handler change: `{"ok":true,"status":200,"type":"text/html","html":true,"start":"<!DOCTYPE html>\n<html lang=\"en\"><head>\n<meta charset=\"utf-8\""}`. `result.error` was undefined.
- Actual, after the handler throws unless `request.mode==='navigate'`: phone-light passed in 265ms. The final suite passed the offline script test on all four projects (188ms, 150ms, 152ms, 147ms). Offline reload of the app still passed (`offline reload under /ByteRyte/ uses cache v23`).
- Status: FAIL before the change, PASS after. New defect. Follow-up: none for navigation; that path still uses the cached page.

### R3-14 — two lesson tabs each spend 50 gems

- Component: `mergeEcon` gem and freeze deltas.
- Hypothesis: two spends from the same baseline collapse to one spend.
- Method: both tabs are inside a lesson, so storage events are ignored. Each sets memory `gems -= 50` and `freezes += 1` from 200 gems and 0 freezes, then each answers, which saves.
- Expected: stored gems `100`, freezes `2`.
- Actual: passed on `8dbc279` before `mergeProg` (733ms) and again after (728ms), then on all four projects in the final suite.
- Status: PASS. This is the economy formula, not a new defect. New measurement. Follow-up: the spends were applied in memory and then saved in sequence. They were not two shop clicks racing on the home screen.

### R3-15 — review-mode miss

- Component: `judge()` when `R.mode==='review'`.
- Hypothesis to check: a wrong review answer counts a miss, and it does not spend a heart. The practice exception was not supposed to cover review.
- Method: seed `misses['java.run']=1` and `review['java.run~0']={box:0,due:0}`. Open Review mistakes. Answer wrong.
- Expected: misses `2`, hearts `5`.
- Actual: passed in 324ms on the pre-change tree and on all four projects in the final suite.
- Status: PASS. Verified behavior, not a defect. New. Follow-up: R3-20 shows the assertion fails if review is excluded from the increment.

### R3-16 — streak shown for an impossible `last`

- Component: `dayOk` then `daily()`.
- Hypothesis: `last: '2026-02-31'` is discarded and the stored streak number is left at 4, because the gap check never sees that string.
- Method: boot with that `last`, streak 4, best 4. Read state and the streak label.
- Expected: `last === null`, streak `4`, accessible name `4 day streak`.
- Actual: passed in 271ms before the part-2 app edits and on all four projects in the final suite.
- Status: PASS. Not a defect. The part-1 UI test had not read the streak number. New. Follow-up: none.

### R3-17 — doubleUntil at 30 days and one step past

- Component: the `doubleUntil` cap.
- Hypothesis: `>` clears only values past `Date.now()+30*864e5`. Exactly that instant stays. One more 15-minute step (`30*864e5 + 15*60000`, the timestamp 2881 purchases of 15 minutes would reach) is cleared.
- Method: two boots. No shop was clicked 2881 times.
- Expected: the on-line value is kept equal to the seeded timestamp. The step past is `0`, and "Double XP active" is absent.
- Actual: passed in 333ms before the part-2 edits and on all four projects in the final suite.
- Status: PASS. Not a defect. New. Follow-up: a clicked stack was not run.

### R3-18 — mutation, skip `mergeProg`

- Component: the R3-12 assertion.
- Method: copy `app.js` to `/tmp/br-mut-prog` only. Change `if(remote&&pbase)mergeProg(...)` to `if(false&&...)`. Serve port 8894. Workspace file was not edited.
- Expected: `done` received `false`.
- Actual: phone-light failed, `Expected: true`, `Received: false`, at `audit.spec.js:139`.
- Status: FAIL, as required. The workspace line stayed `if(remote&&pbase)mergeProg(mine,remote,pbase);`. New. Follow-up: none.

### R3-19 — mutation, restore the HTML fallback

- Component: the R3-13 assertion.
- Method: copy `sw.js` to `/tmp/br-mut-sw` only. Change the navigate guard to `if(false&&q.mode!=='navigate')`, so the catch returns `index.html` again. Serve port 8895.
- Expected: `result.error` is missing.
- Actual: phone-light failed, `expect(result.error).toBeTruthy()` received `undefined`. The response body was not printed on this run. The same assertion had failed in R3-13 when the body was the page HTML.
- Status: FAIL, as required. Workspace `sw.js` still throws for a non-navigation. New. Follow-up: none.

### R3-20 — mutation, review does not increment misses

- Component: the R3-15 assertion.
- Method: copy `app.js` to `/tmp/br-mut-rev` only. Add `&&R.mode!=='review'` to the miss increment. Serve port 8896.
- Expected: misses received `1`.
- Actual: phone-light failed, `Expected: 2`, `Received: 1`, at `audit.spec.js:193`.
- Status: FAIL, as required. Workspace `app.js` still increments in review. New. Follow-up: none.

### R3-21 — suite before the badge assertion

- Component: the tree that had `mergeProg` and the script-fetch fix, before badges were in the test.
- Method: `npm test`. Log `/tmp/npm-test-r3b.txt`.
- Expected: exit 0, bytes at or under 400000.
- Actual: validators PASS with the same lesson, exercise, interview, fix, out, doc, Java, Swift, and ambiguity counts as R3-11. `validate-perf PASS bytes=351376 limit=400000`. `344 passed (2.7m)`. `EXIT:0`. Soak heaps 2945272 (phone-light), 2945244 (phone-dark), 2940688 (desk-light), 2940612 (desk-dark). Slow 4G 2695, 2726, 2772, 2775 ms.
- Status: PASS. Regression of an intermediate tree. It did not assert badges. Follow-up: R3-22.

### R3-22 — badges dropped by the same lesson-tab save

- Component: `badges` and same-day quest counters, after XP and `done` were already merged.
- Hypothesis: `mergeProg` still assigns the lesson tab's empty badge map over the finishing tab's badges.
- Method: extend R3-12. The finishing tab must keep badge ids, and `qd.p.lessons` must stay equal to the finishing tab's value.
- Expected: stored badges contain every id the finishing tab saved, including `first`. Quest lesson count stays equal and is greater than 0.
- Actual, before the badge and quest lines were added to `mergeProg`: XP and `done` assertions had passed, then `expect(stored.badges).toEqual(expect.arrayContaining(finished.badges))` failed. Expected array containing `["first","perfect"]`. Received `[]`. The quest assertion was not reached on that run.
- Actual, after union of badge ids and a same-day delta of `qd.p`: phone-light passed in 564ms. The final suite includes this assertion on all four projects.
- Status: FAIL before the badge union, PASS after. New defect, same save path as R3-12. Follow-up: a profile reset in the other tab was not run. A union will not honor a deletion.

### R3-23 — final `npm test`

- Component: the tree with badge and quest merging and cache `byteryte-v23`.
- Method: `npm test`. Log `/tmp/npm-test-r3b2.txt`.
- Expected: exit 0, bytes at or under 400000.
- Actual: same validator counts as R3-21. `validate-perf PASS bytes=352309 limit=400000`. `344 passed (2.7m)`. `EXIT:0`. Soak heaps 2948988 (phone-light), 2948452 (phone-dark), 2939884 (desk-light), 2943796 (desk-dark). Nodes 244 then 243, 50 lessons. Slow 4G 2723, 2728, 2726, 2749 ms.
- Arithmetic: 12 audit specs × 4 projects = 48. 344 − 48 = 296, the pre-audit Playwright count.
- Status: PASS. Regression. Follow-up: none from this log.

### R3-24 — a reset is written back by the lesson tab

- Component: `mergeProg` union of `done` and badges, while `R` is set. Requirement: another tab's reset of this profile stays reset.
- Hypothesis: the lesson tab's old `done` map is copied first, and the reset's empty map adds nothing, so `java.run` comes back.
- Method: `tests/e2e/audit.spec.js` "a lesson tab does not restore progress the other tab reset". Profile Ada, XP 80, streak 2, `done['java.run']`, badge `first`, 1 lesson. Both pages reach the same `rev`. This tab starts the current lesson. The other tab opens Settings and presses `Reset Ada's progress` (confirm accepted). After Daily goal is visible, storage must show XP 0, `java.run` not done, no badges, name Ada. This tab then answers the open question.
- Expected after that answer: `done` false, XP 0, badges `[]`, name Ada, `gen` greater than 0.
- Actual, pre-fix `daaa413`, phone-light, 728ms: the assertions before the answer passed, then `expect(stored.done).toBe(false)` received `true` at `audit.spec.js:261`. The XP, badge, and `gen` assertions were not reached.
- Actual, fixed code: phone-light passed in 701ms before the suite. `/tmp/npm-test-r3c.txt` shows the same test passed on phone-light (505ms), phone-dark (391ms), desk-light (445ms), and desk-dark (406ms).
- Root cause on `daaa413`: `mine.done` is kept and remote `done` keys are only added. A reset's empty map deletes nothing. XP happened to land at 0 because one answer does not call `addXP` and the reset's XP delta is 0.
- Status: FAIL on `daaa413`, PASS on `7840da4`. New defect. Follow-up: a `done` deletion that does not bump `gen` is still a union. Import bumps `gen` in code and was not given its own browser run.

### R3-25 — a later quest day loses to a stale day

- Component: `mergeProg` quest block. Requirement: a newer quest day in storage replaces an older in-memory day.
- Hypothesis: unequal days skip the merge, so the lesson tab writes its old day over the other tab's later day.
- Method, first try, phone-light on `daaa413`: the other tab set `qd.p.lessons` to 1 and bought a 50/50, then this tab set `qd.day` to `2020-01-01` and answered correctly. That run passed in 688ms. A correct answer calls `qBump`, which calls `quests()` and replaces a non-today `qd` before `save()`. That run did not reach the unequal-day branch.
- Method, the run that hits the branch: after both revs match and this tab is on Check, the other page writes `qd.day` `2099-06-01`, `qd.p.lessons` 1, and `rev + 1`. This tab sets its in-memory day to `2020-01-01` and `lessons` to 9, then answers wrong. A wrong answer calls `save()` and does not call `quests()`.
- Expected: stored day `2099-06-01`, lessons 1.
- Actual, pre-fix `daaa413`, phone-light, 546ms: `expect(stored.day).toBe(planted)` expected `"2099-06-01"` and received `"2020-01-01"` at `audit.spec.js:306`. The lessons assertion was not reached.
- Actual, fixed code: phone-light passed in 625ms before the suite. The suite log shows 433ms, 323ms, 319ms, and 360ms on the four projects.
- Status: FAIL on `daaa413` for the wrong-answer save, PASS on `7840da4`. New defect. The first formulation is not evidence of the fix. Follow-up: none for a later ISO day. An older stored day still leaves the lesson tab's day in place.

### R3-26 — mutation, generation check forced false

- Component: the R3-24 assertion.
- Method: copy `app.js` to `/tmp/br-mut/ByteRyte/app.js` only. Change `const bumped=(remote.gen||0)>(base.gen||0);` to `const bumped=false&&(remote.gen||0)>(base.gen||0);`. Serve `http://127.0.0.1:8907/ByteRyte/` with `/tmp/pw-mut.config.js`, phone-light. Workspace `app.js` was not edited. `rg` on the workspace found no `false&&`.
- Expected: `done` received `true`.
- Actual: phone-light failed in 438ms. `Expected: false`, `Received: true`, at `audit.spec.js:261`.
- Status: FAIL, as required. The workspace line stayed `const bumped=(remote.gen||0)>(base.gen||0);`. New. Follow-up: none.

### R3-27 — JDK 21 check of six keyed explanations

- Component: lesson `why` text for inheritance constructors, `List.getFirst`/`getLast`, `Arrays.binarySearch`, and `HashMap` get/put.
- Hypothesis: one of those keyed answers disagrees with JDK 21.
- Method: `/tmp/br-why/Why.java`, compiled and run with OpenJDK `21.0.12.1` (`java -version`). The program prints `new B()`, `List.of("a","b","c").getFirst()` and `getLast()`, `Arrays.binarySearch` of `{1,3,5,7}` for 4 and for 5, `HashMap.get("x")` with `getOrDefault("x", 0)`, and `put("a", 1)` then `put("a", 2)`.
- Expected: `AB`, `a c`, `-3`, `2`, `null 0`, `2 1`, matching the keyed options in `data.js` (parent constructor then subclass, first and last, insertion point −3, index 2, null then 0, replaced value with size 1).
- Actual: the program printed those six lines in that order, exit 0.
- Status: PASS. Not a defect. This is six snippets, not a walk of the curriculum, and the choices were not clicked in the browser. New. Follow-up: none from these six.

### R3-28 — final `npm test`

- Component: the tree with the generation floor, the later-day quest replacement, and cache `byteryte-v24`.
- Method: `npm test` from `tests/`. Log `/tmp/npm-test-r3c.txt`.
- Expected: exit 0, bytes at or under 400000.
- Actual: `validate-data PASS lessons=62 exercises=687 interview=140 fixes=62 outs=218`. `validate-static PASS`. `validate-docs PASS urls=53`. `validate-java PASS snippets=176 jdk=21`. `validate-swift PASS snippets=42 Swift version 6.0.3 (swift-6.0.3-RELEASE)`. `validate-ambiguity PASS arrange-duplicates=1`. `validate-perf PASS bytes=353931 limit=400000`. `352 passed (2.7m)`. `EXIT:0`. Soak heaps 2949760 (phone-light), 2949828 (phone-dark), 2944848 (desk-light), 2945016 (desk-dark). Nodes 244 then 243, 50 lessons, on each. Slow 4G 2723, 2701, 2756, 2770 ms.
- Arithmetic: 14 audit specs × 4 projects = 56. 352 − 56 = 296, the same pre-audit Playwright count as R3-23.
- Status: PASS. Regression. Follow-up: none from this log.

## 7. Final report

This section covers parts 1, 2, and 3 of round 3. Counts are the ledger rows above. The app is not claimed to be free of defects.

1. Duration. Part 1: `2026-10-25T23:05:26Z` to `2026-10-25T23:27:41Z` (22 minutes 15 seconds). Part 2: `2026-10-25T23:29:15Z` to `2026-10-25T23:44:02Z` (14 minutes 47 seconds). Part 3: `2026-10-25T23:46:17Z` to `2026-10-26T00:00:29Z` (14 minutes 12 seconds). Active total, excluding the gaps between the parts, is 51 minutes 14 seconds.

2. Scope. Part 1, from `96d50e0`: profile save, sanitize, hearts, practice misses, level and day math, corrupt JSON, and `02f3957`. Part 2, from `8dbc279`: lesson progress while one tab is mid-lesson, the service-worker fetch catch, two in-lesson gem spends, review misses, the streak for `last` `2026-02-31`, the 30-day `doubleUntil` line, and badges plus same-day quest counters. Part 3, from `daaa413`: a second tab resetting the profile during a lesson, a quest day that is not today, a mutation of the generation check, and six keyed explanations run on JDK 21.

3. Distinct tests. Audit rows: part 1 R3-01 through R3-10 (10), part 2 R3-12 through R3-20 and R3-22 (10), part 3 R3-24 through R3-27 (4). Together that is 24 audit rows. R3-07 is one of those rows and has two inputs. Extra executions are listed on the rows (two timezones, pre-fix reruns, four mutations, one JDK program). Regression, counted separately: R3-11 (320 Playwright, 7 validators), R3-21 (344 Playwright, intermediate tree), R3-23 (344 Playwright, part-2 tree), R3-28 (352 Playwright, part-3 tree). Each regression run includes its own 7 validators, all PASS.

4. Coverage. Executed: the rows above. Not covered: a clicked stack of 2881 Double XP purchases, two shop buttons pressed in the same turn, deletion of one `done` key without a generation bump, the import button while a lesson is open, a physical phone, VoiceOver, an installed icon, pinch zoom, live GitHub Pages, Lighthouse, a multi-hour soak, and a learner walk of the whole curriculum. R3-27 ran six snippets. Multiple-choice and fill answers inside the validators did not.

5. Confirmed defects.
   - R3-04. On `96d50e0`, a lesson tab stored `freezes` 0 over the other tab's freeze (`Expected: 1`, `Received: 0`).
   - R3-05. A wrong practice answer moved `java.run` misses from 1 to 2.
   - R3-06. `doubleUntil` 400 days ahead was kept (`Received: 1827530724236`).
   - R3-08. `last` stayed `"2026-02-31"`. That string parses as 3 March 2026, and `dayDiff` to 1 March 2026 is −2.
   - R3-12. On `8dbc279`, the other tab finished `java.run` with XP 31, `done` true, 1 lesson, streak 1, `last` `2026-10-25`. This tab's next answer stored `done` false.
   - R3-13. An offline fetch of a missing script returned status 200, `text/html`, body starting `<!DOCTYPE html>`.
   - R3-22. After XP and `done` were merged, the same save stored badges `[]`. The finishing tab had `first` and `perfect`.
   - R3-24. On `daaa413`, after the other tab reset Ada, this tab's next answer stored `java.run` done `true` (`Expected: false`).
   - R3-25. On `daaa413`, a wrong-answer save stored quest day `2020-01-01` over the other tab's `2099-06-01`.

6. Suspected, still open. Removing one `done` key or one badge without incrementing `gen` is still a union, so the lesson tab can put that key back. Not run. Import increments `gen` after hydrate and was not clicked in a browser. A correct answer still calls `quests()` before `save()`, so that path replaces a non-today day with today before the merge; R3-25's first formulation passed for that reason and is not a remaining defect.

7. Blocked. No physical device, VoiceOver, installed icon, pinch zoom, live Pages, Lighthouse, or multi-hour soak. R3-03's node check does not fail on its own. R3-19 did not print the HTML body again. The same-day quest counter's pre-fix number was not observed, because R3-22 failed on badges first. R3-25's lessons value was not observed on the failing run, because the day assertion failed first. Docs runs passed 53 URLs. None recorded a 503.

8. Fixes, and the check that is independent of the first passing run.
   - Part 1, in the squash of PR #16: `mergeEcon`, practice misses, the 30-day cap, and `dayOk`. Each failed on the older tree and passed in R3-11. R3-09 failed when `mergeEcon` was skipped.
   - `mergeProg` unions `done`, badges, and review when the generation did not rise; it adds XP, `xpLog`, misses, lesson and perfect counts, and same-day quest counters; it copies streak and `last` when this tab has not changed them. R3-12 and R3-22 pass in R3-28. R3-18 fails when `mergeProg` is skipped.
   - The service worker throws on a failed non-navigation fetch and still serves the cached page for a navigation. R3-13 passes in R3-28. R3-19 fails when the HTML fallback is restored.
   - Part 3, in `7840da4`: reset sets `gen` one higher. When the stored generation is above the lesson tab's baseline, `done`, badges, and review start from that stored profile, and only keys gained after the baseline are added. A later quest day replaces the in-memory quest object. R3-24 and R3-25 pass in R3-28. R3-26 fails when the generation comparison is forced false. Cache name is `byteryte-v24` because `app.js` and `sw.js` changed. `validate-static` passed.

9. Regression. R3-11: 320 passed, 348759 bytes. R3-21: 344 passed, 351376 bytes, before the badge assertion. R3-23: 344 passed, 352309 bytes, exit 0, cache `byteryte-v23`. R3-28: 352 passed, 353931 bytes, exit 0, cache `byteryte-v24`. The part-3 soak and slow-4G numbers are in R3-28. Slow 4G is Chromium emulation. The soak is four heap snapshots after 50 lessons. 352 − 56 = 296, the same pre-audit Playwright count as R3-23.

10. Remaining risks, highest first.
    - Medium: a `done` or badge deletion that does not bump `gen` can still be written back by the in-lesson tab. Reset and the import handler bump `gen`. A single-key delete does not.
    - Low: the import handler's generation bump was not executed in a browser.
    - Low: the 30-day cap was checked as a timestamp, not as 2881 clicks.
    - Low: the environment limits in item 7.

11. Single most important next action. Reproduce a second tab that deletes one `done` key, without incrementing `gen`, while the first tab is inside a lesson. The union will put that key back. Decide whether every deletion must bump `gen`, or only reset and import.

The app is not claimed to be free of defects.

### R3-29 — a removed `done` key comes back

- Component: `mergeProg` union of `done` and badges when `gen` does not rise.
- UI check, by reading `app.js` on `70a9a02`: no handler assigns `done` to false or deletes one `done` key. A finished lesson's node calls `start` again, and finishing sets that key true. `checkBadges` only adds badges. Settings can reset the profile or import a backup, and both bump `gen`. A completed node was not clicked in the browser. The removal below was written into storage, which is the save a tab would have committed.
- Hypothesis: the lesson tab still has the key, so the next save puts it back.
- Method: `tests/e2e/audit.spec.js` "a lesson tab does not restore a done key the other tab removed". Ada, XP 80, `done['java.run']`, badge `first`. Both revs match, this tab is on Check. The other page deletes `java.run` and `first`, leaves `gen` unchanged, and increments `rev`. This tab answers.
- Expected: `done` false, badge absent, `gen` still the planted value.
- Actual, pre-fix `70a9a02`, phone-light, 1.1s: `expect(stored.done).toBe(false)` received `true` at `audit.spec.js:343`. The badge assertion was not reached.
- Actual, fixed code: phone-light passed in 454ms before the suite. `/tmp/npm-test-r3d.txt` shows 456ms, 330ms, 357ms, and 363ms on the four projects.
- Status: FAIL on `70a9a02`, PASS on `20a56e1`. New defect. Follow-up: the pre-fix badge value was not observed.

### R3-30 — a graduated review card comes back on the lesson tab's save

- Component: `delete S.review[k]` when a card's box passes 3, then the other tab's `mergeProg`.
- Method: seed `review['java.run~0']` at box 3, due 1. This tab starts a lesson. The other tab opens Practice, presses Review mistakes, and answers correctly. That is the real button path.
- First run, before this tab answered: phone-light on `70a9a02` passed in 1.0s. The graduating tab's own save left the card gone.
- Method, the failing save: the same steps, then this tab answers.
- Expected: the card stays absent, and `java.run` stays done.
- Actual, pre-fix `70a9a02`, phone-light, 583ms: `expect(stored.review).toBe(false)` received `true` at `audit.spec.js:373`.
- Actual, fixed code: phone-light passed in 568ms before the suite. The suite log shows 534ms, 420ms, 466ms, and 505ms.
- Status: FAIL on `70a9a02` once the lesson tab saves, PASS on `20a56e1`. New defect. The graduating tab's own save was not the failure.

### R3-31 — import while a lesson is open

- Component: the import handler's `gen` bump, clicked in the browser.
- Method: this tab is on Check with `java.run` done and badge `first`. The other tab opens Settings and imports a ByteRyte backup of the same profile with those two keys removed. The confirm dialog is accepted. Then this tab answers.
- Expected: name Ada, both keys absent, `gen` greater than 0, and the answer does not restore the keys.
- Actual, `70a9a02`, phone-light, 429ms, before `keep` existed: passed. The exact `gen` integer was not printed. After the fix, phone-light passed in 465ms. The suite log shows 539ms, 395ms, 389ms, and 481ms.
- Status: PASS on `70a9a02` and on `20a56e1`. Not a defect. The import button was used. Follow-up: none from this run.

### R3-32 — mutation, skip the removal check

- Component: the R3-29 assertion.
- Method: copy `app.js` to `/tmp/br-mut2/ByteRyte/app.js` only. Change the drop condition to `if(false&&baseM[k]&&!remoteM[k]&&unchanged(mineM[k],baseM[k]))return;`. Serve `http://127.0.0.1:8911/ByteRyte/` with `/tmp/pw-mut2.config.js`, phone-light. Workspace `app.js` was not edited. `rg` on the workspace found no `false&&`.
- Expected: `done` received `true`.
- Actual: phone-light failed in 374ms. `Expected: false`, `Received: true`, at `audit.spec.js:343`.
- Status: FAIL, as required. The workspace line stayed `if(baseM[k]&&!remoteM[k]&&unchanged(mineM[k],baseM[k]))return;`. New. Follow-up: none.

### R3-33 — final `npm test` for the removal merge

- Component: the tree with `keep` and cache `byteryte-v25`.
- Method: `npm test` from `tests/`. Log `/tmp/npm-test-r3d.txt`.
- Expected: exit 0, bytes at or under 400000.
- Actual: `validate-data PASS lessons=62 exercises=687 interview=140 fixes=62 outs=218`. `validate-static PASS`. `validate-docs PASS urls=53`. `validate-java PASS snippets=176 jdk=21`. `validate-swift PASS snippets=42 Swift version 6.0.3 (swift-6.0.3-RELEASE)`. `validate-ambiguity PASS arrange-duplicates=1`. `validate-perf PASS bytes=354292 limit=400000`. `364 passed (2.7m)`. `EXIT:0`. Soak heaps 2949824 (phone-light), 2949756 (phone-dark), 2944948 (desk-light), 2944948 (desk-dark). Nodes 244 then 243, 50 lessons, on each. Slow 4G 2753, 2715, 2745, 2759 ms.
- Arithmetic: 17 audit specs × 4 projects = 68. 364 − 68 = 296, the same pre-audit Playwright count as R3-28.
- Status: PASS. Regression. Follow-up: none from this log.

## Part 4

This part followed the next action in section 7. It is not folded into the 51 minute 14 second total.

No screen removes one `done` key or one badge. Reset and import do, and both bump `gen`. R3-31 clicked import during a lesson on `70a9a02`: the backup's missing `java.run` and `first` stayed missing, and `gen` was greater than 0. The exact integer was not printed.

A removal that does not bump `gen` was reproducible. R3-29 wrote that removal into storage and the lesson tab stored `java.run` done `true`. R3-30 used Practice → Review mistakes; the card stayed gone until the lesson tab answered, which stored it again (`review` received `true`). `keep` drops a baseline key the other tab removed when this tab has not changed it. R3-32 fails when that drop is skipped. R3-29 and R3-30 pass in R3-33. Cache is `byteryte-v25`.

Still unverified: the pre-fix badge value in R3-29, a browser click on a finished lesson node, removing a saved question while a lesson is open, a clicked stack of 2881 Double XP purchases, and a physical phone, VoiceOver, installed icon, pinch zoom, live Pages, Lighthouse, or multi-hour soak.

The app is not claimed to be free of defects.
