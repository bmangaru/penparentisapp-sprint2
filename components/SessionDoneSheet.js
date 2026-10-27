// components/SessionDoneSheet.js — the ONE sheet at the end of a writing
// session: it's saved, how today's goal is going, any new medal, "How do you
// feel?" (optional), and Send to myself / Done. Replaces the old "How did it
// go?" rating sheet and the separate "Saved" sheet.

import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Sheet from './Sheet';
import Face from './Face';
import Medal from './Medal';
import { colors, radius, space } from '../theme';
import { FEELINGS, feelingLabel } from '../feelings';
import { formatDuration } from '../writingLogic';
import { TIER_LABEL, formatAmount } from '../medals';

function goalLine(goal, totals, pct) {
  if (!goal || goal.skipped || pct == null) {
    return { title: `Today: ${totals.words.toLocaleString()} words · ${formatDuration(totals.seconds)}`, right: null, pct: null };
  }
  if (goal.type === 'time') {
    const left = goal.target * 60 - totals.seconds;
    return {
      title: `Today: ${formatDuration(totals.seconds)} of ${goal.target} min`,
      right: pct >= 100 ? 'Goal met' : `${formatDuration(left)} to go`,
      pct,
    };
  }
  return {
    title: `Today: ${totals.words.toLocaleString()} of ${goal.target.toLocaleString()} words`,
    right: pct >= 100 ? 'Goal met' : `${(goal.target - totals.words).toLocaleString()} to go`,
    pct,
  };
}

export default function SessionDoneSheet({
  visible, words, seconds, dailyGoal, todayTotals, pct, newMedals = [],
  feeling, onPickFeeling, onShare, onDone, onMedalPress,
}) {
  const g = goalLine(dailyGoal, todayTotals, pct);
  const met = g.pct != null && g.pct >= 100;
  const medal = newMedals[0];
  const more = newMedals.length - 1;

  return (
    <Sheet
      visible={visible}
      onClose={onDone}
      title="Session saved"
      subtitle={`${words.toLocaleString()} word${words === 1 ? '' : 's'} · ${formatDuration(seconds)} · in My Writing`}
    >
      <View style={s.goal}>
        <View style={s.goalHead}>
          <Text style={s.goalTitle}>{g.title}</Text>
          {g.right ? <Text style={[s.goalRight, met && s.goalMet]}>{g.right}</Text> : null}
        </View>
        {g.pct != null && (
          <View style={s.track}>
            <View style={[s.fill, { width: `${Math.min(100, Math.max(2, g.pct))}%` }, met && { backgroundColor: colors.karma }]} />
          </View>
        )}
      </View>

      {medal && (
        <Pressable style={s.medal} onPress={onMedalPress} accessibilityRole="button" accessibilityLabel={`New medal: ${TIER_LABEL[medal.earnedTier]} ${medal.name}. See my medals`}>
          <Medal medal={medal} tier={medal.earnedTier} size={48} />
          <View style={{ flex: 1 }}>
            <Text style={s.medalKicker}>NEW MEDAL{more > 0 ? ` · +${more} MORE` : ''}</Text>
            <Text style={s.medalName}>{TIER_LABEL[medal.earnedTier]} {medal.name}</Text>
            <Text style={s.medalSub}>
              {formatAmount(medal, medal.threshold)}{medal.isTime ? '' : ` ${medal.unit}`}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#8A5E12" />
        </Pressable>
      )}

      <View style={s.feelHead}>
        <Text style={s.feelTitle}>How do you feel?</Text>
        <Text style={s.feelPicked}>{feeling ? feelingLabel(feeling) : 'Optional'}</Text>
      </View>
      <View style={s.faces}>
        {FEELINGS.map((f) => {
          const on = feeling === f.id;
          return (
            <Pressable
              key={f.id}
              onPress={() => onPickFeeling(on ? null : f.id)}
              style={[s.face, on && s.faceOn]}
              accessibilityRole="button"
              accessibilityState={{ selected: on }}
              accessibilityLabel={f.label}
            >
              <Face id={f.id} size={42} />
              <Text style={[s.faceLabel, on && s.faceLabelOn]} numberOfLines={1}>{f.label}</Text>
            </Pressable>
          );
        })}
      </View>

      <View style={s.actions}>
        <Pressable style={[s.btn, s.btnOutline]} onPress={onShare}>
          <Text style={[s.btnText, { color: colors.royal }]}>Send to myself</Text>
        </Pressable>
        <Pressable style={[s.btn, s.btnPrimary]} onPress={onDone}>
          <Text style={[s.btnText, { color: '#FFFFFF' }]}>Done</Text>
        </Pressable>
      </View>
    </Sheet>
  );
}

const s = StyleSheet.create({
  goal: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: colors.line, borderRadius: radius.md, padding: 12, gap: 8 },
  goalHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 },
  goalTitle: { flex: 1, fontSize: 13, fontWeight: '700', color: colors.ink },
  goalRight: { fontSize: 12, color: '#4F5878' },
  goalMet: { color: '#8A5E12', fontWeight: '700' },
  track: { height: 8, borderRadius: radius.pill, backgroundColor: colors.cream, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: radius.pill, backgroundColor: colors.royal },
  medal: {
    flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 12,
    backgroundColor: '#FFF8E6', borderWidth: 1.5, borderColor: colors.creamDeep, borderRadius: radius.md, padding: 10,
  },
  medalKicker: { fontSize: 11, fontWeight: '800', letterSpacing: 0.8, color: '#8A5E12' },
  medalName: { fontSize: 14.5, fontWeight: '700', color: colors.ink, marginTop: 2 },
  medalSub: { fontSize: 12, color: '#5C4A2A', marginTop: 1 },
  feelHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginTop: space.md, marginBottom: 8 },
  feelTitle: { fontSize: 16, fontWeight: '700', color: colors.ink },
  feelPicked: { fontSize: 12, color: '#4F5878' },
  faces: { flexDirection: 'row', flexWrap: 'wrap', rowGap: 8 },
  face: {
    width: '20%', alignItems: 'center', gap: 3, paddingVertical: 6,
    borderRadius: 14, borderWidth: 2, borderColor: 'transparent',
  },
  faceOn: { borderColor: colors.royal, backgroundColor: '#DCE4F7' },
  faceLabel: { fontSize: 10.5, fontWeight: '600', color: colors.ink },
  faceLabelOn: { fontWeight: '800' },
  actions: { flexDirection: 'row', gap: 10, marginTop: space.md },
  btn: { flex: 1, minHeight: 50, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  btnOutline: { borderWidth: 1.5, borderColor: colors.royal, backgroundColor: '#FFFFFF' },
  btnPrimary: { backgroundColor: colors.royal },
  btnText: { fontSize: 14, fontWeight: '700' },
});
