"use client";

import { useState } from "react";

const samples = [
  "Gravity is the invisible pull that makes things fall down to the ground.",
  "Gravity is a force that attracts objects with mass toward each other.",
  "Newton modelled gravity as F = G·m₁m₂/r², an attraction between masses.",
  "In general relativity, gravity is the curvature of spacetime caused by mass and energy.",
  "Einstein's field equations relate spacetime curvature to the stress-energy tensor.",
];

/** Elucid: one concept, five levels — interactive. */
export function LevelsViz({ accent }: { accent: string }) {
  const [level, setLevel] = useState(0);
  return (
    <div className="p-5 sm:p-8">
      <div className="mb-5 flex items-baseline justify-between">
        <span className="font-mono text-[0.5625rem] uppercase tracking-[0.14em] text-mute">Example topic: Gravity</span>
        <span className="font-mono text-[0.5625rem] uppercase tracking-[0.14em]" style={{ color: accent }}>
          Level {level + 1} / 5
        </span>
      </div>
      <p className="min-h-[4.5rem] text-[0.9375rem] leading-snug text-paper" aria-live="polite">{samples[level]}</p>
      <div className="mt-6">
        <input
          type="range"
          min={0}
          max={4}
          step={1}
          value={level}
          onChange={(e) => setLevel(Number(e.target.value))}
          aria-label="Explanation difficulty level"
          className="w-full cursor-pointer"
          style={{ accentColor: accent }}
        />
        <div className="mt-2 flex justify-between font-mono text-[0.5625rem] uppercase tracking-[0.14em] text-mute">
          <span>ELI5</span>
          <span>PhD</span>
        </div>
      </div>
    </div>
  );
}
