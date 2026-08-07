// ═══════════════════════════════════════════════════════════════════════
// Sangli District — GeoJSON Data for MapLibre GL
// Simplified boundaries based on Census maps and OpenStreetMap
// ═══════════════════════════════════════════════════════════════════════

export const SANGLI_DISTRICT_BOUNDARY: GeoJSON.Feature = {
  type: "Feature",
  properties: { name: "Sangli District", state: "Maharashtra" },
  geometry: {
    type: "Polygon",
    coordinates: [[
      [73.65, 17.40], [73.80, 17.42], [74.00, 17.38], [74.20, 17.42],
      [74.50, 17.44], [74.80, 17.40], [75.10, 17.35], [75.40, 17.25],
      [75.55, 17.10], [75.50, 16.90], [75.40, 16.70], [75.20, 16.55],
      [75.00, 16.45], [74.80, 16.42], [74.50, 16.40], [74.20, 16.42],
      [74.00, 16.50], [73.80, 16.60], [73.65, 16.80], [73.60, 17.00],
      [73.60, 17.20], [73.65, 17.40],
    ]],
  },
};

export const TEHSIL_BOUNDARIES: GeoJSON.FeatureCollection = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      properties: { id: "miraj", name: "Miraj", population: 854581, risk_score: 72 },
      geometry: {
        type: "Polygon",
        coordinates: [[
          [74.40, 16.95], [74.55, 16.98], [74.75, 16.95], [74.85, 16.82],
          [74.80, 16.68], [74.65, 16.60], [74.45, 16.62], [74.35, 16.72],
          [74.30, 16.85], [74.40, 16.95],
        ]],
      },
    },
    {
      type: "Feature",
      properties: { id: "walwa", name: "Walwa (Islampur)", population: 456002, risk_score: 68 },
      geometry: {
        type: "Polygon",
        coordinates: [[
          [74.05, 17.18], [74.20, 17.22], [74.40, 17.18], [74.45, 17.02],
          [74.35, 16.92], [74.15, 16.90], [74.00, 16.95], [73.95, 17.08],
          [74.05, 17.18],
        ]],
      },
    },
    {
      type: "Feature",
      properties: { id: "jat", name: "Jat", population: 328324, risk_score: 55 },
      geometry: {
        type: "Polygon",
        coordinates: [[
          [74.95, 17.20], [75.15, 17.25], [75.40, 17.18], [75.45, 17.02],
          [75.35, 16.88], [75.10, 16.85], [74.95, 16.92], [74.88, 17.05],
          [74.95, 17.20],
        ]],
      },
    },
    {
      type: "Feature",
      properties: { id: "tasgaon", name: "Tasgaon", population: 251401, risk_score: 61 },
      geometry: {
        type: "Polygon",
        coordinates: [[
          [74.40, 17.18], [74.55, 17.20], [74.70, 17.15], [74.75, 17.02],
          [74.65, 16.92], [74.50, 16.90], [74.38, 16.98], [74.35, 17.10],
          [74.40, 17.18],
        ]],
      },
    },
    {
      type: "Feature",
      properties: { id: "khanapur", name: "Khanapur (Vita)", population: 170214, risk_score: 48 },
      geometry: {
        type: "Polygon",
        coordinates: [[
          [74.30, 17.42], [74.50, 17.44], [74.65, 17.38], [74.60, 17.22],
          [74.45, 17.15], [74.28, 17.18], [74.18, 17.28], [74.22, 17.38],
          [74.30, 17.42],
        ]],
      },
    },
    {
      type: "Feature",
      properties: { id: "palus", name: "Palus", population: 164909, risk_score: 65 },
      geometry: {
        type: "Polygon",
        coordinates: [[
          [74.28, 17.18], [74.40, 17.20], [74.48, 17.15], [74.45, 17.02],
          [74.35, 16.95], [74.22, 16.98], [74.15, 17.05], [74.18, 17.15],
          [74.28, 17.18],
        ]],
      },
    },
    {
      type: "Feature",
      properties: { id: "shirala", name: "Shirala", population: 162911, risk_score: 42 },
      geometry: {
        type: "Polygon",
        coordinates: [[
          [73.65, 17.15], [73.85, 17.20], [74.05, 17.15], [74.08, 16.98],
          [73.98, 16.85], [73.80, 16.80], [73.65, 16.88], [73.60, 17.00],
          [73.65, 17.15],
        ]],
      },
    },
    {
      type: "Feature",
      properties: { id: "kavathe_mahankal", name: "Kavathe Mahankal", population: 152327, risk_score: 58 },
      geometry: {
        type: "Polygon",
        coordinates: [[
          [74.80, 17.05], [74.98, 17.08], [75.10, 17.00], [75.08, 16.85],
          [74.95, 16.78], [74.80, 16.80], [74.72, 16.90], [74.75, 17.00],
          [74.80, 17.05],
        ]],
      },
    },
    {
      type: "Feature",
      properties: { id: "kadegaon", name: "Kadegaon", population: 143019, risk_score: 52 },
      geometry: {
        type: "Polygon",
        coordinates: [[
          [74.15, 17.25], [74.30, 17.28], [74.42, 17.22], [74.38, 17.10],
          [74.25, 17.02], [74.10, 17.05], [74.02, 17.15], [74.08, 17.22],
          [74.15, 17.25],
        ]],
      },
    },
    {
      type: "Feature",
      properties: { id: "atpadi", name: "Atpadi", population: 138455, risk_score: 60 },
      geometry: {
        type: "Polygon",
        coordinates: [[
          [74.70, 17.42], [74.90, 17.44], [75.10, 17.38], [75.15, 17.22],
          [75.00, 17.12], [74.82, 17.10], [74.65, 17.18], [74.62, 17.32],
          [74.70, 17.42],
        ]],
      },
    },
  ],
};

export const KRISHNA_RIVER: GeoJSON.Feature = {
  type: "Feature",
  properties: { name: "Krishna River", type: "river" },
  geometry: {
    type: "LineString",
    coordinates: [
      [74.10, 16.95], [74.20, 16.90], [74.30, 16.88], [74.40, 16.85],
      [74.50, 16.83], [74.58, 16.85], [74.65, 16.82], [74.75, 16.80],
      [74.85, 16.78], [74.95, 16.75], [75.05, 16.72], [75.15, 16.68],
    ],
  },
};

export const WARNA_RIVER: GeoJSON.Feature = {
  type: "Feature",
  properties: { name: "Warna River", type: "river" },
  geometry: {
    type: "LineString",
    coordinates: [
      [73.78, 17.06], [73.90, 17.05], [74.00, 17.02], [74.10, 16.98],
      [74.20, 16.95], [74.30, 16.92], [74.40, 16.88], [74.50, 16.85],
    ],
  },
};

export const FLOOD_ZONES: GeoJSON.FeatureCollection = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      properties: { name: "Krishna Flood Plain — Sangli", risk: "high", description: "Primary flood zone along Krishna river, Sangli-Miraj urban area" },
      geometry: {
        type: "Polygon",
        coordinates: [[
          [74.45, 16.88], [74.55, 16.90], [74.65, 16.88], [74.72, 16.82],
          [74.68, 16.76], [74.55, 16.74], [74.42, 16.78], [74.40, 16.84],
          [74.45, 16.88],
        ]],
      },
    },
    {
      type: "Feature",
      properties: { name: "Warna Junction Flood Zone", risk: "medium", description: "Krishna-Warna confluence area, Palus-Kadegaon belt" },
      geometry: {
        type: "Polygon",
        coordinates: [[
          [74.25, 16.98], [74.40, 17.00], [74.48, 16.95], [74.45, 16.85],
          [74.32, 16.82], [74.20, 16.88], [74.18, 16.95], [74.25, 16.98],
        ]],
      },
    },
    {
      type: "Feature",
      properties: { name: "Islampur Flood Zone", risk: "medium", description: "Krishna riverside at Islampur-Walwa" },
      geometry: {
        type: "Polygon",
        coordinates: [[
          [74.15, 16.95], [74.28, 16.98], [74.32, 16.92], [74.25, 16.85],
          [74.12, 16.84], [74.05, 16.90], [74.10, 16.95], [74.15, 16.95],
        ]],
      },
    },
  ],
};

export const INFRASTRUCTURE_MARKERS: GeoJSON.FeatureCollection = {
  type: "FeatureCollection",
  features: [
    // Dams
    { type: "Feature", properties: { name: "Chandoli Dam", type: "dam", icon: "dam" }, geometry: { type: "Point", coordinates: [73.7750, 17.0617] } },
    { type: "Feature", properties: { name: "Morna Dam", type: "dam", icon: "dam" }, geometry: { type: "Point", coordinates: [74.2800, 17.1800] } },
    { type: "Feature", properties: { name: "Dandoba Dam", type: "dam", icon: "dam" }, geometry: { type: "Point", coordinates: [74.6800, 16.9200] } },
    // Bridges
    { type: "Feature", properties: { name: "Irwin Bridge", type: "bridge", icon: "bridge", risk: "high" }, geometry: { type: "Point", coordinates: [74.5800, 16.8520] } },
    { type: "Feature", properties: { name: "Sangli-Miraj Bridge", type: "bridge", icon: "bridge" }, geometry: { type: "Point", coordinates: [74.5900, 16.8450] } },
    // Hospitals
    { type: "Feature", properties: { name: "Govt Hospital Miraj", type: "hospital", icon: "hospital" }, geometry: { type: "Point", coordinates: [74.6460, 16.8250] } },
    { type: "Feature", properties: { name: "Wanless Hospital", type: "hospital", icon: "hospital" }, geometry: { type: "Point", coordinates: [74.6350, 16.8300] } },
    { type: "Feature", properties: { name: "Civil Hospital Sangli", type: "hospital", icon: "hospital" }, geometry: { type: "Point", coordinates: [74.5850, 16.8540] } },
    // Sensors
    { type: "Feature", properties: { name: "Krishna @ Irwin Bridge", type: "sensor", icon: "sensor" }, geometry: { type: "Point", coordinates: [74.5800, 16.8520] } },
    { type: "Feature", properties: { name: "Warna @ Chandoli Dam", type: "sensor", icon: "sensor" }, geometry: { type: "Point", coordinates: [73.7750, 17.0617] } },
  ],
};
