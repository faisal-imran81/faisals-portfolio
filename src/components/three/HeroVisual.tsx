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
      className="relative aspect-square w-full select-none"
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
    </div>
  );
}
