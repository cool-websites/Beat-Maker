const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

const instruments = [
  "kick", "snare", "hihat", "clap", "openhat", "bass"
];

const steps = 16;
let bpm = 120;
let currentStep = 0;
let isPlaying = false;
let interval;

let grid = [];
let gains = {};

// Load sounds
const buffers = {};

async function loadSound(name) {
  const res = await fetch(`sounds/${name}.wav`);
  const arrayBuffer = await res.arrayBuffer();
  buffers[name] = await audioCtx.decodeAudioData(arrayBuffer);
}

async function init() {
  for (let inst of instruments) {
    await loadSound(inst);
    gains[inst] = audioCtx.createGain();
    gains[inst].connect(audioCtx.destination);
    gains[inst].gain.value = 1;
  }

  buildUI();
}

function playSound(name) {
  const source = audioCtx.createBufferSource();
  source.buffer = buffers[name];
  source.connect(gains[name]);
  source.start();
}

// Build Sequencer
function buildUI() {
  const seq = document.getElementById("sequencer");

  instruments.forEach((inst, rowIndex) => {
    grid[rowIndex] = [];

    const row = document.createElement("div");
    row.classList.add("track");

    const label = document.createElement("div");
    label.classList.add("label");
    label.textContent = inst;
    row.appendChild(label);

    for (let i = 0; i < steps; i++) {
      const cell = document.createElement("div");
      cell.classList.add("cell");

      cell.onclick = () => {
        cell.classList.toggle("active");
        grid[rowIndex][i] = !grid[rowIndex][i];
      };

      row.appendChild(cell);
      grid[rowIndex][i] = false;
    }

    seq.appendChild(row);
  });

  buildMixer();
}

// Mixer UI
function buildMixer() {
  const mixer = document.getElementById("mixer");

  instruments.forEach(inst => {
    const channel = document.createElement("div");
    channel.classList.add("mixer-channel");

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

    channel.appendChild(label);
    channel.appendChild(slider);
    mixer.appendChild(channel);
  });
}

// Sequencer Loop
function tick() {
  instruments.forEach((inst, rowIndex) => {
    if (grid[rowIndex][currentStep]) {
      playSound(inst);
    }
  });

  currentStep = (currentStep + 1) % steps;
}

// Controls
document.getElementById("play").onclick = async () => {
  if (isPlaying) return;

  await audioCtx.resume();

  isPlaying = true;
  interval = setInterval(tick, (60000 / bpm) / 4);
};

document.getElementById("stop").onclick = () => {
  isPlaying = false;
  clearInterval(interval);
  currentStep = 0;
};

const bpmSlider = document.getElementById("bpm");
const bpmVal = document.getElementById("bpmVal");

bpmSlider.oninput = () => {
  bpm = bpmSlider.value;
  bpmVal.textContent = bpm;

  if (isPlaying) {
    clearInterval(interval);
    interval = setInterval(tick, (60000 / bpm) / 4);
  }
};

init();