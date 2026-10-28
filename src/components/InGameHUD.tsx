import React from 'react';
import { Volume2, VolumeX, Camera, Gamepad2 } from 'lucide-react';
import { soundManager } from '../utils/audio';

interface InGameHUDProps {
  childName: string;
  candiesCollected: number;
  totalCandies: number;
  faceDataUrl: string | null;
  isMuted: boolean;
  onToggleMute: () => void;
  cameraViewMode: 'back' | 'front';
  onToggleCamera: () => void;
  interactivePumpkinCount: number;
  recordingSeconds?: number;
  showTouchControls?: boolean;
  onToggleTouchControls?: () => void;
  hasTouchDevice?: boolean;
}

export const InGameHUD: React.FC<InGameHUDProps> = ({
  childName,
  candiesCollected,
  totalCandies,
  faceDataUrl,
  isMuted,
  onToggleMute,
  cameraViewMode,
  onToggleCamera,
  interactivePumpkinCount,
  recordingSeconds = 0,
  showTouchControls = true,
  onToggleTouchControls,
  hasTouchDevice = false,
}) => {
  const formatTime = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="absolute inset-0 pointer-events-none select-none z-10 flex flex-col justify-between p-2 sm:p-3 md:p-5 safe-p-top safe-p-left safe-p-right">
      {/* Top Bar */}
      <div className="flex justify-between items-center w-full max-w-5xl mx-auto pointer-events-auto gap-1.5 sm:gap-2">
        {/* Child Avatar & Name pill */}
        <div className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full bg-slate-950/90 border-2 border-purple-500/50 shadow-lg max-w-[40%] sm:max-w-none">
          {faceDataUrl ? (
            <img
              src={faceDataUrl}
              alt={childName}
              className="w-6 h-6 sm:w-8 sm:h-8 rounded-full border border-orange-400 object-cover flex-shrink-0"
            />
          ) : (
            <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-purple-700 flex items-center justify-center text-xs flex-shrink-0">
              🎃
            </div>
          )}
          <div className="min-w-0">
            <div className="text-[8px] sm:text-[10px] text-purple-300 font-semibold uppercase leading-none truncate">
              Aventurero
            </div>
            <div className="text-[11px] sm:text-sm font-black text-amber-300 leading-tight truncate">
              {childName || 'Amiguito'}
            </div>
          </div>
        </div>

        {/* Center / Right status */}
        <div className="flex items-center gap-1 sm:gap-1.5 md:gap-2">
          {/* Live Recording Badge with active timer */}
          <div className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-full bg-red-950/90 border border-red-500/80 text-[9px] sm:text-xs font-black text-red-200 shadow-lg">
            <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-red-500 flex-shrink-0 animate-pulse" />
            <span className="tracking-wider">REC {formatTime(recordingSeconds)}</span>
          </div>

          {/* Candies Counter */}
          <div className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full bg-slate-950/90 border-2 border-orange-500/60 shadow-lg">
            <span className="text-xs sm:text-sm">🍬</span>
            <span className="text-[11px] sm:text-sm font-black text-orange-200">
              {candiesCollected}/{totalCandies}
            </span>
          </div>

          {/* Interactive pumpkin indicator if touched */}
          {interactivePumpkinCount > 0 && (
            <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-amber-500/30 border border-amber-400/60 text-xs font-bold text-amber-200">
              <span>🎃</span>
              <span>¡Magia!</span>
            </div>
          )}

          {/* Camera View Toggle */}
          <button
            type="button"
            onClick={onToggleCamera}
            className={`p-1.5 sm:px-2.5 sm:py-1.5 rounded-full border text-xs font-bold flex items-center gap-1 active:scale-95 transition-all shadow cursor-pointer ${
              cameraViewMode === 'front'
                ? 'bg-amber-500 text-slate-950 border-amber-300'
                : 'bg-slate-950/80 border-purple-400/40 text-purple-200 hover:text-white'
            }`}
            title={cameraViewMode === 'front' ? 'Ver espalda' : 'Ver rostro de frente'}
          >
            <Camera className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span className="hidden md:inline text-[11px]">
              {cameraViewMode === 'front' ? 'Espalda' : 'Rostro'}
            </span>
          </button>

          {/* Touch Controls Toggle button (useful if on touch laptop or user wants to hide/show buttons) */}
          {hasTouchDevice && onToggleTouchControls && (
            <button
              type="button"
              onClick={onToggleTouchControls}
              className={`p-1.5 sm:p-2 rounded-full border text-xs font-bold flex items-center justify-center active:scale-95 transition-all shadow cursor-pointer ${
                showTouchControls
                  ? 'bg-purple-900/80 border-purple-400/60 text-amber-300'
                  : 'bg-slate-950/80 border-purple-400/30 text-purple-400'
              }`}
              title={showTouchControls ? 'Ocultar controles en pantalla' : 'Mostrar controles en pantalla'}
            >
              <Gamepad2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
          )}

          {/* Sound / Music Toggle */}
          <button
            type="button"
            onClick={() => {
              const next = !isMuted;
              soundManager.setMuted(next);
              onToggleMute();
            }}
            className="p-1.5 sm:p-2 rounded-full bg-slate-950/80 border border-purple-400/40 text-purple-200 hover:text-white active:scale-95 transition-all shadow cursor-pointer"
            aria-label={isMuted ? 'Activar sonido' : 'Silenciar sonido'}
            title={isMuted ? 'Activar sonido' : 'Silenciar'}
          >
            {isMuted ? (
              <VolumeX className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-red-400" />
            ) : (
              <Volume2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-400" />
            )}
          </button>
        </div>
      </div>

      {/* Guide hint at bottom center (hidden when touch controls are shown on mobile) */}
      <div className="hidden lg:block text-center pointer-events-none pb-2">
        <span className="px-4 py-1.5 rounded-full bg-slate-950/85 border border-purple-500/30 text-[11px] text-purple-300 font-medium shadow-md">
          Presiona <kbd className="px-1.5 py-0.5 rounded bg-purple-900 border border-purple-400 text-white font-bold">W A S D</kbd> o <kbd className="px-1.5 py-0.5 rounded bg-purple-900 border border-purple-400 text-white font-bold">Flechas</kbd> para caminar • <kbd className="px-1.5 py-0.5 rounded bg-purple-900 border border-purple-400 text-white font-bold">Espacio</kbd> para saltar
        </span>
      </div>
    </div>
  );
};
