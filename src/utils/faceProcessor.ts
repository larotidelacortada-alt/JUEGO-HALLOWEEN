/**
 * Face Processor for Halloween Mágico
 * Extracts real child face, applies smooth circular transparency mask (RGBA PNG).
 * Preserves exact facial features, skin tone, eyes, smile and hair cleanly without distortion.
 * Allows adjusting face measurement (zoom) and centering (X, Y).
 */

export interface FaceCropSettings {
  centerX: number; // 0..1 relative to original image (Horizontal)
  centerY: number; // 0..1 relative to original image (Vertical)
  zoom: number;    // 0.6 .. 3.0 (Medida / Tamaño de la carita)
  radiusRatio?: number; // 0.46
}

export interface ProcessedFaceResult {
  dataUrl: string;
  canvas: HTMLCanvasElement;
  width: number;
  height: number;
}

/**
 * Detect face center using native FaceDetector if available,
 * or skin-tone centroid analysis fallback.
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

  // 2. Algorithmic Centroid & Skin Tone Fallback:
  const sampleCanvas = document.createElement('canvas');
  sampleCanvas.width = 120;
  sampleCanvas.height = 120;
  const sctx = sampleCanvas.getContext('2d');
  if (!sctx) {
    return { x: 0.5, y: 0.45, size: 0.55 };
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
      x: Math.min(Math.max(cx, 0.25), 0.75),
      y: Math.min(Math.max(cy, 0.25), 0.65),
      size: 0.55
    };
  }

  return { x: 0.5, y: 0.45, size: 0.55 };
}

/**
 * Process the loaded image directly into a crisp, perfectly round circular cutout.
 * No destructive background erasing or avatar filters: the child's photo remains
 * 100% natural, sharp, round and perfectly framed.
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

  // Compute crop box based on zoom and centering
  const zoom = Math.max(0.5, settings.zoom || 1.35);
  const cropDimension = Math.min(w, h) / zoom;
  const cropX = settings.centerX * w - cropDimension / 2;
  const cropY = settings.centerY * h - cropDimension / 2;

  const center = outputSize / 2;
  const radius = outputSize * (settings.radiusRatio || 0.46);

  // Draw source image strictly clipped into a circle
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

  // Smooth anti-aliased edge around the outer boundary
  const imgData = ctx.getImageData(0, 0, outputSize, outputSize);
  const data = imgData.data;
  const rInner = radius - 3.0;
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

  const dataUrl = canvas.toDataURL('image/png');
  return {
    dataUrl,
    canvas,
    width: outputSize,
    height: outputSize,
  };
}

/**
 * Generate built-in friendly child sample faces
 */
export function createSampleFaceCanvas(
  type: 'boy' | 'girl' | 'cute_pumpkin'
): ProcessedFaceResult {
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

  return {
    dataUrl: canvas.toDataURL('image/png'),
    canvas,
    width: size,
    height: size,
  };
}
