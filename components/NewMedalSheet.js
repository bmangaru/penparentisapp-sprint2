// components/NewMedalSheet.js — "New medal!" pop-up on the Brainstorm page, for a
// tier earned by a session that was closed with × (after Finish, the medal
// shows inside the end-of-session sheet instead).
// Shows the biggest new tier; if several were earned at once, says so.

import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, Animated } from 'react-native';
import Sheet from './Sheet';
import Medal, { TIER_STYLE } from './Medal';
import { colors, radius, space } from '../theme';
import { TIER_LABEL, TIERS, formatAmount } from '../medals';

export default function NewMedalSheet({ earned, onSeeAll, onClose }) {
  const scale = useRef(new Animated.Value(0.6)).current;
  const first = earned?.[0];

  useEffect(() => {
    if (!first) return;
    scale.setValue(0.6);
    Animated.spring(scale, { toValue: 1, friction: 5, tension: 120, useNativeDriver: true }).start();
  }, [first?.id, first?.earnedTier]);

  if (!first) return null;
  const t = TIER_STYLE[first.earnedTier];
  const amount = `${formatAmount(first, first.threshold)}${first.isTime ? '' : ` ${first.unit}`}`;
  const nextIdx = first.earnedTierIndex + 1;
  const others = earned.length - 1;

  return (
    <Sheet visible onClose={onClose} title="New medal!" subtitle="Earned with this session">
      <View style={s.center}>
        <Animated.View style={{ transform: [{ scale }] }}>
          <Medal medal={first} tier={first.earnedTier} size={140} />
        </Animated.View>
        <Text style={[s.tier, { color: t.label, backgroundColor: t.chip }]}>{TIER_LABEL[first.earnedTier].toUpperCase()}</Text>
        <Text style={s.name}>{TIER_LABEL[first.earnedTier]} {first.name}</Text>
        <Text style={s.p}>You've reached {amount}.</Text>
        <View style={s.chips}>
          {nextIdx < TIERS.length && (
            <Text style={s.chip}>
              Next: {TIER_LABEL[TIERS[nextIdx]]} at {formatAmount(first, first.tiers[nextIdx])}
            </Text>
          )}
          {others > 0 && <Text style={s.chip}>+{others} more medal{others === 1 ? '' : 's'} earned</Text>}
        </View>
      </View>
      <Pressable style={s.primary} onPress={onSeeAll}>
        <Text style={s.primaryText}>See my medals</Text>
      </Pressable>
      <Pressable style={s.secondary} onPress={onClose}>
        <Text style={s.secondaryText}>Done</Text>
      </Pressable>
    </Sheet>
  );
}

const s = StyleSheet.create({
  center: { alignItems: 'center', gap: 10, paddingBottom: space.md },
  tier: { fontSize: 11, fontWeight: '800', letterSpacing: 0.8, borderRadius: radius.pill, paddingVertical: 4, paddingHorizontal: 12, overflow: 'hidden', marginTop: 4 },
  name: { fontSize: 22, fontWeight: '700', color: colors.ink, textAlign: 'center' },
  p: { fontSize: 14, color: colors.body, textAlign: 'center' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8 },
  chip: { fontSize: 12, color: colors.body, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: colors.line, borderRadius: radius.pill, paddingVertical: 6, paddingHorizontal: 10, overflow: 'hidden' },
  primary: { backgroundColor: colors.royal, borderRadius: radius.md, paddingVertical: 15, alignItems: 'center' },
  primaryText: { color: '#FFFFFF', fontWeight: '700', fontSize: 14.5 },
  secondary: { paddingVertical: 14, alignItems: 'center' },
  secondaryText: { color: colors.royal, fontWeight: '700', fontSize: 14 },
});
