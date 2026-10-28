import React from 'react';
import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Zap } from 'lucide-react';
import { InputState } from '../types/game';

interface TouchControlsProps {
  onInputUpdate: (partial: Partial<InputState>) => void;
}

export const TouchControls: React.FC<TouchControlsProps> = ({ onInputUpdate }) => {
  const handlePressStart = (key: keyof InputState) => (e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    onInputUpdate({ [key]: true });
  };

  const handlePressEnd = (key: keyof InputState) => (e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    onInputUpdate({ [key]: false });
  };

  return (
    <div className="absolute inset-0 pointer-events-none z-20 flex flex-col justify-between p-2 sm:p-4 md:p-6 select-none safe-p-bottom safe-p-left safe-p-right">
      {/* Top spacer to avoid overlapping top HUD */}
      <div className="h-10 sm:h-12 pointer-events-none" />

      {/* Bottom controls row */}
      <div className="flex justify-between items-end w-full max-w-4xl mx-auto pointer-events-auto pb-1 sm:pb-2">
        {/* D-PAD / DIRECTIONAL BUTTONS */}
        <div
          className="relative w-28 h-28 sm:w-32 sm:h-32 md:w-36 md:h-36 bg-purple-950/70 rounded-full border-2 border-purple-500/50 backdrop-blur-md p-1 shadow-2xl"
          style={{ touchAction: 'none' }}
        >
          {/* UP (Forward) */}
          <button
            type="button"
            className="absolute top-1 left-1/2 -translate-x-1/2 w-9 h-9 sm:w-10 sm:h-10 md:w-11 md:h-11 rounded-xl bg-purple-900/90 active:bg-orange-500 border border-purple-400/50 active:border-orange-300 flex items-center justify-center text-white active:text-slate-950 active:scale-90 transition-all shadow-md cursor-pointer"
            style={{ touchAction: 'none' }}
            onTouchStart={handlePressStart('forward')}
            onTouchEnd={handlePressEnd('forward')}
            onTouchCancel={handlePressEnd('forward')}
            onMouseDown={handlePressStart('forward')}
            onMouseUp={handlePressEnd('forward')}
            onMouseLeave={handlePressEnd('forward')}
            aria-label="Avanzar"
          >
            <ArrowUp className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" />
          </button>

          {/* DOWN (Backward) */}
          <button
            type="button"
            className="absolute bottom-1 left-1/2 -translate-x-1/2 w-9 h-9 sm:w-10 sm:h-10 md:w-11 md:h-11 rounded-xl bg-purple-900/90 active:bg-orange-500 border border-purple-400/50 active:border-orange-300 flex items-center justify-center text-white active:text-slate-950 active:scale-90 transition-all shadow-md cursor-pointer"
            style={{ touchAction: 'none' }}
            onTouchStart={handlePressStart('backward')}
            onTouchEnd={handlePressEnd('backward')}
            onTouchCancel={handlePressEnd('backward')}
            onMouseDown={handlePressStart('backward')}
            onMouseUp={handlePressEnd('backward')}
            onMouseLeave={handlePressEnd('backward')}
            aria-label="Retroceder"
          >
            <ArrowDown className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" />
          </button>

          {/* LEFT */}
          <button
            type="button"
            className="absolute left-1 top-1/2 -translate-y-1/2 w-9 h-9 sm:w-10 sm:h-10 md:w-11 md:h-11 rounded-xl bg-purple-900/90 active:bg-orange-500 border border-purple-400/50 active:border-orange-300 flex items-center justify-center text-white active:text-slate-950 active:scale-90 transition-all shadow-md cursor-pointer"
            style={{ touchAction: 'none' }}
            onTouchStart={handlePressStart('left')}
            onTouchEnd={handlePressEnd('left')}
            onTouchCancel={handlePressEnd('left')}
            onMouseDown={handlePressStart('left')}
            onMouseUp={handlePressEnd('left')}
            onMouseLeave={handlePressEnd('left')}
            aria-label="Izquierda"
          >
            <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" />
          </button>

          {/* RIGHT */}
          <button
            type="button"
            className="absolute right-1 top-1/2 -translate-y-1/2 w-9 h-9 sm:w-10 sm:h-10 md:w-11 md:h-11 rounded-xl bg-purple-900/90 active:bg-orange-500 border border-purple-400/50 active:border-orange-300 flex items-center justify-center text-white active:text-slate-950 active:scale-90 transition-all shadow-md cursor-pointer"
            style={{ touchAction: 'none' }}
            onTouchStart={handlePressStart('right')}
            onTouchEnd={handlePressEnd('right')}
            onTouchCancel={handlePressEnd('right')}
            onMouseDown={handlePressStart('right')}
            onMouseUp={handlePressEnd('right')}
            onMouseLeave={handlePressEnd('right')}
            aria-label="Derecha"
          >
            <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" />
          </button>
        </div>

        {/* JUMP BUTTON */}
        <button
          type="button"
          className="w-14 h-14 sm:w-18 sm:h-18 md:w-20 md:h-20 rounded-full bg-gradient-to-tr from-orange-600 via-amber-500 to-orange-400 active:scale-90 border-3 sm:border-4 border-amber-300 shadow-2xl flex flex-col items-center justify-center text-slate-950 font-black cursor-pointer transition-all"
          style={{ touchAction: 'none' }}
          onTouchStart={handlePressStart('jump')}
          onTouchEnd={handlePressEnd('jump')}
          onTouchCancel={handlePressEnd('jump')}
          onMouseDown={handlePressStart('jump')}
          onMouseUp={handlePressEnd('jump')}
          onMouseLeave={handlePressEnd('jump')}
          aria-label="Saltar"
        >
          <Zap className="w-5 h-5 sm:w-7 sm:h-7 md:w-8 md:h-8 fill-current" />
          <span className="text-[8px] sm:text-[10px] md:text-[11px] font-black uppercase tracking-wider">Saltar</span>
        </button>
      </div>
    </div>
  );
};
