import * as THREE from 'three';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Polyfill FileReader for Node.js
class FileReaderPolyfill {
  readAsArrayBuffer(blob) {
    blob.arrayBuffer().then((buf) => {
      this.result = buf;
      if (this.onloadend) this.onloadend();
      if (this.onload) this.onload({ target: this });
    });
  }
}
globalThis.FileReader = FileReaderPolyfill;

const outputDir = path.resolve(__dirname, '../apps/web/public/assets/models');
fs.mkdirSync(outputDir, { recursive: true });

function exportGLB(scene, outputPath) {
  return new Promise((resolve, reject) => {
    const exporter = new GLTFExporter();
    exporter.parse(
      scene,
      (glb) => {
        fs.writeFileSync(outputPath, Buffer.from(glb));
        console.log(`Generated: ${outputPath} (${(fs.statSync(outputPath).size / 1024).toFixed(1)} KB)`);
        resolve(outputPath);
      },
      (err) => reject(err),
      { binary: true }
    );
  });
}

// 1. Dragon Bridge (Cầu Rồng) Model
// Orientation: along X axis (-300m to +300m), width along Z (-18m to +18m), height along Y (0 to 45m)
async function generateDragonBridge() {
  const scene = new THREE.Scene();
  scene.name = 'DragonBridge';

  // Materials
  const deckMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.8 }); // Slate-600 road
  const dragonGoldMat = new THREE.MeshStandardMaterial({
    color: 0xf59e0b, // Amber-500 golden yellow
    metalness: 0.65,
    roughness: 0.35,
  });
  const dragonRedMat = new THREE.MeshStandardMaterial({
    color: 0xef4444, // Red crest & eye
    roughness: 0.4,
  });
  const pierMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.9 }); // Light gray concrete

  // Bridge Deck: length 500m, width 32m, thickness 3m
  const deckGeo = new THREE.BoxGeometry(500, 3, 32);
  const deckMesh = new THREE.Mesh(deckGeo, deckMat);
  deckMesh.position.set(0, 10, 0); // elevated 10m above water
  scene.add(deckMesh);

  // Concrete Piers under the deck
  for (let x = -200; x <= 200; x += 100) {
    const pierGeo = new THREE.CylinderGeometry(5, 7, 12, 12);
    const pierMesh = new THREE.Mesh(pierGeo, pierMat);
    pierMesh.position.set(x, 5, 0);
    scene.add(pierMesh);
  }

  // Dragon Body: Undulating sine curve along X axis
  const points = [];
  const span = 420;
  for (let i = 0; i <= 60; i++) {
    const t = i / 60;
    const x = -span / 2 + t * span;
    // 3 arches undulating
    const archY = Math.sin(t * Math.PI * 3) * 24 + 18;
    points.push(new THREE.Vector3(x, Math.max(10, archY), 0));
  }

  const dragonPath = new THREE.CatmullRomCurve3(points);
  const bodyGeo = new THREE.TubeGeometry(dragonPath, 64, 4, 12, false);
  const bodyMesh = new THREE.Mesh(bodyGeo, dragonGoldMat);
  scene.add(bodyMesh);

  // Arch vertical hanger cables
  for (let x = -190; x <= 190; x += 15) {
    const t = (x + span / 2) / span;
    const archY = Math.sin(t * Math.PI * 3) * 24 + 18;
    if (archY > 12) {
      const cableGeo = new THREE.CylinderGeometry(0.3, 0.3, archY - 11, 6);
      const cableL = new THREE.Mesh(cableGeo, dragonGoldMat);
      cableL.position.set(x, (archY + 11) / 2, -10);
      scene.add(cableL);

      const cableR = new THREE.Mesh(cableGeo, dragonGoldMat);
      cableR.position.set(x, (archY + 11) / 2, 10);
      scene.add(cableR);
    }
  }

  // Dragon Head (East side: x = +210)
  const headGroup = new THREE.Group();
  headGroup.position.set(215, 26, 0);

  const headGeo = new THREE.ConeGeometry(9, 22, 8);
  headGeo.rotateZ(-Math.PI / 2);
  const headMesh = new THREE.Mesh(headGeo, dragonGoldMat);
  headGroup.add(headMesh);

  // Dragon Eyes (glowing ruby)
  const eyeGeo = new THREE.SphereGeometry(1.8, 8, 8);
  const eyeL = new THREE.Mesh(eyeGeo, dragonRedMat);
  eyeL.position.set(4, 3, 5);
  const eyeR = new THREE.Mesh(eyeGeo, dragonRedMat);
  eyeR.position.set(4, 3, -5);
  headGroup.add(eyeL, eyeR);

  // Dragon Crest / Horns
  const hornGeo = new THREE.ConeGeometry(2, 10, 6);
  hornGeo.rotateZ(-Math.PI / 4);
  const hornMesh = new THREE.Mesh(hornGeo, dragonRedMat);
  hornMesh.position.set(-6, 8, 0);
  headGroup.add(hornMesh);

  scene.add(headGroup);

  // Dragon Tail (West side: x = -215)
  const tailGeo = new THREE.ConeGeometry(5, 18, 6);
  tailGeo.rotateZ(Math.PI / 2);
  const tailMesh = new THREE.Mesh(tailGeo, dragonGoldMat);
  tailMesh.position.set(-218, 14, 0);
  scene.add(tailMesh);

  return exportGLB(scene, path.join(outputDir, 'dragon_bridge.glb'));
}

// 2. Han River Swing Bridge (Cầu Sông Hàn) Model
async function generateHanBridge() {
  const scene = new THREE.Scene();
  scene.name = 'HanRiverBridge';

  const deckMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.8 });
  const towerMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.3 }); // White tower
  const cableMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.8 });

  // Bridge Deck: 480m x 22m x 2.5m
  const deckMesh = new THREE.Mesh(new THREE.BoxGeometry(480, 2.5, 22), deckMat);
  deckMesh.position.set(0, 9, 0);
  scene.add(deckMesh);

  // Central Rotating Island Pier
  const centerPier = new THREE.Mesh(new THREE.CylinderGeometry(18, 20, 10, 24), towerMat);
  centerPier.position.set(0, 5, 0);
  scene.add(centerPier);

  // Central Dual Cable Towers (A-frame / diamond)
  const towerHeight = 42;
  const towerGeo = new THREE.BoxGeometry(4, towerHeight, 3);
  const towerL = new THREE.Mesh(towerGeo, towerMat);
  towerL.position.set(0, towerHeight / 2 + 8, -9);
  const towerR = new THREE.Mesh(towerGeo, towerMat);
  towerR.position.set(0, towerHeight / 2 + 8, 9);
  scene.add(towerL, towerR);

  // Top crossbeam
  const beam = new THREE.Mesh(new THREE.BoxGeometry(4, 3, 20), towerMat);
  beam.position.set(0, towerHeight + 7, 0);
  scene.add(beam);

  // Stay Cables
  for (let x = -80; x <= 80; x += 20) {
    if (Math.abs(x) < 10) continue;
    const len = Math.sqrt(x * x + 35 * 35);
    const cableGeo = new THREE.CylinderGeometry(0.2, 0.2, len, 6);
    const angle = Math.atan2(x, 35);

    const cL = new THREE.Mesh(cableGeo, cableMat);
    cL.position.set(x / 2, 28, -9);
    cL.rotation.z = -angle;
    scene.add(cL);

    const cR = new THREE.Mesh(cableGeo, cableMat);
    cR.position.set(x / 2, 28, 9);
    cR.rotation.z = -angle;
    scene.add(cR);
  }

  return exportGLB(scene, path.join(outputDir, 'han_bridge.glb'));
}

// 3. APEC Park Flying Kite Pavilion (Công viên APEC)
async function generateApecPark() {
  const scene = new THREE.Scene();
  scene.name = 'ApecParkPavilion';

  const lawnMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.9 }); // Emerald green grass
  const domeMat = new THREE.MeshStandardMaterial({
    color: 0xf8fafc, // White steel canopy
    roughness: 0.2,
    metalness: 0.3,
  });
  const glassMat = new THREE.MeshStandardMaterial({
    color: 0x38bdf8,
    transparent: true,
    opacity: 0.6,
    roughness: 0.1,
  });

  // Base Landscaped Hill/Pedestal (60m x 45m x 4m)
  const baseMesh = new THREE.Mesh(new THREE.CylinderGeometry(35, 42, 4, 32), lawnMat);
  baseMesh.position.set(0, 2, 0);
  scene.add(baseMesh);

  // Curved Wave Canopy / Flying Kite Dome
  const domeGeo = new THREE.SphereGeometry(24, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2.3);
  domeGeo.scale(1.4, 0.6, 0.9);
  const domeMesh = new THREE.Mesh(domeGeo, domeMat);
  domeMesh.position.set(0, 4, 0);
  scene.add(domeMesh);

  // Inner skylight
  const skylight = new THREE.Mesh(new THREE.TorusGeometry(12, 1.5, 12, 32), glassMat);
  skylight.rotation.x = Math.PI / 2;
  skylight.position.set(0, 16, 0);
  scene.add(skylight);

  return exportGLB(scene, path.join(outputDir, 'apec_park.glb'));
}

// 4. Da Nang Cathedral — Nhà thờ Chính tòa (Nhà thờ Con Gà)
// Pink-painted Gothic church, 70m tall tower with rooster weather vane
async function generateDaNangCathedral() {
  const scene = new THREE.Scene();
  scene.name = 'DaNangCathedral';

  const pinkMat = new THREE.MeshStandardMaterial({ color: 0xfba4b4, roughness: 0.7 }); // Signature dusty rose-pink
  const grayMat = new THREE.MeshStandardMaterial({ color: 0xd1d5db, roughness: 0.6 }); // Stone trim
  const roofMat = new THREE.MeshStandardMaterial({ color: 0x6b7280, roughness: 0.5 }); // Slate roof
  const glassMat = new THREE.MeshStandardMaterial({ color: 0x93c5fd, transparent: true, opacity: 0.55, roughness: 0.1 });
  const goldMat = new THREE.MeshStandardMaterial({ color: 0xfbbf24, metalness: 0.8, roughness: 0.2 });

  // --- Nave (main hall body): 24m wide × 14m deep × 14m tall ---
  const naveMesh = new THREE.Mesh(new THREE.BoxGeometry(24, 14, 14), pinkMat);
  naveMesh.position.set(0, 7, 0);
  scene.add(naveMesh);

  // Nave pitched roof (triangular prism via cylinder trick)
  const naveRoofGeo = new THREE.CylinderGeometry(0, 14.5, 6, 4);
  naveRoofGeo.rotateY(Math.PI / 4);
  const naveRoof = new THREE.Mesh(naveRoofGeo, roofMat);
  naveRoof.position.set(0, 17, 0);
  scene.add(naveRoof);

  // --- Side aisles (narrower, flanking the nave) ---
  for (const zOff of [-11, 11]) {
    const aisle = new THREE.Mesh(new THREE.BoxGeometry(22, 9, 6), pinkMat);
    aisle.position.set(0, 4.5, zOff);
    scene.add(aisle);

    const aisleRoofGeo = new THREE.CylinderGeometry(0, 12, 4, 4);
    aisleRoofGeo.rotateY(Math.PI / 4);
    const aisleRoof = new THREE.Mesh(aisleRoofGeo, roofMat);
    aisleRoof.position.set(0, 11, zOff);
    scene.add(aisleRoof);
  }

  // --- Main bell tower (front/west): 7m × 7m, height 50m ---
  const tower = new THREE.Mesh(new THREE.BoxGeometry(7, 50, 7), pinkMat);
  tower.position.set(-14.5, 25, 0);
  scene.add(tower);

  // Tower stone corner trim
  for (const [zOff, xOff] of [[-3.7, 0.3], [3.7, 0.3], [-3.7, -0.3], [3.7, -0.3]]) {
    const trim = new THREE.Mesh(new THREE.BoxGeometry(1.2, 52, 1.2), grayMat);
    trim.position.set(-14.5 + xOff, 25, zOff);
    scene.add(trim);
  }

  // Tower Gothic spire
  const spireGeo = new THREE.ConeGeometry(4, 22, 8);
  const spire = new THREE.Mesh(spireGeo, roofMat);
  spire.position.set(-14.5, 61, 0);
  scene.add(spire);

  // Rooster weather vane on top (Con Gà)
  const roostersphere = new THREE.Mesh(new THREE.SphereGeometry(0.8, 8, 8), goldMat);
  roostersphere.position.set(-14.5, 72.8, 0);
  scene.add(roostersphere);

  const roosterBody = new THREE.Mesh(new THREE.SphereGeometry(1.1, 8, 6), goldMat);
  roosterBody.scale.set(1.2, 0.9, 0.7);
  roosterBody.position.set(-14.5, 74.5, 0);
  scene.add(roosterBody);

  const roosterTail = new THREE.Mesh(new THREE.ConeGeometry(0.5, 2.5, 6), goldMat);
  roosterTail.rotation.z = Math.PI / 2;
  roosterTail.position.set(-15.8, 74.5, 0);
  scene.add(roosterTail);

  // Cross on spire tip
  const crossV = new THREE.Mesh(new THREE.BoxGeometry(0.3, 3.5, 0.3), goldMat);
  crossV.position.set(-14.5, 73.5, 0);
  scene.add(crossV);
  const crossH = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.3, 2.2), goldMat);
  crossH.position.set(-14.5, 74.5, 0);
  scene.add(crossH);

  // --- Gothic arched windows (simplified as colored panels) ---
  for (const xOff of [-6, 0, 6]) {
    // Front facade windows
    const win = new THREE.Mesh(new THREE.BoxGeometry(2.5, 5, 0.3), glassMat);
    win.position.set(xOff, 10, -7.15);
    scene.add(win);
  }

  // Large rose window on front facade
  const roseWin = new THREE.Mesh(new THREE.CylinderGeometry(2.8, 2.8, 0.3, 16), glassMat);
  roseWin.rotation.x = Math.PI / 2;
  roseWin.position.set(-13, 38, 3.7);
  scene.add(roseWin);

  return exportGLB(scene, path.join(outputDir, 'danang_cathedral.glb'));
}

// 5. Da Nang Museum — Thành Điện Hải (citadel fortress)
// Star-shaped Vauban-style citadel, built by Gia Long dynasty
async function generateDaNangMuseum() {
  const scene = new THREE.Scene();
  scene.name = 'ThanhDienHai';

  const wallMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.85 }); // Amber brick walls
  const roofMat = new THREE.MeshStandardMaterial({ color: 0x713f12, roughness: 0.7 });  // Dark brown tiled roof
  const groundMat = new THREE.MeshStandardMaterial({ color: 0x92400e, roughness: 0.95 }); // Earthy courtyard
  const gateMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.8 });

  // --- Courtyard base (80m × 80m) ---
  const ground = new THREE.Mesh(new THREE.BoxGeometry(80, 1.5, 80), groundMat);
  ground.position.set(0, 0.75, 0);
  scene.add(ground);

  // --- Outer perimeter walls (Vauban rectangular) ---
  const wallH = 6;
  const wallT = 3;
  // North & South walls
  for (const zOff of [-40, 40]) {
    const wall = new THREE.Mesh(new THREE.BoxGeometry(86, wallH, wallT), wallMat);
    wall.position.set(0, wallH / 2 + 1.5, zOff);
    scene.add(wall);
  }
  // East & West walls
  for (const xOff of [-40, 40]) {
    const wall = new THREE.Mesh(new THREE.BoxGeometry(wallT, wallH, 86), wallMat);
    wall.position.set(xOff, wallH / 2 + 1.5, 0);
    scene.add(wall);
  }

  // --- Corner bastions (diamond-shaped gun platforms) ---
  for (const [xOff, zOff] of [[-38, -38], [38, -38], [-38, 38], [38, 38]]) {
    const bastionGeo = new THREE.CylinderGeometry(0, 9, wallH + 3, 4);
    bastionGeo.rotateY(Math.PI / 4);
    const bastion = new THREE.Mesh(bastionGeo, wallMat);
    bastion.position.set(xOff, (wallH + 3) / 2 + 1.5, zOff);
    scene.add(bastion);

    // Battlement (crenellations)
    for (let i = 0; i < 4; i++) {
      const crGeo = new THREE.BoxGeometry(2, 2.5, 2);
      const cr = new THREE.Mesh(crGeo, wallMat);
      const angle = (i / 4) * Math.PI * 2 + Math.PI / 4;
      cr.position.set(xOff + Math.cos(angle) * 5.5, wallH + 3 + 1.5, zOff + Math.sin(angle) * 5.5);
      scene.add(cr);
    }
  }

  // --- Main gate (South side) with arch ---
  const gatePillarL = new THREE.Mesh(new THREE.BoxGeometry(4, wallH + 4, wallT + 1), gateMat);
  gatePillarL.position.set(-5, (wallH + 4) / 2 + 1.5, -40);
  scene.add(gatePillarL);

  const gatePillarR = new THREE.Mesh(new THREE.BoxGeometry(4, wallH + 4, wallT + 1), gateMat);
  gatePillarR.position.set(5, (wallH + 4) / 2 + 1.5, -40);
  scene.add(gatePillarR);

  // Gate roof
  const gateRoofGeo = new THREE.CylinderGeometry(0, 6, 5, 4);
  gateRoofGeo.rotateY(Math.PI / 4);
  const gateRoof = new THREE.Mesh(gateRoofGeo, roofMat);
  gateRoof.position.set(0, wallH + 4 + 3, -40);
  scene.add(gateRoof);

  // --- Main Building (command center / exhibition hall) ---
  const mainBuilding = new THREE.Mesh(new THREE.BoxGeometry(28, 9, 18), wallMat);
  mainBuilding.position.set(0, 6, 0);
  scene.add(mainBuilding);

  // Traditional Vietnamese hip roof (hipped roof = 4 slopes)
  const hipRoofGeo = new THREE.CylinderGeometry(0, 16, 8, 4);
  hipRoofGeo.rotateY(Math.PI / 4);
  const hipRoof = new THREE.Mesh(hipRoofGeo, roofMat);
  hipRoof.scale.set(1.8, 1, 1.2);
  hipRoof.position.set(0, 14.5, 0);
  scene.add(hipRoof);

  // Decorative ridge beam
  const ridgeBeam = new THREE.Mesh(new THREE.BoxGeometry(30, 1.2, 1.2), roofMat);
  ridgeBeam.position.set(0, 18.5, 0);
  scene.add(ridgeBeam);

  // Upturned eave tips (traditional)
  for (const [xOff, zOff] of [[-15.5, -9.5], [15.5, -9.5], [-15.5, 9.5], [15.5, 9.5]]) {
    const eaveGeo = new THREE.ConeGeometry(1, 3, 6);
    eaveGeo.rotateZ(xOff < 0 ? -Math.PI / 6 : Math.PI / 6);
    const eave = new THREE.Mesh(eaveGeo, roofMat);
    eave.position.set(xOff, 12.5, zOff);
    scene.add(eave);
  }

  // Columns at entrance
  for (const xOff of [-9, -3, 3, 9]) {
    const col = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 1, 9, 10), wallMat);
    col.position.set(xOff, 6, -9.5);
    scene.add(col);
  }

  return exportGLB(scene, path.join(outputDir, 'danang_museum.glb'));
}

async function main() {
  console.log('Generating low-poly GLB models for Da Nang landmarks...');
  await generateDragonBridge();
  await generateHanBridge();
  await generateApecPark();
  await generateDaNangCathedral();
  await generateDaNangMuseum();
  console.log('All 5 3D models generated successfully!');
}

main().catch(console.error);
