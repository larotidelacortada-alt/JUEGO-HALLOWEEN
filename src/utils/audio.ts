// Web Audio API procedural sound synthesizer for Halloween Mágico
// Zero external files, 100% offline & instantaneous
// Supports media streaming so gameplay videos record both visual and sound effects

class SoundController {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private mediaStreamDest: MediaStreamAudioDestinationNode | null = null;
  private musicInterval: number | null = null;
  private isMuted: boolean = false;
  private isMusicPlaying: boolean = false;

  private initCtx() {
    if (!this.ctx) {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioContextClass();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(1.0, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      if (typeof this.ctx.createMediaStreamDestination === 'function') {
        this.mediaStreamDest = this.ctx.createMediaStreamDestination();
        this.masterGain.connect(this.mediaStreamDest);
      }
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  private getDestinationNode(): AudioNode {
    this.initCtx();
    return this.masterGain || this.ctx!.destination;
  }

  public getAudioTrack(): MediaStreamTrack | null {
    this.initCtx();
    return this.mediaStreamDest?.stream.getAudioTracks()[0] || null;
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (muted && this.musicInterval) {
      this.stopMusic();
    }
  }

  public getMuted() {
    return this.isMuted;
  }

  // Play a bouncy jump sound
  public playJump() {
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(180, t);
      osc.frequency.exponentialRampToValueAtTime(440, t + 0.18);

      gain.gain.setValueAtTime(0.25, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.2);

      osc.connect(gain);
      gain.connect(this.getDestinationNode());

      osc.start(t);
      osc.stop(t + 0.22);
    } catch {
      // Audio context might fail in silent environments
    }
  }

  // Play magical candy chime
  public playCandyChime() {
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const t = this.ctx.currentTime;
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
      notes.forEach((freq, idx) => {
        if (!this.ctx) return;
        const noteTime = t + idx * 0.05;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, noteTime);

        gain.gain.setValueAtTime(0.2, noteTime);
        gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.25);

        osc.connect(gain);
        gain.connect(this.getDestinationNode());

        osc.start(noteTime);
        osc.stop(noteTime + 0.26);
      });
    } catch {
      // silent
    }
  }

  // Play interactive pumpkin sparkle
  public playPumpkinMagic() {
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(320, t);
      osc.frequency.linearRampToValueAtTime(600, t + 0.1);
      osc.frequency.linearRampToValueAtTime(450, t + 0.25);
      osc.frequency.linearRampToValueAtTime(800, t + 0.4);

      gain.gain.setValueAtTime(0.22, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.45);

      osc.connect(gain);
      gain.connect(this.getDestinationNode());

      osc.start(t);
      osc.stop(t + 0.46);
    } catch {
      // silent
    }
  }

  // Play victory fanfare with chords and celebratory glissando
  public playVictoryFanfare() {
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const t = this.ctx.currentTime;

      const fanfareChords = [
        { notes: [261.63, 329.63, 392.0], start: 0, dur: 0.25 }, // C
        { notes: [349.23, 440.0, 523.25], start: 0.26, dur: 0.25 }, // F
        { notes: [392.0, 493.88, 587.33], start: 0.52, dur: 0.3 }, // G
        { notes: [523.25, 659.25, 783.99, 1046.5], start: 0.85, dur: 1.2 }, // High C major
      ];

      fanfareChords.forEach(chord => {
        chord.notes.forEach(freq => {
          if (!this.ctx) return;
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();

          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, t + chord.start);

          gain.gain.setValueAtTime(0.18, t + chord.start);
          gain.gain.exponentialRampToValueAtTime(0.001, t + chord.start + chord.dur);

          osc.connect(gain);
          gain.connect(this.getDestinationNode());

          osc.start(t + chord.start);
          osc.stop(t + chord.start + chord.dur + 0.05);
        });
      });
    } catch {
      // silent
    }
  }

  // Cute, subtle Halloween musical chime loop
  public startMusic() {
    if (this.isMusicPlaying || this.isMuted) return;
    this.initCtx();
    this.isMusicPlaying = true;

    const melody = [
      { note: 293.66, dur: 0.2 }, // D4
      { note: 349.23, dur: 0.2 }, // F4
      { note: 440.0, dur: 0.3 },  // A4
      { note: 392.0, dur: 0.2 },  // G4
      { note: 349.23, dur: 0.3 }, // F4
      { note: 329.63, dur: 0.2 }, // E4
      { note: 293.66, dur: 0.4 }, // D4
      { note: 440.0, dur: 0.2 },  // A4
      { note: 523.25, dur: 0.25 },// C5
      { note: 440.0, dur: 0.3 },  // A4
      { note: 392.0, dur: 0.2 },  // G4
      { note: 349.23, dur: 0.3 }, // F4
      { note: 293.66, dur: 0.5 }, // D4
    ];

    let noteIdx = 0;
    this.musicInterval = window.setInterval(() => {
      if (this.isMuted || !this.ctx) return;
      const item = melody[noteIdx % melody.length];
      noteIdx++;

      try {
        const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(item.note, t);

        gain.gain.setValueAtTime(0.04, t);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + item.dur);

        osc.connect(gain);
        gain.connect(this.getDestinationNode());

        osc.start(t);
        osc.stop(t + item.dur + 0.05);
      } catch {
        // silent
      }
    }, 450);
  }

  public stopMusic() {
    if (this.musicInterval) {
      clearInterval(this.musicInterval);
      this.musicInterval = null;
    }
    this.isMusicPlaying = false;
  }
}

export const soundManager = new SoundController();
