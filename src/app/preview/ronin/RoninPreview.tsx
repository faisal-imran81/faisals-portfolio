"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { Environment, Lightformer, OrbitControls, useGLTF } from "@react-three/drei";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { SkeletonUtils } from "three-stdlib";
import { T } from "@/components/intro/timeline";

const SRC = { lime: "/preview/ronin-04-lime.glb", original: "/preview/ronin-04-original.glb" } as const;
type Variant = keyof typeof SRC;
const SCALE = 1 / 8; // the source is a 16 m mecha → ~2 scene units tall

/**
 * Proposed intro choreography on the existing timeline (seconds from first frame):
 *   0 → 1.0   Sentinel   — stands in the dark while the camera pushes in
 *   1.0 → 1.9 BladeSalute (clip 0.6 → 1.5 s) — blade rises in front of the helmet, catches the lime light
 *   1.92 →    SwordSlash — its peak blade speed (≈0.56 s into the clip) lands on T.impact
 * The awkward follow-through after ≈0.65 s is hidden by the screen split (T.split → T.splitEnd).
 */
const SLASH_PEAK = 0.56;
const SLASH_START = T.impact - SLASH_PEAK;
const SEQ_END = T.splitEnd;
function introWeights(t: number) {
  const smooth = (a: number, b: number) => THREE.MathUtils.smoothstep(t, a, b);
  const toSalute = smooth(0.85, 1.1);
  const toSlash = smooth(SLASH_START - 0.12, SLASH_START + 0.04);
  return {
    Sentinel: { w: (1 - toSalute), time: Math.min(t, 5.9) },
    BladeSalute: { w: toSalute * (1 - toSlash), time: THREE.MathUtils.clamp(0.6 + (t - 1.0), 0, 5.9) },
    SwordSlash: { w: toSlash, time: Math.max(0, t - SLASH_START) },
  };
}

type Stats = { clips: string[]; duration: number; peakT: number; speed: number[]; tris: number };

/** Finds the katana tip in sword.R bone space: farthest vertex rigidly bound to that bone. */
function findSwordTip(mesh: THREE.SkinnedMesh) {
  const bone = mesh.skeleton.bones.findIndex((b) => /^sword\.?R$/.test(b.name));
  if (bone < 0) return null;
  const pos = mesh.geometry.getAttribute("position");
  const si = mesh.geometry.getAttribute("skinIndex");
  const sw = mesh.geometry.getAttribute("skinWeight");
  const inv = new THREE.Matrix4().multiplyMatrices(mesh.skeleton.boneInverses[bone], mesh.bindMatrix);
  const v = new THREE.Vector3();
  let best = new THREE.Vector3();
  let max = -1;
  for (let i = 0; i < pos.count; i++) {
    if (si.getX(i) !== bone || sw.getX(i) < 0.99) continue;
    v.fromBufferAttribute(pos, i).applyMatrix4(inv);
    const d = v.lengthSq();
    if (d > max) {
      max = d;
      best = v.clone();
    }
  }
  return { bone: mesh.skeleton.bones[bone], tip: best };
}

function Ronin({ variant, clip, freeze, speed, onStats, onSeq, rot = 0 }: { rot?: number; variant: Variant; clip: string; freeze: number | null; speed: number; onStats: (s: Stats) => void; onSeq?: (t: number) => void }) {
  const gltf = useGLTF(SRC[variant]);
  const scene = useMemo(() => SkeletonUtils.clone(gltf.scene), [gltf.scene]);
  const mixer = useMemo(() => new THREE.AnimationMixer(scene), [scene]);
  const tipInfo = useRef<ReturnType<typeof findSwordTip>>(null);
  const hist = useMemo(() => new Float32Array(40 * 3), []);
  const trail = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(hist, 3));
    const l = new THREE.Line(g, new THREE.LineBasicMaterial({ color: "#c8f135", transparent: true, opacity: 0.8, toneMapped: false }));
    l.frustumCulled = false;
    return l;
  }, [hist]);

  useEffect(() => {
    let tris = 0;
    scene.traverse((o) => {
      const m = o as THREE.SkinnedMesh;
      if (m.isSkinnedMesh) {
        tipInfo.current = findSwordTip(m);
        tris += (m.geometry.index?.count ?? 0) / 3;
        m.frustumCulled = false;
      }
    });
    const a = gltf.animations.find((x) => x.name === (clip === "Intro" ? "SwordSlash" : clip)) ?? gltf.animations[0];
    const action = mixer.clipAction(a);
    action.reset().play();
    if (clip === "Intro") {
      for (const n of ["Sentinel", "BladeSalute"]) {
        const c = gltf.animations.find((x) => x.name === n);
        if (c) mixer.clipAction(c).reset().play();
      }
    }
    // sample tip speed across the clip → where the strike peaks
    const N = 120;
    const sp: number[] = [];
    const prev = new THREE.Vector3();
    const cur = new THREE.Vector3();
    let peakT = 0;
    let peak = 0;
    const ti = tipInfo.current;
    for (let i = 0; i <= N; i++) {
      const t = (i / N) * a.duration;
      mixer.setTime(t);
      scene.updateMatrixWorld(true);
      if (ti) cur.copy(ti.tip).applyMatrix4(ti.bone.matrixWorld);
      if (i > 0) {
        const s = cur.distanceTo(prev) / (a.duration / N);
        sp.push(s);
        if (s > peak) {
          peak = s;
          peakT = t;
        }
      }
      prev.copy(cur);
    }
    mixer.setTime(0);
    onStats({ clips: [...gltf.animations.map((x) => x.name), "Intro"], duration: clip === "Intro" ? SEQ_END : a.duration, peakT, speed: sp, tris });
    return () => {
      mixer.stopAllAction();
      action.stop();
      mixer.uncacheRoot(scene);
    };
  }, [scene, mixer, gltf.animations, clip, onStats]);

  const seqT = useRef(0);
  useFrame((_, dt) => {
    if (clip === "Intro") {
      seqT.current = freeze ?? (seqT.current + dt * speed) % SEQ_END;
      const w = introWeights(seqT.current);
      for (const [name, v] of Object.entries(w)) {
        const c = gltf.animations.find((x) => x.name === name);
        if (!c) continue;
        const act = mixer.clipAction(c);
        act.enabled = true;
        act.setEffectiveWeight(v.w);
        act.time = v.time;
      }
      mixer.update(0);
      onSeq?.(seqT.current);
    } else if (freeze !== null) mixer.setTime(freeze);
    else mixer.update(dt * speed);
    const ti = tipInfo.current;
    if (ti) {
      scene.updateMatrixWorld(true);
      hist.copyWithin(3, 0, hist.length - 3);
      const p = ti.tip.clone().applyMatrix4(ti.bone.matrixWorld);
      p.toArray(hist, 0);
      const g = trail.geometry;
      (g.getAttribute("position") as THREE.BufferAttribute).needsUpdate = true;
    }
  });


  return (
    <>
      <primitive object={scene} scale={SCALE} rotation-y={rot} />
      {/* sword-tip trace (diagnostic) */}
      <primitive object={trail} />
    </>
  );
}

const CAMS: Record<string, [number, number, number]> = {
  front: [0.6, 1.3, 4.2],
  side: [4.2, 1.3, 0.4],
  close: [0.45, 1.75, 1.5],
  intro: [1.45, 1.12, 3.5],
};

export function RoninPreview() {
  // client-only: reads URL params for initial state
  const [mounted, setMounted] = useState(false);
  // eslint-disable-next-line react-hooks/set-state-in-effect -- mount gate
  useEffect(() => setMounted(true), []);
  return mounted ? <Preview /> : null;
}

function Preview() {
  const [q] = useState(() => (typeof window === "undefined" ? new URLSearchParams() : new URLSearchParams(window.location.search)));
  const [variant, setVariant] = useState<Variant>((q.get("v") as Variant) || "lime");
  const [clip, setClip] = useState(q.get("clip") || "SwordSlash");
  const [freeze, setFreeze] = useState<number | null>(q.has("t") ? Number(q.get("t")) : null);
  const [speed, setSpeed] = useState(1);
  const [cam] = useState(q.get("cam") || "front");
  const [rot] = useState(Number(q.get("rot") ?? 0));
  const [stats, setStats] = useState<Stats | null>(null);
  const clockEl = useRef<HTMLParagraphElement>(null);
  const flashEl = useRef<HTMLDivElement>(null);
  const onSeq = useMemo(
    () => (t: number) => {
      if (clockEl.current) clockEl.current.textContent = `intro t = ${t.toFixed(2)} s${t < 1 ? " · Sentinel" : t < SLASH_START ? " · BladeSalute (draw beat)" : " · SwordSlash"}`;
      if (flashEl.current) flashEl.current.style.opacity = String(Math.max(0, 1 - Math.abs(t - T.impact) / 0.08) * 0.5);
    },
    [],
  );

  return (
    <div className="fixed inset-0 grid grid-rows-[1fr_auto] bg-ink text-paper md:grid-cols-[1fr_320px] md:grid-rows-1">
      <div className="relative">
        <Canvas camera={{ position: CAMS[cam] ?? CAMS.front, fov: 32 }} gl={{ antialias: true }} dpr={[1, 2]} onCreated={({ gl, scene }) => {
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = 1.1;
          scene.background = new THREE.Color("#0a0a09");
        }}>
          <ambientLight intensity={0.08} />
          <spotLight position={[2.2, 4.2, 3.4]} angle={0.5} penumbra={0.9} intensity={22} color="#efece4" decay={1.6} />
          <directionalLight position={[-3, 3, -4]} intensity={2.4} color="#efece4" />
          <directionalLight position={[3.5, 2, -3]} intensity={1.6} color="#c8f135" />
          <Environment resolution={128} frames={1}>
            <Lightformer form="rect" intensity={3} position={[0, 5, -4]} scale={[10, 1, 1]} />
            <Lightformer form="rect" intensity={1.4} position={[-5, 1.5, 1]} rotation-y={Math.PI / 2} scale={[6, 0.5, 1]} />
            <Lightformer form="rect" intensity={2.4} color="#c8f135" position={[5, 0.5, 0]} rotation-y={-Math.PI / 2} scale={[5, 0.2, 1]} />
            <Lightformer form="rect" intensity={1} position={[0, 2, 5]} scale={[3, 0.3, 1]} />
          </Environment>
          <mesh rotation-x={-Math.PI / 2}>
            <planeGeometry args={[30, 30]} />
            <meshStandardMaterial color="#0b0b0a" roughness={0.45} metalness={0.6} />
          </mesh>
          <gridHelper args={[20, 40, "#2a2a27", "#1a1a18"]} position-y={0.002} />
          <Suspense fallback={null}>
            <Ronin key={variant + clip} variant={variant} clip={clip} freeze={freeze} speed={speed} onStats={setStats} onSeq={clip === "Intro" ? onSeq : undefined} rot={rot} />
          </Suspense>
          <OrbitControls target={cam === "close" ? [0, 1.7, 0] : [0, 1.05, 0]} makeDefault />
        </Canvas>
        <p className="pointer-events-none absolute left-4 top-4 label-mono">RONIN-04 · CC0 · temporary preview</p>
        {clip === "Intro" && (
          <>
            <p ref={clockEl} className="pointer-events-none absolute bottom-4 left-4 font-mono text-xs text-acid" />
            <div ref={flashEl} className="pointer-events-none absolute inset-0 border-4 border-acid opacity-0" aria-hidden />
          </>
        )}
      </div>

      <aside className="space-y-5 overflow-y-auto border-l hairline p-5 text-sm">
        <div>
          <p className="mb-2 label-mono">Material</p>
          <div className="flex gap-2">
            {(Object.keys(SRC) as Variant[]).map((v) => (
              <button key={v} onClick={() => setVariant(v)} className={`rounded-full border px-3 py-1.5 ${variant === v ? "border-acid text-acid" : "border-line-strong text-paper-dim"}`}>
                {v === "lime" ? "Recoloured" : "Original"}
              </button>
            ))}
          </div>
        </div>
        <div>
          <p className="mb-2 label-mono">Clip</p>
          <div className="flex flex-wrap gap-2">
            {(stats?.clips ?? [clip]).map((c) => (
              <button key={c} onClick={() => setClip(c)} className={`rounded-full border px-3 py-1.5 ${clip === c ? "border-acid text-acid" : "border-line-strong text-paper-dim"}`}>
                {c}
              </button>
            ))}
          </div>
        </div>
        <div>
          <p className="mb-2 label-mono">Playback</p>
          <div className="flex flex-wrap items-center gap-2">
            <button onClick={() => setFreeze(freeze === null ? 0 : null)} className="rounded-full border border-line-strong px-3 py-1.5">
              {freeze === null ? "Pause / scrub" : "Play"}
            </button>
            {[0.25, 0.5, 1].map((s) => (
              <button key={s} onClick={() => setSpeed(s)} className={`rounded-full border px-3 py-1.5 ${speed === s ? "border-acid text-acid" : "border-line-strong text-paper-dim"}`}>
                {s}×
              </button>
            ))}
          </div>
          {freeze !== null && stats && (
            <input type="range" min={0} max={stats.duration} step={0.01} value={freeze} onChange={(e) => setFreeze(Number(e.target.value))} className="mt-3 w-full accent-[#c8f135]" />
          )}
        </div>
        {stats && (
          <div>
            <p className="mb-2 label-mono">Analysis</p>
            <p className="text-paper-dim">
              {clip}: {stats.duration.toFixed(2)} s · peak blade speed at <span className="text-acid">{stats.peakT.toFixed(2)} s</span> · {Math.round(stats.tris).toLocaleString()} tris
            </p>
            <svg viewBox={`0 0 ${stats.speed.length} 40`} className="mt-2 h-16 w-full" preserveAspectRatio="none" aria-label="Blade tip speed over the clip">
              <polyline fill="none" stroke="#c8f135" strokeWidth={1} vectorEffect="non-scaling-stroke" points={stats.speed.map((s, i) => `${i},${40 - (s / Math.max(...stats.speed)) * 38}`).join(" ")} />
            </svg>
            <p className="mt-1 label-mono">blade-tip speed over the clip</p>
          </div>
        )}
      </aside>
    </div>
  );
}

useGLTF.preload(SRC.lime);
