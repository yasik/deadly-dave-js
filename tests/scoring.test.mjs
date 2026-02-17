import test from "node:test";
import assert from "node:assert/strict";

import {
  levelNumberFromFile,
  scoreDigits,
  scoreValueForTag
} from "../dist/index.js";

test("scoreValueForTag matches C loot and pickup values", () => {
  assert.equal(scoreValueForTag(" * "), 50);
  assert.equal(scoreValueForTag(" v "), 100);
  assert.equal(scoreValueForTag(" V "), 150);
  assert.equal(scoreValueForTag(" O "), 550);
  assert.equal(scoreValueForTag(" W "), 800);
  assert.equal(scoreValueForTag(" ! "), 400);
  assert.equal(scoreValueForTag(" Y "), 1000);
  assert.equal(scoreValueForTag("GUN"), 100);
  assert.equal(scoreValueForTag("JPK"), 0);
});

test("scoreDigits returns least-significant-first fixed width digits", () => {
  assert.deepEqual(scoreDigits(0, 5), [0, 0, 0, 0, 0]);
  assert.deepEqual(scoreDigits(12345, 5), [5, 4, 3, 2, 1]);
  assert.deepEqual(scoreDigits(999999, 5), [9, 9, 9, 9, 9]);
});

test("levelNumberFromFile parses numbered level files", () => {
  assert.equal(levelNumberFromFile("level1.ddt"), 1);
  assert.equal(levelNumberFromFile("level9.ddt"), 9);
  assert.equal(levelNumberFromFile("level5_secret.ddt"), 5);
  assert.equal(levelNumberFromFile("warp_right.ddt"), 0);
});
