import { useEffect, useMemo, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { LineChart, Line, ResponsiveContainer, YAxis } from "recharts";
import { Box, Eye, Radar, Flame, AlertTriangle, Navigation, Mountain } from "lucide-react";
import { createThreeModelLayer } from "../features/digital-twin/map/ThreeModelLayer";
import type { AssetFeature } from "../features/digital-twin/map/ThreeModelLayer";
import { riskColor } from "../features/digital-twin/map/modelBuilders";
import { useTwinStore, statusOf } from "../features/digital-twin/useTwinStore";
import type { ViewMode } from "../features/digital-twin/useTwinStore";

/* ---------- free, key-less data sources ---------- */
const STYLE: maplibregl.StyleSpecification = {
  version: 8,
  glyphs: "https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf",
  sources: {
    satellite: {
      type: "raster", tileSize: 256, maxzoom: 19,
      tiles: ["https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"],
      attribution: "Imagery © Esri, Maxar, Earthstar Geographics",
    },
    omt: { type: "vector", url: "https://tiles.openfreemap.org/planet", attribution: "© OpenStreetMap contributors, OpenFreeMap" },
    dem: {
      type: "raster-dem", encoding: "terrarium", tileSize: 256, maxzoom: 14,
      tiles: ["https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png"],
      attribution: "Terrain: Mapzen / AWS Open Data (SRTM)",
    },
  },
  layers: [
    { id: "satellite", type: "raster", source: "satellite" },
    { id: "hillshade", type: "hillshade", source: "dem", paint: { "hillshade-exaggeration": 0.35, "hillshade-shadow-color": "#1b1b1b" } },
    { id: "water-outline", type: "line", source: "omt", "source-layer": "water", paint: { "line-color": "#38bdf8", "line-width": 1.2, "line-opacity": 0.6 } },
    { id: "roads", type: "line", source: "omt", "source-layer": "transportation", minzoom: 11,
      paint: { "line-color": "#fbbf24", "line-opacity": 0.35, "line-width": ["interpolate", ["linear"], ["zoom"], 11, 0.5, 17, 3] } },
    { id: "buildings-3d", type: "fill-extrusion", source: "omt", "source-layer": "building", minzoom: 13,
      paint: {
        "fill-extrusion-color": ["interpolate", ["linear"], ["coalesce", ["get", "render_height"], 6], 0, "#d6d0c4", 20, "#b8b2a6", 50, "#9aa3ad"],
        "fill-extrusion-height": ["coalesce", ["get", "render_height"], 6],
        "fill-extrusion-base": ["coalesce", ["get", "render_min_height"], 0],
        "fill-extrusion-opacity": 0.9,
      } },
    { id: "place-labels", type: "symbol", source: "omt", "source-layer": "place",
      layout: { "text-field": ["get", "name"], "text-font": ["Noto Sans Regular"], "text-size": 13 },
      paint: { "text-color": "#ffffff", "text-halo-color": "#000000", "text-halo-width": 1.5 } },
  ],
};

// sensor locations as offsets from their asset (approximate)
const SENSOR_POS: Record<string, [number, number]> = {
  "krishna-irwin": [74.5571, 16.8622],
  "irwin-vib": [74.5583, 16.8633],
  "irwin-strain": [74.5577, 16.8625],
  "chandoli-level": [73.7660, 17.1960],
};

const glass = "rounded-xl border border-cyan-400/25 bg-slate-950/75 backdrop-blur-md shadow-[0_0_24px_rgba(34,211,238,0.12)]";

function Spark({ data, color }: { data: number[]; color: string }) {
  return (
    <div className="h-8 w-24"><ResponsiveContainer><LineChart data={data.map((v, i) => ({ i, v }))}>
      <YAxis hide domain={["auto", "auto"]} /><Line type="monotone" dataKey="v" stroke={color} dot={false} strokeWidth={2} isAnimationActive={false} />
    </LineChart></ResponsiveContainer></div>
  );
}

export default function TwinMap() {
  const box = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markers = useRef<Record<string, HTMLDivElement>>({});
  const [assets, setAssets] = useState<AssetFeature[]>([]);
  const { mode, setMode, selected, select, sensors, history, tick } = useTwinStore();
  const modeRef = useRef<ViewMode>(mode);
  modeRef.current = mode;

  // live sensor simulator (Δt = 2 s, paper Eq. 1)
  useEffect(() => { const t = setInterval(tick, 2000); return () => clearInterval(t); }, [tick]);

  // load asset dataset
  useEffect(() => {
    fetch("/data/sangli-assets.geojson").then((r) => r.json()).then((fc) => {
      setAssets(fc.features.map((f: any) => ({ ...f.properties, lng: f.geometry.coordinates[0], lat: f.geometry.coordinates[1] })));
    });
  }, []);

  // build map once assets are known
  useEffect(() => {
    if (!box.current || assets.length === 0 || mapRef.current) return;
    const map = new maplibregl.Map({
      container: box.current, style: STYLE, center: [74.3, 17.0], zoom: 8.6, pitch: 0, bearing: 0,
      maxPitch: 85, canvasContextAttributes: { antialias: true },
    } as maplibregl.MapOptions);
    mapRef.current = map;
    map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), "bottom-right");

    map.on("load", () => {
      map.setTerrain({ source: "dem", exaggeration: 1.4 });
      (map as any).setSky?.({ "sky-color": "#79b4e6", "horizon-color": "#e8f1f8", "fog-color": "#cfe0ec", "sky-horizon-blend": 0.6, "horizon-fog-blend": 0.6, "fog-ground-blend": 0.4 });

      map.addSource("assets", {
        type: "geojson",
        data: { type: "FeatureCollection", features: assets.map((a) => ({ type: "Feature", geometry: { type: "Point", coordinates: [a.lng, a.lat] }, properties: { id: a.id, risk: a.risk, name: a.name } })) },
      });
      map.addLayer({ id: "asset-halo", type: "circle", source: "assets", paint: {
        "circle-radius": ["interpolate", ["linear"], ["zoom"], 8, 6, 16, 40], "circle-color": "transparent",
        "circle-stroke-width": 2, "circle-stroke-color": ["step", ["get", "risk"], "#2ee6a6", 30, "#ffe066", 50, "#ffb020", 70, "#ff3b4e"],
        "circle-pitch-alignment": "map" }, layout: { visibility: "none" } });
      map.addLayer(createThreeModelLayer(assets, () => modeRef.current));

      map.on("click", "asset-halo", (e) => { const id = e.features?.[0]?.properties?.id; if (id) select(id); });
      map.on("mouseenter", "asset-halo", () => (map.getCanvas().style.cursor = "pointer"));
      map.on("mouseleave", "asset-halo", () => (map.getCanvas().style.cursor = ""));

      // live sensor beacons
      Object.entries(SENSOR_POS).forEach(([id, pos]) => {
        const el = document.createElement("div");
        el.className = "rounded-md border px-2 py-1 font-mono text-[11px] text-cyan-50 backdrop-blur-md";
        el.style.background = "rgba(2,10,20,0.75)";
        markers.current[id] = el;
        new maplibregl.Marker({ element: el, anchor: "bottom" }).setLngLat(pos).addTo(map);
      });

      // floating asset name tags (shown when zoomed in)
      const tags: HTMLDivElement[] = [];
      assets.forEach((a) => {
        const el = document.createElement("div");
        el.className = "cursor-pointer rounded-full border border-white/30 bg-black/60 px-3 py-1 text-xs font-semibold text-white backdrop-blur-md";
        el.innerHTML = `<span style="color:${riskColor(a.risk)}">◆</span> ${a.name}`;
        el.onclick = () => flyTo(a.id);
        tags.push(el);
        new maplibregl.Marker({ element: el, anchor: "bottom", offset: [0, -70] }).setLngLat([a.lng, a.lat]).addTo(map);
      });
      const toggleTags = () => tags.forEach((el) => (el.style.display = map.getZoom() > 12 ? "block" : "none"));
      map.on("zoom", toggleTags); toggleTags();

      // cinematic intro: district -> Irwin Bridge
      setTimeout(() => flyTo("irwin"), 1200);
    });
    return () => { map.remove(); mapRef.current = null; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assets]);

  const flyTo = (id: string) => {
    const a = assets.find((x) => x.id === id) ?? (mapRef.current ? undefined : undefined);
    const map = mapRef.current;
    if (!a || !map) return;
    select(id);
    map.flyTo({ center: [a.lng, a.lat], zoom: a.type === "dam" ? 15.6 : 17.4, pitch: 70, bearing: (a.bearing ?? 0) + 35, duration: 4500, essential: true });
  };

  // update sensor beacon labels
  useEffect(() => {
    sensors.forEach((s) => {
      const el = markers.current[s.id]; if (!el) return;
      const st = statusOf(s); const col = st === "online" ? "#2ee6a6" : st === "warning" ? "#ffb020" : "#ff3b4e";
      el.style.borderColor = col; el.style.boxShadow = `0 0 12px ${col}88`;
      el.innerHTML = `<div style="color:${col}">● ${s.name}</div><div style="font-size:13px;font-weight:700">${s.value} ${s.unit}</div>`;
    });
  }, [sensors]);

  // restyle base layers per mode
  useEffect(() => {
    const map = mapRef.current; if (!map || !map.isStyleLoaded()) return;
    const holo = mode === "hologram", stress = mode === "stress";
    map.setPaintProperty("satellite", "raster-saturation", holo || stress ? -1 : 0);
    map.setPaintProperty("satellite", "raster-brightness-max", holo ? 0.25 : stress ? 0.45 : 1);
    map.setPaintProperty("buildings-3d", "fill-extrusion-color", holo ? "#0891b2" : stress ? "#4b5563" :
      ["interpolate", ["linear"], ["coalesce", ["get", "render_height"], 6], 0, "#d6d0c4", 20, "#b8b2a6", 50, "#9aa3ad"]);
    map.setPaintProperty("buildings-3d", "fill-extrusion-opacity", holo ? 0.45 : 0.9);
    map.setPaintProperty("water-outline", "line-color", holo ? "#22d3ee" : "#38bdf8");
    map.setLayoutProperty("asset-halo", "visibility", mode === "realistic" ? "none" : "visible");
  }, [mode]);

  const asset = useMemo(() => assets.find((a) => a.id === selected) ?? assets[0], [assets, selected]);
  const assetSensors = asset ? sensors.filter((s) => (asset as any).sensors?.includes(s.id)) : [];
  const alerts = [
    ...sensors.filter((s) => statusOf(s) !== "online").map((s) => ({ sev: statusOf(s), text: `${s.name}: ${s.value} ${s.unit}` })),
    ...assets.filter((a) => a.risk >= 70).map((a) => ({ sev: "critical", text: `${a.name}: risk ${a.risk}/100` })),
  ];
  const modes: { id: ViewMode; label: string; icon: typeof Eye }[] = [
    { id: "realistic", label: "Satellite", icon: Eye }, { id: "hologram", label: "Hologram", icon: Radar }, { id: "stress", label: "Health map", icon: Flame },
  ];

  return (
    <div className="relative h-[calc(100vh-5rem)] w-full overflow-hidden rounded-xl bg-black">
      <div ref={box} className="absolute inset-0" />

      <div className="pointer-events-none absolute inset-0 flex flex-col p-3 text-slate-100">
        <div className={`${glass} pointer-events-auto flex flex-wrap items-center gap-3 px-4 py-2`}>
          <Box className="h-5 w-5 text-cyan-300" />
          <div className="font-semibold tracking-[0.2em] text-cyan-200">SANGLI 3D DIGITAL TWIN</div>
          <span className="flex items-center gap-1 rounded bg-emerald-500/15 px-2 py-0.5 text-xs text-emerald-300">
            <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" /> LIVE (simulated sensors)</span>
          <div className="ml-auto flex gap-1">
            {modes.map((m) => (
              <button key={m.id} onClick={() => setMode(m.id)}
                className={`flex items-center gap-1 rounded-md px-3 py-1 text-xs ${mode === m.id ? "bg-cyan-400 text-slate-950" : "bg-white/5 hover:bg-white/10"}`}>
                <m.icon className="h-3.5 w-3.5" />{m.label}</button>
            ))}
          </div>
        </div>

        <div className="mt-3 flex flex-1 justify-between gap-3 overflow-hidden">
          {asset && (
            <div className={`${glass} pointer-events-auto w-80 self-start p-4`}>
              <div className="text-[11px] uppercase tracking-widest text-cyan-400">Selected asset</div>
              <div className="mt-1 text-lg font-semibold">{asset.name}</div>
              <div className="text-xs text-slate-400">{(asset as any).tehsil} · built {(asset as any).built} · {(asset as any).condition}</div>
              <div className="mt-3 flex items-center gap-4">
                <div className="relative h-20 w-20">
                  <svg viewBox="0 0 36 36" className="h-20 w-20 -rotate-90">
                    <circle cx="18" cy="18" r="15.9" fill="none" stroke="#1e293b" strokeWidth="3" />
                    <circle cx="18" cy="18" r="15.9" fill="none" stroke={riskColor(asset.risk)} strokeWidth="3" strokeDasharray={`${100 - asset.risk} 100`} strokeLinecap="round" />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center"><span className="text-xl font-bold">{100 - asset.risk}</span><span className="text-[9px] text-slate-400">SHS</span></div>
                </div>
                <div className="text-sm">Risk <b style={{ color: riskColor(asset.risk) }}>{asset.risk}</b>/100<div className="text-xs text-slate-400">Structural Health Score</div></div>
              </div>
              <div className="mt-3 space-y-2">
                {assetSensors.map((s) => {
                  const st = statusOf(s); const col = st === "online" ? "#2ee6a6" : st === "warning" ? "#ffb020" : "#ff3b4e";
                  return (
                    <div key={s.id} className="flex items-center justify-between rounded-lg bg-white/5 px-3 py-2">
                      <div><div className="text-xs text-slate-300">{s.name}</div><div className="font-mono text-sm" style={{ color: col }}>{s.value} {s.unit}</div></div>
                      <Spark data={history[s.id] ?? []} color={col} />
                    </div>
                  );
                })}
                {assetSensors.length === 0 && <div className="text-xs text-slate-500">No sensors installed (Phase II)</div>}
              </div>
            </div>
          )}

          <div className={`${glass} pointer-events-auto w-72 self-start p-4`}>
            <div className="mb-2 flex items-center gap-2 text-[11px] uppercase tracking-widest text-cyan-400"><AlertTriangle className="h-3.5 w-3.5" /> Live alerts</div>
            <div className="space-y-1.5">
              {alerts.map((a, i) => (
                <div key={i} className={`rounded-md border-l-2 bg-white/5 px-2 py-1.5 text-xs ${a.sev === "critical" ? "border-red-500" : "border-amber-400"}`}>{a.text}</div>
              ))}
            </div>
          </div>
        </div>

        <div className={`${glass} pointer-events-auto mt-3 flex flex-wrap items-center gap-2 self-center px-3 py-2`}>
          <Navigation className="h-4 w-4 text-cyan-300" />
          {assets.map((a) => (
            <button key={a.id} onClick={() => flyTo(a.id)}
              className={`rounded px-3 py-1 text-xs ${selected === a.id ? "bg-cyan-400 text-slate-950" : "bg-white/5 hover:bg-white/10"}`}>{a.name.split(" (")[0]}</button>
          ))}
          <button onClick={() => mapRef.current?.flyTo({ center: [74.3, 17.0], zoom: 8.6, pitch: 45, bearing: 0, duration: 3000 })}
            className="flex items-center gap-1 rounded bg-white/5 px-3 py-1 text-xs hover:bg-white/10"><Mountain className="h-3.5 w-3.5" />District</button>
        </div>
      </div>
    </div>
  );
}
