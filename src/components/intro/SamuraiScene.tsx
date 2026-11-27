"use client";

/**
 * The intro's WebGL stage: RONIN-04 (CC0 mecha samurai, recoloured to the site palette)
 * performs a custom nukitsuke draw and kesa-giri timed to the shared intro timeline,
 * in a dark blueprint atmosphere. Mounted only while the intro plays.
 */

import { Canvas, useFrame } from "@react-three/fiber";
import { Environment, Lightformer } from "@react-three/drei";
import { Suspense, useEffect, useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { RoninActor } from "./RoninActor";

const LIME = new THREE.Color("#c8f135");
const PAPER = new THREE.Color("#efece4");
const INK = "#0a0a09";

/* ───────────────────────── atmosphere ───────────────────────── */

function seeded(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function radialTexture(inner: string, outer: string) {
  const c = document.createElement("canvas");
  c.width = c.height = 128;
  const ctx = c.getContext("2d")!;
  const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  g.addColorStop(0, inner);
  g.addColorStop(1, outer);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 128, 128);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function Atmosphere({ lite, clockRef }: { lite: boolean; clockRef: React.RefObject<number> }) {
  const { geo, mist, glow, grid } = useMemo(() => {
    const rand = seeded(3);
    const count = lite ? 110 : 320;
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      arr[i * 3] = (rand() - 0.5) * 9;
      arr[i * 3 + 1] = rand() * 3.6;
      arr[i * 3 + 2] = (rand() - 0.5) * 7 - 1;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(arr, 3));
    const mist = radialTexture("rgba(239,236,228,0.16)", "rgba(239,236,228,0)");
    const glow = radialTexture("rgba(200,241,53,0.22)", "rgba(200,241,53,0)");
    // blueprint floor grid
    const pts: number[] = [];
    for (let i = -10; i <= 10; i++) {
      pts.push(i * 0.5, 0, -6, i * 0.5, 0, 4, -5, 0, i * 0.5 - 1, 5, 0, i * 0.5 - 1);
    }
    const grid = new THREE.BufferGeometry();
    grid.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3));
    return { geo, mist, glow, grid };
  }, [lite]);
  useEffect(() => () => [geo, mist, glow, grid].forEach((x) => x.dispose()), [geo, mist, glow, grid]);
  const pts = useRef<THREE.Points>(null);
  const mists = useRef<THREE.Group>(null);
  useFrame(() => {
    const t = clockRef.current;
    if (pts.current) {
      pts.current.position.y = (t * 0.06) % 3.6;
      pts.current.rotation.y = t * 0.02;
    }
    if (mists.current) mists.current.children.forEach((c, i) => (c.position.x = Math.sin(t * 0.3 + i) * 0.4 + (i - 1) * 2.2));
  });
  return (
    <>
      <mesh rotation-x={-Math.PI / 2} receiveShadow>
        <planeGeometry args={[30, 30]} />
        <meshStandardMaterial color="#0b0b0a" roughness={0.85} metalness={0.2} envMapIntensity={0.15} />
      </mesh>
      <lineSegments geometry={grid} position-y={0.002}>
        <lineBasicMaterial color={PAPER} transparent opacity={0.06} depthWrite={false} />
      </lineSegments>
      <mesh rotation-x={-Math.PI / 2} position-y={0.004} scale={3.2}>
        <planeGeometry />
        <meshBasicMaterial map={glow} transparent depthWrite={false} toneMapped={false} />
      </mesh>
      <points ref={pts} geometry={geo}>
        <pointsMaterial color={PAPER} size={lite ? 0.02 : 0.014} sizeAttenuation transparent opacity={0.55} depthWrite={false} />
      </points>
      <group ref={mists} position={[0, 0.35, -1.2]}>
        {[0, 1, 2].map((i) => (
          <mesh key={i} scale={[4, 1.4, 1]}>
            <planeGeometry />
            <meshBasicMaterial map={mist} transparent depthWrite={false} opacity={0.7} />
          </mesh>
        ))}
      </group>
    </>
  );
}

/* ───────────────────────── clock ───────────────────────── */

/** Starts the shared clock on the first rendered frame (after the model has loaded). */
function Director({ clockRef, startAtRef, freezeAt, onReady }: { clockRef: React.RefObject<number>; startAtRef: React.RefObject<number | null>; freezeAt?: number; onReady: () => void }) {
  const fired = useRef(false);
  useFrame((state) => {
    if (!fired.current) {
      fired.current = true;
      startAtRef.current = performance.now();
      onReady();
    }
    clockRef.current = freezeAt ?? (performance.now() - (startAtRef.current ?? performance.now())) / 1000;
    if (state.scene.fog) (state.scene.fog as THREE.Fog).far = state.size.width / state.size.height < 0.85 ? 14 : 12;
  });
  return null;
}

/* ───────────────────────── canvas ───────────────────────── */

export default function SamuraiScene({ lite, portrait, freezeAt, onReady }: { lite: boolean; portrait: boolean; freezeAt?: number; onReady: () => void }) {
  const clockRef = useRef(0);
  const startAtRef = useRef<number | null>(null);

  useLayoutEffect(() => {
    clockRef.current = 0;
  }, []);

  return (
    <Canvas
      dpr={lite ? [1, 1.25] : [1, 1.75]}
      camera={{ position: [-4.4, 0.8, 5.6], fov: portrait ? 46 : 30, near: 0.1, far: 40 }}
      gl={{ antialias: !lite, alpha: false, powerPreference: "high-performance" }}
      onCreated={({ gl, scene }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 1.1;
        scene.background = new THREE.Color(INK);
        scene.fog = new THREE.Fog(INK, 5, 12);
      }}
      aria-hidden
    >
      <ambientLight intensity={0.06} />
      {/* rim lights: warm-white from behind left, lime from behind right */}
      <directionalLight position={[-3, 3, -4]} intensity={2.4} color={PAPER} />
      <directionalLight position={[3.5, 2.5, -3]} intensity={0.9} color={LIME} />

      <Environment resolution={lite ? 64 : 128} frames={1}>
        <Lightformer form="rect" intensity={3} position={[0, 5, -4]} scale={[10, 1, 1]} />
        <Lightformer form="rect" intensity={1.4} position={[-5, 1.5, 1]} rotation-y={Math.PI / 2} scale={[6, 0.5, 1]} />
        <Lightformer form="rect" intensity={2} color="#c8f135" position={[5, 0.5, 0]} rotation-y={-Math.PI / 2} scale={[5, 0.2, 1]} />
      </Environment>

      <Atmosphere lite={lite} clockRef={clockRef} />
      {/* the clock starts only once the model is ready, so the choreography never runs ahead of the render */}
      <Suspense fallback={null}>
        <Director clockRef={clockRef} startAtRef={startAtRef} freezeAt={freezeAt} onReady={onReady} />
        <RoninActor clockRef={clockRef} freeze={null} />
      </Suspense>
    </Canvas>
  );
}
