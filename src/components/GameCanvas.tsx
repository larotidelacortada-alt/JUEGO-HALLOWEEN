import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { GameState, InputState, CollectibleItem, AvatarCostume } from '../types/game';
import { createHalloweenAvatar, CharacterController } from './3d/character';
import { createHalloweenWorld, WorldObjects } from './3d/world';
import { createArrivalSign, ArrivalSignObject } from './3d/arrivalSign';
import { createStartSign } from './3d/startSign';
import { create3DConfettiSystem, ConfettiSystem } from './3d/confetti';
import { soundManager } from '../utils/audio';

interface GameCanvasProps {
  gameState: GameState;
  childName: string;
  faceCanvas?: HTMLCanvasElement;
  costume?: AvatarCostume;
  inputState: InputState;
  cameraViewMode?: 'back' | 'front';
  onCandyCollected: (candy: CollectibleItem) => void;
  onPumpkinTrigger: () => void;
  onArrivalTriggered: () => void;
  onVictorySettled: () => void;
  onCanvasReady?: (canvas: HTMLCanvasElement) => void;
}

export const GameCanvas: React.FC<GameCanvasProps> = ({
  gameState,
  childName,
  faceCanvas,
  costume = 'wizard',
  inputState,
  cameraViewMode = 'back',
  onCandyCollected,
  onPumpkinTrigger,
  onArrivalTriggered,
  onVictorySettled,
  onCanvasReady,
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);

  // Store mutable game references across renders
  const stateRef = useRef({
    gameState,
    childName,
    inputState,
    faceCanvas,
    costume,
    cameraViewMode,
  });

  useEffect(() => {
    stateRef.current.gameState = gameState;
    stateRef.current.childName = childName;
    stateRef.current.inputState = inputState;
    stateRef.current.faceCanvas = faceCanvas;
    stateRef.current.costume = costume;
    stateRef.current.cameraViewMode = cameraViewMode;
  }, [gameState, childName, inputState, faceCanvas, costume, cameraViewMode]);

  const callbacksRef = useRef({
    onCandyCollected,
    onPumpkinTrigger,
    onArrivalTriggered,
    onVictorySettled,
  });

  useEffect(() => {
    callbacksRef.current = {
      onCandyCollected,
      onPumpkinTrigger,
      onArrivalTriggered,
      onVictorySettled,
    };
  });

  // Keep references to 3D submodules
  const signRef = useRef<ArrivalSignObject | null>(null);
  const avatarRef = useRef<CharacterController | null>(null);
  const confettiRef = useRef<ConfettiSystem | null>(null);

  useEffect(() => {
    if (signRef.current && childName) {
      signRef.current.updateName(childName);
    }
  }, [childName]);

  useEffect(() => {
    if (avatarRef.current && faceCanvas) {
      avatarRef.current.updateFaceTexture(faceCanvas);
    }
  }, [faceCanvas]);

  useEffect(() => {
    if (avatarRef.current && costume) {
      avatarRef.current.setCostume(costume);
    }
  }, [costume]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // Detect software WebGL
    const isSoftwareGl = (() => {
      const gl = document.createElement('canvas').getContext('webgl2');
      if (!gl) return true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    // 1. RENDERER SETUP
    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance',
      preserveDrawingBuffer: true, // required for clean video capture & snapshots
    });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.appendChild(renderer.domElement);
    if (onCanvasReady) {
      onCanvasReady(renderer.domElement);
    }

    // 2. SCENE & ENVIRONMENT
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x180b2b);
    scene.fog = new THREE.FogExp2(0x180b2b, 0.022);

    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    // Helper function to calculate responsive camera FOV based on screen aspect ratio
    const computeFov = (aspect: number) => {
      if (aspect < 0.6) {
        // Narrow portrait smartphone (e.g. 9:19.5, 9:20)
        return Math.min(76, 54 + (0.75 - aspect) * 40);
      }
      if (aspect < 1.0) {
        // Portrait phone or tablet (e.g. 3:4 or 9:16)
        return 62;
      }
      if (aspect < 1.35) {
        // Square or iPad tablet aspect
        return 57;
      }
      // Standard landscape desktop monitor / laptop
      return 53;
    };

    const initialWidth = container.clientWidth || window.innerWidth;
    const initialHeight = container.clientHeight || window.innerHeight;
    const initialAspect = initialWidth / initialHeight;

    // 3. CAMERA SETUP
    const camera = new THREE.PerspectiveCamera(
      computeFov(initialAspect),
      initialAspect,
      0.1,
      200
    );
    camera.position.set(0, 3, -6);

    // 4. LIGHTING RIG
    // Key light (warm directional)
    const keyLight = new THREE.DirectionalLight(0xffedd5, 1.6);
    keyLight.position.set(12, 22, 10);
    keyLight.castShadow = !isSoftwareGl;
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
    keyLight.shadow.camera.near = 0.5;
    keyLight.shadow.camera.far = 80;
    keyLight.shadow.camera.left = -20;
    keyLight.shadow.camera.right = 20;
    keyLight.shadow.camera.top = 20;
    keyLight.shadow.camera.bottom = -20;
    keyLight.shadow.bias = -0.0005;
    scene.add(keyLight);

    // Cool fill light (Hemisphere)
    const hemiLight = new THREE.HemisphereLight(0x7c3aed, 0x180b2b, 1.1);
    scene.add(hemiLight);

    // Subtle rim backlight
    const rimLight = new THREE.DirectionalLight(0xf97316, 0.7);
    rimLight.position.set(-10, 15, -15);
    scene.add(rimLight);

    // 5. BUILD SCENE OBJECTS
    const world: WorldObjects = createHalloweenWorld();
    scene.add(world.group);

    const avatar: CharacterController = createHalloweenAvatar(
      stateRef.current.faceCanvas,
      stateRef.current.costume
    );
    avatarRef.current = avatar;
    // Initial position in front of start gate, facing camera so face is visible
    avatar.group.position.set(0, 0, -2.4);
    avatar.group.rotation.y = Math.PI;
    scene.add(avatar.group);

    const sign: ArrivalSignObject = createArrivalSign(stateRef.current.childName);
    signRef.current = sign;
    // Position sign at the end of the cobblestone path at Z = 80
    sign.group.position.set(world.group.position.x, 0, 80);
    scene.add(sign.group);

    // Cartel de Largada: positioned at the starting gate of the path at Z = 0
    const startSign = createStartSign();
    startSign.group.position.set(0, 0, 0);
    scene.add(startSign.group);

    const confetti: ConfettiSystem = create3DConfettiSystem(320);
    confettiRef.current = confetti;
    scene.add(confetti.group);

    // 6. PLAYER CONTROLLER STATE
    // The player starts in front of the start gate (Z = -2.4), facing the camera (angle = PI)
    // so their face and costume are clearly visible before the run begins!
    const playerPos = new THREE.Vector3(0, 0, -2.4);
    let playerYVel = 0;
    let isGrounded = true;
    let playerFacingAngle = Math.PI; // Facing camera so face is visible before starting
    const playerSpeed = 7.2; // comfortable, responsive walking speed
    const jumpSpeed = 6.8;
    const gravity = -18.0;

    let hasTriggeredArrival = false;
    let victorySettledReported = false;
    let lastGameState = stateRef.current.gameState;

    // Smooth camera target: initial frame places the player in front of the gate with their face clearly visible
    const currentCamPos = new THREE.Vector3(0, 2.2, -7.5);
    const currentLookAt = new THREE.Vector3(0, 1.25, -0.6);

    // 7. GAME ANIMATION LOOP
    const clock = new THREE.Clock();
    let frameId = 0;

    function tick() {
      const delta = Math.min(clock.getDelta(), 0.1);
      const currentGameState = stateRef.current.gameState;
      const inputs = stateRef.current.inputState;

      // Handle transition to PLAYING (fresh start or replay):
      // Reset player in front of gate, facing the camera with face clearly visible
      if (lastGameState !== 'PLAYING' && currentGameState === 'PLAYING') {
        playerPos.set(0, 0, -2.4);
        playerYVel = 0;
        isGrounded = true;
        playerFacingAngle = Math.PI;
        hasTriggeredArrival = false;
        victorySettledReported = false;
        currentCamPos.set(0, 2.2, -7.5);
        currentLookAt.set(0, 1.25, -0.6);
        camera.position.copy(currentCamPos);
        camera.lookAt(currentLookAt);
      }
      lastGameState = currentGameState;

      // Update world animations (pumpkins, candies, flying ghosts, witches)
      world.update(delta);
      startSign.group.visible = (currentGameState !== 'START');

      const isPlaying = currentGameState === 'PLAYING';
      const isArrivalOrVictory = currentGameState === 'ARRIVAL' || currentGameState === 'VICTORY';

      if (isPlaying) {
        // --- MOVEMENT PHYSICS ---
        let moveX = 0;
        let moveZ = 0;

        if (inputs.forward) moveZ += 1;
        if (inputs.backward) moveZ -= 1;
        if (inputs.left) moveX += 1;
        if (inputs.right) moveX -= 1;

        const isMoving = moveX !== 0 || moveZ !== 0;

        if (isMoving) {
          const moveLen = Math.sqrt(moveX * moveX + moveZ * moveZ);
          const normX = moveX / moveLen;
          const normZ = moveZ / moveLen;

          const targetAngle = Math.atan2(normX, normZ);
          // Smooth rotation towards travel direction
          const diff = Math.atan2(Math.sin(targetAngle - playerFacingAngle), Math.cos(targetAngle - playerFacingAngle));
          playerFacingAngle += diff * Math.min(1, delta * 14);

          const nextX = playerPos.x + normX * playerSpeed * delta;
          const nextZ = playerPos.z + normZ * playerSpeed * delta;

          // Check boundary
          if (world.isInsidePlayableBounds(nextX, nextZ)) {
            playerPos.x = nextX;
            playerPos.z = nextZ;
          } else {
            // Slide along valid axis
            if (world.isInsidePlayableBounds(playerPos.x, nextZ)) {
              playerPos.z = nextZ;
            } else if (world.isInsidePlayableBounds(nextX, playerPos.z)) {
              playerPos.x = nextX;
            }
          }
        }

        // --- JUMP PHYSICS ---
        if (inputs.jump && isGrounded) {
          playerYVel = jumpSpeed;
          isGrounded = false;
          soundManager.playJump();
        }

        if (!isGrounded) {
          playerYVel += gravity * delta;
          playerPos.y += playerYVel * delta;

          if (playerPos.y <= 0) {
            playerPos.y = 0;
            playerYVel = 0;
            isGrounded = true;
          }
        }

        avatar.group.position.copy(playerPos);
        avatar.group.rotation.y = playerFacingAngle;
        avatar.update(delta, isMoving, !isGrounded, false);

        // Check candy collectibles
        world.checkCandyCollisions(playerPos, (candy) => {
          soundManager.playCandyChime();
          callbacksRef.current.onCandyCollected(candy);
        });

        // Check interactive pumpkin
        world.checkPumpkinCollision(playerPos, () => {
          soundManager.playPumpkinMagic();
          callbacksRef.current.onPumpkinTrigger();
        });

        // --- ARRIVAL COLLISION CHECK ---
        // Arrival gate is at Z = 80
        if (!hasTriggeredArrival && playerPos.z >= 78.5) {
          hasTriggeredArrival = true;
          soundManager.playVictoryFanfare();
          // Trigger 3D confetti burst at player position!
          confetti.burst(new THREE.Vector3(playerPos.x, playerPos.y + 1, playerPos.z));
          callbacksRef.current.onArrivalTriggered();
        }

        // --- 3RD PERSON FOLLOW CAMERA ---
        // Support rear follow or front selfie camera
        const isFrontCam = stateRef.current.cameraViewMode === 'front';
        const targetCamX = playerPos.x;
        const targetCamY = playerPos.y + (isFrontCam ? 1.8 : 2.5);
        const targetCamZ = isFrontCam ? playerPos.z + 4.2 : playerPos.z - 5.5;

        currentCamPos.x = THREE.MathUtils.damp(currentCamPos.x, targetCamX, 6.0, delta);
        currentCamPos.y = THREE.MathUtils.damp(currentCamPos.y, targetCamY, 6.0, delta);
        currentCamPos.z = THREE.MathUtils.damp(currentCamPos.z, targetCamZ, 6.0, delta);

        currentLookAt.x = THREE.MathUtils.damp(currentLookAt.x, playerPos.x, 7.0, delta);
        currentLookAt.y = THREE.MathUtils.damp(currentLookAt.y, playerPos.y + 1.2, 7.0, delta);
        currentLookAt.z = THREE.MathUtils.damp(currentLookAt.z, isFrontCam ? playerPos.z : playerPos.z + 1.5, 7.0, delta);

        camera.position.copy(currentCamPos);
        camera.lookAt(currentLookAt);

      } else if (isArrivalOrVictory) {
        // --- VICTORY STATE ---
        // 1. Move player past the finish line (Z = 79.4) and stand beside the sign (X = 1.45, Z = 80.8)
        // so the player DOES NOT block the arrival sign and their custom face is 100% visible!
        const targetArrivalX = 1.45;
        const targetArrivalZ = 80.8;
        playerPos.x = THREE.MathUtils.damp(playerPos.x, targetArrivalX, 3.2, delta);
        playerPos.z = THREE.MathUtils.damp(playerPos.z, targetArrivalZ, 3.2, delta);
        avatar.group.position.copy(playerPos);

        // 2. Rotate player to face the camera (+Z) with a slight 10° turn toward center
        avatar.group.rotation.y = THREE.MathUtils.damp(avatar.group.rotation.y, -0.18, 5.0, delta);
        avatar.update(delta, false, false, true);

        // Update 3D confetti
        const settled = confetti.update(delta);
        if (settled && !victorySettledReported) {
          victorySettledReported = true;
          callbacksRef.current.onVictorySettled();
        }

        // 3. Cinematic victory framing:
        // Position camera in front (+Z) looking back towards the sign (at X=0, Z=80)
        // and the player (at X=1.45, Z=80.8) holding the golden trophy!
        const currentAspect = container
          ? (container.clientWidth || window.innerWidth) / (container.clientHeight || window.innerHeight || 1)
          : window.innerWidth / (window.innerHeight || 1);
        const isPortrait = currentAspect < 1.0;
        const victoryCamX = isPortrait ? 0.35 : 0.55;
        const victoryCamY = isPortrait ? 2.25 : 2.1;
        const victoryCamZ = isPortrait ? 86.6 : 85.8; // Back up slightly on narrow portrait phones to frame sign + kid

        currentCamPos.x = THREE.MathUtils.damp(currentCamPos.x, victoryCamX, 3.5, delta);
        currentCamPos.y = THREE.MathUtils.damp(currentCamPos.y, victoryCamY, 3.5, delta);
        currentCamPos.z = THREE.MathUtils.damp(currentCamPos.z, victoryCamZ, 3.5, delta);

        // Look at midpoint between arrival sign and player
        const lookTargetX = isPortrait ? 0.5 : 0.65;
        const lookTargetY = isPortrait ? 1.9 : 1.8;
        const lookTargetZ = 80.2;

        currentLookAt.x = THREE.MathUtils.damp(currentLookAt.x, lookTargetX, 4.0, delta);
        currentLookAt.y = THREE.MathUtils.damp(currentLookAt.y, lookTargetY, 4.0, delta);
        currentLookAt.z = THREE.MathUtils.damp(currentLookAt.z, lookTargetZ, 4.0, delta);

        camera.position.copy(currentCamPos);
        camera.lookAt(currentLookAt);

      } else {
        // Idle preview on START screen:
        // Position camera in FRONT of the avatar (+Z) so the kid and parent can see the custom face!
        avatar.group.position.set(0, 0, 0);
        avatar.group.rotation.y = Math.sin(Date.now() * 0.0015) * 0.18; // gentle friendly sway
        avatar.update(delta, false, false, false);

        const currentAspect = container
          ? (container.clientWidth || window.innerWidth) / (container.clientHeight || window.innerHeight || 1)
          : window.innerWidth / (window.innerHeight || 1);
        if (currentAspect < 0.7) {
          camera.position.set(0, 1.4, 3.2);
        } else {
          camera.position.set(0, 1.35, 2.7);
        }
        camera.lookAt(0, 1.05, 0);
      }

      renderer.render(scene, camera);
      frameId = requestAnimationFrame(tick);
    }

    frameId = requestAnimationFrame(tick);

    // Responsive resize handler with dynamic FOV calculation
    const handleResize = () => {
      if (!container) return;
      const width = container.clientWidth || window.innerWidth;
      const height = container.clientHeight || window.innerHeight;
      const aspect = width / height;
      camera.aspect = aspect;
      camera.fov = computeFov(aspect);
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
      cancelAnimationFrame(frameId);
      renderer.dispose();
      if (renderer.domElement.parentElement) {
        renderer.domElement.parentElement.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div
      ref={mountRef}
      className="w-full h-full absolute inset-0 overflow-hidden select-none bg-slate-950"
      style={{ touchAction: 'none' }}
    />
  );
};
