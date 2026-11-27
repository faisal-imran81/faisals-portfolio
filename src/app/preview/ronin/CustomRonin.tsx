"use client";
/* eslint-disable react-hooks/immutability -- imperative per-frame three.js mutation in an experiment */

/**
 * EXPERIMENT — custom iaijutsu choreography for RONIN-04 (preview only, not used by the real intro).
 * The katana bone is detached from the hand and mounted in a fitted scabbard on the left hip.
 * We author the SWORD's path (sheathed → drawn → hasso guard → kesa-giri) and derive the hands from it,
 * so the grip is always the model's own rest grip. Arms + legs use two-bone IK; feet stay planted.
 */

import { useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { SkeletonUtils } from "three-stdlib";
import { T } from "@/components/intro/timeline";
import { analyzeSword, buildScabbard, quatFromPairs, setWorldQuat, solveTwoBone, worldPos, worldQuat } from "./rig";

const SRC = "/preview/ronin-04-lime.glb";
const S = 1 / 8;
const LIME = new THREE.Color("#c8f135");
const PAPER = new THREE.Color("#efece4");

/* ───────── keyframe helpers ───────── */
type Ease = (u: number) => number;
const inOut: Ease = (u) => (u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2);
const outExpo: Ease = (u) => (u >= 1 ? 1 : 1 - Math.pow(2, -10 * u));
const inQuad: Ease = (u) => u * u;
type Key = [number, number[], Ease?];
function sample(keys: Key[], t: number) {
  if (t <= keys[0][0]) return keys[0][1].slice();
  for (let i = 0; i < keys.length - 1; i++) {
    const [t0, a] = keys[i];
    const [t1, b, e] = keys[i + 1];
    if (t <= t1) {
      const u = (e ?? inOut)((t - t0) / (t1 - t0));
      return a.map((x, k) => x + (b[k] - x) * u);
    }
  }
  return keys[keys.length - 1][1].slice();
}
const nz = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z).normalize().toArray();
const ss = (t: number, a: number, b: number) => THREE.MathUtils.smoothstep(t, a, b);

/* ───────── choreography (world space; character faces +z, its right is −x) ───────── */
const GRIP = 1.15; // right hand closes on the tsuka
const CLEAR = 1.62; // blade tip leaves the koiguchi
const TWO_HANDS = 1.8;

const K = {
  // pelvis: yaw, dx, dy, dz
  pelvis: [
    [0, [0, 0, -0.015, 0]],
    [GRIP, [0.24, 0, -0.05, 0.02]],
    [CLEAR, [-0.1, 0, -0.09, 0.16]],
    [T.guard, [-0.18, 0, -0.04, 0.02]],
    [T.slash, [-0.22, 0, -0.05, 0.0]],
    [T.impact, [0.18, 0, -0.1, 0.12], inQuad],
    [T.slashEnd, [0.32, 0, -0.13, 0.16], outExpo],
    [4, [0.3, 0, -0.12, 0.15]],
  ] as Key[],
  // chest: yaw, pitch(+ = lean forward), roll
  chest: [
    [0, [0, 0.03, 0]],
    [0.9, [0.05, 0.05, 0]],
    [GRIP, [0.42, 0.18, 0]],
    [CLEAR, [-0.3, 0.1, 0.04]],
    [T.guard, [-0.3, 0.0, 0.05]],
    [T.slash, [-0.36, -0.04, 0.06]],
    [T.impact, [0.25, 0.18, -0.02], inQuad],
    [T.slashEnd, [0.5, 0.3, -0.06], outExpo],
    [4, [0.46, 0.27, -0.05]],
  ] as Key[],
  head: [
    [0, [0, 0.06]],
    [GRIP, [-0.2, 0.22]],
    [T.guard, [0.25, 0.02]],
    [T.slashEnd, [-0.35, 0.15], outExpo],
    [4, [-0.3, 0.12]],
  ] as Key[],
  // right foot step (dz) for the cut
  stepR: [
    [0, [0, 0]],
    [GRIP, [0, 0]],
    [GRIP + 0.18, [0.12, 0.05]],
    [CLEAR, [0.24, 0], outExpo],
    [T.guard, [0.12, 0]],
    [T.slash, [0.1, 0]],
    [T.slash + 0.08, [0.1, 0.06]],
    [T.impact, [0.3, 0], outExpo],
  ] as Key[],
  // free-sword path after the blade clears: grip point P, blade dir B, edge dir E
  free: [
    [T.guard, [-0.21, 1.6, 0.27, ...nz(0.15, 1, -0.38), 0, 0, 1]],
    [T.slash, [-0.24, 1.66, 0.22, ...nz(0.22, 1, -0.55), 0, 0, 1]],
    [T.impact, [-0.01, 1.38, 0.5, ...nz(0.62, 0.22, 1), 0.4, -0.9, 0.2], inQuad],
    [T.slashEnd, [0.16, 1.04, 0.42, ...nz(0.82, -0.52, 0.28), 0.35, -0.5, -0.35], outExpo],
    [4, [0.15, 1.05, 0.41, ...nz(0.8, -0.55, 0.26), 0.35, -0.5, -0.35]],
  ] as Key[],
  // camera on the character's right-front: the kesa-giri then sweeps top-left → bottom-right on screen
  cam: [
    [0, [-4.4, 0.8, 5.6, 0, 1.12, 0.1]],
    [1.1, [-3.4, 1.05, 4.3, 0, 1.18, 0.15]],
    [T.guard, [-3.0, 1.15, 3.6, 0, 1.22, 0.2]],
    [T.slash, [-2.9, 1.17, 3.45, 0, 1.24, 0.2]],
    [T.slashEnd, [-2.6, 1.2, 3.15, 0.05, 1.18, 0.25], outExpo],
    [4, [-2.55, 1.2, 3.1, 0.05, 1.18, 0.25]],
  ] as Key[],
  lights: [
    [0, [0.05, 0.15]],
    [1.0, [1, 0.25]],
    [CLEAR, [1, 0.5]],
    [T.slash, [1, 0.6]],
    [T.impact, [1.15, 1]],
    [3, [1, 0.7]],
  ] as Key[],
};

// scabbard placement at the left hip (world, rest pelvis)
const MOUTH = new THREE.Vector3(0.1, 1.1, 0.36);
const SAYA_DIR = new THREE.Vector3(0.36, -0.3, -1).normalize();
// during the draw the left hand swings the saya outward so its axis follows the drawing hand
const SAYA_OPEN = new THREE.Vector3(1, -0.22, -0.08).normalize();

type Rig = ReturnType<typeof buildRig>;

function buildRig(scene: THREE.Object3D) {
  scene.scale.setScalar(S);
  const bones: Record<string, THREE.Bone> = {};
  const meshes: THREE.SkinnedMesh[] = [];
  scene.traverse((o) => {
    if ((o as THREE.Bone).isBone) bones[o.name.replace(/\./g, "")] = o as THREE.Bone;
    if ((o as THREE.SkinnedMesh).isSkinnedMesh) {
      meshes.push(o as THREE.SkinnedMesh);
      o.frustumCulled = false;
    }
  });
  const mesh = meshes[0];
  const rest = new Map<THREE.Bone, { q: THREE.Quaternion; p: THREE.Vector3 }>();
  Object.values(bones).forEach((b) => rest.set(b, { q: b.quaternion.clone(), p: b.position.clone() }));
  scene.updateMatrixWorld(true);

  const sword = bones.swordR;
  const hand = bones.handR;
  const swordIdx = mesh.skeleton.bones.indexOf(sword);
  const info = analyzeSword(meshes, swordIdx);
  // rest grip: sword in right-hand space
  const gripOffset = new THREE.Matrix4().copy(hand.matrixWorld).invert().multiply(sword.matrixWorld);
  const gripInv = gripOffset.clone().invert();
  // hand-local measures for the mirrored left grip
  const gripQ = new THREE.Quaternion();
  gripOffset.decompose(new THREE.Vector3(), gripQ, new THREE.Vector3());
  const aR = info.axis.clone().applyQuaternion(gripQ);
  const gR = info.grip.clone().applyMatrix4(gripOffset);
  const aL = new THREE.Vector3(-aR.x, aR.y, aR.z);
  const gL = new THREE.Vector3(-gR.x, gR.y, gR.z);

  // detach the katana so it can live in the scabbard
  scene.attach(sword);

  const restWorld = (b: THREE.Bone) => worldQuat(b).clone();
  const footRest = { L: worldPos(bones.footL).clone(), R: worldPos(bones.footR).clone(), qL: restWorld(bones.footL), qR: restWorld(bones.footR) };
  const handRestQ = { L: restWorld(bones.handL), R: restWorld(hand) };
  const thighRestQ = { L: restWorld(bones.thighL), R: restWorld(bones.thighR) };
  const skirtRestQ = { L: restWorld(bones.skirtL), R: restWorld(bones.skirtR) };
  const pelvisRestInv = new THREE.Matrix4().copy(bones.pelvis.matrixWorld).invert();

  const len = (a: THREE.Bone, b: THREE.Bone) => worldPos(a).distanceTo(worldPos(b));
  const L = {
    armR: [len(bones.upper_armR, bones.forearmR), len(bones.forearmR, hand)],
    armL: [len(bones.upper_armL, bones.forearmL), len(bones.forearmL, bones.handL)],
    leg: [len(bones.thighL, bones.shinL), len(bones.shinL, bones.footL)],
  };

  // scabbard frame (sword-local → world) at rest; stored relative to the pelvis
  const scab = buildScabbard(info);
  const up = new THREE.Vector3(0, 1, 0).addScaledVector(SAYA_DIR, -SAYA_DIR.y).normalize();
  const rq = quatFromPairs(info.axis, info.edge, SAYA_DIR, up);
  const m0 = new THREE.Matrix4().compose(new THREE.Vector3(), rq, new THREE.Vector3(S, S, S));
  const mouthW = scab.mouthPoint.clone().applyMatrix4(m0);
  m0.setPosition(MOUTH.clone().sub(mouthW));
  const scabRel = new THREE.Matrix4().multiplyMatrices(pelvisRestInv, m0);

  return { bones, mesh, rest, info, gripOffset, gripInv, aL, gL, footRest, handRestQ, thighRestQ, skirtRestQ, L, scab, scabRel };
}

/* ───────── per-frame pose ───────── */

const tmp = {
  m: new THREE.Matrix4(),
  m2: new THREE.Matrix4(),
  q: new THREE.Quaternion(),
  q2: new THREE.Quaternion(),
  v: new THREE.Vector3(),
  v2: new THREE.Vector3(),
  s: new THREE.Vector3(),
};
const Y = new THREE.Vector3(0, 1, 0);
const X = new THREE.Vector3(1, 0, 0);
const Z = new THREE.Vector3(0, 0, 1);

function swordFromFree(rig: Rig, t: number, out: THREE.Matrix4) {
  const a = sample(K.free, t);
  const B = new THREE.Vector3(a[3], a[4], a[5]).normalize();
  const E = new THREE.Vector3(a[6], a[7], a[8]);
  const q = quatFromPairs(rig.info.axis, rig.info.edge, B, E);
  out.compose(new THREE.Vector3(), q, new THREE.Vector3(S, S, S));
  const g = rig.info.grip.clone().applyMatrix4(out);
  out.setPosition(new THREE.Vector3(a[0], a[1], a[2]).sub(g));
  return out;
}

type Pose = { reachErr: number };

function applyPose(rig: Rig, scene: THREE.Object3D, t: number, clearPose: THREE.Matrix4 | null, out: { scab: THREE.Matrix4; sword: THREE.Matrix4 }): Pose {
  const { bones } = rig;
  rig.rest.forEach((r, b) => {
    if (b === bones.swordR) return;
    b.quaternion.copy(r.q);
    b.position.copy(r.p);
  });
  scene.updateMatrixWorld(true);

  // pelvis + chest + head (world-axis rotations)
  const pv = sample(K.pelvis, t);
  bones.pelvis.position.add(tmp.v.set(pv[1], pv[2], pv[3]).divideScalar(S));
  bones.pelvis.updateMatrixWorld(true);
  setWorldQuat(bones.pelvis, tmp.q.setFromAxisAngle(Y, pv[0]).multiply(worldQuat(bones.pelvis)));
  const ch = sample(K.chest, t);
  const chestQ = tmp.q.setFromAxisAngle(Y, ch[0] - pv[0]).multiply(tmp.q2.setFromAxisAngle(X, ch[1])).multiply(new THREE.Quaternion().setFromAxisAngle(Z, ch[2]));
  setWorldQuat(bones.chest, chestQ.clone().multiply(worldQuat(bones.chest)));
  const hd = sample(K.head, t);
  setWorldQuat(bones.head, new THREE.Quaternion().setFromAxisAngle(Y, hd[0]).multiply(new THREE.Quaternion().setFromAxisAngle(X, hd[1])).multiply(worldQuat(bones.head)));

  // legs: feet planted (right foot steps into the cut)
  const st = sample(K.stepR, t);
  const footR = rig.footRest.R.clone().add(tmp.v.set(0, st[1], st[0]));
  solveTwoBone(bones.thighL, bones.shinL, bones.footL, rig.footRest.L, new THREE.Vector3(0.25, 0, 1), rig.L.leg[0], rig.L.leg[1]);
  setWorldQuat(bones.footL, rig.footRest.qL);
  solveTwoBone(bones.thighR, bones.shinR, bones.footR, footR, new THREE.Vector3(-0.25, 0, 1), rig.L.leg[0], rig.L.leg[1]);
  setWorldQuat(bones.footR, rig.footRest.qR);
  // skirt plates follow the thighs halfway
  for (const side of ["L", "R"] as const) {
    const follow = worldQuat(bones[`thigh${side}`]).clone().multiply(rig.thighRestQ[side].clone().invert()).multiply(rig.skirtRestQ[side]);
    setWorldQuat(bones[`skirt${side}`], worldQuat(bones[`skirt${side}`]).clone().slerp(follow, 0.55));
  }

  // scabbard: on the pelvis, pulled back during the draw (saya-biki)
  const [back, open] = sample([[0, [0, 0]], [GRIP, [0, 0]], [CLEAR, [0.5, 1]], [CLEAR + 0.35, [0.04, 0.15]]], t);
  const base = new THREE.Matrix4().multiplyMatrices(bones.pelvis.matrixWorld, rig.scabRel);
  const pivot = rig.scab.mouthPoint.clone().applyMatrix4(base);
  const swing = new THREE.Quaternion().slerp(new THREE.Quaternion().setFromUnitVectors(SAYA_DIR, SAYA_OPEN), open);
  out.scab
    .makeTranslation(pivot)
    .multiply(tmp.m.makeRotationFromQuaternion(swing))
    .multiply(tmp.m2.makeTranslation(pivot.clone().negate()))
    .multiply(base)
    .multiply(tmp.m.makeTranslation(rig.info.axis.clone().multiplyScalar(back * (rig.info.tip - rig.info.guard))));

  // sword target
  const bladeLen = rig.info.tip - rig.info.guard;
  const drawn = sample([[0, [0]], [GRIP, [0]], [CLEAR, [1.04]]], t)[0];
  const sheathed = new THREE.Matrix4().copy(out.scab).multiply(tmp.m.makeTranslation(rig.info.axis.clone().multiplyScalar(-drawn * bladeLen)));
  let target: THREE.Matrix4;
  if (t <= CLEAR || !clearPose) target = sheathed;
  else {
    const free = swordFromFree(rig, Math.max(t, T.guard), new THREE.Matrix4());
    const u = inOut(ss(t, CLEAR, T.guard));
    target = blendMatrix(clearPose, free, u, rig.info.grip);
  }

  // right arm: hang → reach → grip
  const handGoal = new THREE.Matrix4().multiplyMatrices(target, rig.gripInv);
  const goalP = new THREE.Vector3();
  const goalQ = new THREE.Quaternion();
  handGoal.decompose(goalP, goalQ, tmp.s);
  const reach = inOut(ss(t, 0.85, GRIP));
  const hang = new THREE.Vector3(-0.34, 0.97, 0.07);
  const tgt = hang.clone().lerp(goalP, reach);
  const reached = solveTwoBone(bones.upper_armR, bones.forearmR, bones.handR, tgt, new THREE.Vector3(-0.8, -0.45, -0.4).normalize(), rig.L.armR[0], rig.L.armR[1]);
  setWorldQuat(bones.handR, rig.handRestQ.R.clone().slerp(goalQ, reach));
  const reachErr = reached.distanceTo(tgt);

  // the katana: in the scabbard until gripped, then rigidly in the fist
  // koiguchi-no-kirikata: the thumb eases the tsuba out of the mouth as the grip closes,
  // absorbing the few cm the arm can't quite reach without a visible pop
  const held = new THREE.Matrix4().multiplyMatrices(bones.handR.matrixWorld, rig.gripOffset);
  const settle = inOut(ss(t, GRIP - 0.1, GRIP + 0.08));
  if (settle <= 0) out.sword.copy(sheathed);
  else if (settle >= 1) out.sword.copy(held);
  else out.sword.copy(blendMatrix(sheathed, held, settle, rig.info.grip));

  // left hand: koiguchi (scabbard mouth) → joins the grip for the cut
  const swordQ = new THREE.Quaternion();
  const swordP = new THREE.Vector3();
  out.sword.decompose(swordP, swordQ, tmp.s);
  const B = rig.info.axis.clone().applyQuaternion(swordQ);
  const K2 = Y.clone().applyQuaternion(worldQuat(bones.handR));
  const qTwo = quatFromPairs(rig.aL, Y, B, K2);
  const gripW = rig.info.grip.clone().applyMatrix4(out.sword);
  const pTwo = gripW.addScaledVector(B, -0.075).sub(rig.gL.clone().multiplyScalar(S).applyQuaternion(qTwo));
  const scabQ = new THREE.Quaternion();
  const scabP = new THREE.Vector3();
  out.scab.decompose(scabP, scabQ, tmp.s);
  const D = rig.info.axis.clone().applyQuaternion(scabQ);
  const qSaya = quatFromPairs(rig.aL, new THREE.Vector3(0, -1, 0.3), D, new THREE.Vector3(0.2, -1, 0.4));
  const mouthW = rig.scab.mouthPoint.clone().applyMatrix4(out.scab).addScaledVector(D, 0.05);
  const pSaya = mouthW.sub(rig.gL.clone().multiplyScalar(S).applyQuaternion(qSaya));
  const two = inOut(ss(t, CLEAR + 0.05, TWO_HANDS));
  const holdSaya = inOut(ss(t, 0.2, 0.8));
  const handLRestP = new THREE.Vector3(0.34, 0.97, 0.07);
  const pL = handLRestP.clone().lerp(pSaya, holdSaya).lerp(pTwo, two);
  solveTwoBone(bones.upper_armL, bones.forearmL, bones.handL, pL, new THREE.Vector3(0.8, -0.45, -0.4).normalize(), rig.L.armL[0], rig.L.armL[1]);
  setWorldQuat(bones.handL, rig.handRestQ.L.clone().slerp(qSaya, holdSaya).slerp(qTwo, two));

  return { reachErr };
}

/** Blend two rigid transforms about the grip point (position lerp + rotation slerp). */
function blendMatrix(a: THREE.Matrix4, b: THREE.Matrix4, u: number, grip: THREE.Vector3) {
  const qa = new THREE.Quaternion();
  const qb = new THREE.Quaternion();
  const s = new THREE.Vector3();
  const pa = new THREE.Vector3();
  a.decompose(pa, qa, s);
  b.decompose(pa, qb, s);
  const ga = grip.clone().applyMatrix4(a);
  const gb = grip.clone().applyMatrix4(b);
  const g = ga.lerp(gb, u);
  const q = qa.slerp(qb, u);
  const m = new THREE.Matrix4().compose(new THREE.Vector3(), q, s);
  const off = grip.clone().applyMatrix4(m);
  return m.setPosition(g.sub(off));
}

/* ───────── component ───────── */

export function CustomRonin({ clockRef, freeze, onInfo }: { clockRef: React.RefObject<number>; freeze: number | null; onInfo?: (s: string) => void }) {
  const gltf = useGLTF(SRC);
  const scene = useMemo(() => SkeletonUtils.clone(gltf.scene), [gltf.scene]);
  const rig = useMemo(() => buildRig(scene), [scene]);

  const mats = useMemo(
    () => ({
      saya: new THREE.MeshPhysicalMaterial({ color: "#0e0e0d", metalness: 0.75, roughness: 0.32, clearcoat: 1, clearcoatRoughness: 0.12, envMapIntensity: 1.4 }),
      fitting: new THREE.MeshPhysicalMaterial({ color: "#34342f", metalness: 0.9, roughness: 0.3 }),
      lime: new THREE.MeshBasicMaterial({ color: LIME, toneMapped: false }),
      glow: new THREE.MeshBasicMaterial({ color: LIME, toneMapped: false, transparent: true, opacity: 0.25, blending: THREE.AdditiveBlending, depthWrite: false }),
    }),
    [],
  );
  const edge = useMemo(() => {
    const pts = rig.info.centre.map((c) => c.clone().addScaledVector(rig.info.edge, rig.info.halfWidth * 0.98));
    const curve = new THREE.CatmullRomCurve3(pts.filter((_, i, a) => i % 3 === 0 || i === a.length - 1));
    return { line: new THREE.TubeGeometry(curve, 48, rig.info.halfThick * 0.35, 4), glow: new THREE.TubeGeometry(curve, 48, rig.info.halfThick * 0.9, 6) };
  }, [rig]);
  useEffect(() => () => {
    [edge.line, edge.glow, rig.scab.body, rig.scab.mouth, rig.scab.mouth2, rig.scab.end].forEach((g) => g.dispose());
    Object.values(mats).forEach((m) => m.dispose());
  }, [edge, rig, mats]);

  const scabGroup = useRef<THREE.Group>(null);
  const edgeGroup = useRef<THREE.Group>(null);
  const key = useRef<THREE.SpotLight>(null);
  const bladeLight = useRef<THREE.PointLight>(null);
  const clearPose = useRef<THREE.Matrix4 | null>(null);
  const mats4 = useMemo(() => ({ scab: new THREE.Matrix4(), sword: new THREE.Matrix4() }), []);
  const trail = useTrail();

  // pre-compute the pose at the instant the blade clears (start of the free swing)
  useEffect(() => {
    const o = { scab: new THREE.Matrix4(), sword: new THREE.Matrix4() };
    applyPose(rig, scene, CLEAR, null, o);
    clearPose.current = o.sword.clone();
  }, [rig, scene]);

  useFrame((state) => {
    const t = freeze ?? clockRef.current;
    const pose = applyPose(rig, scene, t, clearPose.current, mats4);
    // sword bone (now a child of the scene root) gets the world transform directly
    const sword = rig.bones.swordR;
    tmp.m2.copy(scene.matrixWorld).invert().multiply(mats4.sword).decompose(sword.position, sword.quaternion, sword.scale);
    sword.updateMatrixWorld(true);
    if (scabGroup.current) {
      scabGroup.current.matrix.copy(mats4.scab);
      scabGroup.current.matrixWorldNeedsUpdate = true;
    }
    if (edgeGroup.current) {
      edgeGroup.current.matrix.copy(mats4.sword);
      edgeGroup.current.matrixWorldNeedsUpdate = true;
    }
    const lt = sample(K.lights, t);
    if (key.current) key.current.intensity = 22 * lt[0];
    mats.glow.opacity = 0.05 + lt[1] * 0.25;
    const tip = new THREE.Vector3().copy(rig.info.axis).multiplyScalar(rig.info.tip).applyMatrix4(mats4.sword);
    const mid = new THREE.Vector3().copy(rig.info.axis).multiplyScalar((rig.info.tip + rig.info.guard) / 2).applyMatrix4(mats4.sword);
    if (bladeLight.current) {
      bladeLight.current.position.copy(mid);
      bladeLight.current.intensity = 0.8 + lt[1] * 3.5;
    }
    trail.push(tip, mid, t);
    // camera
    const c = sample(K.cam, t);
    const portrait = state.size.width / state.size.height < 0.85;
    const pull = portrait ? 1.3 : 1;
    state.camera.position.set(c[0] * (portrait ? 1.15 : 1), c[1] + (portrait ? 0.1 : 0), c[2] * pull);
    const shake = Math.max(0, 1 - Math.abs(t - T.impact - 0.04) / 0.12) * 0.025;
    state.camera.position.x += Math.sin(t * 90) * shake;
    state.camera.position.y += Math.cos(t * 75) * shake;
    state.camera.lookAt(c[3], c[4], c[5]);
    onInfo?.(`t ${t.toFixed(2)}s · blade ${((rig.info.tip - rig.info.guard) * S).toFixed(2)} · arm ${(rig.L.armR[0] + rig.L.armR[1]).toFixed(2)} · hand target miss ${(pose.reachErr * 100).toFixed(1)} (units×100)`);
  });

  return (
    <>
      <spotLight ref={key} position={[2.2, 4.2, 3.4]} angle={0.5} penumbra={0.9} intensity={0} color={PAPER} decay={1.6} distance={14} />
      <pointLight ref={bladeLight} color={LIME} intensity={0} distance={2.4} decay={2} />
      <primitive object={scene} />
      <group ref={scabGroup} matrixAutoUpdate={false}>
        <mesh geometry={rig.scab.body} material={mats.saya} />
        <mesh geometry={rig.scab.mouth} material={mats.lime} />
        <mesh geometry={rig.scab.mouth2} material={mats.fitting} />
        <mesh geometry={rig.scab.end} material={mats.fitting} />
      </group>
      <group ref={edgeGroup} matrixAutoUpdate={false}>
        <mesh geometry={edge.line} material={mats.lime} />
        <mesh geometry={edge.glow} material={mats.glow} />
      </group>
      <primitive object={trail.mesh} />
    </>
  );
}

/* ───────── slash trail ───────── */
function useTrail() {
  const api = useMemo(() => {
    const N = 26;
    const pos = new Float32Array(N * 6);
    const col = new Float32Array(N * 6);
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    geo.setAttribute("color", new THREE.BufferAttribute(col, 3));
    const idx: number[] = [];
    for (let i = 0; i < N - 1; i++) idx.push(i * 2, i * 2 + 1, i * 2 + 2, i * 2 + 1, i * 2 + 3, i * 2 + 2);
    geo.setIndex(idx);
    const mesh = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, toneMapped: false }));
    mesh.frustumCulled = false;
    const samples = Array.from({ length: N }, () => ({ tip: new THREE.Vector3(), mid: new THREE.Vector3(), t: -10 }));
    const c = new THREE.Color();
    return {
      mesh,
      push(tip: THREE.Vector3, mid: THREE.Vector3, t: number) {
        const active = t > T.slash && t < T.slashEnd + 0.06;
        for (let i = N - 1; i > 0; i--) {
          samples[i].tip.copy(samples[i - 1].tip);
          samples[i].mid.copy(samples[i - 1].mid);
          samples[i].t = samples[i - 1].t;
        }
        samples[0].tip.copy(tip);
        samples[0].mid.copy(mid);
        samples[0].t = active ? t : -10;
        for (let i = 0; i < N; i++) {
          const sm = samples[i];
          const k = sm.t < 0 || sm.t > t ? 0 : Math.max(0, 1 - (t - sm.t) / 0.2) * (1 - i / N);
          sm.tip.toArray(pos, i * 6);
          new THREE.Vector3().lerpVectors(sm.tip, sm.mid, 0.25 + 0.75 * k).toArray(pos, i * 6 + 3);
          c.copy(LIME).lerp(PAPER, i < 3 ? 0.5 : 0);
          col.set([c.r * k, c.g * k, c.b * k, c.r * k * 0.15, c.g * k * 0.15, c.b * k * 0.15], i * 6);
        }
        geo.attributes.position.needsUpdate = true;
        geo.attributes.color.needsUpdate = true;
      },
    };
  }, []);
  return api;
}

useGLTF.preload(SRC);
