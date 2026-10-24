import * as THREE from 'three';

interface ConfettiPiece {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  rotation: THREE.Euler;
  rotSpeed: THREE.Vector3;
  scale: THREE.Vector3;
  color: THREE.Color;
}

export interface ConfettiSystem {
  group: THREE.Group;
  burst: (origin: THREE.Vector3) => void;
  update: (delta: number) => boolean; // returns true when finished settling
  reset: () => void;
}

export function create3DConfettiSystem(count = 280): ConfettiSystem {
  const group = new THREE.Group();
  group.name = 'Confetti3DSystem';

  // Halloween color palette: violet, purple, vibrant orange, warm yellow/gold
  const palette = [
    new THREE.Color(0x9333ea), // Purple
    new THREE.Color(0xa855f7), // Light purple
    new THREE.Color(0x7e22ce), // Deep purple
    new THREE.Color(0xf97316), // Orange
    new THREE.Color(0xea580c), // Deep orange
    new THREE.Color(0xfb923c), // Light orange
    new THREE.Color(0xfacc15), // Warm gold
    new THREE.Color(0xfef08a), // Pale yellow
  ];

  const pieces: ConfettiPiece[] = [];
  const dummy = new THREE.Object3D();

  // InstancedMesh for zero draw-call overhead and silky performance!
  const pieceGeo = new THREE.PlaneGeometry(0.12, 0.08);
  const pieceMat = new THREE.MeshBasicMaterial({
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.95,
  });

  const instancedMesh = new THREE.InstancedMesh(pieceGeo, pieceMat, count);
  instancedMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  instancedMesh.frustumCulled = false;
  group.add(instancedMesh);

  let isActive = false;
  let settledCount = 0;

  // Initialize invisible pool
  for (let i = 0; i < count; i++) {
    const col = palette[i % palette.length];
    instancedMesh.setColorAt(i, col);

    pieces.push({
      position: new THREE.Vector3(0, -50, 0),
      velocity: new THREE.Vector3(),
      rotation: new THREE.Euler(),
      rotSpeed: new THREE.Vector3(),
      scale: new THREE.Vector3(1, 1, 1),
      color: col,
    });

    dummy.position.set(0, -50, 0);
    dummy.updateMatrix();
    instancedMesh.setMatrixAt(i, dummy.matrix);
  }
  if (instancedMesh.instanceColor) instancedMesh.instanceColor.needsUpdate = true;
  instancedMesh.instanceMatrix.needsUpdate = true;

  const burst = (origin: THREE.Vector3) => {
    isActive = true;
    settledCount = 0;

    for (let i = 0; i < count; i++) {
      const p = pieces[i];
      // Spawn around origin with slight spread
      p.position.set(
        origin.x + (Math.random() - 0.5) * 1.5,
        origin.y + 0.8 + Math.random() * 0.8,
        origin.z + (Math.random() - 0.5) * 1.5
      );

      // Explosive upward and outward fountain velocity
      const angle = Math.random() * Math.PI * 2;
      const speedOut = 2.5 + Math.random() * 5.5;
      const speedUp = 5.0 + Math.random() * 6.5;

      p.velocity.set(
        Math.cos(angle) * speedOut,
        speedUp,
        Math.sin(angle) * speedOut
      );

      // Random tumbling speeds
      p.rotSpeed.set(
        (Math.random() - 0.5) * 15,
        (Math.random() - 0.5) * 15,
        (Math.random() - 0.5) * 15
      );

      p.scale.set(
        0.8 + Math.random() * 0.6,
        0.8 + Math.random() * 0.6,
        1
      );
    }
  };

  const update = (delta: number): boolean => {
    if (!isActive) return false;

    settledCount = 0;
    const gravity = -9.8;
    const drag = 0.96;

    for (let i = 0; i < count; i++) {
      const p = pieces[i];

      if (p.position.y <= 0.05) {
        // Settled on the ground
        p.position.y = 0.05;
        p.velocity.set(0, 0, 0);
        p.rotSpeed.set(0, 0, 0);
        settledCount++;
      } else {
        // Integrate physics
        p.velocity.y += gravity * delta;
        p.velocity.x *= drag;
        p.velocity.z *= drag;

        // Flutter oscillation simulation
        p.position.x += p.velocity.x * delta + Math.sin(p.rotation.x * 2) * 0.02;
        p.position.y += p.velocity.y * delta;
        p.position.z += p.velocity.z * delta + Math.cos(p.rotation.z * 2) * 0.02;

        p.rotation.x += p.rotSpeed.x * delta;
        p.rotation.y += p.rotSpeed.y * delta;
        p.rotation.z += p.rotSpeed.z * delta;
      }

      dummy.position.copy(p.position);
      dummy.rotation.copy(p.rotation);
      dummy.scale.copy(p.scale);
      dummy.updateMatrix();
      instancedMesh.setMatrixAt(i, dummy.matrix);
    }

    instancedMesh.instanceMatrix.needsUpdate = true;

    // Check if nearly all have settled
    return settledCount >= count * 0.9;
  };

  const reset = () => {
    isActive = false;
    settledCount = 0;
    for (let i = 0; i < count; i++) {
      pieces[i].position.set(0, -50, 0);
      dummy.position.set(0, -50, 0);
      dummy.updateMatrix();
      instancedMesh.setMatrixAt(i, dummy.matrix);
    }
    instancedMesh.instanceMatrix.needsUpdate = true;
  };

  return {
    group,
    burst,
    update,
    reset,
  };
}
