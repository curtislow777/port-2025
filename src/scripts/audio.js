import { Howl } from "howler";

class AudioManager {
  constructor() {
    if (typeof window !== "undefined" && AudioManager._instance) {
      return AudioManager._instance;
    }

    AudioManager._instance = this;

    this.bgm = new Howl({
      src: ["audio/moving.ogg"],
      loop: true,
      volume: 0.0,
    });

    this.click = new Howl({
      src: ["audio/ui-click.wav"],
      volume: 1.0,
    });
  }

  playBGM(volume = 1.0) {
    this.bgm.volume(volume);
    if (!this.bgm.playing()) this.bgm.play();
  }

  pauseBGM(volume = 1.0) {
    this.bgm.volume(volume);
    if (this.bgm.playing()) this.bgm.pause();
  }

  playClick(volume = 0.1) {
    this.click.volume(volume);
    this.click.play();
  }
}

const audioManagerInstance = new AudioManager();
export default audioManagerInstance;
