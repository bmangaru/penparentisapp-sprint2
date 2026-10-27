// components/MedalsCard.js — the Medals card on the Brainstorm page (after
// this week's bubbles): latest medals earned, the one you're closest to, and
// a way into the full Medals page.

import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Medal from './Medal';
import { colors, lift, radius, space } from '../theme';
import { TIER_LABEL, TOTAL_TIERS, almostThere, latestEarned, tierCounts } from '../medals';

export default function MedalsCard({ medals, record, onPress }) {
  if (!medals?.length) return null;
  const counts = tierCounts(medals);
  const latest = latestEarned(medals, record, 3);
  const close = almostThere(medals);

  return (
    <View>
      <View style={s.titleRow}>
        <Text style={s.h}>Medals</Text>
        <Text style={s.count}>{counts.total} of {TOTAL_TIERS} earned</Text>
      </View>
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={`Medals, ${counts.total} of ${TOTAL_TIERS} earned. See all medals`}
        style={({ pressed }) => [s.card, lift, pressed && { opacity: 0.92 }]}
      >
        <View style={s.row}>
          {latest.length ? (
            latest.map((m) => <Medal key={m.id} medal={m} tier={m.tier} size={50} />)
          ) : (
            medals.slice(0, 3).map((m) => <Medal key={m.id} medal={m} tier={null} size={50} />)
          )}
          <Text style={s.rowLabel}>{latest.length ? 'Latest earned' : 'Your first medals are close'}</Text>
        </View>

        {close && (
          <View style={s.close}>
            <View style={s.closeHead}>
              <Text style={s.closeTitle} numberOfLines={1}>
                Almost there: {close.nextTier === 'bronze' ? close.name : `${TIER_LABEL[close.nextTier]} ${close.name}`}
              </Text>
              <Text style={s.closeToGo}>{close.toGoText}</Text>
            </View>
            <View style={s.track}>
              <View style={[s.fill, { width: `${Math.max(2, close.pct)}%` }]} />
            </View>
          </View>
        )}

        <Text style={s.cta}>See all medals  ›</Text>
      </Pressable>
    </View>
  );
}

const s = StyleSheet.create({
  titleRow: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginTop: space.sm },
  h: { fontSize: 15, fontWeight: '700', color: colors.ink, marginBottom: space.sm },
  count: { fontSize: 12, color: colors.muted },
  card: { backgroundColor: '#FFFFFF', borderRadius: 16, borderWidth: 1, borderColor: colors.line, padding: 16, gap: 12 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  rowLabel: { flex: 1, fontSize: 12, color: colors.muted },
  close: { borderTopWidth: 1, borderTopColor: colors.line, paddingTop: 12, gap: 6 },
  closeHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 },
  closeTitle: { flex: 1, fontSize: 13.5, fontWeight: '700', color: colors.ink },
  closeToGo: { fontSize: 12, color: colors.muted },
  track: { height: 6, borderRadius: radius.pill, backgroundColor: '#E8EBF2', overflow: 'hidden' },
  fill: { height: '100%', borderRadius: radius.pill, backgroundColor: colors.royal },
  cta: { fontSize: 12.5, fontWeight: '700', color: colors.royal },
});
