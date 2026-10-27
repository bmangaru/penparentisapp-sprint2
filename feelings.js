// feelings.js — "How do you feel?" after a session. The ten feelings come from
// Pen Parentis' own "How do you feel?" page. The faces are simple line drawings
// on a 48×48 grid: `line` is stroked, `fill` is solid ink, `tint` is a blue
// accent (a tear or a drop of sweat). Pure data — no React Native imports.

const EYES = 'M16 20a2.2 2.2 0 1 0 4.4 0a2.2 2.2 0 1 0 -4.4 0 M27.6 20a2.2 2.2 0 1 0 4.4 0a2.2 2.2 0 1 0 -4.4 0';
const EYES_LOW = 'M16 22a2.2 2.2 0 1 0 4.4 0a2.2 2.2 0 1 0 -4.4 0 M27.6 22a2.2 2.2 0 1 0 4.4 0a2.2 2.2 0 1 0 -4.4 0';
const EYES_DOWN = 'M16 23a2.2 2.2 0 1 0 4.4 0a2.2 2.2 0 1 0 -4.4 0 M27.6 23a2.2 2.2 0 1 0 4.4 0a2.2 2.2 0 1 0 -4.4 0';

export const FEELINGS = [
  { id: 'happy', label: 'Happy', line: 'M16 28 q8 8 16 0', fill: EYES },
  { id: 'ecstatic', label: 'Ecstatic', line: 'M14 21 q4 -5 8 0 M26 21 q4 -5 8 0', fill: 'M15 27 h18 q0 10 -9 10 q-9 0 -9 -10z' },
  { id: 'confused', label: 'Confused', line: 'M27 13 l7 -2 M17 32 q3 -3 6 0 t6 0 t6 0', fill: EYES },
  {
    id: 'panicked', label: 'Panicked',
    line: 'M14 20a4 4 0 1 0 8 0a4 4 0 1 0 -8 0 M26 20a4 4 0 1 0 8 0a4 4 0 1 0 -8 0',
    fill: 'M16.5 20a1.5 1.5 0 1 0 3 0a1.5 1.5 0 1 0 -3 0 M28.5 20a1.5 1.5 0 1 0 3 0a1.5 1.5 0 1 0 -3 0 M20 32a4 5 0 1 0 8 0a4 5 0 1 0 -8 0',
    tint: 'M38 9 q-4 5 0 7 q4 -2 0 -7z',
  },
  { id: 'anxious', label: 'Anxious', line: 'M14 17 l7 -3 M34 17 l-7 -3 M16 32 q2 -2 4 0 t4 0 t4 0 t4 0', fill: EYES },
  { id: 'angry', label: 'Angry', line: 'M14 14 l8 4 M34 14 l-8 4 M17 34 q7 -7 14 0', fill: EYES_LOW },
  {
    id: 'betrayed', label: 'Betrayed', line: 'M14 20 h8 M26 20 h8 M17 33 q7 -4 14 1',
    fill: 'M18.5 21.5a1.8 1.8 0 1 0 3.6 0a1.8 1.8 0 1 0 -3.6 0 M30.5 21.5a1.8 1.8 0 1 0 3.6 0a1.8 1.8 0 1 0 -3.6 0',
  },
  { id: 'frustrated', label: 'Frustrated', line: 'M14 16 h8 M26 16 h8 M16 29 h16 v6 h-16 z M20 29 v6 M24 29 v6 M28 29 v6', fill: EYES },
  { id: 'hurt', label: 'Hurt', line: 'M18 33 q6 -5 12 0', fill: EYES, tint: 'M17.5 24 q-3 5 0 7 q3 -2 0 -7z' },
  { id: 'guilty', label: 'Guilty', line: 'M15 15 q3 -2 6 0 M27 15 q3 -2 6 0 M20 31 q4 3 8 0', fill: EYES_DOWN },
];

export function feelingById(id) {
  return FEELINGS.find((f) => f.id === id) || null;
}

export function feelingLabel(id) {
  return feelingById(id)?.label || '';
}
