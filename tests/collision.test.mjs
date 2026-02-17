import test from "node:test";
import assert from "node:assert/strict";

import { collisionDetect, TileMod } from "../dist/index.js";

function makeTile(overrides = {}) {
  return {
    x: 0,
    y: 0,
    width: 16,
    height: 16,
    collisionDx: 0,
    collisionDy: 0,
    collisionDw: 0,
    collisionDh: 0,
    mod: TileMod.EMPTY,
    firstSprite: 1,
    ...overrides
  };
}

test("collisionDetect returns true for overlapping boxes", () => {
  const tile1 = makeTile({ x: 10, y: 10 });
  const tile2 = makeTile({ x: 20, y: 20 });
  assert.equal(collisionDetect(tile1, tile2), true);
});

test("collisionDetect returns false for separated boxes", () => {
  const tile1 = makeTile({ x: 0, y: 0 });
  const tile2 = makeTile({ x: 40, y: 40 });
  assert.equal(collisionDetect(tile1, tile2), false);
});

test("collisionDetect honors collision deltas", () => {
  const tile1 = makeTile({
    x: 0,
    y: 0,
    collisionDx: 2,
    collisionDy: 2,
    collisionDw: -6
  });
  const tile2 = makeTile({
    x: 12,
    y: 0
  });
  assert.equal(collisionDetect(tile1, tile2), false);
});

