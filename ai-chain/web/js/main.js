import { fetchBundle } from "./api.js";
import { state, readHash, resolveBicsLabel } from "./state.js";
import { createScene } from "./scene.js";
import { createUI } from "./ui.js";

const bootError = document.getElementById("bootError");
const app = document.getElementById("app");

function showError(err) {
  bootError.hidden = false;
  bootError.textContent = String(err && err.stack ? err.stack : err);
  bootError.onclick = () => {
    bootError.hidden = true;
  };
}

window.addEventListener("error", (e) => console.error(e.error || e.message));
window.addEventListener("unhandledrejection", (e) => console.error(e.reason));

/** [C-CUBE] No splash here — C-SPLASH lives on C-HOME only. */
async function boot() {
  try {
    const bundle = await fetchBundle();
    state.layers = bundle.layers;
    state.companies = bundle.companies;
    state.countries = bundle.meta?.countries || {};

    app.hidden = false;

    const viewport = document.getElementById("viewport");
    let ui;
    const sceneApi = createScene(viewport, {
      onSelect: (c) => ui?.onSelect(c),
      onFocusChange: () => ui?.onFocusChange(),
      onClear: () => ui?.onClear(),
      onReset: () => ui?.onReset(),
      onHover: (c, local) => ui?.showHover(c, local),
    });
    ui = createUI(sceneApi);
    ui.renderLayers();
    readHash();
    await resolveBicsLabel();
    ui.hydrateFromHash();
  } catch (err) {
    showError(err);
    throw err;
  }
}

boot();
