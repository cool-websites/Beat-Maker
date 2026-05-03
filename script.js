const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

const instruments = ["kick", "snare", "hihat", "clap", "bass"];
const steps = 16;

let bpm = 120;
let step = 0;
let playing = false;
let interval;

let grid = {};
let piano = [];
let buffers = {};
let gains = {};

// ---------------- LOAD ----------------
async function load(name) {
  const r = await fetch(`sounds/${name}.wav`);
  const b = await r.arrayBuffer();
  return await audioCtx.decodeAudioData(b);
}

// ---------------- INIT ----------------
async function init() {
  for (let i of instruments) {
    buffers[i] = await load(i);

    gains[i] = audioCtx.createGain();
    gains[i].gain.value = 1;
    gains[i].connect(audioCtx.destination);
  }

  buildSequencer();
  buildPiano();
  buildTimeline();
  buildMixer();
}

// ---------------- SEQUENCER ----------------
function buildSequencer() {
  const seq = document.getElementById("sequencer");

  instruments.forEach(inst => {
    grid[inst] = Array(steps).fill(false);

    const row = document.createElement("div");

    for (let i = 0; i < steps; i++) {
      const cell = document.createElement("div");
      cell.className = "step";

      cell.onclick = () => {
        grid[inst][i] = !grid[inst][i];
        cell.classList.toggle("active");
      };

      row.appendChild(cell);
    }

    seq.appendChild(row);
  });
}

// ---------------- PIANO ROLL (BASS) ----------------
function buildPiano() {
  const pianoEl = document.getElementById("piano");

  for (let i = 0; i < 12; i++) {
    piano[i] = false;

    const note = document.createElement("div");
    note.className = "piano-note";

    note.onclick = () => {
      piano[i] = !piano[i];
      note.classList.toggle("active");
    };

    pianoEl.appendChild(note);
  }
}

// ---------------- TIMELINE ----------------
function buildTimeline() {
  const t = document.getElementById("timeline");

  for (let i = 0; i < 80; i++) {
    const b = document.createElement("div");
    b.className = "block";

    b.onclick = () => b.classList.toggle("active");

    t.appendChild(b);
  }
}

// ---------------- MIXER ----------------
function buildMixer() {
  const m = document.getElementById("mixer");

  instruments.forEach(i => {
    const div = document.createElement("div");

    const slider = document.createElement("input");
    slider.type = "range";
    slider.min = 0;
    slider.max = 1;
    slider.step = 0.01;
    slider.value = 1;

    slider.oninput = () => {
      gains[i].gain.value = slider.value;
    };

    div.textContent = i;
    div.appendChild(slider);
    m.appendChild(div);
  });
}

// ---------------- PLAY ----------------
function tick() {
  instruments.forEach(inst => {
    if (grid[inst][step]) {
      const s = audioCtx.createBufferSource();
      s.buffer = buffers[inst];
      s.connect(gains[inst]);
      s.start();
    }
  });

  step = (step + 1) % steps;
}

// ---------------- LOOP ----------------
function play() {
  if (playing) return;
  playing = true;
  interval = setInterval(tick, (60000 / bpm) / 4);
}

function stop() {
  playing = false;
  clearInterval(interval);
  step = 0;
}

// ---------------- EXPORT (simple offline WAV) ----------------
async function exportWAV() {
  const offline = new OfflineAudioContext(2, audioCtx.sampleRate * 8, audioCtx.sampleRate);

  const g = {};

  for (let i of instruments) {
    const r = await fetch(`sounds/${i}.wav`);
    const b = await r.arrayBuffer();
    const buf = await offline.decodeAudioData(b);

    g[i] = offline.createGain();
    g[i].connect(offline.destination);

    for (let s = 0; s < steps; s++) {
      if (grid[i][s]) {
        const src = offline.createBufferSource();
        src.buffer = buf;
        src.connect(g[i]);
        src.start(s * 0.2);
      }
    }
  }

  const rendered = await offline.startRendering();

  const wav = bufferToWav(rendered);
  const url = URL.createObjectURL(wav);

  const a = document.createElement("a");
  a.href = url;
  a.download = "project.wav";
  a.click();
}

// WAV ENCODER (simple)
function bufferToWav(buf) {
  const length = buf.length * 2 + 44;
  const ab = new ArrayBuffer(length);
  const dv = new DataView(ab);

  let o = 0;

  const w = s => [...s].forEach(c => dv.setUint8(o++, c.charCodeAt(0)));

  w("RIFF");
  dv.setUint32(o, length - 8, true); o += 4;
  w("WAVEfmt ");
  dv.setUint32(o, 16, true); o += 4;
  dv.setUint16(o, 1, true); o += 2;
  dv.setUint16(o, 1, true); o += 2;
  dv.setUint32(o, buf.sampleRate, true); o += 4;

  const data = buf.getChannelData(0);

  w("data");
  dv.setUint32(o, length - o - 4, true); o += 4;

  for (let i = 0; i < data.length; i++) {
    let v = Math.max(-1, Math.min(1, data[i]));
    dv.setInt16(o, v < 0 ? v * 0x8000 : v * 0x7fff, true);
    o += 2;
  }

  return new Blob([ab], { type: "audio/wav" });
}

// ---------------- CONTROLS ----------------
document.getElementById("play").onclick = play;
document.getElementById("stop").onclick = stop;
document.getElementById("export").onclick = exportWAV;

document.getElementById("bpm").oninput = e => {
  bpm = e.target.value;
  document.getElementById("bpmVal").textContent = bpm;
};

init();