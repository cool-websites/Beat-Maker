const DAW = window.DAW;

window.addTrack = function(type) {
  DAW.addTrack(type);
};

DAW.addTrack("sine");

/* PIANO */
const piano = document.getElementById("piano");

for (let y = 0; y < 8; y++) {
  for (let x = 0; x < 64; x++) {

    const cell = document.createElement("div");
    cell.className = "cell";

    cell.onclick = () => {
      DAW.tracks[DAW.activeTrack].notes.push({
        pitch: y * 2,
        time: x * 0.25,
        duration: 0.25
      });

      renderTimeline();
    };

    piano.appendChild(cell);
  }
}

/* SCROLL */
document.getElementById("pianoScroll").addEventListener("wheel", e => {
  e.preventDefault();
  e.currentTarget.scrollLeft += e.deltaY;
}, { passive: false });

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
      note.style.top = "40px";

      row.appendChild(note);
    });

    tl.appendChild(row);
  });
}

window.renderTimeline = renderTimeline;

/* EXPORT PROJECT */
window.exportProject = function () {
  const blob = new Blob(
    [JSON.stringify(DAW.tracks)],
    { type: "application/json" }
  );

  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "project.daw.json";
  a.click();
};

/* IMPORT */
document.getElementById("importFile").onchange = async e => {
  DAW.tracks = JSON.parse(await e.target.files[0].text());
  renderTimeline();
};

renderTimeline();