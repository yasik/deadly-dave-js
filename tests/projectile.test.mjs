import test from "node:test";
import assert from "node:assert/strict";

import {
  DaveDirection,
  TileMod,
  PROJECTILE_STATE_DEAD,
  createBulletRight,
  createPlasmaRight,
  spawnDaveBullet,
  tickProjectile
} from "../dist/index.js";

function brickTile(x, y, width = 16, height = 16) {
  return {
    x,
    y,
    width,
    height,
    collisionDx: 0,
    collisionDy: 0,
    collisionDw: 0,
    collisionDh: 0,
    mod: TileMod.BRICK,
    firstSprite: 1
  };
}

test("bullet moves by speed when alive", () => {
  const bullet = createBulletRight(10, 10);
  const next = tickProjectile(bullet, [], -100, 1000);
  assert.equal(next.x, 12);
  assert.notEqual(next.state, PROJECTILE_STATE_DEAD);
});

test("bullet dies when crossing deadzone", () => {
  const bullet = createBulletRight(319, 10);
  const next = tickProjectile(bullet, [], 0, 320);
  assert.equal(next.state, PROJECTILE_STATE_DEAD);
});

test("bullet dies when colliding with a brick tile", () => {
  const bullet = createBulletRight(0, 10);
  const map = [brickTile(12, 10)];
  const next = tickProjectile(bullet, map, -100, 1000);
  assert.equal(next.state, PROJECTILE_STATE_DEAD);
});

test("plasma uses wider right-side probe (20 px)", () => {
  const plasma = createPlasmaRight(0, 10);
  const map = [brickTile(22, 10)];
  const next = tickProjectile(plasma, map, -100, 1000);
  assert.equal(next.state, PROJECTILE_STATE_DEAD);
});

test("spawnDaveBullet creates left bullet for left-facing Dave with gun", () => {
  const bullet = spawnDaveBullet({
    hasGun: 1,
    faceDirection: DaveDirection.LEFT,
    tile: { x: 40, y: 20 }
  });

  assert.ok(bullet);
  assert.equal(bullet.speedX, -2);
  assert.equal(bullet.x, 32);
  assert.equal(bullet.y, 28);
});

test("spawnDaveBullet returns null when Dave has no gun", () => {
  const bullet = spawnDaveBullet({
    hasGun: 0,
    faceDirection: DaveDirection.RIGHT,
    tile: { x: 40, y: 20 }
  });

  assert.equal(bullet, null);
});
