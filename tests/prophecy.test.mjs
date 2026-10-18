import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import ts from "typescript";

const code = ts.transpileModule(fs.readFileSync("src/prophecy.ts", "utf8"), {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS },
}).outputText;
const sandbox = { exports: {} };
vm.runInNewContext(code, sandbox);
const lines = JSON.parse(fs.readFileSync("public/assets/prophecy.json", "utf8"));

function setup() {
  let now = 0, nextId = 0;
  const timers = new Map();
  const events = [];
  const record = (type, value) => events.push({ type, value, at: now });
  const playback = sandbox.exports.playProphecy(lines, {
    show: (line) => record("show", line),
    hide: () => record("hide"),
    clear: () => record("clear"),
    speak: (key) => record("speak", key),
    stopVoice: () => record("stop"),
    done: () => record("done"),
    schedule: (callback, ms) => { const id = ++nextId; timers.set(id, { callback, at: now + ms }); return id; },
    unschedule: (id) => timers.delete(id),
  });
  const advance = (ms) => {
    const target = now + ms;
    while (true) {
      const next = [...timers].sort((a, b) => a[1].at - b[1].at)[0];
      if (!next || next[1].at > target) break;
      timers.delete(next[0]); now = next[1].at; next[1].callback();
    }
    now = target;
  };
  return { playback, advance, events, timers };
}

test("prophecy flows as one voice track with text synchronized to the spoken lines", () => {
  const { advance, events, timers } = setup();
  advance(30000);
  const shown = events.filter(e => e.type === "show");
  const spoken = events.filter(e => e.type === "speak");
  const hidden = events.filter(e => e.type === "hide");
  assert.deepEqual(shown.map(e => e.value), lines);
  assert.deepEqual(spoken.map(e => e.value), ["prophecy-natural"]);
  assert.equal(spoken[0].at, shown[0].at);
  assert.deepEqual(shown.map(e => e.at - spoken[0].at), [0, 3080, 6320, 8960]);
  for (let i = 0; i < 4; i++) {
    assert.ok(hidden[i].at > shown[i].at);
    if (i < 3) assert.equal(shown[i + 1].at - hidden[i].at, 160);
  }
  const finished = events.filter(e => e.type === "done");
  assert.equal(finished.length, 1);
  assert.ok(finished[0].at > spoken[0].at + 11680, "does not cut off the recording");
  assert.ok(finished[0].at < 14000, "keeps the whole sequence under 14 seconds");
  assert.equal(events.filter(e => e.type === "stop").length, 1, "voice runs uninterrupted between lines");
  assert.equal(timers.size, 0);
});

test("skipping before the first line cancels every future voice and transition", () => {
  const { playback, advance, events, timers } = setup();
  playback.skip(); playback.skip(); advance(30000);
  assert.equal(events.filter(e => e.type === "show" || e.type === "speak").length, 0);
  assert.equal(events.filter(e => e.type === "stop").length, 1);
  assert.equal(events.filter(e => e.type === "done").length, 1);
  assert.equal(timers.size, 0);
});

test("skipping while narration plays stops it and cannot reenter the story later", () => {
  const { playback, advance, events } = setup();
  advance(1600); playback.skip(); advance(30000); playback.skip();
  assert.equal(events.filter(e => e.type === "speak").length, 1);
  assert.equal(events.filter(e => e.type === "stop").length, 1);
  assert.equal(events.filter(e => e.type === "done").length, 1);
});

test("leaving the prophecy cancels playback without starting a new scene", () => {
  const { playback, advance, events, timers } = setup();
  advance(1600); playback.cancel(); advance(30000); playback.skip();
  assert.equal(events.filter(e => e.type === "stop").length, 1);
  assert.equal(events.filter(e => e.type === "done").length, 0);
  assert.equal(timers.size, 0);
});
