export const audioEngine = {
  ctx: new AudioContext(),
  tracks: [],

  addTrack() {
    const gain = this.ctx.createGain();
    gain.connect(this.ctx.destination);

    this.tracks.push({
      gain,
      notes: [],
      clips: []
    });
  }
};