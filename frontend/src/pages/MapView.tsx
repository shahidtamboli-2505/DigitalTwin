import { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { Layers, Eye, EyeOff, Box } from "lucide-react";
import {
  TEHSIL_BOUNDARIES, KRISHNA_RIVER, WARNA_RIVER, FLOOD_ZONES,
} from "../data/sangli-geojson";
import { SENSORS, TEHSILS, INFRASTRUCTURE } from "../data/sangli-district";

/* ─── Layer & View Config ─────────────────────────────────────── */
const LAYER_TOGGLES = [
  { id: "buildings", label: "3D Buildings (OSM)", color: "#a855f7" },
  { id: "infrastructure", label: "Infrastructure 3D", color: "#fbbf24" },
  { id: "tehsils", label: "Tehsil Boundaries", color: "#60a5fa" },
  { id: "rivers", label: "Rivers", color: "#38bdf8" },
  { id: "flood-zones", label: "Flood Zones", color: "#f87171" },
  { id: "sensors", label: "Sensors", color: "#34d399" },
];

const VIEW_PRESETS = [
  { id: "district", label: "🗺️ District", center: [74.5815, 16.8524] as [number, number], zoom: 8.5, pitch: 0, bearing: 0 },
  { id: "sangli", label: "🏙️ Sangli 3D", center: [74.5815, 16.8524] as [number, number], zoom: 15.5, pitch: 60, bearing: -30 },
  { id: "miraj", label: "🏙️ Miraj 3D", center: [74.6400, 16.8300] as [number, number], zoom: 15.5, pitch: 60, bearing: -20 },
  { id: "irwin", label: "🌉 Irwin Bridge", center: [74.5800, 16.8520] as [number, number], zoom: 17, pitch: 65, bearing: -40 },
];

/* ─── Infrastructure shape config (realistic dimensions in meters) ── */
const INFRA_SHAPES: Record<string, { w: number; d: number; h: number; color: string; glow: string }> = {
  dam:             { w: 250, d: 50,  h: 40, color: "#1a2d4a", glow: "#38bdf8" },
  bridge:          { w: 160, d: 14,  h: 8,  color: "#3d2e1e", glow: "#fbbf24" },
  hospital:        { w: 85,  d: 60,  h: 22, color: "#2a1a35", glow: "#f87171" },
  school:          { w: 75,  d: 50,  h: 16, color: "#1a2535", glow: "#a78bfa" },
  power_station:   { w: 55,  d: 50,  h: 14, color: "#2d2a1a", glow: "#fbbf24" },
  water_treatment: { w: 65,  d: 45,  h: 10, color: "#1a2d2a", glow: "#34d399" },
  road:            { w: 120, d: 6,   h: 1,  color: "#252525", glow: "#94a3b8" },
};

/* ─── Helpers ─────────────────────────────────────────────────── */
function createBuildingFootprint(
  center: [number, number], wM: number, dM: number, rotDeg = 0
): [number, number][][] {
  const rot = (rotDeg * Math.PI) / 180;
  const hw = wM / 2 / 1000, hd = dM / 2 / 1000;
  const fx = 1 / (111.32 * Math.cos((center[1] * Math.PI) / 180));
  const fy = 1 / 110.574;
  const corners: [number, number][] = [
    [-hw, -hd], [hw, -hd], [hw, hd], [-hw, hd], [-hw, -hd],
  ];
  return [corners.map(([cx, cy]) => [
    center[0] + (cx * Math.cos(rot) - cy * Math.sin(rot)) * fx,
    center[1] + (cx * Math.sin(rot) + cy * Math.cos(rot)) * fy,
  ] as [number, number])];
}

function createDamArc(
  center: [number, number], lenM: number, wM: number
): [number, number][][] {
  const pts = 20, coords: [number, number][] = [];
  const halfL = lenM / 2 / 1000, curveD = wM / 1000;
  const fx = 1 / (111.32 * Math.cos((center[1] * Math.PI) / 180));
  const fy = 1 / 110.574;
  for (let i = 0; i <= pts; i++) {
    const t = i / pts, x = -halfL + t * halfL * 2;
    const y = curveD * Math.sin(t * Math.PI) * 0.3;
    coords.push([center[0] + x * fx, center[1] + y * fy]);
  }
  for (let i = pts; i >= 0; i--) {
    const t = i / pts, x = -halfL + t * halfL * 2;
    const y = -curveD * 0.5 + curveD * Math.sin(t * Math.PI) * 0.1;
    coords.push([center[0] + x * fx, center[1] + y * fy]);
  }
  coords.push(coords[0]!);
  return [coords];
}

/* ─── Component ───────────────────────────────────────────────── */
export default function MapView() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [layers, setLayers] = useState<Record<string, boolean>>({
    buildings: true, infrastructure: true,
    tehsils: false, rivers: true, "flood-zones": false, sensors: true,
  });
  const [selectedTehsil, setSelectedTehsil] = useState<string | null>(null);
  const [activeView, setActiveView] = useState("sangli");

  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return;

    const m = new maplibregl.Map({
      container: mapContainer.current,
      style: {
        version: 8,
        sources: {
          osm: {
            type: "raster",
            tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
            tileSize: 256,
            attribution: "&copy; OpenStreetMap contributors",
          },
          openmaptiles: {
            type: "vector",
            tiles: ["https://tiles.openfreemap.org/planet/{z}/{x}/{y}.pbf"],
            maxzoom: 14,
          },
        },
        layers: [{
          id: "osm", type: "raster", source: "osm",
          paint: { "raster-saturation": -0.75, "raster-brightness-max": 0.3, "raster-contrast": 0.2 },
        }],
        light: { anchor: "viewport", color: "#c8d6ff", intensity: 0.45, position: [1.5, 210, 30] },
      },
      center: [74.5815, 16.8524],
      zoom: 15.5, pitch: 60, bearing: -30,
      maxZoom: 19, minZoom: 7, maxPitch: 85,
    });
    mapRef.current = m;

    m.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), "top-right");
    m.addControl(new maplibregl.ScaleControl(), "bottom-left");

    m.on("load", () => {
      // ═══ Real OSM 3D Buildings ═══
      m.addLayer({
        id: "buildings-3d", source: "openmaptiles", "source-layer": "building",
        type: "fill-extrusion", minzoom: 13,
        paint: {
          "fill-extrusion-color": [
            "interpolate", ["linear"], ["coalesce", ["get", "render_height"], 5],
            0, "#0d1117", 5, "#151b28", 10, "#1a2236", 20, "#1e2844", 40, "#242f55",
          ],
          "fill-extrusion-height": ["coalesce", ["get", "render_height"], 5],
          "fill-extrusion-base": ["coalesce", ["get", "render_min_height"], 0],
          "fill-extrusion-opacity": 0.9,
        },
      });
      m.addLayer({
        id: "buildings-3d-edges", source: "openmaptiles", "source-layer": "building",
        type: "line", minzoom: 14,
        paint: { "line-color": "rgba(100,150,255,0.12)", "line-width": 0.5 },
      });

      // ═══ Tehsils ═══
      m.addSource("tehsils", { type: "geojson", data: TEHSIL_BOUNDARIES as GeoJSON.FeatureCollection });
      m.addLayer({ id: "tehsils-fill", type: "fill", source: "tehsils", layout: { visibility: "none" },
        paint: { "fill-color": ["interpolate", ["linear"], ["get", "risk_score"], 30, "rgba(52,211,153,0.15)", 50, "rgba(96,165,250,0.2)", 70, "rgba(251,191,36,0.25)", 90, "rgba(248,113,113,0.3)"], "fill-opacity": 0.6 },
      });
      m.addLayer({ id: "tehsils-line", type: "line", source: "tehsils", layout: { visibility: "none" },
        paint: { "line-color": "#60a5fa", "line-width": 1.5, "line-opacity": 0.8 },
      });
      m.addLayer({ id: "tehsils-label", type: "symbol", source: "tehsils",
        layout: { "text-field": ["get", "name"], "text-size": 12, "text-font": ["Open Sans Regular"], "text-anchor": "center", visibility: "none" },
        paint: { "text-color": "#f8fafc", "text-halo-color": "#0f172a", "text-halo-width": 1.5 },
      });

      // ═══ Rivers ═══
      m.addSource("krishna", { type: "geojson", data: KRISHNA_RIVER as GeoJSON.Feature });
      m.addSource("warna", { type: "geojson", data: WARNA_RIVER as GeoJSON.Feature });
      m.addLayer({ id: "rivers-krishna", type: "line", source: "krishna", paint: { "line-color": "#38bdf8", "line-width": 3, "line-opacity": 0.8 } });
      m.addLayer({ id: "rivers-warna", type: "line", source: "warna", paint: { "line-color": "#38bdf8", "line-width": 2.5, "line-opacity": 0.7 } });

      // ═══ Flood Zones ═══
      m.addSource("flood-zones", { type: "geojson", data: FLOOD_ZONES as GeoJSON.FeatureCollection });
      m.addLayer({ id: "flood-zones-fill", type: "fill", source: "flood-zones", layout: { visibility: "none" },
        paint: { "fill-color": ["match", ["get", "risk"], "high", "rgba(248,113,113,0.35)", "medium", "rgba(251,191,36,0.25)", "rgba(96,165,250,0.2)"], "fill-opacity": 0.6 },
      });
      m.addLayer({ id: "flood-zones-line", type: "line", source: "flood-zones", layout: { visibility: "none" },
        paint: { "line-color": "#f87171", "line-width": 1.5, "line-dasharray": [4, 2] },
      });

      // ═══ Realistic Infrastructure 3D ═══
      const infra3D: GeoJSON.Feature[] = INFRASTRUCTURE.map((item, i) => {
        const cfg = INFRA_SHAPES[item.type] || INFRA_SHAPES.road!;
        const isDam = item.type === "dam";
        return {
          type: "Feature",
          properties: { id: item.id, name: item.name, type: item.type, condition: item.condition,
            risk_score: item.risk_score, capacity: item.capacity,
            height: cfg.h, base_height: 0, color: cfg.color, glow: cfg.glow },
          geometry: { type: "Polygon",
            coordinates: isDam
              ? createDamArc([item.lng, item.lat], cfg.w, cfg.d)
              : createBuildingFootprint([item.lng, item.lat], cfg.w, cfg.d, (i * 37 + 15) % 90),
          },
        };
      });
      m.addSource("infrastructure-3d", { type: "geojson", data: { type: "FeatureCollection", features: infra3D } });
      m.addLayer({ id: "infra-3d-base", type: "fill-extrusion", source: "infrastructure-3d",
        paint: { "fill-extrusion-color": ["get", "color"], "fill-extrusion-height": ["get", "height"], "fill-extrusion-base": 0, "fill-extrusion-opacity": 0.95 },
      });
      m.addLayer({ id: "infra-3d-glow", type: "line", source: "infrastructure-3d",
        paint: { "line-color": ["get", "glow"], "line-width": 2.5, "line-opacity": 0.6, "line-blur": 4 },
      });

      // Infrastructure labels
      const labelFC: GeoJSON.FeatureCollection = { type: "FeatureCollection",
        features: INFRASTRUCTURE.map(it => ({ type: "Feature" as const, properties: { name: it.name, type: it.type },
          geometry: { type: "Point" as const, coordinates: [it.lng, it.lat] } })),
      };
      m.addSource("infra-labels", { type: "geojson", data: labelFC });
      m.addLayer({ id: "infra-label-text", type: "symbol", source: "infra-labels", minzoom: 14,
        layout: { "text-field": ["get", "name"], "text-size": 11, "text-font": ["Open Sans Regular"], "text-anchor": "bottom", "text-offset": [0, -1], "text-allow-overlap": false },
        paint: { "text-color": "#e2e8f0", "text-halo-color": "#0a0e1a", "text-halo-width": 2 },
      });

      // ═══ Sensors ═══
      const sensorGJ: GeoJSON.FeatureCollection = { type: "FeatureCollection",
        features: SENSORS.filter(s => s.lat && s.lng).map(s => ({
          type: "Feature" as const,
          properties: { name: s.name, type: s.type, status: s.status, value: `${s.current_value} ${s.unit}` },
          geometry: { type: "Point" as const, coordinates: [s.lng, s.lat] },
        })),
      };
      m.addSource("sensors", { type: "geojson", data: sensorGJ });
      m.addLayer({ id: "sensors-points", type: "circle", source: "sensors",
        paint: { "circle-radius": 5, "circle-color": ["match", ["get", "status"], "online", "#34d399", "warning", "#fbbf24", "offline", "#f87171", "#94a3b8"],
          "circle-stroke-width": 2, "circle-stroke-color": "#0f172a", "circle-opacity": 0.9 },
      });

      // ═══ Popups ═══
      m.on("click", "tehsils-fill", e => {
        if (!e.features?.[0]) return;
        const p = e.features[0].properties!;
        setSelectedTehsil(p.name);
        new maplibregl.Popup({ closeButton: true, maxWidth: "260px" }).setLngLat(e.lngLat)
          .setHTML(`<div style="font-family:Inter,sans-serif;color:#f8fafc;padding:4px"><strong>${p.name}</strong><p style="margin:4px 0;font-size:12px;color:#94a3b8">Pop: ${Number(p.population).toLocaleString()}</p><p style="font-size:12px;color:${p.risk_score>=70?'#f87171':p.risk_score>=50?'#fbbf24':'#34d399'}">Risk: ${p.risk_score}/100</p></div>`)
          .addTo(m);
      });
      m.on("click", "infra-3d-base", e => {
        if (!e.features?.[0]) return;
        const p = e.features[0].properties!;
        new maplibregl.Popup({ closeButton: true, maxWidth: "280px" }).setLngLat(e.lngLat)
          .setHTML(`<div style="font-family:Inter,sans-serif;color:#f8fafc;padding:8px"><strong style="font-size:14px;border-bottom:1px solid #334155;padding-bottom:4px;display:block">${p.name}</strong><p style="margin:4px 0;font-size:12px;color:#94a3b8;text-transform:capitalize">Type: ${String(p.type).replace('_',' ')}</p><p style="margin:4px 0;font-size:12px;color:${p.glow};font-weight:600;text-transform:capitalize">Condition: ${p.condition}</p><p style="font-size:12px;font-weight:700;color:#fbbf24">Risk: ${p.risk_score}</p><p style="font-size:11px;color:#64748b">Capacity: ${p.capacity}</p></div>`)
          .addTo(m);
      });
      m.on("click", "sensors-points", e => {
        if (!e.features?.[0]) return;
        const p = e.features[0].properties!;
        new maplibregl.Popup({ closeButton: true, maxWidth: "220px" }).setLngLat(e.lngLat)
          .setHTML(`<div style="font-family:Inter,sans-serif;color:#f8fafc;padding:4px"><strong style="font-size:13px">${p.name}</strong><p style="font-size:11px;color:#94a3b8">${p.value}</p><span style="font-size:10px;color:${p.status==='online'?'#34d399':'#f87171'}">● ${p.status}</span></div>`)
          .addTo(m);
      });

      ["tehsils-fill", "infra-3d-base", "sensors-points"].forEach(l => {
        m.on("mouseenter", l, () => { m.getCanvas().style.cursor = "pointer"; });
        m.on("mouseleave", l, () => { m.getCanvas().style.cursor = ""; });
      });

      setLoaded(true);
    });

    return () => { mapRef.current?.remove(); mapRef.current = null; };
  }, []);

  /* ─── Layer visibility sync ─── */
  useEffect(() => {
    if (!mapRef.current || !loaded) return;
    const m = mapRef.current;
    const lm: Record<string, string[]> = {
      buildings: ["buildings-3d", "buildings-3d-edges"],
      infrastructure: ["infra-3d-base", "infra-3d-glow", "infra-label-text"],
      tehsils: ["tehsils-fill", "tehsils-line", "tehsils-label"],
      rivers: ["rivers-krishna", "rivers-warna"],
      "flood-zones": ["flood-zones-fill", "flood-zones-line"],
      sensors: ["sensors-points"],
    };
    Object.entries(layers).forEach(([key, vis]) => {
      lm[key]?.forEach(id => { if (m.getLayer(id)) m.setLayoutProperty(id, "visibility", vis ? "visible" : "none"); });
    });
  }, [layers, loaded]);

  const toggleLayer = (id: string) => setLayers(p => ({ ...p, [id]: !p[id] }));

  const flyTo = (pid: string) => {
    const p = VIEW_PRESETS.find(v => v.id === pid);
    if (!p || !mapRef.current) return;
    setActiveView(pid);
    mapRef.current.flyTo({ center: p.center, zoom: p.zoom, pitch: p.pitch, bearing: p.bearing, speed: 0.8, essential: true });
    if (pid === "district") setLayers(prev => ({ ...prev, tehsils: true, "flood-zones": true }));
    else setLayers(prev => ({ ...prev, tehsils: false, "flood-zones": false }));
  };

  const selInfo = selectedTehsil ? TEHSILS.find(t => t.name.includes(selectedTehsil.split(" ")[0] || "")) : null;

  return (
    <div className="dt-page dt-page-map">
      <div className="dt-page-header">
        <div>
          <h1 className="dt-page-title">3D Digital Twin — Sangli District</h1>
          <p className="dt-page-subtitle">Realistic 3D visualization • Real building footprints from OpenStreetMap</p>
        </div>
      </div>

      <div className="dt-map-container">
        <div ref={mapContainer} className="dt-map" />

        {/* Layers Panel */}
        <div className="dt-map-controls">
          <div className="dt-map-controls-header"><Layers size={16} /><span>Layers</span></div>
          {LAYER_TOGGLES.map(l => (
            <button key={l.id} className={`dt-layer-toggle ${layers[l.id] ? "active" : ""}`} onClick={() => toggleLayer(l.id)}>
              {layers[l.id] ? <Eye size={14} /> : <EyeOff size={14} />}
              {l.id === "buildings" ? <Box size={14} style={{ color: l.color, margin: "0 4px", flexShrink: 0 }} /> : <span className="dt-layer-dot" style={{ background: l.color }} />}
              <span>{l.label}</span>
            </button>
          ))}
        </div>

        {/* View Presets */}
        <div className="dt-view-presets">
          {VIEW_PRESETS.map(v => (
            <button key={v.id} className={`dt-view-btn ${activeView === v.id ? "active" : ""}`} onClick={() => flyTo(v.id)}>
              {v.label}
            </button>
          ))}
        </div>

        {selInfo && (
          <div className="dt-map-info-panel">
            <h4>{selInfo.name}</h4>
            <div className="dt-map-info-grid">
              <div><span className="dt-info-label">Population</span><span className="dt-info-value">{selInfo.population.toLocaleString()}</span></div>
              <div><span className="dt-info-label">Area</span><span className="dt-info-value">{selInfo.area_sq_km} km²</span></div>
              <div><span className="dt-info-label">Literacy</span><span className="dt-info-value">{selInfo.literacy_rate}%</span></div>
              <div><span className="dt-info-label">Risk</span><span className="dt-info-value" style={{ color: selInfo.risk_score >= 70 ? "#f87171" : selInfo.risk_score >= 50 ? "#fbbf24" : "#34d399" }}>{selInfo.risk_score}/100</span></div>
            </div>
          </div>
        )}

        <div className="dt-map-legend">
          <span className="dt-map-legend-title">Infrastructure Glow Color</span>
          <div className="dt-map-legend-items">
            <span><span className="dt-legend-color" style={{ background: "#38bdf8" }} />Dam</span>
            <span><span className="dt-legend-color" style={{ background: "#fbbf24" }} />Bridge</span>
            <span><span className="dt-legend-color" style={{ background: "#f87171" }} />Hospital</span>
            <span><span className="dt-legend-color" style={{ background: "#a78bfa" }} />School</span>
            <span><span className="dt-legend-color" style={{ background: "#34d399" }} />Water</span>
          </div>
        </div>
      </div>
    </div>
  );
}
