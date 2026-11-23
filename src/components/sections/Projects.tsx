"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useId, useState } from "react";
import { projects, type Project } from "@/content/site";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { StatusPill } from "@/components/ui/StatusPill";
import { TiltCard } from "@/components/ui/TiltCard";
import { ProjectViz } from "@/components/viz";

const ease = [0.16, 1, 0.3, 1] as const;

function Links({ p }: { p: Project }) {
  return (
    <div className="flex flex-wrap gap-x-6 gap-y-2">
      {p.live && (
        <a href={p.live} target="_blank" rel="noopener noreferrer" className="group inline-flex items-center gap-2 text-sm text-paper">
          <span className="border-b border-acid/60 pb-0.5 transition-colors group-hover:border-acid group-hover:text-acid">Live site</span>
          <span aria-hidden className="transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5">↗</span>
        </a>
      )}
      {p.source && (
        <a href={p.source} target="_blank" rel="noopener noreferrer" className="group inline-flex items-center gap-2 text-sm text-paper-dim">
          <span className="border-b border-line-strong pb-0.5 transition-colors group-hover:border-paper group-hover:text-paper">Source code</span>
          <span aria-hidden className="transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5">↗</span>
        </a>
      )}
    </div>
  );
}

function Stack({ items }: { items: string[] }) {
  return (
    <ul className="flex flex-wrap gap-1.5" aria-label="Technologies">
      {items.map((s) => (
        <li key={s} className="border hairline px-2 py-1 font-mono text-[0.625rem] uppercase tracking-[0.1em] text-paper-dim">
          {s}
        </li>
      ))}
    </ul>
  );
}

function Highlights({ items, accent }: { items: string[]; accent: string }) {
  return (
    <ul className="space-y-3">
      {items.map((h, i) => (
        <li key={h} className="grid grid-cols-[2rem_1fr] gap-2 text-[0.9375rem] leading-relaxed text-paper-dim">
          <span className="font-mono text-[0.6875rem] leading-[1.6rem]" style={{ color: accent }}>
            {String(i + 1).padStart(2, "0")}
          </span>
          <span>{h}</span>
        </li>
      ))}
    </ul>
  );
}

/* ───────────── Featured case study ───────────── */

function FeaturedProject({ p, flip }: { p: Project; flip?: boolean }) {
  const [open, setOpen] = useState(false);
  const reduce = useReducedMotion();
  const panelId = useId();

  return (
    <article id={`project-${p.id}`} className="relative scroll-mt-20 border-t hairline py-16 md:py-24" aria-labelledby={`${p.id}-title`}>
      <Reveal className="mb-8 flex flex-wrap items-center gap-x-5 gap-y-3 md:mb-12">
        <span className="font-mono text-[0.6875rem] tracking-[0.14em]" style={{ color: p.accent }}>
          {p.index}
        </span>
        <span className="label-mono">{p.kicker}</span>
        <StatusPill status={p.status} />
        <span className="ml-auto label-mono">{p.year}</span>
      </Reveal>

      <div className={`grid items-start gap-10 lg:grid-cols-12 lg:gap-8`}>
        <div className={`lg:col-span-5 ${flip ? "lg:order-2 lg:col-start-8" : ""}`}>
          <motion.h3
            id={`${p.id}-title`}
            className="text-[clamp(2.5rem,4.8vw,4.5rem)] font-semibold leading-[1] tracking-[-0.045em]"
            initial={{ opacity: 0, y: reduce ? 0 : 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "0px 0px -10% 0px" }}
            transition={{ duration: 1, ease }}
          >
            {p.name}
          </motion.h3>
          <Reveal delay={0.1}>
            <p className="mt-6 max-w-lg leading-relaxed text-paper-dim md:text-[1.0625rem]">{p.summary}</p>
          </Reveal>

          {p.metrics && (
            <Reveal delay={0.15}>
              <dl className={`mt-8 grid gap-px border hairline bg-line ${p.metrics.length === 3 ? "grid-cols-3" : "grid-cols-2 sm:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4"}`}>
                {p.metrics.map((m) => (
                  <div key={m.label} className="flex flex-col-reverse bg-ink px-4 py-4">
                    <dt className="mt-1 font-mono text-[0.5625rem] uppercase tracking-[0.12em] text-mute">{m.label}</dt>
                    <dd className="text-3xl font-semibold tracking-[-0.04em] tabular-nums">{m.value}</dd>
                  </div>
                ))}
              </dl>
            </Reveal>
          )}

          <Reveal delay={0.2} className="mt-8 flex flex-wrap items-center gap-x-8 gap-y-4">
            <button
              type="button"
              onClick={() => setOpen((o) => !o)}
              aria-expanded={open}
              aria-controls={panelId}
              className="group inline-flex items-center gap-3 rounded-full border border-line-strong px-5 py-2.5 text-sm transition-colors duration-300 hover:border-paper/50"
            >
              <span className="relative block size-3" aria-hidden>
                <span className="absolute left-0 top-1/2 h-px w-3 -translate-y-1/2 bg-paper" />
                <span className={`absolute left-1/2 top-0 h-3 w-px -translate-x-1/2 bg-paper transition-transform duration-500 ${open ? "scale-y-0" : ""}`} />
              </span>
              {open ? "Hide details" : "See details"}
            </button>
            <Links p={p} />
          </Reveal>
        </div>

        <Reveal delay={0.1} className={`lg:col-span-7 ${flip ? "lg:order-1 lg:col-start-1" : ""}`}>
          <TiltCard max={4}>
            <ProjectViz project={p} />
          </TiltCard>
        </Reveal>
      </div>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            id={panelId}
            key="panel"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: reduce ? 0 : 0.7, ease }}
            className="overflow-hidden"
          >
            <div className="mt-14 grid gap-10 border-t hairline pt-10 md:grid-cols-12 md:gap-6">
              <div className="md:col-span-3">
                <p className="label-mono">About this project</p>
                {p.context && <p className="mt-3 text-sm text-paper-dim">{p.context}</p>}
              </div>
              <div className="md:col-span-5">
                <p className="mb-5 label-mono">What I built</p>
                <Highlights items={p.highlights} accent={p.accent} />
              </div>
              <div className="md:col-span-4">
                <p className="mb-5 label-mono">Built with</p>
                <Stack items={p.stack} />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </article>
  );
}

/* ───────────── Index of other builds ───────────── */

function ProjectIndex({ items }: { items: Project[] }) {
  const [openId, setOpenId] = useState<string | null>(null);
  const reduce = useReducedMotion();

  // Open a row when something links to it (e.g. the capstone card in Experience).
  useEffect(() => {
    const sync = () => {
      const id = window.location.hash.replace("#project-", "");
      if (items.some((p) => p.id === id)) setOpenId(id);
    };
    sync();
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, [items]);

  return (
    <div className="border-t hairline">
      {items.map((p, i) => {
        const open = openId === p.id;
        return (
          <Reveal key={p.id} delay={i * 0.05}>
            <article id={`project-${p.id}`} className="scroll-mt-20 border-b hairline" aria-labelledby={`${p.id}-title`}>
              <h3 id={`${p.id}-title`}>
                <button
                  type="button"
                  onClick={() => setOpenId(open ? null : p.id)}
                  aria-expanded={open}
                  aria-controls={`${p.id}-panel`}
                  className="group relative grid w-full grid-cols-[2.5rem_1fr_auto] items-center gap-3 py-6 text-left md:grid-cols-12 md:gap-6 md:py-8"
                >
                  <span
                    aria-hidden
                    className="absolute inset-y-0 -left-[var(--gutter)] w-[2px] origin-top scale-y-0 transition-transform duration-500 group-hover:scale-y-100"
                    style={{ background: p.accent }}
                  />
                  <span className="font-mono text-[0.6875rem] tracking-[0.14em] text-mute md:col-span-1">{p.index}</span>
                  <span className="md:col-span-5">
                    <span
                      className={`block text-[clamp(1.5rem,3vw,2.5rem)] font-semibold leading-[1.05] tracking-[-0.035em] transition-[color,transform] duration-500 group-hover:translate-x-2 ${open ? "" : "text-paper"}`}
                      style={open ? { color: p.accent } : undefined}
                    >
                      {p.name}
                    </span>
                    <span className="mt-2 block text-sm font-normal text-mute md:hidden">{p.kicker}</span>
                  </span>
                  <span className="hidden text-sm font-normal text-mute md:col-span-3 md:block">{p.kicker}</span>
                  <span className="hidden md:col-span-2 md:block">
                    <StatusPill status={p.status} />
                  </span>
                  <span
                    aria-hidden
                    className={`flex size-9 items-center justify-center justify-self-end rounded-full border border-line-strong text-paper transition-transform duration-500 md:col-span-1 ${open ? "rotate-45 border-paper/50" : ""}`}
                  >
                    +
                  </span>
                </button>
              </h3>

              <AnimatePresence initial={false}>
                {open && (
                  <motion.div
                    id={`${p.id}-panel`}
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: reduce ? 0 : 0.65, ease }}
                    className="overflow-hidden"
                  >
                    <div className="grid gap-8 pb-10 md:grid-cols-12 md:gap-6">
                      <div className="md:col-span-5 md:col-start-2">
                        <div className="mb-5 md:hidden">
                          <StatusPill status={p.status} />
                        </div>
                        <p className="leading-relaxed text-paper-dim">{p.summary}</p>
                        <div className="mt-6">
                          <Highlights items={p.highlights} accent={p.accent} />
                        </div>
                        <div className="mt-6">
                          <Stack items={p.stack} />
                        </div>
                        <div className="mt-6">
                          <Links p={p} />
                        </div>
                      </div>
                      <motion.div
                        className="md:col-span-6"
                        initial={{ opacity: 0, y: reduce ? 0 : 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.15, duration: 0.7, ease }}
                      >
                        <ProjectViz project={p} />
                      </motion.div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </article>
          </Reveal>
        );
      })}
    </div>
  );
}

export function Projects() {
  const featured = projects.filter((p) => p.featured);
  const rest = projects.filter((p) => !p.featured);

  return (
    <section id="work" className="relative py-28 md:py-40" aria-labelledby="work-title">
      <div className="container-x">
        <SectionHeading
          id="work-title"
          index="03"
          label="Projects"
          title="Things I've built."
          accent={[2]}
          aside={
            <p>
              Every project here has its source code on GitHub. LaunchFlow is my final year project, and I&apos;m still working on it.
            </p>
          }
        />

        <div className="mt-20 md:mt-28">
          {featured.map((p, i) => (
            <FeaturedProject key={p.id} p={p} flip={i % 2 === 1} />
          ))}
        </div>

        <div className="mt-16 md:mt-24">
          <Reveal className="mb-8 flex items-end justify-between">
            <h3 className="text-2xl font-medium tracking-[-0.03em] md:text-3xl">Other projects</h3>
            <span className="label-mono">Tap a project to see more</span>
          </Reveal>
          <ProjectIndex items={rest} />
        </div>
      </div>
    </section>
  );
}
