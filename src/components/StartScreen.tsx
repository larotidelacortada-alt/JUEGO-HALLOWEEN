import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, Upload, Wand2, User, Play, AlertCircle, Sliders, Check, RotateCcw } from 'lucide-react';
import { AvatarCostume } from '../types/game';
import {
  detectFaceCenter,
  renderCircularFaceCutout,
  createSampleFaceCanvas,
  FaceCropSettings,
} from '../utils/faceProcessor';

interface StartScreenProps {
  childName: string;
  costume: AvatarCostume;
  onCostumeChange: (costume: AvatarCostume) => void;
  onNameChange: (name: string) => void;
  onFaceReady: (canvas: HTMLCanvasElement, dataUrl: string) => void;
  onStartGame: () => void;
}

export const StartScreen: React.FC<StartScreenProps> = ({
  childName,
  costume,
  onCostumeChange,
  onNameChange,
  onFaceReady,
  onStartGame,
}) => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [sourceImg, setSourceImg] = useState<HTMLImageElement | null>(null);
  const [activeSampleType, setActiveSampleType] = useState<'boy' | 'girl' | 'cute_pumpkin' | null>('boy');

  const [cropSettings, setCropSettings] = useState<FaceCropSettings>({
    centerX: 0.5,
    centerY: 0.45,
    zoom: 1.35,
    radiusRatio: 0.46,
  });

  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize with a default friendly sample face
  useEffect(() => {
    if (!previewUrl) {
      const sample = createSampleFaceCanvas('boy');
      setPreviewUrl(sample.dataUrl);
      onFaceReady(sample.canvas, sample.dataUrl);
    }
  }, []);

  // Process and re-render circular face
  const applySettings = (newSettings: FaceCropSettings) => {
    setCropSettings(newSettings);
    if (sourceImg) {
      const result = renderCircularFaceCutout(sourceImg, newSettings);
      setPreviewUrl(result.dataUrl);
      onFaceReady(result.canvas, result.dataUrl);
    } else if (activeSampleType) {
      const sample = createSampleFaceCanvas(activeSampleType);
      setPreviewUrl(sample.dataUrl);
      onFaceReady(sample.canvas, sample.dataUrl);
    }
  };

  const handleResetSettings = () => {
    const defaultSettings: FaceCropSettings = {
      centerX: 0.5,
      centerY: 0.45,
      zoom: 1.35,
      radiusRatio: 0.46,
    };
    applySettings(defaultSettings);
  };

  // Handle uploaded image file
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setErrorMsg('Por favor selecciona una foto en formato JPG, PNG o WebP.');
      return;
    }

    // Validate size (max 15MB)
    if (file.size > 15 * 1024 * 1024) {
      setErrorMsg('La imagen es demasiado pesada. Elige una de menos de 15 MB.');
      return;
    }

    setErrorMsg(null);
    setIsProcessing(true);
    setActiveSampleType(null);

    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const img = new Image();
        img.onload = async () => {
          setSourceImg(img);
          try {
            // Detect face center automatically
            const detected = await detectFaceCenter(img);
            const newSettings: FaceCropSettings = {
              centerX: detected.x,
              centerY: detected.y,
              zoom: 1.35,
              radiusRatio: 0.46,
            };
            setCropSettings(newSettings);

            const result = renderCircularFaceCutout(img, newSettings);
            setPreviewUrl(result.dataUrl);
            onFaceReady(result.canvas, result.dataUrl);
          } catch {
            setErrorMsg('Hubo un error al procesar el rostro. Puedes ajustar la medida manualmente.');
          } finally {
            setIsProcessing(false);
          }
        };
        img.onerror = () => {
          setErrorMsg('No se pudo cargar la imagen seleccionada.');
          setIsProcessing(false);
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    } catch {
      setErrorMsg('Error al leer el archivo.');
      setIsProcessing(false);
    }
  };

  const handleSelectSample = (type: 'boy' | 'girl' | 'cute_pumpkin') => {
    setSourceImg(null);
    setActiveSampleType(type);
    setErrorMsg(null);
    const sample = createSampleFaceCanvas(type);
    setPreviewUrl(sample.dataUrl);
    onFaceReady(sample.canvas, sample.dataUrl);
  };

  const isValidName = childName.trim().length >= 2;

  const costumeOptions: Array<{ id: AvatarCostume; name: string; emoji: string; desc: string }> = [
    { id: 'wizard', name: 'Mago / Bruja', emoji: '🧙‍♂️', desc: 'Túnica púrpura' },
    { id: 'dracula', name: 'Drácula', emoji: '🧛', desc: 'Capa vampiro' },
    { id: 'elf', name: 'Duendecito', emoji: '🧝', desc: 'Gorro y orejas' },
    { id: 'pumpkin', name: 'Calabacita', emoji: '🎃', desc: 'Disfraz calabaza' },
  ];

  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center p-2 sm:p-3 md:p-5 bg-slate-950/85 backdrop-blur-xs select-none safe-p-top safe-p-bottom safe-p-left safe-p-right overflow-y-auto no-scrollbar">
      {/* Responsive Modal Container: Fits comfortably without lateral scrollbar on desktop, laptop, tablet & mobile */}
      <div className="relative w-full max-w-4xl bg-gradient-to-b from-purple-950 via-slate-900 to-indigo-950 border-2 sm:border-3 border-orange-500/80 rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 md:p-6 shadow-2xl text-white my-auto max-h-[96dvh] overflow-y-auto no-scrollbar">
        {/* Decorative corner icons */}
        <div className="absolute top-2.5 left-3 sm:top-3 sm:left-4 text-lg sm:text-xl pointer-events-none animate-bounce">
          🎃
        </div>
        <div
          className="absolute top-2.5 right-3 sm:top-3 sm:right-4 text-lg sm:text-xl pointer-events-none animate-bounce"
          style={{ animationDelay: '0.3s' }}
        >
          ✨
        </div>

        {/* Compact Header */}
        <div className="text-center mb-3 sm:mb-4">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-orange-500/20 border border-orange-400/60 text-orange-300 text-[10px] sm:text-xs font-semibold tracking-wider uppercase mb-1">
            <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-yellow-300 flex-shrink-0" />
            <span>Aventura 3D Personalizada</span>
          </div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-amber-300 to-purple-400 drop-shadow-sm leading-tight">
            HALLOWEEN MÁGICO
          </h1>
          <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 mt-1">
            <span className="px-2 py-0.5 rounded-full bg-orange-500/25 border border-orange-400/50 text-[10px] sm:text-[11px] font-bold text-amber-200 shadow-xs">
              🏛️ Paseo Empalme
            </span>
            <span className="px-2 py-0.5 rounded-full bg-purple-800/60 border border-purple-400/50 text-[10px] sm:text-[11px] font-bold text-yellow-300 shadow-xs">
              📷 @vilmar.ai
            </span>
          </div>
        </div>

        {/* 2-Column Responsive Layout on Desktop/Tablet, Clean 1-Column on Mobile */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 sm:gap-4 md:gap-5">
          {/* ================= LEFT COLUMN: FACE & MEASUREMENTS ================= */}
          <div className="flex flex-col gap-2.5 bg-purple-900/35 border border-purple-500/40 rounded-2xl p-3 sm:p-3.5">
            <div className="flex items-center justify-between border-b border-purple-500/25 pb-1.5">
              <span className="text-xs sm:text-sm font-bold text-orange-300 flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-orange-400 flex-shrink-0" />
                Rostro y Medida Circular
              </span>
              <span className="text-[10px] text-purple-200 bg-purple-950/80 px-2 py-0.5 rounded-full border border-purple-700/50">
                Forma Circular
              </span>
            </div>

            {/* Avatar Preview + Upload Buttons */}
            <div className="flex items-center gap-3 sm:gap-4">
              {/* Circular Avatar */}
              <div className="relative flex-shrink-0">
                <div
                  className="w-22 h-22 sm:w-26 sm:h-26 md:w-28 md:h-28 rounded-full border-3 sm:border-4 border-orange-400 shadow-xl overflow-hidden flex items-center justify-center relative"
                  style={{
                    backgroundImage:
                      'repeating-conic-gradient(#1e1b4b 0% 25%, #2e1065 0% 50%) 50% / 14px 14px',
                  }}
                >
                  {previewUrl ? (
                    <img
                      src={previewUrl}
                      alt="Rostro personalizado"
                      className="w-full h-full object-cover rounded-full"
                    />
                  ) : (
                    <div className="text-purple-400 text-xs text-center p-2">Sin foto</div>
                  )}
                  {isProcessing && (
                    <div className="absolute inset-0 bg-purple-950/85 flex items-center justify-center">
                      <Wand2 className="w-6 h-6 text-orange-400 animate-spin" />
                    </div>
                  )}
                </div>
                <div className="absolute -bottom-1 -right-1 bg-gradient-to-r from-amber-400 to-orange-400 text-slate-950 text-[9px] sm:text-[10px] font-black px-1.5 sm:px-2 py-0.5 rounded-full shadow">
                  Circular
                </div>
              </div>

              {/* Upload & Sample Faces */}
              <div className="flex-1 min-w-0">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                  onChange={handleFileChange}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 active:scale-95 text-slate-950 font-black text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow transition-all cursor-pointer mb-2"
                >
                  <Upload className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-950 flex-shrink-0" />
                  <span className="truncate">Cargar Foto</span>
                </button>

                <div className="text-[10px] text-purple-300 mb-1">O personaje de ejemplo:</div>
                <div className="grid grid-cols-3 gap-1">
                  <button
                    type="button"
                    onClick={() => handleSelectSample('boy')}
                    className={`py-1 px-1 rounded-lg text-[10px] sm:text-[11px] font-semibold border cursor-pointer transition-all text-center truncate ${
                      activeSampleType === 'boy'
                        ? 'bg-orange-500 text-slate-950 border-amber-300 shadow font-bold'
                        : 'bg-purple-950/70 hover:bg-purple-800 text-purple-200 border-purple-600/40'
                    }`}
                  >
                    👦 Nene
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSelectSample('girl')}
                    className={`py-1 px-1 rounded-lg text-[10px] sm:text-[11px] font-semibold border cursor-pointer transition-all text-center truncate ${
                      activeSampleType === 'girl'
                        ? 'bg-orange-500 text-slate-950 border-amber-300 shadow font-bold'
                        : 'bg-purple-950/70 hover:bg-purple-800 text-purple-200 border-purple-600/40'
                    }`}
                  >
                    👧 Nena
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSelectSample('cute_pumpkin')}
                    className={`py-1 px-1 rounded-lg text-[10px] sm:text-[11px] font-semibold border cursor-pointer transition-all text-center truncate ${
                      activeSampleType === 'cute_pumpkin'
                        ? 'bg-orange-500 text-slate-950 border-amber-300 shadow font-bold'
                        : 'bg-purple-950/70 hover:bg-purple-800 text-purple-200 border-purple-600/40'
                    }`}
                  >
                    🎃 Pintura
                  </button>
                </div>
              </div>
            </div>

            {/* Adjustment Sliders (Measure, Height, Horizontal) */}
            <div className="bg-purple-950/60 rounded-xl p-2.5 sm:p-3 border border-purple-700/40 flex flex-col gap-2">
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-bold text-amber-200">Ajuste de Medida y Encuadre</span>
                {sourceImg && (
                  <button
                    type="button"
                    onClick={handleResetSettings}
                    className="text-[10px] text-purple-300 hover:text-white flex items-center gap-1 cursor-pointer"
                    title="Restablecer valores"
                  >
                    <RotateCcw className="w-2.5 h-2.5" /> Centrar
                  </button>
                )}
              </div>

              {/* 1. Medida / Zoom */}
              <div>
                <div className="flex justify-between items-center text-[10px] sm:text-[11px] mb-0.5">
                  <span className="font-semibold text-purple-200">Medida / Tamaño</span>
                  <span className="font-bold text-orange-300">{cropSettings.zoom.toFixed(1)}x</span>
                </div>
                <input
                  type="range"
                  min="0.7"
                  max="2.8"
                  step="0.05"
                  value={cropSettings.zoom}
                  onChange={(e) =>
                    applySettings({
                      ...cropSettings,
                      zoom: parseFloat(e.target.value),
                    })
                  }
                  className="w-full h-1.5 bg-purple-900 rounded-lg appearance-none cursor-pointer accent-orange-400"
                />
              </div>

              {/* 2. Posición Vertical */}
              <div>
                <div className="flex justify-between items-center text-[10px] sm:text-[11px] mb-0.5">
                  <span className="font-semibold text-purple-200">Posición Vertical</span>
                  <span className="font-bold text-orange-300">
                    {Math.round(cropSettings.centerY * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0.15"
                  max="0.85"
                  step="0.02"
                  value={cropSettings.centerY}
                  onChange={(e) =>
                    applySettings({
                      ...cropSettings,
                      centerY: parseFloat(e.target.value),
                    })
                  }
                  className="w-full h-1.5 bg-purple-900 rounded-lg appearance-none cursor-pointer accent-orange-400"
                />
              </div>

              {/* 3. Posición Horizontal */}
              <div>
                <div className="flex justify-between items-center text-[10px] sm:text-[11px] mb-0.5">
                  <span className="font-semibold text-purple-200">Posición Horizontal</span>
                  <span className="font-bold text-orange-300">
                    {Math.round(cropSettings.centerX * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0.15"
                  max="0.85"
                  step="0.02"
                  value={cropSettings.centerX}
                  onChange={(e) =>
                    applySettings({
                      ...cropSettings,
                      centerX: parseFloat(e.target.value),
                    })
                  }
                  className="w-full h-1.5 bg-purple-900 rounded-lg appearance-none cursor-pointer accent-orange-400"
                />
              </div>
            </div>

            {errorMsg && (
              <div className="p-2 rounded-xl bg-red-950/80 border border-red-500/50 text-red-200 text-[11px] flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}
          </div>

          {/* ================= RIGHT COLUMN: NAME, COSTUME & CTA ================= */}
          <div className="flex flex-col justify-between gap-3 bg-purple-900/35 border border-purple-500/40 rounded-2xl p-3 sm:p-3.5">
            {/* Child Name */}
            <div>
              <label className="text-xs sm:text-sm font-bold text-orange-300 mb-1 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-orange-400" />
                  Nombre del niño/a:
                </span>
                <span className="text-[10px] text-purple-300 font-normal">
                  (Para el cartel 3D de llegada)
                </span>
              </label>
              <input
                type="text"
                value={childName}
                maxLength={22}
                onChange={(e) => onNameChange(e.target.value)}
                placeholder="Ej: Santino, Sofía, Mateo..."
                className="w-full px-3.5 py-2 rounded-xl bg-purple-950/70 border-2 border-purple-500/60 focus:border-orange-400 focus:outline-none text-white text-sm sm:text-base placeholder-purple-400/50 shadow-inner font-bold text-center"
              />
              {!isValidName && (
                <p className="text-[10px] text-amber-300/80 mt-1 text-center">
                  Ingresa al menos 2 letras para que aparezca en el cartel 3D
                </p>
              )}
            </div>

            {/* Costume Selection */}
            <div>
              <label className="block text-xs sm:text-sm font-bold text-orange-300 mb-1.5 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                Elige el personaje / disfraz de Halloween:
              </label>
              <div className="grid grid-cols-2 gap-1.5 sm:gap-2">
                {costumeOptions.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => onCostumeChange(c.id)}
                    className={`p-2 rounded-xl border text-center transition-all cursor-pointer flex items-center gap-2 relative ${
                      costume === c.id
                        ? 'bg-gradient-to-r from-orange-500 to-amber-500 border-amber-200 text-slate-950 font-black shadow-md'
                        : 'bg-purple-950/60 hover:bg-purple-800/60 border-purple-600/40 text-purple-200 font-semibold'
                    }`}
                  >
                    <span className="text-xl sm:text-2xl flex-shrink-0">{c.emoji}</span>
                    <div className="min-w-0 text-left">
                      <div className="text-[11px] sm:text-xs font-bold leading-tight truncate">
                        {c.name}
                      </div>
                      <div
                        className={`text-[9px] leading-tight truncate ${
                          costume === c.id ? 'text-slate-900 font-semibold' : 'text-purple-300'
                        }`}
                      >
                        {c.desc}
                      </div>
                    </div>
                    {costume === c.id && (
                      <div className="ml-auto w-4 h-4 rounded-full bg-slate-950 text-amber-300 flex items-center justify-center flex-shrink-0">
                        <Check className="w-2.5 h-2.5 stroke-[3]" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Start Button & Friendly Controls Help */}
            <div className="pt-1">
              <button
                type="button"
                disabled={!isValidName}
                onClick={onStartGame}
                className={`w-full py-3 sm:py-3.5 rounded-xl font-black text-sm sm:text-base md:text-lg tracking-wide flex items-center justify-center gap-2 shadow-xl transition-all cursor-pointer ${
                  isValidName
                    ? 'bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 hover:from-orange-400 hover:to-amber-500 text-slate-950 hover:shadow-orange-500/40 hover:scale-[1.01] active:scale-95'
                    : 'bg-purple-900/40 text-purple-400 border border-purple-700/50 cursor-not-allowed opacity-60'
                }`}
              >
                <Play className="w-4 h-4 sm:w-5 sm:h-5 fill-current flex-shrink-0" />
                <span>COMENZAR AVENTURA</span>
              </button>

              <div className="text-center mt-2 text-[10px] sm:text-[11px] text-purple-300/80">
                Usa <span className="text-amber-300 font-bold">W A S D</span> /{' '}
                <span className="text-amber-300 font-bold">Flechas</span> en computadora, o los{' '}
                <span className="text-amber-300 font-bold">botones táctiles</span> en celular.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
