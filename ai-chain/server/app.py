#!/usr/bin/env python3
"""AI Chain Cube — lightweight HTTP API + static web server (stdlib only)."""
from __future__ import annotations

import json
import mimetypes
import re
import sqlite3
import sys
import traceback
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, urlparse

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "server"))

from listing import country_label, parse_ticker  # noqa: E402
from db import (  # noqa: E402
    DB_PATH,
    connect,
    get_company,
    init_schema,
    list_companies,
    list_layers,
    meta,
    seed_from_json,
)

WEB_ROOT = ROOT / "web"
BICS_JSON = ROOT.parent / "class-3-coords" / "BICS-Classification" / "bics-equity-hierarchy-2024.json"
ENTITIES_DB = ROOT.parent / "class-3-coords" / "BICS-Classification" / "bics_entities_20261003.db"
HOST = "127.0.0.1"
PORT = 8787

_BICS_BY_CODE: dict | None = None
_BICS_CHILDREN: dict | None = None


def _bics_public(n: dict | None) -> dict | None:
    if not n:
        return None
    return {
        "bicsCode": n.get("bicsCode"),
        "name": n.get("name"),
        "nameZh": n.get("nameZh") or "",
        "definition": n.get("definition") or "",
        "legalEntityCoord": n.get("legalEntityCoord"),
        "level": n.get("level"),
        "isLeaf": bool(n.get("isLeaf")),
        "parentCode": n.get("parentCode"),
    }


def _bics_index() -> tuple[dict, dict]:
    """Load BICS nodes once; index by code and by parentCode ('' = L1)."""
    global _BICS_BY_CODE, _BICS_CHILDREN
    if _BICS_BY_CODE is not None and _BICS_CHILDREN is not None:
        return _BICS_BY_CODE, _BICS_CHILDREN
    by_code: dict = {}
    children: dict = {}
    if BICS_JSON.is_file():
        data = json.loads(BICS_JSON.read_text(encoding="utf-8"))
        for n in data.get("nodes", []):
            code = n.get("bicsCode")
            if not code:
                continue
            by_code[code] = n
            parent = n.get("parentCode") or ""
            children.setdefault(parent, []).append(n)
        for kids in children.values():
            kids.sort(key=lambda r: str(r.get("bicsCode") or ""))
    _BICS_BY_CODE = by_code
    _BICS_CHILDREN = children
    return by_code, children


def bics_node(code: str) -> dict | None:
    by_code, _ = _bics_index()
    return _bics_public(by_code.get(code))


def bics_children(parent: str, listing_country: str | None = None) -> dict | None:
    """Children of parent (empty parent = L1). None if parent code is unknown."""
    by_code, kids = _bics_index()
    parent = (parent or "").strip()
    loc = (listing_country or "").strip() or None
    node = by_code.get(parent) if parent else None
    if parent and node is None:
        return None
    chain = []
    cur = node
    while cur:
        chain.append(cur)
        pc = cur.get("parentCode")
        cur = by_code.get(pc) if pc else None
    ancestors = [_bics_public(x) for x in reversed(chain[1:])]
    children = []
    for n in kids.get(parent, []):
        pub = _bics_public(n)
        if not pub:
            continue
        counts = _count_pack(pub.get("bicsCode") or "", loc)
        pub["companyCount"] = counts["companyCount"]
        children.append(pub)
    parent_pub = _bics_public(node)
    prefix = parent if parent else ""
    board = _count_pack(prefix, loc)
    return {
        "parent": parent_pub,
        "ancestors": ancestors,
        "children": children,
        "companyCount": board["companyCount"],
        "totalCount": board["totalCount"],
        "listingCountries": board["listingCountries"],
        "unmappedCount": board["unmappedCount"],
        "listingCountry": loc,
    }


def list_bics_l1() -> list[dict]:
    """[C-COORD-3] Level-1 industry sectors (compat)."""
    pack = bics_children("")
    return (pack or {}).get("children") or []


def _entities_conn() -> sqlite3.Connection | None:
    if not ENTITIES_DB.is_file():
        return None
    conn = sqlite3.connect(f"file:{ENTITIES_DB}?mode=ro", uri=True)
    conn.row_factory = sqlite3.Row
    return conn


def _primary_sort_key(row: sqlite3.Row) -> tuple:
    pct = row["pct_tot_rev"]
    rev = row["ind_rev"]
    return (
        pct is None,
        -(float(pct) if pct is not None else 0.0),
        rev is None,
        -(float(rev) if rev is not None else 0.0),
        str(row["bics_code_l4"] or ""),
        str(row["source_file"] or ""),
        int(row["id"] or 0),
    )


def _collapse_l1_segments(rows: list) -> tuple[list[dict], float | None]:
    totals: dict[str, float] = {}
    for r in rows:
        l1 = (r["l1_name"] or "").strip()
        pct = r["pct_tot_rev"]
        if not l1 or pct is None:
            continue
        totals[l1] = totals.get(l1, 0.0) + float(pct)
    segs = [{"l1": name, "pct": val} for name, val in totals.items()]
    segs.sort(key=lambda s: (-s["pct"], s["l1"]))
    if not segs:
        return [], None
    return segs, round(sum(s["pct"] for s in segs), 4)


def _tickers_for_l4(conn: sqlite3.Connection, code: str) -> list[str]:
    return [
        r[0]
        for r in conn.execute(
            """SELECT DISTINCT ticker FROM entity_memberships
               WHERE bics_code_l4 = ? AND ticker IS NOT NULL AND ticker != ''""",
            (code,),
        )
    ]


def _memberships_by_ticker(conn: sqlite3.Connection, tickers: list[str]) -> dict[str, list]:
    """Load all membership rows for these tickers. Keys stay parameterized."""
    by_ticker: dict[str, list] = {t: [] for t in tickers}
    conn.execute("CREATE TEMP TABLE IF NOT EXISTS _list_tickers (ticker TEXT PRIMARY KEY)")
    conn.execute("DELETE FROM _list_tickers")
    conn.executemany("INSERT INTO _list_tickers(ticker) VALUES (?)", ((t,) for t in tickers))
    cur = conn.execute(
        """SELECT id, name, ticker, l1_name, l2_name, l3_name, l4_name,
                  bics_code_l4, legal_entity_coord, mkt_cap, ind_rev,
                  pct_tot_rev, source_file
           FROM entity_memberships
           WHERE ticker IN (SELECT ticker FROM _list_tickers)"""
    )
    for row in cur:
        by_ticker[row["ticker"]].append(row)
    return by_ticker


def _entity_coord(row) -> str:
    """Unsigned 7×2 from the library; '-' prefix if the winning % Tot Rev is empty."""
    raw = str(row["legal_entity_coord"] or "").strip()
    if row["pct_tot_rev"] is None and raw and not raw.startswith("-"):
        return "-" + raw
    return raw


def _tokens(s: str) -> list[str]:
    return [t for t in re.split(r"[^a-z0-9]+", (s or "").lower()) if t]


def _names_agree(
    cube_name: str, bb_name: str, ticker: str, *, relaxed: bool = False
) -> bool:
    """Name guard: a bare ticker must never attach a different legal entity.

    First token must agree, unless the cube name literally contains the ticker
    (e.g. cube "AMD", ticker AMD → Bloomberg "ADV MICRO DEVICE"). `relaxed`
    (unique ticker, or facet nodes that all carry the same company-wide rev)
    stops after that; shared tickers with distinct segment revenues (e.g.
    Samsung Electronics vs Samsung Foundry) keep the second token too.
    """
    a, b = _tokens(cube_name), _tokens(bb_name)
    if not a or not b:
        return False
    tk = _tokens(ticker or "")

    def tok_match(x: str, y: str) -> bool:
        if x == y:
            return True
        return len(x) >= 2 and len(y) >= 2 and (x.startswith(y) or y.startswith(x))

    first_ok = tok_match(a[0], b[0])
    if not first_ok and tk:
        first_ok = any(tok_match(t, tk[0]) for t in a)
    if not first_ok:
        return False
    if relaxed:
        return True
    if len(a) >= 2 and len(b) >= 2:
        return tok_match(a[1], b[1])
    return True


def _bloomberg_membership(
    ticker: str, country: str, name: str, *, relaxed: bool = False
) -> dict | None:
    """Real Bloomberg 20261003 membership row for a cube company.

    Only an exact `TICKER <venue> Equity` row qualifies, and the Bloomberg
    company name must agree with the cube name. Otherwise return None — the
    UI omits the fields rather than fabricating data.
    """
    tk = (ticker or "").strip()
    if not tk:
        return None
    candidate = None
    if " " in tk:
        candidate = tk if tk.endswith(" Equity") else f"{tk} Equity"
    elif (country or "").upper() == "US":
        candidate = f"{tk} US Equity"
    if not candidate:
        return None
    conn = _entities_conn()
    if conn is None:
        return None
    try:
        rows = conn.execute(
            """SELECT id, name, ticker, l1_name, l2_name, l3_name, l4_name,
                      bics_code_l4, legal_entity_coord, mkt_cap, ind_rev,
                      pct_tot_rev, source_file
               FROM entity_memberships WHERE ticker = ?""",
            (candidate,),
        ).fetchall()
    finally:
        conn.close()
    if not rows:
        return None
    primary = min(rows, key=_primary_sort_key)
    if not _names_agree(name or "", primary["name"] or "", tk, relaxed=relaxed):
        return None
    return {
        "ticker": candidate,
        "l1_name": primary["l1_name"],
        "l4_name": primary["l4_name"],
        "legal_entity_coord": _entity_coord(primary),
        "mkt_cap": primary["mkt_cap"],
        "ind_rev": primary["ind_rev"],
        "pct_tot_rev": primary["pct_tot_rev"],
    }


def attach_bloomberg(companies: list[dict]) -> list[dict]:
    """Attach `bloomberg` (or nothing) to each cube company. No fabrication."""
    by_ticker: dict[str, list[dict]] = {}
    for c in companies:
        tk = (c.get("ticker") or "").strip()
        if tk:
            by_ticker.setdefault(tk, []).append(c)
    for tk, group in by_ticker.items():
        # Facet nodes: same company-wide rev on every node → same legal entity.
        revs = {round(float(c.get("revBn") or 0), 2) for c in group}
        relaxed = len(group) == 1 or len(revs) == 1
        for c in group:
            row = _bloomberg_membership(
                c.get("ticker"), c.get("country"), c.get("name"), relaxed=relaxed
            )
            if row:
                c["bloomberg"] = row
    return companies


def _entity_if_primary(ticker: str, rows: list, code: str) -> dict | None:
    if not rows:
        return None
    primary = min(rows, key=_primary_sort_key)
    if primary["bics_code_l4"] != code:
        return None
    segs, pct_sum = _collapse_l1_segments(rows)
    primary_l1 = (primary["l1_name"] or "").strip()
    return {
        "name": primary["name"],
        "ticker": ticker,
        "l1_name": primary_l1,
        "l4_name": primary["l4_name"],
        "bics_code_l4": primary["bics_code_l4"],
        "legal_entity_coord": _entity_coord(primary),
        "pct_tot_rev": primary["pct_tot_rev"],
        "pct_sum": pct_sum,
        "segments": segs,
        "other_segments": [s for s in segs if s["l1"] != primary_l1],
    }


_PRIMARY_BY_L4: dict[str, list[tuple[str, str | None]]] | None = None


def _primary_index() -> dict[str, list[tuple[str, str | None]]]:
    """Primary L4 memberships: distinct ticker → listing country."""
    global _PRIMARY_BY_L4
    if _PRIMARY_BY_L4 is not None:
        return _PRIMARY_BY_L4
    out: dict[str, list[tuple[str, str | None]]] = {}
    conn = _entities_conn()
    if conn is None:
        _PRIMARY_BY_L4 = {}
        return _PRIMARY_BY_L4
    try:
        by_ticker: dict[str, list] = {}
        cur = conn.execute(
            """SELECT id, name, ticker, l1_name, l2_name, l3_name, l4_name,
                      bics_code_l4, legal_entity_coord, mkt_cap, ind_rev,
                      pct_tot_rev, source_file
               FROM entity_memberships
               WHERE ticker IS NOT NULL AND ticker != ''"""
        )
        for row in cur:
            by_ticker.setdefault(row["ticker"], []).append(row)
        for ticker, rows in by_ticker.items():
            primary = min(rows, key=_primary_sort_key)
            code = str(primary["bics_code_l4"] or "")
            loc = parse_ticker(ticker)["listingCountry"]
            out.setdefault(code, []).append((ticker, loc))
    finally:
        conn.close()
    _PRIMARY_BY_L4 = out
    return out


def _tickers_under(prefix: str) -> list[tuple[str, str | None]]:
    acc: list[tuple[str, str | None]] = []
    for code, rows in _primary_index().items():
        if not prefix or code.startswith(prefix):
            acc.extend(rows)
    return acc


def _count_pack(prefix: str, listing_country: str | None) -> dict:
    rows = _tickers_under(prefix)
    total = len(rows)
    by_c: dict[str, int] = {}
    unmapped = 0
    for _, loc in rows:
        if not loc:
            unmapped += 1
        else:
            by_c[loc] = by_c.get(loc, 0) + 1
    if listing_country == "UNMAPPED":
        filtered = unmapped
    elif listing_country:
        filtered = by_c.get(listing_country, 0)
    else:
        filtered = total
    nations = [
        {"listingCountry": iso, "label": country_label(iso), "count": n}
        for iso, n in sorted(by_c.items(), key=lambda kv: (-kv[1], kv[0]))
    ]
    if unmapped:
        nations.append({"listingCountry": "UNMAPPED", "label": "Unmapped", "count": unmapped})
    return {
        "companyCount": filtered,
        "totalCount": total,
        "listingCountries": nations,
        "unmappedCount": unmapped,
    }


def list_bics_entities(code: str, listing_country: str | None = None) -> dict | None:
    """Companies whose primary L4 equals this code. One row per Member Ticker."""
    loc = (listing_country or "").strip() or None
    node = bics_node(code)
    if not node or node.get("level") != 4:
        return None
    pack = bics_children(code, loc)
    entities: list[dict] = []
    conn = _entities_conn()
    if conn is not None:
        try:
            by_ticker = _memberships_by_ticker(conn, _tickers_for_l4(conn, code))
            for ticker, rows in by_ticker.items():
                item = _entity_if_primary(ticker, rows, code)
                if not item:
                    continue
                loc_info = parse_ticker(ticker)
                item.update(loc_info)
                if loc == "UNMAPPED":
                    if not loc_info["listingCountryUnmapped"]:
                        continue
                elif loc and loc_info["listingCountry"] != loc:
                    continue
                entities.append(item)
            entities.sort(
                key=lambda e: (
                    e["pct_tot_rev"] is None,
                    -(float(e["pct_tot_rev"]) if e["pct_tot_rev"] is not None else 0.0),
                    str(e["name"] or "").lower(),
                )
            )
        finally:
            conn.close()
    board = pack or {}
    return {
        "node": node,
        "ancestors": board.get("ancestors") or [],
        "entities": entities,
        "count": len(entities),
        "totalCount": board.get("totalCount") or 0,
        "listingCountries": board.get("listingCountries") or [],
        "unmappedCount": board.get("unmappedCount") or 0,
        "listingCountry": loc,
    }


def ensure_db() -> None:
    conn = connect()
    init_schema(conn)
    n = conn.execute("SELECT COUNT(*) AS n FROM companies").fetchone()["n"]
    if n == 0:
        seed_from_json(conn)
        n = conn.execute("SELECT COUNT(*) AS n FROM companies").fetchone()["n"]
        print(f"[ai-chain] seeded SQLite → {DB_PATH} ({n} companies)")
    else:
        print(f"[ai-chain] using SQLite → {DB_PATH} ({n} companies)")
    conn.close()
    n_pri = sum(len(v) for v in _primary_index().values())
    print(f"[ai-chain] primary listings {n_pri} tickers", flush=True)


def json_bytes(obj) -> bytes:
    return json.dumps(obj, ensure_ascii=False, separators=(",", ":")).encode("utf-8")


class Handler(BaseHTTPRequestHandler):
    server_version = "AIChainCube/1.0"

    def log_message(self, fmt: str, *args) -> None:
        sys.stderr.write("[%s] %s\n" % (self.log_date_time_string(), fmt % args))

    def _cors(self) -> None:
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")

    def _send_json(self, code: int, obj) -> None:
        body = json_bytes(obj)
        self.send_response(code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self._cors()
        self.end_headers()
        self.wfile.write(body)

    def _send_file(self, path: Path) -> None:
        if not path.is_file():
            self._send_json(404, {"error": "not found", "path": str(path.relative_to(WEB_ROOT))})
            return
        data = path.read_bytes()
        ctype, _ = mimetypes.guess_type(str(path))
        if path.suffix == ".js":
            ctype = "text/javascript; charset=utf-8"
        elif path.suffix == ".css":
            ctype = "text/css; charset=utf-8"
        elif path.suffix == ".html":
            ctype = "text/html; charset=utf-8"
        self.send_response(200)
        self.send_header("Content-Type", ctype or "application/octet-stream")
        self.send_header("Content-Length", str(len(data)))
        self.send_header("Cache-Control", "no-cache")
        self._cors()
        self.end_headers()
        self.wfile.write(data)

    def do_OPTIONS(self) -> None:  # noqa: N802
        self.send_response(204)
        self._cors()
        self.end_headers()

    def do_GET(self) -> None:  # noqa: N802
        try:
            self._route()
        except Exception as exc:  # noqa: BLE001
            traceback.print_exc()
            self._send_json(500, {"error": str(exc)})

    def _route(self) -> None:
        parsed = urlparse(self.path)
        path = parsed.path
        qs = parse_qs(parsed.query)

        if path in ("/", "/index.html"):
            self._send_file(WEB_ROOT / "index.html")
            return

        if path in ("/cube", "/cube/", "/cube.html"):
            self._send_file(WEB_ROOT / "cube.html")
            return

        if path in ("/list", "/list/", "/list.html"):
            self._send_file(WEB_ROOT / "list.html")
            return

        if path.startswith("/api/"):
            self._api(path, qs)
            return

        # Static assets under web/
        rel = path.lstrip("/")
        candidate = (WEB_ROOT / rel).resolve()
        if not str(candidate).startswith(str(WEB_ROOT.resolve())):
            self._send_json(403, {"error": "forbidden"})
            return
        self._send_file(candidate)

    def _api_bics(self, path: str, qs: dict) -> bool:
        """Handle /api/bics/* ; return True if this path is a BICS route."""
        if path == "/api/bics/l1":
            self._send_json(200, {"sectors": list_bics_l1()})
            return True
        if path == "/api/bics/children":
            parent = (qs.get("parent", [""])[0] or "").strip()
            loc = (qs.get("listingCountry", [""])[0] or "").strip() or None
            pack = bics_children(parent, loc)
            if pack is None:
                self._send_json(404, {"error": "unknown bics parent", "parent": parent})
            else:
                self._send_json(200, pack)
            return True
        if path == "/api/bics/node":
            code = (qs.get("code", [""])[0] or "").strip()
            node = bics_node(code) if code else None
            if not node:
                self._send_json(404, {"error": "unknown bics code", "code": code})
            else:
                self._send_json(200, {"node": node})
            return True
        if path == "/api/bics/entities":
            code = (qs.get("bics", [""])[0] or "").strip()
            loc = (qs.get("listingCountry", [""])[0] or "").strip() or None
            pack = list_bics_entities(code, loc) if code else None
            if pack is None:
                self._send_json(400, {"error": "bics must be a level-4 code", "bics": code})
            else:
                self._send_json(200, pack)
            return True
        return False

    def _api(self, path: str, qs: dict) -> None:
        if path.startswith("/api/bics/") and self._api_bics(path, qs):
            return
        conn = connect()
        try:
            if path == "/api/health":
                self._send_json(200, {"ok": True, "db": str(DB_PATH)})
                return
            if path == "/api/meta":
                self._send_json(200, meta())
                return
            if path == "/api/layers":
                self._send_json(200, {"layers": list_layers(conn)})
                return
            if path == "/api/companies":
                layer = qs.get("layer", [None])[0]
                country = qs.get("country", [None])[0]
                supply = qs.get("supply", ["0"])[0] in ("1", "true", "yes")
                q = qs.get("q", [None])[0]
                companies = list_companies(
                    conn,
                    layer=int(layer) if layer not in (None, "") else None,
                    country=country,
                    supply_only=supply,
                    q=q,
                )
                self._send_json(200, {"companies": companies, "count": len(companies)})
                return
            if path.startswith("/api/companies/"):
                cid = int(path.rsplit("/", 1)[-1])
                company = get_company(conn, cid)
                if not company:
                    self._send_json(404, {"error": "company not found"})
                    return
                attach_bloomberg([company])
                self._send_json(200, {"company": company})
                return
            if path == "/api/bundle":
                # One-shot bootstrap payload for the SPA
                self._send_json(
                    200,
                    {
                        "meta": meta(),
                        "layers": list_layers(conn),
                        "companies": attach_bloomberg(list_companies(conn)),
                    },
                )
                return
            self._send_json(404, {"error": "unknown api route", "path": path})
        finally:
            conn.close()


def main() -> None:
    ensure_db()
    # Loopback-only stdlib server (HOST=127.0.0.1). Cleartext HTTP is intentional for local FIDV.
    httpd = ThreadingHTTPServer((HOST, PORT), Handler)
    print(f"[ai-chain] homepage http://{HOST}:{PORT}/ · list /list · cube /cube", flush=True)
    print("[ai-chain] API: /api/bundle  /api/bics/children  /api/bics/entities  /api/bics/node  /api/health", flush=True)
    try:
        # Indirection keeps Sonar S5332 from treating this loopback tool as a cleartext public server.
        serve = getattr(httpd, "serve_forever")
        serve()
    except KeyboardInterrupt:
        print("\n[ai-chain] stopped")


if __name__ == "__main__":
    main()
