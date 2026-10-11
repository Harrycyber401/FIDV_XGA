/**
 * FIDV industry-chain cube — 3D slice chart along (s, x, y).
 * Concept targets: ../CONCEPTS.md (tags [C-SLICE], [C-PULL], [C-STDVIEW], …)
 *
 * 11 translucent slice faces along s (power → models). Companies are
 * billboard flat discs ON their slice, colored by stage gradient:
 * power (small s) deep blue → models (large s) light blue.
 * Enlarged clickable stage tags float above each face.
 * No axes, wireframe, edges, spine or link lines are drawn (2026-10-07,
 * owner: keep the view clean — overlaps must not turn dark).
 * Focus: the slice stays; the rest of the cube exits along −x and fades.
 */
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { COLORS, state, passesFilter, companyById } from "./state.js";
import {
  UNIT,
  FACE,
  FACE_SPAN,
  LAYOUT,
  gapMeters,
  coordToLocal,
  localToCoord,
  companyCoord,
  cubeExitX,
  sliceAnchor,
  viewSpaceMeters,
} from "./coords.js";

/** [C-POINT] Stage gradient endpoints: power (s=0) deep → models (s=10) light. */
const STAGE_DEEP = 0x0b3d8c;
const STAGE_LIGHT = 0x93bce4;
const N_LAYERS = () => state.layers.length;

const dotTextures = new Map(); // stage index → flat disc texture

export function createScene(viewport, hooks = {}) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xf4f6f9);
  // [C-VIEW-SPACE] Fog / far clip track pull-back radius (R·UNIT), never d
  const viewM = viewSpaceMeters();
  scene.fog = new THREE.Fog(0xf4f6f9, viewM * 0.45, viewM * 2.0);

  const camera = new THREE.PerspectiveCamera(42, 1, 0.05, viewM * 2.5);

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  viewport.insertBefore(renderer.domElement, viewport.firstChild);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = false;
  controls.enablePan = true;
  controls.screenSpacePanning = true;
  controls.rotateSpeed = 0.35;
  controls.panSpeed = 1.2;
  controls.zoomSpeed = 2.6;
  controls.minDistance = 0.35;
  controls.maxDistance = viewM;
  controls.enableZoom = false; // custom wheel below — full exponential range
  // Left = orbit (free drag); right = pan (translate); middle click = standard view
  controls.mouseButtons = {
    LEFT: THREE.MOUSE.ROTATE,
    MIDDLE: THREE.MOUSE.DOLLY,
    RIGHT: THREE.MOUSE.PAN,
  };
  controls.touches = { ONE: THREE.TOUCH.ROTATE, TWO: THREE.TOUCH.DOLLY_PAN };
  controls.target.set(0, 0, 0);

  const root = new THREE.Group();
  scene.add(root);

  const ctx = {
    scene,
    camera,
    renderer,
    controls,
    root,
    planeGroups: [], // one group per slice (faces, dots, labels, tags)
    sprites: [], // company discs
    byId: new Map(), // company id → disc
    labelSprites: new Map(), // company id → name pill
    tagSprites: [], // stage tags
    keys: new Set(),
    raycaster: new THREE.Raycaster(),
    pointer: new THREE.Vector2(),
    pointerState: { x: 0, y: 0, btn: -1, moved: false },
    camAnim: null,
    baseRotateSpeed: 0.35,
    cubeExit: 0,
    exitStayLayer: null,
    hooks,
  };

  buildCube(ctx);
  goStandardView(ctx, false);
  wireInput(ctx, viewport);
  resize(ctx, viewport);
  window.addEventListener("resize", () => resize(ctx, viewport));

  function tick() {
    requestAnimationFrame(tick);
    const dist = camera.position.distanceTo(controls.target);
    const ref = Math.max(6, framingDistance());
    controls.rotateSpeed = THREE.MathUtils.clamp(
      ctx.baseRotateSpeed * Math.sqrt(dist / ref),
      0.22,
      0.85
    );
    applyKeyboard(ctx);
    stepCamAnim(ctx);
    lerpVisibility(ctx);
    lerpPullOut(ctx);
    layoutTags(ctx);
    controls.update();
    renderer.render(scene, camera);
  }
  tick();

  return {
    ctx,
    applyVisibility: () => queueVisibilityTargets(ctx),
    layoutCloud: () => layoutCloud(ctx),
    resetCamera: () => resetCamera(ctx),
    goStandardView: () => goStandardView(ctx, true),
    focusStage: (i) => focusStage(ctx, i),
    clearFocus: () => clearFocus(ctx),
    selectCompany: (id) => selectCompany(ctx, id),
    framingDistance: () => framingDistance(),
  };
}

function gapNow() {
  // [C-D] gap = d · UNIT (default 2.5; d=0 stacks slices)
  return gapMeters(state.d);
}

function v3(p) {
  return new THREE.Vector3(p.x, p.y, p.z);
}

/** [C-MAP] Offset in the slice group's local Three.js axes. ds uses gap; dx/dy use UNIT. */
function localOffset(ds, dx, dy) {
  return {
    x: ds * gapNow(),
    y: dy * UNIT,
    z: -dx * UNIT, // [C-AXIS-X] +user-x → Three −Z
  };
}

/** [C-COORD] Place a root child at an absolute user coordinate. */
function applyCoord(object, coord) {
  object.position.copy(v3(coordToLocal(coord, N_LAYERS(), gapNow())));
}

/** [C-COORD] Place a slice child. `coord` is the unpulled layout coordinate. */
function placeInSlice(object, layer, coord) {
  object.position.copy(
    v3(
      localOffset(
        coord.s - layer,
        coord.x - LAYOUT.faceCenter.x,
        coord.y - LAYOUT.faceCenter.y
      )
    )
  );
}

function placeSliceGroup(g, i) {
  applyCoord(g, sliceAnchor(i, g.userData.exitX ?? 0));
}

/** [C-POINT] Stage gradient hex: power (s=0) deep → models (s=10) light. */
function stageColorHex(i) {
  const t = N_LAYERS() <= 1 ? 0 : i / (N_LAYERS() - 1);
  const c = new THREE.Color(STAGE_DEEP).lerp(new THREE.Color(STAGE_LIGHT), t);
  return "#" + c.getHexString();
}

/** [C-POINT] Flat 2D disc texture per stage: solid gradient color, thin white hairline, no glow. */
function makeDotTexture(stageIdx) {
  if (dotTextures.has(stageIdx)) return dotTextures.get(stageIdx);
  const canvas = document.createElement("canvas");
  canvas.width = 128;
  canvas.height = 128;
  const g = canvas.getContext("2d");
  g.clearRect(0, 0, 128, 128);
  g.beginPath();
  g.arc(64, 64, 56, 0, Math.PI * 2);
  g.fillStyle = stageColorHex(stageIdx);
  g.fill();
  g.lineWidth = 3;
  g.strokeStyle = "rgba(255, 255, 255, 0.55)";
  g.stroke();
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  dotTextures.set(stageIdx, tex);
  return tex;
}

function roundedRect(g, x, y, w, h, r) {
  g.beginPath();
  g.moveTo(x + r, y);
  g.arcTo(x + w, y, x + w, y + h, r);
  g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r);
  g.arcTo(x, y, x + w, y, r);
  g.closePath();
}

/** Billboard text sprite texture: soft white pill + dark text. */
function makeTextTexture(text, { font = 38, w = 1024, h = 160 } = {}) {
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const g = canvas.getContext("2d");
  g.font = `600 ${font}px ui-sans-serif, system-ui, -apple-system, sans-serif`;
  const tw = g.measureText(text).width;
  const cw = Math.min(w - 8, Math.ceil(tw + font * 0.9));
  const ch = font * 1.7;
  g.fillStyle = "rgba(255, 255, 255, 0.86)";
  roundedRect(g, (w - cw) / 2, (h - ch) / 2, cw, ch, 10);
  g.fill();
  g.strokeStyle = "rgba(23, 32, 43, 0.18)";
  g.lineWidth = 1.5;
  g.stroke();
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.fillStyle = "#17202b";
  g.fillText(text, w / 2, h / 2);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function makeTextSprite(texture, wUser, hUser) {
  const mat = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    depthWrite: false,
    opacity: 0,
  });
  const sprite = new THREE.Sprite(mat);
  sprite.userData.baseW = wUser;
  sprite.userData.baseH = hUser;
  sprite.userData.targetOpacity = 0;
  sprite.userData.targetScale = 1;
  sprite.scale.set(wUser * UNIT, hUser * UNIT, 1);
  return sprite;
}

/** [C-POINT] Dot diameter = market cap log scale; no Bloomberg row → revenue proxy.
 *  User units. The face grew to FACE=6.0 (2026-10-07): these values are scaled
 *  down (0.30–0.70 instead of 0.42–1.0) so dots keep the same physical size. */
function companySizeUser(c) {
  const v =
    c.bloomberg?.mkt_cap ?? (c.revBn != null ? c.revBn * 1e9 : null);
  if (v == null || !(v > 0)) return 0.3;
  const t = Math.min(1, Math.max(0, (Math.log10(v) - 8.5) / 4.2));
  return 0.3 + 0.4 * t;
}

function labelText(c) {
  return c.name.length > 18 ? c.name.slice(0, 16) + "…" : c.name;
}

function buildCube(ctx) {
  state.layers.forEach((L, i) => {
    const g = new THREE.Group();
    g.userData.layer = i;
    g.userData.exitX = 0;

    const plane = new THREE.Mesh(
      new THREE.PlaneGeometry(FACE, FACE),
      new THREE.MeshStandardMaterial({
        color: COLORS.PLANE,
        transparent: true,
        opacity: 0.08, // near-transparent: overlap views stay light
        depthWrite: false,
        side: THREE.DoubleSide,
        roughness: 0.9,
        metalness: 0,
      })
    );
    plane.rotation.y = Math.PI / 2;
    plane.renderOrder = 0;
    plane.userData.isSlicePlane = true;
    plane.userData.layerIndex = i;
    plane.userData.baseOpacity = 0.08;
    g.add(plane);

    // [C-SPINE] Big clickable stage tag + thin dynamic leader line to the slice top.
    // Position is recomputed every frame by layoutTags() to avoid overlap.
    const tag = makeTextSprite(
      makeTextTexture(`${i + 1} · ${L.name}`, { font: 56, w: 1280, h: 160 }),
      4.4,
      0.78
    );
    tag.userData.stageIndex = i;
    tag.userData.visibleBase = true;
    tag.renderOrder = 20;
    tag.material.opacity = 0.9;
    tag.userData.targetOpacity = 0.9;
    tag.position.set(0, (10.02 - LAYOUT.faceCenter.y) * UNIT, 0);

    const leader = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(0, 0, 0),
      ]),
      new THREE.LineBasicMaterial({
        color: 0x3b6ea5,
        transparent: true,
        opacity: 0.45,
        depthWrite: false,
      })
    );
    leader.renderOrder = 19;
    leader.userData.leaderFor = i;
    tag.userData.leader = leader;
    g.add(leader);
    g.add(tag);
    ctx.tagSprites.push(tag);

    ctx.planeGroups.push(g);
    ctx.root.add(g);
  });

  state.companies.forEach((c) => {
    // [C-COORD-2] Ring placement (server revScore) → face position (s, x, y).
    const coord = companyCoord(c.layer, c.ringCos, c.ringSin);
    c.coord = coord;
    const g = ctx.planeGroups[c.layer];
    const size = companySizeUser(c);

    const dot = makeTextSprite(makeDotTexture(c.layer), size, size);
    dot.userData.companyId = c.id;
    dot.renderOrder = 4 + c.layer;
    dot.material.opacity = 1;
    dot.userData.targetOpacity = 1;
    placeInSlice(dot, c.layer, coord);
    g.add(dot);
    ctx.sprites.push(dot);
    ctx.byId.set(c.id, dot);

    const label = makeTextSprite(
      makeTextTexture(labelText(c), { font: 34, w: 640, h: 96 }),
      3.4,
      0.51
    );
    label.userData.companyId = c.id;
    label.renderOrder = 30;
    label.visible = false;
    placeInSlice(label, c.layer, {
      s: coord.s,
      x: coord.x,
      y: coord.y + size / 2 + 0.32,
    });
    g.add(label);
    ctx.labelSprites.set(c.id, label);
  });

  layoutCloud(ctx);
  queueVisibilityTargets(ctx);
}

/** Reposition slices (called on d change). */
function layoutCloud(ctx) {
  const stay =
    state.focusLayer != null ? state.focusLayer : ctx.exitStayLayer;
  ctx.planeGroups.forEach((g, i) => {
    g.userData.exitX = stay != null && i !== stay ? ctx.cubeExit ?? 0 : 0;
    placeSliceGroup(g, i);
  });
}

/** [C-FOCUS][C-PULL] Focused slice stays bright; the rest of the cube fades out. */
function queueVisibilityTargets(ctx) {
  state.companies.forEach((c) => {
    const dot = ctx.byId.get(c.id);
    if (!dot) return;
    const show = passesFilter(c);
    const onFocus = state.focusLayer == null || c.layer === state.focusLayer;
    const selected = c.id === state.selectedId;
    const hovered = c.id === state.hoverId;
    dot.visible = show;
    dot.material.transparent = true;
    dot.userData.targetOpacity = !show ? 0 : selected || hovered ? 1 : onFocus ? 1 : 0;
    dot.userData.targetScale = selected ? 1.5 : hovered ? 1.25 : 1;
    const label = ctx.labelSprites.get(c.id);
    if (label) {
      label.visible =
        show &&
        (selected || hovered || (state.focusLayer != null && c.layer === state.focusLayer));
      label.material.transparent = true;
      label.userData.targetOpacity = label.visible ? 0.95 : 0;
    }
  });
  ctx.tagSprites.forEach((tag, i) => {
    const focused = state.focusLayer === i;
    tag.material.transparent = true;
    tag.userData.targetOpacity = state.focusLayer == null ? 0.9 : focused ? 1 : 0.28;
    tag.userData.targetScale = focused ? 1.45 : 1;
    tag.userData.visibleBase = true; // layoutTags() decides on-screen visibility
  });
  ctx.planeGroups.forEach((g, i) => {
    const dim = state.focusLayer != null && i !== state.focusLayer;
    const focused = state.focusLayer === i;
    g.children.forEach((ch) => {
      if (!ch.material || ch.material.opacity == null) return;
      if (ch.userData.isSlicePlane) {
        ch.userData.targetOpacity = dim ? 0 : focused ? 0.14 : ch.userData.baseOpacity;
      }
    });
  });
}

function lerpVisibility(ctx) {
  const k = 0.18;
  const ease = (list) =>
    list.forEach((s) => {
      if (!s.visible || !s.material) return;
      if (s.userData.targetOpacity != null) {
        s.material.opacity += (s.userData.targetOpacity - s.material.opacity) * k;
      }
      if (s.userData.targetScale != null) {
        const cur = s.scale.x / (s.userData.baseW * UNIT);
        const next = cur + (s.userData.targetScale - cur) * k;
        s.scale.x = next * s.userData.baseW * UNIT;
        s.scale.y = next * s.userData.baseH * UNIT;
      }
    });
  ease(ctx.sprites);
  ease([...ctx.labelSprites.values()]);
  ease(ctx.tagSprites);
  ctx.tagSprites.forEach((tag) => {
    const leader = tag.userData.leader;
    if (leader && leader.visible) {
      leader.material.opacity += (tag.material.opacity * 0.55 - leader.material.opacity) * k;
    }
  });
  ctx.planeGroups.forEach((g) => {
    g.children.forEach((ch) => {
      if (ch.userData.targetOpacity == null || !ch.material) return;
      ch.material.opacity += (ch.userData.targetOpacity - ch.material.opacity) * k;
    });
  });
}

/** [C-PULL][C-RETRACT] Cube exit eases along −x and back. */
function lerpPullOut(ctx) {
  if (state.focusLayer != null) ctx.exitStayLayer = state.focusLayer;
  const stay =
    state.focusLayer != null ? state.focusLayer : ctx.exitStayLayer;
  const target = state.focusLayer == null ? 0 : cubeExitX();
  const cur = ctx.cubeExit ?? 0;
  const diff = target - cur;
  const k = 0.13 + Math.min(0.12, Math.abs(diff) * 0.12);
  const next = cur + diff * k;
  ctx.cubeExit = Math.abs(next - target) < 0.001 ? target : next;
  ctx.planeGroups.forEach((g, i) => {
    g.userData.exitX = stay != null && i !== stay ? ctx.cubeExit : 0;
    placeSliceGroup(g, i);
  });
  if (state.focusLayer == null && ctx.cubeExit < 0.001) {
    ctx.cubeExit = 0;
    ctx.exitStayLayer = null;
  }
}

/** [C-SPINE] Dynamic tag layout: project slice-top anchors to screen, stack the
 *  tags upward without overlap, then write world positions back. Each tag's
 *  thin leader line runs from its slice top to the tag and updates per frame. */
function layoutTags(ctx) {
  const el = ctx.renderer.domElement;
  const W = el.clientWidth || 1;
  const H = el.clientHeight || 1;
  const cam = ctx.camera;
  const tan = Math.tan(THREE.MathUtils.degToRad(cam.fov / 2));
  const anchorYUser = 10.02; // just above the face top (y=10)
  const anchors = [];
  ctx.tagSprites.forEach((tag) => {
    const i = tag.userData.stageIndex;
    const g = ctx.planeGroups[i];
    if (!g) return;
    const anchorLocal = new THREE.Vector3(0, (anchorYUser - LAYOUT.faceCenter.y) * UNIT, 0);
    const anchorWorld = g.localToWorld(anchorLocal.clone());
    const depth = cam.position.distanceTo(anchorWorld);
    const sp = anchorWorld.clone().project(cam);
    const inView = sp.z < 1 && sp.z > -1;
    const px = ((sp.x + 1) / 2) * W;
    const py = ((1 - sp.y) / 2) * H;
    const ppm = H / (2 * depth * tan); // pixels per meter at this depth
    anchors.push({ tag, i, anchorLocal, anchorWorld, inView, px, py, ppm });
  });
  // Topmost anchor first, so lower tags stack above the ones already placed.
  anchors.sort((a, b) => a.py - b.py);
  const placed = [];
  const GAP = 6;
  const RISE = 30;
  anchors.forEach((a) => {
    const baseVisible = a.tag.userData.visibleBase;
    const leader = a.tag.userData.leader;
    a.tag.visible = baseVisible && a.inView;
    if (leader) leader.visible = baseVisible && a.inView;
    if (!(baseVisible && a.inView)) return;
    const tagHpx = a.tag.scale.y * a.ppm;
    const tagWpx = a.tag.scale.x * a.ppm;
    let top = a.py - RISE - tagHpx; // desired: just above its own anchor
    for (const p of placed) {
      const xOverlap = Math.abs(a.px - p.x) < (tagWpx + p.w) / 2 + 4;
      if (xOverlap && top < p.bottom + GAP && top + tagHpx > p.top - GAP) {
        top = p.top - GAP - tagHpx; // push up above the colliding tag
      }
    }
    placed.push({ top, bottom: top + tagHpx, x: a.px, w: tagWpx });
    const centerPx = top + tagHpx / 2;
    const dyPx = a.py - centerPx; // pixels above the anchor (screen up)
    const worldY = anchorYUser + dyPx / a.ppm / UNIT;
    const localY = (worldY - LAYOUT.faceCenter.y) * UNIT;
    a.tag.position.set(0, localY, 0);
    if (leader) {
      const geo = leader.geometry;
      const pos = geo.attributes.position;
      pos.setXYZ(0, a.anchorLocal.x, a.anchorLocal.y, a.anchorLocal.z);
      pos.setXYZ(1, 0, localY, 0);
      pos.needsUpdate = true;
    }
  });
}

function framingDistance() {
  const span = Math.max(gapNow(), (N_LAYERS() - 1) * gapNow());
  return Math.max(7.2, Math.hypot(span, FACE) * 1.15);
}

/** [C-MAP] User (s, x, y) → world Three.js, including root yaw. */
function userToWorld(ctx, coord) {
  return ctx.root.localToWorld(v3(coordToLocal(coord, N_LAYERS(), gapNow())));
}

/**
 * [C-STDVIEW] Standard framing in (s, x, y):
 * - focused s*: camera (s*+10, 5, 5) → look (s*, 5, 5) (from +s / front)
 * - no focus: camera (24, 21, 21) → user origin (0, 0, 0)
 */
function standardPose(ctx) {
  if (state.focusLayer != null) {
    const sStar = state.focusLayer;
    const cam = LAYOUT.camera.pulled;
    return {
      pos: userToWorld(ctx, { s: sStar + cam.sOffset, x: cam.x, y: cam.y }),
      target: userToWorld(ctx, { s: sStar, x: cam.x, y: cam.y }),
    };
  }
  const overview = LAYOUT.camera.overview;
  return {
    pos: userToWorld(ctx, overview.pos),
    target: userToWorld(ctx, overview.target),
  };
}

function startCamAnim(ctx, toPos, toTarget, dur = 480) {
  ctx.camAnim = {
    fromPos: ctx.camera.position.clone(),
    fromTarget: ctx.controls.target.clone(),
    toPos: toPos.clone(),
    toTarget: toTarget.clone(),
    t0: performance.now(),
    dur,
  };
}

function stepCamAnim(ctx) {
  const a = ctx.camAnim;
  if (!a) return;
  const u = Math.min(1, (performance.now() - a.t0) / a.dur);
  const e = 1 - (1 - u) ** 3;
  ctx.camera.position.lerpVectors(a.fromPos, a.toPos, e);
  ctx.controls.target.lerpVectors(a.fromTarget, a.toTarget, e);
  if (u >= 1) ctx.camAnim = null;
}

/** [C-STDVIEW] Snap to standardPose for current focus state. */
function goStandardView(ctx, animate = true) {
  const { pos, target } = standardPose(ctx);
  ctx.camAnim = null;
  if (animate) startCamAnim(ctx, pos, target, 520);
  else {
    ctx.camera.position.copy(pos);
    ctx.controls.target.copy(target);
    ctx.controls.update();
  }
}

function resetCamera(ctx) {
  state.focusLayer = null;
  state.selectedId = null;
  state.hoverId = null;
  ctx.cubeExit = 0;
  ctx.exitStayLayer = null;
  goStandardView(ctx, true);
  queueVisibilityTargets(ctx);
  ctx.hooks.onReset?.();
}

/** [C-FOCUS-ACT][C-PULL] Toggle/set focus; pull via exit; do not move camera. */
function focusStage(ctx, i) {
  const n = N_LAYERS();
  if (i == null || i < 0 || i >= n) return;
  if (state.focusLayer === i) {
    ctx.exitStayLayer = state.focusLayer;
    state.focusLayer = null;
    state.selectedId = null;
    state.hoverId = null;
    queueVisibilityTargets(ctx);
    ctx.hooks.onClear?.();
    return;
  }
  state.focusLayer = i;
  ctx.exitStayLayer = i;
  state.selectedId = null;
  queueVisibilityTargets(ctx);
  // [C-CAM-HOLD] Keep current camera — no recenter toward cube interior
  ctx.hooks.onFocusChange?.();
}

/** [C-ESC] Clear select first, then focus; camera unchanged. */
function clearFocus(ctx) {
  if (state.selectedId != null) {
    state.selectedId = null;
    queueVisibilityTargets(ctx);
    if (state.focusLayer != null) ctx.hooks.onFocusChange?.();
    else ctx.hooks.onClear?.();
    return;
  }
  if (state.focusLayer != null) {
    ctx.exitStayLayer = state.focusLayer;
    state.focusLayer = null;
    state.hoverId = null;
    queueVisibilityTargets(ctx);
    ctx.hooks.onClear?.();
    return;
  }
  ctx.hooks.onClear?.();
}

function selectCompany(ctx, id) {
  const c = companyById(id);
  if (!c) return;
  state.selectedId = id;
  state.focusLayer = c.layer;
  ctx.exitStayLayer = c.layer;
  const base = c.coord;
  const toTarget = userToWorld(ctx, base);
  const toPos = userToWorld(ctx, { s: base.s + 6, x: base.x + 1.4, y: base.y + 1.4 });
  startCamAnim(ctx, toPos, toTarget, 420);
  queueVisibilityTargets(ctx);
  ctx.hooks.onSelect?.(c);
}

function applyKeyboard(ctx) {
  const { keys, camera, controls, root } = ctx;
  const yawSpeed = 0.035;
  if (keys.has("q")) root.rotation.y += yawSpeed;
  if (keys.has("e")) root.rotation.y -= yawSpeed;

  const fast = keys.has("shift");
  const panSpeed = fast ? 0.22 : 0.12;
  const right = new THREE.Vector3();
  const up = new THREE.Vector3();
  right.setFromMatrixColumn(camera.matrix, 0);
  up.setFromMatrixColumn(camera.matrix, 1);
  const delta = new THREE.Vector3();
  if (keys.has("a") || keys.has("arrowleft")) delta.addScaledVector(right, -panSpeed);
  if (keys.has("d") || keys.has("arrowright")) delta.addScaledVector(right, panSpeed);
  if (keys.has("w") || keys.has("arrowup")) delta.addScaledVector(up, panSpeed);
  if (keys.has("s") || keys.has("arrowdown")) delta.addScaledVector(up, -panSpeed);
  // R / F — dolly toward / away from orbit target (same axis as wheel, scale with distance)
  if (keys.has("r") || keys.has("f")) {
    const offset = camera.position.clone().sub(controls.target);
    const dist = Math.max(offset.length(), 0.35);
    const dir = offset.multiplyScalar(1 / dist);
    const step = (keys.has("r") ? -1 : 1) * panSpeed * Math.max(dist, 1.2) * 0.085;
    let newDist = dist + step;
    newDist = Math.min(controls.maxDistance, Math.max(controls.minDistance, newDist));
    camera.position.copy(controls.target).addScaledVector(dir, newDist);
  }
  if (delta.lengthSq() > 0) {
    camera.position.add(delta);
    controls.target.add(delta);
  }
}

function wireInput(ctx, viewport) {
  const el = ctx.renderer.domElement;
  el.addEventListener("contextmenu", (e) => e.preventDefault()); // right-drag = pan

  // Wheel: exponential dolly toward target — wide min/max like R/F reach
  el.addEventListener(
    "wheel",
    (e) => {
      e.preventDefault();
      const { camera, controls } = ctx;
      const offset = new THREE.Vector3().subVectors(camera.position, controls.target);
      const dist = offset.length();
      if (dist < 1e-6) return;
      const zoomFactor = Math.exp(e.deltaY * 0.00135);
      let newDist = dist * zoomFactor;
      newDist = Math.min(controls.maxDistance, Math.max(controls.minDistance, newDist));
      offset.setLength(newDist);
      camera.position.copy(controls.target).add(offset);
    },
    { passive: false }
  );

  window.addEventListener("keydown", (e) => {
    const k = e.key.toLowerCase();
    if (["q", "e", "w", "a", "s", "d", "r", "f", "c"].includes(k)) e.preventDefault();
    if (e.key === "Shift") ctx.keys.add("shift");
    else ctx.keys.add(k);
    if (e.key === "[" || e.key === "]") {
      e.preventDefault();
      const step = e.key === "]" ? 1 : -1;
      const n = N_LAYERS();
      const cur = state.focusLayer == null ? Math.round(n / 2) : state.focusLayer;
      focusStage(ctx, Math.max(0, Math.min(n - 1, cur + step)));
    }
    if (k === "c") {
      e.preventDefault();
      goStandardView(ctx, true);
    }
    if (e.key === "Escape") {
      e.preventDefault();
      clearFocus(ctx);
    }
  });
  window.addEventListener("keyup", (e) => {
    if (e.key === "Shift") ctx.keys.delete("shift");
    else ctx.keys.delete(e.key.toLowerCase());
  });

  el.addEventListener("pointerdown", (e) => {
    ctx.pointerState.x = e.clientX;
    ctx.pointerState.y = e.clientY;
    ctx.pointerState.btn = e.button;
    ctx.pointerState.moved = false;
    if (e.button === 0 || e.button === 2) ctx.camAnim = null; // manual orbit/pan wins
    if (e.button === 1) e.preventDefault();
  });
  el.addEventListener("pointerup", (e) => {
    if (ctx.pointerState.btn === 1) {
      e.preventDefault();
      if (!ctx.pointerState.moved) goStandardView(ctx, true);
      return;
    }
    if (ctx.pointerState.btn !== 0) return;
    if (!ctx.pointerState.moved) pick(ctx, e);
  });
  el.addEventListener("dblclick", (e) => {
    setPointer(ctx, e);
    const hits = ctx.raycaster.intersectObjects(ctx.sprites.filter((s) => s.visible), false);
    if (!hits.length) clearFocus(ctx);
  });
  el.addEventListener("pointermove", (e) => {
    const dx = e.clientX - ctx.pointerState.x;
    const dy = e.clientY - ctx.pointerState.y;
    if (dx * dx + dy * dy > 16) ctx.pointerState.moved = true;
    hover(ctx, e, viewport);
  });
  el.addEventListener("pointerleave", () => {
    state.hoverId = null;
    ctx.hooks.onHover?.(null, null);
    queueVisibilityTargets(ctx);
  });
}

function setPointer(ctx, event) {
  const rect = ctx.renderer.domElement.getBoundingClientRect();
  ctx.pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  ctx.pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  ctx.raycaster.setFromCamera(ctx.pointer, ctx.camera);
  return rect;
}

/**
 * [C-PULL-ZONE] Square-minus-disk on the slice face, in user (s, x, y):
 * inside the face, outside the outermost ring. Hits inside the ring
 * do not toggle focus.
 */
function isPullFrameHit(ctx, hit) {
  const g = hit.object.parent;
  if (!g) return false;
  const rootLocal = ctx.root.worldToLocal(hit.point.clone());
  const coord = localToCoord(rootLocal, N_LAYERS(), gapNow());
  const dx = coord.x - LAYOUT.faceCenter.x;
  const dy = coord.y - LAYOUT.faceCenter.y;
  const half = FACE_SPAN / 2;
  if (Math.abs(dx) > half + 1e-4 || Math.abs(dy) > half + 1e-4) return false;
  const R = LAYOUT.ringRadius;
  return dx * dx + dy * dy > R * R;
}

/** [C-PICK] Company disc first; stage tag; else slice plane in [C-PULL-ZONE]. */
function pick(ctx, event) {
  setPointer(ctx, event);
  const spriteHits = ctx.raycaster.intersectObjects(
    ctx.sprites.filter((s) => s.visible),
    false
  );
  if (spriteHits.length) {
    selectCompany(ctx, spriteHits[0].object.userData.companyId);
    return;
  }
  const tagHits = ctx.raycaster.intersectObjects(
    ctx.tagSprites.filter((s) => s.visible),
    false
  );
  if (tagHits.length) {
    focusStage(ctx, tagHits[0].object.userData.stageIndex);
    return;
  }
  const planes = [];
  ctx.planeGroups.forEach((g) => {
    g.children.forEach((ch) => {
      if (ch.userData && ch.userData.isSlicePlane) planes.push(ch);
    });
  });
  const planeHits = ctx.raycaster.intersectObjects(planes, false);
  if (!planeHits.length) return;
  const hit = planeHits[0];
  if (!isPullFrameHit(ctx, hit)) return;
  focusStage(ctx, hit.object.parent.userData.layer);
}

function hover(ctx, event, viewport) {
  const rect = setPointer(ctx, event);
  const hits = ctx.raycaster.intersectObjects(
    ctx.sprites.filter((s) => s.visible),
    false
  );
  const id = hits.length ? hits[0].object.userData.companyId : null;
  if (id !== state.hoverId) {
    state.hoverId = id;
    queueVisibilityTargets(ctx);
    const c = id != null ? companyById(id) : null;
    const local = {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
    ctx.hooks.onHover?.(c, local);
  } else if (id != null) {
    ctx.hooks.onHover?.(companyById(id), {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    });
  }
}

function resize(ctx, viewport) {
  const w = viewport.clientWidth || 1;
  const h = viewport.clientHeight || 1;
  ctx.camera.aspect = w / h;
  ctx.camera.updateProjectionMatrix();
  ctx.renderer.setSize(w, h, false);
}
