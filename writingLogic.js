// writingLogic.js — pure functions behind goals, sessions, ratings and the
// personalized Home screen. No React Native imports here on purpose, so this
// file can be unit-tested with plain Node and reused by every screen.

import { feelingLabel } from './feelings';

// ---------------------------------------------------------------------------
// Dates. Everything is local time, so "today" resets at 12am on the phone.
// ---------------------------------------------------------------------------

export function dayKey(date = new Date()) {
  const d = new Date(date);
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

export function parseDayKey(key) {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

// Monday 00:00 of the week containing `date`.
export function startOfWeek(date = new Date()) {
  const d = new Date(date);
  const day = d.getDay();
  d.setDate(d.getDate() + ((day === 0 ? -6 : 1) - day));
  d.setHours(0, 0, 0, 0);
  return d;
}

// The 7 day keys Mon..Sun of the current week.
export function weekDayKeys(date = new Date()) {
  const start = startOfWeek(date);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return dayKey(d);
  });
}

export function msUntilMidnight(now = new Date()) {
  const next = new Date(now);
  next.setHours(24, 0, 0, 0);
  return next.getTime() - now.getTime();
}

export function hourLabel(h) {
  const hr = ((Math.round(h) % 24) + 24) % 24;
  if (hr === 0) return '12am';
  if (hr === 12) return '12pm';
  return hr < 12 ? `${hr}am` : `${hr - 12}pm`;
}

export function partOfDay(h) {
  if (h >= 4 && h < 8) return 'early morning';
  if (h >= 8 && h < 12) return 'morning';
  if (h >= 12 && h < 17) return 'afternoon';
  if (h >= 17 && h < 22) return 'evening';
  return 'late night';
}

export function greetingFor(h) {
  if (h >= 4 && h < 12) return 'Good morning';
  if (h >= 12 && h < 17) return 'Good afternoon';
  if (h >= 17 && h < 22) return 'Good evening';
  return 'Still up';
}

// ---------------------------------------------------------------------------
// Durations. Short sessions show seconds, long ones show hours, so a
// 5-second session never reads as "0 min" and 75 minutes reads "1 hr 15 min".
// ---------------------------------------------------------------------------

export function formatDuration(totalSeconds) {
  const t = Math.max(0, Math.round(totalSeconds || 0));
  if (t < 60) return `${t} sec`;
  const h = Math.floor(t / 3600);
  const m = Math.floor((t % 3600) / 60);
  const sec = t % 60;
  if (h === 0) return m < 10 && sec ? `${m} min ${sec} sec` : `${m} min`;
  return m ? `${h} hr ${m} min` : `${h} hr`;
}

// For stat tiles: a big value plus a unit label underneath.
export function durationTile(totalSeconds) {
  const t = Math.max(0, Math.round(totalSeconds || 0));
  if (t < 60) return { value: String(t), unit: t === 1 ? 'second' : 'seconds' };
  const h = Math.floor(t / 3600);
  const m = Math.floor((t % 3600) / 60);
  if (h === 0) return { value: String(m), unit: m === 1 ? 'minute' : 'minutes' };
  if (m === 0) return { value: String(h), unit: h === 1 ? 'hour' : 'hours' };
  return { value: `${h}h ${m}m`, unit: 'time' };
}

// The typer's stopwatch: 04:12, or 1:04:12 past an hour.
export function clock(totalSeconds) {
  const t = Math.max(0, Math.floor(totalSeconds || 0));
  const h = Math.floor(t / 3600);
  const mm = String(Math.floor((t % 3600) / 60)).padStart(2, '0');
  const ss = String(t % 60).padStart(2, '0');
  return h ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

const WEEKDAYS = ['Sunday','Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// ---------------------------------------------------------------------------
// Words and pasting.
// ---------------------------------------------------------------------------

export function countWords(text) {
  const t = (text || '').trim();
  return t ? t.split(/\s+/).length : 0;
}

// More characters than this arriving in a single keystroke is treated as a
// paste and rejected. A swiped or autocompleted word is well under this; a
// pasted paragraph is well over it.
export const PASTE_CHAR_LIMIT = 30;

export function looksLikePaste(prevText, nextText) {
  return nextText.length - prevText.length > PASTE_CHAR_LIMIT;
}

// ---------------------------------------------------------------------------
// Ratings. Four outcomes — "Something came up" is folded into "None of it".
// ---------------------------------------------------------------------------

export const OUTCOMES = [
  { key: 'exceeded', label: 'Exceeded' },
  { key: 'met', label: 'Met' },
  { key: 'some', label: 'Some of it' },
  { key: 'none', label: 'None of it', sub: 'Something came up — that still counts as showing up' },
];

export function outcomeLabel(key) {
  return OUTCOMES.find((o) => o.key === key)?.label ?? '—';
}

// At or above this % of today's goal the writer rates themselves; below it
// the app records its own rating.
export const SELF_RATE_THRESHOLD = 50;

export function appRatingFor(pct) {
  if (pct == null) return null;
  if (pct >= 110) return 'exceeded';
  if (pct >= 100) return 'met';
  if (pct > 0) return 'some';
  return 'none';
}

export function canSelfRate(pct) {
  // No daily goal set → nothing for the app to measure against, so the
  // writer rates themselves.
  return pct == null || pct >= SELF_RATE_THRESHOLD;
}

// The rating that counts: the writer's own if they gave one, else the app's.
export function finalRating(session) {
  return session.selfRating || session.appRating || null;
}

// ---------------------------------------------------------------------------
// Goals and progress.
// ---------------------------------------------------------------------------

// Daily goal: { type: 'word' | 'time', target: number } or { skipped: true }.
// Weekly goal: { type: 'word' | 'time' | 'both' | 'sessions', wordTarget,
//                timeTarget, sessionTarget }.

export function summarize(sessions) {
  let words = 0;
  let seconds = 0;
  for (const s of sessions) {
    words += s.words || 0;
    seconds += s.seconds || 0;
  }
  return { words, minutes: Math.floor(seconds / 60), seconds, count: sessions.length };
}

export function sessionsOnDay(sessions, key) {
  return sessions.filter((s) => s.day === key);
}

export function sessionsThisWeek(sessions, date = new Date()) {
  const keys = new Set(weekDayKeys(date));
  return sessions.filter((s) => keys.has(s.day));
}

export function dailyPct(goal, summary) {
  if (!goal || goal.skipped || !goal.target) return null;
  const done = goal.type === 'time' ? summary.seconds / 60 : summary.words;
  return Math.round((done / goal.target) * 100);
}

export function weeklyPct(goal, summary) {
  if (!goal) return 0;
  const parts = [];
  if ((goal.type === 'word' || goal.type === 'both') && goal.wordTarget) parts.push(summary.words / goal.wordTarget);
  if ((goal.type === 'time' || goal.type === 'both') && goal.timeTarget) parts.push(summary.seconds / 60 / goal.timeTarget);
  if (goal.type === 'sessions' && goal.sessionTarget) parts.push(summary.count / goal.sessionTarget);
  if (!parts.length) return 0;
  return Math.round((parts.reduce((a, b) => a + b, 0) / parts.length) * 100);
}

export function describeWeeklyGoal(goal) {
  if (!goal) return '';
  if (goal.type === 'word') return `${(goal.wordTarget || 0).toLocaleString()} words this week`;
  if (goal.type === 'time') return `${goal.timeTarget || 0} minutes this week`;
  if (goal.type === 'sessions') return `${goal.sessionTarget || 0} sessions this week`;
  return `${(goal.wordTarget || 0).toLocaleString()} words & ${goal.timeTarget || 0} minutes this week`;
}

export function describeDailyGoal(goal) {
  if (!goal) return 'No goal set yet';
  if (goal.skipped) return 'No goal today';
  return goal.type === 'time' ? `${goal.target} minutes today` : `${goal.target.toLocaleString()} words today`;
}

// ---------------------------------------------------------------------------
// One piece of writing per day. "Keep writing" reopens today's last piece and
// saves the next session with `continues: true` and the full, grown text — so
// the day reads as one document while each sitting is still its own session.
// ---------------------------------------------------------------------------

export function dayPieces(sessions, key) {
  const list = sessionsOnDay(sessions, key)
    .slice()
    .sort((a, b) => String(a.startedAt).localeCompare(String(b.startedAt)));
  const pieces = [];
  for (const s of list) {
    const last = pieces[pieces.length - 1];
    if (s.continues && last) {
      last.text = s.text || '';
      last.words += s.words || 0;
      last.seconds += s.seconds || 0;
      last.lastAt = s.endedAt || s.startedAt;
      last.rating = finalRating(s) || last.rating;
      last.sessionIds.push(s.id);
      if (s.feeling) last.feelings.push({ at: s.endedAt || s.startedAt, feeling: s.feeling });
    } else {
      pieces.push({
        text: s.text || '',
        words: s.words || 0,
        seconds: s.seconds || 0,
        firstAt: s.startedAt,
        lastAt: s.endedAt || s.startedAt,
        rating: finalRating(s),
        sessionIds: [s.id],
        feelings: s.feeling ? [{ at: s.endedAt || s.startedAt, feeling: s.feeling }] : [],
      });
    }
  }
  return pieces;
}

// What today's writing page should open with ('' = a blank page).
export function textToContinue(sessions, key) {
  const pieces = dayPieces(sessions, key);
  return pieces.length ? pieces[pieces.length - 1] : null;
}

// Everything a day bubble shows.
export function daySummary(sessions, dailyGoals, key) {
  const daySessions = sessionsOnDay(sessions, key);
  const sum = summarize(daySessions);
  const goal = dailyGoals[key] || null;
  const pct = dailyPct(goal, sum);
  const pieces = dayPieces(sessions, key);
  const lastPiece = pieces[pieces.length - 1];
  // The writer's own last rating wins; otherwise judge the day against its goal.
  const rating = lastPiece?.rating || appRatingFor(pct);
  // The most recent feeling picked that day (shown on the day bubble).
  const felt = daySessions
    .filter((s) => s.feeling)
    .sort((a, b) => String(b.endedAt || b.startedAt).localeCompare(String(a.endedAt || a.startedAt)));
  const feeling = felt.length ? felt[0].feeling : null;
  return { key, goal, pct, rating, feeling, pieces, preview: lastPiece?.text?.trim() || '', ...sum };
}

// The Start writing button, which changes with the day.
//   'setGoal'  no goal chosen yet today  → ask "What's your goal today?" first
//   'start'    goal set (or skipped), nothing written today
//   'continue' wrote today, goal not met yet (or no goal)
//   'met'      today's goal reached
export function startButtonState(sessions, dailyGoals, key) {
  const goal = dailyGoals[key] || null;
  const sum = summarize(sessionsOnDay(sessions, key));
  const pct = dailyPct(goal, sum);
  const wrote = sum.count > 0;
  let state = 'start';
  if (!goal && !wrote) state = 'setGoal';
  else if (wrote && pct != null && pct >= 100) state = 'met';
  else if (wrote) state = 'continue';

  let title = 'Start writing';
  let sub = goal && !goal.skipped ? `Goal: ${describeDailyGoal(goal)}` : 'No goal today — just write';
  if (state === 'setGoal') {
    title = "Set today's goal & start";
    sub = "We'll ask “What's your goal today?” first";
  } else if (state === 'continue') {
    title = 'Keep writing';
    if (pct != null && goal.type === 'time') {
      const left = Math.max(1, Math.ceil(goal.target - sum.seconds / 60));
      sub = `${left} minute${left === 1 ? '' : 's'} to go today · picks up where you left off`;
    } else if (pct != null) {
      const left = goal.target - sum.words;
      sub = `${left.toLocaleString()} word${left === 1 ? '' : 's'} to go today · picks up where you left off`;
    } else {
      sub = `${sum.words.toLocaleString()} words so far · picks up where you left off`;
    }
  } else if (state === 'met') {
    title = 'Goal met — write a little more?';
    const done = goal.type === 'time' ? `${formatDuration(sum.seconds)} of ${goal.target} min` : `${sum.words.toLocaleString()} of ${goal.target.toLocaleString()} words`;
    sub = `${done} · anything extra is a bonus`;
  }
  return { state, title, sub, pct };
}

// Plain-text version of a day for "Send to myself".
export function dayShareText(summary) {
  const date = parseDayKey(summary.key).toDateString();
  const goalBit = summary.goal && !summary.goal.skipped ? ` · goal ${describeDailyGoal(summary.goal)}` : '';
  const ratingBit = summary.feeling ? ` · felt ${feelingLabel(summary.feeling).toLowerCase()}` : '';
  const head = `${date} · ${summary.words.toLocaleString()} words · ${formatDuration(summary.seconds)}${goalBit}${ratingBit}`;
  const body = summary.pieces.map((p) => p.text.trim()).filter(Boolean).join('\n\n— — —\n\n');
  return `${head}\n\n${body}`;
}

// One entry per day of this week, for the chart.
export function weekChartData(sessions, dailyGoals, date = new Date()) {
  const today = dayKey(date);
  const labels = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  return weekDayKeys(date).map((key, i) => {
    const sum = summarize(sessionsOnDay(sessions, key));
    const goal = dailyGoals[key] || null;
    const pct = dailyPct(goal, sum);
    const future = key > today;
    let status = 'nogoal';
    if (future) status = 'future';
    else if (pct != null) status = appRatingFor(pct);
    return { key, label: labels[i], isToday: key === today, pct, status, ...sum };
  });
}

// ---------------------------------------------------------------------------
// Personalization — the Home screen learns after 10 and 100 sessions.
// ---------------------------------------------------------------------------

export const TIER_LEARNING = 10;
export const TIER_DEEP = 100;

function median(nums) {
  if (!nums.length) return null;
  const a = [...nums].sort((x, y) => x - y);
  const mid = Math.floor(a.length / 2);
  return a.length % 2 ? a[mid] : (a[mid - 1] + a[mid]) / 2;
}

export function streakDays(sessions, date = new Date()) {
  const days = new Set(sessions.map((s) => s.day));
  const d = new Date(date);
  // Today not written yet doesn't break a streak that ran through yesterday.
  if (!days.has(dayKey(d))) d.setDate(d.getDate() - 1);
  let n = 0;
  while (days.has(dayKey(d))) {
    n += 1;
    d.setDate(d.getDate() - 1);
  }
  return n;
}

export function longestStreak(sessions) {
  const keys = [...new Set(sessions.map((s) => s.day))].sort();
  let best = 0;
  let run = 0;
  let prev = null;
  for (const k of keys) {
    const d = parseDayKey(k);
    if (prev) {
      const gap = Math.round((d.getTime() - prev.getTime()) / 86400000);
      run = gap === 1 ? run + 1 : 1;
    } else run = 1;
    best = Math.max(best, run);
    prev = d;
  }
  return best;
}

export function suggestedDailyGoal(sessions, type = 'word') {
  // Median of the last 14 days that had any writing, rounded to a friendly number.
  const byDay = {};
  for (const s of sessions) {
    byDay[s.day] = byDay[s.day] || { words: 0, seconds: 0 };
    byDay[s.day].words += s.words || 0;
    byDay[s.day].seconds += s.seconds || 0;
  }
  const recent = Object.keys(byDay).sort().slice(-14).map((k) => byDay[k]);
  if (recent.length < 3) return null;
  if (type === 'time') {
    const m = median(recent.map((d) => d.seconds / 60));
    return Math.max(5, Math.round(m / 5) * 5);
  }
  const m = median(recent.map((d) => d.words));
  return Math.max(50, Math.round(m / 50) * 50);
}

export function buildInsights(sessions, dailyGoals = {}, now = new Date()) {
  const hour = now.getHours();
  const total = sessions.length;
  const today = dayKey(now);
  const todaySum = summarize(sessionsOnDay(sessions, today));
  const todayGoal = dailyGoals[today] || null;
  const todayPct = dailyPct(todayGoal, todaySum);
  const streak = streakDays(sessions, now);

  const tier = total >= TIER_DEEP ? 'deep' : total >= TIER_LEARNING ? 'learning' : 'new';
  const lines = [];
  let headline = `${greetingFor(hour)}.`;

  if (tier === 'new') {
    headline = total === 0 ? `${greetingFor(hour)}. Welcome in.` : `${greetingFor(hour)}.`;
    if (todaySum.count) lines.push(`${todaySum.words.toLocaleString()} words so far today.`);
    else lines.push('Set a small goal for today and write toward it — even ten minutes counts.');
    const left = TIER_LEARNING - total;
    lines.push(`${left} more session${left === 1 ? '' : 's'} and this screen starts learning your rhythm.`);
    return { tier, headline, lines, streak, todaySum, todayGoal, todayPct, total };
  }

  const hours = sessions.map((s) => s.hour).filter((h) => typeof h === 'number');
  const usual = median(hours);
  const avgWords = Math.round(summarize(sessions).words / total);
  const usualPart = usual != null ? partOfDay(usual) : null;

  if (streak > 1) headline = `${greetingFor(hour)}. Day ${streak} of your streak.`;

  // What to say depends on *when* they opened the app.
  if (todaySum.count) {
    const goalBit = todayPct != null ? ` — ${todayPct}% of today's goal` : '';
    lines.push(`${todaySum.words.toLocaleString()} words already today${goalBit}.`);
  } else if (usual != null && Math.abs(hour - usual) <= 1) {
    lines.push(`This is usually when you write (${hourLabel(usual)}). The page is ready.`);
  } else if (usual != null && hour > usual) {
    lines.push(`You usually write around ${hourLabel(usual)}. There's still time for a short one.`);
  } else if (usual != null) {
    lines.push(`Early start — you usually write around ${hourLabel(usual)}.`);
  }

  const PLURAL = {
    'early morning': 'Early mornings', morning: 'Mornings', afternoon: 'Afternoons',
    evening: 'Evenings', 'late night': 'Late nights',
  };
  if (usualPart) lines.push(`${PLURAL[usualPart]} are your time — about ${avgWords.toLocaleString()} words a session.`);

  if (tier === 'deep') {
    const lifetime = summarize(sessions).words;
    const byWeekday = Array(7).fill(0);
    for (const s of sessions) byWeekday[parseDayKey(s.day).getDay()] += s.words || 0;
    const best = byWeekday.indexOf(Math.max(...byWeekday));

    const last7 = [];
    const prev7 = [];
    for (let i = 0; i < 14; i++) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      (i < 7 ? last7 : prev7).push(dayKey(d));
    }
    const wLast = summarize(sessions.filter((s) => last7.includes(s.day))).words;
    const wPrev = summarize(sessions.filter((s) => prev7.includes(s.day))).words;

    lines.push(`${lifetime.toLocaleString()} words across ${total} sessions. ${WEEKDAYS[best]}s are your strongest day.`);
    if (wPrev > 0) {
      const change = Math.round(((wLast - wPrev) / wPrev) * 100);
      if (change >= 10) lines.push(`Up ${change}% on the week before.`);
      else if (change <= -10) lines.push(`A quieter week than the last — that's allowed.`);
    }
    const best_streak = longestStreak(sessions);
    if (best_streak > streak) lines.push(`Longest streak so far: ${best_streak} days.`);
  }

  return { tier, headline, lines, streak, todaySum, todayGoal, todayPct, total, usualHour: usual };
}
