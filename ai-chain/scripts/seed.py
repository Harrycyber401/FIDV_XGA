#!/usr/bin/env python3
"""Seed or refresh the SQLite database from data/*.json."""
from __future__ import annotations

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "server"))

from db import DB_PATH, connect, init_schema, seed_from_json  # noqa: E402


def main() -> None:
    conn = connect()
    init_schema(conn)
    seed_from_json(conn)
    n = conn.execute("SELECT COUNT(*) AS n FROM companies").fetchone()["n"]
    L = conn.execute("SELECT COUNT(*) AS n FROM layers").fetchone()["n"]
    conn.close()
    print(f"Seeded {DB_PATH}")
    print(f"  layers={L}  companies={n}")


if __name__ == "__main__":
    main()
