const DAW = window.DAW;

// 🎛 create track
window.addTrack = function(type) {
  DAW.addTrack(type);
};

// default track
DAW.addTrack("sine");

// 🎹 PIANO ROLL
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

// 🎧 TIMELINE RENDER
function renderTimeline() {
  const tl = document.getElementById("timeline");
  tl.innerHTML = "";

  DAW.tracks.forEach(track => {

    const row = document.createElement("div");
    row.className = "track";

    const label = document.createElement("div");
    label.className = "trackLabel";
    label.innerText = track.type;

    row.appendChild(label);

    track.notes.forEach(n => {

      const el = document.createElement("div");
      el.className = "note";

      el.style.left = n.time * 80 + "px";
      el.style.width = n.duration * 80 + "px";
      el.style.top = "40px";

      row.appendChild(el);
    });

    tl.appendChild(row);
  });
}

// 💾 EXPORT
window.exportProject = function () {
  const blob = new Blob(
    [JSON.stringify(DAW.tracks, null, 2)],
    { type: "application/json" }
  );

  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "project.daw.json";
  a.click();
};

// 📂 IMPORT
document.getElementById("importFile").onchange = async (e) => {
  const file = e.target.files[0];
  const text = await file.text();

  DAW.tracks = JSON.parse(text);
  renderTimeline();
};

// expose
window.renderTimeline = renderTimeline;