// ═══════════════════════════════════════════════════════════════════════
// Sangli District — Master Dataset
// Sources: Census 2011, Maharashtra Disaster Mgmt, IMD, sangli.nic.in
// ═══════════════════════════════════════════════════════════════════════

export interface Tehsil {
  id: string;
  name: string;
  population: number;
  area_sq_km: number;
  literacy_rate: number;
  sex_ratio: number;
  lat: number;
  lng: number;
  risk_score: number;
  flood_prone: boolean;
}

export interface FloodEvent {
  year: number;
  severity: "catastrophic" | "severe" | "moderate" | "minor";
  affected_population: number;
  rainfall_mm: number;
  river_level_m: number;
  duration_days: number;
  description: string;
  damages_crore: number;
}

export interface InfrastructureAsset {
  id: string;
  name: string;
  type: "hospital" | "school" | "bridge" | "dam" | "road" | "power_station" | "water_treatment";
  tehsil: string;
  lat: number;
  lng: number;
  condition: "good" | "fair" | "poor" | "critical";
  risk_score: number;
  capacity: string;
  year_built: number;
  last_inspection: string;
  image_url?: string;
}

export interface SensorReading {
  id: string;
  name: string;
  type: "water_level" | "weather" | "traffic" | "air_quality" | "seismic";
  tehsil: string;
  lat: number;
  lng: number;
  status: "online" | "offline" | "warning";
  current_value: number;
  unit: string;
  threshold_warning: number;
  threshold_critical: number;
  history: number[];
}

export interface Alert {
  id: string;
  title: string;
  description: string;
  severity: "critical" | "high" | "medium" | "low";
  category: "flood" | "drought" | "heat_wave" | "infrastructure" | "environmental";
  tehsil: string;
  timestamp: string;
  status: "active" | "acknowledged" | "resolved";
  affected_population: number;
  response_team: string;
}

export interface WeatherData {
  month: string;
  avg_temp_max: number;
  avg_temp_min: number;
  avg_rainfall_mm: number;
  avg_humidity: number;
}

// ─── District Overview ──────────────────────────────────────────────────
export const DISTRICT_OVERVIEW = {
  name: "Sangli",
  state: "Maharashtra",
  country: "India",
  headquarters: "Sangli City",
  area_sq_km: 8578,
  population: 2822143,
  population_male: 1435728,
  population_female: 1386415,
  population_rural: 2102786,
  population_urban: 719357,
  sex_ratio: 966,
  literacy_rate: 81.48,
  literacy_male: 88.22,
  literacy_female: 74.59,
  density_per_sq_km: 329,
  sc_population: 353093,
  st_population: 18333,
  lat: 16.8524,
  lng: 74.5815,
  bbox: { north: 17.4, south: 16.4, east: 75.6, west: 73.6 },
  rivers: ["Krishna", "Warna", "Yerala", "Agrani", "Manganga"],
  national_highways: ["NH-166", "NH-160"],
  major_crops: ["Sugarcane", "Turmeric", "Grapes", "Soybean", "Jowar"],
};

// ─── Tehsil Data (Census 2011) ──────────────────────────────────────────
export const TEHSILS: Tehsil[] = [
  { id: "miraj", name: "Miraj", population: 854581, area_sq_km: 1153, literacy_rate: 85.2, sex_ratio: 958, lat: 16.8380, lng: 74.6390, risk_score: 72, flood_prone: true },
  { id: "walwa", name: "Walwa (Islampur)", population: 456002, area_sq_km: 1084, literacy_rate: 82.1, sex_ratio: 968, lat: 17.0600, lng: 74.2500, risk_score: 68, flood_prone: true },
  { id: "jat", name: "Jat", population: 328324, area_sq_km: 1327, literacy_rate: 72.3, sex_ratio: 960, lat: 17.0490, lng: 75.2200, risk_score: 55, flood_prone: false },
  { id: "tasgaon", name: "Tasgaon", population: 251401, area_sq_km: 662, literacy_rate: 83.5, sex_ratio: 972, lat: 17.0360, lng: 74.6010, risk_score: 61, flood_prone: true },
  { id: "khanapur", name: "Khanapur (Vita)", population: 170214, area_sq_km: 714, literacy_rate: 79.8, sex_ratio: 974, lat: 17.2750, lng: 74.5340, risk_score: 48, flood_prone: false },
  { id: "palus", name: "Palus", population: 164909, area_sq_km: 375, literacy_rate: 84.2, sex_ratio: 965, lat: 17.1000, lng: 74.4500, risk_score: 65, flood_prone: true },
  { id: "shirala", name: "Shirala", population: 162911, area_sq_km: 1128, literacy_rate: 80.7, sex_ratio: 978, lat: 16.9900, lng: 73.9500, risk_score: 42, flood_prone: false },
  { id: "kavathe_mahankal", name: "Kavathe Mahankal", population: 152327, area_sq_km: 716, literacy_rate: 73.9, sex_ratio: 955, lat: 16.9100, lng: 75.0100, risk_score: 58, flood_prone: false },
  { id: "kadegaon", name: "Kadegaon", population: 143019, area_sq_km: 492, literacy_rate: 81.3, sex_ratio: 970, lat: 17.1400, lng: 74.3200, risk_score: 52, flood_prone: true },
  { id: "atpadi", name: "Atpadi", population: 138455, area_sq_km: 927, literacy_rate: 71.4, sex_ratio: 950, lat: 17.4200, lng: 74.9400, risk_score: 60, flood_prone: false },
];

// ─── Flood History ──────────────────────────────────────────────────────
export const FLOOD_HISTORY: FloodEvent[] = [
  { year: 2023, severity: "severe", affected_population: 120000, rainfall_mm: 320, river_level_m: 18.4, duration_days: 5, description: "Krishna river flooding in Sangli-Miraj belt, multiple villages submerged", damages_crore: 850 },
  { year: 2021, severity: "moderate", affected_population: 85000, rainfall_mm: 260, river_level_m: 16.2, duration_days: 4, description: "Heavy rainfall caused waterlogging and crop damage across Palus, Walwa", damages_crore: 420 },
  { year: 2019, severity: "catastrophic", affected_population: 200000, rainfall_mm: 480, river_level_m: 22.8, duration_days: 9, description: "400% excess rainfall in 4 days. Krishna at historic high. Massive evacuation of 2 lakh+ people", damages_crore: 2800 },
  { year: 2006, severity: "moderate", affected_population: 65000, rainfall_mm: 210, river_level_m: 14.8, duration_days: 3, description: "Warna river overflow affecting downstream villages", damages_crore: 310 },
  { year: 2005, severity: "severe", affected_population: 95000, rainfall_mm: 340, river_level_m: 19.1, duration_days: 6, description: "Maharashtra-wide floods, Krishna and Warna rivers exceeded danger marks", damages_crore: 1200 },
  { year: 1914, severity: "catastrophic", affected_population: 50000, rainfall_mm: 400, river_level_m: 21.0, duration_days: 10, description: "Historic Sangli flood, Irwin Bridge damaged, city center submerged", damages_crore: 5 },
  { year: 1856, severity: "severe", affected_population: 15000, rainfall_mm: 350, river_level_m: 20.0, duration_days: 8, description: "Major Krishna river flood, widespread agricultural destruction", damages_crore: 1 },
  { year: 1853, severity: "moderate", affected_population: 10000, rainfall_mm: 280, river_level_m: 17.5, duration_days: 5, description: "First recorded flood event in Sangli district", damages_crore: 0.5 },
];

// ─── Weather Data (Monthly Averages) ────────────────────────────────────
export const WEATHER_DATA: WeatherData[] = [
  { month: "Jan", avg_temp_max: 31, avg_temp_min: 14, avg_rainfall_mm: 2, avg_humidity: 42 },
  { month: "Feb", avg_temp_max: 34, avg_temp_min: 16, avg_rainfall_mm: 1, avg_humidity: 35 },
  { month: "Mar", avg_temp_max: 37, avg_temp_min: 20, avg_rainfall_mm: 3, avg_humidity: 28 },
  { month: "Apr", avg_temp_max: 39, avg_temp_min: 23, avg_rainfall_mm: 12, avg_humidity: 32 },
  { month: "May", avg_temp_max: 42, avg_temp_min: 25, avg_rainfall_mm: 28, avg_humidity: 38 },
  { month: "Jun", avg_temp_max: 35, avg_temp_min: 23, avg_rainfall_mm: 95, avg_humidity: 68 },
  { month: "Jul", avg_temp_max: 30, avg_temp_min: 22, avg_rainfall_mm: 120, avg_humidity: 78 },
  { month: "Aug", avg_temp_max: 29, avg_temp_min: 22, avg_rainfall_mm: 105, avg_humidity: 80 },
  { month: "Sep", avg_temp_max: 31, avg_temp_min: 21, avg_rainfall_mm: 85, avg_humidity: 72 },
  { month: "Oct", avg_temp_max: 33, avg_temp_min: 20, avg_rainfall_mm: 45, avg_humidity: 55 },
  { month: "Nov", avg_temp_max: 32, avg_temp_min: 17, avg_rainfall_mm: 15, avg_humidity: 45 },
  { month: "Dec", avg_temp_max: 30, avg_temp_min: 14, avg_rainfall_mm: 5, avg_humidity: 43 },
];

// ─── Infrastructure Assets ──────────────────────────────────────────────
export const INFRASTRUCTURE: InfrastructureAsset[] = [
  // Dams
  { id: "dam-001", name: "Chandoli Dam (Warna)", type: "dam", tehsil: "Shirala", lat: 17.0617, lng: 73.7750, condition: "good", risk_score: 28, capacity: "34.40 TMC", year_built: 1986, last_inspection: "2026-03-15" },
  { id: "dam-002", name: "Morna Dam", type: "dam", tehsil: "Kadegaon", lat: 17.1800, lng: 74.2800, condition: "fair", risk_score: 45, capacity: "2.85 TMC", year_built: 1978, last_inspection: "2025-11-20" },
  { id: "dam-003", name: "Dandoba Dam", type: "dam", tehsil: "Miraj", lat: 16.9200, lng: 74.6800, condition: "fair", risk_score: 38, capacity: "0.72 TMC", year_built: 1992, last_inspection: "2026-01-10" },
  // Bridges
  { id: "bridge-001", name: "Irwin Bridge (Krishna)", type: "bridge", tehsil: "Miraj", lat: 16.8520, lng: 74.5800, condition: "poor", risk_score: 78, capacity: "20 ton", year_built: 1907, last_inspection: "2025-09-01", image_url: "https://images.unsplash.com/photo-1513828742140-ccaa15f19387?w=600&h=300&fit=crop" },
  { id: "bridge-002", name: "Sangli-Miraj Bridge (NH-166)", type: "bridge", tehsil: "Miraj", lat: 16.8450, lng: 74.5900, condition: "good", risk_score: 32, capacity: "60 ton", year_built: 2005, last_inspection: "2026-02-28" },
  { id: "bridge-003", name: "Haripur Bridge (Warna)", type: "bridge", tehsil: "Palus", lat: 17.0700, lng: 74.4200, condition: "fair", risk_score: 55, capacity: "40 ton", year_built: 1995, last_inspection: "2025-12-15" },
  { id: "bridge-004", name: "Islampur Bridge (Krishna)", type: "bridge", tehsil: "Walwa", lat: 17.0650, lng: 74.2600, condition: "good", risk_score: 30, capacity: "50 ton", year_built: 2012, last_inspection: "2026-04-10" },
  // Hospitals
  { id: "hosp-001", name: "Government Hospital Miraj", type: "hospital", tehsil: "Miraj", lat: 16.8250, lng: 74.6460, condition: "good", risk_score: 25, capacity: "500 beds", year_built: 1960, last_inspection: "2026-05-01" },
  { id: "hosp-002", name: "Wanless Hospital", type: "hospital", tehsil: "Miraj", lat: 16.8300, lng: 74.6350, condition: "good", risk_score: 18, capacity: "350 beds", year_built: 1894, last_inspection: "2026-04-20" },
  { id: "hosp-003", name: "Civil Hospital Sangli", type: "hospital", tehsil: "Miraj", lat: 16.8540, lng: 74.5850, condition: "fair", risk_score: 35, capacity: "300 beds", year_built: 1975, last_inspection: "2025-11-30" },
  { id: "hosp-004", name: "Sub-District Hospital Islampur", type: "hospital", tehsil: "Walwa", lat: 17.0580, lng: 74.2480, condition: "fair", risk_score: 40, capacity: "150 beds", year_built: 1988, last_inspection: "2025-10-15" },
  { id: "hosp-005", name: "Rural Hospital Vita", type: "hospital", tehsil: "Khanapur", lat: 17.2710, lng: 74.5380, condition: "fair", risk_score: 42, capacity: "100 beds", year_built: 1990, last_inspection: "2026-01-25" },
  // Schools
  { id: "school-001", name: "Willingdon College", type: "school", tehsil: "Miraj", lat: 16.8560, lng: 74.5760, condition: "good", risk_score: 22, capacity: "3000 students", year_built: 1919, last_inspection: "2026-06-01" },
  { id: "school-002", name: "Walchand College of Engineering", type: "school", tehsil: "Miraj", lat: 16.8480, lng: 74.5920, condition: "good", risk_score: 15, capacity: "2500 students", year_built: 1947, last_inspection: "2026-03-20" },
  { id: "school-003", name: "Bharati Vidyapeeth Sangli", type: "school", tehsil: "Miraj", lat: 16.8600, lng: 74.5700, condition: "good", risk_score: 20, capacity: "5000 students", year_built: 1985, last_inspection: "2026-05-15" },
  // Power Stations
  { id: "power-001", name: "Sangli MSEB Substation", type: "power_station", tehsil: "Miraj", lat: 16.8650, lng: 74.5950, condition: "good", risk_score: 30, capacity: "220 kV", year_built: 2002, last_inspection: "2026-04-05" },
  { id: "power-002", name: "Islampur Power Grid", type: "power_station", tehsil: "Walwa", lat: 17.0500, lng: 74.2300, condition: "fair", risk_score: 38, capacity: "132 kV", year_built: 1998, last_inspection: "2025-12-20" },
  // Water Treatment
  { id: "water-001", name: "Sangli Water Treatment Plant", type: "water_treatment", tehsil: "Miraj", lat: 16.8400, lng: 74.5700, condition: "good", risk_score: 28, capacity: "65 MLD", year_built: 2010, last_inspection: "2026-06-10" },
  { id: "water-002", name: "Miraj Water Supply Scheme", type: "water_treatment", tehsil: "Miraj", lat: 16.8200, lng: 74.6500, condition: "fair", risk_score: 42, capacity: "45 MLD", year_built: 1995, last_inspection: "2026-02-15" },
  // Roads
  { id: "road-001", name: "NH-166 (Sangli-Solapur)", type: "road", tehsil: "Miraj", lat: 16.8600, lng: 74.6100, condition: "good", risk_score: 25, capacity: "4-Lane", year_built: 2018, last_inspection: "2026-05-20" },
  { id: "road-002", name: "NH-160 (via Vita-Miraj)", type: "road", tehsil: "Khanapur", lat: 17.2000, lng: 74.5000, condition: "fair", risk_score: 45, capacity: "2-Lane", year_built: 2005, last_inspection: "2025-11-10" },
];

// ─── Sensor Network ─────────────────────────────────────────────────────
const generateHistory = (base: number, variance: number, count = 24): number[] =>
  Array.from({ length: count }, () => +(base + (Math.random() - 0.5) * variance * 2).toFixed(2));

export const SENSORS: SensorReading[] = [
  { id: "wl-001", name: "Krishna @ Irwin Bridge", type: "water_level", tehsil: "Miraj", lat: 16.8520, lng: 74.5800, status: "online", current_value: 12.4, unit: "m", threshold_warning: 15.0, threshold_critical: 18.0, history: generateHistory(12.4, 1.5) },
  { id: "wl-002", name: "Krishna @ Sangli City", type: "water_level", tehsil: "Miraj", lat: 16.8524, lng: 74.5815, status: "online", current_value: 11.8, unit: "m", threshold_warning: 14.5, threshold_critical: 17.5, history: generateHistory(11.8, 1.2) },
  { id: "wl-003", name: "Warna @ Haripur", type: "water_level", tehsil: "Palus", lat: 17.0700, lng: 74.4200, status: "online", current_value: 8.6, unit: "m", threshold_warning: 12.0, threshold_critical: 15.0, history: generateHistory(8.6, 1.0) },
  { id: "wl-004", name: "Warna @ Chandoli Dam", type: "water_level", tehsil: "Shirala", lat: 17.0617, lng: 73.7750, status: "online", current_value: 540.2, unit: "m (ASL)", threshold_warning: 544.0, threshold_critical: 546.0, history: generateHistory(540.2, 2.0) },
  { id: "wl-005", name: "Krishna @ Islampur", type: "water_level", tehsil: "Walwa", lat: 17.0650, lng: 74.2600, status: "warning", current_value: 13.9, unit: "m", threshold_warning: 14.0, threshold_critical: 17.0, history: generateHistory(13.9, 1.8) },
  { id: "wx-001", name: "Sangli AWS", type: "weather", tehsil: "Miraj", lat: 16.8524, lng: 74.5815, status: "online", current_value: 32.4, unit: "°C", threshold_warning: 40.0, threshold_critical: 44.0, history: generateHistory(32.4, 3.0) },
  { id: "wx-002", name: "Shirala AWS", type: "weather", tehsil: "Shirala", lat: 16.9900, lng: 73.9500, status: "online", current_value: 28.1, unit: "°C", threshold_warning: 38.0, threshold_critical: 42.0, history: generateHistory(28.1, 2.5) },
  { id: "wx-003", name: "Jat AWS", type: "weather", tehsil: "Jat", lat: 17.0490, lng: 75.2200, status: "online", current_value: 35.8, unit: "°C", threshold_warning: 42.0, threshold_critical: 45.0, history: generateHistory(35.8, 3.5) },
  { id: "wx-004", name: "Atpadi AWS", type: "weather", tehsil: "Atpadi", lat: 17.4200, lng: 74.9400, status: "offline", current_value: 0, unit: "°C", threshold_warning: 42.0, threshold_critical: 45.0, history: generateHistory(34.2, 3.0) },
  { id: "tr-001", name: "NH-166 Peth Naka", type: "traffic", tehsil: "Miraj", lat: 16.8700, lng: 74.6000, status: "online", current_value: 847, unit: "vehicles/hr", threshold_warning: 1200, threshold_critical: 1500, history: generateHistory(847, 300) },
  { id: "tr-002", name: "NH-160 Vita Junction", type: "traffic", tehsil: "Khanapur", lat: 17.2750, lng: 74.5340, status: "online", current_value: 425, unit: "vehicles/hr", threshold_warning: 800, threshold_critical: 1000, history: generateHistory(425, 150) },
  { id: "aq-001", name: "Sangli AQI Station", type: "air_quality", tehsil: "Miraj", lat: 16.8550, lng: 74.5900, status: "online", current_value: 78, unit: "AQI", threshold_warning: 150, threshold_critical: 300, history: generateHistory(78, 25) },
  { id: "aq-002", name: "Miraj Industrial AQI", type: "air_quality", tehsil: "Miraj", lat: 16.8250, lng: 74.6460, status: "online", current_value: 112, unit: "AQI", threshold_warning: 150, threshold_critical: 300, history: generateHistory(112, 30) },
  { id: "sm-001", name: "Sangli Seismic Monitor", type: "seismic", tehsil: "Miraj", lat: 16.8524, lng: 74.5815, status: "online", current_value: 0.2, unit: "magnitude", threshold_warning: 3.0, threshold_critical: 5.0, history: generateHistory(0.2, 0.3) },
];

// ─── Alerts ──────────────────────────────────────────────────────────────
export const ALERTS: Alert[] = [
  { id: "alert-001", title: "Krishna River Water Level Rising", description: "Water level at Islampur gauge approaching warning threshold. Currently at 13.9m, warning at 14.0m. Koyna Dam discharge increased to 45,000 cusecs.", severity: "high", category: "flood", tehsil: "Walwa", timestamp: "2026-08-07T06:30:00Z", status: "active", affected_population: 45000, response_team: "NDRF Team 7" },
  { id: "alert-002", title: "Heat Wave Advisory — Jat Tehsil", description: "Temperature forecast to exceed 42°C for next 3 days. Advise limiting outdoor activities. Heat shelters activated.", severity: "medium", category: "heat_wave", tehsil: "Jat", timestamp: "2026-08-07T05:00:00Z", status: "active", affected_population: 328324, response_team: "District Health Dept" },
  { id: "alert-003", title: "Irwin Bridge Structural Warning", description: "Routine inspection detected stress fractures in pier 3. Load restriction to 10 tons recommended. Built in 1907, heritage structure.", severity: "high", category: "infrastructure", tehsil: "Miraj", timestamp: "2026-08-06T14:00:00Z", status: "acknowledged", affected_population: 150000, response_team: "PWD Sangli Division" },
  { id: "alert-004", title: "AQI Elevated — Miraj Industrial Zone", description: "Air Quality Index at 112 (Unhealthy for Sensitive Groups). PM2.5 levels rising due to sugar factory emissions.", severity: "medium", category: "environmental", tehsil: "Miraj", timestamp: "2026-08-06T10:00:00Z", status: "active", affected_population: 854581, response_team: "MPCB Regional" },
  { id: "alert-005", title: "Atpadi AWS Sensor Offline", description: "Automatic Weather Station at Atpadi not transmitting since 08:00 UTC. Last known temperature: 34.2°C. Maintenance dispatched.", severity: "low", category: "infrastructure", tehsil: "Atpadi", timestamp: "2026-08-07T08:15:00Z", status: "active", affected_population: 0, response_team: "IMD Field Unit" },
  { id: "alert-006", title: "Chandoli Dam Storage at 82%", description: "Warna Dam (Chandoli) storage reached 28.2 TMC of 34.4 TMC capacity. Controlled discharge may begin if inflows continue. Downstream villages on standby.", severity: "medium", category: "flood", tehsil: "Shirala", timestamp: "2026-08-07T04:00:00Z", status: "acknowledged", affected_population: 35000, response_team: "Irrigation Dept" },
  { id: "alert-007", title: "Drought Conditions — Atpadi Tehsil", description: "Rainfall deficit of 45% reported for the current season. Groundwater table dropped by 2.3m. Tanker supply activated for 12 villages.", severity: "high", category: "drought", tehsil: "Atpadi", timestamp: "2026-08-05T12:00:00Z", status: "active", affected_population: 138455, response_team: "Revenue Dept" },
  { id: "alert-008", title: "Crop Damage Assessment — Palus", description: "Preliminary assessment indicates 40% kharif crop damage in Palus tehsil due to unseasonal rain. Compensation survey underway.", severity: "medium", category: "flood", tehsil: "Palus", timestamp: "2026-08-04T09:00:00Z", status: "resolved", affected_population: 164909, response_team: "Agriculture Dept" },
];

// ─── Risk Predictions ───────────────────────────────────────────────────
export interface RiskPrediction {
  id: string;
  category: "flood" | "drought" | "heat_wave" | "infrastructure_failure" | "landslide";
  title: string;
  probability: number;
  severity_if_occurs: "catastrophic" | "severe" | "moderate" | "minor";
  affected_tehsils: string[];
  timeframe: string;
  confidence: number;
  key_factors: string[];
  recommended_actions: string[];
}

export const RISK_PREDICTIONS: RiskPrediction[] = [
  {
    id: "pred-001", category: "flood", title: "Krishna Basin Flood Risk",
    probability: 0.73, severity_if_occurs: "severe",
    affected_tehsils: ["Miraj", "Walwa", "Palus", "Kadegaon"],
    timeframe: "Next 7-14 days",
    confidence: 0.85,
    key_factors: ["Koyna Dam at 89% capacity", "IMD forecasts heavy rainfall in Western Ghats", "Krishna at 78% of warning level", "Historical pattern match with 2019 pre-flood conditions"],
    recommended_actions: ["Activate flood control room", "Pre-position NDRF teams at Sangli & Islampur", "Issue advance warning to riverside villages", "Coordinate with Karnataka on Almatti Dam discharge"],
  },
  {
    id: "pred-002", category: "drought", title: "Eastern Tehsil Drought Risk",
    probability: 0.62, severity_if_occurs: "moderate",
    affected_tehsils: ["Jat", "Atpadi", "Kavathe Mahankal"],
    timeframe: "Next 30-60 days",
    confidence: 0.78,
    key_factors: ["45% rainfall deficit in Atpadi", "Groundwater table declining", "Limited irrigation infrastructure", "El Niño influence on monsoon weakness"],
    recommended_actions: ["Activate tanker water supply", "Deploy drought monitoring sensors", "Accelerate Jal Jeevan Mission connections", "Prepare crop insurance assessment teams"],
  },
  {
    id: "pred-003", category: "heat_wave", title: "Extreme Heat Event — Eastern Belt",
    probability: 0.45, severity_if_occurs: "moderate",
    affected_tehsils: ["Jat", "Atpadi", "Kavathe Mahankal"],
    timeframe: "Next 3-5 days",
    confidence: 0.82,
    key_factors: ["Temperature trending above 40°C", "Low humidity accelerating heat stress", "Weak monsoon current from Bay of Bengal", "Urban heat island effect in Jat town"],
    recommended_actions: ["Open heat shelters in block offices", "Deploy ORS kits to PHCs", "Restrict outdoor labor 12-3 PM", "Alert veterinary services for livestock"],
  },
  {
    id: "pred-004", category: "infrastructure_failure", title: "Irwin Bridge Failure Risk",
    probability: 0.35, severity_if_occurs: "severe",
    affected_tehsils: ["Miraj"],
    timeframe: "Next 30 days (during flood season)",
    confidence: 0.71,
    key_factors: ["119 years old, heritage structure", "Stress fractures detected in pier 3", "Annual monsoon flood loading", "No major retrofitting since 2008"],
    recommended_actions: ["Restrict to pedestrian traffic only", "Commission emergency structural audit", "Prepare alternative routing via NH-166 bridge", "Budget for restoration works in 2027"],
  },
  {
    id: "pred-005", category: "landslide", title: "Western Ghats Landslide Risk — Shirala",
    probability: 0.28, severity_if_occurs: "moderate",
    affected_tehsils: ["Shirala"],
    timeframe: "During peak monsoon (Jul-Sep)",
    confidence: 0.65,
    key_factors: ["Steep terrain in Sahyadri foothills", "Heavy rainfall zone (>2000mm)", "Road cuttings along Chandoli-Shirala route", "Deforestation in catchment areas"],
    recommended_actions: ["Monitor slope movement sensors", "Pre-position earthmoving equipment", "Identify alternative evacuation routes", "Coordinate with Forest Department"],
  },
];

// ─── Helper: Simulated real-time update ─────────────────────────────────
export function getUpdatedSensorValue(sensor: SensorReading): number {
  const variance = sensor.type === "water_level" ? 0.3
    : sensor.type === "weather" ? 0.5
    : sensor.type === "traffic" ? 50
    : sensor.type === "air_quality" ? 5
    : 0.05;
  const newVal = sensor.current_value + (Math.random() - 0.5) * variance * 2;
  return +Math.max(0, newVal).toFixed(2);
}

// ─── Summary Statistics ─────────────────────────────────────────────────
export const SUMMARY_STATS = {
  total_sensors: SENSORS.length,
  sensors_online: SENSORS.filter(s => s.status === "online").length,
  sensors_warning: SENSORS.filter(s => s.status === "warning").length,
  sensors_offline: SENSORS.filter(s => s.status === "offline").length,
  active_alerts: ALERTS.filter(a => a.status === "active").length,
  critical_alerts: ALERTS.filter(a => a.severity === "critical").length,
  high_alerts: ALERTS.filter(a => a.severity === "high").length,
  infrastructure_count: INFRASTRUCTURE.length,
  infrastructure_critical: INFRASTRUCTURE.filter(i => i.condition === "critical").length,
  infrastructure_poor: INFRASTRUCTURE.filter(i => i.condition === "poor").length,
  avg_risk_score: +(TEHSILS.reduce((s, t) => s + t.risk_score, 0) / TEHSILS.length).toFixed(1),
  flood_prone_tehsils: TEHSILS.filter(t => t.flood_prone).length,
};
