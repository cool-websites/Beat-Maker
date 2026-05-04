const DAW = window.DAW;

window.setGrid = function(type) {
  DAW.setGrid(type);
};

/* TRACKS */
DAW.addTrack("sine");
DAW.addTrack("triangle");
DAW.addTrack("drums");

/* 🎹 PIANO GRID */
const piano = document.getElementById("piano");

for (let y = 0; y < 8; y++) {
  for (let x = 0; x < 64; x++) {

    const cell = document.createElement("div");
    cell.className = "cell";

    cell.onclick = () => {

      cell.classList.toggle("active");

      const note = {
        pitch: y * 2,
        time: x * 0.25,
        duration: 0.25
      };

      DAW.grids.sine.push(note);
      renderTimeline();
    };

    piano.appendChild(cell);
  }
}

/* 🎛 INSTRUMENT GRID */
function renderInstrumentGrid() {
  const grid = document.getElementById("instrumentGrid");
  grid.innerHTML = "";

  for (let y = 0; y < 6; y++) {
    for (let x = 0; x < 64; x++) {

      const cell = document.createElement("div");
      cell.className = "gridCell";

      cell.onclick = () => {

        cell.classList.toggle("active");

        const note = {
          pitch: y * 2,
          time: x * 0.25,
          duration: 0.25
        };

        DAW.grids[DAW.currentGrid].push(note);
        renderTimeline();
      };

      grid.appendChild(cell);
    }
  }
}

renderInstrumentGrid();

/* TIMELINE */
function renderTimeline() {
  const tl = document.getElementById("timeline");
  tl.innerHTML = "";

  DAW.tracks.forEach(track => {

    const row = document.createElement("div");
    row.className = "track";

    track.notes.forEach(n => {
      const note = document.createElement("div");
      note.className = "note";

      note.style.left = n.time * 80 + "px";
      note.style.width = n.duration * 80 + "px";

      row.appendChild(note);
    });

    tl.appendChild(row);
  });
}

renderTimeline();