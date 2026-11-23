"use client";

import { motion, useReducedMotion } from "motion/react";

const rows = [
  { cfg: "No aug", clean: 0.4395, shift: 0.2224 },
  { cfg: "Geometric", clean: 0.3867, shift: 0.2457 },
  { cfg: "Photometric", clean: 0.4397, shift: 0.2561 },
  { cfg: "Geo+Photo+Cutout", clean: 0.4076, shift: 0.2606 },
];

/** CIFAR-10: clean vs shifted accuracy per augmentation config (real results). */
export function CnnViz({ accent }: { accent: string }) {
  const reduce = useReducedMotion();
  return (
    <div className="p-5 sm:p-8">
      <div className="mb-4 flex gap-5 font-mono text-[0.5625rem] uppercase tracking-[0.14em] text-mute">
        <span className="flex items-center gap-1.5"><span className="h-1.5 w-3 bg-paper/25" />Clean test</span>
        <span className="flex items-center gap-1.5"><span className="h-1.5 w-3" style={{ background: accent }} />Shifted test</span>
      </div>
      <div className="space-y-3.5">
        {rows.map((r, i) => (
          <div key={r.cfg} className="grid grid-cols-[6.5rem_1fr] items-center gap-3 sm:grid-cols-[8.5rem_1fr]">
            <span className="truncate text-[0.75rem] text-paper-dim">{r.cfg}</span>
            <div className="space-y-1">
              {[{ v: r.clean, c: "rgb(239 236 228 / .25)" }, { v: r.shift, c: accent }].map((b, k) => (
                <div key={k} className="flex items-center gap-2">
                  <motion.div
                    className="h-1.5 origin-left"
                    style={{ width: `${(b.v / 0.5) * 100}%`, background: b.c }}
                    initial={{ scaleX: reduce ? 1 : 0 }}
                    whileInView={{ scaleX: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.08 + k * 0.05, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
                  />
                  <span className="font-mono text-[0.5625rem] tabular-nums text-mute">{b.v.toFixed(3)}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
