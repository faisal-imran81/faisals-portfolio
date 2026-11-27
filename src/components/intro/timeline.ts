/**
 * One clock drives the whole opener (seconds from the first rendered frame).
 * The 3D scene and the DOM layers both read from here so the slash, the
 * screen wipe and the name reveal stay locked together.
 */
export const T = {
  reach: 0.9, // right hand moves to the hilt
  draw: 1.15, // blade leaves the saya
  guard: 1.85, // hasso-no-kamae: raised guard, the pause
  slash: 2.3, // kesa-giri begins
  impact: 2.48, // blade crosses frame centre
  slashEnd: 2.62,
  streak: 2.4, // DOM light streak across the screen
  split: 2.56, // screen splits along the cut
  splitEnd: 3.3,
  name: 2.72,
  role: 3.1,
  tagline: 3.35,
  exit: 4.35, // overlay lifts into the homepage
  exitDur: 0.85,
} as const;

/** CSS-only variant (no WebGL / scene too slow to load): cut lands almost immediately. */
export const FALLBACK_SHIFT = T.streak - 0.35;
