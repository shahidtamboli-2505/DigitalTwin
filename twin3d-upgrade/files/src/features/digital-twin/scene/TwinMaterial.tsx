import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useTwinStore } from "../useTwinStore";
import { healthColor } from "../twinData";

interface Props {
  color: string;        // realistic base colour
  risk?: number;        // 0-100 local risk, drives stress view colour
  roughness?: number;
  metalness?: number;
}

/**
 * One material that switches with the global view mode:
 *  realistic -> PBR surface
 *  hologram  -> glowing cyan see-through shell (movie style)
 *  stress    -> health heatmap, pulses when risk is high
 */
export function TwinMaterial({ color, risk = 0, roughness = 0.85, metalness = 0.05 }: Props) {
  const mode = useTwinStore((s) => s.mode);
  const ref = useRef<THREE.MeshStandardMaterial>(null);

  useFrame(({ clock }) => {
    if (!ref.current) return;
    if (mode === "stress" && risk >= 50) {
      const pulse = 0.35 + 0.35 * Math.sin(clock.elapsedTime * (risk >= 70 ? 5 : 2.5));
      ref.current.emissiveIntensity = pulse;
    }
    if (mode === "hologram") {
      ref.current.emissiveIntensity = 1.1 + 0.25 * Math.sin(clock.elapsedTime * 2);
    }
  });

  if (mode === "hologram") {
    return (
      <meshStandardMaterial
        ref={ref}
        color="#0b3d4f"
        emissive="#22d3ee"
        emissiveIntensity={1.2}
        transparent
        opacity={0.28}
        wireframe={false}
        depthWrite={false}
        side={THREE.DoubleSide}
      />
    );
  }
  if (mode === "stress") {
    const c = healthColor(risk);
    return <meshStandardMaterial ref={ref} color={c} emissive={c} emissiveIntensity={0.3} roughness={0.5} />;
  }
  return <meshStandardMaterial ref={ref} color={color} roughness={roughness} metalness={metalness} />;
}

/** Thin wire overlay shown only in hologram mode (gives the "scan" look). */
export function HoloEdges({ geometry }: { geometry: THREE.BufferGeometry }) {
  const mode = useTwinStore((s) => s.mode);
  if (mode !== "hologram") return null;
  return (
    <lineSegments>
      <edgesGeometry args={[geometry, 25]} />
      <lineBasicMaterial color="#67e8f9" transparent opacity={0.9} />
    </lineSegments>
  );
}
