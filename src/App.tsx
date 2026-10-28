import { useState, useEffect, useRef, useCallback } from 'react';
import { GameState, InputState, CollectibleItem, AvatarCostume } from './types/game';
import { GameCanvas } from './components/GameCanvas';
import { StartScreen } from './components/StartScreen';
import { InGameHUD } from './components/InGameHUD';
import { TouchControls } from './components/TouchControls';
import { VictoryOverlay } from './components/VictoryOverlay';
import { VideoRecorder, RecordedVideoResult } from './utils/videoRecorder';
import { soundManager } from './utils/audio';

export default function App() {
  const [gameState, setGameState] = useState<GameState>('START');
  const [childName, setChildName] = useState<string>('Santino');
  const [costume, setCostume] = useState<AvatarCostume>('wizard');
  const [faceCanvas, setFaceCanvas] = useState<HTMLCanvasElement | undefined>();
  const [faceDataUrl, setFaceDataUrl] = useState<string | null>(null);

  // In-game score: 5 candies (fast, fun course for children)
  const [candiesCount, setCandiesCount] = useState<number>(0);
  const totalCandies = 5;
  const [interactivePumpkinHits, setInteractivePumpkinHits] = useState<number>(0);

  // Audio mute & Camera view
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [cameraViewMode, setCameraViewMode] = useState<'back' | 'front'>('back');

  // Video recording
  const [recordedVideo, setRecordedVideo] = useState<RecordedVideoResult | null>(null);
  const [isFinalizingRecording, setIsFinalizingRecording] = useState<boolean>(false);
  const [recordingSeconds, setRecordingSeconds] = useState<number>(0);
  const videoRecorderRef = useRef<VideoRecorder>(new VideoRecorder());
  const canvasElementRef = useRef<HTMLCanvasElement | null>(null);

  // Live recording timer update
  useEffect(() => {
    if (gameState !== 'PLAYING' && gameState !== 'ARRIVAL') return;
    const interval = setInterval(() => {
      setRecordingSeconds(videoRecorderRef.current.getElapsedTimeSeconds());
    }, 500);
    return () => clearInterval(interval);
  }, [gameState]);

  // Input state
  const [inputState, setInputState] = useState<InputState>({
    forward: false,
    backward: false,
    left: false,
    right: false,
    jump: false,
  });

  // Touch device and tablet / mobile screen detection
  const [isTouchDevice, setIsTouchDevice] = useState<boolean>(false);
  const [showTouchControls, setShowTouchControls] = useState<boolean>(true);

  useEffect(() => {
    const checkTouch = () => {
      const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      const isMobileOrTablet = window.innerWidth <= 1024;
      setIsTouchDevice(hasTouch || isMobileOrTablet);
    };
    checkTouch();
    window.addEventListener('resize', checkTouch);
    return () => window.removeEventListener('resize', checkTouch);
  }, []);

  // Update inputs safely
  const updateInput = useCallback((partial: Partial<InputState>) => {
    setInputState((prev) => ({ ...prev, ...partial }));
  }, []);

  // Keyboard Event Handlers
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent browser scrolling with arrows and space while playing
      if (gameState === 'PLAYING') {
        if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
          e.preventDefault();
        }
      }

      if (gameState !== 'PLAYING') return;

      switch (e.code) {
        case 'KeyW':
        case 'ArrowUp':
          updateInput({ forward: true });
          break;
        case 'KeyS':
        case 'ArrowDown':
          updateInput({ backward: true });
          break;
        case 'KeyA':
        case 'ArrowLeft':
          updateInput({ left: true });
          break;
        case 'KeyD':
        case 'ArrowRight':
          updateInput({ right: true });
          break;
        case 'Space':
          updateInput({ jump: true });
          break;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (gameState !== 'PLAYING') return;

      switch (e.code) {
        case 'KeyW':
        case 'ArrowUp':
          updateInput({ forward: false });
          break;
        case 'KeyS':
        case 'ArrowDown':
          updateInput({ backward: false });
          break;
        case 'KeyA':
        case 'ArrowLeft':
          updateInput({ left: false });
          break;
        case 'KeyD':
        case 'ArrowRight':
          updateInput({ right: false });
          break;
        case 'Space':
          updateInput({ jump: false });
          break;
      }
    };

    const handleBlur = () => {
      // Clear movement keys if window loses focus
      setInputState({
        forward: false,
        backward: false,
        left: false,
        right: false,
        jump: false,
      });
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleBlur);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleBlur);
    };
  }, [gameState, updateInput]);

  // Start the Adventure
  const handleStartGame = () => {
    setCandiesCount(0);
    setInteractivePumpkinHits(0);
    setRecordedVideo(null);
    setIsFinalizingRecording(false);
    setRecordingSeconds(0);
    videoRecorderRef.current.cleanup();

    setGameState('PLAYING');
    soundManager.startMusic();

    // Start video recording with canvas stream and audio track
    if (canvasElementRef.current) {
      const audioTrack = soundManager.getAudioTrack();
      videoRecorderRef.current.startRecording(canvasElementRef.current, audioTrack);
    }
  };

  // Arrival Triggered: Character reaches finish line
  const handleArrivalTriggered = () => {
    // Stop all player movements
    setInputState({
      forward: false,
      backward: false,
      left: false,
      right: false,
      jump: false,
    });

    setGameState('ARRIVAL');

    // Keep recording through the full arrival ceremony:
    // Character walking past line, stepping to side, facing front, waving and raising trophy,
    // confetti fireworks, and final mission completed display.
    setIsFinalizingRecording(true);
    setTimeout(async () => {
      const result = await videoRecorderRef.current.stopRecording();
      setRecordedVideo(result);
      setIsFinalizingRecording(false);
      setGameState('VICTORY');
    }, 4500);
  };

  // Replay
  const handlePlayAgain = () => {
    soundManager.stopMusic();
    setGameState('START');
  };

  return (
    <div className="relative w-full h-[100dvh] min-h-[100dvh] max-h-[100dvh] overflow-hidden bg-slate-950 font-sans text-white select-none">
      {/* 3D WebGL Canvas Layer */}
      <GameCanvas
        gameState={gameState}
        childName={childName}
        faceCanvas={faceCanvas}
        costume={costume}
        inputState={inputState}
        cameraViewMode={cameraViewMode}
        onCandyCollected={(_candy: CollectibleItem) => {
          setCandiesCount((prev) => prev + 1);
        }}
        onPumpkinTrigger={() => {
          setInteractivePumpkinHits((prev) => prev + 1);
        }}
        onArrivalTriggered={handleArrivalTriggered}
        onVictorySettled={() => {
          // Keep game in victory state permanently
        }}
        onCanvasReady={(canvas) => {
          canvasElementRef.current = canvas;
        }}
      />

      {/* Start Screen Modal */}
      {gameState === 'START' && (
        <StartScreen
          childName={childName}
          costume={costume}
          onCostumeChange={setCostume}
          onNameChange={setChildName}
          onFaceReady={(canvas, dataUrl) => {
            setFaceCanvas(canvas);
            setFaceDataUrl(dataUrl);
          }}
          onStartGame={handleStartGame}
        />
      )}

      {/* In-Game HUD during PLAYING */}
      {gameState === 'PLAYING' && (
        <>
          <InGameHUD
            childName={childName}
            candiesCollected={candiesCount}
            totalCandies={totalCandies}
            faceDataUrl={faceDataUrl}
            isMuted={isMuted}
            onToggleMute={() => setIsMuted(soundManager.getMuted())}
            cameraViewMode={cameraViewMode}
            onToggleCamera={() =>
              setCameraViewMode((prev) => (prev === 'back' ? 'front' : 'back'))
            }
            interactivePumpkinCount={interactivePumpkinHits}
            recordingSeconds={recordingSeconds}
            showTouchControls={showTouchControls}
            onToggleTouchControls={() => setShowTouchControls((prev) => !prev)}
            hasTouchDevice={isTouchDevice}
          />

          {/* On-screen controls for mobile/touch screens */}
          {isTouchDevice && showTouchControls && (
            <TouchControls onInputUpdate={updateInput} />
          )}
        </>
      )}

      {/* Victory Celebration & Final Frozen Screen */}
      {(gameState === 'ARRIVAL' || gameState === 'VICTORY') && (
        <VictoryOverlay
          childName={childName}
          candiesCount={candiesCount}
          recordedVideo={recordedVideo}
          isFinalizingRecording={isFinalizingRecording}
          onPlayAgain={handlePlayAgain}
        />
      )}
    </div>
  );
}
