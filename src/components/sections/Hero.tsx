"use client";

import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import { useRef } from "react";
import { site } from "@/content/site";
import { useIntro } from "@/lib/intro";
import { HeroVisual } from "@/components/three/HeroVisual";
import { SplitWords } from "@/components/ui/SplitWords";
import { Button } from "@/components/ui/Button";
import { Motif } from "@/components/ui/Motif";

const ease = [0.16, 1, 0.3, 1] as const;

export function Hero() {
  const { done } = useIntro();
  const reduce = useReducedMotion();
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const textY = useTransform(scrollYProgress, [0, 1], ["0%", reduce ? "0%" : "18%"]);
  const visualY = useTransform(scrollYProgress, [0, 1], ["0%", reduce ? "0%" : "-8%"]);
  const fade = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  const fadeUp = (delay: number) => ({
    initial: { opacity: 0, y: reduce ? 0 : 18 },
    animate: done ? { opacity: 1, y: 0 } : undefined,
    transition: { duration: 0.9, delay, ease },
  });

  return (
    <section
      id="top"
      ref={ref}
      className="relative flex min-h-[100svh] flex-col overflow-hidden pt-[var(--nav-h)]"
      aria-labelledby="hero-title"
    >
      {/* backdrop */}
      <div className="pointer-events-none absolute inset-0 blueprint-grid [mask-image:linear-gradient(to_bottom,black,transparent_92%)]" />
      <div className="pointer-events-none absolute right-[-10%] top-[10%] h-[60vmax] w-[60vmax] rounded-full bg-[radial-gradient(circle,rgb(200_241_53/0.07),transparent_60%)]" />

      <div className="container-x relative grid flex-1 grid-cols-1 items-center gap-y-6 py-8 lg:grid-cols-12 lg:gap-x-8 lg:py-0">
        {/* ── Copy ── */}
        <motion.div style={{ y: textY, opacity: fade }} className="relative z-10 order-2 lg:order-1 lg:col-span-6 xl:col-span-6">
          <motion.div {...fadeUp(0.05)} className="mb-6 flex items-center gap-3 label-mono">
            <span className="size-1.5 rounded-full bg-acid animate-pulse-dot" aria-hidden />
            <span>{site.location}</span>
          </motion.div>

          <motion.h1 id="hero-title" {...fadeUp(0.1)} className="mb-5 flex flex-wrap items-baseline gap-x-1.5 text-[1.0625rem] tracking-[-0.01em] text-paper-dim">
            <span className="font-medium text-paper">{site.name},</span>
            <span>{site.role}</span>
          </motion.h1>

          <SplitWords
            as="p"
            text={site.headline}
            play={done}
            delay={0.15}
            stagger={0.08}
            accent={[6]}
            className="text-[clamp(3rem,7.4vw,8.5rem)] font-semibold leading-[0.88] tracking-[-0.055em] text-balance"
          />

          <motion.p {...fadeUp(0.55)} className="mt-8 max-w-[34rem] text-[1.0625rem] leading-relaxed text-paper-dim md:text-lg">
            {site.intro}
          </motion.p>

          <motion.div {...fadeUp(0.7)} className="mt-10 flex flex-wrap items-center gap-3">
            <Button href="#work">Explore projects</Button>
            <Button href="#contact" variant="ghost">
              Contact
            </Button>
          </motion.div>
        </motion.div>

        {/* ── 3D identity ── */}
        <motion.div
          style={{ y: visualY }}
          className="relative order-1 mx-auto w-full max-w-[min(88vw,440px)] lg:order-2 lg:col-span-6 lg:max-w-none xl:col-span-6"
          initial={{ opacity: 0, scale: reduce ? 1 : 0.96 }}
          animate={done ? { opacity: 1, scale: 1 } : undefined}
          transition={{ duration: 1.4, ease }}
        >
          <HeroVisual start={done} />
        </motion.div>
      </div>

      {/* ── Bottom rail ── */}
      <motion.div {...fadeUp(0.9)} className="container-x relative z-10 pb-6">
        <div className="flex flex-col gap-4 border-t hairline pt-5 sm:flex-row sm:items-center sm:justify-between">
          <ul className="flex flex-wrap gap-x-5 gap-y-1 label-mono">
            <li>Software Engineer</li>
            <li>CS Major at FAST</li>
            <li className="text-paper-dim">DevOps Enthusiast</li>
          </ul>
          <Motif />
          <a href="#about" className="group hidden items-center gap-3 label-mono hover:text-paper md:flex" aria-label="Scroll to About">
            Scroll
            <span className="relative block h-8 w-px overflow-hidden bg-line-strong">
              <span className="absolute inset-x-0 top-0 h-3 bg-acid motion-safe:animate-[scrollcue_1.8s_var(--ease-out-expo)_infinite]" />
            </span>
          </a>
        </div>
      </motion.div>
    </section>
  );
}
