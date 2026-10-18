import * as THREE from "three";

/**
 * Procedural infrastructure models in METRES, with procedural PBR-style textures.
 * Local frame: x = long axis (aligned to asset bearing), y = up, z = across.
 * Origin = asset location at ground. Each mesh carries userData {baseColor, baseMap, risk}
 * so the view modes (satellite / hologram / health map) can restyle it.
 * A real model at /models/<id>.glb (photogrammetry or AI image-to-3D) replaces these.
 */

/* ============================ procedural textures ============================ */
const texCache: Record<string, THREE.CanvasTexture> = {};
function canvasTex(key: string, draw: (c: CanvasRenderingContext2D, s: number) => void, size = 512) {
  if (texCache[key]) return texCache[key];
  const cv = document.createElement("canvas");
  cv.width = cv.height = size;
  const ctx = cv.getContext("2d")!;
  draw(ctx, size);
  const t = new THREE.CanvasTexture(cv);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return (texCache[key] = t);
}
const noise = (ctx: CanvasRenderingContext2D, s: number, amt: number) => {
  const img = ctx.getImageData(0, 0, s, s);
  for (let i = 0; i < img.data.length; i += 4) {
    const n = (Math.random() - 0.5) * amt;
    img.data[i] += n; img.data[i + 1] += n; img.data[i + 2] += n;
  }
  ctx.putImageData(img, 0, 0);
};
/** ashlar masonry: staggered stone blocks + mortar + weathering */
const stoneTex = () => canvasTex("stone", (c, s) => {
  c.fillStyle = "#8f7f6a"; c.fillRect(0, 0, s, s);
  const rows = 8, h = s / rows;
  for (let r = 0; r < rows; r++) {
    let x = r % 2 ? -h * 0.8 : 0;
    while (x < s) {
      const w = h * (1.3 + Math.random() * 0.9);
      const l = 48 + Math.random() * 14;
      c.fillStyle = `hsl(32, ${14 + Math.random() * 10}%, ${l}%)`;
      c.fillRect(x + 2, r * h + 2, w - 4, h - 4);
      x += w;
    }
  }
  noise(c, s, 26);
  const g = c.createLinearGradient(0, 0, 0, s);           // rain streaks / damp base
  g.addColorStop(0, "rgba(0,0,0,0)"); g.addColorStop(1, "rgba(30,25,15,0.35)");
  c.fillStyle = g; c.fillRect(0, 0, s, s);
});
/** cast concrete with formwork lift lines */
const concreteTex = () => canvasTex("concrete", (c, s) => {
  c.fillStyle = "#b9b6ae"; c.fillRect(0, 0, s, s);
  noise(c, s, 22);
  c.strokeStyle = "rgba(60,60,60,0.25)"; c.lineWidth = 2;
  for (let y = 0; y < s; y += s / 6) { c.beginPath(); c.moveTo(0, y); c.lineTo(s, y); c.stroke(); }
  for (let x = 0; x < s; x += s / 4) { c.beginPath(); c.moveTo(x, 0); c.lineTo(x, s); c.stroke(); }
  for (let i = 0; i < 18; i++) {                             // seepage stains
    c.fillStyle = `rgba(70,65,50,${0.05 + Math.random() * 0.12})`;
    c.fillRect(Math.random() * s, Math.random() * s * 0.4, 6 + Math.random() * 14, s * (0.3 + Math.random() * 0.6));
  }
});
const asphaltTex = () => canvasTex("asphalt", (c, s) => {
  c.fillStyle = "#2e3034"; c.fillRect(0, 0, s, s); noise(c, s, 18);
  c.fillStyle = "#e9e3c8";
  for (let x = 0; x < s; x += s / 4) c.fillRect(x, s / 2 - 3, s / 8, 6);   // centre dashes
  c.fillRect(0, 10, s, 4); c.fillRect(0, s - 14, s, 4);                    // edge lines
});
/** facade: floors of windows, some lit */
const facadeTex = (base: string, key: string) => canvasTex(key, (c, s) => {
  c.fillStyle = base; c.fillRect(0, 0, s, s); noise(c, s, 12);
  const fl = 8, cols = 10, fh = s / fl, cw = s / cols;
  for (let f = 0; f < fl; f++)
    for (let k = 0; k < cols; k++) {
      c.fillStyle = Math.random() < 0.18 ? "#ffd98a" : "#3b5568";
      c.fillRect(k * cw + cw * 0.2, f * fh + fh * 0.25, cw * 0.6, fh * 0.5);
    }
});

/* =============================== helpers =============================== */
interface MatOpts extends Partial<THREE.MeshStandardMaterialParameters> { tex?: THREE.Texture; rep?: [number, number] }
const mat = (color: string, risk: number, o: MatOpts = {}) => {
  const { tex, rep, ...rest } = o;
  let map: THREE.Texture | null = null;
  if (tex) { map = tex.clone(); map.needsUpdate = true; map.repeat.set(...(rep ?? [1, 1])); }
  const m = new THREE.MeshStandardMaterial({ color, roughness: 0.88, metalness: 0.04, map, ...rest });
  m.userData = { baseColor: color, baseMap: map, risk, baseOpacity: rest.opacity ?? 1, baseTransparent: !!rest.transparent };
  return m;
};
const box = (w: number, h: number, d: number, m: THREE.Material, x = 0, y = 0, z = 0) => {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m);
  mesh.position.set(x, y + h / 2, z);
  mesh.castShadow = mesh.receiveShadow = true;
  return mesh;
};
const glow = (color: string) => new THREE.MeshBasicMaterial({ color });

/** cars / trucks that drive along x (animated in the layer via userData.vehicle) */
function addTraffic(g: THREE.Group, length: number, deckY: number, lanes: [number, number], n = 8) {
  const colors = ["#e11d48", "#f8fafc", "#2563eb", "#facc15", "#16a34a", "#0f172a", "#ea580c", "#64748b"];
  for (let i = 0; i < n; i++) {
    const truck = i % 4 === 0;
    const car = new THREE.Group();
    const body = box(truck ? 9 : 4.4, truck ? 3.2 : 1.4, 2.1, new THREE.MeshStandardMaterial({ color: colors[i % colors.length], metalness: 0.5, roughness: 0.35 }));
    car.add(body);
    if (!truck) car.add(box(2.4, 0.9, 1.9, new THREE.MeshStandardMaterial({ color: "#1e293b", metalness: 0.8, roughness: 0.1 }), -0.2, 1.4, 0));
    const dir = i % 2 ? 1 : -1;
    car.position.set(0, deckY + 0.2, dir > 0 ? lanes[0] : lanes[1]);
    car.userData.vehicle = { speed: dir * (9 + Math.random() * 7), offset: Math.random() * length, length };
    g.add(car);
  }
}

/* ===================== masonry arch bridge (Irwin type) ===================== */
export function buildArchBridge(lengthM = 160, risk = 78) {
  const g = new THREE.Group();
  const spans = 7, spanW = lengthM / spans, width = 14, deck = 10, base = -10, r = spanW * 0.4;
  const spanRisk = [risk - 30, risk - 20, risk - 12, Math.min(99, risk + 14), risk - 8, risk - 18, risk - 32];
  const stone = stoneTex();

  for (let i = 0; i < spans; i++) {
    const cx = -lengthM / 2 + spanW / 2 + i * spanW, w = spanW / 2;
    // spandrel + pier body
    const s = new THREE.Shape();
    s.moveTo(-w, base); s.lineTo(-w, deck); s.lineTo(w, deck); s.lineTo(w, base);
    s.lineTo(r, base); s.lineTo(r, 0.5); s.absarc(0, 0.5, r, 0, Math.PI, false); s.lineTo(-r, base); s.closePath();
    const geo = new THREE.ExtrudeGeometry(s, { depth: width - 2, bevelEnabled: false, curveSegments: 32 });
    geo.translate(cx, 0, -(width - 2) / 2);
    const body = new THREE.Mesh(geo, mat("#c9b79c", spanRisk[i], { tex: stone, rep: [0.12, 0.12] }));
    body.castShadow = body.receiveShadow = true; g.add(body);
    // voussoir arch ring, proud of both faces
    const ring = new THREE.Shape();
    ring.absarc(0, 0.5, r + 1.3, 0, Math.PI, false); ring.absarc(0, 0.5, r, Math.PI, 0, true);
    [width / 2 - 1, -width / 2 + 0.6].forEach((z) => {
      const rg = new THREE.ExtrudeGeometry(ring, { depth: 0.4, bevelEnabled: false, curveSegments: 32 });
      rg.translate(cx, 0, z);
      g.add(new THREE.Mesh(rg, mat("#a8927a", spanRisk[i], { tex: stone, rep: [0.3, 0.3] })));
    });
  }
  // piers: cutwaters + damp/water-stain band
  for (let i = 1; i < spans; i++) {
    const x = -lengthM / 2 + i * spanW;
    [width / 2, -width / 2].forEach((z) => {
      const cw = new THREE.Mesh(new THREE.CylinderGeometry(2.1, 2.3, 13, 4), mat("#9d8a72", spanRisk[i], { tex: stone, rep: [1, 2] }));
      cw.position.set(x, base + 6.5, z); cw.rotation.y = Math.PI / 4; cw.castShadow = true; g.add(cw);
      const cap = new THREE.Mesh(new THREE.ConeGeometry(2.3, 2.5, 4), mat("#8c7a63", spanRisk[i]));
      cap.position.set(x, base + 14.2, z); cap.rotation.y = Math.PI / 4; g.add(cap);
    });
    g.add(box(spanW * 0.2 + 1, 4, width + 0.2, mat("#4a3f33", spanRisk[i], { transparent: true, opacity: 0.55 }), x, base + 1, 0));
  }
  // deck: cornice, asphalt road, footpaths, parapets with balusters, lamps
  g.add(box(lengthM + 2, 0.8, width + 1.2, mat("#bfae94", risk - 15, { tex: stone, rep: [12, 1] }), 0, deck - 0.8, 0));
  g.add(box(lengthM, 0.25, width - 4.4, mat("#2b2d31", risk - 10, { tex: asphaltTex(), rep: [lengthM / 24, 1] }), 0, deck, 0));
  [width / 2 - 1.5, -width / 2 + 1.5].forEach((z) => g.add(box(lengthM, 0.45, 1.8, mat("#bdb6a8", risk - 20, { tex: concreteTex(), rep: [20, 1] }), 0, deck, z)));
  [width / 2 - 0.3, -width / 2 + 0.3].forEach((z) => {
    g.add(box(lengthM, 0.25, 0.6, mat("#d8c9ae", risk - 15), 0, deck + 1.15, z));              // coping
    g.add(box(lengthM, 0.3, 0.6, mat("#d8c9ae", risk - 15), 0, deck, z));                      // plinth
    for (let x = -lengthM / 2; x <= lengthM / 2; x += 1.1) {                                   // balusters
      const b = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.2, 0.85, 6), mat("#e2d6c0", risk - 15));
      b.position.set(x, deck + 0.72, z); g.add(b);
    }
  });
  for (let i = 0; i <= spans; i++) {
    [width / 2 - 0.3, -width / 2 + 0.3].forEach((z) => {
      const x = -lengthM / 2 + i * spanW;
      g.add(box(1, 1.6, 1, mat("#cbb99c", risk - 15, { tex: stone, rep: [0.5, 0.5] }), x, deck, z));
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.14, 5, 8), new THREE.MeshStandardMaterial({ color: "#2d3436", metalness: 0.7 }));
      pole.position.set(x, deck + 4, z); g.add(pole);
      const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.35, 12, 12), glow("#ffd27a"));
      lamp.position.set(x, deck + 6.6, z); g.add(lamp);
    });
  }
  // abutments / approach ramps
  [-1, 1].forEach((sgn) => {
    g.add(box(16, deck - base, width + 3, mat("#a3917a", risk - 35, { tex: stone, rep: [2, 2] }), sgn * (lengthM / 2 + 8), base, 0));
    g.add(box(30, 0.3, width - 4.4, mat("#2b2d31", 20, { tex: asphaltTex(), rep: [1.2, 1] }), sgn * (lengthM / 2 + 30), deck - 0.2, 0));
  });
  addTraffic(g, lengthM + 40, deck + 0.15, [2.2, -2.2], 8);
  g.userData.crackPoint = new THREE.Vector3(-lengthM / 2 + 3 * spanW + 2, 2, width / 2 + 0.5);
  return g;
}

/* ===================== concrete gravity dam with spillway ===================== */
export function buildDam(lengthM = 800, risk = 40) {
  const g = new THREE.Group();
  const H = 42, base = -12, crestW = 9, toeZ = 36, spillW = Math.min(140, lengthM * 0.2);
  const conc = concreteTex();

  // non-overflow sections: trapezoid profile (upstream vertical, downstream 0.8H:1V)
  const prof = new THREE.Shape();
  prof.moveTo(-crestW / 2, base); prof.lineTo(-crestW / 2, H); prof.lineTo(crestW / 2, H);
  prof.lineTo(crestW / 2, H - 6); prof.lineTo(toeZ, base); prof.closePath();
  const side = (lengthM - spillW) / 2;
  [-1, 1].forEach((sgn) => {
    const geo = new THREE.ExtrudeGeometry(prof, { depth: side, bevelEnabled: false });
    geo.rotateY(Math.PI / 2);                    // extrude along +x
    geo.translate(sgn > 0 ? spillW / 2 : -lengthM / 2, 0, 0);
    const m = new THREE.Mesh(geo, mat("#c4c0b6", risk, { tex: conc, rep: [0.05, 0.06] }));
    m.castShadow = m.receiveShadow = true; g.add(m);
  });

  // ogee spillway: crest lower, curved chute, flip bucket
  const og = new THREE.Shape();
  og.moveTo(-crestW / 2, base); og.lineTo(-crestW / 2, H - 9);
  og.quadraticCurveTo(2, H - 6.5, 7, H - 11);
  og.quadraticCurveTo(20, 6, toeZ - 4, base + 6);
  og.quadraticCurveTo(toeZ + 2, base + 4, toeZ + 4, base + 9);
  og.lineTo(toeZ + 4, base); og.closePath();
  const ogGeo = new THREE.ExtrudeGeometry(og, { depth: spillW, bevelEnabled: false, curveSegments: 24 });
  ogGeo.rotateY(Math.PI / 2); ogGeo.translate(-spillW / 2, 0, 0);
  const ogM = new THREE.Mesh(ogGeo, mat("#b3afa5", risk + 5, { tex: conc, rep: [0.05, 0.06] }));
  ogM.castShadow = ogM.receiveShadow = true; g.add(ogM);

  // gate piers, radial gates, service bridge, hoist rooms
  const nGates = Math.max(4, Math.round(spillW / 16)), bay = spillW / nGates;
  for (let i = 0; i <= nGates; i++) {
    const x = -spillW / 2 + i * bay;
    g.add(box(2.6, H + 4 - (H - 14), 16, mat("#cfcbc2", risk, { tex: conc, rep: [0.3, 1] }), x, H - 14, 2));
    if (i < nGates) {
      const gate = new THREE.Mesh(new THREE.CylinderGeometry(9, 9, bay - 2.8, 24, 1, true, Math.PI * 0.85, Math.PI * 0.3),
        mat("#3f5f7a", risk + 10, { metalness: 0.75, roughness: 0.35, side: THREE.DoubleSide }));
      gate.rotation.z = Math.PI / 2; gate.position.set(x + bay / 2, H - 6, 4); g.add(gate);
      g.add(box(bay - 3, 3.2, 4, mat("#e5e2da", risk), x + bay / 2, H + 4, -1));             // hoist room
      // overflowing water sheet down the chute (animated)
      const sheet = new THREE.Mesh(new THREE.PlaneGeometry(bay - 3.2, 45, 1, 8),
        new THREE.MeshStandardMaterial({ color: "#e8f6fb", emissive: "#a6dcef", emissiveIntensity: 0.35, transparent: true, opacity: 0.55, side: THREE.DoubleSide }));
      sheet.position.set(x + bay / 2, 13.5, 20); sheet.rotation.x = -Math.atan2(25, 37); // lies on the chute slope
      sheet.userData.jet = true; g.add(sheet);
    }
  }
  g.add(box(spillW, 1, 7, mat("#d6d2c9", risk), 0, H + 3.2, 2));
  // splash/foam at the toe
  const foam = new THREE.Mesh(new THREE.CircleGeometry(spillW * 0.45, 40), new THREE.MeshStandardMaterial({ color: "#f1fbff", transparent: true, opacity: 0.6, emissive: "#cfefff", emissiveIntensity: 0.2 }));
  foam.rotation.x = -Math.PI / 2; foam.position.set(0, base + 9.5, toeZ + 30); foam.userData.jet = true; g.add(foam);

  // crest road, parapets, lamps along the whole dam
  g.add(box(lengthM, 0.3, 6, mat("#2b2d31", 20, { tex: asphaltTex(), rep: [lengthM / 30, 1] }), 0, H, 0));
  [-crestW / 2 + 0.3, crestW / 2 - 0.3].forEach((z) => g.add(box(lengthM, 1.1, 0.5, mat("#dedad2", risk), 0, H, z)));
  for (let x = -lengthM / 2 + 10; x < lengthM / 2; x += 40) {
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.15, 6, 8), new THREE.MeshStandardMaterial({ color: "#333" }));
    pole.position.set(x, H + 3, crestW / 2 - 0.3); g.add(pole);
    const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.4, 10, 10), glow("#ffe2a0"));
    lamp.position.set(x, H + 6, crestW / 2 - 0.3); g.add(lamp);
  }
  // intake tower with access bridge (upstream)
  const tower = new THREE.Mesh(new THREE.CylinderGeometry(6, 7, H + 12, 24), mat("#c9c5bc", risk - 5, { tex: conc, rep: [2, 1] }));
  tower.position.set(-spillW / 2 - 60, base + (H + 12) / 2, -32); tower.castShadow = true; g.add(tower);
  g.add(box(4, 1, 30, mat("#d2cec6", risk - 5), -spillW / 2 - 60, H, -17));
  g.add(box(10, 4, 10, mat("#e6e2da", 10), -spillW / 2 - 60, H + 0, -32));
  // control building + power house at the toe
  g.add(box(36, 12, 18, mat("#d9d4c8", 25, { tex: facadeTex("#cfc8b8", "facade-dam"), rep: [3, 1] }), lengthM / 2 - 60, base + 9, toeZ + 24));
  g.add(box(28, 16, 20, mat("#bfc4c9", 30, { tex: conc, rep: [1, 1] }), -spillW / 2 - 40, base + 9, toeZ + 14));
  addTraffic(g, lengthM, H + 0.15, [1.4, -1.4], 4);
  return g;
}

/* =============================== buildings =============================== */
export function buildHospital(risk = 30) {
  const g = new THREE.Group();
  const fac = facadeTex("#ece7de", "facade-hosp");
  g.add(box(64, 20, 24, mat("#f1ede6", risk, { tex: fac, rep: [3, 1] })));
  g.add(box(28, 30, 28, mat("#f6f3ee", risk, { tex: fac, rep: [1.5, 1.4] }), 0, 0, -26));
  g.add(box(18, 10, 22, mat("#e7e2d8", risk, { tex: fac, rep: [1, 0.5] }), 34, 0, 8));
  // red cross + rooftop helipad
  g.add(box(8, 1, 22, mat("#ef4444", 0, { emissive: "#ef4444", emissiveIntensity: 0.6 }), -18, 20, 0));
  g.add(box(22, 1, 8, mat("#ef4444", 0, { emissive: "#ef4444", emissiveIntensity: 0.6 }), -18, 20, 0));
  const pad = new THREE.Mesh(new THREE.CylinderGeometry(10, 10, 0.6, 40), mat("#3f4450", 10));
  pad.position.set(0, 30.3, -26); g.add(pad);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(8.5, 0.35, 8, 48), glow("#facc15"));
  ring.rotation.x = Math.PI / 2; ring.position.set(0, 30.7, -26); g.add(ring);
  g.add(box(1.2, 0.2, 7, glow("#f8fafc"), -2.2, 30.6, -26)); g.add(box(1.2, 0.2, 7, glow("#f8fafc"), 2.2, 30.6, -26)); g.add(box(4.4, 0.2, 1.2, glow("#f8fafc"), 0, 30.6, -26));
  // ambulance bay canopy
  g.add(box(20, 0.8, 10, mat("#94a3b8", risk), 0, 5, 18));
  [-9, 9].forEach((x) => g.add(box(0.6, 5, 0.6, mat("#64748b", risk), x, 0, 22)));
  return g;
}
export function buildCollege(risk = 22) {
  const g = new THREE.Group();
  const stone = stoneTex();
  g.add(box(90, 14, 20, mat("#d8b98f", risk, { tex: stone, rep: [6, 1.2] })));
  [-45, 45].forEach((x) => g.add(box(18, 18, 40, mat("#d1b086", risk, { tex: stone, rep: [1.5, 1.5] }), x, 0, 10)));
  g.add(box(18, 32, 18, mat("#c9a173", risk, { tex: stone, rep: [1.4, 2.4] })));
  const dome = new THREE.Mesh(new THREE.SphereGeometry(8, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2), mat("#ece4d6", risk));
  dome.position.y = 32; g.add(dome);
  for (let x = -40; x <= 40; x += 6) {                     // colonnade
    const c = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.7, 10, 12), mat("#efe7d8", risk));
    c.position.set(x, 5, 11); g.add(c);
  }
  return g;
}
export function buildSubstation(risk = 38) {
  const g = new THREE.Group();
  g.add(box(80, 0.4, 56, mat("#7b8088", risk, { tex: concreteTex(), rep: [6, 4] })));
  for (let i = 0; i < 4; i++) {
    const x = -27 + i * 18;
    g.add(box(9, 7, 6, mat("#556070", risk, { metalness: 0.4 }), x, 0, -10));
    for (let f = -1; f <= 1; f += 2) g.add(box(0.6, 6, 5, mat("#3c4450", risk), x + f * 5, 0, -10)); // radiator fins
    // lattice tower
    const t = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 2.2, 26, 4, 6, true), mat("#a3abb5", risk, { metalness: 0.8, wireframe: true }));
    t.position.set(x, 13, 16); g.add(t);
    g.add(box(10, 0.4, 0.4, mat("#a3abb5", risk, { metalness: 0.8 }), x, 22, 16));
  }
  g.add(box(80, 2.2, 0.2, mat("#9ca3af", 10, { transparent: true, opacity: 0.4 }), 0, 0, 28)); // fence
  return g;
}
export function buildWaterTank(risk = 42) {
  const g = new THREE.Group();
  const conc = concreteTex();
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    const col = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.9, 24, 10), mat("#bdb9b0", risk, { tex: conc, rep: [0.3, 2] }));
    col.position.set(Math.cos(a) * 9, 12, Math.sin(a) * 9); g.add(col);
  }
  [8, 16].forEach((y) => { const ring = new THREE.Mesh(new THREE.TorusGeometry(9, 0.4, 6, 32), mat("#bdb9b0", risk)); ring.rotation.x = Math.PI / 2; ring.position.y = y; g.add(ring); });
  const tank = new THREE.Mesh(new THREE.CylinderGeometry(13, 9, 11, 40), mat("#d4d1ca", risk, { tex: conc, rep: [3, 1] }));
  tank.position.y = 29.5; g.add(tank);
  const roof = new THREE.Mesh(new THREE.ConeGeometry(13.4, 3, 40), mat("#a8a49b", risk));
  roof.position.y = 36.5; g.add(roof);
  // treatment basins
  [-36, -60].forEach((x) => {
    g.add(box(18, 3, 18, mat("#c7c3ba", risk, { tex: conc }), x, 0, 0));
    g.add(box(16, 0.2, 16, new THREE.MeshStandardMaterial({ color: "#2f6f80", roughness: 0.1 }), x, 2.9, 0));
  });
  return g;
}

export function buildModel(type: string, props: { risk: number; length_m?: number }) {
  switch (type) {
    case "bridge": return buildArchBridge(props.length_m ?? 160, props.risk);
    case "dam": return buildDam(props.length_m ?? 800, props.risk);
    case "hospital": return buildHospital(props.risk);
    case "college": return buildCollege(props.risk);
    case "substation": return buildSubstation(props.risk);
    case "water": return buildWaterTank(props.risk);
    default: return buildHospital(props.risk);
  }
}

export const riskColor = (r: number) => (r >= 70 ? "#ff3b4e" : r >= 50 ? "#ffb020" : r >= 30 ? "#ffe066" : "#2ee6a6");

/** Restyle a model for the current view mode. */
export function applyMode(root: THREE.Object3D, mode: "realistic" | "hologram" | "stress", t = 0) {
  root.traverse((o) => {
    const m = (o as THREE.Mesh).material as THREE.MeshStandardMaterial | undefined;
    if (!m || !m.userData || m.userData.baseColor === undefined) return;
    const risk: number = m.userData.risk ?? 0;
    const changed = m.userData.lastMode !== mode;
    if (mode === "realistic") {
      if (changed) { m.color.set(m.userData.baseColor); m.map = m.userData.baseMap ?? null; m.emissive.set("#000000"); m.transparent = m.userData.baseTransparent; m.opacity = m.userData.baseOpacity; }
    } else if (mode === "stress") {
      if (changed) { const c = riskColor(risk); m.color.set(c); m.emissive.set(c); m.map = null; m.transparent = m.userData.baseTransparent; m.opacity = m.userData.baseOpacity; }
      m.emissiveIntensity = risk >= 70 ? 0.45 + 0.4 * Math.sin(t * 5) : 0.25;
    } else {
      if (changed) { m.color.set("#0b3d4f"); m.emissive.set("#22d3ee"); m.map = null; m.transparent = true; m.opacity = 0.45; }
      m.emissiveIntensity = 1 + 0.3 * Math.sin(t * 2);
    }
    if (changed) { m.needsUpdate = true; m.userData.lastMode = mode; }
  });
}
