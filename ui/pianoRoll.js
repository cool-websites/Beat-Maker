import { audioEngine } from "../engine/audioEngine.js";
import { timelineUI } from "./timeline.js";

export const pianoRoll = {
  init() {
    const grid = document.getElementById("pianoRoll");

    for (let y = 0; y < 8; y++) {
      for (let x = 0; x < 16; x++) {
        const cell = document.createElement("div");
        cell.className = "cell";

        cell.onmousedown = () => {
          cell.classList.add("active");

          if (!audioEngine.tracks[0]) audioEngine.addTrack();

          const note = {
            pitch: y * 2,
            time: x * 0.25,
            duration: 0.2
          };

          audioEngine.tracks[0].notes.push(note);

          audioEngine.tracks[0].clips.push({
            x: x * 40,
            y: 50 - y * 5
          });

          timelineUI.render();
        };

        grid.appendChild(cell);
      }
    }
  }
};