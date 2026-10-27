// screens/MyWritingScreen.js — every day you've written, newest first, as the
// same white day bubbles the Brainstorm page uses, grouped by week. Tap a
// bubble to read that day in full and send it to yourself.

import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Screen, Button } from '../components/ui';
import DayBubble from '../components/DayBubble';
import { colors, space } from '../theme';
import { dayKey, daySummary, startOfWeek, parseDayKey, weekDayKeys } from '../writingLogic';
import { loadAll, shareDays } from '../writingStore';

export default function MyWritingScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [data, setData] = useState({ sessions: [], dailyGoals: {} });

  useFocusEffect(
    useCallback(() => {
      loadAll().then(setData);
    }, [])
  );

  const today = dayKey();
  const days = [...new Set(data.sessions.map((s) => s.day))]
    .sort()
    .reverse()
    .map((k) => daySummary(data.sessions, data.dailyGoals, k));

  // Group by the Monday that starts each week.
  const weeks = [];
  for (const d of days) {
    const wk = dayKey(startOfWeek(parseDayKey(d.key)));
    if (!weeks.length || weeks[weeks.length - 1].wk !== wk) weeks.push({ wk, days: [] });
    weeks[weeks.length - 1].days.push(d);
  }

  const thisWeekKeys = new Set(weekDayKeys());
  const thisWeek = days.filter((d) => thisWeekKeys.has(d.key)).reverse();

  function weekTitle(wk) {
    if (thisWeekKeys.has(wk)) return 'This week';
    return `Week of ${parseDayKey(wk).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`;
  }

  return (
    <Screen>
      <View style={[s.top, { paddingTop: insets.top + 12 }]}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={10} style={s.backBtn}>
          <Text style={s.back}>‹ Brainstorm</Text>
        </Pressable>
        <Text style={s.title}>My writing</Text>
        <Text style={s.sub}>
          {days.length} day{days.length === 1 ? '' : 's'} of writing saved on this phone
        </Text>
      </View>

      <View style={s.pad}>
        {thisWeek.length > 0 && (
          <Button
            label="Send this week's writing to myself"
            variant="outline"
            onPress={() => shareDays(thisWeek, "This week's writing — Pen Parentis")}
          />
        )}

        {days.length === 0 && (
          <Text style={s.empty}>Nothing here yet. Every day you write shows up here automatically.</Text>
        )}

        {weeks.map((w) => (
          <View key={w.wk} style={{ marginTop: space.md }}>
            <Text style={s.week}>{weekTitle(w.wk)}</Text>
            {w.days.map((d) => (
              <DayBubble
                key={d.key}
                day={d}
                isToday={d.key === today}
                onPress={() => navigation.navigate('BrainstormDay', { day: d.key })}
              />
            ))}
          </View>
        ))}
      </View>
    </Screen>
  );
}

const s = StyleSheet.create({
  top: { paddingHorizontal: space.lg, paddingBottom: space.sm, backgroundColor: colors.paper },
  backBtn: { minHeight: 44, justifyContent: 'center', alignSelf: 'flex-start' },
  back: { color: colors.royal, fontSize: 14, fontWeight: '700' },
  title: { fontSize: 26, fontWeight: '700', color: colors.ink },
  sub: { fontSize: 12.5, color: colors.muted, marginTop: 3 },
  pad: { paddingHorizontal: space.lg },
  empty: { fontSize: 13.5, color: colors.muted, marginTop: space.lg, lineHeight: 20 },
  week: { fontSize: 14, fontWeight: '700', color: colors.ink, marginBottom: 10 },
});
