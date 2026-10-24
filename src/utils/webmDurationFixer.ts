/**
 * Pure TypeScript WebM Duration Fixer for MediaRecorder in Chrome/Chromium.
 * Injects the exact duration (in ms) into the WebM EBML header so that
 * video players (HTML5 video, QuickTime, VLC, Windows Media Player)
 * show the accurate total runtime (e.g. 35s, 50s) and allow full scrubbing.
 */

export async function fixWebmDuration(blob: Blob, durationMs: number): Promise<Blob> {
  try {
    const buffer = await blob.arrayBuffer();
    const view = new DataView(buffer);
    const bytes = new Uint8Array(buffer);

    // Find Segment (0x18538067)
    let segmentPos = -1;
    for (let i = 0; i < bytes.length - 4; i++) {
      if (bytes[i] === 0x18 && bytes[i + 1] === 0x53 && bytes[i + 2] === 0x80 && bytes[i + 3] === 0x67) {
        segmentPos = i;
        break;
      }
    }

    if (segmentPos === -1) {
      return blob; // Not a standard EBML WebM
    }

    // Find Info (0x1549A966) inside Segment
    let infoPos = -1;
    for (let i = segmentPos + 4; i < Math.min(bytes.length - 4, segmentPos + 400); i++) {
      if (bytes[i] === 0x15 && bytes[i + 1] === 0x49 && bytes[i + 2] === 0xa9 && bytes[i + 3] === 0x66) {
        infoPos = i;
        break;
      }
    }

    if (infoPos === -1) {
      return blob;
    }

    // Read Info size (VINT)
    let infoHeaderLen = 4; // Info ID length
    const firstSizeByte = bytes[infoPos + infoHeaderLen];
    let infoSizeLen = 1;
    let mask = 0x80;
    while ((firstSizeByte & mask) === 0 && mask > 0) {
      infoSizeLen++;
      mask >>= 1;
    }
    infoHeaderLen += infoSizeLen;
    const infoPayloadStart = infoPos + infoHeaderLen;

    // Search for TimecodeScale (0x2AD7B1) inside Info
    let timecodeScale = 1000000; // default: 1ms
    let durationPos = -1;
    let durationLen = 0;

    for (let i = infoPayloadStart; i < Math.min(bytes.length - 4, infoPayloadStart + 250); i++) {
      // TimecodeScale: 0x2A, 0xD7, 0xB1
      if (bytes[i] === 0x2a && bytes[i + 1] === 0xd7 && bytes[i + 2] === 0xb1) {
        const tcSizeLen = 1;
        const tcValLen = bytes[i + 3] & 0x7f;
        if (tcValLen === 3) {
          timecodeScale = (bytes[i + 4] << 16) | (bytes[i + 5] << 8) | bytes[i + 6];
        } else if (tcValLen === 4) {
          timecodeScale = view.getUint32(i + 4, false);
        }
      }

      // Duration: 0x44, 0x89
      if (bytes[i] === 0x44 && bytes[i + 1] === 0x89) {
        durationPos = i;
        durationLen = (bytes[i + 2] & 0x7f); // usually 4 (float32) or 8 (float64)
        break;
      }
    }

    // Target duration in timecode scale units
    const timecodeScaleMs = timecodeScale / 1000000;
    const durationInScale = durationMs / (timecodeScaleMs || 1);

    if (durationPos !== -1) {
      // Overwrite existing duration in-place
      const floatPos = durationPos + 3;
      if (durationLen === 4) {
        view.setFloat32(floatPos, durationInScale, false);
      } else if (durationLen === 8) {
        view.setFloat64(floatPos, durationInScale, false);
      }
      return new Blob([buffer], { type: blob.type });
    } else {
      // Duration not present inside Info: insert it!
      // Element: [0x44, 0x89, 0x88 (8 bytes float64), 8 bytes of float64 in BE]
      const durationBytes = new Uint8Array(11);
      durationBytes[0] = 0x44;
      durationBytes[1] = 0x89;
      durationBytes[2] = 0x88; // 8 bytes float64
      const durView = new DataView(durationBytes.buffer);
      durView.setFloat64(3, durationInScale, false);

      // Create new buffer inserting durationBytes at infoPayloadStart
      const newBuffer = new Uint8Array(buffer.byteLength + 11);
      newBuffer.set(bytes.subarray(0, infoPayloadStart), 0);
      newBuffer.set(durationBytes, infoPayloadStart);
      newBuffer.set(bytes.subarray(infoPayloadStart), infoPayloadStart + 11);

      return new Blob([newBuffer.buffer], { type: blob.type });
    }
  } catch {
    // If patching fails for any reason, return the original blob safely
    return blob;
  }
}
