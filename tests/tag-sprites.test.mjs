import test from "node:test";
import assert from "node:assert/strict";

import {
  collectSpriteIndexesFromCells,
  monsterKindToSprite,
  tagToSpriteFrames
} from "../dist/index.js";

test("tagToSpriteFrames maps static tags to expected sprite index", () => {
  assert.deepEqual(tagToSpriteFrames("RBK"), [17]);
  assert.deepEqual(tagToSpriteFrames("PPK"), [30]);
  assert.deepEqual(tagToSpriteFrames(" X "), [2]);
});

test("tagToSpriteFrames maps animated tags with proper offsets", () => {
  const fr1 = tagToSpriteFrames("FR1");
  const fr2 = tagToSpriteFrames("FR2");
  const wt5 = tagToSpriteFrames("WT5");

  assert.equal(fr1.length, 40);
  assert.equal(fr2.length, 40);
  assert.equal(fr1[0], 6);
  assert.equal(fr2[0], 7);

  assert.equal(wt5.length, 50);
  assert.equal(wt5[0], 40);
});

test("tagToSpriteFrames returns null for empty/unknown tags", () => {
  assert.equal(tagToSpriteFrames("   "), null);
  assert.equal(tagToSpriteFrames("ZZZ"), null);
});

test("monsterKindToSprite returns expected first-frame sprites", () => {
  assert.equal(monsterKindToSprite("sun"), 97);
  assert.equal(monsterKindToSprite("spider"), 89);
  assert.equal(monsterKindToSprite("swirl"), 93);
  assert.equal(monsterKindToSprite("bones"), 101);
  assert.equal(monsterKindToSprite("ufo"), 105);
  assert.equal(monsterKindToSprite("guard"), 109);
});

test("collectSpriteIndexesFromCells deduplicates sprite indexes", () => {
  const list = collectSpriteIndexesFromCells([
    { tag: "RBK", col: 0, row: 0, x: 0, y: 0 },
    { tag: "FR1", col: 1, row: 0, x: 16, y: 0 },
    { tag: "RBK", col: 2, row: 0, x: 32, y: 0 }
  ]);

  assert.equal(list.includes(17), true);
  assert.equal(list.includes(6), true);
  assert.equal(list.includes(7), true);
  assert.equal(list.includes(8), true);
  assert.equal(list.includes(9), true);
});

