import { Howl } from "howler";

const bgm = new Howl({
  src: ["audio/moving.ogg"],
  loop: true,
  volume: 0.0,
});

const click = new Howl({
  src: ["audio/ui-click.wav"],
  volume: 1.0,
});

const AudioManager = {
  playBGM: (volume = 1.0) => {
    bgm.volume(volume);
    if (!bgm.playing()) bgm.play();
  },
  pauseBGM: (volume = 1.0) => {
    bgm.volume(volume);
    if (bgm.playing()) bgm.pause();
  },

  playClick: (volume = 0.1) => {
    click.volume(volume);
    click.play();
    console.log("buttonclick");
  },
};

export default AudioManager;
