import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

import { LevelParseError, parseLevelMap } from "../dist/index.js";

const LEVELS_DIR = path.resolve(process.cwd(), "public/levels");

const EXPECTED_OK_FIXTURES = {
  "level1.ddt": { cells: 275, monsters: 0, hasDave: true },
  "level2.ddt": { cells: 550, monsters: 0, hasDave: true },
  "level3.ddt": { cells: 1100, monsters: 2, hasDave: true },
  "level4.ddt": { cells: 1100, monsters: 1, hasDave: true },
  "level5.ddt": { cells: 1100, monsters: 4, hasDave: true },
  "level5_secret.ddt": { cells: 638, monsters: 0, hasDave: true },
  "level6.ddt": { cells: 704, monsters: 4, hasDave: true },
  "level7.ddt": { cells: 946, monsters: 4, hasDave: true },
  "level8.ddt": { cells: 1100, monsters: 2, hasDave: true },
  "warp_down.ddt": { cells: 253, monsters: 0, hasDave: true },
  "warp_right.ddt": { cells: 297, monsters: 0, hasDave: true }
};

test("real level fixtures parse with expected counts", () => {
  for (const [file, expected] of Object.entries(EXPECTED_OK_FIXTURES)) {
    const source = fs.readFileSync(path.join(LEVELS_DIR, file), "utf8");
    const parsed = parseLevelMap(source);

    assert.equal(parsed.cells.length, expected.cells, `${file}: cell count`);
    assert.equal(parsed.monsterSpawns.length, expected.monsters, `${file}: monster count`);
    assert.equal(Boolean(parsed.daveSpawn), expected.hasDave, `${file}: dave spawn`);
  }
});

test("level9 fixture keeps parser parity for malformed token handling", () => {
  const source = fs.readFileSync(path.join(LEVELS_DIR, "level9.ddt"), "utf8");

  assert.throws(
    () => parseLevelMap(source),
    (err) => err instanceof LevelParseError && err.code === -1
  );
});

