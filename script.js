const timeline = document.getElementById("timeline");
const playhead = document.getElementById("playhead");

let clips = [];
let isPlaying = false;
let playPos = 0;
let audioCtx = new (window.AudioContext || window.webkitAudioContext)();
let bufferStore = null;

// ---------- CLIPS ----------
function addClip() {
  const clip = document.createElement("div");
  clip.className = "clip";
  clip.style.left = Math.random() * 800 + "px";
  clip.style.top = Math.random() * 200 + "px";
  clip.style.width = "150px";

  makeDraggable(clip);

  clip.onclick = () => {
    if (bufferStore) playBuffer(bufferStore);
  };

  timeline.appendChild(clip);
  clips.push(clip);
}

// Dragging clips
function makeDraggable(el) {
  let offsetX = 0;

  el.onmousedown = (e) => {
    offsetX = e.offsetX;
    document.onmousemove = (e2) => {
      el.style.left = (e2.pageX - offsetX) + "px";
    };
    document.onmouseup = () => {
      document.onmousemove = null;
    };
  };
}

// ---------- PLAYBACK ----------
function play() {
  isPlaying = true;
  animatePlayhead();
}

function stop() {
  isPlaying = false;
  playPos = 0;
  playhead.style.left = "0px";
}

function animatePlayhead() {
  if (!isPlaying) return;

  playPos += 2;
  playhead.style.left = playPos + "px";

  requestAnimationFrame(animatePlayhead);
}

// ---------- AUDIO IMPORT ----------
document.getElementById("audioImport").addEventListener("change", async (e) => {
  const file = e.target.files[0];
  const arrayBuffer = await file.arrayBuffer();
  bufferStore = await audioCtx.decodeAudioData(arrayBuffer);
});

function playBuffer(buffer) {
  const source = audioCtx.createBufferSource();
  source.buffer = buffer;
  source.connect(audioCtx.destination);
  source.start();
}

// ---------- PIANO ROLL ----------
const grid = document.getElementById("grid");

for (let i = 0; i < 192; i++) {
  const cell = document.createElement("div");
  cell.onclick = () => cell.classList.toggle("active");
  grid.appendChild(cell);
}

// ---------- SAVE / LOAD ----------
function saveProject() {
  const data = clips.map(c => ({
    left: c.style.left,
    top: c.style.top
  }));
  localStorage.setItem("daw", JSON.stringify(data));
  alert("Saved!");
}

function loadProject() {
  const data = JSON.parse(localStorage.getItem("daw") || "[]");
  data.forEach(d => {
    const clip = document.createElement("div");
    clip.className = "clip";
    clip.style.left = d.left;
    clip.style.top = d.top;
    clip.style.width = "150px";
    makeDraggable(clip);
    timeline.appendChild(clip);
  });
}