"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import { useMediaQuery, usePrefersReducedMotion, useWebGLSupport } from "@/lib/hooks";
import { MonogramFallback } from "./MonogramFallback";

// Heavy: three + r3f + drei. Split into its own chunk and never rendered on the server.
const FIScene = dynamic(() => import("./FIScene"), { ssr: false });

export function HeroVisual({ start }: { start: boolean }) {
  const wrap = useRef<HTMLDivElement>(null);
  const coords = useRef<HTMLSpanElement>(null);
  const webgl = useWebGLSupport();
  const still = usePrefersReducedMotion();
  const lite = useMediaQuery("(max-width: 767px), (pointer: coarse)");
  const [visible, setVisible] = useState(true);
  const [ready, setReady] = useState(false);
  const [mount, setMount] = useState(false);

  // Defer the WebGL chunk until the intro is done and the browser is idle.
  useEffect(() => {
    if (!start || webgl !== true) return;
    const w = window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number };
    if (w.requestIdleCallback) {
      const id = w.requestIdleCallback(() => setMount(true), { timeout: 900 });
      return () => (window as Window & { cancelIdleCallback?: (id: number) => void }).cancelIdleCallback?.(id);
    }
    const t = window.setTimeout(() => setMount(true), 200);
    return () => window.clearTimeout(t);
  }, [start, webgl]);

  // Stop the render loop when the hero is off-screen.
  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { threshold: 0.02 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={wrap}
      className="crop-marks relative aspect-square w-full select-none"
      onPointerMove={(e) => {
        if (!coords.current) return;
        const r = e.currentTarget.getBoundingClientRect();
        const x = ((e.clientX - r.left) / r.width) * 2 - 1;
        const y = -(((e.clientY - r.top) / r.height) * 2 - 1);
        coords.current.textContent = `X ${x >= 0 ? "+" : ""}${x.toFixed(2)}  Y ${y >= 0 ? "+" : ""}${y.toFixed(2)}`;
      }}
    >
      {/* blueprint frame */}
      <div className="pointer-events-none absolute inset-0 blueprint-grid-fine opacity-60 [mask-image:radial-gradient(circle_at_center,black_35%,transparent_72%)]" />

      <motion.div
        className="absolute inset-0 flex items-center justify-center"
        initial={false}
        animate={{ opacity: ready ? 0 : 1 }}
        transition={{ duration: 0.8 }}
      >
        <MonogramFallback className="h-[78%] w-[78%]" />
      </motion.div>

      {mount && (
        <motion.div
          className="absolute inset-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: ready ? 1 : 0 }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
        >
          <FIScene lite={lite} still={still} paused={!visible} onReady={() => setReady(true)} />
        </motion.div>
      )}

      {/* technical annotations */}
      <div className="pointer-events-none absolute inset-0 font-mono text-[0.625rem] uppercase tracking-[0.14em] text-mute">
        <span className="absolute left-3 top-3">Fig. 01: FI monogram</span>
        <span className="absolute right-3 top-3 hidden sm:block">Rev. 2026.11</span>
        <span ref={coords} className="absolute bottom-3 left-3 tabular-nums">
          X +0.00  Y +0.00
        </span>
        <span className="absolute bottom-3 right-3 text-acid">{webgl === false ? "Static render" : "Interactive"}</span>
      </div>
    </div>
  );
}
