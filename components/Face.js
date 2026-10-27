// components/Face.js — one feeling face, drawn with react-native-svg.

import React from 'react';
import Svg, { Circle, Path } from 'react-native-svg';
import { feelingById } from '../feelings';

const INK = '#0A1633';

export default function Face({ id, size = 44 }) {
  const f = feelingById(id);
  if (!f) return null;
  // Thin lines get slightly bolder when the face is drawn small.
  const stroke = size < 28 ? 3 : 2.2;
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48" accessibilityElementsHidden importantForAccessibility="no">
      <Circle cx="24" cy="24" r="20" fill="#FFFFFF" stroke={INK} strokeWidth={size < 28 ? 2.6 : 2} />
      <Path d={f.line} fill="none" stroke={INK} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" />
      {f.fill ? <Path d={f.fill} fill={INK} /> : null}
      {f.tint ? <Path d={f.tint} fill="#7FB3D5" /> : null}
    </Svg>
  );
}
