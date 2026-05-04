class DAWEngine {
  constructor() {
    this.ctx = new AudioContext();
    this.tracks = [];
    this.step = 0;
    this.interval = null;
    this.currentGrid = "sine";

    this.grids = {
      sine: [],
      triangle: [],
      square: [],
      sawtooth: [],
      bass: [],
      drums: []
    };
  }

  addTrack(type) {
    const gain = this.ctx.createGain();
    gain.connect(this.ctx.destination);

    this.tracks.push({
      type,
      gain,
      notes: this.grids[type]
    });

    renderTimeline();
  }

  setGrid(type) {
    this.currentGrid = type;
    renderInstrumentGrid();
  }

  play() {
    if (this.interval) return;

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
    this.interval = null;
    this.step = 0;
  }

  playNote(n, track) {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = track.type === "drums" ? "square" : track.type;

    osc.frequency.value =
      track.type === "drums"
        ? 120 + Math.random() * 80
        : 220 * Math.pow(2, n.pitch / 12);

    gain.gain.value = 0.2;

    osc.connect(gain);
    gain.connect(track.gain);

    osc.start();
    osc.stop(this.ctx.currentTime + n.duration);
  }
}

window.DAW = new DAWEngine();