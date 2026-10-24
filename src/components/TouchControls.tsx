import React from 'react';
import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Zap } from 'lucide-react';
import { InputState } from '../types/game';

interface TouchControlsProps {
  onInputUpdate: (partial: Partial<InputState>) => void;
}

export const TouchControls: React.FC<TouchControlsProps> = ({ onInputUpdate }) => {
  const handleTouchStart = (key: keyof InputState) => (e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    onInputUpdate({ [key]: true });
  };

  const handleTouchEnd = (key: keyof InputState) => (e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    onInputUpdate({ [key]: false });
  };

  return (
    <div className="absolute inset-0 pointer-events-none z-20 flex flex-col justify-between p-2.5 sm:p-5 md:p-6 select-none safe-p-bottom safe-p-left safe-p-right">
      {/* Top spacer */}
      <div className="h-8 sm:h-10" />

      {/* Bottom controls row */}
      <div className="flex justify-between items-end w-full max-w-4xl mx-auto pointer-events-auto pb-1 sm:pb-2">
        {/* D-PAD / DIRECTIONAL BUTTONS */}
        <div
          className="relative w-32 h-32 sm:w-36 sm:h-36 bg-purple-950/60 rounded-full border-2 border-purple-500/40 backdrop-blur-md p-1 shadow-2xl"
          style={{ touchAction: 'none' }}
        >
          {/* UP */}
          <button
            type="button"
            className="absolute top-1 left-1/2 -translate-x-1/2 w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-purple-900/90 active:bg-orange-500 border border-purple-400/50 active:border-orange-300 flex items-center justify-center text-white active:text-slate-950 active:scale-90 transition-all shadow-md cursor-pointer"
            style={{ touchAction: 'none' }}
            onTouchStart={handleTouchStart('forward')}
            onTouchEnd={handleTouchEnd('forward')}
            onMouseDown={handleTouchStart('forward')}
            onMouseUp={handleTouchEnd('forward')}
            onMouseLeave={handleTouchEnd('forward')}
            aria-label="Avanzar"
          >
            <ArrowUp className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>

          {/* DOWN */}
          <button
            type="button"
            className="absolute bottom-1 left-1/2 -translate-x-1/2 w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-purple-900/90 active:bg-orange-500 border border-purple-400/50 active:border-orange-300 flex items-center justify-center text-white active:text-slate-950 active:scale-90 transition-all shadow-md cursor-pointer"
            style={{ touchAction: 'none' }}
            onTouchStart={handleTouchStart('backward')}
            onTouchEnd={handleTouchEnd('backward')}
            onMouseDown={handleTouchStart('backward')}
            onMouseUp={handleTouchEnd('backward')}
            onMouseLeave={handleTouchEnd('backward')}
            aria-label="Retroceder"
          >
            <ArrowDown className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>

          {/* LEFT */}
          <button
            type="button"
            className="absolute left-1 top-1/2 -translate-y-1/2 w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-purple-900/90 active:bg-orange-500 border border-purple-400/50 active:border-orange-300 flex items-center justify-center text-white active:text-slate-950 active:scale-90 transition-all shadow-md cursor-pointer"
            style={{ touchAction: 'none' }}
            onTouchStart={handleTouchStart('left')}
            onTouchEnd={handleTouchEnd('left')}
            onMouseDown={handleTouchStart('left')}
            onMouseUp={handleTouchEnd('left')}
            onMouseLeave={handleTouchEnd('left')}
            aria-label="Izquierda"
          >
            <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>

          {/* RIGHT */}
          <button
            type="button"
            className="absolute right-1 top-1/2 -translate-y-1/2 w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-purple-900/90 active:bg-orange-500 border border-purple-400/50 active:border-orange-300 flex items-center justify-center text-white active:text-slate-950 active:scale-90 transition-all shadow-md cursor-pointer"
            style={{ touchAction: 'none' }}
            onTouchStart={handleTouchStart('right')}
            onTouchEnd={handleTouchEnd('right')}
            onMouseDown={handleTouchStart('right')}
            onMouseUp={handleTouchEnd('right')}
            onMouseLeave={handleTouchEnd('right')}
            aria-label="Derecha"
          >
            <ArrowRight className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </div>

        {/* JUMP BUTTON */}
        <button
          type="button"
          className="w-16 h-16 sm:w-20 sm:h-20 md:w-22 md:h-22 rounded-full bg-gradient-to-tr from-orange-600 via-amber-500 to-orange-400 active:scale-90 border-3 sm:border-4 border-amber-300 shadow-2xl flex flex-col items-center justify-center text-slate-950 font-black cursor-pointer transition-all"
          style={{ touchAction: 'none' }}
          onTouchStart={handleTouchStart('jump')}
          onTouchEnd={handleTouchEnd('jump')}
          onMouseDown={handleTouchStart('jump')}
          onMouseUp={handleTouchEnd('jump')}
          onMouseLeave={handleTouchEnd('jump')}
          aria-label="Saltar"
        >
          <Zap className="w-6 h-6 sm:w-8 sm:h-8 fill-current" />
          <span className="text-[9px] sm:text-[11px] font-black uppercase tracking-wider">Saltar</span>
        </button>
      </div>
    </div>
  );
};
