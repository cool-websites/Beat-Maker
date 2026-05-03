class DAWEngine {
  constructor() {
    this.ctx = new AudioContext();
    this.tracks = [];
    this.step = 0;
    this.interval = null;
    this.isPlaying = false;

    this.instrument = "sine";
  }

  addTrack() {
    const gain = this.ctx.createGain();
    gain.connect(this.ctx.destination);

    this.tracks.push({
      gain,
      notes: [],
      volume: 1
    });

    renderTimeline();
  }

  setInstrument(type) {
    this.instrument = type;
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

      updatePlayhead(this.step);

      this.step = (this.step + 1) % 16;

    }, stepTime * 1000);
  }

  stop() {
    clearInterval(this.interval);
    this.isPlaying = false;
    this.step = 0;
  }

  playNote(n, track) {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    const inst = this.instrument;

    osc.type = inst === "drums" ? "square" : inst;

    osc.frequency.value = inst === "drums"
      ? 60 + Math.random() * 100
      : 220 * Math.pow(2, n.pitch / 12);

    gain.gain.value = inst === "drums" ? 0.5 : 0.2;

    osc.connect(gain);
    gain.connect(track.gain);

    osc.start();
    osc.stop(this.ctx.currentTime + n.duration);
  }

  save() {
    const clean = this.tracks.map(t => ({
      volume: t.volume,
      notes: t.notes
    }));

    localStorage.setItem("daw", JSON.stringify(clean));
  }

  load() {
    const data = JSON.parse(localStorage.getItem("daw"));
    if (!data) return;

    this.tracks = data;
    renderTimeline();
  }
}

window.DAW = new DAWEngine();