import { audioEngine } from "./audioEngine.js";

export const scheduler = {
  isPlaying: false,
  step: 0,
  interval: null,

  play() {
    if (this.isPlaying) return;
    this.isPlaying = true;

    const bpm = 120;
    const stepTime = (60 / bpm) / 4;

    this.interval = setInterval(() => {
      const time = audioEngine.ctx.currentTime;

      audioEngine.tracks.forEach(track => {
        track.notes.forEach(n => {
          if (Math.floor(n.time * 4) === this.step) {
            this.playNote(n, track, time);
          }
        });
      });

      this.step = (this.step + 1) % 16;
    }, stepTime * 1000);
  },

  stop() {
    clearInterval(this.interval);
    this.step = 0;
    this.isPlaying = false;
  },

  playNote(note, track, time) {
    const osc = audioEngine.ctx.createOscillator();
    const gain = audioEngine.ctx.createGain();

    osc.frequency.value = 220 * Math.pow(2, note.pitch / 12);

    osc.connect(gain);
    gain.connect(track.gain);

    gain.gain.setValueAtTime(0.2, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + note.duration);

    osc.start(time);
    osc.stop(time + note.duration);
  }
};