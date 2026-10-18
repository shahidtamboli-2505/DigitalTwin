import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import type { ThreeEvent } from "@react-three/fiber";
import * as THREE from "three";
import { TwinMaterial, HoloEdges } from "./TwinMaterial";
import { useTwinStore } from "../useTwinStore";

/**
 * Procedural twin of the Irwin Bridge: masonry multi-arch bridge,
 * ~160 m long x 14 m wide (same footprint as the paper's asset model).
 * Each span carries its own risk score -> per-span health heatmap.
 */
const SPANS = 7;
const SPAN_W = 22;
const ARCH_R = 8.5;
const DECK_Y = 9;
const BASE_Y = -9;
const WIDTH = 14;
// per-span risk (span 4 holds the YOLO crack finding)
const SPAN_RISK = [48, 58, 66, 92, 70, 60, 46];

function spanGeometry() {
  const w = SPAN_W / 2;
  const springY = 0.5;
  const s = new THREE.Shape();
  s.moveTo(-w, BASE_Y);
  s.lineTo(-w, DECK_Y);
  s.lineTo(w, DECK_Y);
  s.lineTo(w, BASE_Y);
  s.lineTo(ARCH_R, BASE_Y);
  s.lineTo(ARCH_R, springY);
  s.absarc(0, springY, ARCH_R, 0, Math.PI, false);
  s.lineTo(-ARCH_R, BASE_Y);
  s.lineTo(-w, BASE_Y);
  const g = new THREE.ExtrudeGeometry(s, { depth: WIDTH - 2, bevelEnabled: true, bevelSize: 0.25, bevelThickness: 0.25, bevelSegments: 1, curveSegments: 28 });
  g.translate(0, 0, -(WIDTH - 2) / 2);
  return g;
}

function Part({ geometry, color, risk, position, rotation, onClick }: {
  geometry: THREE.BufferGeometry; color: string; risk: number;
  position?: [number, number, number]; rotation?: [number, number, number];
  onClick?: (e: ThreeEvent<MouseEvent>) => void;
}) {
  return (
    <group position={position} rotation={rotation}>
      <mesh geometry={geometry} castShadow receiveShadow onClick={onClick}>
        <TwinMaterial color={color} risk={risk} />
      </mesh>
      <HoloEdges geometry={geometry} />
    </group>
  );
}

function CrackMarker({ position }: { position: [number, number, number] }) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = (clock.elapsedTime * 0.8) % 1;
    ref.current.scale.setScalar(1 + t * 2.5);
    (ref.current.material as THREE.MeshBasicMaterial).opacity = 1 - t;
  });
  return (
    <group position={position}>
      <mesh ref={ref} rotation={[0, 0, 0]}>
        <ringGeometry args={[0.9, 1.2, 40]} />
        <meshBasicMaterial color="#ff3b4e" transparent side={THREE.DoubleSide} toneMapped={false} />
      </mesh>
      <mesh>
        <sphereGeometry args={[0.45, 16, 16]} />
        <meshBasicMaterial color="#ff3b4e" toneMapped={false} />
      </mesh>
    </group>
  );
}

export function IrwinBridge() {
  const select = useTwinStore((s) => s.select);
  const vib = useTwinStore((s) => s.sensors.find((x) => x.id === "irwin-vib")?.value ?? 0);
  const deckRef = useRef<THREE.Group>(null);

  const span = useMemo(spanGeometry, []);
  const parapet = useMemo(() => new THREE.BoxGeometry(SPAN_W * SPANS, 1.2, 0.6), []);
  const road = useMemo(() => new THREE.BoxGeometry(SPAN_W * SPANS, 0.3, WIDTH - 2.4), []);
  const cutwater = useMemo(() => new THREE.CylinderGeometry(2.2, 2.2, 12, 4), []);
  const abut = useMemo(() => new THREE.BoxGeometry(14, 18, WIDTH + 2), []);
  const length = SPAN_W * SPANS;

  // deck vibration, amplified so it is visible (amplitude ∝ vibration sensor)
  useFrame(({ clock }) => {
    if (deckRef.current) deckRef.current.position.y = Math.sin(clock.elapsedTime * 9) * vib * 0.012;
  });

  return (
    <group onClick={(e) => { e.stopPropagation(); select("irwin"); }}>
      <group ref={deckRef}>
        {SPAN_RISK.map((r, i) => (
          <Part key={i} geometry={span} color="#b9a48a" risk={r}
            position={[-length / 2 + SPAN_W / 2 + i * SPAN_W, 0, 0]} />
        ))}
        {/* road surface + parapets */}
        <Part geometry={road} color="#2b2d31" risk={60} position={[0, DECK_Y + 0.15, 0]} />
        <Part geometry={parapet} color="#cdb89c" risk={55} position={[0, DECK_Y + 0.6, WIDTH / 2 - 0.7]} />
        <Part geometry={parapet} color="#cdb89c" risk={55} position={[0, DECK_Y + 0.6, -WIDTH / 2 + 0.7]} />
        {/* lamp posts */}
        {Array.from({ length: SPANS + 1 }).map((_, i) => (
          [WIDTH / 2 - 0.7, -WIDTH / 2 + 0.7].map((z) => (
            <group key={`${i}-${z}`} position={[-length / 2 + i * SPAN_W, DECK_Y + 1.2, z]}>
              <mesh position={[0, 2, 0]}><cylinderGeometry args={[0.12, 0.15, 4, 8]} /><meshStandardMaterial color="#444" /></mesh>
              <mesh position={[0, 4.1, 0]}><sphereGeometry args={[0.35, 12, 12]} /><meshBasicMaterial color="#ffd27a" toneMapped={false} /></mesh>
            </group>
          ))
        ))}
      </group>
      {/* pier cutwaters (upstream + downstream) */}
      {Array.from({ length: SPANS - 1 }).map((_, i) => {
        const x = -length / 2 + (i + 1) * SPAN_W;
        return [WIDTH / 2, -WIDTH / 2].map((z) => (
          <Part key={`${i}-${z}`} geometry={cutwater} color="#a8957c" risk={SPAN_RISK[i]}
            position={[x, BASE_Y + 6, z]} rotation={[0, Math.PI / 4, 0]} />
        ));
      })}
      {/* abutments */}
      <Part geometry={abut} color="#9c8a72" risk={40} position={[-length / 2 - 7, 0, 0]} />
      <Part geometry={abut} color="#9c8a72" risk={40} position={[length / 2 + 7, 0, 0]} />
      {/* AI crack detection result on span 4 pier */}
      <CrackMarker position={[-length / 2 + 3 * SPAN_W + SPAN_W / 2 + 6, 3, WIDTH / 2 + 0.2]} />
    </group>
  );
}
