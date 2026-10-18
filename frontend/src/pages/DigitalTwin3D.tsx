import { Suspense, useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import { EffectComposer, Bloom, Vignette } from "@react-three/postprocessing";
import { Loader } from "@react-three/drei";
import * as THREE from "three";
import { World } from "../features/digital-twin/scene/World";
import { TwinHUD } from "../features/digital-twin/TwinHUD";
import { useTwinStore } from "../features/digital-twin/useTwinStore";

function Effects() {
  const mode = useTwinStore((s) => s.mode);
  return (
    <EffectComposer multisampling={4}>
      <Bloom intensity={mode === "realistic" ? 0.35 : 1.4} luminanceThreshold={mode === "realistic" ? 0.85 : 0.2} mipmapBlur />
      <Vignette eskil={false} offset={0.2} darkness={0.75} />
    </EffectComposer>
  );
}

export default function DigitalTwin3D() {
  const tick = useTwinStore((s) => s.tick);
  const stepReplay = useTwinStore((s) => s.stepReplay);
  const replayIndex = useTwinStore((s) => s.replayIndex);

  // sensor simulator: Δt = 2 s (paper Eq. 1)
  useEffect(() => { const t = setInterval(tick, 2000); return () => clearInterval(t); }, [tick]);
  // 2019 flood replay: one "day" every 1.5 s
  useEffect(() => {
    if (replayIndex === null) return;
    tick();
    const t = setTimeout(stepReplay, 1500);
    return () => clearTimeout(t);
  }, [replayIndex, stepReplay, tick]);

  return (
    <div className="relative h-[calc(100vh-6.5rem)] w-full overflow-hidden rounded-xl bg-black">
      <Canvas shadows dpr={[1, 2]} camera={{ fov: 45, near: 0.5, far: 3000, position: [600, 400, 700] }}
        gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping }}>
        <Suspense fallback={null}>
          <World />
          <Effects />
        </Suspense>
      </Canvas>
      <Loader />
      <TwinHUD />
    </div>
  );
}
