"use client";

import { useState } from "react";
import { arsenal } from "@/content/site";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";

export function Arsenal() {
  const [hover, setHover] = useState<string | null>(null);
  const core = arsenal[0];
  const rest = arsenal.slice(1);

  return (
    <section id="arsenal" className="relative border-t hairline py-28 md:py-40" aria-labelledby="arsenal-title">
      <div className="pointer-events-none absolute inset-0 blueprint-grid opacity-40 [mask-image:radial-gradient(ellipse_at_top,black,transparent_70%)]" />
      <div className="container-x relative">
        <SectionHeading
          id="arsenal-title"
          index="02"
          label="Skills"
          title="What I use, and what I'm still learning."
          accent={[7]}
        />

        {/* Core — the three headline skills */}
        <div className="mt-20 grid gap-px overflow-hidden border hairline bg-line md:mt-28 md:grid-cols-3">
          {core.items.slice(0, 3).map((s, i) => (
            <Reveal key={s.name} delay={i * 0.08} className="bg-ink">
              <div className="group relative flex h-full flex-col justify-between gap-16 p-6 transition-colors duration-500 hover:bg-ink-2 md:p-8">
                <div className="flex items-center justify-between label-mono">
                  <span>Top skill 0{i + 1}</span>
                  <span className="text-acid opacity-0 transition-opacity duration-500 group-hover:opacity-100">●</span>
                </div>
                <span className="text-[clamp(2.75rem,5vw,4.75rem)] font-semibold leading-none tracking-[-0.05em] transition-colors duration-500 group-hover:text-acid">
                  {s.name}
                </span>
              </div>
            </Reveal>
          ))}
        </div>

        {/* Everything else — spec rows */}
        <div className="mt-16 border-t hairline" onMouseLeave={() => setHover(null)}>
          {rest.map((g, gi) => {
            const dim = hover !== null && hover !== g.id;
            return (
              <Reveal key={g.id} delay={gi * 0.04}>
                <div
                  onMouseEnter={() => setHover(g.id)}
                  className={`grid gap-4 border-b hairline py-6 transition-opacity duration-500 md:grid-cols-12 md:gap-6 md:py-8 ${dim ? "opacity-35" : "opacity-100"}`}
                >
                  <div className="flex items-baseline gap-4 md:col-span-3">
                    <span className="font-mono text-[0.6875rem] tracking-[0.14em] text-mute">{String(gi + 2).padStart(2, "0")}</span>
                    <h3 className="text-2xl font-medium tracking-[-0.03em]">{g.label}</h3>
                  </div>
                  <p className="text-sm text-mute md:col-span-3 md:pt-1.5">{g.note}</p>
                  <ul className="flex flex-wrap gap-2 md:col-span-6">
                    {g.items.map((it) => (
                      <li
                        key={it.name}
                        className={`rounded-full border px-3.5 py-1.5 text-[0.8125rem] transition-colors duration-300 ${
                          it.level === "learning"
                            ? "border-dashed border-acid/40 text-paper-dim hover:border-acid hover:text-acid"
                            : "border-line-strong text-paper-dim hover:border-paper/40 hover:text-paper"
                        }`}
                      >
                        {it.name}
                      </li>
                    ))}
                  </ul>
                </div>
              </Reveal>
            );
          })}
        </div>

        <Reveal className="mt-6 flex flex-wrap items-center gap-6 label-mono">
          <span className="flex items-center gap-2">
            <span className="h-3 w-5 rounded-full border border-line-strong" /> Used in my projects or coursework
          </span>
          <span className="flex items-center gap-2">
            <span className="h-3 w-5 rounded-full border border-dashed border-acid/60" /> Still learning
          </span>
        </Reveal>
      </div>
    </section>
  );
}
