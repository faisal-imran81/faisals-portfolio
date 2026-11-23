"use client";

import { motion, useReducedMotion } from "motion/react";

const days = ["M", "T", "W", "T", "F", "S", "S"];
const moods = [3, 2, 3, 4, 3, 4, 5]; // illustrative

/** Solace: a 7-day mood chart alongside a token-streamed reply. */
export function WellnessViz({ accent }: { accent: string }) {
  const reduce = useReducedMotion();
  const reply = "That sounds like a heavy week. Want to try a 4-7-8 breath together first?".split(" ");
  return (
    <div className="grid gap-6 p-5 sm:grid-cols-2 sm:p-8">
      <div>
        <div className="mb-4 font-mono text-[0.5625rem] uppercase tracking-[0.14em] text-mute">Mood over 7 days (example)</div>
        <div className="flex h-32 items-end gap-2" aria-hidden>
          {moods.map((m, i) => (
            <div key={i} className="flex h-full flex-1 flex-col items-center justify-end gap-2">
              <motion.div
                className="w-full origin-bottom rounded-t-sm"
                style={{ height: `${m * 20}%`, background: i === 6 ? accent : "rgb(239 236 228 / .14)" }}
                initial={{ scaleY: reduce ? 1 : 0 }}
                whileInView={{ scaleY: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              />
              <span className="font-mono text-[0.5625rem] text-mute">{days[i]}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="flex flex-col justify-end gap-3">
        <div className="ml-auto max-w-[85%] rounded-lg rounded-br-sm bg-paper/8 px-3 py-2 text-[0.8125rem] text-paper-dim">Rough day honestly.</div>
        <div className="max-w-[92%] rounded-lg rounded-bl-sm border px-3 py-2 text-[0.8125rem] leading-snug text-paper" style={{ borderColor: `${accent}55` }}>
          {reply.map((w, i) => (
            <motion.span
              key={i}
              initial={{ opacity: reduce ? 1 : 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4 + i * 0.07, duration: 0.2 }}
            >
              {w}{" "}
            </motion.span>
          ))}
        </div>
        <div className="font-mono text-[0.5625rem] uppercase tracking-[0.14em]" style={{ color: accent }}>● streaming over SSE</div>
      </div>
    </div>
  );
}
