// components/Medal.js — one round medal: a metal ring in its tier colour
// (bronze, silver, gold, platinum, or grey when not earned yet) around an
// icon or a short glyph like "Ae" or "?!".

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

export const TIER_STYLE = {
  bronze: { ring: ['#EDBB8A', '#A8632F'], inner: '#FFF6EC', ink: '#6B3A12', label: '#8A4F1E', chip: '#F6E3D0' },
  silver: { ring: ['#F4F6FA', '#98A1B4'], inner: '#FFFFFF', ink: '#3E475C', label: '#4F5878', chip: '#E9ECF2' },
  gold: { ring: ['#F6DD93', '#C8912B'], inner: '#FFF8E6', ink: '#6E4A07', label: '#8A5E12', chip: '#FBEFD2' },
  platinum: { ring: ['#EAF8FF', '#7FB3D5'], inner: '#F7FCFF', ink: '#1E4E70', label: '#1E4E70', chip: '#E1F1FA' },
  locked: { ring: ['#EEF0F5', '#CDD2DD'], inner: '#F6F7FA', ink: '#7A8399', label: '#5A6484', chip: '#EEF0F5' },
};

export default function Medal({ medal, tier, size = 86 }) {
  const t = TIER_STYLE[tier || 'locked'];
  const inner = Math.round(size * 0.77);
  return (
    <LinearGradient
      colors={t.ring}
      start={{ x: 0.15, y: 0 }}
      end={{ x: 0.85, y: 1 }}
      style={[s.ring, { width: size, height: size, borderRadius: size / 2 }]}
    >
      <View style={[s.inner, { width: inner, height: inner, borderRadius: inner / 2, backgroundColor: t.inner }]}>
        {medal.glyph ? (
          <Text style={{ fontSize: Math.round(size * 0.22), fontWeight: '800', letterSpacing: -0.5, color: t.ink }}>{medal.glyph}</Text>
        ) : (
          <Ionicons name={medal.icon} size={Math.round(size * 0.36)} color={t.ink} />
        )}
      </View>
    </LinearGradient>
  );
}

const s = StyleSheet.create({
  ring: {
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#0C2265', shadowOpacity: 0.16, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 3,
  },
  inner: { alignItems: 'center', justifyContent: 'center' },
});
