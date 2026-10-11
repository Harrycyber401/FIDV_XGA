/**
 * [C-COORD] Visualization space for the industry-chain cube.
 *
 * 1类坐标，位置坐标：用户坐标 (s, x, y)。立方体里的位置只用这一套。
 * Three.js is only the renderer. To move something, change this coordinate
 * (LAYOUT below, or the object's coord). Do not write raw Three.js positions.
 *
 *   s  front (+s) / back (−s). Layer i sits at s = i.
 *   x  right (+x) / left (−x). A slice face is x∈[0,10].
 *   y  up (+y) / down (−y). Face is y∈[0,10].
 *   1 s = 1 x = 1 y = UNIT meters. Focus keeps that slice.
 *   The rest of the cube shifts left along −x by cubeExitX().
 *
 * 调位置：改本文件 LAYOUT，或改对象的 (s, x, y)。不要直接写 Three.js 坐标。
 *
 * 2类坐标，相对坐标：company.ringCos / company.ringSin。不叫 x、y。
 * companyCoord() 把它们投影成位置坐标。
 *
 * 3类坐标，行业坐标：company.legalEntityCoord。
 * Bloomberg BICS Equity Hierarchy 2024；产品格式 7×2 连字符（右补 00）。
 * 主业行空 % Tot Rev 时企业坐标前加 ASCII '-'（节点坐标不加）。
 * 闸门/名单 chrome 只画前 4 段并保留前导 '-'；库与字段仍是 7 级。
 * 库：class-3-coords/BICS-Classification/。不参与摆放。
 */
/** Physical face edge length in Three.js meters (PlaneGeometry). 2026-10-07 业主明示：面放大到 6.0（原 4.2）。 */
export const FACE = 6.0;
/** User units across one face edge. Vertices are 0 and FACE_SPAN. */
export const FACE_SPAN = 10;
/** Meters per 1 user-s, 1 user-x, or 1 user-y. */
export const UNIT = FACE / FACE_SPAN;
/** [C-D] Meters between slices when d=1 (default spacing). */
export const GAP = UNIT;
/** [C-D] Floor for divisions when d→0 (layout may still use gap=0). */
export const D_EPS = 1e-3;
/** [C-AXIS-X] +user-x → Three.js −Z. */
export const USER_X_SIGN = -1;

export const LAYOUT = {
  /** Slice center. The face is the square [0, FACE_SPAN]² around this point. */
  faceCenter: { x: FACE_SPAN / 2, y: FACE_SPAN / 2 },
  /** [C-RING] Outermost ring radius, in user face units. */
  ringRadius: 3.8,
  /** [C-LABEL] Domain stage tag: enlarged, centered above the face top, on the chain spine. */
  domainLabel: {
    x: FACE_SPAN / 2,
    y: 10.75,
    liftMeters: 0.03,
  },
  /** [C-CLOUD→C-SPINE] Spine/tag chrome. Stage tags alternate above/below the spine, above the face tops (faces span y∈[0,10]). */
  cloud: {
    centerX: 5,
    centerY: 5,
    radius: 1.4,
    sJitter: 0.7,
    spineY: 10.5,
    tagYOffset: 0.95,
    linkMax: 3.2,
  },
  /** Company name sits on the point, nudged +s and +y so it clears the sphere. */
  companyLabel: { liftMeters: 0.02, aboveMeters: 0.12 },
  /** Ring polylines sit a hair in front of the glass (+s). */
  ringGuideLiftMeters: 0.008,
  /** Wireframe padding around the unit cube, in meters (constant on screen when s-gap changes). */
  framePad: { sMeters: 0.25, faceMeters: 0.225 },
  /** [C-AXES] Axis lengths in user units. Tick chrome is derived in axisChrome(). */
  axes: { sEnd: 20, xEnd: 22.5, yEnd: 22.5 },
  /** [C-STDVIEW] Camera and look-at, user (s, x, y). Overview frames the cube; pulled frames one slice. */
  camera: {
    pulled: { sOffset: 10, x: 5, y: 5 },
    overview: {
      pos: { s: 24, x: 21, y: 21 },
      target: { s: 0, x: 0, y: 0 },
    },
  },
  /**
   * [C-VIEW-SPACE] View space: sphere about user origin.
   * Radius is in user units (1 s = 1 x = 1 y). Convert with UNIT only
   * (never multiply by d) — this is coordinate scale, not slice spacing.
   */
  viewSpace: { radius: 200 },
};

/** [C-VIEW-SPACE] Farthest camera pull-back in Three meters (= R · UNIT). */
export function viewSpaceMeters() {
  return LAYOUT.viewSpace.radius * UNIT;
}

/** [C-D] Slice gap in meters: gap = d · UNIT. d=1 is default; d=0 stacks slices. */
export function gapMeters(d) {
  return d * UNIT;
}

/** [C-D] Gap used only where code divides by gap (never zero). */
export function gapSafe(d) {
  return Math.max(d, D_EPS) * UNIT;
}

export function sxy(s, x, y) {
  return { s, x, y };
}

export function originLocal(nLayers, gap) {
  const halfStack = ((nLayers - 1) * gap) / 2;
  return { x: -halfStack, y: -FACE / 2, z: FACE / 2 };
}

/** (s, x, y) → root-local Three.js {x, y, z}. */
export function coordToLocal(coord, nLayers, gap) {
  const o = originLocal(nLayers, gap);
  return {
    x: o.x + coord.s * gap,
    y: o.y + coord.y * UNIT,
    z: o.z + USER_X_SIGN * coord.x * UNIT,
  };
}

/** Root-local Three.js {x, y, z} → (s, x, y). Uses gapSafe when d→0. */
export function localToCoord(p, nLayers, gap) {
  const o = originLocal(nLayers, gap);
  const gs = Math.max(gap, D_EPS * UNIT);
  return {
    s: (p.x - o.x) / gs,
    y: (p.y - o.y) / UNIT,
    x: (p.z - o.z) / (USER_X_SIGN * UNIT),
  };
}

/**
 * Offset from a parent whose origin is user (s0, x0, y0), in that parent's
 * local Three.js axes. ds/dx/dy are user-unit deltas.
 */
export function localOffset(ds, dx, dy, gap) {
  return {
    x: ds * gap,
    y: dy * UNIT,
    z: USER_X_SIGN * dx * UNIT,
  };
}

/** [C-PULL] One face width along −x (left). Focused slice stays; the rest of the cube uses this. */
export function cubeExitX() {
  return FACE_SPAN;
}

/** Slice group anchor. exitX moves this slice along −x. The focused slice passes 0. */
export function sliceAnchor(s, exitX = 0) {
  return {
    s,
    x: LAYOUT.faceCenter.x - exitX,
    y: LAYOUT.faceCenter.y,
  };
}

/**
 * Ring (ringCos, ringSin) in [-1, 1] → unpulled user (s, x, y).
 * +ringCos is +Three Z on the slice, which is −user-x (USER_X_SIGN).
 */
export function companyCoord(layer, ringCos, ringSin) {
  return {
    s: layer,
    x: LAYOUT.faceCenter.x + USER_X_SIGN * ringCos * LAYOUT.ringRadius,
    y: LAYOUT.faceCenter.y + ringSin * LAYOUT.ringRadius,
  };
}

export function domainLabelCoord(layer, gap) {
  const g = Math.max(gap, D_EPS * UNIT);
  return {
    s: layer + LAYOUT.domainLabel.liftMeters / g,
    x: LAYOUT.domainLabel.x,
    y: LAYOUT.domainLabel.y,
  };
}

export function companyLabelCoord(base, radiusMeters, gap) {
  const g = Math.max(gap, D_EPS * UNIT);
  return {
    s: base.s + LAYOUT.companyLabel.liftMeters / g,
    x: base.x,
    y: base.y + (radiusMeters + LAYOUT.companyLabel.aboveMeters) / UNIT,
  };
}

/** Point on a concentric ring, as a user-unit offset from the face center. */
export function ringOffset(radiusUser, angle) {
  return {
    dx: USER_X_SIGN * Math.cos(angle) * radiusUser,
    dy: Math.sin(angle) * radiusUser,
  };
}

/**
 * Axis tick / label coordinates. Lengths sEnd/xEnd/yEnd are user units.
 * The small pads match the previous meter offsets, so they stay put when the
 * s-gap changes (pads are meters ÷ current gap or UNIT).
 */
export function axisChrome(gap) {
  const g = Math.max(gap, D_EPS * UNIT);
  const s = (meters) => meters / g;
  const u = (meters) => meters / UNIT;
  const { sEnd, xEnd, yEnd } = LAYOUT.axes;
  return {
    sEnd,
    xEnd,
    yEnd,
    tickLayerY: u(0.14),
    tickMinorY: u(0.08),
    labelGapY: u(0.18),
    yTickS: s(0.14),
    yNumeralS: s(0.32),
    xTickY: u(0.14),
    xNumeralY: u(0.32),
    sLabel: { s: sEnd + s(0.4), x: 0, y: u(0.22) },
    yLabel: { s: s(0.08), x: 0, y: yEnd + u(0.28) },
    xLabel: { s: 0, x: xEnd + u(0.28), y: u(0.22) },
  };
}

/** Deterministic PRNG (mulberry32) — cloud scatter is stable across reloads. */
function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * [C-CLOUD] Deterministic cloud scatter for one company: stage center
 * (i, centerX, centerY) + a volume-uniform offset inside the cloud radius.
 * Seed = company id, so the cloud is stable and needs no data change.
 */
export function cloudCoord(layer, seed) {
  const rnd = mulberry32((seed * 2654435761 + 1013904223) >>> 0);
  const theta = 2 * Math.PI * rnd();
  const phi = Math.acos(2 * rnd() - 1);
  const rad = LAYOUT.cloud.radius * Math.cbrt(rnd());
  return {
    s: layer + (rnd() - 0.5) * 2 * LAYOUT.cloud.sJitter,
    x: LAYOUT.cloud.centerX + rad * Math.sin(phi) * Math.cos(theta),
    y: LAYOUT.cloud.centerY + rad * Math.sin(phi) * Math.sin(theta),
  };
}

export function formatCoord(coord, digits = 2) {
  if (!coord) return "—";
  const s = Number.isInteger(coord.s) ? String(coord.s) : coord.s.toFixed(digits);
  return `(${s}, ${coord.x.toFixed(digits)}, ${coord.y.toFixed(digits)})`;
}

/** C-HOME / C-LIST chrome: first 4 of 7 hyphen groups. Keep a leading '-'. */
export function displayIndustryCoord(raw) {
  const s = String(raw || "").trim();
  if (!s) return "";
  const signed = s.startsWith("-");
  const core = signed ? s.slice(1) : s;
  if (!core) return signed ? "-" : "";
  const shown = core.includes("-") ? core.split("-").slice(0, 4).join("-") : core;
  return signed ? `-${shown}` : shown;
}
