import { audioEngine } from "./engine/audioEngine.js";
import { scheduler } from "./engine/scheduler.js";
import { timelineUI } from "./ui/timeline.js";
import { pianoRoll } from "./ui/pianoRoll.js";
import { mixerUI } from "./ui/mixer.js";
import { recorder } from "./features/recorder.js";
import { importer } from "./features/importer.js";

document.getElementById("playBtn").onclick = () => scheduler.play();
document.getElementById("stopBtn").onclick = () => scheduler.stop();

document.getElementById("addTrackBtn").onclick = () => {
  audioEngine.addTrack();
  timelineUI.render();
  mixerUI.render();
};

document.getElementById("importAudio").onchange = importer.load;

pianoRoll.init();
timelineUI.init();
mixerUI.init();