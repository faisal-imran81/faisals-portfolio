"use client";

import { motion, useReducedMotion } from "motion/react";
import { internship } from "@/content/site";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";

export function Experience() {
  const reduce = useReducedMotion();

  return (
    <section id="experience" className="relative border-t hairline bg-ink-2/40 py-28 md:py-40" aria-labelledby="experience-title">
      <div className="container-x">
        <SectionHeading id="experience-title" index="04" label="Experience" title="My internship at FlyRank." accent={[1]} />

        <div className="mt-20 grid gap-12 md:mt-28 lg:grid-cols-12 lg:gap-8">
          {/* Identity card */}
          <Reveal className="lg:col-span-5">
            <div className="crop-marks relative border hairline bg-ink p-6 md:p-10">
              <div className="flex items-center justify-between label-mono">
                <span>Internship</span>
                <span className="text-paper-dim">
                  Jun to Aug 2026
                </span>
              </div>
              <h3 className="mt-12 text-[clamp(2.25rem,4vw,3.5rem)] font-semibold leading-[1.02] tracking-[-0.04em]">
                {internship.company}
              </h3>
              <p className="mt-4 text-lg text-paper">
                {internship.role}
                <span className="text-mute">, {internship.track} track</span>
              </p>

              {/* three-month timeline */}
              <div className="mt-12">
                <div className="grid grid-cols-3 gap-1">
                  {internship.months.map((m, i) => (
                    <div key={m}>
                      <div className="h-1 overflow-hidden bg-line">
                        <motion.div
                          className="h-full origin-left bg-acid"
                          initial={{ scaleX: reduce ? 1 : 0 }}
                          whileInView={{ scaleX: 1 }}
                          viewport={{ once: true }}
                          transition={{ delay: 0.3 + i * 0.35, duration: 0.6, ease: "easeInOut" }}
                        />
                      </div>
                      <span className="mt-2 block font-mono text-[0.625rem] uppercase tracking-[0.14em] text-mute">{m} 2026</span>
                    </div>
                  ))}
                </div>
              </div>
              <p className="mt-10 leading-relaxed text-paper-dim">{internship.summary}</p>
            </div>
          </Reveal>

          {/* Work breakdown */}
          <div className="lg:col-span-7">
            <div className="grid gap-px border hairline bg-line sm:grid-cols-2">
              {internship.work.map((w, wi) => (
                <Reveal key={w.area} delay={0.1 + wi * 0.1} className="bg-ink p-6 md:p-8">
                  <p className="label-mono">
                    <span className="text-acid">0{wi + 1}</span> {w.area}
                  </p>
                  <ul className="mt-8 space-y-5">
                    {w.items.map((it) => (
                      <li key={it} className="flex gap-3 text-[1.0625rem] leading-snug tracking-[-0.01em] text-paper">
                        <span className="mt-[0.6em] h-px w-3 shrink-0 bg-acid" aria-hidden />
                        {it}
                      </li>
                    ))}
                  </ul>
                </Reveal>
              ))}
            </div>

          </div>
        </div>
      </div>
    </section>
  );
}
