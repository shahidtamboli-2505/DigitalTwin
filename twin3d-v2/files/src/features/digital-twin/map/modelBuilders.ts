import * as THREE from "three";

/**
 * Plain three.js builders for infrastructure models, in METRES.
 * Local frame: x = east, y = up, z = south.  Origin = asset location at ground.
 * Every mesh carries userData.baseColor and userData.risk so view modes can recolour it.
 * If /models/<id>.glb exists (photogrammetry / AI image-to-3D output) it replaces these.
 */

const mat = (color: string, risk: number, extra: Partial<THREE.MeshStandardMaterialParameters> = {}) => {
  const m = new THREE.MeshStandardMaterial({ color, roughness: 0.85, metalness: 0.05, ...extra });
  m.userData = { baseColor: color, risk };
  return m;
};
const box = (w: number, h: number, d: number, m: THREE.Material, x = 0, y = 0, z = 0) => {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m);
  mesh.position.set(x, y + h / 2, z);
  mesh.castShadow = mesh.receiveShadow = true;
  return mesh;
};

/* ------------------------- masonry arch bridge ------------------------- */
export function buildArchBridge(lengthM = 160, risk = 78) {
  const g = new THREE.Group();
  const spans = 7, spanW = lengthM / spans, width = 14, deck = 9, base = -8, r = spanW * 0.39;
  const spanRisk = [risk - 30, risk - 20, risk - 12, Math.min(99, risk + 14), risk - 8, risk - 18, risk - 32];
  for (let i = 0; i < spans; i++) {
    const w = spanW / 2, s = new THREE.Shape();
    s.moveTo(-w, base); s.lineTo(-w, deck); s.lineTo(w, deck); s.lineTo(w, base);
    s.lineTo(r, base); s.lineTo(r, 0.5); s.absarc(0, 0.5, r, 0, Math.PI, false); s.lineTo(-r, base); s.lineTo(-w, base);
    const geo = new THREE.ExtrudeGeometry(s, { depth: width - 2, bevelEnabled: false, curveSegments: 24 });
    geo.translate(-lengthM / 2 + spanW / 2 + i * spanW, 0, -(width - 2) / 2);
    const mesh = new THREE.Mesh(geo, mat("#b9a48a", spanRisk[i]));
    mesh.castShadow = mesh.receiveShadow = true;
    g.add(mesh);
  }
  g.add(box(lengthM, 0.3, width - 2.4, mat("#2b2d31", risk - 10), 0, deck, 0));
  g.add(box(lengthM, 1.2, 0.6, mat("#cdb89c", risk - 15), 0, deck, width / 2 - 0.7));
  g.add(box(lengthM, 1.2, 0.6, mat("#cdb89c", risk - 15), 0, deck, -width / 2 + 0.7));
  for (let i = 1; i < spans; i++) {               // cutwaters
    [width / 2, -width / 2].forEach((z) => {
      const c = new THREE.Mesh(new THREE.CylinderGeometry(2, 2, 12, 4), mat("#a8957c", spanRisk[i]));
      c.position.set(-lengthM / 2 + i * spanW, base + 6, z); c.rotation.y = Math.PI / 4; g.add(c);
    });
  }
  for (let i = 0; i <= spans; i++) {               // lamps
    [width / 2 - 0.7, -width / 2 + 0.7].forEach((z) => {
      const p = new THREE.Mesh(new THREE.SphereGeometry(0.4, 10, 10), new THREE.MeshBasicMaterial({ color: "#ffd27a" }));
      p.position.set(-lengthM / 2 + i * spanW, deck + 5, z); g.add(p);
    });
  }
  g.userData.crackPoint = new THREE.Vector3(-lengthM / 2 + 3.5 * spanW + 5, 3, width / 2 + 0.3);
  return g;
}

/* ----------------------------- gravity dam ----------------------------- */
export function buildDam(lengthM = 1200, risk = 40) {
  const g = new THREE.Group();
  const R = lengthM / 1.6, T = 14, H = 45, a0 = Math.PI * 0.3, a1 = Math.PI * 0.7;
  const s = new THREE.Shape();
  s.absarc(0, 0, R + T, a0, a1, false); s.absarc(0, 0, R, a1, a0, true);
  const geo = new THREE.ExtrudeGeometry(s, { depth: H, bevelEnabled: false, curveSegments: 64 });
  geo.rotateX(-Math.PI / 2); geo.translate(0, -5, R);
  const wall = new THREE.Mesh(geo, mat("#c8c3b8", risk)); wall.castShadow = true; g.add(wall);
  for (let i = -3; i <= 3; i++) {                  // spillway gates
    const gate = box(12, 6, 4, mat("#5b6470", risk), i * 18, H - 6, -2);
    g.add(gate);
    const jet = box(10, H - 2, 2, new THREE.MeshStandardMaterial({ color: "#e3f4fa", transparent: true, opacity: 0.6, emissive: "#9ad7ea", emissiveIntensity: 0.4 }), i * 18, -2, 3);
    jet.userData.jet = true; g.add(jet);
  }
  const lake = new THREE.Mesh(new THREE.CircleGeometry(R * 0.9, 64), new THREE.MeshStandardMaterial({ color: "#1d4e63", roughness: 0.1, transparent: true, opacity: 0.85 }));
  lake.rotation.x = -Math.PI / 2; lake.position.set(0, H - 8, -R * 0.95 - T); g.add(lake); // reservoir upstream (north)
  return g;
}

/* ------------------------------ buildings ------------------------------ */
export function buildHospital(risk = 30) {
  const g = new THREE.Group();
  g.add(box(60, 18, 26, mat("#e8e4dc", risk)));
  g.add(box(26, 24, 26, mat("#f1eee8", risk), 0, 0, -26));
  g.add(box(8, 1, 22, mat("#ef4444", 0, { emissive: "#ef4444", emissiveIntensity: 0.8 }), 0, 24, -26));
  g.add(box(22, 1, 8, mat("#ef4444", 0, { emissive: "#ef4444", emissiveIntensity: 0.8 }), 0, 24, -26));
  for (let i = -2; i <= 2; i++) g.add(box(6, 12, 0.3, mat("#7fb4d6", risk, { metalness: 0.6, roughness: 0.2 }), i * 11, 3, 13.1));
  return g;
}
export function buildCollege(risk = 22) {
  const g = new THREE.Group();
  g.add(box(80, 14, 20, mat("#d6b48a", risk)));
  g.add(box(16, 30, 16, mat("#c9a173", risk), 0, 0, 0));
  const dome = new THREE.Mesh(new THREE.SphereGeometry(7, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), mat("#e9e1d3", risk));
  dome.position.y = 30; g.add(dome);
  return g;
}
export function buildSubstation(risk = 38) {
  const g = new THREE.Group();
  g.add(box(70, 0.4, 50, mat("#6b7280", risk)));
  for (let i = 0; i < 4; i++) {
    g.add(box(8, 7, 6, mat("#4b5563", risk), -24 + i * 16, 0, -8));
    const tower = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 1.6, 22, 4), mat("#9ca3af", risk, { metalness: 0.7 }));
    tower.position.set(-24 + i * 16, 11, 14); g.add(tower);
  }
  return g;
}
export function buildWaterTank(risk = 42) {
  const g = new THREE.Group();
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    const col = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.8, 22, 8), mat("#9ca3af", risk));
    col.position.set(Math.cos(a) * 8, 11, Math.sin(a) * 8); g.add(col);
  }
  const tank = new THREE.Mesh(new THREE.CylinderGeometry(12, 9, 10, 32), mat("#d1d5db", risk));
  tank.position.y = 27; g.add(tank);
  return g;
}

export function buildModel(type: string, props: { risk: number; length_m?: number }) {
  switch (type) {
    case "bridge": return buildArchBridge(props.length_m ?? 160, props.risk);
    case "dam": return buildDam(props.length_m ?? 1200, props.risk);
    case "hospital": return buildHospital(props.risk);
    case "college": return buildCollege(props.risk);
    case "substation": return buildSubstation(props.risk);
    case "water": return buildWaterTank(props.risk);
    default: return buildHospital(props.risk);
  }
}

export const riskColor = (r: number) => (r >= 70 ? "#ff3b4e" : r >= 50 ? "#ffb020" : r >= 30 ? "#ffe066" : "#2ee6a6");

/** Recolour a model for the current view mode. */
export function applyMode(root: THREE.Object3D, mode: "realistic" | "hologram" | "stress", t = 0) {
  root.traverse((o) => {
    const m = (o as THREE.Mesh).material as THREE.MeshStandardMaterial | undefined;
    if (!m || !m.userData || m.userData.baseColor === undefined) return;
    const risk: number = m.userData.risk ?? 0;
    if (mode === "realistic") {
      m.color.set(m.userData.baseColor); m.emissive.set("#000000"); m.transparent = false; m.opacity = 1; m.wireframe = false;
    } else if (mode === "stress") {
      const c = riskColor(risk);
      m.color.set(c); m.emissive.set(c); m.transparent = false; m.opacity = 1; m.wireframe = false;
      m.emissiveIntensity = risk >= 70 ? 0.4 + 0.4 * Math.sin(t * 5) : 0.25;
    } else {
      m.color.set("#0b3d4f"); m.emissive.set("#22d3ee"); m.emissiveIntensity = 1 + 0.3 * Math.sin(t * 2);
      m.transparent = true; m.opacity = 0.45; m.wireframe = false;
    }
    if (m.userData.lastMode !== mode) { m.needsUpdate = true; m.userData.lastMode = mode; }
  });
}
