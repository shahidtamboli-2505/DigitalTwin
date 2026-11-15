import { create } from "zustand";
import { SENSORS, FLOOD_2019 } from "./twinData";
import type { TwinSensor } from "./twinData";

export type ViewMode = "realistic" | "hologram" | "stress";

interface TwinState {
  sensors: TwinSensor[];
  history: Record<string, number[]>;
  mode: ViewMode;
  selected: string | null;
  replayIndex: number | null;   // index into replayLevels when replay running
  replayYear: number;           // which year's hydrograph is being replayed
  replayLevels: number[];       // daily Krishna gauge levels (m) for the replay
  replayDates: string[];        // matching ISO dates (empty for the built-in 2019 curve)
  cameraTarget: string;         // preset name
  tick: () => void;
  setMode: (m: ViewMode) => void;
  select: (id: string | null) => void;
  setCamera: (p: string) => void;
  startReplay: (year?: number, levels?: number[], dates?: string[]) => void;
  stepReplay: () => void;
}

// Paper Eq. (1): x(t+1) = max(0, x(t) + u),  u ~ U(-v, v)
const walk = (s: TwinSensor) => {
  const u = (Math.random() * 2 - 1) * s.step;
  // gentle pull back towards initial value so demo stays realistic
  const base = SENSORS.find((b) => b.id === s.id)!.value;
  const next = Math.max(0, s.value + u + (base - s.value) * 0.05);
  return { ...s, value: +next.toFixed(2) };
};

export const useTwinStore = create<TwinState>((set, get) => ({
  sensors: SENSORS,
  history: Object.fromEntries(SENSORS.map((s) => [s.id, [s.value]])),
  mode: "realistic",
  selected: "irwin",
  replayIndex: null,
  replayYear: 2019,
  replayLevels: FLOOD_2019,
  replayDates: [],
  cameraTarget: "bridge",
  tick: () => {
    const { replayIndex, replayLevels } = get();
    set((st) => {
      const sensors = st.sensors.map((s) => {
        if (replayIndex !== null && s.id === "krishna-irwin") {
          const level = replayLevels[replayIndex] ?? s.value;
          return { ...s, value: level };
        }
        // bridge vibration/strain rise with the flood load during a replay
        if (replayIndex !== null && (s.id === "irwin-vib" || s.id === "irwin-strain")) {
          const level = replayLevels[replayIndex] ?? 12;
          const load = Math.max(0, (level - 12) / 12);            // 0 at 12 m, 1 at 24 m
          const base = SENSORS.find((b) => b.id === s.id)!.value;
          const target = s.id === "irwin-vib" ? base + load * 9 : base + load * 520;
          return { ...s, value: +(s.value + (target - s.value) * 0.5 + (Math.random() - 0.5) * s.step).toFixed(2) };
        }
        return walk(s);
      });
      const history = { ...st.history };
      sensors.forEach((s) => {
        history[s.id] = [...(history[s.id] ?? []), s.value].slice(-24); // 24-point history
      });
      return { sensors, history };
    });
  },
  setMode: (mode) => set({ mode }),
  select: (selected) => set({ selected }),
  setCamera: (cameraTarget) => set({ cameraTarget }),
  startReplay: (year = 2019, levels = FLOOD_2019, dates = []) =>
    set({ replayIndex: 0, replayYear: year, replayLevels: levels, replayDates: dates, cameraTarget: "bridge" }),
  stepReplay: () =>
    set((st) => {
      if (st.replayIndex === null) return {};
      const n = st.replayIndex + 1;
      return { replayIndex: n >= st.replayLevels.length ? null : n };
    }),
}));

export const statusOf = (s: TwinSensor) =>
  s.value >= s.critical ? "critical" : s.value >= s.warning ? "warning" : "online";
