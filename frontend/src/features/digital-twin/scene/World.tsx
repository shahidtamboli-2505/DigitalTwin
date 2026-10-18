import { useEffect, useMemo, useRef } from "react";
import type { ComponentRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { CameraControls, Html, Sky, Stars } from "@react-three/drei";
import * as THREE from "three";
import { useTwinStore, statusOf } from "../useTwinStore";
import { ASSETS, gaugeToY, healthColor } from "../twinData";
import { TwinMaterial, HoloEdges } from "./TwinMaterial";
import { IrwinBridge } from "./IrwinBridge";

/* ------------------------------------------------------------------ */
/* Terrain: Krishna river channel (along Z) cut through the plains     */
/* ------------------------------------------------------------------ */
const SIZE = 900;
export function terrainHeight(x: number, z: number) {
  const meander = Math.sin(z * 0.006) * 25;            // river bends
  const d = Math.abs(x - meander);
  const noise =
    Math.sin(x * 0.021) * Math.cos(z * 0.017) * 2.6 +
    Math.sin(x * 0.053 + z * 0.041) * 1.2 +
    Math.cos(z * 0.011 - x * 0.007) * 3.0;
  const bed = -9;
  const bank = 6 + noise;
  const t = THREE.MathUtils.smoothstep(d, 55, 95);
  let h = THREE.MathUtils.lerp(bed + Math.sin(z * 0.05) * 0.6, bank, t);
  // plateau for the Chandoli reservoir
  const dd = Math.hypot(x + 150, z + 130);
  const inGorge = z + 130 > 50 && Math.abs(x + 150) < 42; // notch where the dam wall closes the valley
  if (dd < 125 && !inGorge) {
    const rim = THREE.MathUtils.lerp(12, 30, THREE.MathUtils.smoothstep(dd, 50, 70)); // lake bowl + hills
    h = Math.max(h, THREE.MathUtils.lerp(rim, h, THREE.MathUtils.smoothstep(dd, 95, 125)));
  }
  return h;
}

function Terrain() {
  const mode = useTwinStore((s) => s.mode);
  const geo = useMemo(() => {
    const g = new THREE.PlaneGeometry(SIZE, SIZE, 220, 220);
    g.rotateX(-Math.PI / 2);
    const pos = g.attributes.position as THREE.BufferAttribute;
    const colors: number[] = [];
    const c = new THREE.Color();
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i), z = pos.getZ(i);
      const h = terrainHeight(x, z);
      pos.setY(i, h);
      if (h < -3) c.set("#6b5a45");              // river bed silt
      else if (h < 3) c.set("#8a7b52");          // banks
      else c.setHSL(0.24 + Math.sin(x * 0.03) * 0.03, 0.38, 0.26 + (h % 3) * 0.02); // sugarcane fields
      colors.push(c.r, c.g, c.b);
    }
    g.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
    g.computeVertexNormals();
    return g;
  }, []);

  if (mode === "hologram") {
    return (
      <mesh geometry={geo}>
        <meshBasicMaterial color="#0e7490" wireframe transparent opacity={0.18} />
      </mesh>
    );
  }
  return (
    <mesh geometry={geo} receiveShadow>
      <meshStandardMaterial vertexColors roughness={1} color={mode === "stress" ? "#3a3f4a" : "#ffffff"} />
    </mesh>
  );
}

/* ------------------------------------------------------------------ */
/* River water: animated shader; height follows the Krishna gauge      */
/* ------------------------------------------------------------------ */
const waterVert = /* glsl */ `
  uniform float uTime;
  varying vec2 vUv; varying float vWave;
  void main(){
    vUv = uv;
    vec3 p = position;
    float w = sin(p.x*0.15+uTime*1.6)*0.18 + sin(p.y*0.22-uTime*2.3)*0.14;
    p.z += w; vWave = w;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(p,1.0);
  }`;
const waterFrag = /* glsl */ `
  uniform float uTime; uniform float uHolo; uniform float uDanger;
  varying vec2 vUv; varying float vWave;
  void main(){
    vec3 deep = mix(vec3(0.08,0.22,0.30), vec3(0.32,0.20,0.10), uDanger); // turns muddy in flood
    vec3 foam = vec3(0.75,0.85,0.9);
    float flow = sin((vUv.y*180.0 - uTime*3.0) + sin(vUv.x*90.0)*2.0)*0.5+0.5;
    vec3 col = mix(deep, foam, smoothstep(0.92,1.0,flow)*0.25 + vWave*0.4);
    float alpha = 0.86;
    if (uHolo > 0.5){
      float gx = step(0.97, fract(vUv.x*120.0)); float gy = step(0.97, fract(vUv.y*120.0 - uTime*0.4));
      col = vec3(0.1,0.7,0.9) * (0.25 + max(gx,gy));
      alpha = 0.35 + max(gx,gy)*0.5;
    }
    gl_FragColor = vec4(col, alpha);
  }`;

function River() {
  const mode = useTwinStore((s) => s.mode);
  const level = useTwinStore((s) => s.sensors.find((x) => x.id === "krishna-irwin")!.value);
  const mesh = useRef<THREE.Mesh>(null);
  const uniforms = useMemo(() => ({ uTime: { value: 0 }, uHolo: { value: 0 }, uDanger: { value: 0 } }), []);

  useFrame((_, dt) => {
    uniforms.uTime.value += dt;
    uniforms.uHolo.value = mode === "hologram" ? 1 : 0;
    uniforms.uDanger.value = THREE.MathUtils.clamp((level - 15) / 6, 0, 1);
    if (mesh.current) {
      // smooth rise / fall of the twin's water surface
      mesh.current.position.y = THREE.MathUtils.lerp(mesh.current.position.y, gaugeToY(level), Math.min(1, dt * 1.5));
    }
  });

  return (
    <mesh ref={mesh} rotation-x={-Math.PI / 2} position={[0, gaugeToY(level), 0]}>
      <planeGeometry args={[SIZE, SIZE, 160, 160]} />
      <shaderMaterial vertexShader={waterVert} fragmentShader={waterFrag} uniforms={uniforms} transparent depthWrite={false} />
    </mesh>
  );
}

/* ------------------------------------------------------------------ */
/* Chandoli Dam: curved gravity dam + reservoir + spillway jets        */
/* ------------------------------------------------------------------ */
function ChandoliDam() {
  const select = useTwinStore((s) => s.select);
  const dam = ASSETS.find((a) => a.id === "chandoli")!;
  const wall = useMemo(() => {
    const R = 70, T = 7, a0 = Math.PI * 0.32, a1 = Math.PI * 0.68;
    const s = new THREE.Shape();
    s.absarc(0, 0, R + T, a0, a1, false);
    s.absarc(0, 0, R, a1, a0, true);
    const g = new THREE.ExtrudeGeometry(s, { depth: 30, bevelEnabled: false, curveSegments: 48 });
    g.rotateX(-Math.PI / 2);       // extrude upwards
    g.translate(0, -2, R + 72);    // wall crest sits ~72 m downstream of reservoir centre
    return g;
  }, []);
  const jets = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    jets.current?.children.forEach((m, i) => {
      (m as THREE.Mesh).scale.y = 0.85 + 0.15 * Math.sin(clock.elapsedTime * 8 + i);
    });
  });
  return (
    <group position={[dam.position[0], 0, dam.position[2] - 60]} onClick={(e) => { e.stopPropagation(); select("chandoli"); }}>
      <mesh geometry={wall} castShadow receiveShadow>
        <TwinMaterial color="#b8b4aa" risk={dam.risk} />
      </mesh>
      <HoloEdges geometry={wall} />
      {/* reservoir */}
      <mesh rotation-x={-Math.PI / 2} position={[0, 22, 0]}>
        <circleGeometry args={[68, 64]} />
        <meshStandardMaterial color="#1d4e63" transparent opacity={0.85} roughness={0.1} />
      </mesh>
      {/* spillway jets */}
      <group ref={jets} position={[0, 10, 81]}>
        {[-12, -4, 4, 12].map((x) => (
          <mesh key={x} position={[x, 0, 0]}>
            <boxGeometry args={[3, 18, 1.5]} />
            <meshStandardMaterial color="#d8eef5" transparent opacity={0.55} emissive="#9ad7ea" emissiveIntensity={0.3} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

/* ------------------------------------------------------------------ */
/* Sangli city blocks (instanced) + hospital + substation              */
/* ------------------------------------------------------------------ */
function City() {
  const mode = useTwinStore((s) => s.mode);
  const ref = useRef<THREE.InstancedMesh>(null);
  const items = useMemo(() => {
    const arr: { x: number; z: number; h: number; w: number; d: number }[] = [];
    let seed = 7;
    const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    for (let gx = 0; gx < 18; gx++)
      for (let gz = 0; gz < 26; gz++) {
        if (rnd() < 0.28) continue;
        const x = 110 + gx * 13 + rnd() * 4;
        const z = -170 + gz * 13 + rnd() * 4;
        const centre = Math.max(0, 1 - Math.hypot(x - 170, z) / 180);
        arr.push({ x, z, h: 4 + rnd() * 10 + centre * 26, w: 6 + rnd() * 4, d: 6 + rnd() * 4 });
      }
    return arr;
  }, []);

  useEffect(() => {
    const m = new THREE.Matrix4(), c = new THREE.Color();
    items.forEach((b, i) => {
      const y = terrainHeight(b.x, b.z);
      m.compose(new THREE.Vector3(b.x, y + b.h / 2, b.z), new THREE.Quaternion(), new THREE.Vector3(b.w, b.h, b.d));
      ref.current!.setMatrixAt(i, m);
      c.setHSL(0.08, 0.1, 0.55 + (i % 5) * 0.06);
      ref.current!.setColorAt(i, c);
    });
    ref.current!.instanceMatrix.needsUpdate = true;
    if (ref.current!.instanceColor) ref.current!.instanceColor.needsUpdate = true;
  }, [items]);

  return (
    <instancedMesh ref={ref} args={[undefined, undefined, items.length]} castShadow receiveShadow>
      <boxGeometry />
      {mode === "hologram" ? (
        <meshStandardMaterial color="#082f3a" emissive="#0891b2" emissiveIntensity={0.9} transparent opacity={0.35} />
      ) : (
        <meshStandardMaterial roughness={0.9} color={mode === "stress" ? "#4b5563" : "#ffffff"} />
      )}
    </instancedMesh>
  );
}

function SimpleAsset({ id, size, color }: { id: string; size: [number, number, number]; color: string }) {
  const a = ASSETS.find((x) => x.id === id)!;
  const select = useTwinStore((s) => s.select);
  const geo = useMemo(() => new THREE.BoxGeometry(...size), [size]);
  const y = terrainHeight(a.position[0], a.position[2]) + size[1] / 2;
  return (
    <group position={[a.position[0], y, a.position[2]]} onClick={(e) => { e.stopPropagation(); select(id); }}>
      <mesh geometry={geo} castShadow><TwinMaterial color={color} risk={a.risk} /></mesh>
      <HoloEdges geometry={geo} />
      {id === "civil" && (
        <mesh position={[0, size[1] / 2 + 0.2, 0]}>
          <boxGeometry args={[6, 0.3, 1.6]} /><meshBasicMaterial color="#ef4444" toneMapped={false} />
        </mesh>
      )}
    </group>
  );
}

/* ------------------------------------------------------------------ */
/* Sensor beacons with live labels                                     */
/* ------------------------------------------------------------------ */
const STATUS_COL = { online: "#2ee6a6", warning: "#ffb020", critical: "#ff3b4e" } as const;

function SensorBeacons() {
  const sensors = useTwinStore((s) => s.sensors);
  const group = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    group.current?.children.forEach((g, i) => {
      const halo = g.children[1];
      if (halo) halo.scale.setScalar(1 + ((clock.elapsedTime + i * 0.3) % 1.2));
    });
  });
  return (
    <group ref={group}>
      {sensors.map((s) => {
        const st = statusOf(s);
        const col = STATUS_COL[st];
        const p = s.id === "krishna-irwin" ? [s.position[0], gaugeToY(s.value) + 1, s.position[2]] : s.position;
        return (
          <group key={s.id} position={p as [number, number, number]}>
            <mesh><sphereGeometry args={[0.8, 16, 16]} /><meshBasicMaterial color={col} toneMapped={false} /></mesh>
            <mesh><sphereGeometry args={[1.1, 16, 16]} /><meshBasicMaterial color={col} transparent opacity={0.25} toneMapped={false} /></mesh>
            <mesh position={[0, 6, 0]}><cylinderGeometry args={[0.05, 0.05, 12]} /><meshBasicMaterial color={col} transparent opacity={0.6} toneMapped={false} /></mesh>
            <Html position={[0, 13, 0]} center distanceFactor={90} zIndexRange={[10, 0]}>
              <div className="pointer-events-none whitespace-nowrap rounded-md border px-2 py-1 font-mono text-[11px] backdrop-blur-md"
                style={{ borderColor: col, background: "rgba(2,10,20,0.72)", color: "#e6faff", boxShadow: `0 0 12px ${col}66` }}>
                <div style={{ color: col }}>● {s.name}</div>
                <div className="text-sm font-bold">{s.value} {s.unit}</div>
              </div>
            </Html>
          </group>
        );
      })}
    </group>
  );
}

/* ------------------------------------------------------------------ */
/* Hologram scan ring + asset risk halos                               */
/* ------------------------------------------------------------------ */
function ScanRing() {
  const mode = useTwinStore((s) => s.mode);
  const ref = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = (clock.elapsedTime * 0.25) % 1;
    ref.current.scale.setScalar(10 + t * 420);
    (ref.current.material as THREE.MeshBasicMaterial).opacity = 0.6 * (1 - t);
  });
  if (mode !== "hologram") return null;
  return (
    <mesh ref={ref} rotation-x={-Math.PI / 2} position={[0, 12, 0]}>
      <ringGeometry args={[0.98, 1, 128]} />
      <meshBasicMaterial color="#22d3ee" transparent toneMapped={false} side={THREE.DoubleSide} />
    </mesh>
  );
}

function RiskHalos() {
  const mode = useTwinStore((s) => s.mode);
  const selected = useTwinStore((s) => s.selected);
  if (mode === "realistic") return null;
  return (
    <>
      {ASSETS.map((a) => (
        <mesh key={a.id} rotation-x={-Math.PI / 2}
          position={[a.position[0], terrainHeight(a.position[0], a.position[2]) + 0.6, a.position[2]]}>
          <ringGeometry args={[a.id === "irwin" ? 92 : 20, a.id === "irwin" ? 95 : 22, 96]} />
          <meshBasicMaterial color={healthColor(a.risk)} transparent opacity={selected === a.id ? 0.9 : 0.35} toneMapped={false} />
        </mesh>
      ))}
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Cinematic camera presets                                            */
/* ------------------------------------------------------------------ */
const PRESETS: Record<string, [number, number, number, number, number, number]> = {
  overview: [260, 190, 300, 0, 0, 0],
  bridge: [70, 28, 85, 0, 4, 0],
  underside: [32, -1, 30, 0, 3, 0],
  dam: [-70, 70, 60, -150, 12, -70],
  city: [320, 110, 160, 170, 10, 0],
};

function CameraRig() {
  const ref = useRef<ComponentRef<typeof CameraControls>>(null);
  const target = useTwinStore((s) => s.cameraTarget);
  const { camera } = useThree();
  useEffect(() => {
    camera.position.set(600, 400, 700); // start far away -> fly-in
  }, [camera]);
  useEffect(() => {
    const p = PRESETS[target] ?? PRESETS["overview"]!;
    ref.current?.setLookAt(...p, true);
  }, [target]);
  return <CameraControls ref={ref} maxPolarAngle={Math.PI / 2.05} minDistance={8} maxDistance={900} smoothTime={0.9} />;
}

/* ------------------------------------------------------------------ */
export function World() {
  const mode = useTwinStore((s) => s.mode);
  const holo = mode === "hologram";
  return (
    <>
      <color attach="background" args={[holo ? "#01060c" : mode === "stress" ? "#0a0f18" : "#9ec9e6"]} />
      <fog attach="fog" args={[holo ? "#01060c" : mode === "stress" ? "#0a0f18" : "#bcd6e6", 250, 900]} />
      {mode === "realistic" ? <Sky sunPosition={[200, 60, 120]} turbidity={6} rayleigh={1.2} /> : <Stars radius={500} depth={80} count={4000} factor={6} fade />}
      <ambientLight intensity={holo ? 0.2 : 0.55} />
      <directionalLight position={[200, 260, 140]} intensity={holo ? 0.3 : 2.2} castShadow
        shadow-mapSize={[2048, 2048]} shadow-camera-left={-250} shadow-camera-right={250} shadow-camera-top={250} shadow-camera-bottom={-250} />
      <hemisphereLight args={["#cfe8ff", "#4a3b28", holo ? 0.1 : 0.5]} />

      <Terrain />
      <River />
      <IrwinBridge />
      <ChandoliDam />
      <City />
      <SimpleAsset id="civil" size={[22, 14, 14]} color="#e8e4dc" />
      <SimpleAsset id="substation" size={[18, 6, 12]} color="#7a828c" />
      <SensorBeacons />
      <RiskHalos />
      <ScanRing />
      <CameraRig />
    </>
  );
}
