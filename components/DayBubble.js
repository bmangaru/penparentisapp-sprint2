// components/DayBubble.js — one white bubble per day of writing. Today's has a
// blue outline and a TODAY tag. Tap → that day's full writing (BrainstormDay).
// A past day with no writing renders as a faded dashed row instead.

import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { colors, lift, radius } from '../theme';
import Face from './Face';
import { formatDuration, parseDayKey } from '../writingLogic';
import { feelingLabel } from '../feelings';

// Progress-bar colour from goal status (gold once the goal is exceeded).
const BAR = { exceeded: colors.karma, met: colors.royal, some: colors.royal, none: '#C8CEDE' };

export function dayLabel(key) {
  return parseDayKey(key).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
}

function plural(n, word) {
  return `${n.toLocaleString()} ${word}${n === 1 ? '' : 's'}`;
}

export default function DayBubble({ day, isToday, onPress }) {
  if (!day.count) {
    return (
      <View style={s.empty}>
        <Text style={s.emptyDate}>{dayLabel(day.key)}</Text>
        <Text style={s.emptyText}>No writing — that's okay</Text>
      </View>
    );
  }

  const barPct = day.pct != null ? Math.min(100, day.pct) : null;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Open ${dayLabel(day.key)}`}
      style={({ pressed }) => [s.card, lift, isToday && s.cardToday, pressed && { opacity: 0.92 }]}
    >
      <View style={s.row}>
        <View style={s.dateRow}>
          <Text style={s.date}>{dayLabel(day.key)}</Text>
          {isToday && <Text style={s.todayTag}>TODAY</Text>}
        </View>
        {day.feeling && (
          <View style={s.chip}>
            <Face id={day.feeling} size={20} />
            <Text style={s.chipText}>{feelingLabel(day.feeling)}</Text>
          </View>
        )}
      </View>

      <Text style={s.stats}>
        {plural(day.words, 'word')} · {formatDuration(day.seconds)} · {plural(day.count, 'check-in')}
      </Text>

      {barPct != null && (
        <View style={s.track}>
          <View style={[s.fill, { width: `${barPct}%`, backgroundColor: BAR[day.rating] || colors.royal }]} />
        </View>
      )}

      {day.preview ? (
        <Text style={s.preview} numberOfLines={2}>“{day.preview}”</Text>
      ) : (
        <Text style={s.preview}>Time only — no text saved</Text>
      )}

      <Text style={s.cta}>{isToday ? 'Tap to read what you wrote  ›' : 'Tap to read  ›'}</Text>
    </Pressable>
  );
}

const s = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, gap: 8,
    borderWidth: 1, borderColor: colors.line, marginBottom: 12,
  },
  cardToday: { borderWidth: 2, borderColor: colors.royal },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  dateRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  date: { fontSize: 15, fontWeight: '700', color: colors.ink },
  todayTag: {
    fontSize: 10.5, fontWeight: '800', letterSpacing: 0.6, color: '#FFFFFF',
    backgroundColor: colors.royal, borderRadius: radius.pill, paddingVertical: 3, paddingHorizontal: 8, overflow: 'hidden',
  },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#DCE4F7', borderRadius: radius.pill, paddingVertical: 3, paddingLeft: 4, paddingRight: 10 },
  chipText: { fontSize: 11.5, fontWeight: '700', color: colors.royalDeep },
  stats: { fontSize: 13, color: colors.body },
  track: { height: 6, borderRadius: 999, backgroundColor: colors.cream, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 999 },
  preview: { fontSize: 13, lineHeight: 19, color: colors.muted, fontStyle: 'italic' },
  cta: { fontSize: 12.5, fontWeight: '700', color: colors.royal },
  empty: {
    flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12,
    borderWidth: 1.5, borderStyle: 'dashed', borderColor: 'rgba(10,22,51,0.22)', borderRadius: 16,
    paddingVertical: 12, paddingHorizontal: 16,
  },
  emptyDate: { fontSize: 13.5, fontWeight: '700', color: colors.muted },
  emptyText: { fontSize: 12.5, color: colors.muted },
});
