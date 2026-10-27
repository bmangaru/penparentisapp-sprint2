// medals.js — the writing medals: what each one counts, its four tiers
// (bronze, silver, gold, platinum), and how far along you are.
// Pure functions, no React Native imports, so this can be unit-tested in Node.
//
// Everything is worked out from saved sessions, so medals also count writing
// done before medals existed. Letter/punctuation/long-word medals count the
// writing you KEPT (each day's final text), so deleted letters don't count
// and continued writing isn't counted twice.

import { dailyPct, dayPieces, formatDuration, longestStreak, sessionsOnDay, summarize } from './writingLogic';

export const TIERS = ['bronze', 'silver', 'gold', 'platinum'];
export const TIER_LABEL = { bronze: 'Bronze', silver: 'Silver', gold: 'Gold', platinum: 'Platinum' };

const HOUR = 3600;

// icon: an Ionicons name, or glyph: short text drawn in the medal.
export const MEDALS = [
  {
    id: 'words', name: 'Wordsmith', icon: 'pencil', unit: 'words',
    desc: 'Every word you type, across every session. Words you typed and then deleted still count. Pasted text never does.',
    tiers: [100, 1000, 10000, 50000],
  },
  {
    id: 'time', name: 'Timekeeper', icon: 'time-outline', unit: 'time', isTime: true,
    desc: 'Total time spent writing. The timer pauses when the app is in the background.',
    tiers: [1 * HOUR, 10 * HOUR, 50 * HOUR, 200 * HOUR],
  },
  {
    id: 'sessions', name: 'Regular', icon: 'calendar-outline', unit: 'sessions',
    desc: 'Every time you sit down to write and save a session.',
    tiers: [5, 25, 100, 365],
  },
  {
    id: 'streak', name: 'On a Roll', icon: 'flame-outline', unit: 'days in a row',
    desc: 'Your longest run of days in a row with at least one session. Your best streak is kept, even if it ends.',
    tiers: [3, 7, 30, 100],
  },
  {
    id: 'goals', name: 'Goal Getter', icon: 'locate-outline', unit: 'goals met',
    desc: "Days you reached that day's goal.",
    tiers: [1, 10, 50, 200],
  },
  {
    id: 'vowels', name: 'Vowel Voyager', glyph: 'Ae', unit: 'vowels',
    desc: 'Every a, e, i, o and u in the writing you kept.',
    tiers: [500, 5000, 50000, 250000],
  },
  {
    id: 'consonants', name: 'Consonant Collector', glyph: 'Bk', unit: 'consonants',
    desc: 'Every letter that isn’t a vowel (y counts here) in the writing you kept.',
    tiers: [1000, 10000, 100000, 500000],
  },
  {
    id: 'punctuation', name: 'Punctuation Pro', glyph: '?!', unit: 'marks',
    desc: 'Periods, commas, question marks, exclamation points, quotes, dashes and the rest.',
    tiers: [25, 250, 2500, 10000],
  },
  {
    id: 'longWords', name: 'Big Words', glyph: '10+', unit: 'long words',
    desc: 'Words longer than 10 letters, like “extraordinary” or “imagination”.',
    tiers: [10, 100, 500, 2000],
  },
];

export const TOTAL_TIERS = MEDALS.length * TIERS.length;

// ---------------------------------------------------------------------------
// Counting text.
// ---------------------------------------------------------------------------

const VOWEL = /[aeiou]/i;
const LETTER = /[a-z]/i;
const PUNCT = /[.,!?;:'"“”‘’()\[\]\-–—…/]/;

export function textStats(text) {
  let vowels = 0;
  let consonants = 0;
  let punctuation = 0;
  for (const ch of text || '') {
    if (LETTER.test(ch)) {
      if (VOWEL.test(ch)) vowels += 1;
      else consonants += 1;
    } else if (PUNCT.test(ch)) punctuation += 1;
  }
  let longWords = 0;
  for (const raw of (text || '').split(/\s+/)) {
    const letters = raw.replace(/[^a-z]/gi, '');
    if (letters.length > 10) longWords += 1;
  }
  return { vowels, consonants, punctuation, longWords };
}

// Everything the medals measure, from all saved sessions.
export function medalStats(sessions, dailyGoals = {}) {
  const sum = summarize(sessions);
  const days = [...new Set(sessions.map((s) => s.day))];
  const totals = { vowels: 0, consonants: 0, punctuation: 0, longWords: 0 };
  let goals = 0;
  for (const day of days) {
    for (const piece of dayPieces(sessions, day)) {
      const t = textStats(piece.text);
      totals.vowels += t.vowels;
      totals.consonants += t.consonants;
      totals.punctuation += t.punctuation;
      totals.longWords += t.longWords;
    }
    const pct = dailyPct(dailyGoals[day], summarize(sessionsOnDay(sessions, day)));
    if (pct != null && pct >= 100) goals += 1;
  }
  return {
    words: sum.words,
    time: sum.seconds,
    sessions: sum.count,
    streak: longestStreak(sessions),
    goals,
    ...totals,
  };
}

// ---------------------------------------------------------------------------
// Progress.
// ---------------------------------------------------------------------------

export function formatAmount(medal, n) {
  if (medal.isTime) {
    if (n >= HOUR && n % HOUR === 0) return `${n / HOUR} hr`;
    return formatDuration(n);
  }
  return Math.round(n).toLocaleString();
}

// tierIndex: -1 = none yet, 0 = bronze … 3 = platinum.
export function medalProgress(medal, value) {
  let tierIndex = -1;
  medal.tiers.forEach((t, i) => { if (value >= t) tierIndex = i; });
  const maxed = tierIndex === TIERS.length - 1;
  const next = maxed ? null : medal.tiers[tierIndex + 1];
  const pct = maxed ? 100 : Math.max(0, Math.min(100, Math.floor((value / next) * 100)));
  const toGo = maxed ? 0 : next - value;
  const tier = tierIndex >= 0 ? TIERS[tierIndex] : null;
  const nextTier = maxed ? null : TIERS[tierIndex + 1];

  let progressText;
  if (maxed) progressText = `${formatAmount(medal, value)}${medal.isTime ? '' : ` ${medal.unit}`} · all tiers`;
  else if (medal.isTime) progressText = `${formatAmount(medal, value)} / ${formatAmount(medal, next)}`;
  else progressText = `${formatAmount(medal, value)} / ${formatAmount(medal, next)} ${medal.unit}`;

  const toGoText = maxed
    ? 'Every tier earned'
    : `${formatAmount(medal, toGo)}${medal.isTime ? '' : ` ${medal.unit}`} to go`;

  return { ...medal, value, tierIndex, tier, nextTier, next, pct, toGo, maxed, progressText, toGoText };
}

export function allMedalProgress(sessions, dailyGoals) {
  const stats = medalStats(sessions, dailyGoals);
  return MEDALS.map((m) => medalProgress(m, stats[m.id]));
}

export function tierCounts(progressList) {
  const counts = { bronze: 0, silver: 0, gold: 0, platinum: 0, total: 0 };
  for (const p of progressList) {
    for (let i = 0; i <= p.tierIndex; i += 1) counts[TIERS[i]] += 1;
    counts.total += p.tierIndex + 1;
  }
  return counts;
}

// The medal you're closest to levelling up (ignores maxed ones).
export function almostThere(progressList) {
  return progressList.filter((p) => !p.maxed).sort((a, b) => b.pct - a.pct)[0] || null;
}

// Compares what's earned now with what was recorded before.
// `record` = { [medalId]: { tierIndex, dates: [iso per tier] } }.
// Returns the updated record and the tiers that are new since last time.
export function diffMedals(progressList, record, nowIso = new Date().toISOString()) {
  const next = { ...(record || {}) };
  const newlyEarned = [];
  for (const p of progressList) {
    const prev = next[p.id] || { tierIndex: -1, dates: [] };
    if (p.tierIndex > prev.tierIndex) {
      const dates = [...prev.dates];
      for (let i = prev.tierIndex + 1; i <= p.tierIndex; i += 1) {
        dates[i] = nowIso;
        newlyEarned.push({ ...p, earnedTier: TIERS[i], earnedTierIndex: i, threshold: p.tiers[i] });
      }
      next[p.id] = { tierIndex: p.tierIndex, dates };
    }
  }
  // Highest tier first, so the celebration shows the biggest one.
  newlyEarned.sort((a, b) => b.earnedTierIndex - a.earnedTierIndex);
  return { record: next, newlyEarned };
}

// The most recently earned medals, newest first (for the Brainstorm card).
export function latestEarned(progressList, record, n = 3) {
  return progressList
    .filter((p) => p.tierIndex >= 0)
    .map((p) => ({ ...p, earnedAt: record?.[p.id]?.dates?.[p.tierIndex] || '' }))
    .sort((a, b) => String(b.earnedAt).localeCompare(String(a.earnedAt)) || b.tierIndex - a.tierIndex)
    .slice(0, n);
}
