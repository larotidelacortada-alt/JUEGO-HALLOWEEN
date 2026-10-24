import * as THREE from 'three';
import { AvatarCostume } from '../../types/game';

export interface CharacterController {
  group: THREE.Group;
  update: (delta: number, isMoving: boolean, isJumping: boolean, isVictory: boolean) => void;
  updateFaceTexture: (canvas: HTMLCanvasElement) => void;
  setCostume: (costume: AvatarCostume) => void;
  getFaceWorldPosition: () => THREE.Vector3;
}

export function createHalloweenAvatar(
  faceCanvas?: HTMLCanvasElement,
  initialCostume: AvatarCostume = 'wizard'
): CharacterController {
  const root = new THREE.Group();
  root.name = 'AvatarRoot';

  // Shared skin material for neck/hands
  const skinMat = new THREE.MeshStandardMaterial({
    color: 0xfed7aa,
    roughness: 0.6,
  });

  const goldBuckleMat = new THREE.MeshStandardMaterial({
    color: 0xfacc15,
    roughness: 0.2,
    metalness: 0.85,
  });

  // Dynamic materials that adapt per costume
  const tunicMat = new THREE.MeshStandardMaterial({ roughness: 0.55 });
  const vestMat = new THREE.MeshStandardMaterial({ roughness: 0.5 });
  const capeMat = new THREE.MeshStandardMaterial({ roughness: 0.5, side: THREE.DoubleSide });
  const hatMat = new THREE.MeshStandardMaterial({ roughness: 0.5 });
  const hatAccentMat = new THREE.MeshStandardMaterial({ roughness: 0.4 });
  const bootMat = new THREE.MeshStandardMaterial({ roughness: 0.5 });

  // --- 1. TORSO & BELT ---
  const torsoGroup = new THREE.Group();
  torsoGroup.position.y = 0.75;
  root.add(torsoGroup);

  const torsoGeo = new THREE.CylinderGeometry(0.24, 0.28, 0.55, 16);
  const torsoMesh = new THREE.Mesh(torsoGeo, tunicMat);
  torsoMesh.castShadow = true;
  torsoMesh.receiveShadow = true;
  torsoGroup.add(torsoMesh);

  // Vest overlay for Dracula / detailed costumes
  const vestGeo = new THREE.CylinderGeometry(0.245, 0.285, 0.45, 16, 1, true, -Math.PI * 0.35, Math.PI * 0.7);
  const vestMesh = new THREE.Mesh(vestGeo, vestMat);
  vestMesh.position.set(0, 0.04, 0);
  torsoGroup.add(vestMesh);

  // Belt
  const beltMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.4 });
  const beltGeo = new THREE.CylinderGeometry(0.265, 0.27, 0.09, 16);
  const beltMesh = new THREE.Mesh(beltGeo, beltMat);
  beltMesh.position.y = -0.12;
  torsoGroup.add(beltMesh);

  // Belt Buckle
  const buckleGeo = new THREE.BoxGeometry(0.09, 0.09, 0.04);
  const buckleMesh = new THREE.Mesh(buckleGeo, goldBuckleMat);
  buckleMesh.position.set(0, -0.12, 0.27);
  torsoGroup.add(buckleMesh);

  // Bowtie / Neck tie (for Dracula)
  const bowtieGroup = new THREE.Group();
  bowtieGroup.position.set(0, 0.23, 0.25);
  const bowtieMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.3 });
  const bowL = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.08, 4), bowtieMat);
  bowL.rotation.z = Math.PI / 2;
  bowL.position.x = -0.04;
  bowtieGroup.add(bowL);
  const bowR = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.08, 4), bowtieMat);
  bowR.rotation.z = -Math.PI / 2;
  bowR.position.x = 0.04;
  bowtieGroup.add(bowR);
  torsoGroup.add(bowtieGroup);

  // --- 2. CAPE & VAMPIRE HIGH COLLAR ---
  const capeGeo = new THREE.PlaneGeometry(0.56, 0.74, 4, 4);
  capeGeo.translate(0, -0.37, 0);
  const capeMesh = new THREE.Mesh(capeGeo, capeMat);
  capeMesh.position.set(0, 0.24, -0.23);
  capeMesh.rotation.x = 0.15;
  capeMesh.castShadow = true;
  torsoGroup.add(capeMesh);

  // Dracula high collar behind neck
  const collarGeo = new THREE.CylinderGeometry(0.26, 0.22, 0.28, 16, 1, true, Math.PI * 0.4, Math.PI * 1.2);
  const collarMesh = new THREE.Mesh(collarGeo, capeMat);
  collarMesh.position.set(0, 0.32, -0.05);
  torsoGroup.add(collarMesh);

  // --- 3. NECK & HEAD ---
  const headGroup = new THREE.Group();
  headGroup.position.set(0, 0.35, 0);
  torsoGroup.add(headGroup);

  // Neck
  const neckGeo = new THREE.CylinderGeometry(0.1, 0.11, 0.12, 12);
  const neckMesh = new THREE.Mesh(neckGeo, skinMat);
  neckMesh.position.y = 0.05;
  headGroup.add(neckMesh);

  // Head base sphere
  const headSphereGeo = new THREE.SphereGeometry(0.32, 28, 24);
  const headSphereMesh = new THREE.Mesh(headSphereGeo, skinMat);
  headSphereMesh.position.set(0, 0.32, 0);
  headSphereMesh.castShadow = true;
  headGroup.add(headSphereMesh);

  // Elf ears (for Duendecito)
  const elfEarsGroup = new THREE.Group();
  const earMat = new THREE.MeshStandardMaterial({ color: 0xfed7aa, roughness: 0.6 });
  const earGeo = new THREE.ConeGeometry(0.07, 0.22, 6);
  earGeo.rotateZ(Math.PI / 2);

  const leftEar = new THREE.Mesh(earGeo, earMat);
  leftEar.position.set(-0.35, 0.34, 0);
  leftEar.rotation.set(-0.2, 0.2, 0.4);
  elfEarsGroup.add(leftEar);

  const rightEar = new THREE.Mesh(earGeo, earMat);
  rightEar.position.set(0.35, 0.34, 0);
  rightEar.rotation.set(-0.2, -0.2, -0.4);
  elfEarsGroup.add(rightEar);
  headGroup.add(elfEarsGroup);

  // --- 4. HIGH-DEF CRISP CIRCULAR FACE ---
  // The face disc is unclipped, prominent, and framed with a golden bezel
  // Crisp, glare-free circular face material (MeshBasicMaterial prevents any specular light spots or hotspots)
  let faceTexture: THREE.CanvasTexture | null = null;
  const faceMat = new THREE.MeshBasicMaterial({
    transparent: true,
    depthWrite: false,
    polygonOffset: true,
    polygonOffsetFactor: -3,
    polygonOffsetUnits: -3,
    side: THREE.FrontSide,
  });

  // Perfectly round face disc on the FRONT of the head (+Z)
  const faceRadius = 0.27;
  const faceGeo = new THREE.CircleGeometry(faceRadius, 48);
  const facePos = faceGeo.attributes.position;
  for (let i = 0; i < facePos.count; i++) {
    const vx = facePos.getX(i);
    const vy = facePos.getY(i);
    const rSq = vx * vx + vy * vy;
    // Gentle spherical curve conforming to the child's head
    facePos.setZ(i, -rSq * 0.35);
  }
  faceGeo.computeVertexNormals();

  const faceMesh = new THREE.Mesh(faceGeo, faceMat);
  faceMesh.position.set(0, 0.32, 0.322); // strictly on the front (+Z)
  faceMesh.rotation.y = 0;
  faceMesh.renderOrder = 4;
  headGroup.add(faceMesh);

  // Golden circular bezel around the face (frames the child's photo cleanly)
  const bezelGeo = new THREE.TorusGeometry(faceRadius + 0.005, 0.012, 10, 48);
  const bezelMesh = new THREE.Mesh(bezelGeo, goldBuckleMat);
  bezelMesh.position.set(0, 0.32, 0.315);
  headGroup.add(bezelMesh);

  const applyFaceCanvas = (canvas: HTMLCanvasElement) => {
    if (faceTexture) {
      faceTexture.dispose();
    }
    faceTexture = new THREE.CanvasTexture(canvas);
    faceTexture.colorSpace = THREE.SRGBColorSpace;
    faceTexture.generateMipmaps = true;
    faceTexture.minFilter = THREE.LinearMipmapLinearFilter;
    faceTexture.magFilter = THREE.LinearFilter;
    faceTexture.anisotropy = 8;

    faceMat.map = faceTexture;
    faceMat.needsUpdate = true;
  };

  if (faceCanvas) {
    applyFaceCanvas(faceCanvas);
  }

  // --- 5. HEADWEAR (WIZARD HAT, DRACULA HAIR, ELF CAP, PUMPKIN BERET) ---
  const hatGroup = new THREE.Group();
  hatGroup.position.set(0, 0.62, 0); // elevated so it never covers the child's forehead/eyes
  hatGroup.rotation.x = -0.12; // tilted back to frame the face
  headGroup.add(hatGroup);

  // 5A. Wizard Hat Elements
  const wizardHatGroup = new THREE.Group();
  const brimGeo = new THREE.CylinderGeometry(0.54, 0.56, 0.04, 24);
  const brimMesh = new THREE.Mesh(brimGeo, hatMat);
  wizardHatGroup.add(brimMesh);

  const ribbonGeo = new THREE.CylinderGeometry(0.31, 0.33, 0.08, 24);
  const ribbonMesh = new THREE.Mesh(ribbonGeo, hatAccentMat);
  ribbonMesh.position.y = 0.06;
  wizardHatGroup.add(ribbonMesh);

  const hatBuckleGeo = new THREE.BoxGeometry(0.08, 0.08, 0.03);
  const hatBuckleMesh = new THREE.Mesh(hatBuckleGeo, goldBuckleMat);
  hatBuckleMesh.position.set(0, 0.06, 0.33);
  wizardHatGroup.add(hatBuckleMesh);

  const coneGeo = new THREE.ConeGeometry(0.3, 0.65, 24);
  coneGeo.translate(0, 0.325, 0);
  const coneMesh = new THREE.Mesh(coneGeo, hatMat);
  coneMesh.position.y = 0.08;
  coneMesh.rotation.z = -0.12;
  wizardHatGroup.add(coneMesh);
  hatGroup.add(wizardHatGroup);

  // 5B. Dracula Hair & Bat Crest
  const draculaHairGroup = new THREE.Group();
  const dracHairGeo = new THREE.SphereGeometry(0.34, 20, 16);
  dracHairGeo.scale(1.05, 0.6, 1.1);
  const dracHairMat = new THREE.MeshStandardMaterial({ color: 0x09090b, roughness: 0.3 });
  const dracHair = new THREE.Mesh(dracHairGeo, dracHairMat);
  dracHair.position.set(0, -0.06, -0.05);
  draculaHairGroup.add(dracHair);

  // Bat crest on forehead
  const batCrestGeo = new THREE.BoxGeometry(0.12, 0.06, 0.03);
  const batCrest = new THREE.Mesh(batCrestGeo, goldBuckleMat);
  batCrest.position.set(0, 0.02, 0.28);
  draculaHairGroup.add(batCrest);
  hatGroup.add(draculaHairGroup);

  // 5C. Elf Cap (Duendecito)
  const elfCapGroup = new THREE.Group();
  const elfBrimGeo = new THREE.TorusGeometry(0.33, 0.05, 10, 24);
  const elfBrim = new THREE.Mesh(elfBrimGeo, hatAccentMat);
  elfBrim.rotation.x = Math.PI / 2;
  elfCapGroup.add(elfBrim);

  const elfConeGeo = new THREE.ConeGeometry(0.32, 0.75, 24);
  elfConeGeo.translate(0, 0.375, 0);
  const elfCone = new THREE.Mesh(elfConeGeo, hatMat);
  elfCone.position.set(0, 0.04, -0.05);
  elfCone.rotation.x = -0.35; // floppy back curve
  elfCone.rotation.z = 0.15;
  elfCapGroup.add(elfCone);

  // Golden jingle bell at tip
  const bellGeo = new THREE.SphereGeometry(0.065, 12, 12);
  const bellMesh = new THREE.Mesh(bellGeo, goldBuckleMat);
  bellMesh.position.set(0.1, 0.68, -0.28);
  elfCapGroup.add(bellMesh);
  hatGroup.add(elfCapGroup);

  // 5D. Pumpkin Beret
  const pumpkinBeretGroup = new THREE.Group();
  const pBeretGeo = new THREE.SphereGeometry(0.38, 18, 14);
  pBeretGeo.scale(1.2, 0.5, 1.2);
  const pBeret = new THREE.Mesh(pBeretGeo, hatMat);
  pBeret.position.y = 0.04;
  pumpkinBeretGroup.add(pBeret);

  const pStemGeo = new THREE.CylinderGeometry(0.04, 0.06, 0.2, 8);
  const pStemMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.6 });
  const pStem = new THREE.Mesh(pStemGeo, pStemMat);
  pStem.position.set(0, 0.28, 0);
  pStem.rotation.z = -0.2;
  pumpkinBeretGroup.add(pStem);
  hatGroup.add(pumpkinBeretGroup);

  // --- 6. ARMS ---
  const armGeo = new THREE.CapsuleGeometry(0.08, 0.32, 8, 12);
  const handGeo = new THREE.SphereGeometry(0.075, 12, 12);

  // Left Arm
  const leftArmGroup = new THREE.Group();
  leftArmGroup.position.set(-0.33, 0.18, 0);
  torsoGroup.add(leftArmGroup);

  const leftArmMesh = new THREE.Mesh(armGeo, tunicMat);
  leftArmMesh.position.y = -0.16;
  leftArmMesh.castShadow = true;
  leftArmGroup.add(leftArmMesh);

  const leftHandMesh = new THREE.Mesh(handGeo, skinMat);
  leftHandMesh.position.y = -0.34;
  leftArmGroup.add(leftHandMesh);

  // Right Arm (holds trophy)
  const rightArmGroup = new THREE.Group();
  rightArmGroup.position.set(0.33, 0.18, 0);
  torsoGroup.add(rightArmGroup);

  const rightArmMesh = new THREE.Mesh(armGeo, tunicMat);
  rightArmMesh.position.y = -0.16;
  rightArmMesh.castShadow = true;
  rightArmGroup.add(rightArmMesh);

  const rightHandMesh = new THREE.Mesh(handGeo, skinMat);
  rightHandMesh.position.y = -0.34;
  rightArmGroup.add(rightHandMesh);

  // Golden Trophy in right hand
  const trophyGroup = new THREE.Group();
  trophyGroup.position.set(0, -0.36, 0.12);
  trophyGroup.scale.set(0.65, 0.65, 0.65);
  trophyGroup.visible = false;
  rightHandMesh.add(trophyGroup);

  const goldMat = new THREE.MeshStandardMaterial({
    color: 0xfbbf24,
    roughness: 0.2,
    metalness: 0.9,
  });

  const trophyBaseGeo = new THREE.CylinderGeometry(0.14, 0.18, 0.1, 16);
  trophyGroup.add(new THREE.Mesh(trophyBaseGeo, goldMat));

  const trophyStemGeo = new THREE.CylinderGeometry(0.05, 0.05, 0.16, 12);
  const trophyStemMesh = new THREE.Mesh(trophyStemGeo, goldMat);
  trophyStemMesh.position.y = 0.13;
  trophyGroup.add(trophyStemMesh);

  const trophyCupGeo = new THREE.CylinderGeometry(0.18, 0.08, 0.22, 16);
  const trophyCupMesh = new THREE.Mesh(trophyCupGeo, goldMat);
  trophyCupMesh.position.y = 0.32;
  trophyGroup.add(trophyCupMesh);

  const pumpkinGemMat = new THREE.MeshStandardMaterial({
    color: 0xf97316,
    emissive: 0xf97316,
    emissiveIntensity: 0.6,
    roughness: 0.3,
  });
  const gemMesh = new THREE.Mesh(new THREE.SphereGeometry(0.09, 12, 12), pumpkinGemMat);
  gemMesh.position.y = 0.44;
  trophyGroup.add(gemMesh);

  // --- 7. LEGS & BOOTS ---
  const legGeo = new THREE.CapsuleGeometry(0.09, 0.32, 8, 12);
  const bootGeo = new THREE.BoxGeometry(0.14, 0.14, 0.22);
  bootGeo.translate(0, -0.04, 0.04);

  // Left Leg
  const leftLegGroup = new THREE.Group();
  leftLegGroup.position.set(-0.14, 0.48, 0);
  root.add(leftLegGroup);

  const leftLegMesh = new THREE.Mesh(legGeo, tunicMat);
  leftLegMesh.position.y = -0.16;
  leftLegMesh.castShadow = true;
  leftLegGroup.add(leftLegMesh);

  const leftBootMesh = new THREE.Mesh(bootGeo, bootMat);
  leftBootMesh.position.y = -0.36;
  leftLegGroup.add(leftBootMesh);

  // Right Leg
  const rightLegGroup = new THREE.Group();
  rightLegGroup.position.set(0.14, 0.48, 0);
  root.add(rightLegGroup);

  const rightLegMesh = new THREE.Mesh(legGeo, tunicMat);
  rightLegMesh.position.y = -0.16;
  rightLegMesh.castShadow = true;
  rightLegGroup.add(rightLegMesh);

  const rightBootMesh = new THREE.Mesh(bootGeo, bootMat);
  rightBootMesh.position.y = -0.36;
  rightLegGroup.add(rightBootMesh);

  // --- COSTUME APPLIER ---
  const setCostume = (costume: AvatarCostume) => {
    // Hide all headwear subsets first
    wizardHatGroup.visible = false;
    draculaHairGroup.visible = false;
    elfCapGroup.visible = false;
    pumpkinBeretGroup.visible = false;
    collarMesh.visible = false;
    bowtieGroup.visible = false;
    elfEarsGroup.visible = false;
    vestMesh.visible = false;

    switch (costume) {
      case 'wizard':
        // Royal purple wizard / witch
        tunicMat.color.setHex(0x581c87);
        capeMat.color.setHex(0x7e22ce);
        hatMat.color.setHex(0x3b0764);
        hatAccentMat.color.setHex(0xf97316); // orange ribbon
        bootMat.color.setHex(0x1f2937);
        wizardHatGroup.visible = true;
        break;

      case 'dracula':
        // Elegant vampire / Count Dracula
        tunicMat.color.setHex(0x18181b); // black suit
        vestMat.color.setHex(0xb91c1c); // crimson vest
        vestMesh.visible = true;
        capeMat.color.setHex(0x991b1b); // blood red cape lining
        bootMat.color.setHex(0x09090b);
        collarMesh.visible = true;
        bowtieGroup.visible = true;
        draculaHairGroup.visible = true;
        break;

      case 'elf':
        // Enchanted forest elf / duendecito
        tunicMat.color.setHex(0x15803d); // forest emerald green
        capeMat.color.setHex(0xd97706); // golden amber leaf cape
        hatMat.color.setHex(0x166534); // deep green elf cap
        hatAccentMat.color.setHex(0xfacc15); // gold trim
        bootMat.color.setHex(0x78350f); // russet leather boots
        elfCapGroup.visible = true;
        elfEarsGroup.visible = true;
        break;

      case 'pumpkin':
        // Cute pumpkin warlock / aventurero
        tunicMat.color.setHex(0xea580c); // bright orange pumpkin
        capeMat.color.setHex(0x15803d); // vine green cape
        hatMat.color.setHex(0xf97316); // orange beret
        bootMat.color.setHex(0x451a03);
        pumpkinBeretGroup.visible = true;
        break;
    }
  };

  // Initialize with initial costume
  setCostume(initialCostume);

  // --- ANIMATION STATE ---
  let walkCycle = 0;
  let victoryTime = 0;

  const update = (delta: number, isMoving: boolean, isJumping: boolean, isVictory: boolean) => {
    if (isVictory) {
      victoryTime += delta * 3;
      trophyGroup.visible = true;

      // Triumph pose: right arm raised high with trophy, left hand waving!
      rightArmGroup.rotation.x = -Math.PI * 0.85;
      rightArmGroup.rotation.z = -0.25;
      rightArmGroup.rotation.y = 0.2;

      leftArmGroup.rotation.x = -Math.PI * 0.75;
      leftArmGroup.rotation.z = Math.sin(victoryTime * 3) * 0.35 + 0.3;

      leftLegGroup.rotation.x = 0;
      rightLegGroup.rotation.x = 0;
      torsoGroup.position.y = 0.75 + Math.abs(Math.sin(victoryTime * 2)) * 0.08;
      headGroup.rotation.y = Math.sin(victoryTime * 1.5) * 0.1;
      headGroup.rotation.x = -0.08;
      capeMesh.rotation.x = 0.35 + Math.sin(victoryTime * 3) * 0.15;
      return;
    }

    if (isJumping) {
      leftLegGroup.rotation.x = 0.45;
      rightLegGroup.rotation.x = -0.25;
      leftArmGroup.rotation.x = -1.2;
      rightArmGroup.rotation.x = -1.2;
      leftArmGroup.rotation.z = 0.4;
      rightArmGroup.rotation.z = -0.4;
      capeMesh.rotation.x = 0.65;
      headGroup.rotation.x = -0.15;
      return;
    }

    if (isMoving) {
      walkCycle += delta * 10;
      const legAngle = Math.sin(walkCycle) * 0.65;
      leftLegGroup.rotation.x = legAngle;
      rightLegGroup.rotation.x = -legAngle;

      const armAngle = Math.sin(walkCycle) * 0.55;
      leftArmGroup.rotation.x = -armAngle;
      rightArmGroup.rotation.x = armAngle;
      leftArmGroup.rotation.z = 0.1;
      rightArmGroup.rotation.z = -0.1;

      capeMesh.rotation.x = 0.3 + Math.abs(Math.sin(walkCycle)) * 0.2;
      torsoGroup.position.y = 0.75 + Math.abs(Math.sin(walkCycle * 2)) * 0.04;
      headGroup.rotation.z = Math.sin(walkCycle) * 0.05;
      headGroup.rotation.x = 0.05;
    } else {
      walkCycle += delta * 2;
      const breath = Math.sin(walkCycle) * 0.02;
      torsoGroup.position.y = 0.75 + breath;
      headGroup.rotation.x = breath * 0.5;
      headGroup.rotation.z = 0;
      leftLegGroup.rotation.x = 0;
      rightLegGroup.rotation.x = 0;
      leftArmGroup.rotation.x = Math.sin(walkCycle) * 0.05;
      rightArmGroup.rotation.x = -Math.sin(walkCycle) * 0.05;
      leftArmGroup.rotation.z = 0.08;
      rightArmGroup.rotation.z = -0.08;
      capeMesh.rotation.x = 0.12 + Math.sin(walkCycle) * 0.04;
    }
  };

  const getFaceWorldPosition = (): THREE.Vector3 => {
    const v = new THREE.Vector3();
    faceMesh.getWorldPosition(v);
    return v;
  };

  return {
    group: root,
    update,
    updateFaceTexture: applyFaceCanvas,
    setCostume,
    getFaceWorldPosition,
  };
}
