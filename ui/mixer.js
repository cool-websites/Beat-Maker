import { audioEngine } from "../engine/audioEngine.js";

export const mixerUI = {
  init() {
    this.render();
  },

  render() {
    const m = document.getElementById("mixer");
    m.innerHTML = "";

    audioEngine.tracks.forEach((t, i) => {
      const fader = document.createElement("input");
      fader.type = "range";
      fader.min = 0;
      fader.max = 1;
      fader.step = 0.01;

      fader.oninput = () => t.gain.gain.value = fader.value;

      m.appendChild(fader);
    });
  }
};