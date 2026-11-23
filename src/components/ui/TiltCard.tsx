"use client";

import { motion, useMotionTemplate, useMotionValue, useReducedMotion, useSpring } from "motion/react";
import type { ReactNode } from "react";
import { useFinePointer } from "@/lib/hooks";

/** Perspective tilt with a soft specular sheen that tracks the pointer. Desktop only. */
export function TiltCard({ children, className = "", max = 6 }: { children: ReactNode; className?: string; max?: number }) {
  const fine = useFinePointer();
  const reduce = useReducedMotion();
  const rx = useMotionValue(0);
  const ry = useMotionValue(0);
  const mx = useMotionValue(50);
  const my = useMotionValue(50);
  const srx = useSpring(rx, { stiffness: 160, damping: 18 });
  const sry = useSpring(ry, { stiffness: 160, damping: 18 });
  const sheen = useMotionTemplate`radial-gradient(600px circle at ${mx}% ${my}%, rgb(239 236 228 / 0.06), transparent 40%)`;
  const on = fine && !reduce;

  return (
    <motion.div
      className={`relative [transform-style:preserve-3d] ${className}`}
      style={on ? { rotateX: srx, rotateY: sry, transformPerspective: 1200 } : undefined}
      onPointerMove={(e) => {
        if (!on) return;
        const r = e.currentTarget.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width;
        const py = (e.clientY - r.top) / r.height;
        ry.set((px - 0.5) * max * 2);
        rx.set(-(py - 0.5) * max * 2);
        mx.set(px * 100);
        my.set(py * 100);
      }}
      onPointerLeave={() => {
        rx.set(0);
        ry.set(0);
      }}
    >
      {children}
      {on && <motion.div aria-hidden className="pointer-events-none absolute inset-0" style={{ background: sheen }} />}
    </motion.div>
  );
}
