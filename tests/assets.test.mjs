import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
const root = "public/assets/";
function pngSize(path) {
  const b = fs.readFileSync(path);
  return { w: b.readUInt32BE(16), h: b.readUInt32BE(20) };
}
test("all named combat and walk frames stay inside their source image", () => {
  const expectedFrames = { "heroes": 18, "heroes-walk": 12, "heroes-strikes-v2": 3, "jason-idle-v2": 1 };
  for (const [name, count] of Object.entries(expectedFrames)) {
    const { w, h } = pngSize(root + `art/${name}.png`);
    const atlas = JSON.parse(fs.readFileSync(root + `art/${name}-atlas.json`));
    assert.equal(Object.keys(atlas.frames).length, count);
    for (const [key, entry] of Object.entries(atlas.frames)) {
      const f = entry.frame;
      assert.ok(
        f.x >= 0 && f.y >= 0 && f.w > 0 && f.h > 0,
        `${key} has valid coordinates`,
      );
      assert.ok(f.x + f.w <= w && f.y + f.h <= h, `${key} inside texture`);
    }
  }
});
test("all scene backgrounds and integrated audio files are bundled", () => {
  for (const n of ["bus", "rescue", "title", "arena", "wind-spirit-v2", "heroes-strikes-v2"])
    assert.ok(fs.statSync(root + `art/${n}.png`).size > 100000);
  for (const n of ["intro", "ending", "combat", "wind", "bus", "reveal"])
    assert.ok(fs.statSync(root + `audio/${n}.mp3`).size > 10000);
  for (const n of [
    "ui",
    "confirm",
    "slash",
    "hit",
    "heavy",
    "block",
    "jump",
    "land",
    "coin",
    "charm",
    "lightning",
    "gust",
    "victory",
    "defeat",
  ])
    assert.ok(fs.statSync(root + `audio/${n}.wav`).size > 1000);
});
test("replacement strike frames occupy separate padded atlas columns", () => {
  const atlas = JSON.parse(fs.readFileSync(root + "art/heroes-strikes-v2-atlas.json"));
  const cell = atlas.meta.size.w / 3;
  ["jason", "piper", "leo"].forEach((name, i) => {
    const f = atlas.frames[name + "-quick"].frame;
    assert.ok(f.x > cell * i + 10);
    assert.ok(f.x + f.w < cell * (i + 1) - 10);
  });
});
test("prophecy content exactly preserves the four supplied lines in the brief", () => {
  const brief = fs
    .readFileSync("heroes-first-battle-build-brief.md", "utf8")
    .split("Use the four lines below")[1];
  const supplied = [...brief.matchAll(/\d\. “(.*?)”/g)]
    .slice(0, 4)
    .map((m) => m[1]);
  const data = JSON.parse(fs.readFileSync(root + "prophecy.json", "utf8"));
  assert.equal(data.length, 4);
  assert.deepEqual(data, supplied);
});
