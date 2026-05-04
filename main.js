const DAW = window.DAW;

window.selectInstrument = function(name) {
  DAW.current = name;
  document.getElementById("gridTitle").innerText =
    name.charAt(0).toUpperCase() + name.slice(1) + " Grid";

  renderGrid();
};

/* 🎹 GRID SYSTEM */
function renderGrid() {
  const grid = document.getElementById("activeGrid");
  grid.innerHTML = "";

  const inst = DAW.instruments[DAW.current];

  for (let y = 0; y < 6; y++) {
    for (let x = 0; x < 64; x++) {

      const cell = document.createElement("div");
      cell.className = "cell";

      // restore active state
      if (inst.notes.find(n => n.x === x && n.y === y)) {
        cell.classList.add("active");
      }

      cell.onclick = () => {

        cell.classList.toggle("active");

        inst.notes.push({
          x,
          y,
          time: x * 0.25
        });
      };

      grid.appendChild(cell);
    }
  }
}

renderGrid();

/* TIMELINE */
function renderTimeline() {
  const tl = document.getElementById("timeline");
  tl.innerHTML = "";

  Object.keys(DAW.instruments).forEach(key => {
    const row = document.createElement("div");
    row.className = "trackRow";

    DAW.instruments[key].notes.forEach(n => {
      const note = document.createElement("div");
      note.className = "note";

      note.style.left = n.time * 80 + "px";
      note.style.width = "20px";

      row.appendChild(note);
    });

    tl.appendChild(row);
  });
}

renderTimeline();