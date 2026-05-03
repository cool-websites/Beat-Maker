const DAW = window.DAW;

// always start with one track
DAW.addTrack();

// 🎹 piano roll
const piano = document.getElementById("piano");

for (let y = 0; y < 8; y++) {
  for (let x = 0; x < 16; x++) {

    const cell = document.createElement("div");
    cell.className = "cell";

    cell.onclick = () => {
      const note = {
        pitch: y * 2,
        time: x * 0.25,
        duration: 0.25
      };

      DAW.tracks[0].notes.push(note);
      renderTimeline();
    };

    piano.appendChild(cell);
  }
}

// 🎧 RENDER TIMELINE (FIXED CORE FUNCTION)
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
  document.getElementById("playhead").style.left = (step * 40) + "px";
}

window.renderTimeline = renderTimeline;
window.updatePlayhead = updatePlayhead;