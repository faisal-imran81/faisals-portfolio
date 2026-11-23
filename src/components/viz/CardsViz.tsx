"use client";

import { motion, useReducedMotion } from "motion/react";
import { useState } from "react";

/** FlashForge: unstructured notes → LLM → a flippable deck of cards. */
export function CardsViz({ accent }: { accent: string }) {
  const reduce = useReducedMotion();
  const [flipped, setFlipped] = useState(false);
  return (
    <div className="grid grid-cols-[1fr_auto_1.2fr] items-center gap-3 p-5 sm:gap-5 sm:p-8">
      {/* notes */}
      <div className="space-y-2 border hairline bg-ink p-3 sm:p-4" aria-hidden>
        <div className="font-mono text-[0.5625rem] uppercase tracking-[0.14em] text-mute">notes.txt</div>
        {[92, 78, 100, 64, 86, 70, 50].map((w, i) => (
          <div key={i} className="h-1.5 rounded-full bg-paper/12" style={{ width: `${w}%` }} />
        ))}
      </div>

      <div className="flex flex-col items-center gap-2" aria-hidden>
        <span className="rounded-full border px-2.5 py-1 font-mono text-[0.5625rem] uppercase tracking-[0.12em]" style={{ borderColor: accent, color: accent }}>
          LLM
        </span>
        <svg width="40" height="10" viewBox="0 0 40 10"><path d="M0 5h36M31 1l5 4-5 4" fill="none" stroke="rgb(239 236 228 / .4)" /></svg>
      </div>

      {/* deck */}
      <button
        type="button"
        onClick={() => setFlipped((f) => !f)}
        className="relative h-36 w-full [perspective:900px] sm:h-44"
        aria-label={flipped ? "Show question side of example flashcard" : "Show answer side of example flashcard"}
      >
        {[2, 1].map((k) => (
          <div
            key={k}
            className="absolute inset-0 border hairline bg-ink-3"
            style={{ transform: `translate(${k * 7}px, ${-k * 7}px)`, opacity: 1 - k * 0.3 }}
          />
        ))}
        <motion.div
          className="absolute inset-0 [transform-style:preserve-3d]"
          animate={{ rotateY: flipped ? 180 : 0 }}
          transition={{ duration: reduce ? 0 : 0.7, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="absolute inset-0 flex flex-col justify-between border bg-ink p-4 text-left [backface-visibility:hidden]" style={{ borderColor: `${accent}66` }}>
            <span className="font-mono text-[0.5625rem] uppercase tracking-[0.14em]" style={{ color: accent }}>Q · 01 / 12</span>
            <span className="text-sm font-medium leading-snug text-paper sm:text-base">What does a Docker image contain?</span>
            <span className="font-mono text-[0.5625rem] uppercase tracking-[0.14em] text-mute">tap to flip</span>
          </div>
          <div className="absolute inset-0 flex flex-col justify-between border bg-ink p-4 text-left [backface-visibility:hidden] [transform:rotateY(180deg)]" style={{ borderColor: `${accent}66` }}>
            <span className="font-mono text-[0.5625rem] uppercase tracking-[0.14em]" style={{ color: accent }}>A · 01 / 12</span>
            <span className="text-[0.8125rem] leading-snug text-paper-dim">Your app plus everything it needs to run: code, runtime, libraries and config, stored as layers.</span>
            <span className="font-mono text-[0.5625rem] uppercase tracking-[0.14em] text-mute">example card</span>
          </div>
        </motion.div>
      </button>
    </div>
  );
}
