class DAWEngine {
  constructor() {
    this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    this.tracks = [];
    this.isPlaying = false;
    this.step = 0;
    this.interval = null;
    this.startTime = 0;
  }

  addTrack() {
    const gain = this.ctx.createGain();
    gain.connect(this.ctx.destination);

    this.tracks.push({
      gain,
      notes: [],
      clips: [],
      effects: { gain: 1 }
    });

    this.renderMixer();
    this.renderTimeline();
  }

  // 🎧 AUDIO PLAYBACK ENGINE
  play() {
    if (this.isPlaying) return;
    this.isPlaying = true;

    const bpm = 120;
    const stepTime = (60 / bpm) / 4;

    this.startTime = this.ctx.currentTime;

    this.interval = setInterval(() => {

      this.tracks.forEach(track => {

        track.notes.forEach(n => {
          if (Math.floor(n.time * 4) === this.step) {
            this.playNote(n, track);
          }
        });

      });

      this.updatePlayhead(this.step);

      this.step = (this.step + 1) % 16;

    }, stepTime * 1000);
  }

  stop() {
    clearInterval(this.interval);
    this.step = 0;
    this.isPlaying = false;
  }

  playNote(note, track) {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.frequency.value = 220 * Math.pow(2, note.pitch / 12);

    osc.connect(gain);
    gain.connect(track.gain);

    gain.gain.value = 0.2;

    const t = this.ctx.currentTime;
    osc.start(t);
    osc.stop(t + note.duration);
  }

  updatePlayhead(step) {
    const ph = document.getElementById("playhead");
    if (ph) ph.style.left = step * 40 + "px";
  }

  save() {
    localStorage.setItem("daw", JSON.stringify(this.tracks));
    alert("Saved");
  }

  load() {
    const data = JSON.parse(localStorage.getItem("daw"));
    if (!data) return;
    this.tracks = data;
    this.renderTimeline();
  }

  // placeholder UI hooks
  renderTimeline() {}
  renderMixer() {}
}

window.DAW = new DAWEngine();