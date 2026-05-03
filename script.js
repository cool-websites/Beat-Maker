const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

const instruments = ["kick","snare","hihat","clap","bass"];
const steps = 16;
const timelineSteps = 64;

let bpm = 120;
let currentStep = 0;
let playing = false;
let interval;

let grid = {};
let piano = [];
let timeline = [];
let buffers = {};
let gains = {};

// ---------------- LOAD AUDIO ----------------
async function loadSound(name){
  const res = await fetch(`sounds/${name}.wav`);
  const arr = await res.arrayBuffer();
  return await audioCtx.decodeAudioData(arr);
}

// ---------------- INIT ----------------
async function init(){
  for(let inst of instruments){
    buffers[inst] = await loadSound(inst);

    gains[inst] = audioCtx.createGain();
    gains[inst].gain.value = 1;
    gains[inst].connect(audioCtx.destination);
  }

  buildTracks();
  buildSequencer();
  buildPiano();
  buildTimeline();
  buildMixer();
}

// ---------------- TRACK LABELS ----------------
function buildTracks(){
  const t = document.getElementById("trackNames");
  instruments.forEach(i=>{
    const div=document.createElement("div");
    div.textContent=i;
    t.appendChild(div);
  });
}

// ---------------- SEQUENCER ----------------
function buildSequencer(){
  const el=document.getElementById("sequencer");

  instruments.forEach(inst=>{
    grid[inst]=Array(steps).fill(false);

    for(let i=0;i<steps;i++){
      const c=document.createElement("div");
      c.className="step";

      c.onclick=()=>{
        grid[inst][i]=!grid[inst][i];
        c.classList.toggle("active");
      };

      el.appendChild(c);
    }
    el.appendChild(document.createElement("br"));
  });
}

// ---------------- PIANO ----------------
function buildPiano(){
  const el=document.getElementById("piano");

  for(let y=0;y<8;y++){
    piano[y]=Array(steps).fill(false);

    for(let x=0;x<steps;x++){
      const c=document.createElement("div");
      c.className="piano-cell";

      c.onclick=()=>{
        piano[y][x]=!piano[y][x];
        c.classList.toggle("active");
      };

      el.appendChild(c);
    }
    el.appendChild(document.createElement("br"));
  }
}

// ---------------- TIMELINE ----------------
function buildTimeline(){
  const el=document.getElementById("timeline");

  for(let i=0;i<timelineSteps*instruments.length;i++){
    const b=document.createElement("div");
    b.className="block";

    b.onclick=()=>{
      timeline[i]=!timeline[i];
      b.classList.toggle("active");
    };

    el.appendChild(b);
  }
}

// ---------------- MIXER ----------------
function buildMixer(){
  const el=document.getElementById("mixer");

  instruments.forEach(inst=>{
    const slider=document.createElement("input");
    slider.type="range";
    slider.min=0;
    slider.max=1;
    slider.step=0.01;
    slider.value=1;

    slider.oninput=()=>gains[inst].gain.value=slider.value;

    el.appendChild(document.createTextNode(inst));
    el.appendChild(slider);
    el.appendChild(document.createElement("br"));
  });
}

// ---------------- PLAY ----------------
function playSound(inst,time=0){
  const src=audioCtx.createBufferSource();
  src.buffer=buffers[inst];
  src.connect(gains[inst]);
  src.start(time);
}

function tick(){
  instruments.forEach(inst=>{
    if(grid[inst][currentStep]){
      playSound(inst);
    }
  });

  // piano notes
  piano.forEach((row,y)=>{
    if(row[currentStep]){
      const osc=audioCtx.createOscillator();
      osc.frequency.value=200+(y*50);
      osc.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime+0.1);
    }
  });

  currentStep=(currentStep+1)%steps;
}

function play(){
  if(playing) return;
  playing=true;
  interval=setInterval(tick,(60000/bpm)/4);
}

function stop(){
  playing=false;
  clearInterval(interval);
  currentStep=0;
}

// ---------------- WAV EXPORT ----------------
async function exportWAV(){
  const duration=8;
  const offline=new OfflineAudioContext(2,audioCtx.sampleRate*duration,audioCtx.sampleRate);

  for(let inst of instruments){
    const res=await fetch(`sounds/${inst}.wav`);
    const arr=await res.arrayBuffer();
    const buf=await offline.decodeAudioData(arr);

    for(let i=0;i<steps;i++){
      if(grid[inst][i]){
        const src=offline.createBufferSource();
        src.buffer=buf;
        src.connect(offline.destination);
        src.start(i*0.2);
      }
    }
  }

  const rendered=await offline.startRendering();
  const wav=bufferToWav(rendered);

  const a=document.createElement("a");
  a.href=URL.createObjectURL(wav);
  a.download="beat.wav";
  a.click();
}

// ---------------- WAV ENCODER ----------------
function bufferToWav(buffer){
  const len=buffer.length*2+44;
  const ab=new ArrayBuffer(len);
  const dv=new DataView(ab);

  let o=0;
  const w=s=>[...s].forEach(c=>dv.setUint8(o++,c.charCodeAt(0)));

  w("RIFF"); dv.setUint32(o,len-8,true); o+=4;
  w("WAVEfmt "); dv.setUint32(o,16,true); o+=4;
  dv.setUint16(o,1,true); o+=2;
  dv.setUint16(o,1,true); o+=2;
  dv.setUint32(o,buffer.sampleRate,true); o+=4;

  w("data"); dv.setUint32(o,len-o-4,true); o+=4;

  const data=buffer.getChannelData(0);
  for(let i=0;i<data.length;i++){
    let s=Math.max(-1,Math.min(1,data[i]));
    dv.setInt16(o,s<0?s*0x8000:s*0x7fff,true);
    o+=2;
  }

  return new Blob([ab],{type:"audio/wav"});
}

// ---------------- SAVE / LOAD ----------------
document.getElementById("save").onclick=()=>{
  const data={grid,piano,timeline,bpm};
  const blob=new Blob([JSON.stringify(data)]);
  const a=document.createElement("a");
  a.href=URL.createObjectURL(blob);
  a.download="project.json";
  a.click();
};

document.getElementById("load").onclick=()=>{
  const input=document.createElement("input");
  input.type="file";

  input.onchange=e=>{
    const reader=new FileReader();
    reader.onload=()=>{
      const d=JSON.parse(reader.result);
      grid=d.grid;
      piano=d.piano;
      timeline=d.timeline;
      bpm=d.bpm;
    };
    reader.readAsText(e.target.files[0]);
  };

  input.click();
};

// ---------------- CONTROLS ----------------
document.getElementById("play").onclick=play;
document.getElementById("stop").onclick=stop;
document.getElementById("export").onclick=exportWAV;

document.getElementById("bpm").oninput=e=>{
  bpm=e.target.value;
  document.getElementById("bpmVal").textContent=bpm;
};

init();