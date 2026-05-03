import { audioEngine } from "../engine/audioEngine.js";

export const timelineUI = {
  init() {
    this.render();
  },

  render() {
    const tl = document.getElementById("timeline");
    tl.innerHTML = "";

    audioEngine.tracks.forEach(track => {
      const row = document.createElement("div");
      row.className = "track";

      track.clips.forEach(clip => {
        const el = document.createElement("div");
        el.className = "clip";

        el.style.left = clip.x + "px";
        el.style.top = clip.y + "px";

        this.drag(el, clip);

        row.appendChild(el);
      });

      tl.appendChild(row);
    });
  },

  drag(el, clip) {
    el.onmousedown = e => {
      const offset = e.offsetX;

      document.onmousemove = e2 => {
        clip.x = e2.pageX - offset;
        el.style.left = clip.x + "px";
      };

      document.onmouseup = () => {
        document.onmousemove = null;
      };
    };
  }
};