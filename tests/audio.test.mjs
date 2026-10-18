import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import { EventEmitter } from "node:events";
import ts from "typescript";

const code = ts.transpileModule(fs.readFileSync("src/audio.ts", "utf8"), {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS },
}).outputText;

function setup(savedMute = "false") {
  const storage = new Map([["olympus-muted", savedMute]]);
  const context = {
    exports: {},
    localStorage: { getItem: (key) => storage.get(key), setItem: (key, value) => storage.set(key, value) },
  };
  vm.runInNewContext(code, context);
  const { AudioDirector, AUDIO_FILES } = context.exports;
  const loaded = new Set(Object.keys(AUDIO_FILES));
  const sounds = [];
  class Sound extends EventEmitter {
    constructor(key, config) {
      super();
      this.key = key;
      this.volume = config.volume;
      this.loop = config.loop;
      this.isPlaying = false;
      this.isPaused = false;
      this.plays = 0;
      this.resumes = 0;
      this.destroyed = false;
    }
    play() { this.isPlaying = true; this.isPaused = false; this.plays++; }
    pause() { this.isPlaying = false; this.isPaused = true; }
    resume() { this.isPlaying = true; this.isPaused = false; this.resumes++; }
    setVolume(value) { this.volume = value; }
    destroy() { this.isPlaying = false; this.destroyed = true; this.removeAllListeners(); }
  }
  const manager = {
    muted: false,
    game: { cache: { audio: { exists: (key) => loaded.has(key) } } },
    context: { state: "suspended", resumes: 0, resume() { this.resumes++; this.state = "running"; return Promise.resolve(); } },
    setMute(value) { this.muted = value; },
    add(key, config) { const sound = new Sound(key, config); sounds.push(sound); return sound; },
    play(key, config) { this.add(key, config).play(); },
  };
  const director = new AudioDirector();
  director.attach(manager);
  return { director, manager, sounds, loaded, storage, files: AUDIO_FILES };
}

test("audio initialization resumes the shared context only when needed", () => {
  const { director, manager } = setup();
  director.init();
  director.init();
  assert.equal(manager.context.resumes, 1);
  assert.equal(manager.context.state, "running");
});

test("mute controls the master output and suppresses new sound effects", () => {
  const { director, manager, sounds, storage } = setup();
  director.sfx("hit");
  assert.equal(sounds.length, 1);
  director.setMute();
  assert.equal(manager.muted, true);
  assert.equal(storage.get("olympus-muted"), "true");
  director.sfx("hit");
  assert.equal(sounds.length, 1);
  director.setMute();
  assert.equal(manager.muted, false);
  director.sfx("hit");
  assert.equal(sounds.length, 2);
});

test("saved mute is applied before the first sound can play", () => {
  const { director, manager, sounds } = setup("true");
  director.sfx("confirm");
  assert.equal(manager.muted, true);
  assert.equal(sounds.length, 0);
});

test("narration lowers music and ambience and restores both on completion", () => {
  const { director } = setup();
  director.playMusic();
  director.ambience("bus");
  director.narration("intro");
  assert.equal(director.music.volume, 0.09);
  assert.equal(director.ambient.volume, 0.08);
  const voice = director.voice;
  voice.emit("complete");
  assert.equal(director.voice, null);
  assert.equal(voice.destroyed, true);
  assert.equal(director.music.volume, 0.25);
  assert.equal(director.ambient.volume, 0.16);
});

test("skipping or replacing narration stops the previous voice", () => {
  const { director } = setup();
  director.playMusic();
  director.narration("intro");
  const previous = director.voice;
  director.narration("ending");
  assert.equal(previous.destroyed, true);
  previous.emit("complete");
  assert.equal(director.voice.key, "ending");
  assert.equal(director.music.volume, 0.09);
  const ending = director.voice;
  director.stopVoice();
  assert.equal(ending.destroyed, true);
  assert.equal(director.music.volume, 0.25);
});

test("music resumes after the prophecy without overlapping or restarting", () => {
  const { director, sounds } = setup();
  director.playMusic();
  const music = director.music;
  director.playMusic();
  assert.equal(music.plays, 1);
  music.pause();
  director.playMusic();
  assert.equal(director.music, music);
  assert.equal(music.resumes, 1);
  assert.equal(sounds.length, 1);
});

test("ambience transitions dispose the previous loop and preserve narration mixing", () => {
  const { director } = setup();
  director.ambience("bus");
  const bus = director.ambient;
  director.narration("intro");
  director.wind();
  assert.equal(bus.destroyed, true);
  assert.equal(director.ambient.key, "wind");
  assert.equal(director.ambient.volume, 0.08);
  const wind = director.ambient;
  director.wind(false);
  assert.equal(wind.destroyed, true);
  assert.equal(director.ambient, null);
});

test("unavailable audio fails silently without blocking the chapter", () => {
  const { director, loaded, sounds } = setup();
  loaded.clear();
  director.playMusic();
  director.narration("intro");
  director.wind();
  director.sfx("hit");
  assert.equal(sounds.length, 0);
  assert.equal(director.voice, null);
});

test("every preloaded audio key resolves to a bundled asset", () => {
  const { files } = setup();
  for (const file of Object.values(files))
    assert.ok(fs.statSync(`public/assets/audio/${file}`).size > 1000, file);
});
