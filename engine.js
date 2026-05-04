class DAWEngine {
  constructor() {
    this.ctx = new AudioContext();

    // 🎛 each instrument has its OWN grid + sound file
    this.instruments = {
      piano: { notes: [], sound: "sounds/piano.wav" },
      triangle: { notes: [], sound: "sounds/triangle.wav" },
      square: { notes: [], sound: "sounds/square.wav" },
      saw: { notes: [], sound: "sounds/saw.wav" },
      bass: { notes: [], sound: "sounds/bass.wav" },
      drums: { notes: [], sound: "sounds/drums.wav" }
    };

    this.current = "piano";

    this.buffers = {};
    this.loadSounds();
  }

  async loadSounds() {
    const keys = Object.keys(this.instruments);

    for (let k of keys) {
      const res = await fetch(this.instruments[k].sound);
      const arr = await res.arrayBuffer();
      this.buffers[k] = await this.ctx.decodeAudioData(arr);
    }
  }

  playBuffer(name) {
    const src = this.ctx.createBufferSource();
    src.buffer = this.buffers[name];
    src.connect(this.ctx.destination);
    src.start();
  }

  play() {
    Object.values(this.instruments).forEach(inst => {
      inst.notes.forEach(n => {
        setTimeout(() => {
          this.playBuffer(this.current);
        }, n.time * 500);
      });
    });
  }

  stop() {}
}

window.DAW = new DAWEngine();