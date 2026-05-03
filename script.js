const ctx = new AudioContext();

let tracks = [];
let isPlaying = false;
let startTime = 0;

// MASTER
const masterGain = ctx.createGain();
masterGain.connect(ctx.destination);

// ---------------- TRACK ----------------
function addTrack() {
  const gain = ctx.createGain();
  gain.connect(masterGain);

  tracks.push({
    clips: [],
    notes: [],
    gain
  });

  renderMixer();
  renderTimeline();
}

// ---------------- CLIP ----------------
function addClip(buffer, trackIndex = 0, start = 0) {
  tracks[trackIndex].clips.push({ buffer, start });
  renderTimeline();
}

// ---------------- PLAY ----------------
function play() {
  if (isPlaying) return;
  isPlaying = true;

  startTime = ctx.currentTime + 0.1;

  const bpm = 120;
  const stepTime = 60 / bpm / 4;

  // drums
  drumSteps.forEach((step, i) => {
    if (step) playKick(startTime + i * stepTime);
  });

  // tracks
  tracks.forEach(track => {
    track.clips.forEach(clip => {
      const src = ctx.createBufferSource();
      src.buffer = clip.buffer;
      src.connect(track.gain);
      src.start(startTime + clip.start);
    });

    track.notes.forEach(n => {
      scheduleNote(n, track);
    });
  });
}

function stop() {
  isPlaying = false;
}

// ---------------- NOTE SYNTH ----------------
function scheduleNote(note, track) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.frequency.value = 220 * Math.pow(2, note.pitch / 12);

  osc.connect(gain);
  gain.connect(track.gain);

  const t = startTime + note.time;

  gain.gain.setValueAtTime(0.2, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + note.duration);

  osc.start(t);
  osc.stop(t + note.duration);
}

// ---------------- TIMELINE ----------------
function renderTimeline() {
  const tl = document.getElementById("timeline");
  tl.innerHTML = "";

  tracks.forEach((t, i) => {
    const row = document.createElement("div");
    row.className = "track";

    t.clips.forEach(c => {
      const div = document.createElement("div");
      div.className = "clip";
      div.style.left = c.start * 120 + "px";
      div.style.width = c.buffer.duration * 120 + "px";
      row.appendChild(div);
    });

    tl.appendChild(row);
  });
}

// ---------------- MIXER ----------------
function renderMixer() {
  const m = document.getElementById("mixer");
  m.innerHTML = "";

  tracks.forEach((t, i) => {
    const div = document.createElement("div");

    div.innerHTML = `
      Track ${i+1}<br>
      <input type="range" min="0" max="1" step="0.01"
      onchange="tracks[${i}].gain.gain.value=this.value">
    `;

    m.appendChild(div);
  });
}

// ---------------- AUDIO IMPORT ----------------
document.getElementById("file").onchange = async (e) => {
  const file = e.target.files[0];
  const arr = await file.arrayBuffer();
  const buffer = await ctx.decodeAudioData(arr);

  if (!tracks[0]) addTrack();
  addClip(buffer, 0, 0);
};

// ---------------- DRUMS ----------------
const drumGrid = document.getElementById("drumGrid");
let drumSteps = Array(16).fill(0);

for (let i = 0; i < 16; i++) {
  const cell = document.createElement("div");

  cell.onclick = () => {
    drumSteps[i] = drumSteps[i] ? 0 : 1;
    cell.classList.toggle("active");
  };

  drumGrid.appendChild(cell);
}

function playKick(time) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.frequency.setValueAtTime(150, time);
  osc.frequency.exponentialRampToValueAtTime(50, time + 0.1);

  gain.gain.setValueAtTime(1, time);
  gain.gain.exponentialRampToValueAtTime(0.001, time + 0.1);

  osc.connect(gain);
  gain.connect(masterGain);

  osc.start(time);
  osc.stop(time + 0.1);
}

// ---------------- PIANO ----------------
const pianoGrid = document.getElementById("pianoGrid");

for (let y = 0; y < 8; y++) {
  for (let x = 0; x < 16; x++) {

    const cell = document.createElement("div");

    cell.onclick = () => {
      cell.classList.toggle("active");

      if (!tracks[0]) addTrack();

      tracks[0].notes.push({
        pitch: y * 2,
        time: x * 0.25,
        duration: 0.2
      });
    };

    pianoGrid.appendChild(cell);
  }
}

// ---------------- RECORD ----------------
let mediaRecorder;
let chunks = [];

async function startRecording() {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

  mediaRecorder = new MediaRecorder(stream);

  mediaRecorder.ondataavailable = e => chunks.push(e.data);

  mediaRecorder.start();
}

function stopRecording() {
  mediaRecorder.stop();

  mediaRecorder.onstop = async () => {
    const blob = new Blob(chunks);
    const arr = await blob.arrayBuffer();
    const buffer = await ctx.decodeAudioData(arr);

    if (!tracks[0]) addTrack();

    addClip(buffer, 0, 0);

    chunks = [];
  };
}

// ---------------- EXPORT ----------------
async function exportWAV() {
  const offline = new OfflineAudioContext(2, 44100 * 20, 44100);

  tracks.forEach(t => {
    t.clips.forEach(c => {
      const src = offline.createBufferSource();
      src.buffer = c.buffer;
      src.connect(offline.destination);
      src.start(c.start);
    });
  });

  const rendered = await offline.startRendering();

  const blob = new Blob([new ArrayBuffer(rendered.length)], { type: "audio/wav" });

  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "track.wav";
  a.click();
}