import test from "node:test";
import assert from "node:assert/strict";

import { LevelParseError, parseLevelMap } from "../dist/index.js";

test("parseLevelMap extracts cells, Dave spawn, and monster spawns", () => {
  const map =
    " D ,RBK,SU1;" +
    "SP1,SW1,UF1;";

  const parsed = parseLevelMap(map);

  assert.equal(parsed.cells.length, 6);
  assert.deepEqual(parsed.daveSpawn, { x: 0, y: 0 });
  assert.equal(parsed.monsterSpawns.length, 4);
  assert.deepEqual(parsed.monsterSpawns[0], { kind: "sun", x: 0, y: 40 });
  assert.deepEqual(parsed.monsterSpawns[1], { kind: "spider", x: 16, y: -12 });
  assert.deepEqual(parsed.monsterSpawns[2], { kind: "swirl", x: 19, y: 6 });
  assert.deepEqual(parsed.monsterSpawns[3], { kind: "ufo", x: 16, y: 32 });
});

test("parseLevelMap ignores comment regions", () => {
  const map = " D ,# ignore all this until newline\nRBK;";
  const parsed = parseLevelMap(map);

  assert.equal(parsed.cells.length, 2);
  assert.equal(parsed.cells[0].tag, " D ");
  assert.equal(parsed.cells[1].tag, "RBK");
});

test("parseLevelMap throws -1 on malformed row delimiter token", () => {
  assert.throws(
    () => parseLevelMap("AB,"),
    (err) => err instanceof LevelParseError && err.code === -1
  );
});

test("parseLevelMap throws -2 on malformed column delimiter token", () => {
  assert.throws(
    () => parseLevelMap("AB;"),
    (err) => err instanceof LevelParseError && err.code === -2
  );
});

test("parseLevelMap throws -3 when tag exceeds three characters", () => {
  assert.throws(
    () => parseLevelMap("ABCD,"),
    (err) => err instanceof LevelParseError && err.code === -3
  );
});
