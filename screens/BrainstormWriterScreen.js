// screens/BrainstormWriterScreen.js — "a typer": minimal chrome, full-screen,
// a fresh stopwatch each time you enter, nothing between you and the page.
//
// Every session is logged and saved (text included) the moment you leave —
// via "Finish & check in", the ×, or the Android back button. Finishing opens
// ONE sheet: saved, today's goal, any new medal, and "How do you feel?". Pasting is
// blocked so the word count only ever reflects words actually typed.

import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TextInput, StyleSheet, Pressable, KeyboardAvoidingView, Platform, AppState,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import SessionDoneSheet from '../components/SessionDoneSheet';
import { colors, radius, space } from '../theme';
import {
  appRatingFor, clock, countWords, dayKey, dailyPct, looksLikePaste, sessionsOnDay, summarize, textToContinue,
} from '../writingLogic';
import { loadAll, saveSession, shareWriting, syncMedals } from '../writingStore';

export default function BrainstormWriterScreen({ navigation }) {
  const insets = useSafeAreaInsets();

  // One session per visit to this screen. Its day is the day it *started*,
  // so a session that runs past midnight still counts toward the day you began.
  const session = useRef({
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    startedAt: new Date().toISOString(),
    day: dayKey(),
    hour: new Date().getHours() + new Date().getMinutes() / 60,
  }).current;

  const [text, setText] = useState('');
  const [seconds, setSeconds] = useState(0);
  const [effortWords, setEffortWords] = useState(0); // counts words you later deleted
  const [blockedPastes, setBlockedPastes] = useState(0);
  const [notice, setNotice] = useState('');
  const [paused, setPaused] = useState(false);

  const [dailyGoal, setDailyGoal] = useState(null);
  const [earlierToday, setEarlierToday] = useState({ words: 0, seconds: 0, count: 0 });

  // The one end-of-session sheet: saved + goal + new medal + "How do you feel?".
  const [sheet, setSheet] = useState(null); // null | 'done'
  const [newMedals, setNewMedals] = useState([]);
  const [feeling, setFeeling] = useState(null);
  const finishedRec = useRef(null);

  const highestThisEntry = useRef(0);
  const textRef = useRef('');
  const latest = useRef({});
  const saved = useRef(false);
  const noticeTimer = useRef(null);

  // "Keep writing": if there's writing from earlier today, open with it in
  // the box. Only words typed beyond it count toward this session.
  const [ready, setReady] = useState(false);
  const [resumedAt, setResumedAt] = useState(null);
  const continues = useRef(false);

  useEffect(() => {
    loadAll().then(({ dailyGoals, sessions }) => {
      setDailyGoal(dailyGoals[session.day] || null);
      setEarlierToday(summarize(sessionsOnDay(sessions, session.day)));
      const piece = textToContinue(sessions, session.day);
      if (piece && piece.text.trim()) {
        const t = piece.text.replace(/\s*$/, ' ');
        textRef.current = t;
        highestThisEntry.current = countWords(t);
        continues.current = true;
        setText(t);
        setResumedAt(piece.lastAt);
      }
      setReady(true);
    });
  }, []);

  // Stopwatch. Stops while the app is in the background or the check-in is open.
  const [appActive, setAppActive] = useState(true);
  useEffect(() => {
    const sub = AppState.addEventListener('change', (st) => setAppActive(st === 'active'));
    return () => sub.remove();
  }, []);
  useEffect(() => {
    if (paused || !appActive || sheet) return undefined;
    const id = setInterval(() => setSeconds((x) => x + 1), 1000);
    return () => clearInterval(id);
  }, [paused, appActive, sheet]);

  function flash(msg) {
    setNotice(msg);
    clearTimeout(noticeTimer.current);
    noticeTimer.current = setTimeout(() => setNotice(''), 3200);
  }

  function onChangeText(t) {
    const prev = textRef.current;
    if (looksLikePaste(prev, t)) {
      // Let the native input take the change for one frame, then put the old
      // text back — setting the same value twice in a row wouldn't re-sync it.
      setText(t);
      requestAnimationFrame(() => setText(prev));
      setBlockedPastes((n) => n + 1);
      flash("Pasting is off in the typer — type it in and it'll count.");
      return;
    }
    textRef.current = t;
    setText(t);
    const words = countWords(t);
    if (words > highestThisEntry.current) {
      const delta = words - highestThisEntry.current;
      highestThisEntry.current = words;
      setEffortWords((w) => w + delta);
    }
    // Deleting text does NOT reduce the count — effort already spent stays counted.
  }

  const todayTotals = {
    words: earlierToday.words + effortWords,
    seconds: earlierToday.seconds + seconds,
  };
  const pct = dailyPct(dailyGoal, todayTotals);
  // Goal status (exceeded / met / some / none). Not shown as a rating any more;
  // it only colours the weekly chart and the day bubble's progress bar.
  const appRating = appRatingFor(pct);

  function buildRecord(extra = {}) {
    return {
      ...session,
      endedAt: new Date().toISOString(),
      seconds,
      words: effortWords,
      finalWords: countWords(textRef.current),
      text: textRef.current,
      blockedPastes,
      dailyGoal,
      pct,
      appRating,
      feeling: null,
      continues: continues.current,
      ...extra,
    };
  }
  latest.current = buildRecord;

  // Safety net: however the screen is left, the session gets saved.
  useEffect(() => {
    const unsub = navigation.addListener('beforeRemove', () => {
      if (saved.current) return;
      const rec = latest.current();
      if (rec.words > 0 || rec.seconds >= 60) {
        saved.current = true;
        saveSession(rec);
      }
    });
    return unsub;
  }, [navigation]);

  async function finish() {
    // Opened the page and left without writing anything new: nothing to log.
    if (effortWords === 0 && seconds < 60) {
      saved.current = true;
      navigation.goBack();
      return;
    }
    const rec = buildRecord();
    finishedRec.current = rec;
    saved.current = true;
    await saveSession(rec);
    const { newlyEarned } = await syncMedals();
    setNewMedals(newlyEarned);
    setSheet('done');
  }

  // Saved straight away, so the choice sticks even if the app is closed next.
  function pickFeeling(id) {
    setFeeling(id);
    finishedRec.current = { ...finishedRec.current, feeling: id };
    saveSession(finishedRec.current);
  }

  function done() {
    setSheet(null);
    navigation.goBack();
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.paper }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={[s.topBar, { paddingTop: insets.top + 10 }]}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={10}>
          <Text style={s.close}>×</Text>
        </Pressable>
        <View style={s.statsInline}>
          <Text style={s.statText}>{effortWords} words</Text>
          <Text style={s.dotSep}>·</Text>
          <Text style={s.statText}>{clock(seconds)}</Text>
          {pct != null && (
            <>
              <Text style={s.dotSep}>·</Text>
              <Text style={[s.statText, pct >= 100 && s.statGold]}>{pct}% of today</Text>
            </>
          )}
          <Pressable onPress={() => setPaused((p) => !p)} hitSlop={8} style={s.pauseBtn}>
            <Text style={s.pauseText}>{paused ? 'Resume' : 'Pause'}</Text>
          </Pressable>
        </View>
      </View>

      {notice ? (
        <View style={s.notice}><Text style={s.noticeText}>{notice}</Text></View>
      ) : resumedAt ? (
        <View style={s.notice}>
          <Text style={s.noticeText}>
            Picking up where you left off at {new Date(resumedAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
          </Text>
        </View>
      ) : null}

      {ready ? (
        <TextInput
          value={text}
          onChangeText={onChangeText}
          multiline
          autoFocus
          contextMenuHidden // hides Copy / Paste on long-press (iOS + Android)
          placeholder="Start typing…"
          placeholderTextColor={colors.muted}
          style={s.editor}
          textAlignVertical="top"
        />
      ) : (
        <View style={s.editor} />
      )}

      <View style={[s.bottomBar, { paddingBottom: insets.bottom + 14 }]}>
        <Pressable style={s.finishBtn} onPress={finish}>
          <Text style={s.finishText}>Finish &amp; check in</Text>
        </Pressable>
      </View>

      <SessionDoneSheet
        visible={sheet === 'done'}
        words={effortWords}
        seconds={seconds}
        dailyGoal={dailyGoal}
        todayTotals={todayTotals}
        pct={pct}
        newMedals={newMedals}
        feeling={feeling}
        onPickFeeling={pickFeeling}
        onShare={() => shareWriting(finishedRec.current || buildRecord())}
        onDone={done}
        onMedalPress={() => { setSheet(null); navigation.replace('Medals'); }}
      />
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: space.lg, paddingBottom: 10 },
  close: { fontSize: 28, color: colors.muted, lineHeight: 28 },
  statsInline: { flexDirection: 'row', alignItems: 'center', gap: 8, flexShrink: 1 },
  statText: { fontSize: 13, fontWeight: '600', color: colors.muted },
  statGold: { color: colors.karma },
  dotSep: { color: colors.muted },
  pauseBtn: { marginLeft: 4, paddingVertical: 4, paddingHorizontal: 10, borderRadius: radius.pill, backgroundColor: colors.cream },
  pauseText: { fontSize: 12, fontWeight: '700', color: colors.royalDeep },
  notice: { marginHorizontal: space.lg, marginBottom: 6, backgroundColor: colors.cream, borderRadius: radius.sm, padding: 10 },
  noticeText: { fontSize: 12.5, color: colors.body },
  editor: { flex: 1, paddingHorizontal: space.lg, fontSize: 17, lineHeight: 26, color: colors.ink },
  bottomBar: { paddingHorizontal: space.lg, paddingTop: 10, borderTopWidth: 1, borderTopColor: colors.line },
  finishBtn: { backgroundColor: colors.royal, borderRadius: radius.md, paddingVertical: 15, alignItems: 'center' },
  finishText: { color: '#fff', fontWeight: '700', fontSize: 14.5 },
});
