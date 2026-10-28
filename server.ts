import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import os from 'os';
import { execFile } from 'child_process';
import { promisify } from 'util';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const execFileAsync = promisify(execFile);

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  // Accept raw video buffers up to 150MB
  app.use('/api/convert-to-mp4', express.raw({ type: '*/*', limit: '150mb' }));

  /**
   * Transcodes/remuxes any recorded video (WebM or MP4 stream) into a
   * 100% compliant, universally playable ISO MP4 (H.264 video + AAC audio)
   * with +faststart for immediate web/mobile playback.
   */
  app.post('/api/convert-to-mp4', async (req, res) => {
    let inputPath = '';
    let outputPath = '';
    try {
      const inputBuffer = req.body as Buffer;
      if (!inputBuffer || inputBuffer.length === 0) {
        return res.status(400).json({ error: 'No video payload received' });
      }

      const tempDir = os.tmpdir();
      const uniqueId = `rec_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
      inputPath = path.join(tempDir, `${uniqueId}.in`);
      outputPath = path.join(tempDir, `${uniqueId}.mp4`);

      await fs.promises.writeFile(inputPath, inputBuffer);

      // FFmpeg command: H.264 High Profile, CRF 19 (visually lossless Full HD master quality), AAC 192k, faststart
      try {
        await execFileAsync('ffmpeg', [
          '-y',
          '-i', inputPath,
          '-c:v', 'libx264',
          '-preset', 'veryfast',
          '-crf', '19',
          '-pix_fmt', 'yuv420p',
          '-c:a', 'aac',
          '-b:a', '192k',
          '-movflags', '+faststart',
          outputPath,
        ]);
      } catch {
        // Fallback in case source lacks audio stream or requires auto-encoding
        await execFileAsync('ffmpeg', [
          '-y',
          '-i', inputPath,
          '-c:v', 'libx264',
          '-preset', 'veryfast',
          '-crf', '19',
          '-pix_fmt', 'yuv420p',
          '-movflags', '+faststart',
          outputPath,
        ]);
      }

      const mp4Buffer = await fs.promises.readFile(outputPath);

      res.setHeader('Content-Type', 'video/mp4');
      res.setHeader('Content-Disposition', 'attachment; filename="aventura_halloween.mp4"');
      res.setHeader('Content-Length', mp4Buffer.length);
      return res.send(mp4Buffer);
    } catch (err) {
      console.error('Error during MP4 conversion:', err);
      return res.status(500).json({ error: 'MP4 conversion failed' });
    } finally {
      // Clean up temp files
      if (inputPath) fs.promises.unlink(inputPath).catch(() => {});
      if (outputPath) fs.promises.unlink(outputPath).catch(() => {});
    }
  });

  // Health endpoint
  app.get('/api/health', (_req, res) => {
    res.json({ ok: true, format: 'mp4', ffmpeg: true });
  });

  const isProduction = process.env.NODE_ENV === 'production';
  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
