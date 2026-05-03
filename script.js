const timeline = document.getElementById("timeline");
const playhead = document.getElementById("playhead");
const mixer = document.getElementById("channels");

let ctx = new AudioContext();
let tracks = [];
let playing = false;
let position = 0;

// ---------------- TRACK ----------------
function addTrack() {
  const track = {
    clips: [],
    gain: ctx.createGain(),
    filter: ctx.createBiquadFilter(),
    delay: ctx.createDelay()
  };

  track.filter.type = "lowpass";
  track.filter.frequency.value = 2000;

  track.gain.connect(track.filter);
  track.filter.connect(track.delay);
  track.delay.connect(ctx.destination);

  tracks.push(track);
  renderMixer();
}

// ---------------- CLIPS + WAVES ----------------
function addClip(buffer, x = 100, trackIndex = 0) {
  const clip = {
    buffer,
    x,
    width: 200
  };

  tracks[trackIndex].clips.push(clip);
  drawClip(trackIndex, clip);
}

function drawClip(ti, clip) {
  const el = document.createElement("div");
  el.className = "clip";
  el.style.left = clip.x + "px";
  el.style.width = clip.width + "px";
  el.style.top = ti * 70 + "px";

  // fake waveform
  const c = document.createElement("canvas");
  c.width = clip.width;
  c.height = 60;
  const g = c.getContext("2d");

  g.strokeStyle = "#fff";
  for (let i = 0; i < clip.width; i += 4) {
    g.beginPath();
    g.moveTo(i, 30);
    g.lineTo(i, 30 + Math.sin(i * 0.1) * 20);
    g.stroke();
  }

  el.appendChild(c);
  timeline.appendChild(el);
}

// ---------------- PLAYBACK ----------------
function play() {
  playing = true;
  position = 0;
  loop();
}

function stop() {
  playing = false;
  position = 0;
  playhead.style.left = "0px";
}

function loop() {
  if (!playing) return;

  position += 2;
  playhead.style.left = position + "px";

  requestAnimationFrame(loop);
}

// ---------------- AUDIO IMPORT ----------------
document.getElementById("file").onchange = async (e) => {
  const file = e.target.files[0];
  const arr = await file.arrayBuffer();
  const buf = await ctx.decodeAudioData(arr);
  addClip(buf);
};

// ---------------- SYNTH (PIANO) ----------------
const piano = document.getElementById("piano");

for (let i = 0; i < 128; i++) {
  const key = document.createElement("div");
  key.onclick = () => playNote(i);
  piano.appendChild(key);
}

function playNote(note) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.frequency.value = 220 * Math.pow(2, note / 12);
  osc.type = "sine";

  osc.connect(gain);
  gain.connect(ctx.destination);

  gain.gain.setValueAtTime(0.2, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);

  osc.start();
  osc.stop(ctx.currentTime + 0.3);
}

// ---------------- STEP SEQUENCER ----------------
const seq = document.getElementById("sequencer");

let steps = Array(128).fill(0);

for (let i = 0; i < 128; i++) {
  const cell = document.createElement("div");
  cell.onclick = () => {
    cell.classList.toggle("active");
    steps[i] = steps[i] ? 0 : 1;
  };
  seq.appendChild(cell);
}

// ---------------- MIXER ----------------
function renderMixer() {
  mixer.innerHTML = "";
  tracks.forEach((t, i) => {
    const div = document.createElement("div");
    div.className = "channel";

    div.innerHTML = `
      Track ${i+1}
      <input type="range" min="0" max="1" step="0.01"
        onchange="tracks[${i}].gain.gain.value=this.value" />
    `;

    mixer.appendChild(div);
  });
}

// ---------------- SAVE / LOAD ----------------
function save() {
  const data = JSON.stringify(tracks.length);
  localStorage.setItem("daw2", data);
  alert("Saved (basic state)");
}

function load() {
  alert("Load system placeholder (expandable to full project restore)");
}