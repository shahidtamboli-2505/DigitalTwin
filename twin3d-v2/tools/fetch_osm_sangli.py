"""
Fetch REAL infrastructure data for Sangli District from OpenStreetMap (Overpass API, free, no key).

Outputs (inside frontend/public/data/):
  osm_infrastructure.geojson  - all hospitals, colleges, bridges, dams, substations, water towers, rivers
  sangli-assets.geojson       - the twin's asset list, with coordinates refreshed from OSM where a name matches

Run from project root:
  pip install requests
  python twin3d-v2/tools/fetch_osm_sangli.py
"""
import json
import sys
import time
from pathlib import Path

import requests

ROOT = Path.cwd()
OUT_DIR = ROOT / "frontend" / "public" / "data"
OUT_DIR.mkdir(parents=True, exist_ok=True)

# Sangli District bounding box (south, west, north, east)
BBOX = "16.55,73.65,17.35,75.25"
QUERY = f"""
[out:json][timeout:180];
(
  nwr["amenity"="hospital"]({BBOX});
  nwr["amenity"~"college|university"]({BBOX});
  way["bridge"="yes"]["highway"~"primary|secondary|trunk|tertiary"]({BBOX});
  nwr["waterway"="dam"]({BBOX});
  nwr["power"="substation"]({BBOX});
  nwr["man_made"~"water_tower|water_works"]({BBOX});
  way["waterway"="river"]["name"~"Krishna|Warna|Yerala|Agrani",i]({BBOX});
);
out geom tags;
"""
ENDPOINTS = ["https://overpass-api.de/api/interpreter", "https://overpass.kumi.systems/api/interpreter"]


def category(tags):
    if tags.get("amenity") == "hospital":
        return "hospital"
    if tags.get("amenity") in ("college", "university"):
        return "college"
    if tags.get("bridge") == "yes":
        return "bridge"
    if tags.get("waterway") == "dam":
        return "dam"
    if tags.get("power") == "substation":
        return "substation"
    if tags.get("man_made") in ("water_tower", "water_works"):
        return "water"
    if tags.get("waterway") == "river":
        return "river"
    return "other"


def to_feature(el):
    tags = el.get("tags", {})
    if el["type"] == "node":
        geom = {"type": "Point", "coordinates": [el["lon"], el["lat"]]}
    elif "geometry" in el:
        coords = [[p["lon"], p["lat"]] for p in el["geometry"]]
        closed = len(coords) > 3 and coords[0] == coords[-1]
        geom = {"type": "Polygon", "coordinates": [coords]} if closed and category(tags) != "river" else {"type": "LineString", "coordinates": coords}
    else:
        return None
    return {"type": "Feature", "geometry": geom,
            "properties": {"osm_id": f'{el["type"]}/{el["id"]}', "name": tags.get("name", ""),
                           "category": category(tags), "levels": tags.get("building:levels"),
                           "height": tags.get("height"), "tags": tags}}


def centroid(geom):
    pts = geom["coordinates"] if geom["type"] == "LineString" else geom["coordinates"][0] if geom["type"] == "Polygon" else [geom["coordinates"]]
    return [sum(p[0] for p in pts) / len(pts), sum(p[1] for p in pts) / len(pts)]


def main():
    data = None
    for url in ENDPOINTS:
        try:
            print(f"Querying {url} ...")
            r = requests.post(url, data={"data": QUERY}, timeout=200)
            r.raise_for_status()
            data = r.json()
            break
        except Exception as e:  # try the mirror
            print("  failed:", e)
            time.sleep(2)
    if data is None:
        sys.exit("Overpass not reachable. Try again later.")

    feats = [f for f in (to_feature(e) for e in data["elements"]) if f]
    (OUT_DIR / "osm_infrastructure.geojson").write_text(json.dumps({"type": "FeatureCollection", "features": feats}), encoding="utf-8")
    counts = {}
    for f in feats:
        counts[f["properties"]["category"]] = counts.get(f["properties"]["category"], 0) + 1
    print("Saved osm_infrastructure.geojson:", counts)

    # refresh twin asset coordinates by name match
    assets_path = OUT_DIR / "sangli-assets.geojson"
    assets = json.loads(assets_path.read_text(encoding="utf-8"))
    keys = {"irwin": "irwin", "chandoli": "chandoli", "civil": "civil hospital", "wanless": "wanless", "willingdon": "willingdon"}
    for a in assets["features"]:
        key = keys.get(a["properties"]["id"])
        if not key:
            continue
        match = next((f for f in feats if key in f["properties"]["name"].lower()), None)
        if match:
            a["geometry"]["coordinates"] = [round(c, 6) for c in centroid(match["geometry"])]
            a["properties"]["osm_id"] = match["properties"]["osm_id"]
            print(f"  {a['properties']['name']:<32} -> OSM {match['properties']['osm_id']} {a['geometry']['coordinates']}")
        else:
            print(f"  {a['properties']['name']:<32} -> no OSM name match, kept seed coordinates (verify on satellite)")
    assets_path.write_text(json.dumps(assets, indent=2), encoding="utf-8")
    print("Updated sangli-assets.geojson")


if __name__ == "__main__":
    main()
