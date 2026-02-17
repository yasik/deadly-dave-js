import test from "node:test";
import assert from "node:assert/strict";

import {
  DaveClimbingState,
  DaveDirection,
  DaveStateKind,
  DaveWalkingState,
  TileMod,
  createDave,
  isDaveDead,
  resetDaveAfterDeath,
  snapshotDave,
  tickDave
} from "../dist/index.js";

function brickTile(x, y) {
  return {
    x,
    y,
    width: 16,
    height: 16,
    collisionDx: 0,
    collisionDy: 0,
    collisionDw: 0,
    collisionDh: 0,
    mod: TileMod.BRICK,
    firstSprite: 1
  };
}

function makeGround(y = 32, from = -160, to = 320) {
  const out = [];
  for (let x = from; x <= to; x += 16) {
    out.push(brickTile(x, y));
  }
  return out;
}

function replay(dave, map, inputs) {
  const snapshots = [];
  for (const input of inputs) {
    tickDave(dave, map, input);
    snapshots.push(snapshotDave(dave));
  }
  return snapshots;
}

test("replay: walk right follows cooldown chain and returns to standing", () => {
  const dave = createDave(32, 16);
  const map = makeGround();

  const history = replay(dave, map, [{ right: true }, {}, {}]);

  assert.equal(history[0].state, DaveStateKind.WALKING);
  assert.equal(history[0].x, 34);
  assert.equal(history[0].walkState, DaveWalkingState.COOLDOWN2_RIGHT);
  assert.equal(history[0].faceDirection, DaveDirection.RIGHT);

  assert.equal(history[1].state, DaveStateKind.WALKING);
  assert.equal(history[1].walkState, DaveWalkingState.COOLDOWN1_RIGHT);

  assert.equal(history[2].state, DaveStateKind.STANDING);
  assert.equal(history[2].walkState, DaveWalkingState.STANDING);
});

test("jump enters arc and lands back on ground with cooldown", () => {
  const dave = createDave(32, 16);
  const map = makeGround();

  tickDave(dave, map, { jump: true });
  assert.equal(dave.state, DaveStateKind.JUMPING);
  assert.equal(dave.jumpState, 0);

  tickDave(dave, map, {});
  assert.equal(dave.state, DaveStateKind.JUMPING);
  assert.equal(dave.tile.y, 15);
  assert.equal(dave.jumpState, 1);

  for (let i = 0; i < 240; i += 1) {
    tickDave(dave, map, {});
    if (dave.state === DaveStateKind.STANDING && dave.jumpCooldownCount === 5) {
      break;
    }
  }

  assert.equal(dave.state, DaveStateKind.STANDING);
  assert.equal(dave.tile.y, 16);
  assert.equal(dave.jumpCooldownCount, 5);
});

test("standing in air transitions to freefall then lands", () => {
  const dave = createDave(32, 0);
  const map = makeGround(48);

  tickDave(dave, map, {});
  assert.equal(dave.state, DaveStateKind.FREEFALLING);

  for (let i = 0; i < 100; i += 1) {
    tickDave(dave, map, {});
    if (dave.state === DaveStateKind.STANDING) {
      break;
    }
  }

  assert.equal(dave.state, DaveStateKind.STANDING);
  assert.equal(dave.tile.y, 32);
});

test("jetpack toggles on and off with jetpack key", () => {
  const dave = createDave(32, 16);
  const map = makeGround();
  dave.jetpackBars = 5;

  tickDave(dave, map, { jetpack: true });
  assert.equal(dave.state, DaveStateKind.JETPACKING);

  tickDave(dave, map, { jetpack: true });
  assert.equal(dave.state, DaveStateKind.STANDING);
});

test("onFire drives burning timer to dead state", () => {
  const dave = createDave(32, 16);
  const map = makeGround();
  dave.onFire = 1;

  tickDave(dave, map, {});
  assert.equal(dave.state, DaveStateKind.BURNING);

  for (let i = 0; i < 200; i += 1) {
    tickDave(dave, map, {});
  }

  assert.equal(isDaveDead(dave), true);
});

test("tree contact allows climbing entry from standing", () => {
  const dave = createDave(32, 16);
  const map = makeGround();
  dave.onTree = 1;

  tickDave(dave, map, { jump: true });
  assert.equal(dave.state, DaveStateKind.CLIMBING);
  assert.equal(dave.climbState, DaveClimbingState.READY);
});

test("resetDaveAfterDeath restores default spawn and clears death flags", () => {
  const dave = createDave(32, 16);
  dave.tile.x = 140;
  dave.tile.y = 90;
  dave.state = DaveStateKind.DEAD;
  dave.onFire = 1;
  dave.jumpState = 33;
  dave.stepCount = 7;

  resetDaveAfterDeath(dave);

  assert.equal(dave.tile.x, 32);
  assert.equal(dave.tile.y, 16);
  assert.equal(dave.state, DaveStateKind.STANDING);
  assert.equal(dave.onFire, 0);
  assert.equal(dave.jumpState, 0);
  assert.equal(dave.stepCount, 0);
});
