#!/usr/bin/env python3
"""Optional offline bake. The live map fetches OSM footprints in the browser."""

from __future__ import annotations

import json
import time
import urllib.request
import xml.etree.ElementTree as ET
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PARCELS = ROOT / "src/data/partner-parcels.json"
OUT = ROOT / "src/data/partner-footprints.json"
API = "https://api.openstreetmap.org/api/0.6/map"
UA = "AskAyman/1.0 (compound massing)"

GREEN_LEISURE = {"park", "garden", "pitch", "playground", "golf_course", "recreation_ground"}
GREEN_LANDUSE = {"grass", "forest", "meadow", "recreation_ground", "village_green", "orchard"}
GREEN_NATURAL = {"wood", "scrub", "grassland"}
WATER_LEISURE = {"swimming_pool"}
WATER_NATURAL = {"water"}
WATER_LANDUSE = {"basin", "reservoir"}


def open_ring(ring: list[list[float]]) -> list[list[float]]:
    if len(ring) > 1 and ring[0] == ring[-1]:
        return ring[:-1]
    return ring


def point_in_ring(pt: list[float], ring: list[list[float]]) -> bool:
    pts = open_ring(ring)
    x, y = pt
    inside = False
    j = len(pts) - 1
    for i, (xi, yi) in enumerate(pts):
        xj, yj = pts[j]
        if (yi > y) != (yj > y) and x < ((xj - xi) * (y - yi)) / ((yj - yi) or 1e-12) + xi:
            inside = not inside
        j = i
    return inside


def centroid(ring: list[list[float]]) -> list[float]:
    pts = open_ring(ring)
    if not pts:
        return [0.0, 0.0]
    return [sum(p[0] for p in pts) / len(pts), sum(p[1] for p in pts) / len(pts)]


def ring_area_m2(ring: list[list[float]]) -> float:
    pts = open_ring(ring)
    if len(pts) < 3:
        return 0.0
    lat = centroid(ring)[1]
    a = 0.0
    for i, j in enumerate(range(-1, len(pts) - 1)):
        a += pts[j][0] * pts[i][1] - pts[i][0] * pts[j][1]
    deg2 = abs(a) / 2.0
    return deg2 * (111320.0**2) * max(0.2, abs(__import__("math").cos(lat * 3.1415926535 / 180)))


def simplify(ring: list[list[float]], max_pts: int = 14) -> list[list[float]]:
    pts = open_ring(ring)
    if len(pts) <= max_pts:
        return pts
    step = len(pts) / max_pts
    out = [pts[int(i * step)] for i in range(max_pts)]
    return out


def bbox_of(ring: list[list[float]], pad: float = 0.00025) -> tuple[float, float, float, float]:
    lngs = [p[0] for p in ring]
    lats = [p[1] for p in ring]
    return min(lngs) - pad, min(lats) - pad, max(lngs) + pad, max(lats) + pad


def fetch_osm(west: float, south: float, east: float, north: float) -> ET.Element:
    url = f"{API}?bbox={west:.6f},{south:.6f},{east:.6f},{north:.6f}"
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=40) as res:
        data = res.read()
    return ET.fromstring(data)


def way_ring(way: ET.Element, nodes: dict[str, list[float]]) -> list[list[float]] | None:
    pts = []
    for nd in way.findall("nd"):
        pt = nodes.get(nd.attrib["ref"])
        if pt:
            pts.append(pt)
    pts = open_ring(pts)
    return pts if len(pts) >= 3 else None


def height_for(tags: dict[str, str], area: float) -> float:
    if tags.get("height"):
        try:
            return max(4.0, min(70.0, float(tags["height"].replace("m", "").split(";")[0])))
        except ValueError:
            pass
    if tags.get("building:levels"):
        try:
            return max(4.5, min(70.0, float(tags["building:levels"].split(";")[0]) * 3.15))
        except ValueError:
            pass
    kind = tags.get("building", "yes")
    if kind in {"apartments", "residential"} and area > 900:
        return 16 + min(22, (area - 900) / 180)
    if kind in {"apartments", "commercial", "retail", "office"}:
        return 14.0
    if kind in {"house", "detached", "villa", "semidetached_house", "terrace"}:
        return 8.5
    if area > 1400:
        return 18.0
    if area < 80:
        return 5.5
    return 9.2


def classify_way(tags: dict[str, str]) -> str | None:
    if tags.get("building") and tags.get("building") not in {"no", "roof"}:
        return "building"
    if tags.get("leisure") in WATER_LEISURE or tags.get("natural") in WATER_NATURAL or tags.get("landuse") in WATER_LANDUSE:
        return "pool"
    if tags.get("leisure") in GREEN_LEISURE or tags.get("landuse") in GREEN_LANDUSE or tags.get("natural") in GREEN_NATURAL:
        return "lawn"
    return None


def villa_ring(lng: float, lat: float, w: float = 0.000085, h: float = 0.00007) -> list[list[float]]:
    return [
        [lng - w, lat - h],
        [lng + w, lat - h],
        [lng + w, lat + h],
        [lng - w, lat + h],
    ]


def near_any(pt: list[float], rings: list[list[list[float]]], thresh: float = 0.0002) -> bool:
    for ring in rings:
        mid = centroid(ring)
        if (pt[0] - mid[0]) ** 2 + (pt[1] - mid[1]) ** 2 < thresh * thresh:
            return True
        if point_in_ring(pt, ring):
            return True
    return False


def cap_buildings(buildings: list[dict], limit: int = 260) -> list[dict]:
    if len(buildings) <= limit:
        return buildings
    scored = []
    for b in buildings:
        ring = b["ring"]
        scored.append((1 if b.get("numbered") else 0, ring_area_m2(ring), b))
    scored.sort(key=lambda item: (item[0], item[1]), reverse=True)
    keep: list[dict] = []
    xs = [centroid(b["ring"])[0] for _, _, b in scored]
    ys = [centroid(b["ring"])[1] for _, _, b in scored]
    minx, maxx, miny, maxy = min(xs), max(xs), min(ys), max(ys)
    cols = rows = max(8, int(limit ** 0.5) + 2)
    cells: dict[tuple[int, int], list] = {}
    for numbered, area, b in scored:
        mid = centroid(b["ring"])
        c = int((mid[0] - minx) / (maxx - minx + 1e-12) * cols)
        r = int((mid[1] - miny) / (maxy - miny + 1e-12) * rows)
        cells.setdefault((c, r), []).append(b)
    seen: set[int] = set()
    for items in cells.values():
        for b in items[: max(1, limit // max(1, len(cells)))]:
            bid = id(b)
            if bid in seen:
                continue
            seen.add(bid)
            keep.append(b)
            if len(keep) >= limit:
                return keep[:limit]
    for _, _, b in scored:
        bid = id(b)
        if bid in seen:
            continue
        seen.add(bid)
        keep.append(b)
        if len(keep) >= limit:
            break
    return keep[:limit]


def parse_map(root: ET.Element, parcel: list[list[float]]) -> dict:
    nodes = {n.attrib["id"]: [float(n.attrib["lon"]), float(n.attrib["lat"])] for n in root.findall("node")}
    buildings: list[dict] = []
    lawns: list[dict] = []
    pools: list[dict] = []
    for way in root.findall("way"):
        tags = {t.attrib["k"]: t.attrib["v"] for t in way.findall("tag")}
        kind = classify_way(tags)
        if not kind:
            continue
        ring = way_ring(way, nodes)
        if not ring:
            continue
        mid = centroid(ring)
        if not point_in_ring(mid, parcel):
            continue
        simple = simplify(ring)
        if kind == "building":
            area = ring_area_m2(ring)
            buildings.append(
                {
                    "ring": simple,
                    "heightM": round(height_for(tags, area), 1),
                    "kind": tags.get("building", "yes"),
                    "numbered": bool(tags.get("addr:housenumber") or tags.get("name")),
                }
            )
        elif kind == "pool":
            pools.append({"ring": simple})
        else:
            lawns.append({"ring": simple, "kind": tags.get("leisure") or tags.get("landuse") or tags.get("natural") or "grass"})

    occupied = [b["ring"] for b in buildings]
    for node in root.findall("node"):
        tags = {t.attrib["k"]: t.attrib["v"] for t in node.findall("tag")}
        if "addr:housenumber" not in tags:
            continue
        pt = [float(node.attrib["lon"]), float(node.attrib["lat"])]
        if not point_in_ring(pt, parcel):
            continue
        if near_any(pt, occupied):
            continue
        ring = villa_ring(pt[0], pt[1])
        buildings.append({"ring": ring, "heightM": 8.8, "kind": "house", "numbered": True})
        occupied.append(ring)

    return {
        "buildings": cap_buildings(buildings),
        "lawns": lawns[:40],
        "pools": pools[:16],
    }


def main() -> None:
    parcels = json.loads(PARCELS.read_text())["features"]
    out: dict[str, dict] = {}
    for i, feature in enumerate(parcels):
        props = feature["properties"]
        kind = props.get("kind")
        if kind == "outline":
            continue
        key = feature.get("id") or f"{props['partnerId']}:{kind}"
        ring = feature["geometry"]["coordinates"][0]
        west, south, east, north = bbox_of(ring)
        print(f"[{i+1}/{len(parcels)}] {key} bbox {west:.4f},{south:.4f},{east:.4f},{north:.4f}", flush=True)
        try:
            root = fetch_osm(west, south, east, north)
        except Exception as exc:
            print("  FAIL", exc)
            time.sleep(1.2)
            continue
        packed = parse_map(root, ring)
        print(
            f"  buildings {len(packed['buildings'])} lawns {len(packed['lawns'])} pools {len(packed['pools'])}",
            flush=True,
        )
        out[key] = packed
        time.sleep(0.7)
    OUT.write_text(json.dumps(out, separators=(",", ":")))
    print("wrote", OUT, "sites", len(out), "bytes", OUT.stat().st_size)


if __name__ == "__main__":
    main()
