const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

const instruments = ["kick", "snare", "hihat", "clap", "openhat", "bass"];
const steps = 16;

let bpm = 120;
let currentStep = 0;
let isPlaying = false;
let interval;

let grid = {};
let gains = {};
let buffers = {};

// -------------------- LOAD SOUNDS --------------------
async function loadSound(name) {
  const res = await fetch(`sounds/${name}.wav`);
  const arrayBuffer = await res.arrayBuffer();
  return await audioCtx.decodeAudioData(arrayBuffer);
}

// -------------------- INIT --------------------
async function init() {
  for (let inst of instruments) {
    buffers[inst] = await loadSound(inst);

    gains[inst] = audioCtx.createGain();
    gains[inst].gain.value = 1;
    gains[inst].connect(audioCtx.destination);
  }

  buildUI();
}

// -------------------- PLAY SOUND --------------------
function play(inst, time = 0) {
  const src = audioCtx.createBufferSource();
  src.buffer = buffers[inst];
  src.connect(gains[inst]);
  src.start(time);
}

// -------------------- SEQUENCER UI --------------------
function buildUI() {
  const seq = document.getElementById("sequencer");

  instruments.forEach(inst => {
    grid[inst] = Array(steps).fill(false);

    const row = document.createElement("div");
    row.className = "track";

    const label = document.createElement("div");
    label.className = "label";
    label.textContent = inst;
    row.appendChild(label);

    for (let i = 0; i < steps; i++) {
      const cell = document.createElement("div");
      cell.className = "cell";

      cell.onclick = () => {
        grid[inst][i] = !grid[inst][i];
        cell.classList.toggle("active");
      };

      row.appendChild(cell);
    }

    seq.appendChild(row);
  });

  buildMixer();
}

// -------------------- MIXER --------------------
function buildMixer() {
  const mixer = document.getElementById("mixer");

  instruments.forEach(inst => {
    const ch = document.createElement("div");
    ch.className = "mixer-channel";

    const label = document.createElement("div");
    label.textContent = inst;

    const slider = document.createElement("input");
    slider.type = "range";
    slider.min = 0;
    slider.max = 1;
    slider.step = 0.01;
    slider.value = 1;

    slider.oninput = () => {
      gains[inst].gain.value = slider.value;
    };

    ch.appendChild(label);
    ch.appendChild(slider);
    mixer.appendChild(ch);
  });
}

// -------------------- LOOP --------------------
function tick() {
  const stepTime = (60 / bpm) / 4;

  instruments.forEach(inst => {
    if (grid[inst][currentStep]) {
      play(inst);
    }
  });

  currentStep = (currentStep + 1) % steps;
}

function playLoop() {
  if (isPlaying) return;

  isPlaying = true;
  interval = setInterval(tick, (60000 / bpm) / 4);
}

function stopLoop() {
  isPlaying = false;
  clearInterval(interval);
  currentStep = 0;
}

// -------------------- WAV EXPORT --------------------
async function exportWAV() {
  const lengthInSeconds = 8; // adjust export length here
  const offlineCtx = new OfflineAudioContext(2, audioCtx.sampleRate * lengthInSeconds, audioCtx.sampleRate);

  const offlineGains = {};
  const offlineBuffers = {};

  // reload buffers into offline context
  for (let inst of instruments) {
    const res = await fetch(`sounds/${inst}.wav`);
    const arr = await res.arrayBuffer();
    offlineBuffers[inst] = await offlineCtx.decodeAudioData(arr);

    offlineGains[inst] = offlineCtx.createGain();
    offlineGains[inst].gain.value = gains[inst].gain.value;
    offlineGains[inst].connect(offlineCtx.destination);
  }

  const stepTime = (60 / bpm) / 4;

  for (let i = 0; i < steps; i++) {
    instruments.forEach(inst => {
      if (grid[inst][i]) {
        const src = offlineCtx.createBufferSource();
        src.buffer = offlineBuffers[inst];
        src.connect(offlineGains[inst]);
        src.start(i * stepTime);
      }
    });
  }

  const rendered = await offlineCtx.startRendering();

  const wavBlob = bufferToWav(rendered);
  const url = URL.createObjectURL(wavBlob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "beat.wav";
  a.click();
}

// -------------------- WAV ENCODER --------------------
function bufferToWav(buffer) {
  const numOfChan = buffer.numberOfChannels;
  const length = buffer.length * numOfChan * 2 + 44;
  const bufferArray = new ArrayBuffer(length);
  const view = new DataView(bufferArray);

  let offset = 0;

  function writeString(s) {
    for (let i = 0; i < s.length; i++) {
      view.setUint8(offset++, s.charCodeAt(i));
    }
  }

  function write16(val) {
    view.setUint16(offset, val, true);
    offset += 2;
  }

  function write32(val) {
    view.setUint32(offset, val, true);
    offset += 4;
  }

  writeString("RIFF");
  write32(length - 8);
  writeString("WAVE");

  writeString("fmt ");
  write32(16);
  write16(1);
  write16(numOfChan);
  write32(buffer.sampleRate);
  write32(buffer.sampleRate * numOfChan * 2);
  write16(numOfChan * 2);
  write16(16);

  writeString("data");
  write32(length - offset - 4);

  const data = buffer.getChannelData(0);

  for (let i = 0; i < data.length; i++) {
    const sample = Math.max(-1, Math.min(1, data[i]));
    view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
    offset += 2;
  }

  return new Blob([bufferArray], { type: "audio/wav" });
}

// -------------------- CONTROLS --------------------
document.getElementById("play").onclick = playLoop;
document.getElementById("stop").onclick = stopLoop;
document.getElementById("export").onclick = exportWAV;

document.getElementById("bpm").oninput = (e) => {
  bpm = e.target.value;
  document.getElementById("bpmVal").textContent = bpm;

  if (isPlaying) {
    stopLoop();
    playLoop();
  }
};

init();