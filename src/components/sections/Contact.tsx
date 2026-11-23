"use client";

import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { site } from "@/content/site";
import { Magnetic } from "@/components/ui/Magnetic";
import { Reveal } from "@/components/ui/Reveal";
import { SplitWords } from "@/components/ui/SplitWords";
import { useZonedTime } from "@/lib/hooks";

export function Contact() {
  const [copied, setCopied] = useState(false);
  const time = useZonedTime(site.timezone);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(site.email);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      window.location.href = `mailto:${site.email}`;
    }
  };

  const socials = [
    { label: "GitHub", href: site.github, handle: `@${site.githubHandle}` },
    { label: "LinkedIn", href: site.linkedin, handle: "in/faisal-imran" },
    { label: "Email", href: `mailto:${site.email}`, handle: site.email },
  ];

  return (
    <section id="contact" className="relative overflow-hidden border-t hairline pt-28 md:pt-40" aria-labelledby="contact-title">
      <div className="pointer-events-none absolute inset-0 blueprint-grid [mask-image:radial-gradient(ellipse_at_bottom,black,transparent_70%)]" />
      <div className="container-x relative">
        <Reveal className="flex items-center gap-3 label-mono">
          <span className="text-acid">07</span>
          <span className="h-px w-8 bg-line-strong" />
          <span>Contact</span>
        </Reveal>

        <SplitWords
          as="h2"
          id="contact-title"
          text="Got a project or a role? Let's talk."
          accent={[2]}
          breakAfter={[5]}
          className="mt-10 display-lg"
        />

        <div className="mt-16 grid gap-12 md:mt-24 lg:grid-cols-12 lg:gap-8">
          <Reveal className="lg:col-span-7">
            <p className="label-mono">Email me</p>
            <div className="mt-4 flex flex-wrap items-center gap-4">
              <Magnetic strength={0.15}>
                <a
                  href={`mailto:${site.email}`}
                  className="group relative inline-block break-all text-[clamp(1.35rem,3.6vw,3rem)] font-medium tracking-[-0.035em] text-paper"
                >
                  {site.email}
                  <span className="absolute -bottom-1 left-0 h-px w-full origin-left scale-x-100 bg-line-strong" />
                  <span className="absolute -bottom-1 left-0 h-px w-full origin-left scale-x-0 bg-acid transition-transform duration-700 ease-[var(--ease-out-expo)] group-hover:scale-x-100" />
                </a>
              </Magnetic>
              <button
                type="button"
                onClick={copy}
                className="relative rounded-full border border-line-strong px-4 py-2 font-mono text-[0.6875rem] uppercase tracking-[0.14em] text-paper-dim transition-colors hover:border-acid hover:text-acid"
                aria-label="Copy email address"
              >
                <AnimatePresence mode="wait" initial={false}>
                  <motion.span
                    key={copied ? "y" : "n"}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.2 }}
                    className="block"
                  >
                    {copied ? "Copied ✓" : "Copy"}
                  </motion.span>
                </AnimatePresence>
              </button>
              <span className="sr-only" aria-live="polite">{copied ? "Email copied to clipboard" : ""}</span>
            </div>
          </Reveal>

          <Reveal delay={0.1} className="lg:col-span-5">
            <ul className="border-t hairline">
              {socials.map((s) => (
                <li key={s.label} className="border-b hairline">
                  <a
                    href={s.href}
                    {...(s.href.startsWith("http") ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                    className="group flex items-center justify-between gap-4 py-5"
                  >
                    <span className="text-xl font-medium tracking-[-0.02em] transition-transform duration-500 group-hover:translate-x-2">{s.label}</span>
                    <span className="flex min-w-0 items-center gap-3">
                      <span className="truncate font-mono text-[0.6875rem] tracking-[0.06em] text-mute">{s.handle}</span>
                      <span aria-hidden className="text-mute transition-all duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-acid">↗</span>
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </Reveal>
        </div>

        {/* Final signature */}
        <div className="mt-28 border-t hairline pt-10 md:mt-40" aria-label="Build, Break, Learn, Ship.">
          <div className="grid grid-cols-2 gap-x-4 gap-y-2 md:grid-cols-4" aria-hidden>
            {site.tagline.map((t, i) => (
              <Reveal key={t} delay={i * 0.12} y={60}>
                <div className="flex items-baseline gap-3">
                  <span className="font-mono text-[0.6875rem] tracking-[0.14em] text-mute">0{i + 1}</span>
                  <span
                    className={`text-[clamp(2.75rem,8.5vw,9rem)] leading-[0.9] tracking-[-0.06em] ${
                      i === 1 ? "font-serif italic font-normal text-paper-dim" : i === 3 ? "font-semibold text-acid" : "font-semibold"
                    }`}
                  >
                    {t}
                    {i < 3 ? <span className="text-mute-2">.</span> : <span className="text-paper">.</span>}
                  </span>
                </div>
              </Reveal>
            ))}
          </div>
        </div>

        <footer className="mt-20 flex flex-col gap-4 border-t hairline py-8 label-mono md:flex-row md:items-center md:justify-between">
          <span>© 2026 {site.name}</span>
          <span suppressHydrationWarning>
            Local time in Faisalabad: <span className="tabular-nums text-paper-dim">{time || "--:--"}</span>
          </span>
          <span>Designed and built by me with Next.js and Three.js</span>
          <a href="#top" className="hover:text-paper">Back to top ↑</a>
        </footer>
      </div>
    </section>
  );
}
