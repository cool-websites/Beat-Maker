class DAWEngine {
  constructor() {
    this.ctx = new AudioContext();
    this.tracks = [];
    this.isPlaying = false;
    this.step = 0;
    this.interval = null;
  }

  addTrack() {
    this.tracks.push({
      volume: 1,
      notes: []
    });

    this.refreshUI();
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

  playNote(note, track) {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.frequency.value = 220 * Math.pow(2, note.pitch / 12);

    gain.gain.value = 0.2 * track.volume;

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + note.duration);
  }

  // 💾 SAFE SAVE (FIXED)
  save() {
    const clean = this.tracks.map(t => ({
      volume: t.volume,
      notes: t.notes.map(n => ({ ...n }))
    }));

    localStorage.setItem("daw_project", JSON.stringify(clean));
    alert("Saved project");
  }

  // 📂 SAFE LOAD (FIXED)
  load() {
    const data = JSON.parse(localStorage.getItem("daw_project"));
    if (!data) return;

    this.tracks = data;
    this.refreshUI();
    alert("Loaded project");
  }

  refreshUI() {
    renderTimeline();
  }
}

window.DAW = new DAWEngine();