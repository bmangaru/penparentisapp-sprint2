// screens/BrainstormHomeScreen.js — the landing screen: today's goal (asked
// fresh every day, resets at 12am), a Start writing button that changes with
// the day, one white bubble per day of writing this week (tap to read it),
// and the weekly goal with a 7-day chart.

import React, { useState, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, TextInput } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import { Screen, Header, Button } from '../components/ui';
import Sheet from '../components/Sheet';
import WeekChart from '../components/WeekChart';
import DayBubble from '../components/DayBubble';
import MedalsCard from '../components/MedalsCard';
import NewMedalSheet from '../components/NewMedalSheet';
import { colors, gradients, lift, radius, space } from '../theme';
import {
  dailyPct, daySummary, describeDailyGoal, formatDuration, describeWeeklyGoal, sessionsOnDay, sessionsThisWeek,
  startButtonState, suggestedDailyGoal, summarize, weekChartData, weekDayKeys, weeklyPct,
} from '../writingLogic';
import { loadAll, saveDailyGoal, saveWeeklyGoal, syncMedals, useToday } from '../writingStore';

const WORD_PRESETS = [50, 100, 150, 250, 500, 750, 1000, 2000];
const TIME_PRESETS = [5, 10, 15, 20, 30, 45, 60, 90];

export default function BrainstormHomeScreen({ navigation }) {
  const today = useToday();
  const [data, setData] = useState({ weeklyGoal: null, dailyGoals: {}, sessions: [] });

  // Weekly goal setup
  const [weeklyOpen, setWeeklyOpen] = useState(false);
  const [setupStep, setSetupStep] = useState(1);
  const [pickedType, setPickedType] = useState(null);
  const [wordTargetInput, setWordTargetInput] = useState('');
  const [timeTargetInput, setTimeTargetInput] = useState('');
  const [sessionTargetInput, setSessionTargetInput] = useState('');

  // "What's your goal today?"
  const [dailyOpen, setDailyOpen] = useState(false);
  const [dailyType, setDailyType] = useState('word');
  const [dailyInput, setDailyInput] = useState('');
  const dismissedFor = useRef(null);
  const startAfterGoal = useRef(false);

  // Medals: progress for the card, plus any tier earned since the last check
  // (e.g. a session closed with × instead of Finish) to celebrate here.
  const [medalState, setMedalState] = useState({ medals: [], record: {} });
  const [newMedals, setNewMedals] = useState([]);

  const reload = useCallback(async () => {
    const d = await loadAll();
    setData(d);
    const m = await syncMedals(d);
    setMedalState({ medals: m.medals, record: m.record });
    if (m.newlyEarned.length) setNewMedals(m.newlyEarned);
    return d;
  }, []);

  function maybePrompt(d) {
    if (!d.weeklyGoal) {
      setSetupStep(1);
      setWeeklyOpen(true);
    } else if (!d.dailyGoals[today] && dismissedFor.current !== today) {
      openDaily(d);
    }
  }

  // Reload whenever this screen regains focus (e.g. back from the typer), and
  // again when the clock passes midnight while it's open (`today` changes).
  useFocusEffect(
    useCallback(() => {
      reload().then(maybePrompt);
    }, [today])
  );

  function openDaily(d = data) {
    const keys = Object.keys(d.dailyGoals).sort();
    const last = keys.length ? d.dailyGoals[keys[keys.length - 1]] : null;
    const type = last && !last.skipped ? last.type : d.weeklyGoal?.type === 'time' ? 'time' : 'word';
    setDailyType(type);
    const current = d.dailyGoals[today];
    setDailyInput(current && !current.skipped ? String(current.target) : '');
    setDailyOpen(true);
  }

  async function setDaily(goal) {
    const dailyGoals = await saveDailyGoal(goal, today);
    setData((d) => ({ ...d, dailyGoals }));
    setDailyOpen(false);
    // Came from "Set today's goal & start" → go straight to the page.
    if (startAfterGoal.current) {
      startAfterGoal.current = false;
      setTimeout(() => navigation.navigate('BrainstormWriter'), 300);
    }
  }

  function closeDaily() {
    dismissedFor.current = today;
    startAfterGoal.current = false;
    setDailyOpen(false);
  }

  function onStartPress() {
    if (button.state === 'setGoal') {
      startAfterGoal.current = true;
      openDaily();
    } else {
      navigation.navigate('BrainstormWriter');
    }
  }

  function openWeekly() {
    setSetupStep(1);
    setWeeklyOpen(true);
  }

  async function saveWeekly() {
    const g = {
      type: pickedType,
      wordTarget: pickedType === 'word' || pickedType === 'both' ? Number(wordTargetInput) || 0 : undefined,
      timeTarget: pickedType === 'time' || pickedType === 'both' ? Number(timeTargetInput) || 0 : undefined,
      sessionTarget: pickedType === 'sessions' ? Number(sessionTargetInput) || 0 : undefined,
    };
    await saveWeeklyGoal(g);
    const next = { ...data, weeklyGoal: g };
    setData(next);
    setWeeklyOpen(false);
    if (!next.dailyGoals[today]) setTimeout(() => openDaily(next), 350);
  }

  const { weeklyGoal, dailyGoals, sessions } = data;
  const todayGoal = dailyGoals[today] || null;
  const todaySum = summarize(sessionsOnDay(sessions, today));
  const todayPct = dailyPct(todayGoal, todaySum);
  const weekSum = summarize(sessionsThisWeek(sessions));
  const wPct = weeklyPct(weeklyGoal, weekSum);
  const chart = weekChartData(sessions, dailyGoals);
  const button = startButtonState(sessions, dailyGoals, today);
  // This week's days, newest first, up to today. A day only gets a white
  // bubble once something was written; earlier empty days show as dashed rows
  // and today shows nothing until the first session.
  const weekDays = weekDayKeys()
    .filter((k) => k <= today)
    .reverse()
    .map((k) => daySummary(sessions, dailyGoals, k))
    .filter((d) => d.count > 0 || d.key !== today);
  const suggestion = suggestedDailyGoal(sessions, dailyType);
  const presets = dailyType === 'time' ? TIME_PRESETS : WORD_PRESETS;

  let weekVerdict = `${wPct}% of the way there`;
  if (wPct >= 110) weekVerdict = `Exceeded — ${wPct - 100}% over your weekly goal`;
  else if (wPct >= 100) weekVerdict = 'Weekly goal met';

  return (
    <Screen>
      <Header title="Brainstorm" subtitle="Small goals, kept quietly" />
      <View style={s.pad}>
        {/* Today */}
        <LinearGradient colors={gradients.header} style={[s.goal, lift]}>
          <Text style={s.goalLabel}>Today · {describeDailyGoal(todayGoal)}</Text>
          {todayPct != null ? (
            <>
              <Text style={s.big}>{Math.min(999, todayPct)}%</Text>
              <View style={s.track}>
                <LinearGradient colors={gradients.gold} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={[s.fill, { width: `${Math.min(100, todayPct)}%` }]} />
              </View>
            </>
          ) : (
            <Text style={s.bigSmall}>{todaySum.words.toLocaleString()} words · {formatDuration(todaySum.seconds)}</Text>
          )}
          <Pressable onPress={() => openDaily()}>
            <Text style={s.editGoal}>{todayGoal && !todayGoal.skipped ? "Change today's goal" : "What's your goal today?"}</Text>
          </Pressable>
        </LinearGradient>

        {/* Start writing — label and action change with the day */}
        <Pressable onPress={onStartPress} style={({ pressed }) => [lift, s.startWrap, pressed && { opacity: 0.92 }]}>
          <LinearGradient
            colors={button.state === 'met' ? gradients.gold : gradients.button}
            style={s.start}
          >
            <Text style={[s.startTitle, button.state === 'met' && { color: '#231702' }]}>{button.title}</Text>
            <Text style={[s.startSub, button.state === 'met' && { color: '#3D2A05' }]}>{button.sub}</Text>
          </LinearGradient>
        </Pressable>

        {/* One bubble per day */}
        <View style={s.weekTitleRow}>
          <Text style={s.h}>This week</Text>
          <Text style={s.weekTotals}>
            {weekSum.words.toLocaleString()} words · {formatDuration(weekSum.seconds)} · {weekSum.count} {weekSum.count === 1 ? 'session' : 'sessions'}
          </Text>
        </View>
        {weekDays.length === 0 && (
          <Text style={s.emptyWeek}>Your first day of writing this week will show up here.</Text>
        )}
        {weekDays.map((d) => (
          <DayBubble
            key={d.key}
            day={d}
            isToday={d.key === today}
            onPress={() => navigation.navigate('BrainstormDay', { day: d.key })}
          />
        ))}
        <Pressable onPress={() => navigation.navigate('MyWriting')} style={s.allLink}>
          <Text style={s.link}>See all my writing  ›</Text>
        </Pressable>

        {/* Medals — option C: after this week's bubbles, before the weekly goal */}
        <MedalsCard medals={medalState.medals} record={medalState.record} onPress={() => navigation.navigate('Medals')} />

        {/* Weekly goal + chart */}
        <Text style={s.h}>Weekly goal</Text>
        <View style={[s.logCard, lift]}>
          {weeklyGoal ? (
            <>
              <View style={s.weekHead}>
                <Text style={s.weekGoal}>{describeWeeklyGoal(weeklyGoal)}</Text>
                <Pressable onPress={openWeekly}><Text style={s.link}>Change</Text></Pressable>
              </View>
              <Text style={[s.verdict, wPct >= 100 && { color: colors.karma }]}>{weekVerdict}</Text>
              <View style={s.trackLight}>
                <View style={[s.fillLight, { width: `${Math.min(100, wPct)}%` }, wPct >= 100 && { backgroundColor: colors.karma }]} />
              </View>
            </>
          ) : (
            <Pressable onPress={openWeekly}><Text style={s.link}>Set a weekly goal</Text></Pressable>
          )}

          <Text style={[s.chartTitle, { marginTop: space.md }]}>Each day vs. that day's goal</Text>
          <WeekChart days={chart} />
        </View>
        <Text style={s.foot}>Words you typed and later deleted still count. Pasted text never does.</Text>
      </View>

      {/* Weekly goal setup */}
      <Sheet
        visible={weeklyOpen}
        onClose={() => weeklyGoal && setWeeklyOpen(false)}
        title={setupStep === 1 ? 'Your weekly goal' : 'How much, over 7 days?'}
        subtitle={setupStep === 1 ? 'Runs Monday to Sunday' : undefined}
      >
        {setupStep === 1 && (
          <View style={{ gap: 10 }}>
            {[
              { k: 'word', label: 'Words', sub: 'A target word count for the week' },
              { k: 'time', label: 'Time', sub: 'A target number of minutes for the week' },
              { k: 'both', label: 'Both', sub: 'Words and time together' },
              { k: 'sessions', label: 'Sessions', sub: 'How many times you sit down to write' },
            ].map((o) => (
              <Pressable key={o.k} style={[s.optCard, lift]} onPress={() => { setPickedType(o.k); setSetupStep(2); }}>
                <Text style={s.optLabel}>{o.label}</Text>
                <Text style={s.optSub}>{o.sub}</Text>
              </Pressable>
            ))}
          </View>
        )}
        {setupStep === 2 && (
          <View>
            {(pickedType === 'word' || pickedType === 'both') && (
              <>
                <Text style={s.inputLabel}>How many words this week?</Text>
                <TextInput value={wordTargetInput} onChangeText={setWordTargetInput} keyboardType="number-pad" placeholder="e.g. 3000" style={s.input} />
              </>
            )}
            {(pickedType === 'time' || pickedType === 'both') && (
              <>
                <Text style={s.inputLabel}>How many minutes this week?</Text>
                <TextInput value={timeTargetInput} onChangeText={setTimeTargetInput} keyboardType="number-pad" placeholder="e.g. 90" style={s.input} />
              </>
            )}
            {pickedType === 'sessions' && (
              <>
                <Text style={s.inputLabel}>How many sessions this week?</Text>
                <TextInput value={sessionTargetInput} onChangeText={setSessionTargetInput} keyboardType="number-pad" placeholder="e.g. 5" style={s.input} />
              </>
            )}
            <Button label="Set weekly goal" onPress={saveWeekly} />
            <Pressable onPress={() => setSetupStep(1)}><Text style={[s.link, s.center]}>Back</Text></Pressable>
          </View>
        )}
      </Sheet>

      {/* What's your goal today? */}
      <Sheet visible={dailyOpen} onClose={closeDaily} title="What's your goal today?" subtitle="Resets at midnight — tomorrow is a fresh page">
        <View style={s.segment}>
          {[{ k: 'word', label: 'Words' }, { k: 'time', label: 'Minutes' }].map((o) => (
            <Pressable key={o.k} style={[s.segBtn, dailyType === o.k && s.segOn]} onPress={() => { setDailyType(o.k); setDailyInput(''); }}>
              <Text style={[s.segText, dailyType === o.k && s.segTextOn]}>{o.label}</Text>
            </Pressable>
          ))}
        </View>
        <View style={s.chips}>
          {suggestion && !presets.includes(suggestion) && (
            <Pressable style={[s.chip, s.chipSuggest]} onPress={() => setDaily({ type: dailyType, target: suggestion })}>
              <Text style={s.chipText}>{suggestion}{dailyType === 'time' ? ' min' : ''}</Text>
              <Text style={s.chipSub}>your usual</Text>
            </Pressable>
          )}
          {presets.map((n) => (
            <Pressable key={n} style={s.chip} onPress={() => setDaily({ type: dailyType, target: n })}>
              <Text style={s.chipText}>{n.toLocaleString()}{dailyType === 'time' ? ' min' : ''}</Text>
            </Pressable>
          ))}
        </View>
        <Text style={s.inputLabel}>Or your own number</Text>
        <TextInput
          value={dailyInput}
          onChangeText={setDailyInput}
          keyboardType="number-pad"
          placeholder={dailyType === 'time' ? 'minutes' : 'words'}
          style={s.input}
        />
        <Button label="Set today's goal" onPress={() => Number(dailyInput) > 0 && setDaily({ type: dailyType, target: Number(dailyInput) })} />
        <Pressable onPress={() => setDaily({ skipped: true })}>
          <Text style={[s.link, s.center]}>No goal today — I'll just write</Text>
        </Pressable>
      </Sheet>

      {newMedals.length > 0 && !dailyOpen && !weeklyOpen && (
        <NewMedalSheet
          earned={newMedals}
          onClose={() => setNewMedals([])}
          onSeeAll={() => { setNewMedals([]); navigation.navigate('Medals'); }}
        />
      )}
    </Screen>
  );
}


const s = StyleSheet.create({
  pad: { padding: space.lg },
  goal: { borderRadius: radius.lg, padding: 20, marginBottom: space.md },
  goalLabel: { color: 'rgba(255,255,255,0.85)', fontSize: 12.5, marginBottom: 6 },
  big: { color: '#fff', fontSize: 38, fontWeight: '700' },
  bigSmall: { color: '#fff', fontSize: 22, fontWeight: '700', marginVertical: 8 },
  track: { height: 13, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.18)', marginVertical: 12, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 999 },
  editGoal: { color: colors.cream, fontSize: 12, fontWeight: '600', textDecorationLine: 'underline' },
  h: { fontSize: 15, fontWeight: '700', color: colors.ink, marginTop: space.md, marginBottom: space.sm },
  logCard: { backgroundColor: '#fff', borderRadius: radius.md, padding: 16 },
  weekHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  weekGoal: { fontSize: 13.5, fontWeight: '700', color: colors.ink },
  verdict: { fontSize: 12.5, color: colors.muted, marginTop: 3 },
  trackLight: { height: 8, borderRadius: 999, backgroundColor: colors.cream, marginTop: 10, overflow: 'hidden' },
  fillLight: { height: '100%', borderRadius: 999, backgroundColor: colors.royal },
  startWrap: { borderRadius: radius.md, marginBottom: space.sm },
  start: { borderRadius: radius.md, paddingVertical: 13, paddingHorizontal: 16, alignItems: 'center', gap: 3 },
  startTitle: { fontSize: 15, fontWeight: '700', color: '#FFFFFF' },
  startSub: { fontSize: 12, color: 'rgba(255,255,255,0.88)', textAlign: 'center' },
  weekTitleRow: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
  weekTotals: { fontSize: 12, color: colors.muted },
  emptyWeek: { fontSize: 13, color: colors.muted, marginBottom: space.sm },
  allLink: { alignItems: 'center', paddingVertical: 10, minHeight: 44, justifyContent: 'center' },
  chartTitle: { fontSize: 12, fontWeight: '700', color: colors.muted, marginBottom: 10 },
  foot: { fontSize: 11.5, color: colors.muted, marginTop: space.sm, textAlign: 'center' },
  link: { color: colors.royal, fontSize: 13, fontWeight: '700' },
  center: { textAlign: 'center', paddingVertical: 12 },
  optCard: { backgroundColor: '#fff', borderRadius: radius.md, padding: 14 },
  optLabel: { fontSize: 14.5, fontWeight: '700', color: colors.ink },
  optSub: { fontSize: 12, color: colors.muted, marginTop: 3 },
  inputLabel: { fontSize: 13, fontWeight: '600', color: colors.ink, marginBottom: 6, marginTop: 10 },
  input: { backgroundColor: '#fff', borderRadius: radius.md, borderWidth: 1, borderColor: colors.line, padding: 12, fontSize: 15, marginBottom: 10 },
  segment: { flexDirection: 'row', backgroundColor: colors.cream, borderRadius: radius.md, padding: 4, marginBottom: space.md },
  segBtn: { flex: 1, paddingVertical: 9, borderRadius: radius.sm, alignItems: 'center' },
  segOn: { backgroundColor: '#fff' },
  segText: { fontSize: 13, fontWeight: '600', color: colors.muted },
  segTextOn: { color: colors.royalDeep, fontWeight: '700' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { flexBasis: '22%', flexGrow: 1, minHeight: 44, justifyContent: 'center', backgroundColor: '#fff', borderWidth: 1, borderColor: colors.line, borderRadius: radius.md, paddingVertical: 10, paddingHorizontal: 8, alignItems: 'center' },
  chipSuggest: { borderColor: colors.karma, backgroundColor: colors.cream },
  chipText: { fontSize: 14, fontWeight: '700', color: colors.ink },
  chipSub: { fontSize: 10, color: colors.karma, fontWeight: '700', marginTop: 1 },
});
