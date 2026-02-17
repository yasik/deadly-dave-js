export type SoundTune =
  | "silence"
  | "got_trophy"
  | "treasure"
  | "nextlevel"
  | "walking"
  | "jumping"
  | "got_something"
  | "explosion"
  | "ouch"
  | "flying"
  | "falling"
  | "tojetpack"
  | "climbing";

const TUNES: SoundTune[] = [
  "silence",
  "got_trophy",
  "treasure",
  "nextlevel",
  "walking",
  "jumping",
  "got_something",
  "explosion",
  "ouch",
  "flying",
  "falling",
  "tojetpack",
  "climbing"
];

function tuneKey(tune: SoundTune): string {
  return `sfx-${tune}`;
}

export function queueSoundFxAssets(scene: any): number {
  let queued = 0;
  for (const tune of TUNES) {
    const key = tuneKey(tune);
    if (!scene.cache.audio.exists(key)) {
      scene.load.audio(key, `./public/audio/${tune}.wav`);
      queued += 1;
    }
  }
  return queued;
}

export class SoundFxPlayer {
  private scene: any;
  private currentSound: any | null = null;
  private currentTune: SoundTune | null = null;

  constructor(scene: any) {
    this.scene = scene;
    this.scene.input.keyboard.on("keydown", () => this.resumeAudioContext());
    this.scene.input.on("pointerdown", () => this.resumeAudioContext());
  }

  getActiveTune(): SoundTune | null {
    return this.currentTune;
  }

  play(tune: SoundTune, options: { loop?: boolean; restart?: boolean } = {}): void {
    if (!this.scene.cache.audio.exists(tuneKey(tune))) {
      return;
    }

    this.resumeAudioContext();

    if (this.currentSound && this.currentTune === tune && !options.restart) {
      if (options.loop && this.currentSound.isPlaying) {
        return;
      }
    }

    this.stop();

    this.currentTune = tune;
    this.currentSound = this.scene.sound.add(tuneKey(tune), {
      volume: 0.30,
      loop: options.loop === true
    });

    if (!options.loop) {
      this.currentSound.once("complete", () => {
        if (this.currentSound) {
          this.currentSound.destroy();
          this.currentSound = null;
          this.currentTune = null;
        }
      });
    }

    this.currentSound.play();
  }

  stop(): void {
    if (!this.currentSound) {
      return;
    }

    if (this.currentSound.isPlaying) {
      this.currentSound.stop();
    }
    this.currentSound.destroy();
    this.currentSound = null;
    this.currentTune = null;
  }

  resumeAudioContext(): void {
    const ctx = this.scene.sound?.context;
    if (ctx && ctx.state === "suspended" && typeof ctx.resume === "function") {
      void ctx.resume();
    }
  }
}
