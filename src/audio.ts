import type Phaser from "phaser";

type SoundManager = Phaser.Scene["sound"];
type Sound = ReturnType<SoundManager["add"]>;

export const AUDIO_FILES: Record<string, string> = Object.fromEntries([
  ...["intro", "ending", "combat", "wind", "bus", "reveal", "prophecy-1", "prophecy-2", "prophecy-3", "prophecy-4"].map((key) => [key, key + ".mp3"]),
  ...[
    "ui", "confirm", "slash", "hit", "heavy", "block", "jump", "land",
    "coin", "fire", "charm", "lightning", "gust", "victory", "defeat",
  ].map((key) => [key, key + ".wav"]),
]);

export class AudioDirector {
  muted = localStorage.getItem("olympus-muted") === "true";
  music: Sound | null = null;
  voice: Sound | null = null;
  ambient: Sound | null = null;
  private manager: SoundManager | null = null;

  attach(manager: SoundManager) {
    this.manager = manager;
    manager.setMute(this.muted);
  }

  init() {
    // Called from the game's pointer/keyboard controls. Phaser also installs
    // its own unlock listeners and manages browser visibility interruptions.
    const manager = this.manager;
    if (manager && "context" in manager) {
      const context = manager.context;
      if (context.state !== "running" && context.state !== "closed")
        void context.resume().catch(() => {});
    }
  }

  setMute() {
    this.init();
    this.muted = !this.muted;
    localStorage.setItem("olympus-muted", String(this.muted));
    // The manager's master gain includes already-playing one-shot effects.
    this.manager?.setMute(this.muted);
    return this.muted;
  }

  private create(name: string, loop: boolean, volume: number): Sound | null {
    if (!this.manager?.game.cache.audio.exists(name)) return null;
    return this.manager.add(name, { loop, volume });
  }

  private mix() {
    const speaking = this.voice !== null;
    this.music?.setVolume(speaking ? 0.09 : 0.25);
    this.ambient?.setVolume(speaking ? 0.08 : 0.16);
  }

  playMusic(name = "combat") {
    if (this.music?.key === name) {
      if (this.music.isPaused) this.music.resume();
      else if (!this.music.isPlaying) this.music.play();
      return;
    }
    this.music?.destroy();
    this.music = this.create(name, true, 0.25);
    this.mix();
    this.music?.play();
  }

  narration(name: string) {
    this.stopVoice();
    const voice = this.create(name, false, 0.9);
    if (!voice) return;
    this.voice = voice;
    this.mix();
    voice.once("complete", () => {
      if (this.voice !== voice) return;
      this.voice = null;
      voice.destroy();
      this.mix();
    });
    voice.play();
  }

  stopVoice() {
    this.voice?.destroy();
    this.voice = null;
    this.mix();
  }

  ambience(name: string) {
    if (this.ambient?.key === name) {
      if (this.ambient.isPaused) this.ambient.resume();
      else if (!this.ambient.isPlaying) this.ambient.play();
      return;
    }
    this.ambient?.destroy();
    this.ambient = this.create(name, true, 0.16);
    this.mix();
    this.ambient?.play();
  }

  wind(on = true) {
    if (on) this.ambience("wind");
    else {
      this.ambient?.destroy();
      this.ambient = null;
    }
  }

  sfx(kind: string) {
    if (this.muted) return;
    const key = kind === "special" ? "coin" : kind;
    if (!this.manager?.game.cache.audio.exists(key)) return;
    // Phaser destroys one-shot sounds on completion.
    this.manager.play(key, { volume: 0.28 });
  }
}

export const audio = new AudioDirector();
