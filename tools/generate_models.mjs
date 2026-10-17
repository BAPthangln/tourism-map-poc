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

async function main() {
  console.log('Generating low-poly GLB models for Da Nang landmarks...');
  await generateDragonBridge();
  await generateHanBridge();
  await generateApecPark();
  console.log('All 3D models generated successfully!');
}

main().catch(console.error);
