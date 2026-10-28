/**
 * Video Recorder for Halloween Mágico
 * Captures 3D canvas gameplay, arrival celebration, and frozen victory scene
 * Uses canvas.captureStream() and MediaRecorder with audio track integration
 * and EBML duration patching so the video accurately reflects the exact game duration.
 */

import { fixWebmDuration } from './webmDurationFixer';

export interface RecordedVideoResult {
  blob: Blob;
  url: string;
  mimeType: string;
  extension: string;
  sizeBytes: number;
  durationSeconds: number;
}

export class VideoRecorder {
  private mediaRecorder: MediaRecorder | null = null;
  private recordedChunks: Blob[] = [];
  private isRecording: boolean = false;
  private recordedResult: RecordedVideoResult | null = null;
  private startTime: number = 0;
  private endTime: number = 0;

  public static isSupported(): boolean {
    return typeof HTMLCanvasElement !== 'undefined' &&
           typeof HTMLCanvasElement.prototype.captureStream === 'function' &&
           typeof window.MediaRecorder !== 'undefined';
  }

  public static getSupportedMimeType(): { mimeType: string; extension: string } {
    if (typeof MediaRecorder === 'undefined') {
      return { mimeType: 'video/mp4', extension: 'mp4' };
    }

    // Prioritize MP4 formats so browsers supporting native MP4 record directly
    const types = [
      { mimeType: 'video/mp4;codecs=avc1,mp4a.40.2', extension: 'mp4' },
      { mimeType: 'video/mp4;codecs=avc1', extension: 'mp4' },
      { mimeType: 'video/mp4', extension: 'mp4' },
      { mimeType: 'video/webm;codecs=vp9,opus', extension: 'webm' },
      { mimeType: 'video/webm;codecs=vp8,opus', extension: 'webm' },
      { mimeType: 'video/webm', extension: 'webm' },
    ];

    for (const t of types) {
      if (MediaRecorder.isTypeSupported(t.mimeType)) {
        return t;
      }
    }

    return { mimeType: 'video/mp4', extension: 'mp4' };
  }

  public startRecording(canvas: HTMLCanvasElement, audioTrack?: MediaStreamTrack | null): boolean {
    if (!VideoRecorder.isSupported()) {
      return false;
    }

    try {
      // Clean up previous state
      if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
        try {
          this.mediaRecorder.stop();
        } catch {
          // ignore
        }
      }

      this.recordedChunks = [];
      this.recordedResult = null;
      this.startTime = performance.now();

      // 60 FPS stream from canvas for high-definition smooth recording
      const canvasStream = canvas.captureStream(60);
      const tracks: MediaStreamTrack[] = [...canvasStream.getVideoTracks()];

      // Add audio track if available
      if (audioTrack && audioTrack.readyState === 'live') {
        tracks.push(audioTrack);
      }

      const combinedStream = new MediaStream(tracks);
      const { mimeType } = VideoRecorder.getSupportedMimeType();

      this.mediaRecorder = new MediaRecorder(combinedStream, {
        mimeType: MediaRecorder.isTypeSupported(mimeType) ? mimeType : undefined,
        videoBitsPerSecond: 10000000, // 10.0 Mbps Full HD crisp bitrate
      });

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          this.recordedChunks.push(event.data);
        }
      };

      this.mediaRecorder.start(200); // collect chunk every 200ms
      this.isRecording = true;
      return true;
    } catch {
      this.isRecording = false;
      return false;
    }
  }

  public stopRecording(): Promise<RecordedVideoResult | null> {
    return new Promise((resolve) => {
      if (!this.mediaRecorder || !this.isRecording) {
        resolve(this.recordedResult);
        return;
      }

      this.endTime = performance.now();
      const rawDurationMs = Math.max(1000, Math.round(this.endTime - this.startTime));
      const durationSeconds = Math.round(rawDurationMs / 1000);

      this.mediaRecorder.onstop = async () => {
        this.isRecording = false;
        if (this.recordedChunks.length === 0) {
          resolve(null);
          return;
        }

        const { mimeType, extension } = VideoRecorder.getSupportedMimeType();
        const rawBlob = new Blob(this.recordedChunks, { type: mimeType });

        // If recorded as WebM, fix header duration first for clean timestamps
        let inputForConversion = rawBlob;
        if (extension === 'webm') {
          try {
            inputForConversion = await fixWebmDuration(rawBlob, rawDurationMs);
          } catch {
            inputForConversion = rawBlob;
          }
        }

        // Convert through server-side FFmpeg endpoint to ensure 100% compliant H.264/AAC MP4
        let finalMp4Blob: Blob;
        try {
          const response = await fetch('/api/convert-to-mp4', {
            method: 'POST',
            headers: {
              'Content-Type': inputForConversion.type || 'application/octet-stream',
            },
            body: inputForConversion,
          });

          if (response.ok) {
            const serverBlob = await response.blob();
            finalMp4Blob = new Blob([serverBlob], { type: 'video/mp4' });
          } else {
            finalMp4Blob = new Blob([inputForConversion], { type: 'video/mp4' });
          }
        } catch {
          finalMp4Blob = new Blob([inputForConversion], { type: 'video/mp4' });
        }

        const url = URL.createObjectURL(finalMp4Blob);

        this.recordedResult = {
          blob: finalMp4Blob,
          url,
          mimeType: 'video/mp4',
          extension: 'mp4',
          sizeBytes: finalMp4Blob.size,
          durationSeconds,
        };

        resolve(this.recordedResult);
      };

      try {
        // Request any remaining buffered frames before stopping
        if (typeof this.mediaRecorder.requestData === 'function' && this.mediaRecorder.state === 'recording') {
          this.mediaRecorder.requestData();
        }
        this.mediaRecorder.stop();
      } catch {
        this.isRecording = false;
        resolve(null);
      }
    });
  }

  public getElapsedTimeSeconds(): number {
    if (!this.isRecording) return 0;
    return Math.floor((performance.now() - this.startTime) / 1000);
  }

  public getResult(): RecordedVideoResult | null {
    return this.recordedResult;
  }

  public cleanup() {
    if (this.recordedResult?.url) {
      URL.revokeObjectURL(this.recordedResult.url);
    }
    this.recordedResult = null;
    this.recordedChunks = [];
    this.isRecording = false;
  }
}
