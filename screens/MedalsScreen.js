// screens/MedalsScreen.js — every medal in a 3-across grid: its current tier
// ring, progress toward the next tier, and the count. Tap one for its tiers.

import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Screen } from '../components/ui';
import Medal, { TIER_STYLE } from '../components/Medal';
import { colors, gradients, radius, space } from '../theme';
import { TIER_LABEL, TIERS, TOTAL_TIERS, tierCounts } from '../medals';
import { syncMedals } from '../writingStore';

export default function MedalsScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [medals, setMedals] = useState([]);

  useFocusEffect(
    useCallback(() => {
      syncMedals().then((r) => setMedals(r.medals));
    }, [])
  );

  const counts = tierCounts(medals);

  return (
    <Screen>
      <LinearGradient colors={gradients.header} start={{ x: 0.1, y: 0 }} end={{ x: 0.9, y: 1 }} style={[s.header, { paddingTop: insets.top + 8 }]}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={10} style={s.back}>
          <Text style={s.backText}>‹  Brainstorm</Text>
        </Pressable>
        <Text style={s.title}>Medals</Text>
        <Text style={s.sub}>{counts.total} of {TOTAL_TIERS} tiers earned · every word you type counts</Text>
        <View style={s.countRow}>
          {TIERS.map((t) => (
            <View key={t} style={s.countChip}>
              <View style={[s.dot, { backgroundColor: TIER_STYLE[t].ring[1] }]} />
              <Text style={s.countText}>{TIER_LABEL[t]} {counts[t]}</Text>
            </View>
          ))}
        </View>
      </LinearGradient>

      <View style={s.grid}>
        {medals.map((m) => {
          const st = TIER_STYLE[m.tier || 'locked'];
          return (
            <Pressable
              key={m.id}
              style={s.cell}
              onPress={() => navigation.navigate('MedalDetail', { id: m.id })}
              accessibilityRole="button"
              accessibilityLabel={`${m.name}, ${m.tier ? TIER_LABEL[m.tier] : 'not earned yet'}, ${m.progressText}`}
            >
              <Medal medal={m} tier={m.tier} size={86} />
              <Text style={s.name} numberOfLines={2}>{m.name}</Text>
              <Text style={[s.tier, { color: st.label }]}>{m.tier ? TIER_LABEL[m.tier].toUpperCase() : 'NOT YET'}</Text>
              <View style={s.track}>
                <View style={[s.fill, { width: `${Math.max(2, m.pct)}%` }, m.maxed && { backgroundColor: colors.karma }]} />
              </View>
              <Text style={s.progress} numberOfLines={2}>{m.progressText}</Text>
            </Pressable>
          );
        })}
      </View>
    </Screen>
  );
}

const s = StyleSheet.create({
  header: { paddingHorizontal: space.lg, paddingBottom: space.lg },
  back: { minHeight: 44, justifyContent: 'center', alignSelf: 'flex-start' },
  backText: { color: colors.cream, fontSize: 14, fontWeight: '700' },
  title: { color: '#FFFFFF', fontSize: 26, fontWeight: '700' },
  sub: { color: 'rgba(255,255,255,0.82)', fontSize: 13, marginTop: 4 },
  countRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 14 },
  countChip: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: radius.pill, paddingVertical: 6, paddingHorizontal: 10 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  countText: { color: '#FFFFFF', fontSize: 12 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 10, paddingTop: 20, rowGap: 22 },
  cell: { width: '33.33%', alignItems: 'center', gap: 6, paddingHorizontal: 4 },
  name: { fontSize: 12.5, fontWeight: '700', color: colors.ink, textAlign: 'center', lineHeight: 16 },
  tier: { fontSize: 10.5, fontWeight: '800', letterSpacing: 0.5 },
  track: { width: 78, height: 5, borderRadius: radius.pill, backgroundColor: '#E8EBF2', overflow: 'hidden' },
  fill: { height: '100%', borderRadius: radius.pill, backgroundColor: colors.royal },
  progress: { fontSize: 10.5, color: '#4F5878', textAlign: 'center' },
});
