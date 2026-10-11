/** Listing-country combobox: closed face + panel with search on top. */

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function optionMatches(n, needle) {
  if (!needle) return true;
  const iso = String(n.listingCountry || "").toLowerCase();
  const label = String(n.label || "").toLowerCase();
  return label.includes(needle) || iso.includes(needle);
}

function faceHtml(current) {
  return `${escapeHtml(current.label)}<span class="home-nation-n">${current.count}</span>`;
}

export function renderNations(el, nations, total, country, hrefFor, onPick) {
  if (!el) return;
  const chips = [{ listingCountry: "", label: "All", count: total }];
  for (const n of nations || []) chips.push(n);
  const current = chips.find((n) => (n.listingCountry || "") === country) || chips[0];

  el.classList.add("nation-pick");
  el._nation = { chips, country, hrefFor, onPick };

  if (el.querySelector(".nation-face")) {
    const face = el.querySelector(".nation-face");
    face.innerHTML = faceHtml(current);
    const search = el.querySelector(".nation-search");
    if (el.classList.contains("is-open") && search) paintOpts(el, search.value);
    return;
  }

  if (typeof el._nationOff === "function") el._nationOff();
  el.innerHTML =
    `<button type="button" class="nation-face" aria-expanded="false" aria-haspopup="listbox">` +
    `${faceHtml(current)}</button>` +
    `<div class="nation-panel" hidden>` +
    `<input class="nation-search list-filter" type="search" placeholder="Search country" autocomplete="off" />` +
    `<div class="nation-opts" role="listbox"></div></div>`;

  const face = el.querySelector(".nation-face");
  const panel = el.querySelector(".nation-panel");
  const search = el.querySelector(".nation-search");
  const opts = el.querySelector(".nation-opts");

  function open() {
    el._nationScrollY = window.scrollY;
    panel.hidden = false;
    face.setAttribute("aria-expanded", "true");
    el.classList.add("is-open");
    paintOpts(el, search.value);
    search.focus({ preventScroll: true });
  }

  function close() {
    panel.hidden = true;
    face.setAttribute("aria-expanded", "false");
    el.classList.remove("is-open");
  }

  paintOpts(el, "");
  opts.addEventListener("mousedown", (e) => {
    if (e.target.closest("a.nation-opt")) e.preventDefault();
  });
  opts.addEventListener("click", (e) => {
    const a = e.target.closest("a.nation-opt");
    const st = el._nation;
    if (!a || typeof st.onPick !== "function") return;
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
    e.preventDefault();
    e.stopPropagation();
    close();
    const next = new URL(a.href, location.origin).searchParams.get("listingCountry") || "";
    if (next === st.country) return;
    st.onPick(next, a.getAttribute("href") || "");
  });
  face.addEventListener("click", (e) => {
    e.stopPropagation();
    if (panel.hidden) open();
    else close();
  });
  search.addEventListener("input", () => paintOpts(el, search.value));
  search.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      e.preventDefault();
      close();
      face.focus();
    }
  });
  const onDoc = (e) => {
    if (!el.contains(e.target)) close();
  };
  document.addEventListener("click", onDoc);
  el._nationOff = () => document.removeEventListener("click", onDoc);
}

function paintOpts(el, q) {
  const st = el._nation;
  const opts = el.querySelector(".nation-opts");
  if (!st || !opts) return;
  const needle = q.trim().toLowerCase();
  const shown = st.chips.filter((n) => optionMatches(n, needle));
  if (!shown.length) {
    opts.innerHTML = `<p class="nation-empty">No country matches.</p>`;
    return;
  }
  opts.innerHTML = shown
    .map((n) => {
      const code = n.listingCountry || "";
      const on = code === st.country ? " is-on" : "";
      return (
        `<a class="nation-opt${on}" role="option" href="${escapeHtml(st.hrefFor(code))}">` +
        `${escapeHtml(n.label)}<span class="home-nation-n">${n.count}</span></a>`
      );
    })
    .join("");
}
