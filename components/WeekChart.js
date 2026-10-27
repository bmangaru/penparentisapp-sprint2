// components/WeekChart.js — seven bars, Mon..Sun. Each bar is that day's
// progress against that day's goal; the dashed line is 100%. Colour says
// whether the goal was exceeded, met, partly done, or not touched.
// Plain Views — no chart library needed.

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, radius } from '../theme';

const MAX_PCT = 150; // bars above this are capped visually (the label still shows the real %)
const HEIGHT = 120;

export const STATUS_STYLE = {
  exceeded: { color: colors.karma, label: 'Exceeded' },
  met: { color: colors.royal, label: 'Met' },
  some: { color: '#8FA3DA', label: 'Some of it' },
  none: { color: '#C8CEDE', label: 'None' },
};

export default function WeekChart({ days }) {
  const goalLineBottom = (100 / MAX_PCT) * HEIGHT;

  return (
    <View>
      <View style={[s.plot, { height: HEIGHT + 18 }]}>
        <View style={[s.goalLine, { bottom: goalLineBottom }]} />
        <Text style={[s.goalLineLabel, { bottom: goalLineBottom + 2 }]}>goal</Text>
        {days.map((d) => {
          const st = STATUS_STYLE[d.status];
          const h = d.pct != null ? Math.max(d.pct > 0 ? 6 : 3, (Math.min(d.pct, MAX_PCT) / MAX_PCT) * HEIGHT) : 0;
          return (
            <View key={d.key} style={s.col}>
              {d.pct != null && d.status !== 'future' ? (
                <>
                  <Text style={[s.pct, d.status === 'exceeded' && { color: colors.karma }]}>{d.pct}%</Text>
                  <View style={[s.bar, { height: h, backgroundColor: st?.color || colors.line }]} />
                </>
              ) : d.status === 'nogoal' && d.count > 0 ? (
                <>
                  <Text style={s.pct}>{d.words}w</Text>
                  <View style={[s.bar, s.barHollow, { height: 10 }]} />
                </>
              ) : (
                <View style={[s.bar, s.barEmpty]} />
              )}
            </View>
          );
        })}
      </View>
      <View style={s.labels}>
        {days.map((d) => (
          <Text key={d.key} style={[s.day, d.isToday && s.dayToday]}>{d.label}</Text>
        ))}
      </View>
      <View style={s.legend}>
        {Object.entries(STATUS_STYLE).map(([k, v]) => (
          <View key={k} style={s.legendItem}>
            <View style={[s.swatch, { backgroundColor: v.color }]} />
            <Text style={s.legendText}>{v.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  plot: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
  goalLine: {
    position: 'absolute', left: 0, right: 0, height: 0,
    borderTopWidth: 1, borderStyle: 'dashed', borderColor: colors.karma,
  },
  goalLineLabel: { position: 'absolute', right: 0, fontSize: 9.5, color: colors.karma, fontWeight: '700' },
  col: { flex: 1, alignItems: 'center', justifyContent: 'flex-end' },
  pct: { fontSize: 9.5, fontWeight: '700', color: colors.muted, marginBottom: 3 },
  bar: { width: 22, borderRadius: radius.sm },
  barHollow: { borderWidth: 1.5, borderColor: colors.royal, backgroundColor: 'transparent' },
  barEmpty: { height: 3, backgroundColor: colors.line },
  labels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
  day: { flex: 1, textAlign: 'center', fontSize: 11, fontWeight: '600', color: colors.muted },
  dayToday: { color: colors.royalDeep, fontWeight: '800' },
  legend: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 12 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  swatch: { width: 10, height: 10, borderRadius: 3 },
  legendText: { fontSize: 11, color: colors.muted },
});
