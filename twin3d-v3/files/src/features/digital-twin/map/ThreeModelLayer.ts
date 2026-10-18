import maplibregl from "maplibre-gl";
import type { CustomLayerInterface, Map as MLMap } from "maplibre-gl";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { buildModel, applyMode } from "./modelBuilders";

export interface AssetFeature {
  id: string; name: string; type: string; risk: number; bearing?: number; length_m?: number;
  lng: number; lat: number;
}
type Mode = "realistic" | "hologram" | "stress";

interface Placed { asset: AssetFeature; scene: THREE.Scene; root: THREE.Group; crack?: THREE.Mesh }

/**
 * MapLibre custom layer that draws real-scale three.js infrastructure models
 * at their true lat/lon on top of satellite imagery + terrain.
 */
export function createThreeModelLayer(assets: AssetFeature[], getMode: () => Mode): CustomLayerInterface {
  let map: MLMap;
  let renderer: THREE.WebGLRenderer;
  const camera = new THREE.Camera();
  const placed: Placed[] = [];
  const clock = new THREE.Clock();
  const loader = new GLTFLoader();

  const makeScene = () => {
    const scene = new THREE.Scene();
    scene.add(new THREE.AmbientLight(0xffffff, 0.9));
    const sun = new THREE.DirectionalLight(0xffffff, 2.2); sun.position.set(200, 400, 150); scene.add(sun);
    scene.add(new THREE.HemisphereLight(0xcfe8ff, 0x4a3b28, 0.6));
    return scene;
  };

  return {
    id: "infrastructure-3d-models",
    type: "custom",
    renderingMode: "3d",

    onAdd(m: MLMap, gl: WebGLRenderingContext | WebGL2RenderingContext) {
      map = m;
      renderer = new THREE.WebGLRenderer({ canvas: map.getCanvas(), context: gl as WebGL2RenderingContext, antialias: true });
      renderer.autoClear = false;

      for (const a of assets) {
        const scene = makeScene();
        const root = buildModel(a.type, { risk: a.risk, length_m: a.length_m });
        scene.add(root);
        let crack: THREE.Mesh | undefined;
        if (root.userData.crackPoint) {
          crack = new THREE.Mesh(new THREE.SphereGeometry(1.6, 16, 16), new THREE.MeshBasicMaterial({ color: "#ff3b4e", transparent: true }));
          crack.position.copy(root.userData.crackPoint); scene.add(crack);
        }
        placed.push({ asset: a, scene, root, crack });

        // Real model override: drop public/models/<id>.glb (photogrammetry / AI image-to-3D, metres, Y-up)
        fetch(`/models/${a.id}.glb`, { method: "HEAD" }).then((r) => {
          if (!r.ok || !(r.headers.get("content-type") ?? "").match(/gltf|octet|model/)) return;
          loader.load(`/models/${a.id}.glb`, (gltf) => {
            gltf.scene.traverse((o) => {
              const mesh = o as THREE.Mesh;
              if (mesh.isMesh) {
                const old = mesh.material as THREE.MeshStandardMaterial;
                const nm = old.clone(); nm.userData = { baseColor: "#" + old.color.getHexString(), baseMap: old.map, risk: a.risk, baseOpacity: old.opacity, baseTransparent: old.transparent }; mesh.material = nm;
              }
            });
            root.clear(); root.add(gltf.scene); map.triggerRepaint();
          });
        }).catch(() => undefined);
      }
    },

    render(_gl: unknown, options: any) {
      const main: number[] = options?.defaultProjectionData?.mainMatrix ?? options;
      const t = clock.getElapsedTime();
      const mode = getMode();
      const mainM = new THREE.Matrix4().fromArray(main as number[]);

      for (const p of placed) {
        const { asset } = p;
        const elev = (map.queryTerrainElevation?.([asset.lng, asset.lat]) as number | null) ?? 0;
        const mc = maplibregl.MercatorCoordinate.fromLngLat([asset.lng, asset.lat], elev);
        const s = mc.meterInMercatorCoordinateUnits();
        const modelM = new THREE.Matrix4()
          .makeTranslation(mc.x, mc.y, mc.z as number)
          .scale(new THREE.Vector3(s, -s, s))
          .multiply(new THREE.Matrix4().makeRotationX(Math.PI / 2))
          .multiply(new THREE.Matrix4().makeRotationY(((90 - (asset.bearing ?? 90)) * Math.PI) / 180));
        camera.projectionMatrix = mainM.clone().multiply(modelM);

        applyMode(p.root, mode, t);
        p.root.traverse((o) => {
          if (o.userData.jet) ((o as THREE.Mesh).material as THREE.MeshStandardMaterial).opacity = 0.45 + 0.15 * Math.sin(t * 9 + o.position.x);
          const v = o.userData.vehicle;
          if (v) o.position.x = ((((t * v.speed + v.offset) % v.length) + v.length) % v.length) - v.length / 2;
        });
        if (p.crack) {
          const k = (t * 0.8) % 1;
          p.crack.scale.setScalar(1 + k * 2.5);
          (p.crack.material as THREE.MeshBasicMaterial).opacity = 1 - k;
        }
        renderer.resetState();
        renderer.render(p.scene, camera);
      }
      map.triggerRepaint(); // keep animating
    },
  };
}
