"use client";

import { motion, useReducedMotion } from "motion/react";
import { useState } from "react";
import { certification, education, mindset, site } from "@/content/site";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";

const facts = [
  { k: "Based", v: site.location },
  { k: "Studying", v: `${education.degree} at ${education.school}` },
  { k: "Timeline", v: `${education.start} to ${education.end}` },
  { k: "Status", v: education.status },
  { k: "Focus", v: "Web apps, now learning DevOps" },
  { k: "Certified", v: certification.title },
];

export function About() {
  const [active, setActive] = useState(0);
  const reduce = useReducedMotion();

  return (
    <section id="about" className="relative py-20 md:py-28" aria-labelledby="about-title">
      <div className="container-x">
        <SectionHeading id="about-title" index="01" label="About" title="I learn by building things." accent={[3]} />

        <div className="mt-12 grid gap-14 md:mt-16 md:grid-cols-12 md:gap-6">
          <div className="md:col-span-6 md:col-start-4">
            <Reveal>
              <p className="text-[1.375rem] leading-[1.45] tracking-[-0.015em] text-paper md:text-[1.625rem]">
                I got into tech out of curiosity. I started with Python, then C++ and Assembly at university, and
                later got interested in AI. These days I mostly build <span className="text-acid">web and mobile apps</span>{" "}
                with TypeScript, Next.js and React Native, usually with an AI feature somewhere inside. Lately I&apos;ve
                been learning what runs behind them: servers, containers and deployment.
              </p>
            </Reveal>
            <Reveal delay={0.1}>
              <p className="mt-8 max-w-xl leading-relaxed text-paper-dim">
                I like finishing projects properly. That means tests, a README someone else can follow, and a live link.
                A small app that works means more to me than a big idea that doesn&apos;t.
              </p>
            </Reveal>
            <Reveal delay={0.15}>
              <blockquote className="mt-12 border-l border-acid/60 pl-6 font-serif text-2xl italic leading-snug text-paper-dim md:text-3xl">
                “Every project I&apos;ve shipped taught me something a tutorial couldn&apos;t.”
              </blockquote>
            </Reveal>
          </div>

          <Reveal delay={0.2} className="md:col-span-3">
            <dl className="crop-marks border hairline bg-ink-2/60">
              <div className="border-b hairline px-4 py-3 label-mono">Quick facts</div>
              {facts.map((f) => (
                <div key={f.k} className="grid grid-cols-[5.5rem_1fr] gap-3 border-b hairline px-4 py-3 text-sm last:border-b-0">
                  <dt className="font-mono text-[0.6875rem] uppercase tracking-[0.12em] text-mute">{f.k}</dt>
                  <dd className="text-paper-dim">{f.v}</dd>
                </div>
              ))}
            </dl>
          </Reveal>
        </div>

        {/* ── Engineering mindset: the loop ── */}
        <div className="mt-14 md:mt-20">
          <Reveal className="mb-10 flex items-end justify-between gap-6">
            <div>
              <p className="label-mono">How I work</p>
              <h3 className="mt-3 max-w-lg text-2xl font-medium tracking-[-0.03em] md:text-3xl">
                The same four steps, every project.
              </h3>
            </div>
            <p className="hidden max-w-xs text-right text-sm text-mute md:block">
              Once something ships, I usually start building the next version of it.
            </p>
          </Reveal>

          <div className="relative grid border-t hairline md:grid-cols-4" role="list">
            {mindset.map((m, i) => {
              const on = active === i;
              return (
                <Reveal key={m.step} delay={i * 0.08} role="listitem">
                  <button
                    type="button"
                    onMouseEnter={() => setActive(i)}
                    onFocus={() => setActive(i)}
                    onClick={() => setActive(i)}
                    aria-pressed={on}
                    className={`group relative flex h-full w-full flex-col items-start border-b hairline p-6 text-left transition-colors duration-500 md:min-h-[22rem] md:border-b-0 md:border-r md:p-8 ${i === 3 ? "md:border-r-0" : ""} ${on ? "bg-ink-2" : "hover:bg-ink-2/50"}`}
                  >
                    {on && (
                      <motion.span
                        layoutId={reduce ? undefined : "mindset-bar"}
                        className="absolute inset-x-0 top-0 h-px bg-acid"
                        transition={{ type: "spring", stiffness: 300, damping: 34 }}
                      />
                    )}
                    <span
                      className={`mt-0 text-5xl tracking-[-0.05em] transition-colors duration-500 md:mt-auto md:text-6xl ${i === 1 ? "font-serif italic" : "font-semibold"} ${on ? (i === 3 ? "text-acid" : "text-paper") : "text-paper-dim"}`}
                    >
                      {m.step}
                    </span>
                    <span className="mt-4 text-[0.9375rem] font-medium text-paper">{m.line}</span>
                    <span className={`mt-2 text-sm leading-relaxed transition-colors duration-500 ${on ? "text-paper-dim" : "text-mute"}`}>
                      {m.body}
                    </span>
                    {i < 3 && (
                      <span aria-hidden className="absolute right-6 top-6 text-mute-2 md:right-8 md:top-8">→</span>
                    )}
                    {i === 3 && (
                      <span aria-hidden className="absolute right-6 top-6 font-mono text-[0.625rem] uppercase tracking-[0.14em] text-acid md:right-8 md:top-8">
                        ↺ repeat
                      </span>
                    )}
                  </button>
                </Reveal>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
