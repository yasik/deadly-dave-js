import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const expectedTunes = [
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

test("generated audio manifest includes all expected tunes", () => {
  const manifestPath = path.resolve("./public/audio/manifest.json");
  assert.equal(fs.existsSync(manifestPath), true, "manifest.json should exist");

  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  for (const tune of expectedTunes) {
    assert.equal(Boolean(manifest[tune]), true, `manifest missing '${tune}'`);
    assert.equal(typeof manifest[tune].samples, "number", `${tune}: samples missing`);
    assert.equal(manifest[tune].samples > 0, true, `${tune}: samples should be > 0`);
  }
});

test("generated audio files exist and are non-empty wav files", () => {
  for (const tune of expectedTunes) {
    const wavPath = path.resolve(`./public/audio/${tune}.wav`);
    assert.equal(fs.existsSync(wavPath), true, `${tune}.wav should exist`);
    const stat = fs.statSync(wavPath);
    assert.equal(stat.size > 44, true, `${tune}.wav should have data payload`);
  }
});

test("audio build is self-contained in this repo", () => {
  const buildScriptPath = path.resolve("./scripts/build-sfx.mjs");
  const buildScriptSource = fs.readFileSync(buildScriptPath, "utf8");
  assert.equal(buildScriptSource.includes("soundfx.c"), false, "build script should not depend on C source path");

  const symbolPath = path.resolve("./scripts/sfx-symbols.json");
  assert.equal(fs.existsSync(symbolPath), true, "local sfx-symbols.json should exist");
  const symbols = JSON.parse(fs.readFileSync(symbolPath, "utf8"));
  const requiredSources = [
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
    "tojetpack"
  ];

  for (const source of requiredSources) {
    const sequence = symbols[source];
    assert.equal(Array.isArray(sequence), true, `${source}: symbol sequence missing`);
    assert.equal(sequence.length > 0, true, `${source}: sequence should not be empty`);
    assert.equal(sequence[sequence.length - 1], 0xffff, `${source}: sequence should terminate with 0xFFFF`);
  }

  const run = spawnSync(process.execPath, [buildScriptPath], {
    cwd: process.cwd(),
    encoding: "utf8"
  });

  assert.equal(run.status, 0, run.stderr || run.stdout);
});
