const DAW = window.DAW;

// ensure at least one track exists
DAW.addTrack();

// 🎛 instrument switch
window.setInstrument = function(type) {
  DAW.setInstrument(type);
};

// 🎹 PIANO ROLL
const piano = document.getElementById("piano");

for (let y = 0; y < 8; y++) {
  for (let x = 0; x < 16; x++) {

    const cell = document.createElement("div");
    cell.className = "cell";

    cell.onclick = () => {

      DAW.tracks[0].notes.push({
        pitch: y * 2,
        time: x * 0.25,
        duration: 0.25
      });

      renderTimeline();
    };

    piano.appendChild(cell);
  }
}

// 🎧 TIMELINE RENDER (REAL FIXED VERSION)
function renderTimeline() {
  const tl = document.getElementById("timeline");
  tl.innerHTML = "";

  DAW.tracks.forEach(track => {

    const row = document.createElement("div");
    row.className = "track";

    track.notes.forEach(n => {

      const el = document.createElement("div");
      el.className = "note";

      el.style.left = n.time * 120 + "px";
      el.style.width = n.duration * 120 + "px";
      el.style.top = (80 - n.pitch * 2) + "px";

      row.appendChild(el);
    });

    tl.appendChild(row);
  });
}

// 🎯 PLAYHEAD
function updatePlayhead(step) {
  document.getElementById("playhead").style.left = step * 40 + "px";
}

window.renderTimeline = renderTimeline;
window.updatePlayhead = updatePlayhead;