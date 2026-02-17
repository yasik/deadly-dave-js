import type { MonsterKind, MonsterSpawn, TileState } from "./types.js";
import { TileMod } from "./types.js";

export enum MonsterStateKind {
  BLINKING = 0,
  ACTIVE = 1,
  BURNING = 2,
  DEAD = 3
}

interface MonsterSpec {
  width: number;
  height: number;
  fireRate: number;
  route: number[];
  sprites: number[];
}

export interface MonsterEntity {
  kind: MonsterKind;
  state: MonsterStateKind;
  route: number[];
  routeIdx: number;
  cooldown: number;
  ticksInState: number;
  ticksBeforeShoot: number;
  fireRate: number;
  onFire: number;
  spriteIdx: number;
  sprites: number[];
  tile: TileState;
}

const SPIDER_PATH = [
   5,  3,  2,  4,  0,  5, -3,  4,   -4,  4, -5,  3, -7,  2, -6,  2,
  -6,  1, -7,  1, -8, -2, -5, -3,   -6, -3, -7, -2, -7, -3, -5, -2,
  -7, -3, -6, -3, -7, -3, -9, -2,  -10,  0, -9,  1, -7,  2, -9,  2,
  -8,  3, -8,  0, -9,  0, -9,  1,  -10,  2, -7,  0, -3, -1, -2, -4,
   1, -4,  3, -3,  3, -1,  3, -1,    6, -2,  8, -2,  8, -1, 11, -1,
  14, -1, 14, -2, 15,  0, 18,  0,   17,  0, 17,  1, 14,  1, 15,  1,
  10,  2,  6,  2,  6,  2
];

const SWIRL_PATH = [
  -6, -4, -8, -2, -11,  0, -14,  0,  -10,  0, -11,  0, -11,  0, -10,  0,
  -9,  1, -5,  1,  -3,  2,  -2,  2,   -2,  4,  -1,  5,   0,  6,   0,  6,
   1,  8,  5,  6,  11,  7,   9,  6,    8,  9,   2,  7,   6,  5,   4, 10,
  11,  6, 15,  2,  14, -2,  11, -3,    9, -8,   4, -7,   1, -7,   1, -8,
   0, -7,  0, -7,   0, -8,  -1, -7,   -3, -8,  -3, -5,   0, -5,  -2, -5
];

const SUN_PATH = [
  -2,   3,  1,  3, -2,  3, -4,  3,  -5, -2, -2, -3, -5,  0, -4,  2,
  -4,   3,  0,  0,  0,  1, -3,  5,  -2,  6, -1,  8,  2, 10,  8, 10,
  12,   8, 13,  6, 10,  6,  5,  3,   4, -1,  4, -3,  3, -4,  2, -6,
   1, -10, -3, -11, -7, -11,  0, -8,  3, -11, -4, -7, -6, -5, -7, -3,
  -5,   2, -2,  3
];

const BONES_PATH = [
   6,  0, 10,  0,  9,  0,  9,  0,   9,  0, 10,  0,  9,  0,  9,  0,
   9,  0, 10,  0, 10,  0, 10,  0,  10,  0,  9,  0,  7,  0, -3,  0,
  -8,  0, -10,  0, -10,  0, -10,  0, -10,  0, -10,  0, -8,  0, -10,  0,
  -9,  0, -10,  0, -9,  0, -8,  0, -10,  0, -8,  0, -3,  0
];

const UFO_PATH = [
   4,   0,  4,   1,  4,  2,  3,  2,   2,  4,  1,  5,  1,  7,  0,  9,
   0,   8,  0,  10, -2,  8, -5,  8,  -6,  7, -5,  9, -5,  7, -4,  1,
  -4,   0, -3,  -1, -3, -3, -3, -6,  -3, -7, -1, -8, -2, -9,  2, -10,
   1, -10,  3,  -9,  5, -9,  4, -6,   5, -5,  3, -3,  4, -2
];

const GUARD_PATH = [
  -6,  1, -4,  2, -4,  3, -3,  4,  -1,  3, -4,  3, -3,  2, -5,  2,
  -2,  3,  0,  4,  4,  2,  5,  2,   4,  1,  3,  3,  2,  5,  5,  3,
   4,  2,  6,  1,  5,  0,  5, -1,   4, -2,  2, -3,  1, -3,  1, -3,
   3, -3,  5, -1,  3, -1,  3, -2,   2, -3,  0, -3, -3, -2, -5, -2,
  -7, -1, -3, -2, -2, -3, -1, -3,  -2, -3, -3, -3, -4, -2, -5,  0
];

const MONSTER_SPECS: Record<MonsterKind, MonsterSpec> = {
  sun: {
    width: 24,
    height: 21,
    fireRate: 50,
    route: SUN_PATH,
    sprites: [97, 97, 98, 98, 99, 99, 100, 100]
  },
  spider: {
    width: 24,
    height: 21,
    fireRate: 50,
    route: SPIDER_PATH,
    sprites: [89, 90, 91, 92, 91, 90]
  },
  swirl: {
    width: 24,
    height: 21,
    fireRate: 5,
    route: SWIRL_PATH,
    sprites: [93, 94, 95, 96, 95, 94]
  },
  bones: {
    width: 24,
    height: 22,
    fireRate: 25,
    route: BONES_PATH,
    sprites: [101, 101, 102, 102, 103, 103, 104, 104]
  },
  ufo: {
    width: 18,
    height: 8,
    fireRate: 50,
    route: UFO_PATH,
    sprites: [105, 105, 106, 106, 107, 107, 108, 108]
  },
  guard: {
    width: 16,
    height: 12,
    fireRate: 50,
    route: GUARD_PATH,
    sprites: [109, 109, 110, 110, 111, 111, 112, 112]
  }
};

function monsterStateBurningEnter(monster: MonsterEntity): void {
  monster.state = MonsterStateKind.BURNING;
  monster.cooldown = 0;
  monster.ticksInState = 0;
}

function monsterStateDeadEnter(monster: MonsterEntity): void {
  monster.state = MonsterStateKind.DEAD;
  monster.ticksInState = 0;
}

export function createMonster(kind: MonsterKind, x: number, y: number): MonsterEntity {
  const spec = MONSTER_SPECS[kind];

  return {
    kind,
    state: MonsterStateKind.ACTIVE,
    route: [...spec.route],
    routeIdx: 0,
    cooldown: 0,
    ticksInState: 0,
    ticksBeforeShoot: 0,
    fireRate: spec.fireRate,
    onFire: 0,
    spriteIdx: 0,
    sprites: [...spec.sprites],
    tile: {
      x,
      y,
      width: spec.width,
      height: spec.height,
      collisionDx: 0,
      collisionDy: 0,
      collisionDw: 0,
      collisionDh: 0,
      mod: TileMod.MONSTER,
      firstSprite: spec.sprites[0]
    }
  };
}

export function createMonsterFromSpawn(spawn: MonsterSpawn): MonsterEntity {
  return createMonster(spawn.kind, spawn.x, spawn.y);
}

export function tickMonster(monster: MonsterEntity, _daveX: number): void {
  if (monster.state === MonsterStateKind.ACTIVE) {
    monster.ticksInState += 1;
    if (monster.onFire) {
      monsterStateBurningEnter(monster);
      monster.tile.firstSprite = getMonsterSprite(monster);
      return;
    }

    if (monster.cooldown > 4) {
      monster.cooldown = 0;
    }

    if (monster.cooldown === 0) {
      monster.tile.x += monster.route[monster.routeIdx];
      monster.tile.y += monster.route[monster.routeIdx + 1];

      monster.routeIdx += 2;
      if (monster.routeIdx >= monster.route.length) {
        monster.routeIdx = 0;
      }

      monster.spriteIdx += 1;
      if (monster.spriteIdx >= monster.sprites.length) {
        monster.spriteIdx = 0;
      }
    }

    monster.cooldown += 1;
  } else if (monster.state === MonsterStateKind.BURNING) {
    monster.ticksInState += 1;
    if (monster.ticksInState >= 100) {
      monsterStateDeadEnter(monster);
    }
  } else if (monster.state === MonsterStateKind.DEAD) {
    monster.ticksInState += 1;
  }

  monster.tile.firstSprite = getMonsterSprite(monster);
}

export function getMonsterSprite(monster: MonsterEntity): number {
  if (monster.state === MonsterStateKind.ACTIVE) {
    return monster.sprites[monster.spriteIdx] ?? 0;
  }

  if (monster.state === MonsterStateKind.BURNING) {
    if (monster.ticksInState > 100) {
      return 0;
    }
    const phase = Math.floor(monster.ticksInState / 30) % 4;
    if (phase === 0) {
      return 131;
    }
    if (phase === 1) {
      return 132;
    }
    if (phase === 2) {
      return 129;
    }
    return 130;
  }

  return 0;
}

export function isMonsterAlive(monster: MonsterEntity): boolean {
  return monster.state === MonsterStateKind.ACTIVE;
}
