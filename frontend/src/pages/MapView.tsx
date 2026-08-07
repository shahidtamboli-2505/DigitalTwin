import { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { Layers, Eye, EyeOff, Box } from "lucide-react";
import {
  TEHSIL_BOUNDARIES, KRISHNA_RIVER, WARNA_RIVER,
  FLOOD_ZONES,
} from "../data/sangli-geojson";
import { SENSORS, TEHSILS, INFRASTRUCTURE } from "../data/sangli-district";

const LAYER_TOGGLES = [
  { id: "tehsils", label: "Tehsil Boundaries", color: "#60a5fa" },
  { id: "rivers", label: "Rivers", color: "#38bdf8" },
  { id: "flood-zones", label: "Flood Zones", color: "#f87171" },
  { id: "infrastructure", label: "Infrastructure (Points)", color: "#fbbf24" },
  { id: "sensors", label: "Sensors", color: "#34d399" },
  { id: "twin3d", label: "3D Digital Twin", color: "#a855f7" },
];

function createCirclePolygon(center: [number, number], radiusInMeters: number, points = 24) {
  const coords: [number, number][] = [];
  const km = radiusInMeters / 1000;
  const distanceX = km / (111.32 * Math.cos(center[1] * Math.PI / 180));
  const distanceY = km / 110.574;
  for (let i = 0; i < points; i++) {
    const theta = (i / points) * (2 * Math.PI);
    const x = distanceX * Math.cos(theta);
    const y = distanceY * Math.sin(theta);
    coords.push([center[0] + x, center[1] + y]);
  }
  if (coords.length > 0) {
    const first = coords[0]!;
    coords.push([first[0], first[1]]);
  }
  return [coords];
}

export default function MapView() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [layers, setLayers] = useState<Record<string, boolean>>({
    tehsils: true, rivers: true, "flood-zones": true, infrastructure: true, sensors: true, twin3d: false
  });
  const [selectedTehsil, setSelectedTehsil] = useState<string | null>(null);

  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    map.current = new maplibregl.Map({
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
        },
        layers: [
          {
            id: "osm",
            type: "raster",
            source: "osm",
            paint: {
              "raster-saturation": -0.6,
              "raster-brightness-max": 0.4,
              "raster-contrast": 0.1,
            },
          },
        ],
      },
      center: [74.5815, 16.8524],
      zoom: 8.5,
      pitch: 0,
      maxZoom: 16,
      minZoom: 7,
    });

    map.current.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), "top-right");
    map.current.addControl(new maplibregl.ScaleControl(), "bottom-left");

    map.current.on("load", () => {
      const m = map.current!;

      // ── Tehsil Boundaries ──
      m.addSource("tehsils", { type: "geojson", data: TEHSIL_BOUNDARIES as GeoJSON.FeatureCollection});
      m.addLayer({
        id: "tehsils-fill",
        type: "fill",
        source: "tehsils",
        paint: {
          "fill-color": ["interpolate", ["linear"], ["get", "risk_score"], 30, "rgba(52, 211, 153, 0.15)", 50, "rgba(96, 165, 250, 0.2)", 70, "rgba(251, 191, 36, 0.25)", 90, "rgba(248, 113, 113, 0.3)"],
          "fill-opacity": 0.6,
        },
      });
      m.addLayer({
        id: "tehsils-line",
        type: "line",
        source: "tehsils",
        paint: { "line-color": "#60a5fa", "line-width": 1.5, "line-opacity": 0.8 },
      });
      m.addLayer({
        id: "tehsils-label",
        type: "symbol",
        source: "tehsils",
        layout: { "text-field": ["get", "name"], "text-size": 12, "text-font": ["Open Sans Regular"], "text-anchor": "center" },
        paint: { "text-color": "#f8fafc", "text-halo-color": "#0f172a", "text-halo-width": 1.5 },
      });

      // ── Rivers ──
      m.addSource("krishna", { type: "geojson", data: KRISHNA_RIVER as GeoJSON.Feature });
      m.addSource("warna", { type: "geojson", data: WARNA_RIVER as GeoJSON.Feature });
      m.addLayer({ id: "rivers-krishna", type: "line", source: "krishna", paint: { "line-color": "#38bdf8", "line-width": 3, "line-opacity": 0.8 } });
      m.addLayer({ id: "rivers-warna", type: "line", source: "warna", paint: { "line-color": "#38bdf8", "line-width": 2.5, "line-opacity": 0.7 } });

      // ── Flood Zones ──
      m.addSource("flood-zones", { type: "geojson", data: FLOOD_ZONES as GeoJSON.FeatureCollection });
      m.addLayer({
        id: "flood-zones-fill", type: "fill", source: "flood-zones",
        paint: {
          "fill-color": ["match", ["get", "risk"], "high", "rgba(248, 113, 113, 0.35)", "medium", "rgba(251, 191, 36, 0.25)", "rgba(96, 165, 250, 0.2)"],
          "fill-opacity": 0.6,
        },
      });
      m.addLayer({ id: "flood-zones-line", type: "line", source: "flood-zones", paint: { "line-color": "#f87171", "line-width": 1.5, "line-dasharray": [4, 2] } });

      // ── Infrastructure (Generated from INFRASTRUCTURE array) ──
      const infraFeatures: GeoJSON.Feature[] = INFRASTRUCTURE.map(item => ({
        type: "Feature",
        properties: { id: item.id, name: item.name, type: item.type, condition: item.condition, risk_score: item.risk_score, capacity: item.capacity },
        geometry: { type: "Point", coordinates: [item.lng, item.lat] }
      }));
      m.addSource("infrastructure", { type: "geojson", data: { type: "FeatureCollection", features: infraFeatures } });
      
      m.addLayer({
        id: "infrastructure-points", type: "circle", source: "infrastructure",
        paint: {
          "circle-radius": 6,
          "circle-color": ["match", ["get", "type"], "dam", "#60a5fa", "bridge", "#fbbf24", "hospital", "#f87171", "power_station", "#a78bfa", "water_treatment", "#34d399", "#94a3b8"],
          "circle-stroke-width": 2, "circle-stroke-color": "#0f172a",
        },
      });

      // ── 3D Digital Twin Infrastructure (Volumetric) ──
      const infra3DFeatures: GeoJSON.Feature[] = INFRASTRUCTURE.map(item => {
        // Base size, scales geographically based on type category
        const radius = item.type === 'dam' ? 220 : item.type === 'hospital' ? 140 : item.type === 'power_station' ? 120 : 100;
        return {
          type: "Feature",
          properties: { 
            ...item, 
            height: item.risk_score * 7,  // Max height of ~700m for visual effect
            base_height: 0, 
            color: item.condition === 'good' ? '#34d399' : item.condition === 'fair' ? '#fbbf24' : item.condition === 'poor' ? '#f87171' : '#ef4444' 
          },
          geometry: { type: "Polygon", coordinates: createCirclePolygon([item.lng, item.lat], radius) }
        };
      });
      m.addSource("infrastructure-3d", { type: "geojson", data: { type: "FeatureCollection", features: infra3DFeatures } });
      m.addLayer({
        id: "infrastructure-3d-extrude",
        type: "fill-extrusion",
        source: "infrastructure-3d",
        paint: {
          "fill-extrusion-color": ["get", "color"],
          "fill-extrusion-height": ["get", "height"],
          "fill-extrusion-base": ["get", "base_height"],
          "fill-extrusion-opacity": 0.9,
        }
      });

      // ── Sensors ──
      const sensorGeoJSON: GeoJSON.FeatureCollection = {
        type: "FeatureCollection",
        features: SENSORS.filter(s => s.lat && s.lng).map(s => ({
          type: "Feature" as const,
          properties: { name: s.name, type: s.type, status: s.status, value: `${s.current_value} ${s.unit}` },
          geometry: { type: "Point" as const, coordinates: [s.lng, s.lat] },
        })),
      };
      m.addSource("sensors", { type: "geojson", data: sensorGeoJSON });
      m.addLayer({
        id: "sensors-points", type: "circle", source: "sensors",
        paint: {
          "circle-radius": 5,
          "circle-color": ["match", ["get", "status"], "online", "#34d399", "warning", "#fbbf24", "offline", "#f87171", "#94a3b8"],
          "circle-stroke-width": 2, "circle-stroke-color": "#0f172a", "circle-opacity": 0.9,
        },
      });

      // Popups
      m.on("click", "tehsils-fill", (e) => {
        if (e.features?.[0]) {
          const props = e.features[0].properties!;
          setSelectedTehsil(props.name);
          new maplibregl.Popup({ closeButton: true, maxWidth: "260px" })
            .setLngLat(e.lngLat)
            .setHTML(`<div style="font-family: Inter, sans-serif; color: #f8fafc; padding: 4px;">
                <strong style="font-size: 14px;">${props.name}</strong>
                <p style="margin: 4px 0; font-size: 12px; color: #94a3b8;">Population: ${Number(props.population).toLocaleString()}</p>
                <p style="margin: 4px 0; font-size: 12px; color: ${props.risk_score >= 70 ? '#f87171' : props.risk_score >= 50 ? '#fbbf24' : '#34d399'};">Risk Score: ${props.risk_score}/100</p>
              </div>`)
            .addTo(m);
        }
      });

      m.on("click", "infrastructure-points", (e) => {
        if (e.features?.[0]) {
          const props = e.features[0].properties!;
          new maplibregl.Popup({ closeButton: true, maxWidth: "220px" })
            .setLngLat(e.lngLat)
            .setHTML(`<div style="font-family: Inter, sans-serif; color: #f8fafc; padding: 4px;">
                <strong style="font-size: 13px;">${props.name}</strong>
                <p style="margin: 4px 0; font-size: 11px; color: #94a3b8; text-transform: capitalize;">${props.type}</p>
                <p style="margin: 4px 0; font-size: 11px; font-weight: 600;">Risk Score: ${props.risk_score}</p>
              </div>`)
            .addTo(m);
        }
      });
      
      m.on("click", "infrastructure-3d-extrude", (e) => {
        if (e.features?.[0]) {
          const props = e.features[0].properties!;
          new maplibregl.Popup({ closeButton: true, maxWidth: "220px" })
            .setLngLat(e.lngLat)
            .setHTML(`<div style="font-family: Inter, sans-serif; color: #f8fafc; padding: 8px;">
                <strong style="font-size: 14px; margin-bottom: 6px; display: block; border-bottom: 1px solid #334155; padding-bottom: 4px;">${props.name} <span style="font-size: 10px; opacity: 0.7;">(3D Twin)</span></strong>
                <p style="margin: 4px 0; font-size: 12px; color: #94a3b8; text-transform: capitalize;">Facility Type: ${props.type}</p>
                <p style="margin: 4px 0; font-size: 12px; color: ${props.color}; text-transform: capitalize; font-weight: 600;">Condition: ${props.condition}</p>
                <p style="margin: 6px 0; font-size: 12px; font-weight: 700; color: #fbbf24;">Structural Risk Index: ${props.risk_score}</p>
                <p style="margin: 4px 0; font-size: 10px; color: #64748b;">Visual Altitude mapped to risk scale.</p>
              </div>`)
            .addTo(m);
        }
      });

      m.on("click", "sensors-points", (e) => {
        if (e.features?.[0]) {
          const props = e.features[0].properties!;
          new maplibregl.Popup({ closeButton: true, maxWidth: "220px" })
            .setLngLat(e.lngLat)
            .setHTML(`<div style="font-family: Inter, sans-serif; color: #f8fafc; padding: 4px;">
                <strong style="font-size: 13px;">${props.name}</strong>
                <p style="margin: 4px 0; font-size: 11px; color: #94a3b8;">${props.value}</p>
                <span style="font-size: 10px; color: ${props.status === 'online' ? '#34d399' : '#f87171'};">● ${props.status}</span>
              </div>`)
            .addTo(m);
        }
      });

      ["tehsils-fill", "infrastructure-points", "infrastructure-3d-extrude", "sensors-points"].forEach(layer => {
        m.on("mouseenter", layer, () => { m.getCanvas().style.cursor = "pointer"; });
        m.on("mouseleave", layer, () => { m.getCanvas().style.cursor = ""; });
      });

      setLoaded(true);
    });

    return () => { map.current?.remove(); map.current = null; };
  }, []);

  useEffect(() => {
    if (!map.current || !loaded) return;
    const m = map.current;

    const layerMap: Record<string, string[]> = {
      tehsils: ["tehsils-fill", "tehsils-line", "tehsils-label"],
      rivers: ["rivers-krishna", "rivers-warna"],
      "flood-zones": ["flood-zones-fill", "flood-zones-line"],
      infrastructure: ["infrastructure-points"],
      sensors: ["sensors-points"],
      twin3d: ["infrastructure-3d-extrude"],
    };

    Object.entries(layers).forEach(([key, visible]) => {
      layerMap[key]?.forEach(layerId => {
        if (m.getLayer(layerId)) {
          m.setLayoutProperty(layerId, "visibility", visible ? "visible" : "none");
        }
      });
    });

    if (layers["twin3d"]) {
      m.flyTo({ pitch: 55, bearing: -15, zoom: Math.max(m.getZoom(), 10.5), speed: 0.8 });
    } else if (!layers["twin3d"] && m.getPitch() > 0) {
      m.flyTo({ pitch: 0, bearing: 0, speed: 0.8 });
    }
  }, [layers, loaded]);

  const toggleLayer = (id: string) => {
    setLayers(prev => {
      const next = { ...prev, [id]: !prev[id] };
      if (id === "twin3d" && next.twin3d) {
        next.infrastructure = false; // Hide 2D points when 3D is active
      } else if (id === "twin3d" && !next.twin3d) {
        next.infrastructure = true;
      }
      return next;
    });
  };

  const selectedInfo = selectedTehsil ? TEHSILS.find(t => t.name.includes(selectedTehsil.split(" ")[0] || "")) : null;

  return (
    <div className="dt-page dt-page-map">
      <div className="dt-page-header">
        <div>
          <h1 className="dt-page-title">GIS Map — Sangli District</h1>
          <p className="dt-page-subtitle">Interactive visualization • Switch to <strong style={{color: '#a855f7'}}>3D Twin</strong> for infrastructure volumetric analysis</p>
        </div>
      </div>

      <div className="dt-map-container">
        <div ref={mapContainer} className="dt-map" />

        <div className="dt-map-controls">
          <div className="dt-map-controls-header">
            <Layers size={16} />
            <span>Layers</span>
          </div>
          {LAYER_TOGGLES.map(layer => (
            <button
              key={layer.id}
              className={`dt-layer-toggle ${layers[layer.id] ? "active" : ""}`}
              onClick={() => toggleLayer(layer.id)}
            >
              {layers[layer.id] ? <Eye size={14} /> : <EyeOff size={14} />}
              {layer.id === "twin3d" ? <Box size={14} style={{ color: layer.color, margin: '0 4px', flexShrink: 0 }} /> : <span className="dt-layer-dot" style={{ background: layer.color }} />}
              <span>{layer.label}</span>
            </button>
          ))}
        </div>

        {selectedInfo && (
          <div className="dt-map-info-panel">
            <h4>{selectedInfo.name}</h4>
            <div className="dt-map-info-grid">
              <div><span className="dt-info-label">Population</span><span className="dt-info-value">{selectedInfo.population.toLocaleString()}</span></div>
              <div><span className="dt-info-label">Area</span><span className="dt-info-value">{selectedInfo.area_sq_km} km²</span></div>
              <div><span className="dt-info-label">Literacy</span><span className="dt-info-value">{selectedInfo.literacy_rate}%</span></div>
              <div><span className="dt-info-label">Risk</span><span className="dt-info-value" style={{ color: selectedInfo.risk_score >= 70 ? "#f87171" : selectedInfo.risk_score >= 50 ? "#fbbf24" : "#34d399" }}>{selectedInfo.risk_score}/100</span></div>
              <div><span className="dt-info-label">Flood Prone</span><span className="dt-info-value">{selectedInfo.flood_prone ? "Yes ⚠️" : "No"}</span></div>
              <div><span className="dt-info-label">Sex Ratio</span><span className="dt-info-value">{selectedInfo.sex_ratio}</span></div>
            </div>
          </div>
        )}

        <div className="dt-map-legend">
          <span className="dt-map-legend-title">Risk Level & Condition Color</span>
          <div className="dt-map-legend-items">
            <span><span className="dt-legend-color" style={{ background: "#34d399" }} />Good/Low</span>
            <span><span className="dt-legend-color" style={{ background: "#fbbf24" }} />Fair/Medium</span>
            <span><span className="dt-legend-color" style={{ background: "#f87171" }} />Poor/High</span>
            <span><span className="dt-legend-color" style={{ background: "#ef4444" }} />Critical</span>
          </div>
        </div>
      </div>
    </div>
  );
}
