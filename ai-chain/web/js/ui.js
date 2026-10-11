/** UI panels. Concepts: ../CONCEPTS.md ([C-STDVIEW], [C-FOCUS], …). */
import {
  state,
  passesFilter,
  writeHash,
  companyById,
  visibleCompanies,
} from "./state.js";
import { formatCoord, displayIndustryCoord } from "./coords.js";
import { STAGE_INTROS } from "./stage-intros.js";

export function createUI(sceneApi) {
  const detail = document.getElementById("detail");
  const results = document.getElementById("results");
  const statusBar = document.getElementById("statusBar");
  const hoverTip = document.getElementById("hoverTip");
  const navHint = document.getElementById("navHint");
  const helpToggle = document.getElementById("helpToggle");
  const stageGate = document.getElementById("stageGate");
  const stageList = document.getElementById("stageList");
  const stageIntro = document.getElementById("stageIntro");
  const stageBack = document.getElementById("stageBack");
  const gateOverview = document.getElementById("gateOverview");
  const stageFilter = document.getElementById("stageFilter");
  const revMinEl = document.getElementById("revMin");
  const revMaxEl = document.getElementById("revMax");
  const revClear = document.getElementById("revClear");
  let searchTimer = null;
  let gateSelected = null; // stage highlighted in the chooser

  // Layer list chrome removed — focus via plane click / [ ] / search / right float roster.
  function renderLayers() {}
  function syncLayerActive() {}

  // —— [C-GATE] Pre-cube stage chooser ——
  function enterStage(i) {
    stageGate.hidden = true;
    sceneApi.focusStage(i);
    sceneApi.goStandardView(); // face-on framing of the popped-out slice
  }

  function renderStageIntro(i) {
    const L = state.layers[i];
    const info = STAGE_INTROS[i];
    const up = i > 0 ? state.layers[i - 1] : null;
    const down = i + 1 < state.layers.length ? state.layers[i + 1] : null;
    stageIntro.innerHTML = `
      <h3>${i + 1} · ${L.name}</h3>
      <p class="stage-zh">${info ? info.zh : ""}</p>
      <p class="stage-blurb">${L.blurb}</p>
      <p class="stage-desc">${info ? info.desc : L.blurb}</p>
      <div class="stage-rel">
        <div class="stage-rel-box">
          <div class="rel-label">Upstream / 上游</div>
          <div class="rel-name">${up ? `${up.idx + 1} · ${up.name}` : "无（链条起点）"}</div>
        </div>
        <div class="stage-rel-box">
          <div class="rel-label">Downstream / 下游</div>
          <div class="rel-name">${down ? `${down.idx + 1} · ${down.name}` : "无（链条末端）"}</div>
        </div>
      </div>
      <button class="stage-enter" id="gateEnter" type="button">进入该环节 → Enter</button>
    `;
    stageIntro.querySelector("#gateEnter").addEventListener("click", () => enterStage(i));
  }

  function renderStageList() {
    stageList.innerHTML = "";
    state.layers.forEach((L, i) => {
      const info = STAGE_INTROS[i];
      const row = document.createElement("button");
      row.type = "button";
      row.className = "stage-row" + (gateSelected === i ? " is-on" : "");
      row.innerHTML = `
        <span class="stage-idx">${i + 1}</span>
        <span class="stage-text">
          <span class="stage-name">${L.name}</span>
          <span class="stage-name-zh">${info ? info.zh : ""}</span>
        </span>
      `;
      row.addEventListener("click", () => {
        if (gateSelected === i) {
          enterStage(i); // second click = choose
          return;
        }
        gateSelected = i;
        renderStageList();
        renderStageIntro(i);
      });
      row.addEventListener("dblclick", () => enterStage(i));
      stageList.appendChild(row);
    });
  }

  function showGate() {
    gateSelected = state.focusLayer;
    stageGate.hidden = false;
    renderStageList();
    if (gateSelected != null) renderStageIntro(gateSelected);
    else {
      stageIntro.innerHTML = `<p class="note">Select a stage on the left to read its intro. Click it again (or use the button) to enter that slice — the slice pops out of the cube.</p>`;
    }
  }

  stageBack.addEventListener("click", showGate);
  gateOverview.addEventListener("click", () => {
    stageGate.hidden = true;
    sceneApi.resetCamera();
  });

  // —— [C-FILTER] Left-panel filter module: stage + revenue range (US$ bn) ——
  state.layers.forEach((L, i) => {
    const opt = document.createElement("option");
    opt.value = String(i);
    opt.textContent = `${i + 1} · ${L.name}`;
    stageFilter.appendChild(opt);
  });

  function syncStageFilterSelect() {
    stageFilter.value = state.focusLayer == null ? "" : String(state.focusLayer);
  }

  stageFilter.addEventListener("change", () => {
    const v = stageFilter.value;
    if (v === "") sceneApi.clearFocus();
    else sceneApi.focusStage(Number(v));
  });

  function applyRevFilter() {
    const lo = revMinEl.value.trim();
    const hi = revMaxEl.value.trim();
    state.revMin = lo === "" ? null : Number(lo);
    state.revMax = hi === "" ? null : Number(hi);
    if (state.revMin != null && state.revMax != null && state.revMin > state.revMax) {
      const t = state.revMin;
      state.revMin = state.revMax;
      state.revMax = t;
      revMinEl.value = String(state.revMin);
      revMaxEl.value = String(state.revMax);
    }
    sceneApi.applyVisibility();
    if (state.focusLayer != null) renderLayerRoster(state.focusLayer);
    updateStatus();
    writeHash();
  }
  revMinEl.addEventListener("input", applyRevFilter);
  revMaxEl.addEventListener("input", applyRevFilter);
  revClear.addEventListener("click", () => {
    revMinEl.value = "";
    revMaxEl.value = "";
    applyRevFilter();
  });

  function revNote() {
    if (state.revMin == null && state.revMax == null) return "";
    const lo = state.revMin != null ? `≥$${state.revMin}B` : "";
    const hi = state.revMax != null ? `≤$${state.revMax}B` : "";
    const mid = lo && hi ? " " : "";
    return ` · rev ${lo}${mid}${hi}`;
  }

  function updateStatus() {
    const vis = visibleCompanies();
    if (state.selectedId != null) {
      const c = companyById(state.selectedId);
      const L = c ? state.layers[c.layer] : null;
      statusBar.textContent = c
        ? `Selected · ${c.name}${c.ticker ? " (" + c.ticker + ")" : ""} · ${L?.name || ""} · Esc clears selection`
        : `Selected · Esc clears`;
      return;
    }
    if (state.focusLayer != null) {
      const L = state.layers[state.focusLayer];
      const n = vis.filter((c) => c.layer === state.focusLayer).length;
      statusBar.textContent = `Slice ${state.focusLayer + 1}: ${L.name} · slice stays · cube exits −x (left) · ${n} visible · C face-on · Esc clears${revNote()}`;
    } else {
      const gate = state.bicsCode
        ? ` · BICS L${state.bicsLevel || "?"} ${state.bicsCode}${state.bicsName ? " " + state.bicsName : ""}`
        : "";
      statusBar.textContent = `All slices · ${vis.length} visible · C standard · click a company, stage tag or slice${gate}${revNote()}`;
    }
  }

  function setDetailDefault() {
    detail.innerHTML = `<p>Click a company dot, a stage tag, or a slice. The focused slice stays; the rest of the cube shifts left along −x and fades. Esc clears selection, then focus.</p>`;
  }

  function fmtUsd(v) {
    if (v == null || v === "" || Number.isNaN(Number(v))) return "—";
    const n = Number(v);
    const a = Math.abs(n);
    if (a >= 1e12) return "$" + (n / 1e12).toFixed(2) + "T";
    if (a >= 1e9) return "$" + (n / 1e9).toFixed(2) + "B";
    if (a >= 1e6) return "$" + (n / 1e6).toFixed(0) + "M";
    return "$" + n.toFixed(0);
  }

  function pointSizeBasis(c) {
    if (c.bloomberg?.mkt_cap != null) return fmtUsd(c.bloomberg.mkt_cap) + " market cap (log)";
    if (c.revBn != null) return "~" + fmtUsd(c.revBn * 1e9) + " revenue proxy (no Bloomberg row)";
    return "—";
  }

  function renderDetail(c) {
    const region = state.countries[c.country] || c.country;
    const usTag = c.country === "US" ? "US" : "Non-US";
    const L = state.layers[c.layer];
    // [C-COMPANY] Real Bloomberg 20261003 membership row, attached server-side
    // only on an exact ticker+venue match that also passes the name guard.
    const bb = c.bloomberg;
    const bbRows = bb
      ? `
        <span>Market cap</span><span>${fmtUsd(bb.mkt_cap)}</span>
        <span>Industry revenue</span><span>${fmtUsd(bb.ind_rev)}</span>
        <span>Industry % of total rev</span><span>${bb.pct_tot_rev != null ? Number(bb.pct_tot_rev).toFixed(1) + "%" : "—"}</span>
        <span>BICS industry</span><span>${bb.l4_name || "—"}${bb.l1_name ? " · " + bb.l1_name : ""}</span>
        <span>Industry coord</span><span>${displayIndustryCoord(bb.legal_entity_coord) || "—"}</span>
        <span>Bloomberg row</span><span>${bb.ticker}</span>`
      : `
        <span>Bloomberg row</span><span>Not attached — no exact ticker in the 20261003 pull</span>`;
    detail.innerHTML = `
      <h3>${c.name}</h3>
      <div class="meta">${L?.name || ""} | ${region} | ${usTag}</div>
      <div class="kv">
        <span>Ticker</span><span>${c.ticker || "—"}</span>
        <span>Country</span><span>${region}</span>
        <span>Revenue (approx.)</span><span>${c.revBn != null ? `$${c.revBn}B / yr` : "—"}</span>
        <span>Size score</span><span>${c.revScore != null ? c.revScore.toFixed(1) + " / 100" : "—"}</span>
        <span>Point size</span><span>${pointSizeBasis(c)}</span>
        <span>Position (s, x, y)</span><span>${formatCoord(c.coord)}</span>
        <span>Alphabet link</span><span>${c.valueM != null ? `~$${c.valueM.toFixed(0)}M (GOOGL_SUPPLY)` : "Not in quantified supplier table"}</span>
        <span>Data source</span><span>${c.source || "—"}</span>
        <span>Source note</span><span>${c.sourceDetail || "—"}</span>
        <span>Role note</span><span>${c.note || "—"}</span>
      </div>
      <h2>Bloomberg · 20261003 pull</h2>
      <div class="kv">${bbRows}</div>
    `;
  }

  /** [C-FOCUS-ACT] Stage card: intro, chain map, upstream / downstream, roster. Display numbering is 1-based. */
  function renderLayerRoster(layerIdx) {
    const L = state.layers[layerIdx];
    const info = STAGE_INTROS[layerIdx];
    const up = layerIdx > 0 ? state.layers[layerIdx - 1] : null;
    const down = layerIdx + 1 < state.layers.length ? state.layers[layerIdx + 1] : null;
    const rows = state.companies.filter((c) => c.layer === layerIdx && passesFilter(c));
    const chainMap = state.layers
      .map((l, i) =>
        i === layerIdx ? `<strong>${i + 1} ${l.name}</strong>` : `${i + 1} ${l.name}`
      )
      .join(" → ");
    const list = rows
      .map((c) => {
        const src = c.valueM != null ? `GOOGL_SUPPLY (~$${c.valueM.toFixed(0)}M)` : c.source;
        return `<tr data-id="${c.id}"><td>${c.name}</td><td>${c.ticker || "—"}</td><td>$${(c.revBn ?? 0).toFixed(1)}B</td><td>${(c.revScore ?? 0).toFixed(0)}</td><td>${src}</td></tr>`;
      })
      .join("");
    detail.innerHTML = `
      <h3>${layerIdx + 1} · ${L.name}</h3>
      <div class="meta">Stage ${layerIdx + 1} of ${state.layers.length} along the chain</div>
      ${info ? `<p class="note stage-card-desc">${info.desc}</p>` : `<p class="note">${L.blurb}</p>`}
      <h2>Chain map</h2>
      <p class="note">${chainMap}</p>
      <h2>Upstream (supply side)</h2>
      <div class="kv" style="grid-template-columns:1fr;">
        ${up
          ? `<span>${up.idx + 1} · ${up.name}</span><span>${up.blurb}</span>`
          : `<span>None</span><span>Chain start — power generation feeds everything downstream.</span>`}
      </div>
      <h2>Downstream (demand side)</h2>
      <div class="kv" style="grid-template-columns:1fr;">
        ${down
          ? `<span>${down.idx + 1} · ${down.name}</span><span>${down.blurb}</span>`
          : `<span>None</span><span>Chain end — models and applications are the final demand.</span>`}
      </div>
      <h2>Companies in this stage (${rows.length})</h2>
      <div class="kv" style="grid-template-columns:1fr; gap:8px;">
        <table style="width:100%; border-collapse:collapse; font-size:12px;">
          <thead>
            <tr style="color:var(--muted); text-align:left;">
              <th style="padding:3px 4px;">Company</th>
              <th style="padding:3px 4px;">Ticker</th>
              <th style="padding:3px 4px;">Rev</th>
              <th style="padding:3px 4px;">Score</th>
              <th style="padding:3px 4px;">Source</th>
            </tr>
          </thead>
          <tbody>${list}</tbody>
        </table>
      </div>
    `;
    detail.querySelectorAll("tbody tr").forEach((tr) => {
      tr.style.cursor = "pointer";
      tr.addEventListener("click", () => {
        sceneApi.selectCompany(Number(tr.dataset.id));
      });
    });
  }

  document.querySelectorAll(".chip[data-filter]").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.filterMode = btn.dataset.filter;
      document.querySelectorAll(".chip[data-filter]").forEach((b) =>
        b.classList.toggle("active", b === btn)
      );
      sceneApi.applyVisibility();
      updateStatus();
      writeHash();
      if (state.focusLayer != null) renderLayerRoster(state.focusLayer);
    });
  });

  document.getElementById("resetCam").addEventListener("click", () => {
    sceneApi.resetCamera();
    syncLayerActive();
    setDetailDefault();
    updateStatus();
    writeHash();
  });

  // [C-STDVIEW]
  document.getElementById("standardView").addEventListener("click", () => {
    sceneApi.goStandardView();
  });

  const gapD = document.getElementById("gapD");
  const gapDPct = document.getElementById("gapDPct");
  function syncGapDUI() {
    const pct = Math.round(state.d * 100);
    gapD.value = String(pct);
    gapDPct.textContent = `${pct}%`;
  }
  syncGapDUI();
  gapD.addEventListener("input", () => {
    state.d = Number(gapD.value) / 100;
    gapDPct.textContent = `${gapD.value}%`;
    sceneApi.layoutCloud();
  });

  navHint.classList.toggle("hidden", !state.helpOpen);

  document.getElementById("search").addEventListener("input", (e) => {
    const q = e.target.value.trim().toLowerCase();
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
      results.innerHTML = "";
      if (!q) return;
      state.companies
        .filter(
          (c) =>
            c.name.toLowerCase().includes(q) ||
            (c.ticker && c.ticker.toLowerCase().includes(q))
        )
        .slice(0, 12)
        .forEach((c) => {
          const b = document.createElement("button");
          b.type = "button";
          b.textContent = `${c.name}${c.ticker ? "  " + c.ticker : ""}`;
          b.addEventListener("click", () => sceneApi.selectCompany(c.id));
          results.appendChild(b);
        });
    }, 120);
  });

  helpToggle.addEventListener("click", () => {
    state.helpOpen = !state.helpOpen;
    navHint.classList.toggle("hidden", !state.helpOpen);
  });
  window.addEventListener("keydown", (e) => {
    if (e.key === "?" || (e.key === "/" && e.shiftKey)) {
      e.preventDefault();
      helpToggle.click();
    }
  });

  return {
    renderLayers,
    syncLayerActive,
    updateStatus,
    setDetailDefault,
    renderDetail,
    renderLayerRoster,
    showHover(c, local) {
      if (!c || !local) {
        hoverTip.hidden = true;
        return;
      }
      hoverTip.hidden = false;
      hoverTip.textContent = `${c.name}${c.ticker ? " · " + c.ticker : ""}${c.bloomberg?.mkt_cap != null ? " · " + fmtUsd(c.bloomberg.mkt_cap) : c.revBn != null ? " · rev ~$" + c.revBn + "B" : ""}`;
      hoverTip.style.left = `${local.x}px`;
      hoverTip.style.top = `${local.y}px`;
    },
    onSelect(c) {
      syncLayerActive();
      renderDetail(c);
      updateStatus();
      writeHash();
    },
    onFocusChange() {
      syncLayerActive();
      syncStageFilterSelect();
      if (state.focusLayer != null) renderLayerRoster(state.focusLayer);
      updateStatus();
      writeHash();
    },
    onClear() {
      syncLayerActive();
      syncStageFilterSelect();
      setDetailDefault();
      updateStatus();
      writeHash();
      hoverTip.hidden = true;
    },
    onReset() {
      syncLayerActive();
      syncStageFilterSelect();
      setDetailDefault();
      updateStatus();
      writeHash();
    },
    hydrateFromHash() {
      document.querySelectorAll(".chip[data-filter]").forEach((b) => {
        b.classList.toggle("active", b.dataset.filter === state.filterMode);
      });
      syncLayerActive();
      sceneApi.applyVisibility();
      if (state.selectedId != null) {
        const c = companyById(state.selectedId);
        if (c) {
          stageGate.hidden = true;
          sceneApi.selectCompany(c.id);
          return;
        }
      }
      if (state.focusLayer != null) {
        stageGate.hidden = true;
        renderLayerRoster(state.focusLayer);
      } else {
        showGate();
      }
      syncStageFilterSelect();
      revMinEl.value = state.revMin != null ? String(state.revMin) : "";
      revMaxEl.value = state.revMax != null ? String(state.revMax) : "";
      updateStatus();
    },
  };
}
