import React, { useState } from 'react';
import { Trophy, Download, RotateCcw, Video, Sparkles, X, CheckCircle2 } from 'lucide-react';
import { RecordedVideoResult } from '../utils/videoRecorder';

interface VictoryOverlayProps {
  childName: string;
  candiesCount: number;
  recordedVideo: RecordedVideoResult | null;
  isFinalizingRecording: boolean;
  onPlayAgain: () => void;
}

export const VictoryOverlay: React.FC<VictoryOverlayProps> = ({
  childName,
  candiesCount,
  recordedVideo,
  isFinalizingRecording,
  onPlayAgain,
}) => {
  const [showVideoModal, setShowVideoModal] = useState(false);

  const formattedName = (childName || 'CAMPEÓN').trim().toUpperCase();

  const handleDownloadVideo = () => {
    if (!recordedVideo) return;
    const a = document.createElement('a');
    a.href = recordedVideo.url;
    a.download = `Aventura_Halloween_${formattedName.replace(/\s+/g, '_')}.mp4`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <>
      {/* Top Victory Banner: Positioned clearly at the top-center so it doesn't obstruct character, face or sign */}
      <div className="absolute top-[max(0.75rem,env(safe-area-inset-top))] left-1/2 -translate-x-1/2 z-20 w-[94%] max-w-2xl pointer-events-none select-none">
        <div className="bg-gradient-to-r from-purple-950/90 via-slate-900/90 to-purple-950/90 border-2 sm:border-4 border-orange-400 rounded-2xl sm:rounded-3xl p-2.5 sm:p-4 md:p-5 shadow-2xl text-center backdrop-blur-xs animate-in fade-in zoom-in duration-500">
          <div className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-0.5 rounded-full bg-amber-400 text-slate-950 text-[11px] sm:text-xs md:text-sm font-black mb-1 shadow">
            <Trophy className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-current text-slate-950" />
            ¡MISIÓN CUMPLIDA!
          </div>

          <h2 className="text-xl sm:text-3xl md:text-4xl lg:text-5xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-orange-400 to-yellow-200 drop-shadow-lg leading-tight">
            ¡LLEGASTE, {formattedName}!
          </h2>

          <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-3 text-[11px] sm:text-xs md:text-sm text-purple-200 font-semibold mt-1">
            <span className="flex items-center gap-1 text-amber-300">
              🍬 {candiesCount} / 5 Caramelos
            </span>
            <span className="hidden sm:inline">•</span>
            <span className="flex items-center gap-1 text-orange-300">
              🏆 ¡Ganaste el Trofeo de Oro!
            </span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 mt-1.5 sm:mt-2 pt-1.5 sm:pt-2 border-t border-purple-500/25 text-[10px] sm:text-[11px] text-purple-300">
            <span className="font-bold text-amber-300">🏛️ Paseo Empalme</span>
            <span>•</span>
            <span className="font-bold text-orange-300 flex items-center gap-1">
              📷 Instagram: <span className="text-yellow-200">@vilmar.ai</span>
            </span>
          </div>
        </div>
      </div>

      {/* Bottom Action Dock: Clean, pinned to bottom center with safe area insets */}
      <div className="absolute bottom-[max(0.75rem,env(safe-area-inset-bottom))] left-1/2 -translate-x-1/2 z-20 w-[94%] max-w-xl pointer-events-auto select-none">
        <div className="bg-slate-950/90 border border-purple-500/50 rounded-2xl p-2.5 sm:p-3.5 shadow-2xl backdrop-blur-md flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 sm:gap-3">
          {/* Video recording status or buttons */}
          <div className="flex-1 min-w-0">
            {isFinalizingRecording ? (
              <div className="flex items-center gap-2 text-xs sm:text-sm text-amber-300 font-semibold py-1">
                <div className="w-3.5 h-3.5 border-2 border-amber-400 border-t-transparent rounded-full animate-spin flex-shrink-0" />
                <span className="truncate">Generando y procesando tu video MP4...</span>
              </div>
            ) : recordedVideo ? (
              <div className="flex gap-1.5 sm:gap-2">
                <button
                  type="button"
                  onClick={handleDownloadVideo}
                  className="flex-1 py-2 sm:py-2.5 px-2.5 sm:px-3 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 active:scale-95 text-slate-950 font-black text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow transition-all cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                  <span className="truncate">Descargar MP4 ({recordedVideo.durationSeconds}s)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowVideoModal(true)}
                  className="py-2 sm:py-2.5 px-2.5 sm:px-3 rounded-xl bg-purple-800 hover:bg-purple-700 active:scale-95 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow transition-all cursor-pointer flex-shrink-0"
                  title="Ver video grabado"
                >
                  <Video className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                  <span>Ver</span>
                </button>
              </div>
            ) : (
              <div className="text-xs text-purple-300 py-1">
                Aventura grabada con éxito
              </div>
            )}
          </div>

          {/* Play Again button */}
          <button
            type="button"
            onClick={onPlayAgain}
            className="py-2 sm:py-2.5 px-3 sm:px-4 rounded-xl bg-purple-700/80 hover:bg-purple-600 active:scale-95 text-purple-100 font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 border border-purple-400/30 transition-all cursor-pointer flex-shrink-0"
          >
            <RotateCcw className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
            <span>Volver a Jugar</span>
          </button>
        </div>
      </div>

      {/* Video Preview Modal */}
      {showVideoModal && recordedVideo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 md:p-6 bg-slate-950/85 backdrop-blur-sm safe-p-top safe-p-bottom">
          <div className="relative w-full max-w-2xl bg-purple-950 border-2 border-orange-400 rounded-3xl p-3.5 sm:p-5 md:p-6 shadow-2xl text-white max-h-[92dvh] overflow-y-auto">
            <button
              type="button"
              onClick={() => setShowVideoModal(false)}
              className="absolute top-3.5 right-3.5 sm:top-4 sm:right-4 p-1.5 sm:p-2 rounded-full bg-purple-900 hover:bg-purple-800 text-purple-200 cursor-pointer"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>

            <h3 className="text-base sm:text-lg md:text-xl font-black text-amber-300 mb-2.5 sm:mb-3 pr-8 flex items-center gap-1.5 sm:gap-2">
              <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-orange-400 flex-shrink-0" />
              <span>Recuerdo en MP4 de {formattedName} ({recordedVideo.durationSeconds}s)</span>
            </h3>

            <div className="rounded-xl sm:rounded-2xl overflow-hidden bg-black aspect-video max-h-[50dvh] border border-purple-500/40 mb-3 sm:mb-4 flex items-center justify-center">
              <video
                src={recordedVideo.url}
                controls
                autoPlay
                className="w-full h-full object-contain"
              />
            </div>

            <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-2.5">
              <div className="text-[11px] sm:text-xs text-purple-300 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400 flex-shrink-0" />
                <span>MP4 (H.264/AAC) • {recordedVideo.durationSeconds}s • ({(recordedVideo.sizeBytes / 1024 / 1024).toFixed(1)} MB)</span>
              </div>
              <button
                type="button"
                onClick={handleDownloadVideo}
                className="py-2.5 px-4 rounded-xl bg-orange-500 hover:bg-orange-600 active:scale-95 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow transition-all cursor-pointer"
              >
                <Download className="w-4 h-4" />
                Descargar Video MP4
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
