import React from 'react';
import { Volume2, VolumeX, Camera } from 'lucide-react';
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
}) => {
  const formatTime = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="absolute inset-0 pointer-events-none select-none z-10 flex flex-col justify-between p-2 sm:p-4 md:p-5 safe-p-top safe-p-left safe-p-right">
      {/* Top Bar */}
      <div className="flex justify-between items-start w-full max-w-5xl mx-auto pointer-events-auto gap-2">
        {/* Child Avatar & Name pill */}
        <div className="flex items-center gap-2 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full bg-slate-950/90 border-2 border-purple-500/50 shadow-lg max-w-[45%] sm:max-w-none">
          {faceDataUrl ? (
            <img
              src={faceDataUrl}
              alt={childName}
              className="w-7 h-7 sm:w-8 sm:h-8 rounded-full border border-orange-400 object-cover flex-shrink-0"
            />
          ) : (
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-purple-700 flex items-center justify-center text-xs flex-shrink-0">
              🎃
            </div>
          )}
          <div className="min-w-0">
            <div className="text-[9px] sm:text-[10px] text-purple-300 font-semibold uppercase leading-none truncate">
              Aventurero
            </div>
            <div className="text-xs sm:text-sm font-black text-amber-300 leading-tight truncate">
              {childName || 'Amiguito'}
            </div>
          </div>
        </div>

        {/* Center / Right status */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Live Recording Badge with active timer */}
          <div className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full bg-red-950/90 border border-red-500/80 text-[10px] sm:text-xs font-black text-red-200 shadow-lg">
            <span className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-red-500 flex-shrink-0" />
            <span className="tracking-wider">REC {formatTime(recordingSeconds)}</span>
          </div>

          {/* Candies Counter */}
          <div className="flex items-center gap-1 sm:gap-2 px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-full bg-slate-950/90 border-2 border-orange-500/60 shadow-lg">
            <span className="text-sm sm:text-base">🍬</span>
            <span className="text-xs sm:text-sm font-black text-orange-200">
              {candiesCollected}/{totalCandies}
            </span>
          </div>

          {/* Interactive pumpkin indicator if touched */}
          {interactivePumpkinCount > 0 && (
            <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-amber-500/30 border border-amber-400/60 text-xs font-bold text-amber-200">
              <span>🎃</span>
              <span>¡Magia!</span>
            </div>
          )}

          {/* Camera View Toggle */}
          <button
            type="button"
            onClick={onToggleCamera}
            className={`p-1.5 sm:px-2.5 sm:py-1.5 rounded-full border text-xs font-bold flex items-center gap-1.5 active:scale-95 transition-all shadow cursor-pointer ${
              cameraViewMode === 'front'
                ? 'bg-amber-500 text-slate-950 border-amber-300'
                : 'bg-slate-950/80 border-purple-400/40 text-purple-200 hover:text-white'
            }`}
            title={cameraViewMode === 'front' ? 'Ver espalda' : 'Ver rostro de frente'}
          >
            <Camera className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span className="hidden md:inline">
              {cameraViewMode === 'front' ? 'Ver Espalda' : 'Ver Rostro'}
            </span>
          </button>

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
          >
            {isMuted ? <VolumeX className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-red-400" /> : <Volume2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-400" />}
          </button>
        </div>
      </div>

      {/* Guide hint at bottom center (hidden when touch controls are shown on mobile) */}
      <div className="hidden md:block text-center pointer-events-none pb-2">
        <span className="px-4 py-1.5 rounded-full bg-slate-950/85 border border-purple-500/30 text-[11px] text-purple-300 font-medium shadow-md">
          Presiona <kbd className="px-1.5 py-0.5 rounded bg-purple-900 border border-purple-400 text-white font-bold">W A S D</kbd> o <kbd className="px-1.5 py-0.5 rounded bg-purple-900 border border-purple-400 text-white font-bold">Flechas</kbd> para caminar • <kbd className="px-1.5 py-0.5 rounded bg-purple-900 border border-purple-400 text-white font-bold">Espacio</kbd> para saltar
        </span>
      </div>
    </div>
  );
};
