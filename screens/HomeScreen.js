import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import { Screen, Header, Button, openLink } from '../components/ui';
import Sheet from '../components/Sheet';
import DonorCrawl from '../components/DonorCrawl';
import { colors, lift, radius, space } from '../theme';
import { LINKS } from '../links';
import { buildInsights, describeDailyGoal, formatDuration, TIER_DEEP } from '../writingLogic';
import { loadAll, useToday } from '../writingStore';

// US 5: three networks named in the backlog, plus two we already had links
// for. Named ones are listed first since those are the ones called out.
const SOCIALS = [
  { label: 'Facebook', url: LINKS.facebook },
  { label: 'LinkedIn', url: LINKS.linkedin },
  { label: 'Instagram', url: LINKS.instagram },
  { label: 'X', url: LINKS.x },
];

export default function HomeScreen({ navigation }) {
  const [socialsOpen, setSocialsOpen] = useState(false);
  const today = useToday();
  const [insights, setInsights] = useState(null);

  // Rebuilt every time Home comes into view, so the message reflects the
  // current time of day and whatever was just written.
  useFocusEffect(
    useCallback(() => {
      loadAll().then(({ sessions, dailyGoals }) => setInsights(buildInsights(sessions, dailyGoals, new Date())));
    }, [today])
  );

  const goWrite = () => navigation.navigate('Brainstorm', { screen: 'BrainstormWriter' });
  const goBrainstorm = () => navigation.navigate('Brainstorm', { screen: 'BrainstormHome' });

  return (
    <Screen>
      <Header title="Pen Parentis" subtitle="parenting done, write.">
        {insights && (
          <View style={s.greetWrap}>
            <Text style={s.greetBold}>{insights.headline}</Text>
            {insights.lines.map((l) => (
              <Text key={l} style={s.greet}>{l}</Text>
            ))}
            {insights.tier !== 'new' && (
              <Text style={s.tierTag}>
                {insights.tier === 'deep'
                  ? `Tuned to ${insights.total} sessions`
                  : `Learning your rhythm · ${TIER_DEEP - insights.total} sessions to the deeper view`}
              </Text>
            )}
          </View>
        )}
      </Header>

      <View style={s.pad}>
        {insights && (
          <View style={[s.today, lift]}>
            <View style={{ flex: 1 }}>
              <Text style={s.todayLabel}>Today</Text>
              <Text style={s.todayTitle}>
                {insights.todayGoal ? describeDailyGoal(insights.todayGoal) : "What's your goal today?"}
              </Text>
              <Text style={s.todaySub}>
                {insights.todayPct != null
                  ? `${insights.todayPct}% done · ${insights.todaySum.words.toLocaleString()} words`
                  : `${insights.todaySum.words.toLocaleString()} words · ${formatDuration(insights.todaySum.seconds)} so far`}
              </Text>
              {insights.todayPct != null && (
                <View style={s.track}>
                  <View style={[s.fill, { width: `${Math.min(100, insights.todayPct)}%` }, insights.todayPct >= 100 && { backgroundColor: colors.karma }]} />
                </View>
              )}
            </View>
            <Pressable style={s.pill} onPress={insights.todayGoal ? goWrite : goBrainstorm}>
              <Text style={s.pillText}>{insights.todayGoal ? 'Write' : 'Set goal'}</Text>
            </Pressable>
          </View>
        )}

        <View style={[s.live, lift]}>
          <View style={s.dot} />
          <View style={{ flex: 1 }}>
            <Text style={s.liveTitle}>Next salon, 7pm ET</Text>
            <Text style={s.liveSub}>Three writers · register free on Eventbrite</Text>
          </View>
          <Pressable style={s.pill} onPress={() => navigation.navigate('Salons')}>
            <Text style={s.pillText}>Details</Text>
          </Pressable>
        </View>

        <Button label="Socials" variant="outline" onPress={() => setSocialsOpen(true)} />

        <Pressable onPress={() => openLink(LINKS.donate)}>
          <LinearGradient
            colors={[colors.karmaLight, colors.karma]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[s.karma, lift]}
          >
            <View style={{ flex: 1 }}>
              <Text style={s.karmaTitle}>Get Karma</Text>
              <Text style={s.karmaSub}>Keep the salons free for the next parent</Text>
            </View>
            <View style={s.give}><Text style={s.giveText}>Give</Text></View>
          </LinearGradient>
        </Pressable>
      </View>

      <DonorCrawl />

      <Sheet
        visible={socialsOpen}
        onClose={() => setSocialsOpen(false)}
        title="Follow along"
      >
        {SOCIALS.map((n) => (
          <Pressable
            key={n.label}
            style={s.socialRow}
            onPress={() => { setSocialsOpen(false); openLink(n.url); }}
          >
            <Text style={s.socialText}>{n.label}</Text>
            <Text style={s.socialArrow}>›</Text>
          </Pressable>
        ))}
      </Sheet>
    </Screen>
  );
}

const s = StyleSheet.create({
  pad: { padding: space.lg, paddingTop: space.md },
  greetWrap: { marginTop: space.md, gap: 3 },
  greet: { color: 'rgba(255,255,255,0.94)', fontSize: 14, lineHeight: 21 },
  greetBold: { fontWeight: '700', color: colors.cream, fontSize: 15, lineHeight: 22 },
  tierTag: { marginTop: 6, fontSize: 11, color: 'rgba(246,234,218,0.75)', fontWeight: '600' },
  today: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#fff', borderRadius: radius.md, padding: 14, marginBottom: space.md,
    borderWidth: 1, borderColor: colors.line,
  },
  todayLabel: { fontSize: 10.5, fontWeight: '800', color: colors.karma, textTransform: 'uppercase', letterSpacing: 0.7 },
  todayTitle: { fontSize: 14.5, fontWeight: '700', color: colors.ink, marginTop: 2 },
  todaySub: { fontSize: 12, color: colors.muted, marginTop: 2 },
  track: { height: 6, borderRadius: 999, backgroundColor: colors.cream, marginTop: 8, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 999, backgroundColor: colors.royal },
  live: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: colors.cream, borderRadius: radius.md, padding: 14, marginBottom: space.md,
  },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.karma },
  liveTitle: { fontWeight: '700', fontSize: 13.5, color: colors.ink },
  liveSub: { fontSize: 12, color: colors.muted },
  pill: { backgroundColor: colors.royal, borderRadius: radius.pill, paddingVertical: 9, paddingHorizontal: 14 },
  pillText: { color: '#fff', fontSize: 12.5, fontWeight: '600' },
  karma: { flexDirection: 'row', alignItems: 'center', borderRadius: radius.md, padding: 16, marginTop: space.xs },
  karmaTitle: { fontSize: 17, fontWeight: '700', color: '#231702' },
  karmaSub: { fontSize: 11.5, color: 'rgba(35,23,2,0.82)' },
  give: { backgroundColor: colors.ink, borderRadius: radius.pill, paddingVertical: 8, paddingHorizontal: 15 },
  giveText: { color: colors.cream, fontWeight: '700', fontSize: 13 },
  socialRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.line,
  },
  socialText: { fontSize: 14.5, color: colors.ink, fontWeight: '600' },
  socialArrow: { fontSize: 18, color: colors.muted },
});
