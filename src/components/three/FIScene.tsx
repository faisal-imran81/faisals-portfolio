"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment, Lightformer } from "@react-three/drei";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";

const LIME = new THREE.Color("#c8f135");
const PAPER = new THREE.Color("#efece4");

type SceneProps = {
  /** lighter geometry + fewer particles for phones */
  lite: boolean;
  /** freeze ambient motion for prefers-reduced-motion */
  still: boolean;
  /** pause rendering entirely (e.g. scrolled off screen) */
  paused: boolean;
  /** called once the first frame has rendered */
  onReady?: () => void;
};

/* ───────────────────────── Geometry builders ───────────────────────── */

function buildMonogram() {
  // F — constructed from a single outline so bevels read as one machined part
  const f = new THREE.Shape();
  f.moveTo(0, 0);
  f.lineTo(0.62, 0);
  f.lineTo(0.62, 1.45);
  f.lineTo(1.75, 1.45);
  f.lineTo(1.75, 2.05);
  f.lineTo(0.62, 2.05);
  f.lineTo(0.62, 2.8);
  f.lineTo(2.25, 2.8);
  f.lineTo(2.25, 3.4);
  f.lineTo(0, 3.4);
  f.closePath();

  // I — a shorter stem; its "dot" becomes a live node rendered separately
  const i = new THREE.Shape();
  i.moveTo(2.75, 0);
  i.lineTo(3.37, 0);
  i.lineTo(3.37, 2.5);
  i.lineTo(2.75, 2.5);
  i.closePath();

  const depth = 0.55;
  const geo = new THREE.ExtrudeGeometry([f, i], {
    depth,
    bevelEnabled: true,
    bevelThickness: 0.045,
    bevelSize: 0.035,
    bevelSegments: 4,
    curveSegments: 1,
  });
  geo.translate(-1.685, -1.7, -depth / 2);
  geo.computeVertexNormals();
  const edges = new THREE.EdgesGeometry(geo, 25);
  return { geo, edges, dot: new THREE.Vector3(3.06 - 1.685, 3.06 - 1.7, 0) };
}

function seeded(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function buildNetwork(count: number) {
  const rand = seeded(7);
  const nodes: THREE.Vector3[] = [];
  for (let k = 0; k < count; k++) {
    const theta = rand() * Math.PI * 2;
    const phi = Math.acos(2 * rand() - 1);
    const r = 3.3 + rand() * 1.5;
    nodes.push(new THREE.Vector3(r * Math.sin(phi) * Math.cos(theta), r * Math.cos(phi) * 0.75, r * Math.sin(phi) * Math.sin(theta)));
  }
  const pts: number[] = [];
  for (let a = 0; a < nodes.length; a++) {
    for (let b = a + 1; b < nodes.length; b++) {
      if (nodes[a].distanceTo(nodes[b]) < 2.7) pts.push(...nodes[a].toArray(), ...nodes[b].toArray());
    }
  }
  const lines = new THREE.BufferGeometry();
  lines.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3));
  return { nodes, lines };
}

function buildParticles(count: number) {
  const rand = seeded(42);
  const arr = new Float32Array(count * 3);
  for (let k = 0; k < count; k++) {
    const r = 2.5 + Math.pow(rand(), 0.6) * 6;
    const theta = rand() * Math.PI * 2;
    const phi = Math.acos(2 * rand() - 1);
    arr[k * 3] = r * Math.sin(phi) * Math.cos(theta);
    arr[k * 3 + 1] = r * Math.cos(phi) * 0.7;
    arr[k * 3 + 2] = r * Math.sin(phi) * Math.sin(theta) - 1.5;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(arr, 3));
  return geo;
}

function buildDial(radius: number) {
  // blueprint measurement ring: 120 ticks, every 10th long
  const pts: number[] = [];
  for (let k = 0; k < 120; k++) {
    const a = (k / 120) * Math.PI * 2;
    const len = k % 10 === 0 ? 0.28 : 0.1;
    pts.push(Math.cos(a) * radius, Math.sin(a) * radius, 0, Math.cos(a) * (radius - len), Math.sin(a) * (radius - len), 0);
  }
  // crosshair
  pts.push(-radius - 0.4, 0, 0, -radius + 0.6, 0, 0, radius - 0.6, 0, 0, radius + 0.4, 0, 0);
  pts.push(0, -radius - 0.4, 0, 0, -radius + 0.6, 0, 0, radius - 0.6, 0, 0, radius + 0.4, 0);
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3));
  return geo;
}

/* ───────────────────────── Scene parts ───────────────────────── */

function Monogram({ still }: { still: boolean }) {
  const { geo, edges, dot } = useMemo(() => buildMonogram(), []);
  const edgeMat = useRef<THREE.LineBasicMaterial>(null);
  const ghostMat = useRef<THREE.LineBasicMaterial>(null);
  const dotRef = useRef<THREE.Mesh>(null);
  const halo = useRef<THREE.Mesh>(null);
  const hovered = useRef(false);

  useEffect(() => () => {
    geo.dispose();
    edges.dispose();
  }, [geo, edges]);

  useFrame((state, dt) => {
    const t = state.clock.elapsedTime;
    const h = hovered.current ? 1 : 0;
    if (edgeMat.current) edgeMat.current.opacity = THREE.MathUtils.damp(edgeMat.current.opacity, 0.35 + h * 0.55, 6, dt);
    if (ghostMat.current) ghostMat.current.opacity = THREE.MathUtils.damp(ghostMat.current.opacity, 0.1 + h * 0.18, 6, dt);
    if (dotRef.current) {
      const pulse = still ? 1 : 1 + Math.sin(t * 2.2) * 0.06;
      const s = THREE.MathUtils.damp(dotRef.current.scale.x, pulse * (1 + h * 0.25), 8, dt);
      dotRef.current.scale.setScalar(s);
    }
    if (halo.current) {
      const m = halo.current.material as THREE.MeshBasicMaterial;
      const k = still ? 0.5 : (t * 0.6) % 1;
      halo.current.scale.setScalar(1 + k * 2.2);
      m.opacity = (1 - k) * 0.35;
    }
  });

  return (
    <group
      onPointerOver={(e) => {
        e.stopPropagation();
        hovered.current = true;
        document.body.style.cursor = "crosshair";
      }}
      onPointerOut={() => {
        hovered.current = false;
        document.body.style.cursor = "";
      }}
    >
      <mesh geometry={geo} castShadow>
        <meshPhysicalMaterial
          color="#3b3b36"
          metalness={0.6}
          roughness={0.34}
          clearcoat={1}
          clearcoatRoughness={0.18}
          envMapIntensity={1.25}
        />
      </mesh>
      <lineSegments geometry={edges}>
        <lineBasicMaterial ref={edgeMat} color={LIME} transparent opacity={0.35} depthWrite={false} />
      </lineSegments>
      {/* exploded-drawing ghost: same outline, offset back */}
      <lineSegments geometry={edges} position={[0.22, -0.18, -1.1]}>
        <lineBasicMaterial ref={ghostMat} color={PAPER} transparent opacity={0.1} depthWrite={false} />
      </lineSegments>
      {/* the I's dot — a live node */}
      <mesh ref={dotRef} position={dot}>
        <sphereGeometry args={[0.3, 32, 32]} />
        <meshStandardMaterial color={LIME} emissive={LIME} emissiveIntensity={0.55} />
      </mesh>
      <mesh ref={halo} position={dot}>
        <ringGeometry args={[0.36, 0.38, 48]} />
        <meshBasicMaterial color={LIME} transparent opacity={0.3} depthWrite={false} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

function Orbit({ radius, tilt, speed, still, nodeColor }: { radius: number; tilt: [number, number, number]; speed: number; still: boolean; nodeColor: THREE.Color }) {
  const group = useRef<THREE.Group>(null);
  useFrame((_, dt) => {
    if (!still && group.current) group.current.rotation.z += dt * speed;
  });
  return (
    <group rotation={tilt}>
      <group ref={group}>
        <mesh>
          <torusGeometry args={[radius, 0.0055, 6, 220]} />
          <meshBasicMaterial color={PAPER} transparent opacity={0.22} />
        </mesh>
        <mesh position={[radius, 0, 0]}>
          <sphereGeometry args={[0.065, 16, 16]} />
          <meshBasicMaterial color={nodeColor} toneMapped={false} />
        </mesh>
        <mesh position={[-radius * Math.cos(1.1), radius * Math.sin(1.1), 0]}>
          <sphereGeometry args={[0.035, 12, 12]} />
          <meshBasicMaterial color={PAPER} />
        </mesh>
      </group>
    </group>
  );
}

function Network({ lite, still }: { lite: boolean; still: boolean }) {
  const { nodes, lines } = useMemo(() => buildNetwork(lite ? 12 : 22), [lite]);
  const ref = useRef<THREE.Group>(null);
  useEffect(() => () => lines.dispose(), [lines]);
  useFrame((_, dt) => {
    if (!still && ref.current) ref.current.rotation.y -= dt * 0.03;
  });
  return (
    <group ref={ref}>
      <lineSegments geometry={lines}>
        <lineBasicMaterial color={PAPER} transparent opacity={0.08} depthWrite={false} />
      </lineSegments>
      {nodes.map((p, k) => (
        <mesh key={k} position={p}>
          <boxGeometry args={[0.05, 0.05, 0.05]} />
          <meshBasicMaterial color={k % 7 === 0 ? LIME : PAPER} transparent opacity={k % 7 === 0 ? 1 : 0.55} toneMapped={false} />
        </mesh>
      ))}
    </group>
  );
}

function Particles({ lite, still }: { lite: boolean; still: boolean }) {
  const geo = useMemo(() => buildParticles(lite ? 160 : 520), [lite]);
  const ref = useRef<THREE.Points>(null);
  useEffect(() => () => geo.dispose(), [geo]);
  useFrame((_, dt) => {
    if (!still && ref.current) ref.current.rotation.y += dt * 0.012;
  });
  return (
    <points ref={ref} geometry={geo}>
      <pointsMaterial color={PAPER} size={0.022} sizeAttenuation transparent opacity={0.5} depthWrite={false} />
    </points>
  );
}

function Dial() {
  const geo = useMemo(() => buildDial(5.1), []);
  useEffect(() => () => geo.dispose(), [geo]);
  return (
    <lineSegments geometry={geo} position={[0, 0, -2.2]}>
      <lineBasicMaterial color={PAPER} transparent opacity={0.1} depthWrite={false} />
    </lineSegments>
  );
}

/** Pointer-follow + cinematic entrance applied to the whole rig. */
function Rig({ children, still, lite }: { children: React.ReactNode; still: boolean; lite: boolean }) {
  const ref = useRef<THREE.Group>(null);
  const start = useRef<number | null>(null);
  const { size } = useThree();
  const baseScale = size.width < 520 ? 0.95 : 1;

  useFrame((state, dt) => {
    const g = ref.current;
    if (!g) return;
    if (start.current === null) start.current = state.clock.elapsedTime;
    const t = state.clock.elapsedTime - start.current;
    const enter = still ? 1 : Math.min(1, t / 2.2);
    const ease = 1 - Math.pow(1 - enter, 4);

    const px = lite ? Math.sin(t * 0.25) * 0.35 : state.pointer.x;
    const py = lite ? 0 : state.pointer.y;
    const targetY = still ? -0.35 : -0.35 + px * 0.45 + (1 - ease) * -1.4;
    const targetX = still ? 0.12 : 0.12 - py * 0.28;
    g.rotation.y = THREE.MathUtils.damp(g.rotation.y, targetY, 3.2, dt);
    g.rotation.x = THREE.MathUtils.damp(g.rotation.x, targetX, 3.2, dt);
    g.position.y = still ? 0 : Math.sin(t * 0.7) * 0.08;
    g.scale.setScalar(baseScale * (0.82 + ease * 0.18));
  });

  return <group ref={ref}>{children}</group>;
}

function FirstFrame({ onReady }: { onReady?: () => void }) {
  const fired = useRef(false);
  useFrame(() => {
    if (!fired.current) {
      fired.current = true;
      onReady?.();
    }
  });
  return null;
}

/* ───────────────────────── Canvas ───────────────────────── */

export default function FIScene({ lite, still, paused, onReady }: SceneProps) {
  const dpr: [number, number] = lite ? [1, 1.5] : [1, 1.75];

  useEffect(() => () => {
    document.body.style.cursor = "";
  }, []);

  return (
    <Canvas
      dpr={dpr}
      frameloop={paused ? "never" : still ? "demand" : "always"}
      camera={{ position: [0, 0, 10.5], fov: 38, near: 0.1, far: 60 }}
      gl={{ antialias: !lite, alpha: true, powerPreference: "high-performance" }}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 1.15;
      }}
      performance={{ min: 0.6 }}
      aria-hidden
    >
      <ambientLight intensity={0.35} />
      <directionalLight position={[4, 6, 6]} intensity={1.8} />
      <directionalLight position={[-6, 2, 4]} intensity={0.5} color="#efece4" />
      <pointLight position={[-7, -4, -2]} intensity={10} color="#c8f135" distance={16} decay={2} />

      {/* Studio reflections built from local light-formers — no network HDR fetch */}
      <Environment resolution={lite ? 64 : 256} frames={1}>
        <Lightformer form="rect" intensity={4} position={[0, 5, -6]} scale={[12, 1.2, 1]} />
        <Lightformer form="rect" intensity={2} position={[0, -4, 6]} rotation-x={Math.PI / 2} scale={[10, 2, 1]} />
        <Lightformer form="rect" intensity={1.6} position={[-6, 1, 2]} rotation-y={Math.PI / 2} scale={[8, 0.6, 1]} />
        <Lightformer form="rect" intensity={2.2} color="#c8f135" position={[6, -1, 1]} rotation-y={-Math.PI / 2} scale={[6, 0.25, 1]} />
        <Lightformer form="ring" intensity={1.2} position={[0, 0, 8]} scale={4} />
      </Environment>

      <Rig still={still} lite={lite}>
        <Monogram still={still} />
        <Orbit radius={3.05} tilt={[1.25, 0.15, 0]} speed={0.22} still={still} nodeColor={LIME} />
        <Orbit radius={3.75} tilt={[1.05, -0.55, 0.4]} speed={-0.14} still={still} nodeColor={PAPER} />
        {!lite && <Orbit radius={4.45} tilt={[1.55, 0.6, -0.2]} speed={0.09} still={still} nodeColor={LIME} />}
        <Network lite={lite} still={still} />
        <Dial />
      </Rig>
      <Particles lite={lite} still={still} />
      <FirstFrame onReady={onReady} />
    </Canvas>
  );
}
