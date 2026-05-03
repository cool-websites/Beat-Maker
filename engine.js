class DAWEngine {
  constructor() {
    this.ctx = new AudioContext();
    this.tracks = [];
    this.step = 0;
    this.interval = null;
    this.isPlaying = false;
    this.recording = false;
    this.activeTrack = 0;
  }

  addTrack(type) {
    const gain = this.ctx.createGain();
    gain.connect(this.ctx.destination);

    this.tracks.push({
      type,
      gain,
      notes: []
    });

    renderTimeline();
  }

  play() {
    if (this.isPlaying) return;
    this.isPlaying = true;

    const bpm = 120;
    const stepTime = (60 / bpm) / 4;

    this.interval = setInterval(() => {

      this.tracks.forEach(track => {
        track.notes.forEach(n => {
          if (Math.floor(n.time * 4) === this.step) {
            this.playNote(n, track);
          }
        });
      });

      this.step = (this.step + 1) % 64;

    }, stepTime * 1000);
  }

  stop() {
    clearInterval(this.interval);
    this.isPlaying = false;
    this.step = 0;
  }

  toggleRecord() {
    this.recording = !this.recording;
  }

  playNote(n, track) {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    const t = track.type;

    osc.type =
      t === "drums" ? "square" :
      t === "bass" ? "sawtooth" :
      t;

    osc.frequency.value =
      t === "drums"
        ? 60 + Math.random() * 120
        : 220 * Math.pow(2, n.pitch / 12);

    gain.gain.value = 0.2;

    osc.connect(gain);
    gain.connect(track.gain);

    osc.start();
    osc.stop(this.ctx.currentTime + n.duration);
  }
}

window.DAW = new DAWEngine();