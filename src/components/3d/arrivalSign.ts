import * as THREE from 'three';

export interface ArrivalSignObject {
  group: THREE.Group;
  triggerZ: number;
  triggerX: number;
  triggerRadius: number;
  updateName: (name: string) => void;
}

/**
 * Draw crisp Instagram camera icon with authentic gradient
 */
export function drawInstagramBadge(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size = 36,
  handleText = 'vilmar.ai'
) {
  ctx.save();

  // 1. Instagram gradient rounded squircle
  const radius = size * 0.28;
  const grad = ctx.createLinearGradient(x, y + size, x + size, y);
  grad.addColorStop(0, '#f58529');
  grad.addColorStop(0.3, '#dd2a7b');
  grad.addColorStop(0.7, '#8134af');
  grad.addColorStop(1, '#515bd4');

  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.roundRect(x, y, size, size, radius);
  ctx.fill();

  // 2. Camera outer rounded frame (white)
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = size * 0.085;
  const frameInset = size * 0.18;
  ctx.beginPath();
  ctx.roundRect(
    x + frameInset,
    y + frameInset,
    size - frameInset * 2,
    size - frameInset * 2,
    radius * 0.7
  );
  ctx.stroke();

  // 3. Camera lens circle
  ctx.beginPath();
  ctx.arc(x + size * 0.5, y + size * 0.5, size * 0.17, 0, Math.PI * 2);
  ctx.stroke();

  // 4. Camera flash dot
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(x + size * 0.68, y + size * 0.32, size * 0.05, 0, Math.PI * 2);
  ctx.fill();

  // 5. Handle text
  ctx.fillStyle = '#fef08a';
  ctx.font = 'bold 26px "Arial Black", sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(handleText, x + size + 10, y + size * 0.52);

  ctx.restore();
}

export function createArrivalSign(childName: string): ArrivalSignObject {
  const group = new THREE.Group();
  group.name = 'ArrivalSignGroup';

  // Wooden posts on sides
  const woodMat = new THREE.MeshStandardMaterial({
    color: 0x451a03, // Dark walnut wood
    roughness: 0.8,
  });

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

  // Decorative post tops (carved glowing pumpkin finials!)
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

  // Main board geometry
  const boardGeo = new THREE.BoxGeometry(4.2, 1.9, 0.15);
  const boardBackMat = new THREE.MeshStandardMaterial({
    color: 0x2e1065, // Royal dark purple wooden board backing
    roughness: 0.7,
  });

  // Front face canvas texture
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;

  const renderSignCanvas = (name: string) => {
    const cleanName = (name || 'AMIGUITO').trim().toUpperCase();

    // Background gradient: spooky purple with glowing orange vignette
    const grad = ctx.createLinearGradient(0, 0, 0, 512);
    grad.addColorStop(0, '#2e1065');
    grad.addColorStop(0.5, '#3b0764');
    grad.addColorStop(1, '#1e1b4b');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 1024, 512);

    // Decorative Halloween border with golden brackets
    ctx.strokeStyle = '#f97316';
    ctx.lineWidth = 14;
    ctx.strokeRect(16, 16, 992, 480);

    ctx.strokeStyle = '#facc15';
    ctx.lineWidth = 4;
    ctx.strokeRect(28, 28, 968, 456);

    // Decorative corner dots
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

    // Bats & stars in center
    ctx.fillStyle = '#fb923c';
    ctx.font = 'bold 26px sans-serif';
    ctx.fillText('🦇  ★  🦇', 480, 58);

    // Sector Instagram "vilmar.ai" badge on top right
    drawInstagramBadge(ctx, 740, 40, 36, 'vilmar.ai');

    // --- MAIN TITLE: "★ LLEGADA ★" ---
    ctx.shadowColor = '#ea580c';
    ctx.shadowBlur = 18;
    ctx.fillStyle = '#fb923c';
    ctx.font = '900 66px "Arial Black", Impact, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('★  LLEGADA  ★', 512, 142);

    // --- CHILD'S NAME ---
    let nameFontSize = 96;
    if (cleanName.length > 8) nameFontSize = 78;
    if (cleanName.length > 12) nameFontSize = 62;
    if (cleanName.length > 16) nameFontSize = 48;

    ctx.shadowColor = '#facc15';
    ctx.shadowBlur = 24;
    ctx.fillStyle = '#fef08a';
    ctx.font = `900 ${nameFontSize}px "Arial Black", Impact, sans-serif`;
    ctx.fillText(cleanName, 512, 268);

    // --- SUB-BANNER: "🎃 ¡AVENTURA COMPLETADA! 🎃" ---
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#c084fc';
    ctx.font = 'bold 36px sans-serif';
    ctx.fillText('🎃  ¡AVENTURA COMPLETADA!  🎃', 512, 380);

    // --- FOOTER SECTOR: PASEO EMPALME & INSTAGRAM VILMAR.AI ---
    // Horizontal divider line
    ctx.strokeStyle = '#f97316';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(50, 425);
    ctx.lineTo(974, 425);
    ctx.stroke();

    // Footer Left: Paseo Empalme
    ctx.fillStyle = '#fde047';
    ctx.font = 'bold 24px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('🌟 Paseo Empalme', 60, 460);

    // Footer Right: Instagram handle
    drawInstagramBadge(ctx, 720, 442, 32, '@vilmar.ai');

    texture.needsUpdate = true;
  };

  renderSignCanvas(childName);

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
    boardBackMat, // back
  ];

  const boardMesh = new THREE.Mesh(boardGeo, materials);
  boardMesh.position.set(0, 2.3, 0);
  boardMesh.castShadow = true;
  group.add(boardMesh);

  // Warm glowing lanterns hanging from the crossbeam!
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

  // Finish line banner / arch on the ground
  const ribbonGeo = new THREE.PlaneGeometry(4.0, 0.5);
  const ribbonCanvas = document.createElement('canvas');
  ribbonCanvas.width = 512;
  ribbonCanvas.height = 64;
  const rctx = ribbonCanvas.getContext('2d')!;
  for (let i = 0; i < 16; i++) {
    rctx.fillStyle = i % 2 === 0 ? '#9333ea' : '#f97316';
    rctx.fillRect(i * 32, 0, 32, 64);
  }
  const ribbonTex = new THREE.CanvasTexture(ribbonCanvas);
  const ribbonMat = new THREE.MeshStandardMaterial({
    map: ribbonTex,
    roughness: 0.6,
  });
  const ribbonMesh = new THREE.Mesh(ribbonGeo, ribbonMat);
  ribbonMesh.rotation.x = -Math.PI / 2;
  ribbonMesh.position.set(0, 0.03, -0.6);
  ribbonMesh.receiveShadow = true;
  group.add(ribbonMesh);

  return {
    group,
    triggerZ: 0,
    triggerX: 0,
    triggerRadius: 2.5,
    updateName: renderSignCanvas,
  };
}
