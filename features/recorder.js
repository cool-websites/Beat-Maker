export const recorder = {
  mediaRecorder: null,
  chunks: [],

  async start() {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    this.mediaRecorder = new MediaRecorder(stream);

    this.mediaRecorder.ondataavailable = e => this.chunks.push(e.data);
    this.mediaRecorder.start();
  },

  stop() {
    this.mediaRecorder.stop();
  }
};