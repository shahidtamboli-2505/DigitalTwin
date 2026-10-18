import { create } from "zustand";
import { SENSORS, FLOOD_2019 } from "./twinData";
import type { TwinSensor } from "./twinData";

export type ViewMode = "realistic" | "hologram" | "stress";

interface TwinState {
  sensors: TwinSensor[];
  history: Record<string, number[]>;
  mode: ViewMode;
  selected: string | null;
  replayIndex: number | null;   // index into FLOOD_2019 when replay running
  cameraTarget: string;         // preset name
  tick: () => void;
  setMode: (m: ViewMode) => void;
  select: (id: string | null) => void;
  setCamera: (p: string) => void;
  startReplay: () => void;
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
  cameraTarget: "bridge",
  tick: () => {
    const { replayIndex } = get();
    set((st) => {
      const sensors = st.sensors.map((s) => {
        if (replayIndex !== null && s.id === "krishna-irwin") {
          return { ...s, value: FLOOD_2019[replayIndex] };
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
  startReplay: () => set({ replayIndex: 0, cameraTarget: "bridge" }),
  stepReplay: () =>
    set((st) => {
      if (st.replayIndex === null) return {};
      const n = st.replayIndex + 1;
      return { replayIndex: n >= FLOOD_2019.length ? null : n };
    }),
}));

export const statusOf = (s: TwinSensor) =>
  s.value >= s.critical ? "critical" : s.value >= s.warning ? "warning" : "online";
