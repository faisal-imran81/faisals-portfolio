"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { Environment, Lightformer } from "@react-three/drei";
import dynamic from "next/dynamic";
import { Suspense, useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { T } from "@/components/intro/timeline";
import { RoninActor } from "@/components/intro/RoninActor";

// the CURRENT intro samurai, unchanged, for side-by-side comparison
const SamuraiScene = dynamic(() => import("@/components/intro/SamuraiScene"), { ssr: false });

const LOOP = 3.8;

function Clock({ clockRef, freeze, speed }: { clockRef: React.RefObject<number>; freeze: number | null; speed: number }) {
  useFrame((_, dt) => {
    clockRef.current = freeze ?? (clockRef.current + Math.min(dt, 0.05) * speed) % LOOP;
  });
  return null;
}

/** Mirrors the real intro's lime streak + diagonal split, driven by the same timeline. */
function Overlay({ clockRef, target }: { clockRef: React.RefObject<number>; target: React.RefObject<HTMLDivElement | null> }) {
  const streak = useRef<HTMLDivElement>(null);
  const wrap = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let raf = 0;
    const tick = () => {
      const t = clockRef.current;
      const box = target.current;
      if (wrap.current && box) {
        const w = box.clientWidth, h = box.clientHeight;
        wrap.current.style.width = `${Math.hypot(w, h)}px`;
        wrap.current.style.transform = `rotate(${Math.atan2(h, w)}rad)`;
      }
      const p = THREE.MathUtils.clamp((t - T.streak) / 0.2, 0, 1);
      const o = t < T.streak ? 0 : Math.max(0, 1 - (t - T.streak - 0.25) / 0.35);
      if (streak.current) {
        streak.current.style.transform = `scaleX(${1 - Math.pow(1 - p, 3)})`;
        streak.current.style.opacity = String(o);
      }
      const u = THREE.MathUtils.clamp((t - T.split) / (T.splitEnd - T.split), 0, 1);
      const d = (u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2) * 72;
      if (target.current) {
        const a = `${d}% ${-d}%`, b = `${100 + d}% ${-d}%`, c = `${100 + d}% ${100 - d}%`;
        const e = `${-d}% ${d}%`, f = `${-d}% ${100 + d}%`, g = `${100 - d}% ${100 + d}%`;
        target.current.style.clipPath = `polygon(${a}, ${b}, ${c}, ${a}, ${e}, ${f}, ${g}, ${e})`;
      }
      raf = requestAnimationFrame(tick);
    };
    tick();
    const el = target.current;
    return () => {
      cancelAnimationFrame(raf);
      if (el) el.style.clipPath = "";
    };
  }, [clockRef, target]);
  return (
    <div ref={wrap} className="pointer-events-none absolute left-0 top-0 h-0 origin-left" aria-hidden>
      <div ref={streak} className="absolute -top-px left-0 h-[2px] w-full origin-left bg-[#f6ffd9] opacity-0 shadow-[0_0_14px_3px_rgb(200_241_53/0.75)]" />
    </div>
  );
}

function Stage({ clockRef, freeze, onInfo }: { clockRef: React.RefObject<number>; freeze: number | null; onInfo: (s: string) => void }) {
  return (
    <Canvas
      dpr={[1, 1.75]}
      camera={{ position: [2.9, 0.75, 6.6], fov: 30, near: 0.1, far: 40 }}
      gl={{ antialias: true }}
      onCreated={({ gl, scene }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 1.1;
        scene.background = new THREE.Color("#0a0a09");
        scene.fog = new THREE.Fog("#0a0a09", 5, 12);
      }}
    >
      <Clock clockRef={clockRef} freeze={freeze} speed={1} />
      <ambientLight intensity={0.06} />
      <directionalLight position={[-3, 3, -4]} intensity={2.4} color="#efece4" />
      <directionalLight position={[3.5, 2.5, -3]} intensity={0.9} color="#c8f135" />
      <Environment resolution={128} frames={1}>
        <Lightformer form="rect" intensity={3} position={[0, 5, -4]} scale={[10, 1, 1]} />
        <Lightformer form="rect" intensity={1.4} position={[-5, 1.5, 1]} rotation-y={Math.PI / 2} scale={[6, 0.5, 1]} />
        <Lightformer form="rect" intensity={2} color="#c8f135" position={[5, 0.5, 0]} rotation-y={-Math.PI / 2} scale={[5, 0.2, 1]} />
      </Environment>
      <mesh rotation-x={-Math.PI / 2}>
        <planeGeometry args={[30, 30]} />
        <meshStandardMaterial color="#0b0b0a" roughness={0.85} metalness={0.2} envMapIntensity={0.15} />
      </mesh>
      <Suspense fallback={null}>
        <RoninActor clockRef={clockRef} freeze={freeze} onInfo={onInfo} />
      </Suspense>
    </Canvas>
  );
}

export function CustomPreview() {
  const [q] = useState(() => new URLSearchParams(window.location.search));
  const [freeze, setFreeze] = useState<number | null>(q.has("t") ? Number(q.get("t")) : null);
  const [overlay, setOverlay] = useState(q.get("overlay") !== "0");
  const [compare, setCompare] = useState(q.get("compare") === "1");
  const [loopKey, setLoopKey] = useState(0);
  const clockRef = useRef(freeze ?? 0);
  const cut = useRef<HTMLDivElement>(null);
  const info = useRef<HTMLParagraphElement>(null);

  // remount the current intro scene each loop so both start together
  useEffect(() => {
    if (!compare || freeze !== null) return;
    let last = 0;
    const id = window.setInterval(() => {
      if (clockRef.current < last) setLoopKey((k) => k + 1);
      last = clockRef.current;
    }, 50);
    return () => window.clearInterval(id);
  }, [compare, freeze]);

  return (
    <div className="fixed inset-0 flex flex-col bg-ink text-paper">
      <div className={`grid flex-1 ${compare ? "grid-cols-2 gap-px bg-line" : "grid-cols-1"}`}>
        <div className="relative overflow-hidden bg-ink">
          <div ref={cut} className="absolute inset-0">
            <Stage clockRef={clockRef} freeze={freeze} onInfo={(s) => info.current && (info.current.textContent = s)} />
          </div>
          {overlay && <Overlay clockRef={clockRef} target={cut} />}
          <p className="pointer-events-none absolute left-4 top-4 label-mono">A · RONIN-04 custom draw + kesa-giri (experiment)</p>
        </div>
        {compare && (
          <div className="relative overflow-hidden bg-ink">
            <SamuraiScene key={loopKey} lite={false} portrait={false} freezeAt={freeze ?? undefined} onReady={() => {}} />
            <p className="pointer-events-none absolute left-4 top-4 label-mono">B · current intro samurai (unchanged)</p>
          </div>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-2 border-t hairline p-3 text-sm">
        <a href="/preview/ronin" className="rounded-full border border-line-strong px-3 py-1.5 text-paper-dim">← Clip viewer</a>
        <button onClick={() => setFreeze(freeze === null ? clockRef.current : null)} className="rounded-full border border-line-strong px-3 py-1.5">
          {freeze === null ? "Pause / scrub" : "Play loop"}
        </button>
        <button onClick={() => setOverlay(!overlay)} className={`rounded-full border px-3 py-1.5 ${overlay ? "border-acid text-acid" : "border-line-strong text-paper-dim"}`}>
          Intro streak + split
        </button>
        <button onClick={() => setCompare(!compare)} className={`rounded-full border px-3 py-1.5 ${compare ? "border-acid text-acid" : "border-line-strong text-paper-dim"}`}>
          Compare with current
        </button>
        {freeze !== null && (
          <input type="range" min={0} max={LOOP} step={0.01} value={freeze} onChange={(e) => setFreeze(Number(e.target.value))} className="w-64 accent-[#c8f135]" />
        )}
        <p ref={info} className="ml-auto font-mono text-xs text-mute" />
      </div>
    </div>
  );
}
