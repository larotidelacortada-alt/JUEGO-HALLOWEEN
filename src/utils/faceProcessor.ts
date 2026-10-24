/**
 * Face Processor for Halloween Mágico
 * Extracts real child face, removes background, applies smooth circular transparency mask (RGBA PNG)
 * Preserves exact facial features, skin tone, eyes, smile and hair without AI recreation.
 * Includes interactive background removal and "Modo Avatar Mágico".
 */

export interface FaceCropSettings {
  centerX: number; // 0..1 relative to original image
  centerY: number; // 0..1 relative to original image
  zoom: number;    // 0.5 .. 3.0
  radiusRatio: number; // 0.35 .. 0.5
  removeBackground: boolean;
  bgTolerance: number; // 15..65
  avatarMode: boolean; // Magic Halloween avatar styling & glowing border
}

export interface ProcessedFaceResult {
  dataUrl: string;
  canvas: HTMLCanvasElement;
  width: number;
  height: number;
}

/**
 * Detect face center using native FaceDetector if available,
 * or color-luminance / skin-tone centroid analysis fallback.
 */
export async function detectFaceCenter(img: HTMLImageElement): Promise<{ x: number; y: number; size: number }> {
  const w = img.naturalWidth || img.width;
  const h = img.naturalHeight || img.height;

  // 1. Try native FaceDetector if supported (Chrome/Android/Edge)
  if ('FaceDetector' in window) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const detector = new (window as any).FaceDetector({ fastMode: true, maxDetectedFaces: 1 });
      const faces = await detector.detect(img);
      if (faces && faces.length > 0) {
        const box = faces[0].boundingBox;
        const cx = (box.x + box.width / 2) / w;
        const cy = (box.y + box.height / 2) / h;
        const size = Math.max(box.width, box.height) / Math.min(w, h);
        return { x: cx, y: cy, size: Math.min(Math.max(size, 0.4), 0.8) };
      }
    } catch {
      // Fallback to algorithmic detection
    }
  }

  // 2. High-precision Algorithmic Centroid & Face Area Fallback:
  const sampleCanvas = document.createElement('canvas');
  sampleCanvas.width = 120;
  sampleCanvas.height = 120;
  const sctx = sampleCanvas.getContext('2d');
  if (!sctx) {
    return { x: 0.5, y: 0.42, size: 0.55 };
  }

  sctx.drawImage(img, 0, 0, 120, 120);
  const imgData = sctx.getImageData(0, 0, 120, 120);
  const data = imgData.data;

  let totalSkinWeight = 0;
  let weightedX = 0;
  let weightedY = 0;

  for (let y = 10; y < 110; y++) {
    for (let x = 10; x < 110; x++) {
      const idx = (y * 120 + x) * 4;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];

      const sum = r + g + b || 1;
      const nr = r / sum;
      const ng = g / sum;

      const isSkin = (r > 60 && g > 40 && b > 20) &&
                     (r > g && g >= b) &&
                     (r - g >= 10) &&
                     (nr > 0.35 && nr < 0.65 && ng > 0.25 && ng < 0.42);

      if (isSkin) {
        const verticalWeight = (120 - y) / 120;
        const weight = 1.0 + verticalWeight * 0.5;
        totalSkinWeight += weight;
        weightedX += x * weight;
        weightedY += y * weight;
      }
    }
  }

  if (totalSkinWeight > 100) {
    const cx = (weightedX / totalSkinWeight) / 120;
    const cy = (weightedY / totalSkinWeight) / 120;
    return {
      x: Math.min(Math.max(cx, 0.3), 0.7),
      y: Math.min(Math.max(cy, 0.25), 0.6),
      size: 0.55
    };
  }

  return { x: 0.5, y: 0.42, size: 0.55 };
}

/**
 * Process the loaded image into an RGBA circular transparent PNG canvas
 * Includes background segmentation/removal and "Modo Avatar".
 */
export function renderCircularFaceCutout(
  img: HTMLImageElement,
  settings: FaceCropSettings,
  outputSize = 512
): ProcessedFaceResult {
  const canvas = document.createElement('canvas');
  canvas.width = outputSize;
  canvas.height = outputSize;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error('Could not get 2D context');

  const w = img.naturalWidth || img.width;
  const h = img.naturalHeight || img.height;

  // Clear transparent
  ctx.clearRect(0, 0, outputSize, outputSize);

  // Compute crop box
  const cropDimension = Math.min(w, h) / settings.zoom;
  const cropX = settings.centerX * w - cropDimension / 2;
  const cropY = settings.centerY * h - cropDimension / 2;

  const center = outputSize / 2;
  const radius = outputSize * settings.radiusRatio;

  // Draw source image clipped by circle
  ctx.save();
  ctx.beginPath();
  ctx.arc(center, center, radius, 0, Math.PI * 2);
  ctx.clip();

  ctx.drawImage(
    img,
    cropX, cropY, cropDimension, cropDimension,
    0, 0, outputSize, outputSize
  );
  ctx.restore();

  const imgData = ctx.getImageData(0, 0, outputSize, outputSize);
  const data = imgData.data;

  // --- BACKGROUND REMOVAL (Sample boundary colors & chroma/edge separation) ---
  if (settings.removeBackground) {
    // Sample background colors along perimeter of circular region
    const sampleAngles = 24;
    const bgSamples: { r: number; g: number; b: number }[] = [];
    const sampleR = radius - 8;

    for (let a = 0; a < sampleAngles; a++) {
      const rad = (a / sampleAngles) * Math.PI * 2;
      // Focus especially on top/sides where wall or background is
      const sx = Math.round(center + Math.cos(rad) * sampleR);
      const sy = Math.round(center + Math.sin(rad) * sampleR);
      const sidx = (sy * outputSize + sx) * 4;
      bgSamples.push({
        r: data[sidx],
        g: data[sidx + 1],
        b: data[sidx + 2],
      });
    }

    const tol = settings.bgTolerance;
    const tolSq = tol * tol;

    // Apply distance check on pixels away from face center
    for (let y = 0; y < outputSize; y++) {
      const dy = y - center;
      for (let x = 0; x < outputSize; x++) {
        const dx = x - center;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const idx = (y * outputSize + x) * 4;

        if (dist < radius && dist > radius * 0.45) {
          const r = data[idx];
          const g = data[idx + 1];
          const b = data[idx + 2];

          // Check if pixel matches any background sample
          let minDiffSq = 999999;
          for (let s = 0; s < bgSamples.length; s++) {
            const bgs = bgSamples[s];
            const dr = r - bgs.r;
            const dg = g - bgs.g;
            const db = b - bgs.b;
            const diffSq = dr * dr + dg * dg + db * db;
            if (diffSq < minDiffSq) minDiffSq = diffSq;
          }

          if (minDiffSq < tolSq) {
            // Smoothly reduce alpha for background pixels
            const factor = Math.max(0, Math.min(1, (minDiffSq / tolSq)));
            data[idx + 3] = Math.round(data[idx + 3] * factor * factor);
          }
        }
      }
    }
  }

  // --- EDGE ANTI-ALIASING & CIRCLE CLIPPING ---
  const rInner = radius - 4.0;
  const rOuter = radius;

  for (let y = 0; y < outputSize; y++) {
    const dy = y - center;
    for (let x = 0; x < outputSize; x++) {
      const dx = x - center;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const idx = (y * outputSize + x) * 4;

      if (dist >= rOuter) {
        data[idx + 3] = 0;
      } else if (dist > rInner) {
        const factor = (rOuter - dist) / (rOuter - rInner);
        data[idx + 3] = Math.round(data[idx + 3] * factor);
      }
    }
  }

  ctx.putImageData(imgData, 0, 0);

  // --- MODO AVATAR MÁGICO ENHANCEMENTS ---
  if (settings.avatarMode) {
    ctx.save();
    // 1. Magical glowing avatar circular border
    ctx.beginPath();
    ctx.arc(center, center, radius - 3, 0, Math.PI * 2);
    ctx.strokeStyle = '#f97316'; // vibrant Halloween orange
    ctx.lineWidth = 8;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(center, center, radius - 5, 0, Math.PI * 2);
    ctx.strokeStyle = '#facc15'; // golden inner rim
    ctx.lineWidth = 3;
    ctx.stroke();

    // 2. Cute rosy cheek blush overlay if in avatar mode
    ctx.fillStyle = 'rgba(244, 114, 182, 0.22)';
    ctx.beginPath();
    ctx.arc(center - 75, center + 35, 32, 0, Math.PI * 2);
    ctx.arc(center + 75, center + 35, 32, 0, Math.PI * 2);
    ctx.fill();

    // 3. Cute sparkling stars on avatar border
    ctx.fillStyle = '#fef08a';
    drawStar(ctx, center + Math.cos(-Math.PI * 0.25) * (radius - 5), center + Math.sin(-Math.PI * 0.25) * (radius - 5), 5, 12, 6);
    drawStar(ctx, center + Math.cos(-Math.PI * 0.75) * (radius - 5), center + Math.sin(-Math.PI * 0.75) * (radius - 5), 5, 12, 6);
    drawStar(ctx, center + Math.cos(Math.PI * 0.45) * (radius - 5), center + Math.sin(Math.PI * 0.45) * (radius - 5), 5, 10, 5);

    ctx.restore();
  }

  const dataUrl = canvas.toDataURL('image/png');
  return {
    dataUrl,
    canvas,
    width: outputSize,
    height: outputSize,
  };
}

/**
 * Generate built-in friendly Halloween child sample faces (boy warlock, girl witch, cat face-paint)
 */
export function createSampleFaceCanvas(type: 'boy' | 'girl' | 'cute_pumpkin', avatarMode = true): ProcessedFaceResult {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const center = size / 2;
  const radius = size * 0.46;

  ctx.clearRect(0, 0, size, size);

  ctx.save();
  ctx.beginPath();
  ctx.arc(center, center, radius, 0, Math.PI * 2);
  ctx.clip();

  // Skin base
  const skinColor = type === 'boy' ? '#fed7aa' : type === 'girl' ? '#fcd34d' : '#fdba74';
  ctx.fillStyle = skinColor;
  ctx.fillRect(0, 0, size, size);

  // Rosy cheeks
  ctx.fillStyle = 'rgba(244, 114, 182, 0.35)';
  ctx.beginPath();
  ctx.arc(center - 110, center + 40, 45, 0, Math.PI * 2);
  ctx.arc(center + 110, center + 40, 45, 0, Math.PI * 2);
  ctx.fill();

  // Hair
  ctx.fillStyle = type === 'boy' ? '#78350f' : type === 'girl' ? '#92400e' : '#451a03';
  ctx.beginPath();
  if (type === 'boy') {
    ctx.arc(center, center - 130, 160, Math.PI, Math.PI * 2);
    ctx.lineTo(center + 190, center - 20);
    ctx.lineTo(center + 140, center - 40);
    ctx.lineTo(center + 90, center - 70);
    ctx.lineTo(center, center - 50);
    ctx.lineTo(center - 90, center - 70);
    ctx.lineTo(center - 140, center - 40);
    ctx.lineTo(center - 190, center - 20);
    ctx.closePath();
    ctx.fill();
  } else if (type === 'girl') {
    ctx.arc(center, center - 120, 170, Math.PI, Math.PI * 2);
    ctx.lineTo(center + 180, center + 50);
    ctx.lineTo(center + 140, center - 60);
    ctx.lineTo(center + 60, center - 50);
    ctx.lineTo(center, center - 40);
    ctx.lineTo(center - 60, center - 50);
    ctx.lineTo(center - 140, center - 60);
    ctx.lineTo(center - 180, center + 50);
    ctx.closePath();
    ctx.fill();
  } else {
    ctx.arc(center, center - 140, 160, Math.PI, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ea580c';
    ctx.beginPath();
    ctx.arc(center - 100, center + 35, 25, 0, Math.PI * 2);
    ctx.arc(center + 100, center + 35, 25, 0, Math.PI * 2);
    ctx.fill();
  }

  // Friendly eyes
  ctx.fillStyle = '#1e1b4b';
  ctx.beginPath();
  ctx.arc(center - 70, center - 20, 22, 0, Math.PI * 2);
  ctx.arc(center + 70, center - 20, 22, 0, Math.PI * 2);
  ctx.fill();

  // Eye highlights
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(center - 76, center - 26, 7, 0, Math.PI * 2);
  ctx.arc(center + 64, center - 26, 7, 0, Math.PI * 2);
  ctx.arc(center - 65, center - 15, 3.5, 0, Math.PI * 2);
  ctx.arc(center + 75, center - 15, 3.5, 0, Math.PI * 2);
  ctx.fill();

  // Eyebrows
  ctx.strokeStyle = '#451a03';
  ctx.lineWidth = 6;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.arc(center - 70, center - 55, 25, Math.PI * 1.15, Math.PI * 1.85);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(center + 70, center - 55, 25, Math.PI * 1.15, Math.PI * 1.85);
  ctx.stroke();

  // Button nose
  ctx.fillStyle = '#f97316';
  ctx.beginPath();
  ctx.arc(center, center + 25, 9, 0, Math.PI * 2);
  ctx.fill();

  // Smile
  ctx.fillStyle = '#be123c';
  ctx.beginPath();
  ctx.arc(center, center + 65, 45, 0, Math.PI);
  ctx.closePath();
  ctx.fill();

  // Teeth
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.rect(center - 22, center + 65, 44, 16);
  ctx.fill();

  // Tongue
  ctx.fillStyle = '#fb7185';
  ctx.beginPath();
  ctx.arc(center, center + 95, 24, Math.PI * 1.1, Math.PI * 1.9);
  ctx.fill();

  // Star cheek sticker
  ctx.fillStyle = '#facc15';
  drawStar(ctx, center + 120, center - 40, 5, 14, 7);

  ctx.restore();

  // Edge feathering
  const imgData = ctx.getImageData(0, 0, size, size);
  const data = imgData.data;
  const rInner = radius - 3.5;
  for (let y = 0; y < size; y++) {
    const dy = y - center;
    for (let x = 0; x < size; x++) {
      const dx = x - center;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const idx = (y * size + x) * 4;
      if (dist >= radius) {
        data[idx + 3] = 0;
      } else if (dist > rInner) {
        data[idx + 3] = Math.round(data[idx + 3] * ((radius - dist) / (radius - rInner)));
      }
    }
  }
  ctx.putImageData(imgData, 0, 0);

  if (avatarMode) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(center, center, radius - 3, 0, Math.PI * 2);
    ctx.strokeStyle = '#f97316';
    ctx.lineWidth = 7;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(center, center, radius - 5, 0, Math.PI * 2);
    ctx.strokeStyle = '#facc15';
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.restore();
  }

  return {
    dataUrl: canvas.toDataURL('image/png'),
    canvas,
    width: size,
    height: size,
  };
}

function drawStar(ctx: CanvasRenderingContext2D, cx: number, cy: number, spikes: number, outerRadius: number, innerRadius: number) {
  let rot = Math.PI / 2 * 3;
  let x = cx;
  let y = cy;
  const step = Math.PI / spikes;

  ctx.beginPath();
  ctx.moveTo(cx, cy - outerRadius);
  for (let i = 0; i < spikes; i++) {
    x = cx + Math.cos(rot) * outerRadius;
    y = cy + Math.sin(rot) * outerRadius;
    ctx.lineTo(x, y);
    rot += step;

    x = cx + Math.cos(rot) * innerRadius;
    y = cy + Math.sin(rot) * innerRadius;
    ctx.lineTo(x, y);
    rot += step;
  }
  ctx.lineTo(cx, cy - outerRadius);
  ctx.closePath();
  ctx.fill();
}
