class DAWEngine {

  constructor() {

    this.ctx = new AudioContext();

    // 🎛 SINGLE SOURCE OF TRUTH
    this.song = {
      tracks: []
    };

    // 🎹 instrument definitions
    this.instruments = [
      "piano",
      "triangle",
      "square",
      "saw",
      "bass",
      "drums"
    ];

    // 🎧 audio buffers
    this.buffers = {};

    this.currentTrack = 0;

    this.setupTracks();
    this.loadSounds();
  }

  setupTracks() {

    this.song.tracks = this.instruments.map(name => ({
      instrument: name,
      notes: []
    }));

  }

  async loadSounds() {

    for (const name of this.instruments) {

      try {

        const response =
          await fetch(`sounds/${name}.wav`);

        const arrayBuffer =
          await response.arrayBuffer();

        this.buffers[name] =
          await this.ctx.decodeAudioData(arrayBuffer);

      } catch (e) {

        console.warn("Missing sound:", name);

      }

    }

  }

  playSample(name) {

    const buffer = this.buffers[name];

    if (!buffer) return;

    const src =
      this.ctx.createBufferSource();

    src.buffer = buffer;

    src.connect(this.ctx.destination);

    src.start();

  }

  play() {

    this.stop();

    this.song.tracks.forEach(track => {

      track.notes.forEach(note => {

        setTimeout(() => {

          this.playSample(track.instrument);

        }, note.time * 500);

      });

    });

  }

  stop() {

    // future transport system
  }

}

window.DAW = new DAWEngine();