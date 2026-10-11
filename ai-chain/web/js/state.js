/** Shared app state + URL hash sync.
 * Concepts: ../CONCEPTS.md — [C-FOCUS] focusLayer, [C-SELECT] selectedId, [C-FILTER] filterMode.
 */

export const COLORS = {
  US: 0x3cf0ff,
  INTL: 0xffb020,
  PLANE: 0xe4ebf2,
  EDGE: 0x8fa3b6,
};

export const state = {
  layers: [],
  companies: [],
  countries: {},
  filterMode: "all",
  focusLayer: null, // [C-FOCUS] slice index or null (also the stage filter from the left panel)
  selectedId: null, // [C-SELECT]
  hoverId: null, // [C-HOVER]
  revMin: null, // [C-FILTER] revenue floor, US$ billion (≥)
  revMax: null, // [C-FILTER] revenue ceiling, US$ billion (≤)
  d: 2.5, // [C-D] stage gap factor; meters = d·UNIT; UI % = 100·d (default 250% — wide cloud)
  helpOpen: false,
  /** [C-HOME] BICS code from /cube?bics= — any level; context only until companies attach */
  bicsCode: null,
  bicsName: null,
  bicsLevel: null,
};

export function visibleCompanies() {
  return state.companies.filter(passesFilter);
}

export function passesFilter(c) {
  if (state.filterMode === "us") {
    if (c.country !== "US") return false;
  } else if (state.filterMode === "intl") {
    if (c.country === "US") return false;
  }
  const rev = c.revBn;
  if (state.revMin != null || state.revMax != null) {
    if (rev == null) return false; // unknown revenue is excluded from a revenue filter
    if (state.revMin != null && rev < state.revMin) return false;
    if (state.revMax != null && rev > state.revMax) return false;
  }
  return true;
}

export function readHash() {
  const q = new URLSearchParams(location.search);
  const bics = q.get("bics");
  if (bics) state.bicsCode = bics;

  const h = new URLSearchParams(location.hash.replace(/^#/, ""));
  const slice = h.get("slice");
  const filter = h.get("filter");
  const id = h.get("id");
  const rmin = h.get("rmin");
  const rmax = h.get("rmax");
  if (filter && ["all", "us", "intl"].includes(filter)) {
    state.filterMode = filter;
  }
  if (slice != null && slice !== "") {
    const n = Number(slice);
    if (Number.isInteger(n) && n >= 0 && n < state.layers.length) state.focusLayer = n;
  }
  if (id != null && id !== "") {
    const n = Number(id);
    if (Number.isInteger(n)) state.selectedId = n;
  }
  if (rmin != null && rmin !== "" && !Number.isNaN(Number(rmin))) state.revMin = Number(rmin);
  if (rmax != null && rmax !== "" && !Number.isNaN(Number(rmax))) state.revMax = Number(rmax);
}

export async function resolveBicsLabel() {
  if (!state.bicsCode) return;
  try {
    const res = await fetch(`/api/bics/node?code=${encodeURIComponent(state.bicsCode)}`);
    if (!res.ok) return;
    const data = await res.json();
    const hit = data.node;
    if (hit) {
      state.bicsName = hit.name;
      state.bicsLevel = hit.level;
    }
  } catch {
    /* ignore */
  }
}

export function writeHash() {
  const h = new URLSearchParams();
  if (state.filterMode && state.filterMode !== "all") h.set("filter", state.filterMode);
  if (state.focusLayer != null) h.set("slice", String(state.focusLayer));
  if (state.selectedId != null) h.set("id", String(state.selectedId));
  if (state.revMin != null) h.set("rmin", String(state.revMin));
  if (state.revMax != null) h.set("rmax", String(state.revMax));
  const next = h.toString();
  const hash = next ? `#${next}` : "";
  if (location.hash !== hash) {
    history.replaceState(null, "", hash || location.pathname + location.search);
  }
}

export function companyById(id) {
  return state.companies.find((c) => c.id === id) || null;
}
