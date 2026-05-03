import { audioEngine } from "../engine/audioEngine.js";

export const importer = {
  async load(e) {
    const file = e.target.files[0];
    const arr = await file.arrayBuffer();
    const buffer = await audioEngine.ctx.decodeAudioData(arr);

    if (!audioEngine.tracks[0]) audioEngine.addTrack();

    audioEngine.tracks[0].clips.push({
      x: 0,
      y: 20
    });
  }
};