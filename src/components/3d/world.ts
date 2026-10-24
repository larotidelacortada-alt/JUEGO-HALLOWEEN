import * as THREE from 'three';
import { CollectibleItem } from '../../types/game';

export interface WorldObjects {
  group: THREE.Group;
  collectibles: { mesh: THREE.Group; data: CollectibleItem }[];
  interactivePumpkin: { mesh: THREE.Group; triggerRadius: number; glowLight: THREE.PointLight; activate: () => void };
  update: (delta: number) => void;
  checkCandyCollisions: (playerPos: THREE.Vector3, onCollect: (c: CollectibleItem) => void) => void;
  checkPumpkinCollision: (playerPos: THREE.Vector3, onTrigger: () => void) => void;
  isInsidePlayableBounds: (x: number, z: number) => boolean;
}

export function createHalloweenWorld(): WorldObjects {
  const worldGroup = new THREE.Group();
  worldGroup.name = 'HalloweenWorld';

  // --- PALETTE & MATERIALS ---
  const groundMat = new THREE.MeshStandardMaterial({
    color: 0x180b2b, // Midnight deep purple grass
    roughness: 0.9,
    metalness: 0.05,
  });

  const stoneMat = new THREE.MeshStandardMaterial({
    color: 0x3b1d54, // Mystical cobblestone purple
    roughness: 0.8,
  });

  const woodMat = new THREE.MeshStandardMaterial({
    color: 0x271406,
    roughness: 0.85,
  });

  const pumpkinOrangeMat = new THREE.MeshStandardMaterial({
    color: 0xf97316,
    roughness: 0.5,
  });

  const pumpkinStemMat = new THREE.MeshStandardMaterial({
    color: 0x166534,
    roughness: 0.7,
  });

  // --- 1. TERRAIN BASE & HORIZON BLEND ---
  const groundGeo = new THREE.PlaneGeometry(80, 140, 16, 16);
  const groundMesh = new THREE.Mesh(groundGeo, groundMat);
  groundMesh.rotation.x = -Math.PI / 2;
  groundMesh.position.set(0, 0, 45);
  groundMesh.receiveShadow = true;
  worldGroup.add(groundMesh);

  // --- 2. COBBLESTONE WINDING PATH (Z from -5 to 85) ---
  const pathPoints: THREE.Vector3[] = [];
  const pathSegments = 50;
  for (let i = 0; i <= pathSegments; i++) {
    const t = i / pathSegments;
    const z = -5 + t * 90;
    // Gentle S-curve path
    const x = Math.sin(t * Math.PI * 2) * 2.5;
    pathPoints.push(new THREE.Vector3(x, 0.02, z));
  }

  // Create path paving slabs
  const pathGroup = new THREE.Group();
  for (let i = 0; i < pathPoints.length - 1; i++) {
    const p1 = pathPoints[i];
    const p2 = pathPoints[i + 1];
    const mid = new THREE.Vector3().addVectors(p1, p2).multiplyScalar(0.5);
    const angle = Math.atan2(p2.x - p1.x, p2.z - p1.z);

    const slabGeo = new THREE.PlaneGeometry(3.6, p1.distanceTo(p2) + 0.2);
    const slab = new THREE.Mesh(slabGeo, stoneMat);
    slab.rotation.x = -Math.PI / 2;
    slab.rotation.z = -angle;
    slab.position.copy(mid);
    slab.receiveShadow = true;
    pathGroup.add(slab);

    // Glowing border stones along path edges
    const borderMat = new THREE.MeshStandardMaterial({
      color: 0x581c87,
      roughness: 0.7,
    });
    const stoneL = new THREE.Mesh(new THREE.DodecahedronGeometry(0.18, 0), borderMat);
    stoneL.position.set(mid.x - Math.cos(angle) * 1.9, 0.08, mid.z + Math.sin(angle) * 1.9);
    pathGroup.add(stoneL);

    const stoneR = new THREE.Mesh(new THREE.DodecahedronGeometry(0.18, 0), borderMat);
    stoneR.position.set(mid.x + Math.cos(angle) * 1.9, 0.08, mid.z - Math.sin(angle) * 1.9);
    pathGroup.add(stoneR);
  }
  worldGroup.add(pathGroup);

  // Helper to get path X given Z
  const getPathXAtZ = (z: number): number => {
    const t = Math.max(0, Math.min(1, (z + 5) / 90));
    return Math.sin(t * Math.PI * 2) * 2.5;
  };

  // --- 3. SPOOKY CARTOON TREES & MUSHROOMS ---
  const createCartoonTree = (x: number, z: number, scale = 1) => {
    const treeGroup = new THREE.Group();
    treeGroup.position.set(x, 0, z);
    treeGroup.scale.set(scale, scale, scale);

    // Twisted trunk
    const trunkGeo = new THREE.CylinderGeometry(0.2, 0.45, 3.2, 8);
    const trunk = new THREE.Mesh(trunkGeo, woodMat);
    trunk.position.y = 1.6;
    trunk.rotation.z = (Math.random() - 0.5) * 0.25;
    trunk.castShadow = true;
    treeGroup.add(trunk);

    // Foliage puffs (dark violet & midnight blue spheres)
    const foliageMat = new THREE.MeshStandardMaterial({
      color: Math.random() > 0.5 ? 0x3b0764 : 0x1e1b4b,
      roughness: 0.8,
    });
    const puffs = [
      { y: 3.2, r: 1.1, ox: 0, oz: 0 },
      { y: 3.8, r: 0.85, ox: 0.3, oz: 0.2 },
      { y: 3.6, r: 0.9, ox: -0.4, oz: -0.1 },
    ];
    puffs.forEach(pf => {
      const pMesh = new THREE.Mesh(new THREE.DodecahedronGeometry(pf.r, 1), foliageMat);
      pMesh.position.set(pf.ox, pf.y, pf.oz);
      pMesh.castShadow = true;
      treeGroup.add(pMesh);
    });

    return treeGroup;
  };

  // Plant trees along sides of path to frame the world
  for (let z = 0; z < 85; z += 9) {
    const px = getPathXAtZ(z);
    // Left trees
    worldGroup.add(createCartoonTree(px - (3.5 + Math.random() * 2), z + (Math.random() - 0.5) * 3, 0.9 + Math.random() * 0.4));
    // Right trees
    worldGroup.add(createCartoonTree(px + (3.5 + Math.random() * 2), z + (Math.random() - 0.5) * 3, 0.9 + Math.random() * 0.4));
  }

  // --- 4. GIANT HALLOWEEN MOON & TWINKLING STARS ---
  const moonGroup = new THREE.Group();
  moonGroup.position.set(0, 32, 95);
  const moonGeo = new THREE.SphereGeometry(7.5, 24, 24);
  const moonMat = new THREE.MeshBasicMaterial({
    color: 0xfef08a,
  });
  const moonMesh = new THREE.Mesh(moonGeo, moonMat);
  moonGroup.add(moonMesh);

  // Soft moon glow sprite/halo
  const moonGlowGeo = new THREE.SphereGeometry(8.5, 16, 16);
  const moonGlowMat = new THREE.MeshBasicMaterial({
    color: 0xfde047,
    transparent: true,
    opacity: 0.22,
    side: THREE.BackSide,
  });
  moonGroup.add(new THREE.Mesh(moonGlowGeo, moonGlowMat));
  worldGroup.add(moonGroup);

  // Background stars
  const starGeo = new THREE.BufferGeometry();
  const starCoords: number[] = [];
  for (let i = 0; i < 220; i++) {
    starCoords.push(
      (Math.random() - 0.5) * 120,
      15 + Math.random() * 35,
      (Math.random() - 0.5) * 120 + 40
    );
  }
  starGeo.setAttribute('position', new THREE.Float32BufferAttribute(starCoords, 3));
  const starMat = new THREE.PointsMaterial({
    color: 0xfef08a,
    size: 0.6,
    transparent: true,
    opacity: 0.85,
  });
  const starField = new THREE.Points(starGeo, starMat);
  worldGroup.add(starField);

  // --- 5. CARVED JACK-O'-LANTERNS (PUMPKINS) ---
  const createPumpkin = (x: number, z: number, scale = 1, isLit = true) => {
    const pGroup = new THREE.Group();
    pGroup.position.set(x, 0, z);
    pGroup.scale.set(scale, scale, scale);

    const bodyGeo = new THREE.SphereGeometry(0.42, 16, 12);
    bodyGeo.scale(1.2, 0.9, 1.2);
    const body = new THREE.Mesh(bodyGeo, pumpkinOrangeMat);
    body.position.y = 0.35;
    body.castShadow = true;
    pGroup.add(body);

    // Green stem
    const stemGeo = new THREE.CylinderGeometry(0.04, 0.06, 0.18, 8);
    const stem = new THREE.Mesh(stemGeo, pumpkinStemMat);
    stem.position.set(0, 0.75, 0);
    stem.rotation.z = 0.2;
    pGroup.add(stem);

    if (isLit) {
      // Carved glowing eyes & smile on front
      const eyeMat = new THREE.MeshBasicMaterial({ color: 0xfef08a });
      const eyeGeo = new THREE.BufferGeometry();
      // Triangle eyes
      const eye1 = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.05, 3), eyeMat);
      eye1.rotation.x = Math.PI / 2;
      eye1.position.set(-0.16, 0.42, 0.45);
      pGroup.add(eye1);

      const eye2 = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.05, 3), eyeMat);
      eye2.rotation.x = Math.PI / 2;
      eye2.position.set(0.16, 0.42, 0.45);
      pGroup.add(eye2);

      // Smiling mouth
      const mouthGeo = new THREE.TorusGeometry(0.14, 0.03, 6, 12, Math.PI);
      const mouth = new THREE.Mesh(mouthGeo, eyeMat);
      mouth.position.set(0, 0.3, 0.46);
      pGroup.add(mouth);

      // Warm candle light
      const pLight = new THREE.PointLight(0xf97316, 0.8, 4);
      pLight.position.set(0, 0.4, 0.3);
      pGroup.add(pLight);
    }

    return pGroup;
  };

  // Place decorative pumpkins along the path
  const pumpkinPositions = [
    { z: 6, side: -1 }, { z: 15, side: 1 }, { z: 24, side: -1 },
    { z: 38, side: 1 }, { z: 48, side: -1 }, { z: 62, side: 1 },
    { z: 72, side: -1 }
  ];
  pumpkinPositions.forEach(pos => {
    const px = getPathXAtZ(pos.z);
    worldGroup.add(createPumpkin(px + pos.side * 2.3, pos.z, 0.9 + Math.random() * 0.3, true));
  });

  // --- 6. INTERACTIVE MAGIC PUMPKIN ---
  // A special oversized smiling pumpkin around Z = 32 that lights up with sparks when approached!
  const interactivePumpkinGroup = new THREE.Group();
  interactivePumpkinGroup.name = 'InteractivePumpkin';
  const ipX = getPathXAtZ(32) + 2.4;
  interactivePumpkinGroup.position.set(ipX, 0, 32);

  const ipBodyGeo = new THREE.SphereGeometry(0.65, 20, 16);
  ipBodyGeo.scale(1.25, 0.95, 1.25);
  const ipBodyMat = new THREE.MeshStandardMaterial({
    color: 0xf97316,
    roughness: 0.4,
    emissive: 0xea580c,
    emissiveIntensity: 0.2,
  });
  const ipBody = new THREE.Mesh(ipBodyGeo, ipBodyMat);
  ipBody.position.y = 0.55;
  ipBody.castShadow = true;
  interactivePumpkinGroup.add(ipBody);

  const ipStem = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 0.25, 8), pumpkinStemMat);
  ipStem.position.set(0, 1.15, 0);
  ipStem.rotation.z = -0.25;
  interactivePumpkinGroup.add(ipStem);

  // Big happy carved face
  const ipEyeMat = new THREE.MeshBasicMaterial({ color: 0xfef08a });
  const ipEyeL = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.06, 3), ipEyeMat);
  ipEyeL.rotation.x = Math.PI / 2;
  ipEyeL.position.set(-0.25, 0.65, 0.72);
  interactivePumpkinGroup.add(ipEyeL);

  const ipEyeR = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.06, 3), ipEyeMat);
  ipEyeR.rotation.x = Math.PI / 2;
  ipEyeR.position.set(0.25, 0.65, 0.72);
  interactivePumpkinGroup.add(ipEyeR);

  const ipMouth = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.045, 8, 14, Math.PI), ipEyeMat);
  ipMouth.position.set(0, 0.45, 0.74);
  interactivePumpkinGroup.add(ipMouth);

  const ipLight = new THREE.PointLight(0xfbbf24, 1.5, 6);
  ipLight.position.set(0, 0.7, 0.6);
  interactivePumpkinGroup.add(ipLight);

  worldGroup.add(interactivePumpkinGroup);

  let pumpkinActivated = false;
  let pumpkinAnimTime = 0;

  const activateInteractivePumpkin = () => {
    pumpkinActivated = true;
    pumpkinAnimTime = 0;
    ipLight.intensity = 4.0;
    ipBodyMat.emissiveIntensity = 0.9;
  };

  // --- 7. COLLECTIBLE CANDIES (5 OBSTACLES) ---
  // Exactly 5 candies evenly distributed so the game is fast and fun!
  const collectibles: { mesh: THREE.Group; data: CollectibleItem }[] = [];
  const candyDistances = [12, 27, 42, 57, 72];

  candyDistances.forEach((z, idx) => {
    const cGroup = new THREE.Group();
    const x = getPathXAtZ(z) + (idx % 2 === 0 ? 0.6 : -0.6);
    cGroup.position.set(x, 0.85, z);

    // Candy corn procedural mesh (3 tiers: yellow base, orange mid, white tip)
    const baseGeo = new THREE.CylinderGeometry(0.22, 0.28, 0.2, 16);
    const baseMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.3 });
    const base = new THREE.Mesh(baseGeo, baseMat);
    base.position.y = -0.12;
    cGroup.add(base);

    const midGeo = new THREE.CylinderGeometry(0.14, 0.22, 0.22, 16);
    const midMat = new THREE.MeshStandardMaterial({ color: 0xf97316, roughness: 0.3 });
    const mid = new THREE.Mesh(midGeo, midMat);
    mid.position.y = 0.09;
    cGroup.add(mid);

    const tipGeo = new THREE.ConeGeometry(0.14, 0.22, 16);
    const tipMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3 });
    const tip = new THREE.Mesh(tipGeo, tipMat);
    tip.position.y = 0.31;
    cGroup.add(tip);

    // Cute golden sparkle ring around each candy
    const ringGeo = new THREE.TorusGeometry(0.38, 0.02, 6, 20);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0xfef08a });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = Math.PI / 2;
    cGroup.add(ring);

    worldGroup.add(cGroup);

    collectibles.push({
      mesh: cGroup,
      data: {
        id: idx + 1,
        x,
        z,
        collected: false,
        type: 'candy_corn',
      },
    });
  });

  // --- 8. FRIENDLY 3D FLOATING GHOSTS ---
  const ghostGroup = new THREE.Group();
  ghostGroup.name = 'GhostsGroup';

  const ghostMat = new THREE.MeshStandardMaterial({
    color: 0xf1f5f9,
    roughness: 0.4,
    transparent: true,
    opacity: 0.88,
  });

  const eyeGhostMat = new THREE.MeshBasicMaterial({ color: 0x1e1b4b });

  const ghosts: { group: THREE.Group; baseZ: number; speed: number; phase: number; radius: number }[] = [];

  const createFriendlyGhost = (baseZ: number, side: number, speed: number, phase: number) => {
    const g = new THREE.Group();

    // Rounded head
    const gHead = new THREE.Mesh(new THREE.SphereGeometry(0.35, 16, 14), ghostMat);
    gHead.position.y = 0.45;
    g.add(gHead);

    // Flowing wavy sheet body
    const gBody = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.45, 0.6, 16, 1, true), ghostMat);
    gBody.position.y = 0.15;
    g.add(gBody);

    // Cute smiling ghost face
    const eyeL = new THREE.Mesh(new THREE.SphereGeometry(0.045, 8, 8), eyeGhostMat);
    eyeL.position.set(-0.12, 0.48, 0.32);
    g.add(eyeL);

    const eyeR = new THREE.Mesh(new THREE.SphereGeometry(0.045, 8, 8), eyeGhostMat);
    eyeR.position.set(0.12, 0.48, 0.32);
    g.add(eyeR);

    const mouth = new THREE.Mesh(new THREE.TorusGeometry(0.06, 0.02, 6, 12, Math.PI), eyeGhostMat);
    mouth.position.set(0, 0.38, 0.32);
    g.add(mouth);

    // Little cute waving arm
    const armGeo = new THREE.CapsuleGeometry(0.05, 0.15, 6, 8);
    const armL = new THREE.Mesh(armGeo, ghostMat);
    armL.position.set(-0.35, 0.28, 0);
    armL.rotation.z = 0.5;
    g.add(armL);

    const armR = new THREE.Mesh(armGeo, ghostMat);
    armR.position.set(0.35, 0.28, 0);
    armR.rotation.z = -0.5;
    g.add(armR);

    ghostGroup.add(g);
    ghosts.push({
      group: g,
      baseZ,
      speed,
      phase,
      radius: side * 3.8,
    });
  };

  createFriendlyGhost(14, -1, 1.2, 0);
  createFriendlyGhost(35, 1, 0.9, 1.5);
  createFriendlyGhost(58, -1, 1.1, 3.0);
  createFriendlyGhost(70, 1, 1.3, 4.5);
  worldGroup.add(ghostGroup);

  // --- 9. FLYING 3D WITCHES ON BROOMS ---
  const witchGroup = new THREE.Group();
  witchGroup.name = 'WitchesGroup';

  const witches: { group: THREE.Group; orbitCenterZ: number; orbitRadius: number; speed: number; angle: number; height: number }[] = [];

  const createFlyingWitch = (orbitCenterZ: number, orbitRadius: number, speed: number, height: number, startAngle: number) => {
    const w = new THREE.Group();

    // Broomstick
    const stickGeo = new THREE.CylinderGeometry(0.04, 0.04, 1.8, 8);
    stickGeo.rotateX(Math.PI / 2);
    const stick = new THREE.Mesh(stickGeo, woodMat);
    w.add(stick);

    // Broom bristles (straw)
    const strawGeo = new THREE.ConeGeometry(0.18, 0.45, 10);
    strawGeo.rotateX(-Math.PI / 2);
    const strawMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.9 });
    const straw = new THREE.Mesh(strawGeo, strawMat);
    straw.position.set(0, 0, -0.9);
    w.add(straw);

    // Witch body (little friendly witch sitting on broom)
    const witchDressMat = new THREE.MeshStandardMaterial({ color: 0x4c1d95, roughness: 0.6 });
    const dress = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.45, 12), witchDressMat);
    dress.position.set(0, 0.22, 0.1);
    w.add(dress);

    const witchSkinMat = new THREE.MeshStandardMaterial({ color: 0x86efac, roughness: 0.5 }); // cute cartoon green witch!
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.16, 12, 12), witchSkinMat);
    head.position.set(0, 0.52, 0.1);
    w.add(head);

    // Witch hat with orange brim
    const wHatMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.5 });
    const wHatBrim = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.02, 16), wHatMat);
    wHatBrim.position.set(0, 0.64, 0.1);
    w.add(wHatBrim);

    const wHatCone = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.38, 16), wHatMat);
    wHatCone.position.set(0, 0.82, 0.1);
    wHatCone.rotation.z = -0.15;
    w.add(wHatCone);

    // Lantern hanging on the front tip of broom!
    const frontLight = new THREE.PointLight(0xf59e0b, 0.9, 8);
    frontLight.position.set(0, -0.1, 0.95);
    w.add(frontLight);

    witchGroup.add(w);
    witches.push({
      group: w,
      orbitCenterZ,
      orbitRadius,
      speed,
      angle: startAngle,
      height,
    });
  };

  createFlyingWitch(25, 9, 0.8, 5.5, 0);
  createFlyingWitch(60, 11, -0.65, 6.2, Math.PI);
  worldGroup.add(witchGroup);

  // --- 10. ANIMATION LOOP UPDATE ---
  let totalTime = 0;

  const update = (delta: number) => {
    totalTime += delta;

    // Update candies (floating bob + spin)
    collectibles.forEach(c => {
      if (!c.data.collected) {
        c.mesh.rotation.y += delta * 2.2;
        c.mesh.position.y = 0.85 + Math.sin(totalTime * 3 + c.data.id) * 0.15;
      }
    });

    // Update interactive pumpkin animation
    if (pumpkinActivated) {
      pumpkinAnimTime += delta;
      ipBody.rotation.y = Math.sin(pumpkinAnimTime * 8) * 0.25;
      ipBody.scale.y = 0.95 + Math.abs(Math.sin(pumpkinAnimTime * 6)) * 0.2;
      ipLight.intensity = Math.max(1.5, 4.0 - pumpkinAnimTime * 1.5);
      if (pumpkinAnimTime > 3.0) {
        pumpkinActivated = false;
        ipBody.rotation.y = 0;
        ipBody.scale.y = 0.95;
      }
    }

    // Update ghosts
    ghosts.forEach(g => {
      const px = getPathXAtZ(g.baseZ);
      const bob = Math.sin(totalTime * 2.5 + g.phase) * 0.45;
      const sway = Math.cos(totalTime * 1.2 + g.phase) * 0.8;
      g.group.position.set(px + g.radius + sway, 1.8 + bob, g.baseZ + Math.sin(totalTime + g.phase) * 1.2);
      g.group.rotation.y = Math.sin(totalTime * 1.5 + g.phase) * 0.3;
    });

    // Update flying witches (circular elliptical flight paths)
    witches.forEach(w => {
      w.angle += delta * w.speed;
      const x = Math.cos(w.angle) * w.orbitRadius;
      const z = w.orbitCenterZ + Math.sin(w.angle) * (w.orbitRadius * 0.7);
      const bob = Math.sin(totalTime * 3) * 0.35;

      w.group.position.set(x, w.height + bob, z);
      // Orient broom in direction of travel
      w.group.rotation.y = -w.angle + (w.speed > 0 ? Math.PI : 0);
      w.group.rotation.z = Math.sin(totalTime * 2) * 0.12; // banking
    });
  };

  // --- 11. COLLISION DETECTION ---
  const checkCandyCollisions = (playerPos: THREE.Vector3, onCollect: (c: CollectibleItem) => void) => {
    collectibles.forEach(c => {
      if (c.data.collected) return;
      const dx = playerPos.x - c.mesh.position.x;
      const dz = playerPos.z - c.mesh.position.z;
      const dist = Math.sqrt(dx * dx + dz * dz);
      if (dist < 1.1) {
        c.data.collected = true;
        c.mesh.visible = false;
        onCollect(c.data);
      }
    });
  };

  const checkPumpkinCollision = (playerPos: THREE.Vector3, onTrigger: () => void) => {
    const dx = playerPos.x - interactivePumpkinGroup.position.x;
    const dz = playerPos.z - interactivePumpkinGroup.position.z;
    const dist = Math.sqrt(dx * dx + dz * dz);
    if (dist < 2.2 && !pumpkinActivated) {
      activateInteractivePumpkin();
      onTrigger();
    }
  };

  const isInsidePlayableBounds = (x: number, z: number): boolean => {
    // Keep character within reasonable path bounds so they don't wander into nothingness
    if (z < -8 || z > 84) return false;
    const pathX = getPathXAtZ(z);
    return Math.abs(x - pathX) < 4.2;
  };

  return {
    group: worldGroup,
    collectibles,
    interactivePumpkin: {
      mesh: interactivePumpkinGroup,
      triggerRadius: 2.2,
      glowLight: ipLight,
      activate: activateInteractivePumpkin,
    },
    update,
    checkCandyCollisions,
    checkPumpkinCollision,
    isInsidePlayableBounds,
  };
}
