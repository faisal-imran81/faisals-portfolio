"use client";

import { motion, useReducedMotion } from "motion/react";
import type { ElementType } from "react";

type Props = {
  text: string;
  as?: ElementType;
  className?: string;
  delay?: number;
  stagger?: number;
  /** animate on mount instead of on scroll into view */
  immediate?: boolean;
  /** externally controlled play state (overrides immediate / in-view) */
  play?: boolean;
  /** words (by index) to render in the serif italic accent */
  accent?: number[];
  id?: string;
};

/** Masked word-by-word rise. Each word slides up from behind a clip. */
export function SplitWords({ text, as: Tag = "span", className, delay = 0, stagger = 0.06, immediate, play, accent = [], id }: Props) {
  const reduce = useReducedMotion();
  const words = text.split(" ");
  const trigger =
    play !== undefined
      ? { animate: play ? "show" : "hidden" }
      : immediate
        ? { animate: "show" }
        : { whileInView: "show", viewport: { once: true, margin: "0px 0px -10% 0px" } };

  return (
    <Tag className={className} aria-label={text} id={id}>
      <motion.span
        aria-hidden
        className="inline"
        initial="hidden"
        {...trigger}
        transition={{ staggerChildren: reduce ? 0 : stagger, delayChildren: delay }}
      >
        {words.map((w, i) => (
          <span key={`${w}-${i}`} className="inline-block overflow-hidden pb-[0.2em] -mb-[0.2em] pr-[0.08em] -mr-[0.08em] align-bottom">
            <motion.span
              className={`inline-block will-change-transform ${accent.includes(i) ? "font-serif italic font-normal tracking-[-0.02em]" : ""}`}
              variants={{
                hidden: { y: reduce ? 0 : "105%", opacity: reduce ? 0 : 1 },
                show: { y: "0%", opacity: 1, transition: { duration: reduce ? 0.2 : 1, ease: [0.16, 1, 0.3, 1] } },
              }}
            >
              {w}
            </motion.span>
            {i < words.length - 1 ? " " : null}
          </span>
        ))}
      </motion.span>
    </Tag>
  );
}
