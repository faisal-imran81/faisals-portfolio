"use client";

/**
 * Procedural futuristic ronin — modelled entirely in code (no external asset),
 * animated with keyframed hand targets + two-bone IK so the katana draw and
 * the kesa-giri slash read as one continuous, believable motion.
 */

import { Canvas, useFrame } from "@react-three/fiber";
import { Environment, Lightformer, RoundedBox } from "@react-three/drei";
import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { T } from "./timeline";

const LIME = new THREE.Color("#c8f135");
const PAPER = new THREE.Color("#efece4");
const INK = "#0a0a09";

/* ───────────────────────── keyframe helpers ───────────────────────── */

type Ease = (u: number) => number;
const inOut: Ease = (u) => (u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2);
const outExpo: Ease = (u) => (u >= 1 ? 1 : 1 - Math.pow(2, -10 * u));
const inQuad: Ease = (u) => u * u;
const outCubic: Ease = (u) => 1 - Math.pow(1 - u, 3);
const clamp01 = (x: number) => Math.min(1, Math.max(0, x));

type Key = [t: number, v: number[], e?: Ease];
function sample(keys: Key[], t: number, out: number[]) {
  if (t <= keys[0][0]) return copy(keys[0][1], out);
  for (let i = 0; i < keys.length - 1; i++) {
    const [t0, a] = keys[i];
    const [t1, b, e] = keys[i + 1];
    if (t <= t1) {
      const u = (e ?? inOut)((t - t0) / (t1 - t0));
      for (let k = 0; k < a.length; k++) out[k] = a[k] + (b[k] - a[k]) * u;
      return out;
    }
  }
  return copy(keys[keys.length - 1][1], out);
}
function copy(a: number[], out: number[]) {
  for (let k = 0; k < a.length; k++) out[k] = a[k];
  return out;
}

/* ───────────────────────── choreography ─────────────────────────
   Character faces +z, feet at y=0. Its right side is −x, saya on the left hip (+x).
   Hand targets / blade directions are in the character's root space. */

const n = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z).normalize().toArray();
const SAYA_DIR = n(0.42, -0.22, -1);
const HILT = [0.24, 1.02, 0.38];

const K = {
  root: [
    [0, [0, 0, -1.5]],
    [1.1, [0, 0, 0], outCubic],
  ] as Key[],
  // torso: rotX (lean), rotY (twist), rotZ
  torso: [
    [0, [0.04, 0, 0]],
    [T.reach, [0.05, 0.05, 0]],
    [T.draw, [0.2, 0.55, 0]],
    [1.42, [0.18, 0.4, 0]],
    [1.6, [0.08, 0.05, 0]],
    [T.guard, [0, -0.3, 0.04]],
    [T.slash, [-0.03, -0.36, 0.05]],
    [T.impact, [0.16, 0.25, -0.02], inQuad],
    [T.slashEnd, [0.3, 0.55, -0.06], outExpo],
    [4, [0.26, 0.5, -0.05]],
  ] as Key[],
  head: [
    [0, [0.08, 0]],
    [T.draw, [0.18, -0.25]],
    [T.guard, [0.02, 0.22]],
    [T.slashEnd, [0.12, -0.3], outExpo],
    [4, [0.1, -0.25]],
  ] as Key[],
  handR: [
    [0, [-0.3, 0.86, 0.08]],
    [T.reach, [-0.25, 0.9, 0.18]],
    [T.draw, HILT],
    [1.42, [0.05, 1.12, 0.83]],
    [1.6, [-0.22, 1.32, 0.62]],
    [T.guard, [-0.24, 1.62, 0.3]],
    [T.slash, [-0.27, 1.68, 0.26]],
    [T.impact, [0.0, 1.42, 0.62], inQuad],
    [T.slashEnd, [0.28, 0.98, 0.46], outExpo],
    [4, [0.26, 1.0, 0.44]],
  ] as Key[],
  // blade direction (hilt → tip)
  blade: [
    [0, SAYA_DIR],
    [T.draw, SAYA_DIR],
    [1.42, SAYA_DIR],
    [1.6, n(-0.55, 0.6, 0.6)],
    [T.guard, n(0.18, 1, -0.42)],
    [T.slash, n(0.24, 1, -0.55)],
    [T.impact, n(0.6, 0.25, 1), inQuad],
    [T.slashEnd, n(0.8, -0.55, 0.3), outExpo],
    [4, n(0.78, -0.58, 0.28)],
  ] as Key[],
  // which way the cutting edge faces
  edge: [
    [0, [0, 1, 0]],
    [T.draw, [0, 1, 0]],
    [1.6, [0.3, 0.3, 1]],
    [T.guard, [0, 0, 1]],
    [T.impact, [0.4, -0.9, 0.2]],
    [T.slashEnd, [0.4, -0.5, -0.3]],
  ] as Key[],
  // saya-biki: the scabbard is pulled back as the blade clears
  sayaBack: [
    [0, [0]],
    [T.draw, [0]],
    [1.42, [0.45]],
    [2.2, [0.12]],
  ] as Key[],
  // left hand: on the saya mouth, then joins the grip for the cut
  leftMode: [
    [0, [0]],
    [1.6, [0]],
    [T.guard, [1]],
  ] as Key[],
  cam: [
    [0, [2.6, 0.55, 6.2, 0, 1.15, 0]],
    [1.1, [2.0, 0.95, 4.4, 0, 1.2, 0], outCubic],
    [T.guard, [1.6, 1.1, 3.7, 0, 1.28, 0]],
    [T.slash, [1.45, 1.12, 3.5, 0, 1.3, 0]],
    [T.slashEnd, [1.1, 1.18, 3.15, 0.05, 1.22, 0], outExpo],
    [4, [1.0, 1.2, 3.0, 0.05, 1.22, 0]],
  ] as Key[],
  // light: key light reveal, blade glow
  lights: [
    [0, [0, 0.15]],
    [1.0, [1, 0.25]],
    [T.draw, [1, 0.4]],
    [T.guard, [1, 0.55]],
    [T.slash, [1, 0.6]],
    [T.impact, [1.15, 1]],
    [3, [1, 0.75]],
  ] as Key[],
};

/* ───────────────────────── materials ───────────────────────── */

function useMaterials() {
  return useMemo(() => {
    const armor = new THREE.MeshPhysicalMaterial({ color: "#1a1a19", metalness: 0.9, roughness: 0.3, clearcoat: 0.8, clearcoatRoughness: 0.18, envMapIntensity: 1.5 });
    const graphite = new THREE.MeshPhysicalMaterial({ color: "#34342f", metalness: 0.85, roughness: 0.38, clearcoat: 0.4, envMapIntensity: 1.2 });
    const cloth = new THREE.MeshStandardMaterial({ color: "#0e0e0d", roughness: 0.92, metalness: 0.05 });
    const lacing = new THREE.MeshStandardMaterial({ color: "#232320", roughness: 0.7, metalness: 0.3 });
    const blade = new THREE.MeshPhysicalMaterial({ color: "#2a2b28", metalness: 1, roughness: 0.14, clearcoat: 1, clearcoatRoughness: 0.05, envMapIntensity: 2.2 });
    const lime = new THREE.MeshBasicMaterial({ color: LIME, toneMapped: false });
    const limeSoft = new THREE.MeshBasicMaterial({ color: LIME, toneMapped: false, transparent: true, opacity: 0.55 });
    return { armor, graphite, cloth, lacing, blade, lime, limeSoft };
  }, []);
}
type Mats = ReturnType<typeof useMaterials>;

/* ───────────────────────── geometry ───────────────────────── */

function crescent() {
  const s = new THREE.Shape();
  s.absarc(0, 0, 0.22, Math.PI * 0.12, Math.PI * 0.88, false);
  s.absarc(0, -0.05, 0.205, Math.PI * 0.86, Math.PI * 0.14, true);
  const g = new THREE.ExtrudeGeometry(s, { depth: 0.008, bevelEnabled: true, bevelThickness: 0.002, bevelSize: 0.002, bevelSegments: 1, curveSegments: 24 });
  g.translate(0, -0.12, -0.004);
  return g;
}

/** Curved katana blade along +y (hilt at 0), edge on +x. */
function bladeGeometry() {
  const L = 0.98;
  const y0 = 0.1;
  const sori = (s: number) => -0.045 * s * s;
  const w = (s: number) => 0.034 - 0.01 * s;
  const shape = new THREE.Shape();
  const N = 16;
  shape.moveTo(sori(0), y0);
  for (let i = 1; i <= N; i++) {
    const s = i / N;
    shape.lineTo(sori(s), y0 + s * L);
  }
  // kissaki (tip) sweep
  shape.quadraticCurveTo(sori(1) + 0.03, y0 + L + 0.03, sori(1) + w(1), y0 + L - 0.02);
  const edgePts: THREE.Vector3[] = [new THREE.Vector3(sori(1) + 0.012, y0 + L + 0.022, 0)];
  for (let i = N - 1; i >= 0; i--) {
    const s = i / N;
    shape.lineTo(sori(s) + w(s), y0 + s * L - (i === N - 1 ? 0.02 : 0));
  }
  shape.closePath();
  for (let i = N; i >= 0; i--) {
    const s = i / N;
    edgePts.push(new THREE.Vector3(sori(s) + w(s) + 0.001, y0 + s * L, 0));
  }
  const geo = new THREE.ExtrudeGeometry(shape, { depth: 0.006, bevelEnabled: true, bevelThickness: 0.003, bevelSize: 0.0035, bevelSegments: 2, curveSegments: 6 });
  geo.translate(0, 0, -0.003);
  geo.computeVertexNormals();
  const curve = new THREE.CatmullRomCurve3(edgePts.reverse());
  const edge = new THREE.TubeGeometry(curve, 48, 0.0022, 4, false);
  const glow = new THREE.TubeGeometry(curve, 48, 0.011, 6, false);
  return { geo, edge, glow };
}

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

/* ───────────────────────── character parts ───────────────────────── */

function Kabuto({ m }: { m: Mats }) {
  const crest = useMemo(() => crescent(), []);
  useEffect(() => () => crest.dispose(), [crest]);
  return (
    <group>
      {/* bowl */}
      <mesh material={m.armor} position={[0, 0.06, -0.005]} scale={[1, 0.92, 1.08]} castShadow>
        <sphereGeometry args={[0.14, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
      </mesh>
      {/* suji ridges */}
      {[-0.9, -0.45, 0, 0.45, 0.9].map((r) => (
        <mesh key={r} material={m.graphite} position={[0, 0.06, -0.005]} rotation={[0, r, 0]} scale={[1, 0.92, 1.08]}>
          <torusGeometry args={[0.141, 0.0035, 4, 32, Math.PI]} />
        </mesh>
      ))}
      {/* brim */}
      <mesh material={m.graphite} position={[0, 0.055, 0.0]} scale={[1, 1, 1.1]}>
        <torusGeometry args={[0.145, 0.009, 6, 40]} />
      </mesh>
      {/* shikoro — flared lamellar neck guard, open at the front */}
      {[0, 1, 2, 3].map((i) => (
        <mesh key={i} material={m.armor} position={[0, 0.02 - i * 0.04, -0.01]}>
          <cylinderGeometry args={[0.145 + i * 0.022, 0.17 + i * 0.026, 0.045, 40, 1, true, 1.35, Math.PI * 2 - 2.7]} />
        </mesh>
      ))}
      {/* fukigaeshi — swept-back wings */}
      {[-1, 1].map((s) => (
        <RoundedBox key={s} args={[0.016, 0.07, 0.06]} radius={0.008} smoothness={2} material={m.armor} position={[s * 0.16, 0.04, 0.06]} rotation={[0, s * 0.5, s * -0.25]} />
      ))}
      {/* mempo face mask with visor slit */}
      <mesh material={m.armor} position={[0, -0.02, 0.012]} scale={[0.92, 1.05, 1]}>
        <sphereGeometry args={[0.118, 28, 16, -Math.PI * 0.42, Math.PI * 0.84, Math.PI * 0.32, Math.PI * 0.5]} />
      </mesh>
      <mesh material={m.lime} position={[0, 0.012, 0.012]}>
        <cylinderGeometry args={[0.112, 0.112, 0.008, 24, 1, true, -0.62, 1.24]} />
      </mesh>
      <mesh material={m.limeSoft} position={[0, 0.012, 0.012]}>
        <cylinderGeometry args={[0.11, 0.11, 0.02, 24, 1, true, -0.7, 1.4]} />
      </mesh>
      {/* mabizashi — visor peak */}
      <mesh material={m.armor} position={[0, 0.07, 0.0]} rotation={[0.18, 0, 0]} scale={[1, 1, 1.12]}>
        <cylinderGeometry args={[0.165, 0.175, 0.012, 32, 1, false, -1.0, 2.0]} />
      </mesh>
      {/* chin guard (yodare-kake) */}
      {[0, 1].map((i) => (
        <mesh key={i} material={i ? m.graphite : m.armor} position={[0, -0.13 - i * 0.035, 0.03]}>
          <cylinderGeometry args={[0.1 + i * 0.02, 0.12 + i * 0.022, 0.035, 28, 1, true, -1.2, 2.4]} />
        </mesh>
      ))}
      {/* maedate crest + forehead node */}
      <mesh geometry={crest} material={m.armor} position={[0, 0.17, 0.12]} rotation={[-0.25, 0, 0]} scale={0.8} />
      <mesh material={m.lime} position={[0, 0.095, 0.142]}>
        <octahedronGeometry args={[0.013]} />
      </mesh>
    </group>
  );
}

function Sode({ m, side }: { m: Mats; side: 1 | -1 }) {
  return (
    <group position={[side * 0.25, 0.53, 0]} rotation={[0, 0, side * 0.42]}>
      {[0, 1, 2].map((i) => (
        <RoundedBox
          key={i}
          args={[0.2 + i * 0.012, 0.065, 0.22 + i * 0.01]}
          radius={0.018}
          smoothness={2}
          material={i === 1 ? m.graphite : m.armor}
          position={[side * (0.07 + i * 0.012), -0.02 - i * 0.07, 0]}
          castShadow
        />
      ))}
      <mesh material={m.lime} position={[side * 0.1, -0.2, 0.123]}>
        <boxGeometry args={[0.2, 0.004, 0.004]} />
      </mesh>
    </group>
  );
}

function Torso({ m }: { m: Mats }) {
  const lathe = useMemo(() => {
    const pts = [
      [0.18, 0.0],
      [0.2, 0.12],
      [0.235, 0.28],
      [0.255, 0.42],
      [0.24, 0.52],
      [0.16, 0.6],
      [0.07, 0.62],
    ].map(([r, y]) => new THREE.Vector2(r, y));
    return new THREE.LatheGeometry(pts, 40);
  }, []);
  useEffect(() => () => lathe.dispose(), [lathe]);
  return (
    <group>
      <mesh geometry={lathe} material={m.armor} scale={[1, 1, 0.74]} castShadow />
      {/* lamellar bands */}
      {[0.1, 0.19, 0.28].map((y, i) => (
        <mesh key={y} material={m.graphite} position={[0, y, 0]} scale={[1, 1, 0.74]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.205 + i * 0.017, 0.0045, 4, 48]} />
        </mesh>
      ))}
      {/* chest accent: lime arc + core */}
      <mesh material={m.lime} position={[0, 0.42, 0]} scale={[1, 1, 0.74]} rotation={[Math.PI / 2, 0, Math.PI / 2 + 0.75]}>
        <torusGeometry args={[0.258, 0.0035, 4, 32, 1.5]} />
      </mesh>
      <mesh material={m.lime} position={[0, 0.36, 0.19]} rotation={[0.25, 0, Math.PI / 4]}>
        <boxGeometry args={[0.022, 0.022, 0.01]} />
      </mesh>
      {/* obi */}
      <mesh material={m.lacing} position={[0, 0.0, 0]} scale={[1, 1, 0.76]}>
        <cylinderGeometry args={[0.2, 0.195, 0.07, 32]} />
      </mesh>
      {/* collar */}
      <mesh material={m.graphite} position={[0, 0.63, 0]}>
        <cylinderGeometry args={[0.065, 0.085, 0.07, 20]} />
      </mesh>
      <Sode m={m} side={1} />
      <Sode m={m} side={-1} />
    </group>
  );
}

function Kusazuri({ m }: { m: Mats }) {
  // hanging tassets: four panels, two tiers, gap between the legs
  const panels = [-2.25, -0.75, 0.75, 2.25].map((c) => c * 0.62);
  return (
    <group position={[0, 0.93, 0]}>
      {panels.map((a, i) =>
        [0, 1].map((tier) => (
          <mesh key={`${i}-${tier}`} material={tier ? m.graphite : m.armor} position={[0, -0.06 - tier * 0.11, 0]} scale={[1, 1, 0.8]}>
            <cylinderGeometry args={[0.215 + tier * 0.03, 0.245 + tier * 0.035, 0.12, 12, 1, true, a - 0.36, 0.72]} />
          </mesh>
        )),
      )}
      <mesh material={m.lime} position={[0, -0.235, 0]} scale={[1, 1, 0.8]} rotation={[Math.PI / 2, 0, -Math.PI / 2 - 0.465]}>
        <torusGeometry args={[0.28, 0.003, 4, 16, 0.6]} />
      </mesh>
    </group>
  );
}

function Leg({ m, side, legRef }: { m: Mats; side: 1 | -1; legRef: React.Ref<THREE.Group> }) {
  return (
    <group ref={legRef} position={[side * 0.11, 0.9, 0]}>
      {/* hakama — wide pleated trousers */}
      <mesh material={m.cloth} position={[side * 0.02, -0.42, 0]} castShadow>
        <cylinderGeometry args={[0.11, 0.21, 0.82, 20, 1, false]} />
      </mesh>
      {/* suneate shin guard */}
      <mesh material={m.armor} position={[side * 0.025, -0.6, 0.1]} rotation={[-0.08, 0, 0]}>
        <cylinderGeometry args={[0.105, 0.135, 0.3, 16, 1, true, -1, 2]} />
      </mesh>
      <mesh material={m.lime} position={[side * 0.025, -0.47, 0.205]} rotation={[-0.08, 0, 0]}>
        <boxGeometry args={[0.004, 0.06, 0.004]} />
      </mesh>
      {/* foot */}
      <RoundedBox args={[0.1, 0.06, 0.24]} radius={0.02} smoothness={2} material={m.lacing} position={[side * 0.02, -0.87, 0.05]} />
    </group>
  );
}

const UP = new THREE.Vector3(0, 1, 0);
const DOWN = new THREE.Vector3(0, -1, 0);
const L1 = 0.35;
const L2 = 0.35;

function Arm({ m, upperRef, foreRef }: { m: Mats; upperRef: React.Ref<THREE.Group>; foreRef: React.Ref<THREE.Group> }) {
  return (
    <>
      <group ref={upperRef}>
        <mesh material={m.lacing} position={[0, -L1 / 2, 0]}>
          <capsuleGeometry args={[0.05, L1 - 0.08, 4, 12]} />
        </mesh>
        <mesh material={m.armor} position={[0, -L1 * 0.55, 0]}>
          <cylinderGeometry args={[0.062, 0.056, L1 * 0.55, 14, 1, true]} />
        </mesh>
      </group>
      <group ref={foreRef}>
        <mesh material={m.lacing} position={[0, -L2 / 2, 0]}>
          <capsuleGeometry args={[0.044, L2 - 0.07, 4, 12]} />
        </mesh>
        {/* kote bracer */}
        <mesh material={m.armor} position={[0, -L2 * 0.5, 0]}>
          <cylinderGeometry args={[0.058, 0.05, L2 * 0.62, 14]} />
        </mesh>
        <mesh material={m.lime} position={[0, -L2 * 0.82, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.05, 0.003, 4, 24]} />
        </mesh>
        <RoundedBox args={[0.07, 0.085, 0.06]} radius={0.018} smoothness={2} material={m.graphite} position={[0, -L2 - 0.02, 0]} />
      </group>
    </>
  );
}

function Katana({ m, glowRef, kRef }: { m: Mats; glowRef: React.Ref<THREE.MeshBasicMaterial>; kRef: React.Ref<THREE.Group> }) {
  const { geo, edge, glow } = useMemo(() => bladeGeometry(), []);
  useEffect(() => () => [geo, edge, glow].forEach((g) => g.dispose()), [geo, edge, glow]);
  return (
    <group ref={kRef}>
      {/* tsuka (wrapped grip) */}
      <mesh material={m.lacing} position={[0, -0.06, 0]}>
        <cylinderGeometry args={[0.017, 0.019, 0.27, 10]} />
      </mesh>
      {[-0.16, -0.1, -0.04, 0.02].map((y) => (
        <mesh key={y} material={m.graphite} position={[0, y, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.019, 0.003, 4, 12]} />
        </mesh>
      ))}
      <mesh material={m.graphite} position={[0, -0.2, 0]}>
        <cylinderGeometry args={[0.021, 0.019, 0.02, 12]} />
      </mesh>
      {/* tsuba */}
      <mesh material={m.graphite} position={[0, 0.082, 0]}>
        <cylinderGeometry args={[0.048, 0.048, 0.01, 28]} />
      </mesh>
      <mesh material={m.lime} position={[0, 0.082, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.048, 0.0025, 4, 32]} />
      </mesh>
      <mesh material={m.graphite} position={[0.012, 0.098, 0]}>
        <boxGeometry args={[0.04, 0.024, 0.014]} />
      </mesh>
      {/* blade */}
      <mesh geometry={geo} material={m.blade} />
      <mesh geometry={edge} material={m.lime} />
      <mesh geometry={glow}>
        <meshBasicMaterial ref={glowRef} color={LIME} transparent opacity={0.2} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
      </mesh>
    </group>
  );
}

function Saya({ m, sRef }: { m: Mats; sRef: React.Ref<THREE.Group> }) {
  return (
    <group ref={sRef}>
      <mesh material={m.armor} position={[0, 0.5, 0]} scale={[1.25, 1, 0.75]}>
        <cylinderGeometry args={[0.022, 0.026, 1.0, 14]} />
      </mesh>
      <mesh material={m.lime} position={[0, 0.005, 0]} rotation={[Math.PI / 2, 0, 0]} scale={[1.25, 0.75, 1]}>
        <torusGeometry args={[0.027, 0.0035, 4, 20]} />
      </mesh>
      <mesh material={m.graphite} position={[0, 1.0, 0]} scale={[1.25, 1, 0.75]}>
        <cylinderGeometry args={[0.03, 0.024, 0.05, 14]} />
      </mesh>
    </group>
  );
}

/* ───────────────────────── the samurai rig ───────────────────────── */

const tmpColor = new THREE.Color();
const tmp = {
  a: [0, 0, 0, 0, 0, 0],
  v: new THREE.Vector3(),
  w: new THREE.Vector3(),
  e: new THREE.Vector3(),
  q: new THREE.Quaternion(),
  m: new THREE.Matrix4(),
  x: new THREE.Vector3(),
  y: new THREE.Vector3(),
  z: new THREE.Vector3(),
};

/** Two-bone IK. Writes bone orientations + returns the wrist position in `out`. */
function solveArm(shoulder: THREE.Vector3, target: THREE.Vector3, pole: THREE.Vector3, upper: THREE.Group, fore: THREE.Group, out: THREE.Vector3) {
  const dir = tmp.v.subVectors(target, shoulder);
  const d = THREE.MathUtils.clamp(dir.length(), 0.08, L1 + L2 - 0.002);
  dir.normalize();
  const cosA = THREE.MathUtils.clamp((L1 * L1 + d * d - L2 * L2) / (2 * L1 * d), -1, 1);
  const sinA = Math.sqrt(1 - cosA * cosA);
  const bend = tmp.w.copy(pole).addScaledVector(dir, -pole.dot(dir)).normalize();
  const elbow = tmp.e.copy(shoulder).addScaledVector(dir, cosA * L1).addScaledVector(bend, sinA * L1);

  upper.position.copy(shoulder);
  upper.quaternion.setFromUnitVectors(DOWN, tmp.x.subVectors(elbow, shoulder).normalize());
  fore.position.copy(elbow);
  const foreDir = tmp.y.subVectors(target, elbow).normalize();
  fore.quaternion.setFromUnitVectors(DOWN, foreDir);
  out.copy(elbow).addScaledVector(foreDir, L2);
}

function Samurai({ clockRef, lite }: { clockRef: React.RefObject<number>; lite: boolean }) {
  const m = useMaterials();
  const root = useRef<THREE.Group>(null);
  const torso = useRef<THREE.Group>(null);
  const head = useRef<THREE.Group>(null);
  const legL = useRef<THREE.Group>(null);
  const legR = useRef<THREE.Group>(null);
  const uR = useRef<THREE.Group>(null);
  const fR = useRef<THREE.Group>(null);
  const uL = useRef<THREE.Group>(null);
  const fL = useRef<THREE.Group>(null);
  const katana = useRef<THREE.Group>(null);
  const saya = useRef<THREE.Group>(null);
  const glowMat = useRef<THREE.MeshBasicMaterial>(null);
  const bladeLight = useRef<THREE.PointLight>(null);
  const key = useRef<THREE.SpotLight>(null);
  const trail = useTrail(lite);

  useEffect(() => () => Object.values(m).forEach((mat) => mat.dispose()), [m]);

  const s = useMemo(
    () => ({
      handR: new THREE.Vector3(),
      handL: new THREE.Vector3(),
      wrist: new THREE.Vector3(),
      blade: new THREE.Vector3(),
      edge: new THREE.Vector3(),
      sayaDir: new THREE.Vector3().fromArray(SAYA_DIR),
      sayaMouth: new THREE.Vector3(),
      shR: new THREE.Vector3(),
      shL: new THREE.Vector3(),
      poleR: new THREE.Vector3(-0.8, -0.25, -0.55).normalize(),
      poleL: new THREE.Vector3(0.8, -0.35, -0.5).normalize(),
      tip: new THREE.Vector3(),
      mid: new THREE.Vector3(),
    }),
    [],
  );

  useFrame(() => {
    const t = clockRef.current;
    const a = tmp.a;
    if (!root.current || !torso.current || !head.current || !katana.current || !saya.current) return;

    // root glide + measured steps
    sample(K.root, t, a);
    root.current.position.set(a[0], a[1], a[2]);
    const walk = clamp01(1 - t / 1.15);
    const stride = Math.sin(t * Math.PI * 1.9) * 0.32 * walk;
    legL.current?.rotation.set(stride, 0, 0);
    legR.current?.rotation.set(-stride, 0, 0);
    const breathe = Math.sin(t * 2.4) * 0.01;

    sample(K.torso, t, a);
    torso.current.rotation.set(a[0] + breathe, a[1], a[2]);
    torso.current.position.y = 0.95 - Math.abs(stride) * 0.04;
    sample(K.head, t, a);
    head.current.rotation.set(a[0], a[1], 0);
    torso.current.updateMatrix();

    // shoulders in root space
    s.shR.set(-0.255, 0.5, 0).applyMatrix4(torso.current.matrix);
    s.shL.set(0.255, 0.5, 0).applyMatrix4(torso.current.matrix);

    // saya: fixed to the left hip, slides back during the draw
    sample(K.sayaBack, t, a);
    s.sayaMouth.fromArray(HILT).addScaledVector(s.sayaDir, 0.11 + a[0]);
    saya.current.position.copy(s.sayaMouth);
    saya.current.quaternion.setFromUnitVectors(UP, s.sayaDir);

    // right hand drives the katana
    sample(K.handR, t, a);
    s.handR.fromArray(a);
    if (uR.current && fR.current) solveArm(s.shR, s.handR, s.poleR, uR.current, fR.current, s.wrist);

    // blade orientation — until the tip clears, it is threaded through the saya mouth
    sample(K.blade, t, a);
    s.blade.fromArray(a).normalize();
    const free = THREE.MathUtils.smoothstep(t, 1.42, 1.58);
    if (free < 1) {
      tmp.v.subVectors(s.sayaMouth, s.wrist).normalize();
      s.blade.lerp(tmp.v, 1 - free).normalize();
    }
    sample(K.edge, t, a);
    s.edge.fromArray(a);
    s.edge.addScaledVector(s.blade, -s.edge.dot(s.blade)).normalize();
    // the hand grips just below the wrist, along the blade axis
    katana.current.position.copy(s.wrist).addScaledVector(s.blade, 0.03);
    tmp.z.crossVectors(s.edge, s.blade);
    tmp.m.makeBasis(s.edge, s.blade, tmp.z);
    katana.current.quaternion.setFromRotationMatrix(tmp.m);

    // left hand: koiguchi grip → joins the hilt for the cut
    sample(K.leftMode, t, a);
    const onHilt = a[0];
    tmp.v.copy(s.sayaMouth).addScaledVector(s.sayaDir, 0.05).add(tmp.w.set(0.035, -0.01, 0));
    tmp.w.copy(katana.current.position).addScaledVector(s.blade, -0.15);
    s.handL.lerpVectors(tmp.v, tmp.w, onHilt);
    if (uL.current && fL.current) solveArm(s.shL, s.handL, s.poleL, uL.current, fL.current, tmp.e);

    // lights
    sample(K.lights, t, a);
    if (key.current) key.current.intensity = 20 * a[0];
    if (glowMat.current) glowMat.current.opacity = 0.12 + a[1] * 0.45;
    katana.current.updateMatrixWorld();
    s.tip.set(-0.04, 1.06, 0).applyMatrix4(katana.current.matrixWorld);
    s.mid.set(-0.02, 0.5, 0).applyMatrix4(katana.current.matrixWorld);
    if (bladeLight.current) {
      bladeLight.current.position.copy(s.mid);
      bladeLight.current.intensity = 1.2 + a[1] * 4;
    }
    trail.push(s.tip, s.mid, t);
  });

  return (
    <>
      <spotLight ref={key} position={[2.2, 4.2, 3.4]} angle={0.5} penumbra={0.9} intensity={0} color={PAPER} distance={14} decay={1.6} />
      <pointLight ref={bladeLight} color={LIME} intensity={0} distance={2.6} decay={2} />
      <group ref={root}>
        <group ref={torso} position={[0, 0.95, 0]}>
          <Torso m={m} />
          <group ref={head} position={[0, 0.74, 0.01]}>
            <Kabuto m={m} />
          </group>
        </group>
        <Kusazuri m={m} />
        <Leg m={m} side={1} legRef={legL} />
        <Leg m={m} side={-1} legRef={legR} />
        <Arm m={m} upperRef={uR} foreRef={fR} />
        <Arm m={m} upperRef={uL} foreRef={fL} />
        <Saya m={m} sRef={saya} />
        <Katana m={m} glowRef={glowMat} kRef={katana} />
      </group>
      <primitive object={trail.mesh} />
      <primitive object={trail.sparks} />
    </>
  );
}

/* ───────────────────────── slash trail + sparks ───────────────────────── */

function useTrail(lite: boolean) {
  const api = useMemo(() => {
    const N = 26;
    const pos = new Float32Array(N * 2 * 3);
    const col = new Float32Array(N * 2 * 3);
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    geo.setAttribute("color", new THREE.BufferAttribute(col, 3));
    const idx: number[] = [];
    for (let i = 0; i < N - 1; i++) {
      const a = i * 2;
      idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
    }
    geo.setIndex(idx);
    const mat = new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, toneMapped: false });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.frustumCulled = false;
    const samples = Array.from({ length: N }, () => ({ tip: new THREE.Vector3(), mid: new THREE.Vector3(), t: -10 }));

    // warm-white sparks shed from the blade tip during the cut
    const S = lite ? 40 : 90;
    const sp = new Float32Array(S * 3);
    const sc = new Float32Array(S * 3);
    const vel = new Float32Array(S * 3);
    const born = new Float32Array(S).fill(-10);
    const sgeo = new THREE.BufferGeometry();
    sgeo.setAttribute("position", new THREE.BufferAttribute(sp, 3));
    sgeo.setAttribute("color", new THREE.BufferAttribute(sc, 3));
    const smat = new THREE.PointsMaterial({ size: lite ? 0.03 : 0.022, vertexColors: true, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false, sizeAttenuation: true });
    const sparks = new THREE.Points(sgeo, smat);
    sparks.frustumCulled = false;
    const st = { head: 0, lastT: 0 };
    const rand = seeded(11);
    const lime = LIME;
    const paper = PAPER;

    function push(tip: THREE.Vector3, mid: THREE.Vector3, t: number) {
      const dt = Math.max(0, Math.min(0.05, t - st.lastT));
      st.lastT = t;
      const active = (t > 1.5 && t < 1.75) || (t > T.slash - 0.02 && t < T.slashEnd + 0.08);
      for (let i = N - 1; i > 0; i--) {
        samples[i].tip.copy(samples[i - 1].tip);
        samples[i].mid.copy(samples[i - 1].mid);
        samples[i].t = samples[i - 1].t;
      }
      samples[0].tip.copy(tip);
      samples[0].mid.copy(mid);
      samples[0].t = active ? t : -10;
      const strong = t > T.slash - 0.05 ? 1 : 0.18;
      for (let i = 0; i < N; i++) {
        const sm = samples[i];
        const age = t - sm.t;
        const k = sm.t < 0 ? 0 : Math.max(0, 1 - age / 0.2) * (1 - i / N) * strong;
        sm.tip.toArray(pos, i * 6);
        // ribbon hugs the outer half of the blade, narrowing as it fades
        tmp.v.lerpVectors(sm.tip, sm.mid, 0.25 + 0.75 * k);
        tmp.v.toArray(pos, i * 6 + 3);
        const c = tmpColor.copy(lime).lerp(paper, i < 3 ? 0.55 : 0);
        col[i * 6] = c.r * k;
        col[i * 6 + 1] = c.g * k;
        col[i * 6 + 2] = c.b * k;
        col[i * 6 + 3] = c.r * k * 0.15;
        col[i * 6 + 4] = c.g * k * 0.15;
        col[i * 6 + 5] = c.b * k * 0.15;
      }
      geo.attributes.position.needsUpdate = true;
      geo.attributes.color.needsUpdate = true;

      // sparks
      if (t > T.slash + 0.05 && t < T.slashEnd) {
        for (let e = 0; e < (lite ? 2 : 4); e++) {
          const j = st.head++ % S;
          const f = rand();
          tmp.v.lerpVectors(tip, mid, f * 0.5);
          tmp.v.toArray(sp, j * 3);
          vel[j * 3] = (rand() - 0.5) * 1.6;
          vel[j * 3 + 1] = rand() * 0.9 - 0.2;
          vel[j * 3 + 2] = (rand() - 0.5) * 1.6;
          born[j] = t;
        }
      }
      for (let j = 0; j < S; j++) {
        const age = t - born[j];
        const life = age < 0 || age > 0.9 ? 0 : 1 - age / 0.9;
        sp[j * 3] += vel[j * 3] * dt;
        sp[j * 3 + 1] += (vel[j * 3 + 1] -= 2.2 * dt) * dt;
        sp[j * 3 + 2] += vel[j * 3 + 2] * dt;
        const c = j % 4 === 0 ? lime : paper;
        sc[j * 3] = c.r * life;
        sc[j * 3 + 1] = c.g * life;
        sc[j * 3 + 2] = c.b * life;
      }
      sgeo.attributes.position.needsUpdate = true;
      sgeo.attributes.color.needsUpdate = true;
    }
    return { mesh, sparks, push, dispose: () => [geo, mat, sgeo, smat].forEach((x) => x.dispose()) };
  }, [lite]);
  useEffect(() => () => api.dispose(), [api]);
  return api;
}

/* ───────────────────────── environment ───────────────────────── */

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
        <meshStandardMaterial color="#0b0b0a" roughness={0.45} metalness={0.6} envMapIntensity={0.4} />
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

/* ───────────────────────── camera + clockRef ───────────────────────── */

function Director({ clockRef, startAtRef, freezeAt, onReady, portrait }: { clockRef: React.RefObject<number>; startAtRef: React.RefObject<number | null>; freezeAt?: number; onReady: () => void; portrait: boolean }) {
    const fired = useRef(false);
  const look = useMemo(() => new THREE.Vector3(), []);
  const a = useMemo(() => [0, 0, 0, 0, 0, 0], []);
  useFrame((state) => {
    if (!fired.current) {
      fired.current = true;
      startAtRef.current = performance.now();
      onReady();
    }
    const t = freezeAt ?? (performance.now() - (startAtRef.current ?? performance.now())) / 1000;
    clockRef.current = t;
    sample(K.cam, t, a);
    // portrait: pull back + recentre so the whole figure and blade stay in frame
    const pull = portrait ? 1.32 : 1;
    const camera = state.camera;
    camera.position.set(a[0] * (portrait ? 1.2 : 1), a[1] + (portrait ? 0.15 : 0), a[2] * pull);
    // impact shake
    const shake = Math.max(0, 1 - Math.abs(t - T.impact - 0.05) / 0.12) * 0.03;
    camera.position.x += Math.sin(t * 90) * shake;
    camera.position.y += Math.cos(t * 75) * shake;
    look.set(a[3], a[4] - (portrait ? 0.05 : 0), a[5]);
    camera.lookAt(look);
    if (state.scene.fog) (state.scene.fog as THREE.Fog).far = portrait ? 13 : 10;
  });
  return null;
}

/* ───────────────────────── canvas ───────────────────────── */

export default function SamuraiScene({ lite, portrait, freezeAt, onReady }: { lite: boolean; portrait: boolean; freezeAt?: number; onReady: () => void }) {
  const clockRef = useRef(0);
  const startAtRef = useRef<number | null>(null);
  const [fogNear, fogFar] = [3.5, 10];

  useLayoutEffect(() => {
    clockRef.current = 0;
  }, []);

  return (
    <Canvas
      dpr={lite ? [1, 1.25] : [1, 1.75]}
      camera={{ position: [2.6, 0.55, 6.2], fov: portrait ? 46 : 32, near: 0.1, far: 40 }}
      gl={{ antialias: !lite, alpha: false, powerPreference: "high-performance" }}
      onCreated={({ gl, scene }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 1.1;
        scene.background = new THREE.Color(INK);
        scene.fog = new THREE.Fog(INK, fogNear, fogFar);
      }}
      aria-hidden
    >
      <ambientLight intensity={0.06} />
      {/* rim lights: warm-white from behind left, lime from behind right */}
      <directionalLight position={[-3, 3, -4]} intensity={2.4} color={PAPER} />
      <directionalLight position={[3.5, 2, -3]} intensity={1.6} color={LIME} />
      <directionalLight position={[0, 1, 4]} intensity={0.15} />

      <Environment resolution={lite ? 64 : 128} frames={1}>
        <Lightformer form="rect" intensity={3} position={[0, 5, -4]} scale={[10, 1, 1]} />
        <Lightformer form="rect" intensity={1.4} position={[-5, 1.5, 1]} rotation-y={Math.PI / 2} scale={[6, 0.5, 1]} />
        <Lightformer form="rect" intensity={2.4} color="#c8f135" position={[5, 0.5, 0]} rotation-y={-Math.PI / 2} scale={[5, 0.2, 1]} />
        <Lightformer form="rect" intensity={1} position={[0, 2, 5]} scale={[3, 0.3, 1]} />
      </Environment>

      <Samurai clockRef={clockRef} lite={lite} />
      <Atmosphere lite={lite} clockRef={clockRef} />
      <Director clockRef={clockRef} startAtRef={startAtRef} freezeAt={freezeAt} onReady={onReady} portrait={portrait} />
    </Canvas>
  );
}
