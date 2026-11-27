"use client";

import dynamic from "next/dynamic";
import { AnimatePresence, animate, motion, useMotionValue, useTransform } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { site } from "@/content/site";
import { useIntro } from "@/lib/intro";
import { FALLBACK_SHIFT, T } from "@/components/intro/timeline";

// three + r3f + the procedural samurai: its own chunk, client only, fetched only when the intro will play.
const SamuraiScene = dynamic(() => import("@/components/intro/SamuraiScene"), { ssr: false });

const KEY = "fi-intro-seen";
const ROLE = ["Software Engineer", "CS Major @ FAST", "DevOps Enthusiast"];
const NAME = site.name.toUpperCase().split(" ");
const ease = [0.16, 1, 0.3, 1] as const;
/** If the 3D chunk hasn't drawn a frame by now, play the CSS-only cut instead of making people wait. */
const SCENE_TIMEOUT = 4000;

type Mode = "pending" | "cinema" | "fallback" | "reduced";

/**
 * Cinematic opener: a procedural ronin walks out of the dark, draws, and cuts the
 * screen open along the slash to reveal the name, then lifts into the homepage.
 * Once per session · skippable · reduced-motion and no-WebGL get a fast reveal.
 */
export function Intro() {
  const { finish } = useIntro();
  const [mode, setMode] = useState<Mode>("pending");
  const [open, setOpen] = useState(true);
  const [go, setGo] = useState(false);
  const [fast, setFast] = useState(false);
  const [scene, setScene] = useState(false);
  const [view, setView] = useState({ lite: false, portrait: false, freezeAt: undefined as number | undefined });
  const timers = useRef<number[]>([]);
  const ready = useRef(false);
  const seenRef = useRef<boolean | null>(null);
  const split = useMotionValue(0);
  const clip = useTransform(split, (d) => {
    // two triangles separating along the top-left → bottom-right cut
    const a = `${d}% ${-d}%`, b = `${100 + d}% ${-d}%`, c = `${100 + d}% ${100 - d}%`;
    const e = `${-d}% ${d}%`, f = `${-d}% ${100 + d}%`, g = `${100 - d}% ${100 + d}%`;
    return `polygon(${a}, ${b}, ${c}, ${a}, ${e}, ${f}, ${g}, ${e})`;
  });

  const later = (fn: () => void, s: number) => timers.current.push(window.setTimeout(fn, Math.max(0, s * 1000)));

  const close = useCallback(() => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    setFast(true);
    setOpen(false);
    setScene(false);
    window.setTimeout(finish, 120);
  }, [finish]);

  // Runs the shared timeline. `shift` pulls the cut forward when there's no 3D scene.
  const run = useCallback(
    (shift: number, hold: boolean) => {
      setGo(true);
      animate(split, 72, { delay: T.split - shift, duration: T.splitEnd - T.split, ease: [0.7, 0, 0.2, 1] });
      later(() => setScene(false), T.splitEnd + 0.1 - shift); // free the GPU as soon as the cut has opened
      if (hold) return;
      later(() => setOpen(false), T.exit - shift);
      later(finish, T.exit + 0.1 - shift);
    },
    [finish, split],
  );

  useEffect(() => {
    const dev = process.env.NODE_ENV === "development";
    const params = new URLSearchParams(window.location.search);
    const freeze = dev && params.has("introT") ? Number(params.get("introT")) : undefined;
    // Read + mark once per mount (StrictMode re-runs effects; the second pass must not count as "seen").
    if (seenRef.current === null) {
      let seen = false;
      try {
        seen = sessionStorage.getItem(KEY) === "1";
        sessionStorage.setItem(KEY, "1");
      } catch {
        /* storage unavailable — just play */
      }
      seenRef.current = seen;
    }
    let seen = seenRef.current;
    if (dev && (params.has("intro") || freeze !== undefined)) seen = false;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let webgl = false;
    try {
      const c = document.createElement("canvas");
      webgl = !!(c.getContext("webgl2") || c.getContext("webgl"));
    } catch {
      webgl = false;
    }

    /* eslint-disable react-hooks/set-state-in-effect -- one-time client capability probe */
    if (seen) {
      setOpen(false);
      finish();
      return;
    }
    if (reduce) {
      setMode("reduced");
      setGo(true);
      setFast(true);
      later(() => setOpen(false), 1.2);
      later(finish, 1.25);
    } else if (webgl && !params.has("noWebGL")) {
      setMode("cinema");
      setView({
        lite: window.matchMedia("(max-width: 767px), (pointer: coarse)").matches,
        portrait: window.innerWidth / window.innerHeight < 0.85,
        freezeAt: freeze,
      });
      setScene(true);
      later(() => {
        if (ready.current) return;
        setScene(false);
        setMode("fallback");
        run(FALLBACK_SHIFT, false);
      }, SCENE_TIMEOUT / 1000);
    } else {
      setMode("fallback");
      run(FALLBACK_SHIFT, false);
    }
    /* eslint-enable react-hooks/set-state-in-effect */

    const t = timers.current;
    return () => t.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onSceneReady = useCallback(() => {
    if (ready.current) return;
    ready.current = true;
    run(0, view.freezeAt !== undefined);
  }, [run, view.freezeAt]);

  // Lock scroll + allow Escape to skip while the intro is on screen.
  useEffect(() => {
    if (!open || mode === "pending") return;
    const html = document.documentElement;
    const prev = html.style.overflow;
    html.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    window.addEventListener("keydown", onKey);
    return () => {
      html.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, mode, close]);

  const reduced = mode === "reduced";
  const shift = mode === "fallback" ? FALLBACK_SHIFT : 0;
  const at = (s: number) => (reduced ? 0.05 : Math.max(0, s - shift));
  const rise = (delay: number, y: string | number = "110%") => ({
    initial: { opacity: reduced ? 0 : 1, y: reduced ? 0 : y },
    animate: go ? { opacity: 1, y: 0 } : undefined,
    transition: { duration: reduced ? 0.35 : 0.9, delay, ease },
  });

  return (
    <AnimatePresence custom={fast}>
      {open && (
        <motion.div
          key="intro"
          className={`intro-overlay fixed inset-0 z-[80] overflow-hidden bg-ink ${mode === "pending" ? "intro-failsafe" : ""}`}
          custom={fast}
          variants={{
            // skip / reduced motion: a quick fade; full run: the overlay lifts like a curtain
            exit: (quick: boolean) =>
              quick
                ? { opacity: 0, transition: { duration: 0.22 } }
                : { clipPath: "inset(0 0 100% 0)", transition: { duration: T.exitDur, ease: [0.76, 0, 0.24, 1] } },
          }}
          initial={{ clipPath: "inset(0 0 0% 0)", opacity: 1 }}
          exit="exit"
        >
          {/* ── Layer 1: the name, waiting beneath the dark ── */}
          <div className="absolute inset-0 flex flex-col justify-between p-[var(--gutter)]" aria-hidden>
            <div className="pointer-events-none absolute inset-0 blueprint-grid [mask-image:radial-gradient(ellipse_at_center,black_20%,transparent_75%)]" />
            <div className="pointer-events-none absolute left-1/2 top-1/2 h-[70vmax] w-[70vmax] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgb(200_241_53/0.08),transparent_60%)]" />
            <div className="relative flex justify-between label-mono">
              <span>{site.initials} / 2026</span>
              <span className="hidden sm:inline">{site.location}</span>
            </div>

            <div className="relative mx-auto flex w-full max-w-[1200px] flex-col items-start">
              <motion.div {...rise(at(T.name), 12)} className="mb-5 flex items-center gap-3 label-mono">
                <span className="size-1.5 rounded-full bg-acid" />
                <span>Portfolio</span>
              </motion.div>
              <div className="flex flex-wrap gap-x-[0.22em] text-[clamp(3rem,12.5vw,11rem)] font-semibold leading-[0.88] tracking-[-0.04em] text-paper">
                {NAME.map((word, w) => (
                  <span key={word} className="flex overflow-hidden pb-[0.06em]">
                    {word.split("").map((ch, i) => (
                      <motion.span key={i} className="block" {...rise(at(T.name + w * 0.12 + i * 0.03))}>
                        {ch}
                      </motion.span>
                    ))}
                  </span>
                ))}
              </div>
              <motion.div
                className="mt-5 h-px w-full origin-left bg-line-strong"
                initial={{ scaleX: reduced ? 1 : 0 }}
                animate={go ? { scaleX: 1 } : undefined}
                transition={{ duration: 1.1, delay: at(T.role - 0.1), ease }}
              />
              <div className="mt-5 flex w-full flex-col gap-4 sm:flex-row sm:items-baseline sm:justify-between">
                <p className="flex flex-wrap items-center gap-x-2.5 gap-y-1 overflow-hidden font-mono text-[0.7rem] uppercase tracking-[0.14em] text-paper-dim sm:text-xs">
                  {ROLE.map((r, i) => (
                    <motion.span key={r} className="flex items-center gap-2.5" {...rise(at(T.role + i * 0.08))}>
                      {i > 0 && <span className="text-acid">|</span>}
                      {r}
                    </motion.span>
                  ))}
                </p>
                <p className="flex flex-wrap items-baseline gap-x-2 overflow-hidden text-sm font-medium tracking-[0.06em] sm:text-base">
                  {site.tagline.map((word, i) => (
                    <motion.span key={word} className="flex items-baseline gap-2" {...rise(at(T.tagline + i * 0.11))}>
                      {i > 0 && <span className="text-mute-2">→</span>}
                      <span className={i === site.tagline.length - 1 ? "text-acid" : "text-paper"}>
                        {word.toUpperCase()}
                        {i === site.tagline.length - 1 && "."}
                      </span>
                    </motion.span>
                  ))}
                </p>
              </div>
            </div>
            <div className="relative h-4" />
          </div>

          {/* ── Layer 2: the scene, cut open along the slash ── */}
          {!reduced && (
            <motion.div className="absolute inset-0 bg-ink" style={{ clipPath: clip }} aria-hidden>
              {scene && (
                <SamuraiScene lite={view.lite} portrait={view.portrait} freezeAt={view.freezeAt} onReady={onSceneReady} />
              )}
              {/* vignette keeps the frame cinematic and the edges quiet */}
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_45%,rgb(10_10_9/0.85)_100%)]" />
            </motion.div>
          )}

          {/* ── Layer 3: the light streak that makes the cut (corner to corner, same line as the split) ── */}
          {!reduced && (
            <div
              className="pointer-events-none absolute left-0 top-0 h-0 w-[hypot(100vw,100dvh)] origin-left [rotate:atan2(100dvh,100vw)]"
              aria-hidden
            >
              <motion.div
                className="absolute -top-[7px] left-0 h-[14px] w-full origin-left rounded-full bg-acid blur-[10px]"
                initial={{ scaleX: 0, opacity: 0 }}
                animate={go ? { scaleX: 1, opacity: [0, 0.6, 0] } : undefined}
                transition={{ scaleX: { delay: at(T.streak), duration: 0.2, ease: [0.5, 0, 0.2, 1] }, opacity: { delay: at(T.streak), duration: 0.75, times: [0, 0.3, 1] } }}
              />
              <motion.div
                className="absolute -top-px left-0 h-[2px] w-full origin-left bg-[#f6ffd9] shadow-[0_0_12px_2px_rgb(200_241_53/0.7)]"
                initial={{ scaleX: 0, opacity: 0 }}
                animate={go ? { scaleX: 1, opacity: [0, 1, 1, 0] } : undefined}
                transition={{ scaleX: { delay: at(T.streak), duration: 0.2, ease: [0.5, 0, 0.2, 1] }, opacity: { delay: at(T.streak), duration: 0.6, times: [0, 0.15, 0.5, 1] } }}
              />
            </div>
          )}
          {/* impact flash */}
          {!reduced && (
            <motion.div
              className="pointer-events-none absolute inset-0 bg-paper"
              initial={{ opacity: 0 }}
              animate={go ? { opacity: [0, 0.07, 0] } : undefined}
              transition={{ delay: at(T.impact), duration: 0.35 }}
              aria-hidden
            />
          )}

          <button
            type="button"
            onClick={close}
            className="group absolute bottom-[max(1rem,env(safe-area-inset-bottom))] right-[var(--gutter)] z-10 flex items-center gap-2 rounded-full border border-line-strong bg-ink/60 px-4 py-2.5 font-mono text-[0.6875rem] uppercase tracking-[0.14em] text-paper-dim backdrop-blur transition-colors hover:border-acid hover:text-paper"
          >
            Skip intro
            <span className="text-acid transition-transform group-hover:translate-x-0.5" aria-hidden>
              →
            </span>
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
