"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { site } from "@/content/site";
import { useIntro } from "@/lib/intro";

const KEY = "fi-intro-seen";

/**
 * Cinematic opener: cycles the Build → Break → Learn → Ship loop, then lifts away.
 * Plays once per session; skipped instantly for reduced motion.
 * A CSS fail-safe removes it even if JS never hydrates.
 */
export function Intro() {
  const { finish } = useIntro();
  const [step, setStep] = useState(-1);
  const [open, setOpen] = useState(true);
  const seenRef = useRef<boolean | null>(null);

  useEffect(() => {
    if (seenRef.current === null) {
      let seen = false;
      try {
        seen = sessionStorage.getItem(KEY) === "1";
        sessionStorage.setItem(KEY, "1");
      } catch {
        /* storage unavailable — just play */
      }
      seenRef.current = seen;
    }
    const seen = seenRef.current;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const timers: number[] = [];
    if (seen || reduce) {
      timers.push(window.setTimeout(() => setOpen(false), 50));
      timers.push(window.setTimeout(finish, 150));
    } else {
      site.tagline.forEach((_, i) => timers.push(window.setTimeout(() => setStep(i), 120 + i * 300)));
      timers.push(window.setTimeout(() => setOpen(false), 1500));
      timers.push(window.setTimeout(finish, 1750));
    }
    return () => timers.forEach(clearTimeout);
  }, [finish]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="intro"
          className="intro-failsafe fixed inset-0 z-[80] flex flex-col justify-between bg-ink p-[var(--gutter)]"
          exit={{ clipPath: "inset(0 0 100% 0)" }}
          initial={{ clipPath: "inset(0 0 0% 0)" }}
          transition={{ duration: 0.9, ease: [0.76, 0, 0.24, 1] }}
          aria-hidden
        >
          <div className="flex justify-between label-mono">
            <span>Faisal Imran</span>
            <span>Portfolio 2026</span>
          </div>
          <div className="flex items-end justify-between gap-6">
            <div className="relative h-[clamp(2.75rem,7.5vw,6.5rem)] overflow-hidden">
              <AnimatePresence mode="popLayout">
                {step >= 0 && (
                  <motion.span
                    key={step}
                    className={`block display-xl ${step === 3 ? "text-acid" : step === 1 ? "font-serif italic font-normal" : ""}`}
                    initial={{ y: "100%" }}
                    animate={{ y: "0%" }}
                    exit={{ y: "-100%" }}
                    transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                  >
                    {site.tagline[step]}
                  </motion.span>
                )}
              </AnimatePresence>
            </div>
            <span className="label-mono tabular-nums">0{Math.max(step + 1, 0)} / 04</span>
          </div>
          <div className="h-px w-full bg-line">
            <motion.div
              className="h-px origin-left bg-acid"
              initial={{ scaleX: 0 }}
              animate={{ scaleX: (step + 1) / 4 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
