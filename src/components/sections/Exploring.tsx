"use client";

import { motion, useInView, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { exploring } from "@/content/site";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";

function Terminal() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "0px 0px -20% 0px" });
  const reduce = useReducedMotion();
  const [shown, setShown] = useState(0);
  const total = exploring.terminal.length;

  useEffect(() => {
    if (!inView) return;
    if (reduce) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- reveal all at once for reduced motion
      setShown(total);
      return;
    }
    const timers = exploring.terminal.map((_, i) => window.setTimeout(() => setShown(i + 1), 350 + i * 650));
    return () => timers.forEach(clearTimeout);
  }, [inView, reduce, total]);

  return (
    <div ref={ref} className="crop-marks overflow-hidden border hairline bg-[#0c0c0b] font-mono text-[0.75rem] leading-relaxed md:text-[0.8125rem]">
      <div className="flex items-center justify-between border-b hairline px-4 py-2.5 text-[0.625rem] uppercase tracking-[0.14em] text-mute">
        <span>~/launchflow (zsh)</span>
        <span>practice log</span>
      </div>
      <div className="min-h-[17rem] space-y-3 p-4 md:p-6" aria-label="Example deployment commands I'm practising">
        {exploring.terminal.slice(0, shown).map((l, i) => (
          <motion.div key={l.cmd} initial={{ opacity: 0, y: reduce ? 0 : 4 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
            <div className="flex gap-2 text-paper">
              <span className="text-acid">❯</span>
              <span className="break-all">{l.cmd}</span>
            </div>
            <div className={`pl-5 ${i === total - 1 ? "text-acid" : "text-mute"}`}>{l.out}</div>
          </motion.div>
        ))}
        <div className="flex gap-2 text-paper">
          <span className="text-acid">❯</span>
          <span className="inline-block h-4 w-2 translate-y-0.5 bg-paper/70 animate-blink" aria-hidden />
        </div>
      </div>
    </div>
  );
}

export function Exploring() {
  return (
    <section id="exploring" className="relative overflow-hidden border-t hairline py-28 md:py-40" aria-labelledby="exploring-title">
      <div className="pointer-events-none absolute -left-[20%] bottom-0 h-[50vmax] w-[50vmax] rounded-full bg-[radial-gradient(circle,rgb(200_241_53/0.05),transparent_60%)]" />
      <div className="container-x relative">
        <SectionHeading id="exploring-title" index="06" label="What I'm learning" title={exploring.headline} accent={[2]} />

        <div className="mt-20 grid gap-12 md:mt-28 lg:grid-cols-12 lg:gap-8">
          <div className="lg:col-span-5">
            <Reveal>
              <p className="text-lg leading-relaxed text-paper-dim md:text-xl">{exploring.body}</p>
            </Reveal>
            <Reveal delay={0.1} className="mt-10">
              <p className="label-mono">What I&apos;m following</p>
              <ul className="mt-4 flex flex-wrap gap-2">
                {exploring.resources.map((r) => (
                  <li key={r} className="rounded-full border border-dashed border-acid/40 px-3.5 py-1.5 text-[0.8125rem] text-paper-dim">
                    {r}
                  </li>
                ))}
              </ul>
            </Reveal>
          </div>
          <Reveal delay={0.1} className="lg:col-span-7">
            <Terminal />
          </Reveal>
        </div>

        <div className="mt-16 grid gap-px border hairline bg-line sm:grid-cols-2 lg:grid-cols-4">
          {exploring.tracks.map((t, i) => (
            <Reveal key={t.name} delay={i * 0.07} className="group bg-ink p-6 transition-colors duration-500 hover:bg-ink-2 md:p-8">
              <div className="flex items-center justify-between label-mono">
                <span>{t.tool}</span>
                <span className="text-acid opacity-60 transition-opacity group-hover:opacity-100">learning</span>
              </div>
              <h3 className="mt-10 text-2xl font-medium tracking-[-0.03em]">{t.name}</h3>
              <p className="mt-2 text-sm leading-relaxed text-mute">{t.detail}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
