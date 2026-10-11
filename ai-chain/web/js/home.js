/** [C-HOME] + [C-SPLASH] BICS L1–L7 gate; splash only on cold `/`. */

import { renderNations } from "./nations.js?v=33";
import { displayIndustryCoord } from "./coords.js?v=35";

if ("scrollRestoration" in history) history.scrollRestoration = "manual";

const splash = document.getElementById("splash");
const home = document.getElementById("home");

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function waitTwoFrames() {
  return new Promise((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(resolve));
  });
}

function currentBics() {
  return new URLSearchParams(location.search).get("bics") || "";
}

function currentListing() {
  return new URLSearchParams(location.search).get("listingCountry") || "";
}

function gateHref(bics, country) {
  const p = new URLSearchParams();
  if (bics) p.set("bics", bics);
  if (country) p.set("listingCountry", country);
  const q = p.toString();
  return q ? `/?${q}` : "/";
}

function listHref(bics, country) {
  const p = new URLSearchParams();
  p.set("bics", bics);
  if (country) p.set("listingCountry", country);
  return `/list?${p.toString()}`;
}

function cubeHref(code) {
  const c = (code || "").trim();
  return c ? `/cube?bics=${encodeURIComponent(c)}` : "/cube";
}

function bindCubeLink() {
  const el = document.getElementById("homeCubeLink");
  if (el) el.href = cubeHref(currentBics());
}

function skipSplash() {
  return Boolean(currentBics()) || sessionStorage.getItem("fidvSplashSeen") === "1";
}

/** Fade out splash (~4s); remove when done. */
function dismissSplash() {
  return new Promise((resolve) => {
    if (!splash || !splash.isConnected) {
      resolve();
      return;
    }
    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      splash.remove();
      resolve();
    };
    splash.classList.add("splash-out");
    splash.addEventListener("transitionend", (e) => {
      if (e.propertyName === "opacity") finish();
    });
    setTimeout(finish, 4200);
  });
}

function revealHome() {
  if (!home) return;
  home.hidden = false;
  home.classList.remove("home-pending");
  home.classList.add("home-ready");
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function trailHtml(ancestors, node, country) {
  const bits = [];
  if (node) {
    bits.push(`<a href="${escapeHtml(gateHref("", country))}">All</a>`);
  } else {
    bits.push(`<span class="home-trail-current">All</span>`);
  }
  for (const a of ancestors) {
    bits.push(`<span class="home-trail-sep">/</span>`);
    bits.push(
      `<a href="${escapeHtml(gateHref(a.bicsCode, country))}">${escapeHtml(a.name)}</a>`,
    );
  }
  if (node) {
    bits.push(`<span class="home-trail-sep">/</span>`);
    bits.push(`<span class="home-trail-current">${escapeHtml(node.name)}</span>`);
  }
  return bits.join("");
}

function cellHref(node, country) {
  if (node.level === 4) return listHref(node.bicsCode, country);
  if (node.isLeaf) return cubeHref(node.bicsCode);
  return gateHref(node.bicsCode, country);
}

function renderCells(listEl, children, country) {
  const existing = listEl.querySelectorAll("a.home-sector");
  if (existing.length && existing.length === children.length) {
    children.forEach((s, i) => {
      const a = existing[i];
      a.href = cellHref(s, country);
      a.title = s.definition || s.name;
      const badge = a.querySelector(".home-sector-n");
      const n = Number(s.companyCount);
      if (badge && Number.isFinite(n)) badge.textContent = String(n);
    });
    return;
  }
  listEl.innerHTML = "";
  for (const s of children) {
    const a = document.createElement("a");
    a.className = "home-sector";
    a.href = cellHref(s, country);
    a.title = s.definition || s.name;
    const n = Number(s.companyCount);
    const badge = Number.isFinite(n)
      ? `<span class="home-sector-n">${n}</span>`
      : "";
    a.innerHTML =
      badge +
      `<span class="home-sector-en">${escapeHtml(s.name)}</span>` +
      (s.nameZh ? `<span class="home-sector-zh">${escapeHtml(s.nameZh)}</span>` : "") +
      `<span class="home-sector-code">${escapeHtml(displayIndustryCoord(s.legalEntityCoord || s.bicsCode))}</span>`;
    listEl.appendChild(a);
  }
}

function bindNations(el, nations, total, country, bics) {
  renderNations(
    el,
    nations,
    total,
    country,
    (code) => (bics ? gateHref(bics, code) : gateHref("", code)),
    (code, href) => applyListing(href, true),
  );
}

function renderTotal(el, count, total, country) {
  if (!el) return;
  if (country) {
    el.textContent = `${count} companies in this filter · ${total} in this class`;
  } else {
    el.textContent = `${total} companies in this class`;
  }
}

async function applyListing(href, push) {
  const y =
    typeof document.getElementById("nationList")?._nationScrollY === "number"
      ? document.getElementById("nationList")._nationScrollY
      : window.scrollY;
  if (document.activeElement && document.activeElement !== document.body) {
    document.activeElement.blur();
  }
  if (push) history.pushState({ scrollY: y }, "", href);
  await loadBoard();
  restoreScroll(y);
}

function restoreScroll(y) {
  const apply = () => window.scrollTo(0, y);
  apply();
  requestAnimationFrame(() => {
    apply();
    requestAnimationFrame(apply);
  });
  setTimeout(apply, 0);
  setTimeout(apply, 80);
}

async function loadBoard() {
  const list = document.getElementById("sectorList");
  const trail = document.getElementById("homeTrail");
  const lede = document.getElementById("homeLede");
  const totalEl = document.getElementById("homeTotal");
  const nationEl = document.getElementById("nationList");
  const parent = currentBics();
  const loc = currentListing();
  const qs = new URLSearchParams();
  if (parent) qs.set("parent", parent);
  if (loc) qs.set("listingCountry", loc);
  const q = qs.toString();
  const url = q ? `/api/bics/children?${q}` : "/api/bics/children";
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`children ${res.status}`);
    const data = await res.json();
    const node = data.parent;
    if (node?.level === 4) {
      location.replace(listHref(node.bicsCode, loc));
      return;
    }
    if (node?.isLeaf) {
      location.replace(cubeHref(node.bicsCode));
      return;
    }
    const children = data.children || [];
    renderCells(list, children, loc);
    bindNations(nationEl, data.listingCountries, data.totalCount, loc, parent);
    renderTotal(totalEl, data.companyCount, data.totalCount, loc);
    if (trail) {
      const html = trailHtml(data.ancestors || [], node, loc);
      if (trail.innerHTML !== html) trail.innerHTML = html;
    }
    if (node) {
      home?.classList.add("home-drilled");
      if (lede) {
        lede.textContent = `Level ${node.level} · ${node.name} · next board, or a level-4 cell opens the company list.`;
      }
    } else {
      home?.classList.remove("home-drilled");
    }
  } catch (err) {
    list.innerHTML = `<p class="home-error">Failed to load industry coordinates. Is the server running?</p>`;
    console.error(err);
  }
}

async function bootHome() {
  bindCubeLink();
  try {
    const loadPromise = loadBoard();
    if (skipSplash()) {
      if (splash?.isConnected) splash.remove();
      revealHome();
      await loadPromise;
      return;
    }
    await waitTwoFrames();
    await sleep(2000);
    await dismissSplash();
    sessionStorage.setItem("fidvSplashSeen", "1");
    revealHome();
    await loadPromise;
  } catch (err) {
    if (splash?.isConnected) splash.remove();
    revealHome();
    throw err;
  }
}

bootHome();
window.addEventListener("popstate", () => {
  loadBoard().then(() => {
    const y = history.state?.scrollY;
    if (typeof y === "number") restoreScroll(y);
  });
});
