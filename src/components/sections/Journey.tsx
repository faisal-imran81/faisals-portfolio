"use client";

import { motion, useReducedMotion, useScroll, useSpring } from "motion/react";
import { useRef } from "react";
import { journey } from "@/content/site";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";

const tagStyle: Record<string, string> = {
  Build: "text-paper border-line-strong",
  Break: "text-paper border-line-strong font-serif italic normal-case tracking-normal text-[0.8125rem]",
  Learn: "text-paper-dim border-line-strong",
  Ship: "text-acid border-acid/40",
};

export function Journey() {
  const ref = useRef<HTMLOListElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 70%", "end 60%"] });
  const line = useSpring(scrollYProgress, { stiffness: 120, damping: 30 });

  return (
    <section id="journey" className="relative border-t hairline py-28 md:py-40" aria-labelledby="journey-title">
      <div className="container-x">
        <SectionHeading id="journey-title" index="05" label="Journey" title="How I got here." accent={[3]} />

        <ol ref={ref} className="relative mt-20 md:mt-28">
          {/* spine */}
          <div className="absolute bottom-0 left-[7px] top-0 w-px bg-line md:left-1/2" aria-hidden />
          <motion.div
            className="absolute left-[7px] top-0 h-full w-px origin-top bg-acid md:left-1/2"
            style={{ scaleY: reduce ? 1 : line }}
            aria-hidden
          />

          {journey.map((j, i) => {
            const right = i % 2 === 1;
            return (
              <li key={j.title} className="relative grid pb-14 pl-10 last:pb-0 md:grid-cols-2 md:gap-16 md:pl-0">
                <span
                  aria-hidden
                  className={`absolute left-0 top-1.5 size-[15px] rounded-full border md:left-1/2 md:-translate-x-1/2 ${j.future ? "border-dashed border-mute bg-ink" : "border-acid/60 bg-ink"}`}
                >
                  {!j.future && <span className="absolute inset-[4px] rounded-full bg-acid" />}
                </span>
                <Reveal
                  delay={0.05}
                  className={`${right ? "md:col-start-2" : "md:col-start-1 md:text-right"}`}
                >
                  <div className={`flex flex-wrap items-center gap-3 ${right ? "" : "md:justify-end"}`}>
                    <span className="font-mono text-[0.6875rem] uppercase tracking-[0.14em] text-mute">{j.date}</span>
                    <span className={`rounded-full border px-2 py-0.5 font-mono text-[0.5625rem] uppercase tracking-[0.14em] ${tagStyle[j.tag]}`}>
                      {j.tag}
                    </span>
                  </div>
                  <h3 className={`mt-3 text-xl font-medium tracking-[-0.02em] md:text-2xl ${j.future ? "text-paper-dim" : "text-paper"}`}>
                    {j.title}
                  </h3>
                  <p className={`mt-2 max-w-md text-[0.9375rem] leading-relaxed text-mute ${right ? "" : "md:ml-auto"}`}>{j.body}</p>
                </Reveal>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
