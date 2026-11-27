/**
 * Rig utilities for procedurally animating RONIN-04.
 * Measures the real katana from its skinned vertices, builds a scabbard that fits it,
 * and provides world-space IK helpers that write back into bone-local rotations.
 */
import * as THREE from "three";

const _m = new THREE.Matrix4();
const _q = new THREE.Quaternion();
const _q2 = new THREE.Quaternion();
const _v = new THREE.Vector3();
const _a = new THREE.Vector3();
const _b = new THREE.Vector3();
const _c = new THREE.Vector3();
const _s = new THREE.Vector3();

export type SwordInfo = {
  /** blade axis (pommel → tip), sword-bone local, unit */
  axis: THREE.Vector3;
  /** blade width direction, unit, pointing to the cutting edge */
  edge: THREE.Vector3;
  /** scalar positions along axis (sword local units) */
  pommel: number;
  guard: number;
  tip: number;
  /** blade half width / half thickness (sword local units) */
  halfWidth: number;
  halfThick: number;
  /** blade centreline samples (sword local), guard → tip */
  centre: THREE.Vector3[];
  /** handle centre in sword local */
  grip: THREE.Vector3;
};

/** Reads the sword geometry rigidly bound to the sword bone and measures it. */
export function analyzeSword(meshes: THREE.SkinnedMesh[], boneIndex: number): SwordInfo {
  const pts: THREE.Vector3[] = [];
  for (const mesh of meshes) {
    const pos = mesh.geometry.getAttribute("position");
    const si = mesh.geometry.getAttribute("skinIndex");
    const sw = mesh.geometry.getAttribute("skinWeight");
    const toBone = new THREE.Matrix4().multiplyMatrices(mesh.skeleton.boneInverses[boneIndex], mesh.bindMatrix);
    for (let i = 0; i < pos.count; i++) {
      if (si.getX(i) !== boneIndex || sw.getX(i) < 0.99) continue;
      pts.push(new THREE.Vector3().fromBufferAttribute(pos, i).applyMatrix4(toBone));
    }
  }
  // axis: farthest point from origin is the tip
  let tipP = pts[0];
  for (const p of pts) if (p.lengthSq() > tipP.lengthSq()) tipP = p;
  const axis = tipP.clone().normalize();
  let smin = Infinity;
  let smax = -Infinity;
  for (const p of pts) {
    const s = p.dot(axis);
    smin = Math.min(smin, s);
    smax = Math.max(smax, s);
  }
  // radial profile → guard (widest point in the lower third)
  const BINS = 80;
  const rmax = new Float32Array(BINS);
  const binOf = (s: number) => Math.min(BINS - 1, Math.floor(((s - smin) / (smax - smin)) * BINS));
  for (const p of pts) {
    const s = p.dot(axis);
    const r = _v.copy(p).addScaledVector(axis, -s).length();
    const b = binOf(s);
    rmax[b] = Math.max(rmax[b], r);
  }
  let gb = 0;
  for (let b = 0; b < BINS * 0.4; b++) if (rmax[b] > rmax[gb]) gb = b;
  const guard = smin + ((gb + 0.5) / BINS) * (smax - smin);
  // blade cross-section: principal perpendicular direction = width
  const blade = pts.filter((p) => p.dot(axis) > guard + 0.04 * (smax - smin));
  const cov = [0, 0, 0, 0, 0, 0]; // xx xy xz yy yz zz
  const offs: THREE.Vector3[] = [];
  // remove per-bin mean so curvature doesn't dominate
  const mean = Array.from({ length: BINS }, () => ({ v: new THREE.Vector3(), n: 0 }));
  for (const p of blade) {
    const s = p.dot(axis);
    const o = p.clone().addScaledVector(axis, -s);
    mean[binOf(s)].v.add(o);
    mean[binOf(s)].n++;
  }
  for (const p of blade) {
    const s = p.dot(axis);
    const m = mean[binOf(s)];
    const o = p.clone().addScaledVector(axis, -s).sub(_v.copy(m.v).divideScalar(m.n));
    offs.push(o);
    cov[0] += o.x * o.x; cov[1] += o.x * o.y; cov[2] += o.x * o.z;
    cov[3] += o.y * o.y; cov[4] += o.y * o.z; cov[5] += o.z * o.z;
  }
  // power iteration for the principal direction
  let w = new THREE.Vector3(1, 0.3, 0.2).cross(axis).normalize();
  for (let k = 0; k < 30; k++) {
    w = new THREE.Vector3(
      cov[0] * w.x + cov[1] * w.y + cov[2] * w.z,
      cov[1] * w.x + cov[3] * w.y + cov[4] * w.z,
      cov[2] * w.x + cov[4] * w.y + cov[5] * w.z,
    );
    w.addScaledVector(axis, -w.dot(axis)).normalize();
  }
  const nrm = new THREE.Vector3().crossVectors(axis, w).normalize();
  let hw = 0;
  let ht = 0;
  let thinPos = 0;
  let thinNeg = 0;
  let nPos = 0;
  let nNeg = 0;
  for (const o of offs) {
    const a = o.dot(w);
    const t = Math.abs(o.dot(nrm));
    hw = Math.max(hw, Math.abs(a));
    ht = Math.max(ht, t);
  }
  for (const o of offs) {
    const a = o.dot(w);
    const t = Math.abs(o.dot(nrm));
    if (a > hw * 0.55) {
      thinPos += t;
      nPos++;
    }
    if (a < -hw * 0.55) {
      thinNeg += t;
      nNeg++;
    }
  }
  // the cutting edge is the thinner side
  const edge = thinPos / Math.max(1, nPos) < thinNeg / Math.max(1, nNeg) ? w.clone() : w.clone().negate();
  // centreline guard → tip
  const centre: THREE.Vector3[] = [];
  for (let b = gb + 1; b < BINS; b++) {
    if (!mean[b].n) continue;
    const s = smin + ((b + 0.5) / BINS) * (smax - smin);
    centre.push(axis.clone().multiplyScalar(s).add(mean[b].v.clone().divideScalar(mean[b].n)));
  }
  centre.push(axis.clone().multiplyScalar(smax));
  const grip = axis.clone().multiplyScalar((smin + guard) / 2);
  return { axis, edge, pommel: smin, guard, tip: smax, halfWidth: hw, halfThick: ht, centre, grip };
}

/** A lacquered saya swept along the real blade's centreline (sword-local space). */
export function buildScabbard(info: SwordInfo) {
  const curve = new THREE.CatmullRomCurve3(info.centre.filter((_, i, a) => i % 3 === 0 || i === a.length - 1));
  const N = 64;
  const R = 14;
  const len = info.tip - info.guard;
  const mw = info.halfWidth * 1.35 + len * 0.006;
  const mt = info.halfThick * 1.6 + len * 0.012;
  const w = info.edge;
  const n = new THREE.Vector3().crossVectors(info.axis, w).normalize();
  const verts: number[] = [];
  const idx: number[] = [];
  for (let i = 0; i <= N; i++) {
    const u = i / N;
    const c = curve.getPoint(u);
    // start at the mouth (slightly before the guard), taper only near the kojiri
    if (i === 0) c.addScaledVector(info.axis, -len * 0.01);
    const taper = u > 0.92 ? 1 - (u - 0.92) * 2.2 : 1;
    for (let j = 0; j < R; j++) {
      const a = (j / R) * Math.PI * 2;
      // slightly pointed toward the edge side, like a real saya cross-section
      const ca = Math.cos(a);
      const p = c.clone().addScaledVector(w, ca * mw * taper * (ca > 0 ? 1.05 : 0.95)).addScaledVector(n, Math.sin(a) * mt * taper);
      verts.push(p.x, p.y, p.z);
    }
  }
  for (let i = 0; i < N; i++) {
    for (let j = 0; j < R; j++) {
      const a = i * R + j;
      const b = i * R + ((j + 1) % R);
      idx.push(a, a + R, b, b, a + R, b + R);
    }
  }
  // end cap
  const tipC = curve.getPoint(1);
  const capI = verts.length / 3;
  verts.push(tipC.x, tipC.y, tipC.z);
  for (let j = 0; j < R; j++) idx.push(N * R + j, capI, N * R + ((j + 1) % R));
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(verts, 3));
  geo.setIndex(idx);
  geo.computeVertexNormals();

  // fittings: koiguchi (mouth) and kojiri (end) bands
  const mouthC = curve.getPoint(0).addScaledVector(info.axis, -len * 0.01);
  const band = (at: THREE.Vector3, scale: number) => {
    const g = new THREE.TorusGeometry(1, 0.08, 6, 24);
    g.scale(mw * scale, mt * scale, mw * scale);
    // torus lies in XY — align its normal (z) with the blade axis
    const basis = new THREE.Matrix4().makeBasis(w, n, info.axis);
    g.applyMatrix4(basis);
    g.translate(at.x, at.y, at.z);
    return g;
  };
  return {
    body: geo,
    mouth: band(mouthC, 1.12),
    mouth2: band(curve.getPoint(0.04), 1.06),
    end: band(curve.getPoint(0.95), 1.0),
    mouthPoint: mouthC,
  };
}

/* ───────────── world-space bone helpers ───────────── */

export function worldQuat(o: THREE.Object3D, out = new THREE.Quaternion()) {
  o.updateWorldMatrix(true, false);
  o.matrixWorld.decompose(_a, out, _s);
  return out;
}
export function worldPos(o: THREE.Object3D, out = new THREE.Vector3()) {
  o.updateWorldMatrix(true, false);
  return out.setFromMatrixPosition(o.matrixWorld);
}
/** Sets a bone's world rotation by writing its local quaternion. */
export function setWorldQuat(o: THREE.Object3D, q: THREE.Quaternion) {
  if (o.parent) {
    worldQuat(o.parent, _q);
    o.quaternion.copy(_q.invert().multiply(q));
  } else o.quaternion.copy(q);
  o.updateMatrixWorld(true);
}
/** Rotates a bone in world space (pre-multiplies its world rotation). */
export function rotateWorld(o: THREE.Object3D, q: THREE.Quaternion) {
  worldQuat(o, _q2);
  setWorldQuat(o, _q2.premultiply(q));
}

/**
 * Two-bone IK. `a` → `b` → `c` (end effector origin). Aims the chain at `target`
 * with the middle joint bending toward `pole`. Minimal-rotation updates keep twist stable.
 */
export function solveTwoBone(a: THREE.Object3D, b: THREE.Object3D, c: THREE.Object3D, target: THREE.Vector3, pole: THREE.Vector3, l1: number, l2: number) {
  const pa = worldPos(a, new THREE.Vector3());
  const dir = _v.subVectors(target, pa);
  const d = THREE.MathUtils.clamp(dir.length(), Math.abs(l1 - l2) + 1e-4, l1 + l2 - 1e-4);
  dir.normalize();
  const cosA = (l1 * l1 + d * d - l2 * l2) / (2 * l1 * d);
  const sinA = Math.sqrt(Math.max(0, 1 - cosA * cosA));
  const bend = _c.copy(pole).addScaledVector(dir, -pole.dot(dir)).normalize();
  const elbow = new THREE.Vector3().copy(pa).addScaledVector(dir, cosA * l1).addScaledVector(bend, sinA * l1);
  // upper bone
  const pb = worldPos(b, new THREE.Vector3());
  const cur = _a.subVectors(pb, pa).normalize();
  const want = _b.subVectors(elbow, pa).normalize();
  rotateWorld(a, _q.setFromUnitVectors(cur, want));
  // lower bone
  const pb2 = worldPos(b, new THREE.Vector3());
  const pc = worldPos(c, new THREE.Vector3());
  const cur2 = _a.subVectors(pc, pb2).normalize();
  const reach = target.clone().sub(pb2).normalize();
  rotateWorld(b, _q.setFromUnitVectors(cur2, reach));
  return worldPos(c, new THREE.Vector3());
}

/** Rotation that maps local basis (x,y) onto world basis (X,Y), orthonormalising both. */
export function quatFromPairs(localA: THREE.Vector3, localB: THREE.Vector3, worldA: THREE.Vector3, worldB: THREE.Vector3, out = new THREE.Quaternion()) {
  const la = localA.clone().normalize();
  const lb = localB.clone().addScaledVector(la, -localB.dot(la)).normalize();
  const lc = new THREE.Vector3().crossVectors(la, lb);
  const wa = worldA.clone().normalize();
  const wb = worldB.clone().addScaledVector(wa, -worldB.dot(wa)).normalize();
  const wc = new THREE.Vector3().crossVectors(wa, wb);
  const L = new THREE.Matrix4().makeBasis(la, lb, lc);
  const W = new THREE.Matrix4().makeBasis(wa, wb, wc);
  _m.copy(L).transpose(); // inverse of orthonormal
  return out.setFromRotationMatrix(W.multiply(_m));
}
