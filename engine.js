class DAWEngine {
  constructor() {
    this.ctx = new AudioContext();
    this.tracks = [];
    this.step = 0;
    this.interval = null;
    this.isPlaying = false;
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

  toggleRecord() {}

  playNote(n, track) {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = track.type === "drums" ? "square" : track.type;

    osc.frequency.value =
      track.type === "drums"
        ? 100 + Math.random() * 100
        : 220 * Math.pow(2, n.pitch / 12);

    gain.gain.value = 0.2;

    osc.connect(gain);
    gain.connect(track.gain);

    osc.start();
    osc.stop(this.ctx.currentTime + n.duration);
  }

  // 🎧 REAL WAV EXPORT
  async exportWAV() {
    const length = 10;
    const sampleRate = 44100;

    const offline = new OfflineAudioContext(
      2,
      sampleRate * length,
      sampleRate
    );

    this.tracks.forEach(track => {
      const gain = offline.createGain();
      gain.connect(offline.destination);

      track.notes.forEach(n => {
        const osc = offline.createOscillator();
        const g = offline.createGain();

        osc.type = track.type === "drums" ? "square" : track.type;

        osc.frequency.value =
          track.type === "drums"
            ? 120 + Math.random() * 80
            : 220 * Math.pow(2, n.pitch / 12);

        g.gain.value = 0.2;

        osc.connect(g);
        g.connect(gain);

        const start = n.time * 0.5;
        osc.start(start);
        osc.stop(start + n.duration * 0.5);
      });
    });

    const buffer = await offline.startRendering();
    const wav = bufferToWav(buffer);

    const url = URL.createObjectURL(wav);
    const a = document.createElement("a");
    a.href = url;
    a.download = "song.wav";
    a.click();
  }
}

window.DAW = new DAWEngine();

/* WAV ENCODER */
function bufferToWav(buffer) {
  const length = buffer.length * 2 + 44;
  const arrayBuffer = new ArrayBuffer(length);
  const view = new DataView(arrayBuffer);

  function write(str, offset) {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  }

  write("RIFF", 0);
  view.setUint32(4, 36 + buffer.length * 2, true);
  write("WAVE", 8);
  write("fmt ", 12);
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 2, true);
  view.setUint32(24, buffer.sampleRate, true);
  view.setUint32(28, buffer.sampleRate * 4, true);
  view.setUint16(32, 4, true);
  view.setUint16(34, 16, true);
  write("data", 36);
  view.setUint32(40, buffer.length * 4, true);

  let offset = 44;

  for (let i = 0; i < buffer.length; i++) {
    for (let ch = 0; ch < 2; ch++) {
      let sample = buffer.getChannelData(0)[i];
      sample = Math.max(-1, Math.min(1, sample));
      view.setInt16(offset, sample * 0x7fff, true);
      offset += 2;
    }
  }

  return new Blob([arrayBuffer], { type: "audio/wav" });
}