SANGLI 3D DIGITAL TWIN - v2
===========================
/map   = 3D Digital Twin: Esri satellite + SRTM terrain + OSM 3D buildings + 3D infrastructure models at real lat/lon
/twin  = Flood Simulator (2019 Krishna flood replay)

DATASETS USED (all free, no API key)
- Esri World Imagery (satellite tiles)
- SRTM elevation via AWS Terrain Tiles (terrarium)
- OpenStreetMap buildings/roads/water via OpenFreeMap vector tiles
- frontend/public/data/sangli-assets.geojson  (21-asset registry seed, coords approximate)
- tools/fetch_osm_sangli.py -> real OSM hospitals, colleges, bridges, dams, substations, water works, rivers

REAL / AI-GENERATED 3D MODELS (optional, best upgrade)
1. Take 1-50 photos of the asset (e.g. Irwin Bridge).
2. Single photo -> 3D: Hunyuan3D-2 or TRELLIS (free Hugging Face Spaces) -> download .glb
   Many photos -> 3D: WebODM / Meshroom (photogrammetry) -> export .glb
3. In Blender: scale to real metres, Y-up, origin at ground centre -> export glTF Binary
4. Save as frontend/public/models/<asset id>.glb   (irwin.glb, chandoli.glb, civil.glb ...)
   The map automatically replaces the procedural model with your real one.
