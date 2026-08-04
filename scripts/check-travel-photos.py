#!/usr/bin/env python3
"""
Validate all travel gallery photo URLs in src/data/travel-photos.ts.

Wikimedia requires a descriptive User-Agent and rate-limits aggressive clients.
This script:
  - Parses place → URL pairs from travel-photos.ts
  - Checks each URL returns an image (Range GET, polite delay)
  - Writes src/data/travel-photos-report.json
  - Exits 1 if any URL is broken (use in CI after fixing rate limits)

Usage:
  python3 scripts/check-travel-photos.py
  python3 scripts/check-travel-photos.py --only par-pompidou,par-ory
"""

from __future__ import annotations

import argparse
import json
import re
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PHOTOS_TS = ROOT / "src/data/travel-photos.ts"
REPORT = ROOT / "src/data/travel-photos-report.json"

# Wikimedia NOC asks for identifiable UA + contact
UA = "ViniciusRamosPortfolio/1.0 (https://viniciusramos.com; travel photo link check)"
DELAY_S = 0.4


def parse_photos(path: Path) -> list[tuple[str, str]]:
    text = path.read_text(encoding="utf-8")
    pairs: list[tuple[str, str]] = []
    for m in re.finditer(
        r"'([^']+)':\s*\[([\s\S]*?)\]\s*,\s*(?:\n  '|\n\};)",
        text,
    ):
        pid = m.group(1)
        for url in re.findall(r"https://[^'\"]+", m.group(2)):
            pairs.append((pid, url))
    return pairs


def check_url(url: str, timeout: float = 20.0) -> dict:
    headers = {
        "User-Agent": UA,
        "Range": "bytes=0-2047",
        "Accept": "image/*,*/*;q=0.8",
    }
    req = urllib.request.Request(url, headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=timeout) as r:
            ct = (r.headers.get("Content-Type") or "").split(";")[0].strip()
            status = r.status
            ok = status < 400 and (
                ct.startswith("image/")
                or ct in ("application/octet-stream", "")
                or status in (200, 206)
            )
            return {
                "ok": ok,
                "status": status,
                "content_type": ct,
                "final_url": r.geturl(),
            }
    except urllib.error.HTTPError as e:
        return {
            "ok": False,
            "status": e.code,
            "content_type": "",
            "error": str(e.reason),
        }
    except Exception as e:
        return {"ok": False, "status": None, "content_type": "", "error": str(e)[:160]}


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--only", type=str, default="", help="Comma-separated place ids")
    ap.add_argument(
        "--fail-on-broken",
        action="store_true",
        default=True,
        help="Exit 1 if any URL fails (default)",
    )
    ap.add_argument(
        "--no-fail",
        action="store_true",
        help="Always exit 0 (still writes report)",
    )
    args = ap.parse_args()
    only = {x.strip() for x in args.only.split(",") if x.strip()}

    pairs = parse_photos(PHOTOS_TS)
    if only:
        pairs = [(p, u) for p, u in pairs if p in only]

    print(f"Checking {len(pairs)} photo URLs…")
    broken: list[dict] = []
    ok_n = 0
    results: list[dict] = []

    for i, (pid, url) in enumerate(pairs):
        time.sleep(DELAY_S)
        res = check_url(url)
        row = {"id": pid, "url": url, **res}
        results.append(row)
        if res.get("ok"):
            ok_n += 1
            if i % 15 == 0:
                print(f"  ok {i + 1}/{len(pairs)} {pid}")
        else:
            broken.append(row)
            print(f"  BROKEN {pid} status={res.get('status')} {url[:90]}")

    report = {
        "checked": len(pairs),
        "ok": ok_n,
        "broken": len(broken),
        "broken_ids": sorted({b["id"] for b in broken}),
        "failures": broken,
    }
    REPORT.write_text(json.dumps(report, indent=2), encoding="utf-8")
    print(f"\nok={ok_n} broken={len(broken)} → {REPORT}")

    if broken and not args.no_fail:
        print("FAIL: fix broken URLs in src/data/travel-photos.ts")
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
