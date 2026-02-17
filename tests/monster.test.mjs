import test from "node:test";
import assert from "node:assert/strict";

import {
  MonsterStateKind,
  createMonster,
  createMonsterFromSpawn,
  getMonsterSprite,
  isMonsterAlive,
  tickMonster
} from "../dist/index.js";

test("monster active tick follows route + cooldown cadence", () => {
  const spider = createMonster("spider", 100, 50);

  tickMonster(spider, 80);
  assert.equal(spider.tile.x, 105);
  assert.equal(spider.tile.y, 53);
  assert.equal(getMonsterSprite(spider), 90);

  for (let i = 0; i < 4; i += 1) {
    tickMonster(spider, 80);
  }
  assert.equal(spider.tile.x, 105);
  assert.equal(spider.tile.y, 53);

  tickMonster(spider, 80);
  assert.equal(spider.tile.x, 107);
  assert.equal(spider.tile.y, 57);
});

test("monster route wraps to start when reaching end", () => {
  const sun = createMonster("sun", 0, 0);
  const dx = sun.route[sun.route.length - 2];
  const dy = sun.route[sun.route.length - 1];
  sun.routeIdx = sun.route.length - 2;
  sun.cooldown = 0;

  tickMonster(sun, 0);

  assert.equal(sun.tile.x, dx);
  assert.equal(sun.tile.y, dy);
  assert.equal(sun.routeIdx, 0);
});

test("monster transitions active -> burning -> dead after fire", () => {
  const swirl = createMonsterFromSpawn({ kind: "swirl", x: 10, y: 10 });
  swirl.onFire = 1;

  tickMonster(swirl, 0);
  assert.equal(swirl.state, MonsterStateKind.BURNING);
  assert.equal(getMonsterSprite(swirl), 131);
  assert.equal(isMonsterAlive(swirl), false);

  for (let i = 0; i < 100; i += 1) {
    tickMonster(swirl, 0);
  }

  assert.equal(swirl.state, MonsterStateKind.DEAD);
  assert.equal(getMonsterSprite(swirl), 0);
});
