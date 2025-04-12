import { Howl } from "howler";

const bgm = new Howl({
  src: ["audio/moving.ogg"],
  loop: true,
  volume: 0.0,
});

const click = new Howl({
  src: ["audio/click.ogg"],
  volume: 1.0,
});

const AudioManager = {
  playBGM: (volume = 1.0) => {
    bgm.volume(volume);
    if (!bgm.playing()) bgm.play();
  },

  playClick: (volume = 1.0) => {
    click.volume(volume);
    click.play();
  },
};

export default AudioManager;
