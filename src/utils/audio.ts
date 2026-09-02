/**
 * Web Audio API synthesizer for Spider-Man sound effects
 * Generates dynamic Thwip!, Spidey Sense tingling, and Cinematic Bass Drone
 */

class SoundEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;

  private initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  /**
   * Classic web shooter "THWIP!" sound
   * Fast frequency sweep with pressurized white noise burst
   */
  public playThwip() {
    if (this.isMuted) return;
    try {
      this.initContext();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;

      // 1. High-frequency whistle / hiss
      const osc = this.ctx.createOscillator();
      const oscGain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(1800, now);
      osc.frequency.exponentialRampToValueAtTime(320, now + 0.12);

      oscGain.gain.setValueAtTime(0.3, now);
      oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

      osc.connect(oscGain);
      oscGain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.15);

      // 2. Air burst / noise burst (pressurized web release)
      const bufferSize = this.ctx.sampleRate * 0.15;
      const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.04));
      }

      const whiteNoise = this.ctx.createBufferSource();
      whiteNoise.buffer = noiseBuffer;

      const noiseFilter = this.ctx.createBiquadFilter();
      noiseFilter.type = 'bandpass';
      noiseFilter.frequency.setValueAtTime(3500, now);
      noiseFilter.frequency.exponentialRampToValueAtTime(800, now + 0.12);
      noiseFilter.Q.setValueAtTime(3, now);

      const noiseGain = this.ctx.createGain();
      noiseGain.gain.setValueAtTime(0.5, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

      whiteNoise.connect(noiseFilter);
      noiseFilter.connect(noiseGain);
      noiseGain.connect(this.ctx.destination);

      whiteNoise.start(now);
      whiteNoise.stop(now + 0.16);

      // 3. Web Snap / Impact string snap
      const snapOsc = this.ctx.createOscillator();
      const snapGain = this.ctx.createGain();
      snapOsc.type = 'triangle';
      snapOsc.frequency.setValueAtTime(850, now + 0.04);
      snapOsc.frequency.exponentialRampToValueAtTime(120, now + 0.18);

      snapGain.gain.setValueAtTime(0.25, now + 0.04);
      snapGain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

      snapOsc.connect(snapGain);
      snapGain.connect(this.ctx.destination);
      snapOsc.start(now + 0.04);
      snapOsc.stop(now + 0.19);
    } catch {
      // Audio context might be restricted before interaction
    }
  }

  /**
   * Spidey Sense tingling chime
   * High-frequency vibrating shimmer with resonant rings
   */
  public playSpideySense() {
    if (this.isMuted) return;
    try {
      this.initContext();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      const frequencies = [587.33, 880.00, 1174.66, 1760.00, 2349.32]; // D5, A5, D6, A6, D7

      frequencies.forEach((freq, idx) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const vibrato = this.ctx.createOscillator();
        const vibratoGain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.03);

        // Fast electrical vibration
        vibrato.frequency.setValueAtTime(14 + idx * 2, now);
        vibratoGain.gain.setValueAtTime(freq * 0.05, now);
        vibrato.connect(osc.frequency);

        gain.gain.setValueAtTime(0, now + idx * 0.03);
        gain.gain.linearRampToValueAtTime(0.12 / (idx + 1), now + idx * 0.03 + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.8 + idx * 0.1);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        vibrato.start(now + idx * 0.03);
        osc.start(now + idx * 0.03);
        osc.stop(now + 0.9 + idx * 0.1);
        vibrato.stop(now + 0.9 + idx * 0.1);
      });
    } catch {
      // Ignore audio policy errors
    }
  }

  /**
   * Deep cinematic boom / switch whoosh
   */
  public playCinematicBoom() {
    if (this.isMuted) return;
    try {
      this.initContext();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(130, now);
      osc.frequency.exponentialRampToValueAtTime(35, now + 0.6);

      gain.gain.setValueAtTime(0.4, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.7);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.7);
    } catch {
      // Ignore
    }
  }

  /**
   * Powerful Screen Earthquake Shake rumble and dimensional distortion sound
   */
  public playEarthquakeShake() {
    if (this.isMuted) return;
    try {
      this.initContext();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;

      // 1. Sub-bass earthquake rumble
      const rumbleOsc = this.ctx.createOscillator();
      const rumbleGain = this.ctx.createGain();
      rumbleOsc.type = 'sawtooth';
      rumbleOsc.frequency.setValueAtTime(55, now);
      rumbleOsc.frequency.linearRampToValueAtTime(30, now + 0.8);

      const rumbleFilter = this.ctx.createBiquadFilter();
      rumbleFilter.type = 'lowpass';
      rumbleFilter.frequency.setValueAtTime(120, now);
      rumbleFilter.frequency.linearRampToValueAtTime(60, now + 0.8);

      rumbleGain.gain.setValueAtTime(0.5, now);
      rumbleGain.gain.exponentialRampToValueAtTime(0.001, now + 0.85);

      rumbleOsc.connect(rumbleFilter);
      rumbleFilter.connect(rumbleGain);
      rumbleGain.connect(this.ctx.destination);

      rumbleOsc.start(now);
      rumbleOsc.stop(now + 0.9);

      // 2. Heavy crash and glitch impact
      const crashOsc = this.ctx.createOscillator();
      const crashGain = this.ctx.createGain();
      crashOsc.type = 'triangle';
      crashOsc.frequency.setValueAtTime(220, now);
      crashOsc.frequency.exponentialRampToValueAtTime(40, now + 0.6);

      crashGain.gain.setValueAtTime(0.35, now);
      crashGain.gain.exponentialRampToValueAtTime(0.001, now + 0.65);

      crashOsc.connect(crashGain);
      crashGain.connect(this.ctx.destination);

      crashOsc.start(now);
      crashOsc.stop(now + 0.7);
    } catch {
      // Ignore
    }
  }

  /**
   * Camera snapshot shutter click sound
   */
  public playCameraShutter() {
    if (this.isMuted) return;
    try {
      this.initContext();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      // High click
      const osc1 = this.ctx.createOscillator();
      const gain1 = this.ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(1400, now);
      osc1.frequency.exponentialRampToValueAtTime(300, now + 0.05);
      gain1.gain.setValueAtTime(0.3, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

      osc1.connect(gain1);
      gain1.connect(this.ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.07);

      // Shutter release click
      const osc2 = this.ctx.createOscillator();
      const gain2 = this.ctx.createGain();
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(800, now + 0.06);
      osc2.frequency.exponentialRampToValueAtTime(180, now + 0.14);
      gain2.gain.setValueAtTime(0.25, now + 0.06);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

      osc2.connect(gain2);
      gain2.connect(this.ctx.destination);
      osc2.start(now + 0.06);
      osc2.stop(now + 0.16);
    } catch {
      // Ignore
    }
  }

  /**
   * Satisfying harmonic cinematic confirmation chime for the OK button
   */
  public playOkClick() {
    if (this.isMuted) return;
    try {
      this.initContext();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6 arpeggio chime

      notes.forEach((freq, i) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + i * 0.04);

        gain.gain.setValueAtTime(0.2, now + i * 0.04);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.04 + 0.28);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now + i * 0.04);
        osc.stop(now + i * 0.04 + 0.3);
      });
    } catch {
      // Ignore
    }
  }
}

export const sound = new SoundEngine();
