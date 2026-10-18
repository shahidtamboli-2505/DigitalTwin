// Data for the 3D Digital Twin (values taken from the Phase I paper tables).
// Later: replace with API calls from src/lib/api.ts.

export type Health = "good" | "fair" | "poor";

export interface TwinAsset {
  id: string;
  name: string;
  type: "bridge" | "dam" | "hospital" | "substation";
  tehsil: string;
  risk: number;          // 0-100
  condition: Health;
  built: number;
  position: [number, number, number]; // scene coords
  sensors: string[];
}

export interface TwinSensor {
  id: string;
  name: string;
  type: "water" | "vibration" | "strain" | "weather";
  unit: string;
  value: number;
  warning: number;
  critical: number;
  step: number;          // random-walk step v (paper Eq. 1)
  position: [number, number, number];
}

export const ASSETS: TwinAsset[] = [
  { id: "irwin", name: "Irwin Bridge (Krishna)", type: "bridge", tehsil: "Miraj", risk: 78, condition: "poor", built: 1929, position: [0, 0, 0], sensors: ["krishna-irwin", "irwin-vib", "irwin-strain"] },
  { id: "chandoli", name: "Chandoli Dam (Warna)", type: "dam", tehsil: "Shirala", risk: 40, condition: "fair", built: 2001, position: [-150, 0, -70], sensors: ["chandoli-level"] },
  { id: "civil", name: "Civil Hospital Sangli", type: "hospital", tehsil: "Miraj", risk: 30, condition: "good", built: 1985, position: [60, 0, 55], sensors: [] },
  { id: "substation", name: "Islampur Power Grid", type: "substation", tehsil: "Walwa", risk: 38, condition: "fair", built: 1998, position: [-60, 0, 60], sensors: [] },
];

export const SENSORS: TwinSensor[] = [
  { id: "krishna-irwin", name: "Krishna @ Irwin Bridge", type: "water", unit: "m", value: 12.4, warning: 15, critical: 18, step: 0.3, position: [6, 0, 9] },
  { id: "irwin-vib", name: "Irwin Deck Vibration", type: "vibration", unit: "mm/s", value: 2.1, warning: 6, critical: 10, step: 0.4, position: [-20, 9, 0] },
  { id: "irwin-strain", name: "Irwin Pier Strain", type: "strain", unit: "µε", value: 310, warning: 600, critical: 800, step: 20, position: [20, 4, 0] },
  { id: "chandoli-level", name: "Chandoli Reservoir", type: "water", unit: "m ASL", value: 540.2, warning: 544, critical: 546, step: 0.2, position: [-150, 22, -70] },
];

/** Map the Krishna gauge reading (m) to water-surface height in the scene. */
export const RIVER_BED_Y = -6;
export const gaugeToY = (level: number) => RIVER_BED_Y + (level - 8) * 0.9;

export const healthColor = (risk: number) =>
  risk >= 70 ? "#ff3b4e" : risk >= 50 ? "#ffb020" : risk >= 30 ? "#ffe066" : "#2ee6a6";

/** 2019 Krishna flood replay (simplified hydrograph, peak 22.8 m – paper Table 7). */
export const FLOOD_2019 = [12, 13.5, 15.2, 17.4, 19.6, 21.3, 22.8, 22.1, 20.4, 18.2, 16, 14.1, 12.8];
