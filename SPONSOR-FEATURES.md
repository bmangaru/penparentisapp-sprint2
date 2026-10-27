# Sponsor feature round — what changed and where

| Sponsor ask | Where it lives | How it works |
|---|---|---|
| Remove "Something came up", combine with None | `writingLogic.js` → `OUTCOMES` | Four outcomes. "None of it" carries the subtitle "Something came up — that still counts as showing up". |
| 3 professional writers, 9 times a year | `screens/SalonsScreen.js`, `HomeScreen.js` | Copy updated. |
| Update salons: Eventbrite | `SalonsScreen.js`, `links.js` → `salonsEventbrite` | Gold "Register on Eventbrite" button at the top. **Swap in the real salon event URL** in `links.js`. |
| "What's your goal today" + resets at 12am | `BrainstormHomeScreen.js`, `writingStore.js` → `useToday()` | Asked the first time Brainstorm opens each day. Goals are stored per date, so a new day means a new question. `useToday()` re-renders at midnight and when the app returns to the foreground. Options: words or minutes, presets, "your usual" suggestion, custom, or "No goal today". |
| Weekly goal, 7 days | `BrainstormHomeScreen.js` | Weekly goal runs Mon–Sun. Types: words, time, both, or **sessions** (previously "coming soon"). |
| Sessions logged and saved | `BrainstormWriterScreen.js`, `writingStore.js` → `saveSession` | Every visit to the typer is one session, saved with its text, words, minutes, start time, goal, % and rating. Saved on "Finish", on ×, and on Android back (`beforeRemove`). |
| Keep track of goals and writing / access saved writing | `screens/MyWritingScreen.js` | All sessions grouped by day, with that day's goal and %. Tap to read in full. |
| Writing can be sent to themselves | `writingStore.js` → `shareWriting` | Opens the phone's share sheet (Mail, Messages, Notes, Drive…). No account or email server needed. Available after every session, per session, and "this week's writing". |
| Chart: did it exceed? | `components/WeekChart.js` | Seven bars, each day vs. that day's goal, with a dashed 100% line. Gold = exceeded (≥110%), blue = met, light blue = some, grey = none. Weekly card says "Exceeded — X% over" or "X% of the way there". |
| ≥50% → rate yourself, otherwise the app rates | `writingLogic.js` → `canSelfRate`, `appRatingFor` | At ≥50% of today's goal the writer picks their own rating (the app's suggestion is tagged "App's read"). Below 50% the app records its rating. Both are saved; the writer's wins when present. |
| Disable copy/paste | `BrainstormWriterScreen.js` | `contextMenuHidden` removes the Copy/Paste menu. Any single change that adds >30 characters (`PASTE_CHAR_LIMIT`) is treated as a paste, reverted, and never counted. |
| After 10 / 100 sessions, a smarter Home screen | `writingLogic.js` → `buildInsights`, `HomeScreen.js` | **<10:** welcome + "N more sessions until this screen learns your rhythm". **10+:** streak, usual writing time and words per session, plus a message that depends on *when you open the app* (on time / later than usual / early / already wrote today). **100+:** adds lifetime words, strongest weekday, week-over-week trend and longest streak. |

## Notes for the team

- `writingLogic.js` has no React Native imports, so it can be unit-tested with plain Node or Jest.
- Old storage keys (`pp.progress.v2`, `pp.time.v1`, `pp.checkins.v1`) are no longer read. Stats now come from `pp.sessions.v1`, so test devices start fresh.
- `screens/BrainstormScreen.js` was removed. Nothing imported it, and it was an older copy of the Brainstorm screens.
- The paste check also catches iOS dictation when it drops in a long sentence at once. Raise `PASTE_CHAR_LIMIT` if that's a problem.
- Everything is stored on the phone (AsyncStorage). If the sponsor later wants writing to survive a lost phone, sessions can be synced to the same Supabase project described in `BACKEND-NOTES.md`.

## Round 2 — Brainstorm page: daily bubbles

| Change | Where | How it works |
|---|---|---|
| A white bubble per day | `components/DayBubble.js`, `BrainstormHomeScreen.js` | "This week" lists Mon→today, newest first. A day gets a bubble once something is written: date, TODAY tag, words / minutes / check-ins, progress bar, rating, and a 2-line preview. Past days with nothing written show as a dashed "No writing — that's okay" row. |
| Tap a bubble to read it | `screens/DayScreen.js` (route `BrainstormDay`) | Full date, goal, stats, the whole day's writing, "Send this day's writing to myself" (share sheet), "Keep writing today" (today only), and Delete. |
| Start writing button changes with the day | `writingLogic.js` → `startButtonState` | `setGoal` → "Set today's goal & start" (asks the daily question, then opens the page) · `start` → "Start writing" · `continue` → "Keep writing · N words to go" · `met` → gold "Goal met — write a little more?" |
| Keep writing picks up where you left off | `BrainstormWriterScreen.js`, `writingLogic.js` → `dayPieces`, `textToContinue` | The page opens with today's latest writing already in the box. Only words typed after it count toward the session. The session is saved with `continues: true` and the full text, so each day reads as one growing piece. |
| My Writing | `screens/MyWritingScreen.js` | The same day bubbles, grouped by week, for every day ever written. |

## Round 3 — time display, more goal presets, medals

**Fixes**
- Times now pick the right unit (`writingLogic.js` → `formatDuration`, `durationTile`, `clock`): `5 sec`, `2 min 30 sec`, `12 min`, `1 hr 15 min`. The typer's timer shows `1:05:00` past an hour.
- Daily goal presets: words 50 · 100 · 150 · 250 · 500 · 750 · 1,000 · 2,000; minutes 5 · 10 · 15 · 20 · 30 · 45 · 60 · 90 (plus "your usual" and a custom number).

**Medals** (`medals.js`, `components/Medal.js`, `components/MedalsCard.js`, `components/NewMedalSheet.js`, `screens/MedalsScreen.js`, `screens/MedalDetailScreen.js`)

| Medal | Counts | Bronze / Silver / Gold / Platinum |
|---|---|---|
| Wordsmith | words typed | 100 / 1,000 / 10,000 / 50,000 |
| Timekeeper | time writing | 1 hr / 10 hr / 50 hr / 200 hr |
| Regular | sessions | 5 / 25 / 100 / 365 |
| On a Roll | best streak (days in a row) | 3 / 7 / 30 / 100 |
| Goal Getter | days the daily goal was met | 1 / 10 / 50 / 200 |
| Vowel Voyager | vowels in kept writing | 500 / 5,000 / 50,000 / 250,000 |
| Consonant Collector | consonants in kept writing | 1,000 / 10,000 / 100,000 / 500,000 |
| Punctuation Pro | punctuation marks | 25 / 250 / 2,500 / 10,000 |
| Big Words | words longer than 10 letters | 10 / 100 / 500 / 2,000 |

- Progress is always recomputed from saved sessions, so writing from before medals existed counts. `pp.medals.v1` only stores the date each tier was first reached.
- The first time medals load, tiers already earned are recorded quietly (no pop-up for old writing). After that, a new tier triggers the "New medal!" sheet once: in the typer after check-in, or on the Brainstorm page if the session ended with ×.
- Letter, punctuation and long-word counts use each day's final kept text, so deleted letters don't count and "Keep writing" isn't counted twice.
- The Brainstorm page shows the Medals card after this week's bubbles (option C) with the latest medals, "Almost there" and "See all medals".
- Thresholds live in `MEDALS` in `medals.js`. Change the `tiers` arrays to tune them.

## Round 4 — one end-of-session sheet, feelings instead of ratings

- **One sheet** (`components/SessionDoneSheet.js`) replaces both "How did it go?" and "Saved". It shows: session saved (words · time), today's goal progress, a "New medal" banner if one was earned, **How do you feel?**, and Send to myself / Done.
- **Feelings** (`feelings.js`, `components/Face.js`): happy, ecstatic, confused, panicked, anxious, angry, betrayed, frustrated, hurt, guilty, from Pen Parentis' "How do you feel?" page. The faces are simple original line drawings (`react-native-svg`). Picking one is optional and saves immediately to the session as `feeling`.
- **No more self/app rating.** The goal status (`appRating`: exceeded / met / some / none) is still stored, but only colours the weekly chart and the day bubble's progress bar.
- **Where feelings show:** the day bubble shows the day's latest feeling. The day page lists each session's feeling with its time. "Send to myself" text says "felt happy".
- **Empty sessions aren't logged:** opening the typer and finishing with no new words in under a minute just closes it.
- **New dependency:** `react-native-svg` (included in Expo Go). Run `npx expo install react-native-svg` after pulling.
