import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, Upload, Wand2, User, Play, AlertCircle, Sliders } from 'lucide-react';
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
  const [showAdjustControls, setShowAdjustControls] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize with a default friendly sample face
  useEffect(() => {
    if (!previewUrl) {
      const sample = createSampleFaceCanvas('boy');
      setPreviewUrl(sample.dataUrl);
      onFaceReady(sample.canvas, sample.dataUrl);
    }
  }, []);

  // Process and re-render face
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
            setShowAdjustControls(true);
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

  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center p-2.5 sm:p-4 md:p-6 bg-slate-950/85 backdrop-blur-xs overflow-y-auto safe-p-top safe-p-bottom safe-p-left safe-p-right">
      <div className="relative w-full max-w-lg bg-gradient-to-b from-purple-950 via-slate-900 to-indigo-950 border-3 sm:border-4 border-orange-500/80 rounded-3xl p-4 sm:p-6 md:p-7 shadow-2xl text-white my-auto max-h-[92dvh] overflow-y-auto">
        {/* Decorative corner icons */}
        <div className="absolute top-2.5 left-3 sm:top-3 sm:left-4 text-xl sm:text-2xl animate-bounce">🎃</div>
        <div className="absolute top-2.5 right-3 sm:top-3 sm:right-4 text-xl sm:text-2xl animate-bounce" style={{ animationDelay: '0.3s' }}>✨</div>

        {/* Title */}
        <div className="text-center mb-4 sm:mb-5">
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-orange-500/20 border border-orange-400 text-orange-300 text-[10px] sm:text-xs font-semibold tracking-wider uppercase mb-1">
            <Sparkles className="w-3.5 h-3.5 text-yellow-300" /> Aventura 3D Personalizada
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-amber-300 to-purple-400 drop-shadow-md">
            HALLOWEEN MÁGICO
          </h1>
          <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 mt-1.5">
            <span className="px-2.5 py-0.5 rounded-full bg-orange-500/25 border border-orange-400/50 text-[10px] sm:text-[11px] font-bold text-amber-200 flex items-center gap-1 shadow-xs">
              🏛️ Paseo Empalme
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-purple-800/60 border border-purple-400/50 text-[10px] sm:text-[11px] font-bold text-yellow-300 flex items-center gap-1 shadow-xs">
              📷 @vilmar.ai
            </span>
          </div>
          <p className="text-[11px] sm:text-xs text-purple-200 mt-1">
            Personaliza el rostro y nombre del niño/a para su avatar 3D
          </p>
        </div>

        {/* Child Name Input */}
        <div className="mb-4">
          <label className="block text-xs sm:text-sm font-bold text-orange-300 mb-1 flex items-center gap-1.5">
            <User className="w-4 h-4 text-orange-400" />
            Nombre del niño o de la niña:
          </label>
          <input
            type="text"
            value={childName}
            maxLength={22}
            onChange={(e) => onNameChange(e.target.value)}
            placeholder="Ej: Santino, Sofía, Mateo..."
            className="w-full px-4 py-2.5 rounded-xl bg-purple-900/40 border-2 border-purple-500/60 focus:border-orange-400 focus:outline-none text-white text-base sm:text-lg placeholder-purple-400/60 shadow-inner font-bold text-center"
          />
          {!isValidName && (
            <p className="text-[11px] text-amber-300/80 mt-1 text-center">
              Ingresa al menos 2 letras para que aparezca en el cartel 3D de llegada
            </p>
          )}
        </div>

        {/* Face Customizer Card */}
        <div className="mb-5 bg-purple-900/35 border border-purple-500/50 rounded-2xl p-3 sm:p-4">
          <div className="flex flex-col sm:flex-row items-center gap-4">
            {/* Circular Preview with Transparency Checkerboard */}
            <div className="relative flex-shrink-0">
              <div
                className="w-28 h-28 sm:w-32 sm:h-32 rounded-full border-4 border-orange-400 shadow-xl overflow-hidden flex items-center justify-center relative"
                style={{
                  backgroundImage:
                    'repeating-conic-gradient(#1e1b4b 0% 25%, #2e1065 0% 50%) 50% / 16px 16px',
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
                    <Wand2 className="w-7 h-7 text-orange-400 animate-spin" />
                  </div>
                )}
              </div>
              <div className="absolute -bottom-1 -right-1 bg-gradient-to-r from-amber-400 to-orange-400 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded-full shadow">
                Rostro Circular
              </div>
            </div>

            {/* Actions: Upload & Mode Toggles */}
            <div className="flex-1 w-full text-center sm:text-left">
              <div className="flex items-center justify-center sm:justify-start gap-2 mb-2">
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
                  className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 active:scale-95 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow transition-all cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5 text-slate-950" />
                  Cargar Foto
                </button>

                <button
                  type="button"
                  onClick={() => setShowAdjustControls(!showAdjustControls)}
                  className="px-3 py-2 rounded-xl bg-purple-800 hover:bg-purple-700 active:scale-95 text-purple-200 text-xs font-semibold flex items-center gap-1 shadow cursor-pointer border border-purple-500/40"
                >
                  <Sliders className="w-3 h-3" />
                  {showAdjustControls ? 'Ocultar Medidas' : 'Ajustar Medida'}
                </button>
              </div>

              {/* Sample Faces */}
              <div className="mt-2 text-center sm:text-left">
                <span className="text-[11px] text-purple-300 block mb-1">
                  O prueba con un personaje de ejemplo:
                </span>
                <div className="flex gap-1.5 justify-center sm:justify-start">
                  <button
                    type="button"
                    onClick={() => handleSelectSample('boy')}
                    className={`px-2 py-1 rounded-lg text-[11px] font-semibold border cursor-pointer transition-all ${
                      activeSampleType === 'boy'
                        ? 'bg-orange-500 text-slate-950 border-amber-300 shadow'
                        : 'bg-purple-800/60 hover:bg-purple-700 text-purple-200 border-purple-500/40'
                    }`}
                  >
                    👦 Nene
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSelectSample('girl')}
                    className={`px-2 py-1 rounded-lg text-[11px] font-semibold border cursor-pointer transition-all ${
                      activeSampleType === 'girl'
                        ? 'bg-orange-500 text-slate-950 border-amber-300 shadow'
                        : 'bg-purple-800/60 hover:bg-purple-700 text-purple-200 border-purple-500/40'
                    }`}
                  >
                    👧 Nena
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSelectSample('cute_pumpkin')}
                    className={`px-2 py-1 rounded-lg text-[11px] font-semibold border cursor-pointer transition-all ${
                      activeSampleType === 'cute_pumpkin'
                        ? 'bg-orange-500 text-slate-950 border-amber-300 shadow'
                        : 'bg-purple-800/60 hover:bg-purple-700 text-purple-200 border-purple-500/40'
                    }`}
                  >
                    🎃 Pintura
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* CROP & MEASUREMENT ADJUSTMENT SLIDERS */}
          {showAdjustControls && (
            <div className="mt-3.5 pt-3 border-t border-purple-500/30">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-amber-300 flex items-center gap-1">
                  <Sliders className="w-3.5 h-3.5 text-orange-400" />
                  Ajustar Medida y Posición en el Círculo:
                </span>
                <span className="text-[10px] text-purple-300 bg-purple-950/80 px-2 py-0.5 rounded-full border border-purple-700/50">
                  Forma Circular
                </span>
              </div>

              {sourceImg ? (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1 text-[11px] text-purple-200">
                  {/* 1. Medida / Tamaño */}
                  <div className="bg-purple-950/60 p-2 rounded-xl border border-purple-700/40">
                    <div className="flex justify-between items-center mb-1">
                      <label className="font-semibold text-amber-200">
                        Medida / Tamaño
                      </label>
                      <span className="text-[10px] font-bold text-orange-300">
                        {cropSettings.zoom.toFixed(1)}x
                      </span>
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
                      className="w-full accent-orange-400 cursor-pointer"
                    />
                  </div>

                  {/* 2. Altura Vertical */}
                  <div className="bg-purple-950/60 p-2 rounded-xl border border-purple-700/40">
                    <div className="flex justify-between items-center mb-1">
                      <label className="font-semibold text-amber-200">
                        Posición Vertical
                      </label>
                      <span className="text-[10px] font-bold text-orange-300">
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
                      className="w-full accent-orange-400 cursor-pointer"
                    />
                  </div>

                  {/* 3. Posición Horizontal */}
                  <div className="bg-purple-950/60 p-2 rounded-xl border border-purple-700/40">
                    <div className="flex justify-between items-center mb-1">
                      <label className="font-semibold text-amber-200">
                        Posición Horizontal
                      </label>
                      <span className="text-[10px] font-bold text-orange-300">
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
                      className="w-full accent-orange-400 cursor-pointer"
                    />
                  </div>
                </div>
              ) : (
                <div className="text-center py-2 text-xs text-purple-300/90 bg-purple-950/50 rounded-xl border border-purple-700/30">
                  Sube la foto del niño/a para regular la medida (zoom) y centrar la carita dentro del círculo.
                </div>
              )}
            </div>
          )}

          {errorMsg && (
            <div className="mt-3 p-2 rounded-xl bg-red-950/80 border border-red-500/50 text-red-200 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}
        </div>

        {/* Costume Selector: Wizard, Dracula, Elf, Pumpkin */}
        <div className="mb-4 bg-purple-900/35 border border-purple-500/50 rounded-2xl p-3 sm:p-4">
          <label className="block text-xs sm:text-sm font-bold text-orange-300 mb-2 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-amber-400" />
            Elige el personaje / disfraz de Halloween:
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { id: 'wizard', name: 'Mago / Bruja', emoji: '🧙‍♂️', desc: 'Túnica púrpura' },
              { id: 'dracula', name: 'Drácula', emoji: '🧛', desc: 'Capa vampiro' },
              { id: 'elf', name: 'Duendecito', emoji: '🧝', desc: 'Gorro y orejitas' },
              { id: 'pumpkin', name: 'Calabacita', emoji: '🎃', desc: 'Disfraz calabaza' },
            ].map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => onCostumeChange(c.id as AvatarCostume)}
                className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1 ${
                  costume === c.id
                    ? 'bg-gradient-to-b from-orange-500 to-amber-500 border-amber-200 text-slate-950 font-black shadow-lg scale-[1.03]'
                    : 'bg-purple-950/60 hover:bg-purple-800/60 border-purple-600/50 text-purple-200 font-semibold'
                }`}
              >
                <span className="text-2xl">{c.emoji}</span>
                <span className="text-xs leading-tight">{c.name}</span>
                <span
                  className={`text-[10px] ${
                    costume === c.id ? 'text-slate-900 font-bold' : 'text-purple-300'
                  }`}
                >
                  {c.desc}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Start Game Button */}
        <button
          type="button"
          disabled={!isValidName}
          onClick={onStartGame}
          className={`w-full py-3.5 sm:py-4 rounded-2xl font-black text-base sm:text-xl tracking-wide flex items-center justify-center gap-2 shadow-xl transition-all cursor-pointer ${
            isValidName
              ? 'bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 hover:from-orange-400 hover:to-amber-500 text-slate-950 hover:shadow-orange-500/40 hover:scale-[1.02] active:scale-95'
              : 'bg-purple-900/50 text-purple-400 border border-purple-700/50 cursor-not-allowed opacity-60'
          }`}
        >
          <Play className="w-5 h-5 sm:w-6 sm:h-6 fill-current" />
          COMENZAR AVENTURA
        </button>

        {/* Child advice note */}
        <div className="text-center mt-2.5 text-[11px] text-purple-300/80">
          Usa las flechas o teclas W A S D en computadora, o los botones en pantalla en celular.
        </div>
      </div>
    </div>
  );
};
