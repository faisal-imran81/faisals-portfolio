"use client";

import { AnimatePresence, motion, useMotionValueEvent, useScroll, useSpring } from "motion/react";
import { useEffect, useState } from "react";
import { navItems, site } from "@/content/site";

function Mark() {
  return (
    <svg viewBox="0 0 64 64" className="size-7" aria-hidden>
      <path d="M15 15h22v6H21v7h13v6H21v15h-6z" fill="currentColor" />
      <path d="M41 23h6v26h-6z" fill="currentColor" />
      <circle cx="44" cy="17" r="3.4" fill="#c8f135" />
    </svg>
  );
}

export function Nav() {
  const [active, setActive] = useState<string>("");
  const [hidden, setHidden] = useState(false);
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { scrollY, scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, { stiffness: 140, damping: 30, mass: 0.3 });

  useMotionValueEvent(scrollY, "change", (y) => {
    const prev = scrollY.getPrevious() ?? 0;
    setScrolled(y > 40);
    setHidden(y > 600 && y > prev && !open);
  });

  // Active section tracking
  useEffect(() => {
    const els = navItems.map((n) => document.getElementById(n.id)).filter(Boolean) as HTMLElement[];
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) setActive(e.target.id);
        });
      },
      { rootMargin: "-45% 0px -50% 0px" },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  // Lock scroll + close on Escape while the mobile menu is open
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <>
      <motion.header
        className={`fixed inset-x-0 top-0 z-50 transition-colors duration-500 ${scrolled || open ? "bg-ink/80 backdrop-blur-md" : "bg-transparent"}`}
        animate={{ y: hidden ? "-100%" : "0%" }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      >
        <nav className="container-x flex h-[var(--nav-h)] items-center justify-between gap-6" aria-label="Primary">
          <a href="#top" className="flex items-center gap-3 text-paper" aria-label="Faisal Imran, back to top">
            <Mark />
            <span className="hidden font-mono text-[0.6875rem] uppercase tracking-[0.16em] text-paper-dim sm:inline">
              Faisal Imran
            </span>
          </a>

          <ul className="hidden items-center gap-1 lg:flex">
            {navItems.map((n) => (
              <li key={n.id}>
                <a
                  href={`#${n.id}`}
                  className={`relative block px-3 py-2 text-[0.8125rem] transition-colors duration-300 ${active === n.id ? "text-paper" : "text-mute hover:text-paper"}`}
                  aria-current={active === n.id ? "location" : undefined}
                >
                  {active === n.id && (
                    <motion.span
                      layoutId="nav-indicator"
                      className="absolute inset-x-3 -bottom-0.5 h-px bg-acid"
                      transition={{ type: "spring", stiffness: 380, damping: 32 }}
                    />
                  )}
                  {n.label}
                </a>
              </li>
            ))}
          </ul>

          <div className="flex items-center gap-4">
            <a
              href={`mailto:${site.email}`}
              className="hidden rounded-full border border-line-strong px-4 py-2 text-[0.8125rem] text-paper transition-colors hover:border-acid hover:text-acid sm:inline-block"
            >
              Get in touch
            </a>
            <button
              type="button"
              className="relative flex size-10 items-center justify-center rounded-full border border-line-strong lg:hidden"
              aria-expanded={open}
              aria-controls="mobile-menu"
              aria-label={open ? "Close menu" : "Open menu"}
              onClick={() => setOpen((o) => !o)}
            >
              <span className={`absolute h-px w-4 bg-paper transition-transform duration-300 ${open ? "rotate-45" : "-translate-y-[3px]"}`} />
              <span className={`absolute h-px w-4 bg-paper transition-transform duration-300 ${open ? "-rotate-45" : "translate-y-[3px]"}`} />
            </button>
          </div>
        </nav>
        <motion.div className="h-px origin-left bg-acid/70" style={{ scaleX: progress }} />
      </motion.header>

      <AnimatePresence>
        {open && (
          <motion.div
            id="mobile-menu"
            className="fixed inset-0 z-40 flex flex-col bg-ink pt-[calc(var(--nav-h)+1rem)] lg:hidden"
            initial={{ clipPath: "inset(0 0 100% 0)" }}
            animate={{ clipPath: "inset(0 0 0% 0)" }}
            exit={{ clipPath: "inset(0 0 100% 0)" }}
            transition={{ duration: 0.6, ease: [0.76, 0, 0.24, 1] }}
          >
            <div className="pointer-events-none absolute inset-0 blueprint-grid opacity-50" />
            <ul className="container-x relative flex flex-1 flex-col justify-center gap-1">
              {navItems.map((n, i) => (
                <motion.li
                  key={n.id}
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 + i * 0.05, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                >
                  <a
                    href={`#${n.id}`}
                    onClick={(e) => {
                      e.preventDefault();
                      setOpen(false);
                      window.setTimeout(() => {
                        document.getElementById(n.id)?.scrollIntoView({ behavior: "smooth" });
                        history.replaceState(null, "", `#${n.id}`);
                      }, 60);
                    }}
                    className="flex items-baseline gap-4 border-b hairline py-3 text-[2.25rem] font-semibold tracking-[-0.04em]"
                  >
                    <span className="font-mono text-xs font-normal tracking-[0.14em] text-acid">0{i + 1}</span>
                    <span className={active === n.id ? "text-acid" : "text-paper"}>{n.label}</span>
                  </a>
                </motion.li>
              ))}
            </ul>
            <div className="container-x relative flex items-center justify-between pb-8 pt-6 label-mono">
              <a href={site.github} target="_blank" rel="noopener noreferrer" className="hover:text-paper">GitHub ↗</a>
              <a href={site.linkedin} target="_blank" rel="noopener noreferrer" className="hover:text-paper">LinkedIn ↗</a>
              <a href={`mailto:${site.email}`} className="hover:text-paper">Email ↗</a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
