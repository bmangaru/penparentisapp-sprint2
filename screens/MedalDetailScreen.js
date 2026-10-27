// screens/MedalDetailScreen.js — one medal: big ring, what it counts, the
// progress to the next tier, and all four tiers with the date each was earned.

import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '../components/ui';
import Medal, { TIER_STYLE } from '../components/Medal';
import { colors, radius, space } from '../theme';
import { TIER_LABEL, TIERS, formatAmount } from '../medals';
import { syncMedals } from '../writingStore';

function shortDate(iso) {
  return iso ? new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : '';
}

export default function MedalDetailScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const [data, setData] = useState(null);

  useFocusEffect(
    useCallback(() => {
      syncMedals().then(({ medals, record }) => {
        const m = medals.find((x) => x.id === route.params?.id) || medals[0];
        setData({ m, dates: record?.[m.id]?.dates || [] });
      });
    }, [route.params?.id])
  );

  if (!data) return <Screen />;
  const { m, dates } = data;
  const st = TIER_STYLE[m.tier || 'locked'];
  const amount = (n) => `${formatAmount(m, n)}${m.isTime ? '' : ` ${m.unit}`}`;

  return (
    <Screen>
      <View style={{ paddingTop: insets.top + 8, paddingHorizontal: space.lg }}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={10} style={s.back}>
          <Text style={s.backText}>‹  Medals</Text>
        </Pressable>
      </View>

      <View style={s.hero}>
        <Medal medal={m} tier={m.tier} size={148} />
        <Text style={[s.tierChip, { color: st.label, backgroundColor: st.chip }]}>
          {m.tier ? TIER_LABEL[m.tier].toUpperCase() : 'NOT EARNED YET'}
        </Text>
        <Text style={s.name}>{m.name}</Text>
        <Text style={s.desc}>{m.desc}</Text>
      </View>

      <View style={s.pad}>
        <View style={s.card}>
          <View style={s.cardHead}>
            <Text style={s.cardTitle}>{m.maxed ? 'Every tier earned' : `Next: ${TIER_LABEL[m.nextTier]}`}</Text>
            {!m.maxed && <Text style={s.cardMeta}>{m.toGoText}</Text>}
          </View>
          <View style={s.trackBig}>
            <View style={[s.fillBig, { width: `${Math.max(2, m.pct)}%`, backgroundColor: m.maxed ? colors.karma : colors.royal }]} />
          </View>
          <Text style={s.cardMeta}>{m.maxed ? amount(m.value) : `${amount(m.value)} of ${amount(m.next)}`}</Text>
        </View>

        <Text style={s.h}>Tiers</Text>
        {TIERS.map((t, i) => {
          const earned = i <= m.tierIndex;
          const current = i === m.tierIndex;
          return (
            <View key={t} style={[s.tierRow, current && s.tierRowCurrent, !earned && s.tierRowLocked]}>
              <Medal medal={m} tier={earned ? t : null} size={38} />
              <View style={{ flex: 1 }}>
                <Text style={s.tierTitle}>{TIER_LABEL[t]} · {amount(m.tiers[i])}</Text>
                <Text style={s.tierSub}>
                  {earned
                    ? `Earned ${shortDate(dates[i]) || 'before medals were added'}${current ? ' · current tier' : ''}`
                    : i === m.tierIndex + 1 ? `Not yet — ${m.pct}% there` : 'Not yet'}
                </Text>
              </View>
              <Ionicons
                name={earned ? 'checkmark' : 'lock-closed-outline'}
                size={earned ? 22 : 18}
                color={earned ? colors.royal : colors.muted}
                accessibilityLabel={earned ? 'Earned' : 'Locked'}
              />
            </View>
          );
        })}
      </View>
    </Screen>
  );
}

const s = StyleSheet.create({
  back: { minHeight: 44, justifyContent: 'center', alignSelf: 'flex-start' },
  backText: { color: colors.royal, fontSize: 14, fontWeight: '700' },
  hero: { alignItems: 'center', gap: 10, paddingHorizontal: space.lg, paddingVertical: space.md },
  tierChip: { fontSize: 11, fontWeight: '800', letterSpacing: 0.8, borderRadius: radius.pill, paddingVertical: 4, paddingHorizontal: 12, overflow: 'hidden', marginTop: 4 },
  name: { fontSize: 26, fontWeight: '700', color: colors.ink },
  desc: { fontSize: 13.5, lineHeight: 20, color: colors.body, textAlign: 'center' },
  pad: { paddingHorizontal: space.lg },
  card: { backgroundColor: '#FFFFFF', borderRadius: 16, borderWidth: 1, borderColor: colors.line, padding: 16, gap: 8 },
  cardHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  cardTitle: { fontSize: 13.5, fontWeight: '700', color: colors.ink },
  cardMeta: { fontSize: 12.5, color: '#4F5878' },
  trackBig: { height: 10, borderRadius: radius.pill, backgroundColor: '#E8EBF2', overflow: 'hidden' },
  fillBig: { height: '100%', borderRadius: radius.pill },
  h: { fontSize: 15, fontWeight: '700', color: colors.ink, marginTop: space.lg, marginBottom: space.sm },
  tierRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#FFFFFF',
    borderWidth: 1, borderColor: colors.line, borderRadius: radius.md, paddingVertical: 10, paddingHorizontal: 12, marginBottom: 10,
  },
  tierRowCurrent: { borderWidth: 2, borderColor: colors.karma },
  tierRowLocked: { backgroundColor: '#F6F7FA', borderStyle: 'dashed', borderColor: 'rgba(10,22,51,0.22)' },
  tierTitle: { fontSize: 14, fontWeight: '700', color: colors.ink },
  tierSub: { fontSize: 12, color: '#4F5878', marginTop: 2 },
});
