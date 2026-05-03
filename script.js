const ctx = new AudioContext();

let tracks = [];
let isPlaying = false;
let startTime = 0;
let loop = false;
let loopStart = 0;
let loopEnd = 8;

// ---------------- MASTER ----------------
const masterGain = ctx.createGain();
masterGain.connect(ctx.destination);
masterGain.gain.value = 0.9;

// ---------------- TRACK SYSTEM ----------------
function addTrack() {
  const gain = ctx.createGain();
  const filter = ctx.createBiquadFilter();
  const delay = ctx.createDelay(1.0);

  filter.type = "lowpass";

  gain.connect(filter);
  filter.connect(delay);
  delay.connect(masterGain);

  const track = {
    clips: [],
    notes: [],
    gain,
    filter,
    delay
  };

  tracks.push(track);
  renderMixer();
  renderTimeline();
}

// ---------------- AUDIO CLIPS ----------------
function addClip(buffer, trackIndex = 0, start = 0) {
  tracks[trackIndex].clips.push({
    buffer,
    start
  });

  renderTimeline();
}

// ---------------- PLAY ENGINE (PRO TIMING) ----------------
function play() {
  if (isPlaying) return;
  isPlaying = true;

  startTime = ctx.currentTime + 0.1;

  tracks.forEach(track => {

    // AUDIO CLIPS
    track.clips.forEach(clip => {
      const src = ctx.createBufferSource();
      src.buffer = clip.buffer;
      src.connect(track.gain);

      src.start(startTime + clip.start);
    });

    // MIDI NOTES
    track.notes.forEach(n => {
      scheduleNote(n, track);
    });
  });
}

// ---------------- STOP ----------------
function stop() {
  isPlaying = false;
}

// ---------------- MIDI SYNTH ----------------
function scheduleNote(note, track) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.frequency.value = 220 * Math.pow(2, note.pitch / 12);
  osc.type = "sine";

  osc.connect(gain);
  gain.connect(track.gain);

  const t = startTime + note.time;

  gain.gain.setValueAtTime(0.2, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + note.duration);

  osc.start(t);
  osc.stop(t + note.duration);
}

// ---------------- IMPORT AUDIO ----------------
document.getElementById("file").onchange = async (e) => {
  const file = e.target.files[0];
  const arr = await file.arrayBuffer();
  const buffer = await ctx.decodeAudioData(arr);

  if (!tracks[0]) addTrack();
  addClip(buffer, 0, 0);
};

// ---------------- TIMELINE ----------------
function renderTimeline() {
  const tl = document.getElementById("timeline");
  tl.innerHTML = "";

  tracks.forEach((t, i) => {
    const row = document.createElement("div");
    row.className = "track";

    // CLIPS
    t.clips.forEach(c => {
      const div = document.createElement("div");
      div.className = "clip";

      div.style.left = c.start * 120 + "px";
      div.style.width = (c.buffer.duration * 120) + "px";

      const canvas = document.createElement("canvas");
      canvas.width = 300;
      canvas.height = 70;

      drawWave(c.buffer, canvas);

      div.appendChild(canvas);
      row.appendChild(div);
    });

    tl.appendChild(row);
  });
}

// ---------------- WAVEFORM ----------------
function drawWave(buffer, canvas) {
  const g = canvas.getContext("2d");
  const data = buffer.getChannelData(0);

  g.strokeStyle = "white";
  g.beginPath();

  let step = Math.floor(data.length / canvas.width);

  for (let i = 0; i < canvas.width; i++) {
    let v = data[i * step] || 0;
    g.lineTo(i, (v + 1) * 35);
  }

  g.stroke();
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

// ---------------- LOOP ----------------
function toggleLoop() {
  loop = !loop;
}

// ---------------- PIANO ROLL DATA ----------------
// (real note system, not UI toggles)
function addNote(trackIndex, pitch, time, duration) {
  tracks[trackIndex].notes.push({
    pitch,
    time,
    duration
  });
}

// ---------------- EXPORT (basic offline render) ----------------
async function exportWAV() {
  const offline = new OfflineAudioContext(2, 44100 * 30, 44100);

  tracks.forEach(t => {
    t.clips.forEach(c => {
      const src = offline.createBufferSource();
      src.buffer = c.buffer;
      src.connect(offline.destination);
      src.start(c.start);
    });
  });

  const rendered = await offline.startRendering();

  const wav = audioBufferToWav(rendered);
  download(wav, "mix.wav");
}

// ---------------- WAV STUB ----------------
function audioBufferToWav(buffer) {
  const length = buffer.length * 2;
  return new Blob([new ArrayBuffer(length)], { type: "audio/wav" });
}

function download(blob, name) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
}