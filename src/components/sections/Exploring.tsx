"use client";

import { exploring } from "@/content/site";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";

export function Exploring() {
  return (
    <section id="exploring" className="relative overflow-hidden border-t hairline py-20 md:py-28" aria-labelledby="exploring-title">
      <div className="pointer-events-none absolute -left-[20%] bottom-0 h-[50vmax] w-[50vmax] rounded-full bg-[radial-gradient(circle,rgb(200_241_53/0.05),transparent_60%)]" />
      <div className="container-x relative">
        <SectionHeading id="exploring-title" index="06" label="What I'm learning" title={exploring.headline} accent={[3]} />

        <div className="mt-14 grid gap-12 md:mt-20 lg:grid-cols-12 lg:gap-8">
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
            <div className="grid gap-px border hairline bg-line sm:grid-cols-[1.4fr_1fr]">
              <div className="bg-ink p-6 md:p-8">
                <p className="label-mono">Done so far, in LaunchFlow</p>
                <ul className="mt-6 space-y-4">
                  {exploring.done.map((d) => (
                    <li key={d} className="flex gap-3 leading-snug text-paper">
                      <span className="mt-[0.6em] h-px w-3 shrink-0 bg-acid" aria-hidden />
                      {d}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="bg-ink p-6 md:p-8">
                <p className="label-mono">Learning next</p>
                <ul className="mt-6 space-y-4">
                  {exploring.next.map((n) => (
                    <li key={n} className="flex gap-3 leading-snug text-paper-dim">
                      <span className="mt-[0.45em] size-2 shrink-0 rounded-full border border-dashed border-acid/70" aria-hidden />
                      {n}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
