// ---------------- AUDIO ENGINE ----------------
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

const instruments = ["kick","snare","hihat","clap","bass"];
const stepsPerPattern = 16;
let timelineSteps = 256;

let bpm = 120;
let currentTick = 0;
let playing = false;

let buffers = {};
let channels = {};
let clips = [];

let zoom = 1;

// ---------------- DOM ----------------
const timeline = document.getElementById("timeline");

// ---------------- LOAD SOUND ----------------
async function loadSound(name){
  const res = await fetch(`sounds/${name}.wav`);
  const arr = await res.arrayBuffer();
  return await audioCtx.decodeAudioData(arr);
}

// ---------------- FX CHAIN ----------------
function createFX(){
  const input = audioCtx.createGain();

  const filter = audioCtx.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = 1200;

  const delay = audioCtx.createDelay();
  delay.delayTime.value = 0.2;

  const feedback = audioCtx.createGain();
  feedback.gain.value = 0.25;

  delay.connect(feedback);
  feedback.connect(delay);

  input.connect(filter);
  filter.connect(delay);
  delay.connect(audioCtx.destination);

  return input;
}

// ---------------- INIT ----------------
async function init(){
  for(let inst of instruments){
    try{
      buffers[inst] = await loadSound(inst);
    }catch{
      buffers[inst] = null;
    }

    channels[inst] = createFX();
  }

  buildSequencer();
  buildMixer();
  buildPiano();
  createPlayhead();
}

// ---------------- SEQUENCER ----------------
let baseGrid = {};

function buildSequencer(){
  const el=document.getElementById("sequencer");
  el.innerHTML="";

  instruments.forEach(inst=>{
    baseGrid[inst]=Array(stepsPerPattern).fill(false);

    for(let i=0;i<stepsPerPattern;i++){
      const cell=document.createElement("div");
      cell.className="step";

      cell.onclick=()=>{
        baseGrid[inst][i]=!baseGrid[inst][i];
        cell.classList.toggle("active");
      };

      el.appendChild(cell);
    }
    el.appendChild(document.createElement("br"));
  });
}

// ---------------- MIXER ----------------
function buildMixer(){
  const el=document.getElementById("mixer");
  el.innerHTML="";

  instruments.forEach(inst=>{
    const label=document.createElement("div");
    label.textContent=inst;

    const vol=document.createElement("input");
    vol.type="range";
    vol.min=0; vol.max=1; vol.step=0.01; vol.value=1;

    vol.oninput=()=>{
      channels[inst].gain.value = vol.value;
    };

    el.appendChild(label);
    el.appendChild(vol);
  });
}

// ---------------- PIANO ROLL ----------------
const pianoNotes = 24;
let pianoGrid = Array.from({length:pianoNotes},()=>Array(32).fill(false));

function buildPiano(){
  const el=document.getElementById("piano");
  el.innerHTML="";

  for(let r=0;r<pianoNotes;r++){
    for(let c=0;c<32;c++){
      const cell=document.createElement("div");
      cell.className="piano-cell";

      cell.onclick=()=>{
        pianoGrid[r][c]=!pianoGrid[r][c];
        cell.classList.toggle("active");
      };

      el.appendChild(cell);
    }
    el.appendChild(document.createElement("br"));
  }
}

// ---------------- CLIPS ----------------
function createClip(step){
  const clip=document.createElement("div");
  clip.className="block";

  clip.dataset.start = step;
  clip.dataset.length = stepsPerPattern;

  clip.pattern = JSON.parse(JSON.stringify(baseGrid));
  clip.enabled = Object.fromEntries(instruments.map(i=>[i,true]));

  const left=document.createElement("div");
  const right=document.createElement("div");

  left.className="resize-handle left";
  right.className="resize-handle right";

  clip.appendChild(left);
  clip.appendChild(right);

  timeline.appendChild(clip);

  updateClip(clip);
  enableDrag(clip);
  enableResize(clip,left,right);

  clips.push(clip);
}

// place clip
timeline.onclick=e=>{
  if(e.target!==timeline) return;

  const rect=timeline.getBoundingClientRect();
  const x=e.clientX-rect.left+timeline.scrollLeft;

  createClip(Math.floor(x/(20*zoom)));
};

function updateClip(clip){
  clip.style.left = clip.dataset.start*20*zoom+"px";
  clip.style.width = clip.dataset.length*20*zoom+"px";
  clip.style.position="absolute";
}

// ---------------- DRAG ----------------
function enableDrag(clip){
  let dragging=false;

  clip.onmousedown=()=>dragging=true;
  document.onmouseup=()=>dragging=false;

  document.onmousemove=e=>{
    if(!dragging) return;

    const rect=timeline.getBoundingClientRect();
    const x=e.clientX-rect.left+timeline.scrollLeft;

    clip.dataset.start=Math.max(0,Math.floor(x/(20*zoom)));
    updateClip(clip);
  };
}

// ---------------- RESIZE ----------------
function enableResize(clip,l,r){
  let left=false,right=false;

  l.onmousedown=e=>{e.stopPropagation();left=true;}
  r.onmousedown=e=>{e.stopPropagation();right=true;}

  document.addEventListener("mouseup",()=>{left=false;right=false});

  document.addEventListener("mousemove",e=>{
    if(!left && !right) return;

    const rect=timeline.getBoundingClientRect();
    const x=e.clientX-rect.left+timeline.scrollLeft;
    const step=Math.floor(x/(20*zoom));

    let start=parseInt(clip.dataset.start);
    let len=parseInt(clip.dataset.length);

    if(right){
      clip.dataset.length=Math.max(1,step-start);
    }

    if(left){
      let diff=start-step;
      if(start-diff>=0){
        clip.dataset.start=step;
        clip.dataset.length=len+diff;
      }
    }

    updateClip(clip);
  });
}

// ---------------- PLAYBACK ----------------
function playSound(inst){
  if(!buffers[inst]) return;

  const src=audioCtx.createBufferSource();
  src.buffer=buffers[inst];
  src.connect(channels[inst]);
  src.start();
}

function playStep(){
  clips.forEach(clip=>{
    const start=parseInt(clip.dataset.start);
    const len=parseInt(clip.dataset.length);

    const local=currentTick-start;

    if(local>=0 && local<len){
      const step=local%stepsPerPattern;

      instruments.forEach(inst=>{
        if(clip.enabled[inst] && clip.pattern[inst][step]){
          playSound(inst);
        }
      });
    }
  });
}

// ---------------- PIANO PLAY ----------------
function playPiano(){
  pianoGrid.forEach((row,note)=>{
    if(row[currentTick%32]){
      const osc=audioCtx.createOscillator();
      const gain=audioCtx.createGain();

      osc.frequency.value = 220*Math.pow(2,note/12);
      gain.gain.value=0.08;

      osc.connect(gain);
      gain.connect(audioCtx.destination);

      osc.start();
      osc.stop(audioCtx.currentTime+0.1);
    }
  });
}

// ---------------- PLAYHEAD ----------------
let playhead;

function createPlayhead(){
  playhead=document.createElement("div");
  playhead.id="playhead";
  timeline.appendChild(playhead);
}

function updatePlayhead(){
  playhead.style.left=currentTick*20*zoom+"px";
  timeline.scrollLeft=playhead.offsetLeft-200;
}

// ---------------- ENGINE ----------------
function tick(){
  playStep();
  playPiano();
  updatePlayhead();

  currentTick++;
  if(currentTick>=timelineSteps) currentTick=0;
}

let interval;

function play(){
  if(playing) return;
  playing=true;
  interval=setInterval(tick,(60000/bpm)/4);
}

function stop(){
  playing=false;
  clearInterval(interval);
  currentTick=0;
}

// ---------------- EXPORT WAV ----------------
async function exportWAV(){
  const duration=10;
  const offline=new OfflineAudioContext(2,44100*duration,44100);

  for(let clip of clips){
    const start=parseInt(clip.dataset.start);

    for(let i=0;i<stepsPerPattern;i++){
      const time=(start+i)*(60/bpm)/4;

      for(let inst of instruments){
        if(clip.pattern[inst][i] && buffers[inst]){
          const src=offline.createBufferSource();
          src.buffer=buffers[inst];
          src.connect(offline.destination);
          src.start(time);
        }
      }
    }
  }

  const rendered=await offline.startRendering();
  const blob=bufferToWav(rendered);

  const a=document.createElement("a");
  a.href=URL.createObjectURL(blob);
  a.download="track.wav";
  a.click();
}

function bufferToWav(buffer){
  const length = buffer.length * 2 + 44;
  const view = new DataView(new ArrayBuffer(length));

  let offset = 0;
  const write = s => [...s].forEach(c=>view.setUint8(offset++,c.charCodeAt(0)));

  write("RIFF");
  view.setUint32(offset,length-8,true); offset+=4;
  write("WAVEfmt ");
  view.setUint32(offset,16,true); offset+=4;
  view.setUint16(offset,1,true); offset+=2;
  view.setUint16(offset,1,true); offset+=2;
  view.setUint32(offset,44100,true); offset+=4;

  write("data");
  view.setUint32(offset,length-offset-4,true); offset+=4;

  const data = buffer.getChannelData(0);
  for(let i=0;i<data.length;i++){
    let s=Math.max(-1,Math.min(1,data[i]));
    view.setInt16(offset,s<0?s*0x8000:s*0x7fff,true);
    offset+=2;
  }

  return new Blob([view],{type:"audio/wav"});
}

// ---------------- SAVE / LOAD ----------------
function saveProject(){
  const data={
    clips:clips.map(c=>({
      start:c.dataset.start,
      length:c.dataset.length,
      pattern:c.pattern
    })),
    piano:pianoGrid,
    bpm
  };

  localStorage.setItem("dawProject",JSON.stringify(data));
}

function loadProject(){
  const data=JSON.parse(localStorage.getItem("dawProject"));
  if(!data) return;

  bpm=data.bpm;
  pianoGrid=data.piano;

  data.clips.forEach(c=>{
    createClip(parseInt(c.start));
  });

  buildPiano();
}

// ---------------- AUDIO IMPORT ----------------
document.getElementById("fileInput").onchange=async e=>{
  const file=e.target.files[0];
  const arr=await file.arrayBuffer();
  const buffer=await audioCtx.decodeAudioData(arr);

  instruments.push(file.name);
  buffers[file.name]=buffer;

  channels[file.name]=createFX();
  buildMixer();
};

// ---------------- UI ----------------
document.getElementById("play").onclick=play;
document.getElementById("stop").onclick=stop;
document.getElementById("export").onclick=exportWAV;
document.getElementById("save").onclick=saveProject;
document.getElementById("load").onclick=loadProject;

document.getElementById("bpm").oninput=e=>{
  bpm=e.target.value;
  document.getElementById("bpmVal").textContent=bpm;
};

// ---------------- ZOOM ----------------
window.addEventListener("wheel",e=>{
  if(e.ctrlKey){
    e.preventDefault();
    zoom+=e.deltaY*-0.001;
    zoom=Math.min(Math.max(0.5,zoom),3);

    clips.forEach(updateClip);
  }
},{passive:false});

// ---------------- START ----------------
init();