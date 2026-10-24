import * as THREE from 'three';
import { drawInstagramBadge } from './arrivalSign';

export interface StartSignObject {
  group: THREE.Group;
}

export function createStartSign(): StartSignObject {
  const group = new THREE.Group();
  group.name = 'StartSignGroup';

  // Wooden materials
  const woodMat = new THREE.MeshStandardMaterial({
    color: 0x451a03,
    roughness: 0.8,
  });

  // Left & Right posts
  const postGeo = new THREE.CylinderGeometry(0.14, 0.16, 3.8, 12);
  const leftPost = new THREE.Mesh(postGeo, woodMat);
  leftPost.position.set(-2.2, 1.9, 0);
  leftPost.castShadow = true;
  group.add(leftPost);

  const rightPost = new THREE.Mesh(postGeo, woodMat);
  rightPost.position.set(2.2, 1.9, 0);
  rightPost.castShadow = true;
  group.add(rightPost);

  // Cross beam
  const beamGeo = new THREE.BoxGeometry(4.7, 0.22, 0.25);
  const beam = new THREE.Mesh(beamGeo, woodMat);
  beam.position.set(0, 3.5, 0);
  beam.castShadow = true;
  group.add(beam);

  // Pumpkin finials on posts
  const pumpkinFinialMat = new THREE.MeshStandardMaterial({
    color: 0xf97316,
    roughness: 0.4,
    emissive: 0xea580c,
    emissiveIntensity: 0.35,
  });
  const finialGeo = new THREE.SphereGeometry(0.24, 14, 12);

  const leftFinial = new THREE.Mesh(finialGeo, pumpkinFinialMat);
  leftFinial.position.set(-2.2, 3.9, 0);
  group.add(leftFinial);

  const rightFinial = new THREE.Mesh(finialGeo, pumpkinFinialMat);
  rightFinial.position.set(2.2, 3.9, 0);
  group.add(rightFinial);

  // Signboard geometry
  const boardGeo = new THREE.BoxGeometry(4.2, 1.85, 0.15);
  const boardBackMat = new THREE.MeshStandardMaterial({
    color: 0x2e1065,
    roughness: 0.7,
  });

  // Canvas texture
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;

  const renderStartCanvas = () => {
    // Spooky purple gradient
    const grad = ctx.createLinearGradient(0, 0, 0, 512);
    grad.addColorStop(0, '#2e1065');
    grad.addColorStop(0.5, '#3b0764');
    grad.addColorStop(1, '#1e1b4b');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 1024, 512);

    // Border in orange and gold
    ctx.strokeStyle = '#f97316';
    ctx.lineWidth = 14;
    ctx.strokeRect(16, 16, 992, 480);

    ctx.strokeStyle = '#facc15';
    ctx.lineWidth = 4;
    ctx.strokeRect(28, 28, 968, 456);

    // Corner dots
    const corners = [[36, 36], [988, 36], [36, 476], [988, 476]];
    ctx.fillStyle = '#facc15';
    corners.forEach(([cx, cy]) => {
      ctx.beginPath();
      ctx.arc(cx, cy, 8, 0, Math.PI * 2);
      ctx.fill();
    });

    // --- TOP HEADER BAR: PASEO EMPALME (LEFT) & INSTAGRAM VILMAR.AI (RIGHT) ---
    // Sector "Paseo Empalme" pill badge on top left
    ctx.fillStyle = '#f97316';
    ctx.beginPath();
    ctx.roundRect(46, 36, 260, 44, 22);
    ctx.fill();

    ctx.strokeStyle = '#facc15';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.roundRect(46, 36, 260, 44, 22);
    ctx.stroke();

    ctx.fillStyle = '#1e1b4b';
    ctx.font = '900 21px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🏛️ PASEO EMPALME', 176, 58);

    // Decorative Halloween bats & stars
    ctx.fillStyle = '#fb923c';
    ctx.font = 'bold 26px sans-serif';
    ctx.fillText('🦇  ★  🦇', 480, 58);

    // Sector Instagram "vilmar.ai" badge on top right
    drawInstagramBadge(ctx, 740, 40, 36, 'vilmar.ai');

    // --- MAIN TITLE: "★ LARGADA ★" ---
    ctx.shadowColor = '#ea580c';
    ctx.shadowBlur = 20;
    ctx.fillStyle = '#fb923c';
    ctx.font = '900 68px "Arial Black", Impact, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('★  LARGADA  ★', 512, 145);

    // --- SUBTITLE: "JUEGO MÁGICO DE HALLOWEEN" ---
    ctx.shadowColor = '#facc15';
    ctx.shadowBlur = 22;
    ctx.fillStyle = '#fef08a';
    ctx.font = '900 52px "Arial Black", Impact, sans-serif';
    ctx.fillText('JUEGO MÁGICO', 512, 235);

    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#f97316';
    ctx.font = 'bold 32px sans-serif';
    ctx.fillText('🎃 AVENTURA DE HALLOWEEN 🎃', 512, 305);

    // Instruction banner
    ctx.fillStyle = '#c084fc';
    ctx.font = 'bold 28px sans-serif';
    ctx.fillText('¡Recorre el camino mágico y encuentra los 5 caramelos!', 512, 375);

    // --- FOOTER ROW: PASEO EMPALME & INSTAGRAM VILMAR.AI ---
    ctx.strokeStyle = '#f97316';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(50, 425);
    ctx.lineTo(974, 425);
    ctx.stroke();

    ctx.fillStyle = '#fde047';
    ctx.font = 'bold 24px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('🌟 Paseo Empalme', 60, 460);

    drawInstagramBadge(ctx, 720, 442, 32, '@vilmar.ai');

    texture.needsUpdate = true;
  };

  renderStartCanvas();

  const frontMat = new THREE.MeshStandardMaterial({
    map: texture,
    roughness: 0.5,
    metalness: 0.1,
  });

  const materials = [
    boardBackMat, // right
    boardBackMat, // left
    boardBackMat, // top
    boardBackMat, // bottom
    frontMat,     // front
    frontMat,     // back (double sided visibility)
  ];

  const boardMesh = new THREE.Mesh(boardGeo, materials);
  boardMesh.position.set(0, 2.3, 0);
  boardMesh.castShadow = true;
  group.add(boardMesh);

  // Warm hanging lanterns
  const createLantern = (x: number) => {
    const lGroup = new THREE.Group();
    lGroup.position.set(x, 3.1, 0.2);

    const wireGeo = new THREE.CylinderGeometry(0.015, 0.015, 0.35, 8);
    const wire = new THREE.Mesh(wireGeo, woodMat);
    wire.position.y = 0.15;
    lGroup.add(wire);

    const bodyGeo = new THREE.OctahedronGeometry(0.18, 0);
    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0xfef08a,
      emissive: 0xf59e0b,
      emissiveIntensity: 0.9,
      roughness: 0.2,
    });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    lGroup.add(body);

    const light = new THREE.PointLight(0xf59e0b, 1.2, 5);
    light.position.set(0, 0, 0.1);
    lGroup.add(light);

    return lGroup;
  };

  group.add(createLantern(-1.8));
  group.add(createLantern(1.8));

  // Starting line checkered ribbon on the ground
  const ribbonGeo = new THREE.PlaneGeometry(4.0, 0.5);
  const ribbonCanvas = document.createElement('canvas');
  ribbonCanvas.width = 512;
  ribbonCanvas.height = 64;
  const rctx = ribbonCanvas.getContext('2d')!;
  for (let i = 0; i < 16; i++) {
    rctx.fillStyle = i % 2 === 0 ? '#ea580c' : '#7e22ce';
    rctx.fillRect(i * 32, 0, 32, 64);
  }
  const ribbonTex = new THREE.CanvasTexture(ribbonCanvas);
  const ribbonMat = new THREE.MeshStandardMaterial({
    map: ribbonTex,
    roughness: 0.6,
  });
  const ribbonMesh = new THREE.Mesh(ribbonGeo, ribbonMat);
  ribbonMesh.rotation.x = -Math.PI / 2;
  ribbonMesh.position.set(0, 0.03, 0.6);
  ribbonMesh.receiveShadow = true;
  group.add(ribbonMesh);

  return {
    group,
  };
}
