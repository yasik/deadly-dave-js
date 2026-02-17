import type { TileState } from "./types.js";
import { TileMod } from "./types.js";

export enum DaveWalkingState {
  STANDING = 0,
  COOLDOWN1_RIGHT = 1,
  COOLDOWN1_LEFT = 2,
  COOLDOWN2_RIGHT = 3,
  COOLDOWN2_LEFT = 4,
  RIGHT = 5,
  LEFT = 6
}

export enum DaveClimbingState {
  READY = 0,
  COOLDOWN = 1,
  JUMP_RIGHT = 2,
  JUMP_LEFT = 3
}

export enum DaveStateKind {
  STANDING = 0,
  WALKING = 1,
  JUMPING = 2,
  CLIMBING = 3,
  FREEFALLING = 4,
  JETPACKING = 5,
  BURNING = 6,
  DEAD = 7,
  BLINKING = 8
}

export enum DaveDirection {
  FRONT = 0,
  FRONTR = 1,
  FRONTL = 2,
  LEFT = 3,
  RIGHT = 4
}

export interface DaveInput {
  left?: boolean;
  right?: boolean;
  jump?: boolean;
  down?: boolean;
  jetpack?: boolean;
}

interface NormalizedDaveInput {
  left: boolean;
  right: boolean;
  jump: boolean;
  down: boolean;
  jetpack: boolean;
}

export interface DaveEntity {
  tile: TileState;
  state: DaveStateKind;
  faceDirection: DaveDirection;
  hasTrophy: number;
  hasGun: number;
  jetpackBars: number;
  onFire: number;
  onTree: number;
  ticksInState: number;
  mute: number;
  walkState: DaveWalkingState;
  stepCount: number;
  jumpState: number;
  jumpCooldownCount: number;
  climbState: DaveClimbingState;
  defaultX: number;
  defaultY: number;
}

export interface DaveSnapshot {
  x: number;
  y: number;
  state: DaveStateKind;
  faceDirection: DaveDirection;
  walkState: DaveWalkingState;
  climbState: DaveClimbingState;
  jumpState: number;
  jumpCooldownCount: number;
  stepCount: number;
  jetpackBars: number;
  onFire: number;
  onTree: number;
  ticksInState: number;
}

// Sprite indexes used by dave_get_sprite in C.
const SPRITE_IDX_DAVE_RIGHT_HANDSFREE = 53;
const SPRITE_IDX_DAVE_RIGHT_STAND = 54;
const SPRITE_IDX_DAVE_RIGHT_SERIOUS = 55;
const SPRITE_IDX_DAVE_FRONT = 56;
const SPRITE_IDX_DAVE_LEFT_HANDSFREE = 57;
const SPRITE_IDX_DAVE_LEFT_STAND = 58;
const SPRITE_IDX_DAVE_LEFT_SERIOUS = 59;
const SPRITE_IDX_DAVE_JUMP_RIGHT = 67;
const SPRITE_IDX_DAVE_JUMP_LEFT = 68;
const SPRITE_IDX_DAVE_CLIMB_HANDS_UP = 71;
const SPRITE_IDX_DAVE_CLIMB_HAND_RIGHT = 72;
const SPRITE_IDX_DAVE_CLIMB_HAND_LEFT = 73;
const SPRITE_IDX_DAVE_JETPACK_RIGHT1 = 77;
const SPRITE_IDX_DAVE_JETPACK_RIGHT2 = 78;
const SPRITE_IDX_DAVE_JETPACK_RIGHT3 = 79;
const SPRITE_IDX_DAVE_JETPACK_LEFT1 = 80;
const SPRITE_IDX_DAVE_JETPACK_LEFT2 = 81;
const SPRITE_IDX_DAVE_JETPACK_LEFT3 = 82;
const SPRITE_IDX_EXPLOSION1 = 129;
const SPRITE_IDX_EXPLOSION2 = 130;
const SPRITE_IDX_EXPLOSION3 = 131;
const SPRITE_IDX_EXPLOSION4 = 132;

const JUMP_VELOCITY_TABLE: number[] = [
  -1, 0, -2, 0, -3, 0, -2, 0, -2, 0,
  -2, 0, -2, 0, -2, 0, -2, 0, -2, 0,
  -2, 0, -1, 0, -2, 0, -1, 0, -1, 0,
  -1, 0, -1, 0, -1, 0, -1, 0, -1, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0,
  0, 0, 1, 0, 1, 0, 1, 0, 1, 0,
  1, 0, 1, 0, 1, 0, 2, 0, 2, 0,
  2, 0, 2, 0, 2, 0, 2, 0, 2, 0,
  2, 0, 2, 0, 2, 0, 3, 0, 2, 0
];

function normalizeInput(input: DaveInput): NormalizedDaveInput {
  return {
    left: input.left === true,
    right: input.right === true,
    jump: input.jump === true,
    down: input.down === true,
    jetpack: input.jetpack === true
  };
}

function tileContainsPoint(tile: TileState, x: number, y: number): boolean {
  return x >= tile.x && y >= tile.y && x < tile.x + tile.width && y < tile.y + tile.height;
}

function daveCollisionRight(dave: DaveEntity, map: TileState[]): boolean {
  for (const tile of map) {
    if (tile.firstSprite !== 0 && tile.mod === TileMod.BRICK) {
      if (tileContainsPoint(tile, dave.tile.x + 12, dave.tile.y + 2)) {
        return true;
      }
      if (tileContainsPoint(tile, dave.tile.x + 12, dave.tile.y + 15)) {
        return true;
      }
    }
  }
  return false;
}

function daveCollisionTop(dave: DaveEntity, map: TileState[]): boolean {
  for (const tile of map) {
    if (tile.firstSprite !== 0 && tile.mod === TileMod.BRICK) {
      if (tileContainsPoint(tile, dave.tile.x + 4, dave.tile.y + 1)) {
        return true;
      }
      if (tileContainsPoint(tile, dave.tile.x + 9, dave.tile.y + 1)) {
        return true;
      }
    }
  }
  return false;
}

function daveCollisionLeft(dave: DaveEntity, map: TileState[]): boolean {
  for (const tile of map) {
    if (tile.firstSprite !== 0 && tile.mod === TileMod.BRICK) {
      if (tileContainsPoint(tile, dave.tile.x + 1, dave.tile.y + 2)) {
        return true;
      }
      if (tileContainsPoint(tile, dave.tile.x + 1, dave.tile.y + 15)) {
        return true;
      }
    }
  }
  return false;
}

function daveOnGround(dave: DaveEntity, map: TileState[]): boolean {
  for (const tile of map) {
    if (tile.firstSprite !== 0 && tile.mod === TileMod.BRICK) {
      if (tileContainsPoint(tile, dave.tile.x + 9, dave.tile.y + 16)) {
        return true;
      }
      if (tileContainsPoint(tile, dave.tile.x + 8, dave.tile.y + 16)) {
        return true;
      }
      if (tileContainsPoint(tile, dave.tile.x + 7, dave.tile.y + 16)) {
        return true;
      }
      if (tileContainsPoint(tile, dave.tile.x + 6, dave.tile.y + 16)) {
        return true;
      }
      if (tileContainsPoint(tile, dave.tile.x + 5, dave.tile.y + 16)) {
        return true;
      }
      if (tileContainsPoint(tile, dave.tile.x + 4, dave.tile.y + 16)) {
        return true;
      }
    }
  }
  return false;
}

function daveStateBurningEnter(dave: DaveEntity): void {
  dave.state = DaveStateKind.BURNING;
  dave.ticksInState = 0;
}

function daveStateStandingEnter(dave: DaveEntity): void {
  dave.state = DaveStateKind.STANDING;
  dave.ticksInState = 0;
}

function daveStateJumpingEnter(dave: DaveEntity): void {
  if (dave.faceDirection === DaveDirection.FRONTL || dave.faceDirection === DaveDirection.LEFT) {
    dave.faceDirection = DaveDirection.FRONTL;
  } else {
    dave.faceDirection = DaveDirection.FRONTR;
  }

  dave.state = DaveStateKind.JUMPING;
  dave.walkState = DaveWalkingState.STANDING;
  dave.jumpState = 0;
  dave.ticksInState = 0;
}

function daveStateWalkingEnter(dave: DaveEntity, map: TileState[], keys: NormalizedDaveInput): void {
  dave.state = DaveStateKind.WALKING;

  if (keys.left) {
    if (daveCollisionLeft(dave, map)) {
      daveStateStandingEnter(dave);
      return;
    }

    dave.tile.x -= 1;
    dave.faceDirection = DaveDirection.LEFT;
    dave.walkState = DaveWalkingState.COOLDOWN2_LEFT;
    dave.stepCount += 1;
    if (!daveCollisionLeft(dave, map)) {
      dave.tile.x -= 1;
    }
    return;
  }

  if (keys.right) {
    if (daveCollisionRight(dave, map)) {
      daveStateStandingEnter(dave);
      return;
    }

    dave.tile.x += 1;
    dave.faceDirection = DaveDirection.RIGHT;
    dave.walkState = DaveWalkingState.COOLDOWN2_RIGHT;
    dave.stepCount += 1;
    if (!daveCollisionRight(dave, map)) {
      dave.tile.x += 1;
    }
    return;
  }

  daveStateStandingEnter(dave);
}

function daveStateJetpackingEnter(dave: DaveEntity): void {
  dave.state = DaveStateKind.JETPACKING;
  dave.ticksInState = 0;
}

function daveStateClimbingEnter(dave: DaveEntity, keys: NormalizedDaveInput): void {
  dave.state = DaveStateKind.CLIMBING;
  if (keys.jump && keys.right) {
    dave.climbState = DaveClimbingState.JUMP_RIGHT;
  } else if (keys.jump && keys.left) {
    dave.climbState = DaveClimbingState.JUMP_LEFT;
  } else {
    dave.climbState = DaveClimbingState.READY;
  }
  dave.ticksInState = 0;
}

function daveStateFreefallingEnter(dave: DaveEntity): void {
  dave.state = DaveStateKind.FREEFALLING;

  if (dave.faceDirection === DaveDirection.RIGHT || dave.faceDirection === DaveDirection.FRONTR) {
    dave.faceDirection = DaveDirection.FRONTR;
  } else if (
    dave.faceDirection === DaveDirection.LEFT ||
    dave.faceDirection === DaveDirection.FRONTL
  ) {
    dave.faceDirection = DaveDirection.FRONTL;
  }
}

function daveStateDeadEnter(dave: DaveEntity): void {
  dave.state = DaveStateKind.DEAD;
}

function daveStateDeadRoutine(dave: DaveEntity): void {
  dave.ticksInState += 1;
}

function daveStateBurningRoutine(dave: DaveEntity): void {
  dave.ticksInState += 1;
  if (dave.ticksInState >= 200) {
    daveStateDeadEnter(dave);
  }
}

function daveStateWalkingRoutine(dave: DaveEntity, map: TileState[], keys: NormalizedDaveInput): void {
  if (dave.jumpCooldownCount > 0) {
    dave.jumpCooldownCount -= 1;
  }

  if (dave.onFire) {
    daveStateBurningEnter(dave);
    return;
  }

  if (keys.jetpack && dave.jetpackBars > 0) {
    daveStateJetpackingEnter(dave);
    return;
  }

  if (!daveOnGround(dave, map)) {
    daveStateFreefallingEnter(dave);
    return;
  }

  if (keys.jump) {
    if (dave.jumpCooldownCount <= 0) {
      daveStateJumpingEnter(dave);
      return;
    }
  }

  if (dave.walkState === DaveWalkingState.COOLDOWN2_RIGHT) {
    dave.walkState = DaveWalkingState.COOLDOWN1_RIGHT;
  } else if (dave.walkState === DaveWalkingState.COOLDOWN2_LEFT) {
    dave.walkState = DaveWalkingState.COOLDOWN1_LEFT;
  } else if (dave.walkState === DaveWalkingState.COOLDOWN1_RIGHT) {
    dave.walkState = DaveWalkingState.STANDING;
    daveStateStandingEnter(dave);
  } else if (dave.walkState === DaveWalkingState.COOLDOWN1_LEFT) {
    dave.walkState = DaveWalkingState.STANDING;
    daveStateStandingEnter(dave);
  }
}

function daveStateJumpingRoutine(dave: DaveEntity, map: TileState[], keys: NormalizedDaveInput): void {
  if (dave.onFire) {
    daveStateBurningEnter(dave);
    return;
  }

  if (keys.jetpack && dave.jetpackBars > 0) {
    daveStateJetpackingEnter(dave);
    return;
  }

  if (dave.jumpState >= 40 && daveOnGround(dave, map)) {
    daveStateStandingEnter(dave);
    dave.jumpCooldownCount = 5;
    dave.stepCount = 0;
    return;
  }

  if (dave.onTree) {
    if (!keys.jump && (keys.right || keys.left)) {
      daveStateClimbingEnter(dave, keys);
    }

    if (keys.jump && (keys.right || keys.left) && dave.jumpState >= 3 && dave.jumpState <= 76) {
      dave.jumpCooldownCount = 1;
      daveStateClimbingEnter(dave, keys);
      dave.jumpState = 0;
      return;
    }
  }

  if (dave.jumpState === 94) {
    dave.tile.y += 2;

    if (daveOnGround(dave, map)) {
      daveStateWalkingEnter(dave, map, keys);
      dave.jumpCooldownCount = 5;
      dave.stepCount = 0;
    } else {
      dave.tile.y -= 2;
      daveStateFreefallingEnter(dave);
    }

    return;
  }

  let deltaY = JUMP_VELOCITY_TABLE[dave.jumpState];
  dave.jumpState += 1;

  while (deltaY > 0) {
    dave.tile.y += 1;
    deltaY -= 1;

    if (daveOnGround(dave, map)) {
      deltaY = 0;
    }
  }

  while (deltaY < 0) {
    dave.tile.y -= 1;
    deltaY += 1;

    let isCollisionTop = false;
    if (daveCollisionTop(dave, map)) {
      if (keys.left) {
        dave.tile.x -= 2;
      } else if (keys.right) {
        dave.tile.x += 2;
      }

      isCollisionTop = daveCollisionTop(dave, map);

      if (keys.left) {
        dave.tile.x += 2;
      } else if (keys.right) {
        dave.tile.x -= 2;
      }
    }

    if (isCollisionTop) {
      dave.walkState = DaveWalkingState.STANDING;
      dave.jumpState = 94;
      return;
    }
  }

  if (dave.jumpState > 94) {
    throw new Error("jump_state overflow");
  }

  if (dave.walkState === DaveWalkingState.STANDING) {
    if (keys.left) {
      dave.faceDirection = DaveDirection.LEFT;

      if (!daveCollisionLeft(dave, map)) {
        dave.tile.x -= 1;
        if (!daveCollisionLeft(dave, map)) {
          dave.tile.x -= 1;
        }
      }
      dave.walkState = DaveWalkingState.COOLDOWN2_LEFT;
    } else if (keys.right) {
      dave.faceDirection = DaveDirection.RIGHT;

      if (!daveCollisionRight(dave, map)) {
        dave.tile.x += 1;
        if (!daveCollisionRight(dave, map)) {
          dave.tile.x += 1;
        }
      }
      dave.walkState = DaveWalkingState.COOLDOWN2_RIGHT;
    }

    return;
  }

  if (
    dave.walkState === DaveWalkingState.COOLDOWN1_LEFT ||
    dave.walkState === DaveWalkingState.COOLDOWN2_LEFT ||
    dave.walkState === DaveWalkingState.COOLDOWN1_RIGHT ||
    dave.walkState === DaveWalkingState.COOLDOWN2_RIGHT
  ) {
    dave.walkState = DaveWalkingState.STANDING;
  }
}

function daveStateFreefallingRoutine(
  dave: DaveEntity,
  map: TileState[],
  keys: NormalizedDaveInput
): void {
  if (dave.onFire) {
    daveStateBurningEnter(dave);
    return;
  }

  if (keys.jetpack && dave.jetpackBars > 0) {
    daveStateJetpackingEnter(dave);
    return;
  }

  if (daveOnGround(dave, map)) {
    daveStateStandingEnter(dave);
    dave.jumpCooldownCount = 5;
    dave.stepCount = 0;
    return;
  }

  dave.tile.y += 1;
  if (keys.left) {
    dave.faceDirection = DaveDirection.LEFT;
  } else if (keys.right) {
    dave.faceDirection = DaveDirection.RIGHT;
  }

  if (dave.faceDirection === DaveDirection.LEFT) {
    if (!daveCollisionLeft(dave, map)) {
      dave.tile.x -= 1;
    }
  } else if (dave.faceDirection === DaveDirection.RIGHT) {
    if (!daveCollisionRight(dave, map)) {
      dave.tile.x += 1;
    }
  }
}

function daveStateClimbingRoutine(dave: DaveEntity, map: TileState[], keys: NormalizedDaveInput): void {
  if (!dave.onTree) {
    if (keys.jump) {
      daveStateJumpingEnter(dave);
      return;
    }
    daveStateFreefallingEnter(dave);
    return;
  }

  if (dave.onFire) {
    daveStateBurningEnter(dave);
    return;
  }

  if (keys.jump && !keys.left && !keys.right && !keys.down) {
    if (dave.climbState === DaveClimbingState.READY) {
      dave.tile.y -= 2;
      dave.stepCount += 1;
      dave.climbState = DaveClimbingState.COOLDOWN;
    } else {
      dave.climbState = DaveClimbingState.READY;
    }
  } else if (keys.down && !keys.left && !keys.right && !keys.jump) {
    if (dave.climbState === DaveClimbingState.READY) {
      dave.tile.y += 1;
      if (!daveOnGround(dave, map)) {
        dave.tile.y += 1;
      }
      dave.stepCount += 1;
      dave.climbState = DaveClimbingState.COOLDOWN;
    } else {
      dave.climbState = DaveClimbingState.READY;
    }

    if (daveOnGround(dave, map)) {
      daveStateStandingEnter(dave);
      return;
    }
  } else if (keys.left && !keys.jump && !keys.right) {
    if (dave.climbState === DaveClimbingState.READY) {
      dave.tile.x -= 2;
      dave.stepCount += 1;
      dave.climbState = DaveClimbingState.COOLDOWN;
    } else {
      dave.climbState = DaveClimbingState.READY;
    }
  } else if (keys.right && !keys.jump && !keys.left) {
    if (dave.climbState === DaveClimbingState.READY) {
      dave.tile.x += 2;
      dave.stepCount += 1;
      dave.climbState = DaveClimbingState.COOLDOWN;
    } else {
      dave.climbState = DaveClimbingState.READY;
    }
  } else if ((keys.right || keys.left) && keys.jump) {
    if (dave.jumpCooldownCount <= 0) {
      dave.tile.y -= 1;
      daveStateJumpingEnter(dave);
      return;
    }

    dave.jumpCooldownCount -= 1;
  }

  dave.ticksInState += 1;
}

function daveStateStandingRoutine(dave: DaveEntity, map: TileState[], keys: NormalizedDaveInput): void {
  if (dave.onFire) {
    daveStateBurningEnter(dave);
    return;
  }

  if (keys.jetpack && dave.jetpackBars > 0) {
    daveStateJetpackingEnter(dave);
    return;
  }

  if (!daveOnGround(dave, map)) {
    daveStateFreefallingEnter(dave);
    return;
  }

  if (dave.jumpCooldownCount > 0) {
    dave.jumpCooldownCount -= 1;
  }

  if (keys.jump) {
    if (dave.onTree) {
      daveStateClimbingEnter(dave, keys);
      return;
    }

    if (dave.jumpCooldownCount <= 0) {
      daveStateJumpingEnter(dave);
      return;
    }
  }

  if (keys.left || keys.right) {
    daveStateWalkingEnter(dave, map, keys);
  }
}

function daveStateJetpackingRoutine(
  dave: DaveEntity,
  map: TileState[],
  keys: NormalizedDaveInput
): void {
  if (keys.jetpack) {
    daveStateStandingEnter(dave);
    return;
  }

  if (dave.onFire) {
    daveStateBurningEnter(dave);
    return;
  }

  if (keys.left) {
    if (!daveCollisionLeft(dave, map)) {
      dave.tile.x -= 1;
      dave.faceDirection = DaveDirection.LEFT;
    }
  } else if (keys.right) {
    if (!daveCollisionRight(dave, map)) {
      dave.tile.x += 1;
      dave.faceDirection = DaveDirection.RIGHT;
    }
  } else if (keys.jump) {
    if (!daveCollisionTop(dave, map)) {
      dave.tile.y -= 1;
    }
  } else if (keys.down) {
    if (!daveOnGround(dave, map)) {
      dave.tile.y += 1;
    }
  }

  dave.ticksInState += 1;
  dave.jetpackBars -= 1;
  if (dave.jetpackBars <= 0) {
    dave.jetpackBars = 0;
    daveStateStandingEnter(dave);
  }
}

export function createDave(x: number, y: number): DaveEntity {
  return {
    state: DaveStateKind.STANDING,
    faceDirection: DaveDirection.FRONTR,
    hasTrophy: 0,
    hasGun: 0,
    jetpackBars: 0,
    onFire: 0,
    onTree: 0,
    ticksInState: 0,
    mute: 0,
    walkState: DaveWalkingState.STANDING,
    stepCount: 0,
    jumpState: 0,
    jumpCooldownCount: 0,
    climbState: DaveClimbingState.READY,
    defaultX: x,
    defaultY: y,
    tile: {
      x,
      y,
      width: 20,
      height: 16,
      collisionDx: 2,
      collisionDy: 2,
      collisionDw: -6,
      collisionDh: 0,
      mod: TileMod.DAVE,
      firstSprite: 0
    }
  };
}

export function tickDave(dave: DaveEntity, map: TileState[], input: DaveInput = {}): void {
  const keys = normalizeInput(input);

  if (dave.state === DaveStateKind.STANDING) {
    daveStateStandingRoutine(dave, map, keys);
  } else if (dave.state === DaveStateKind.WALKING) {
    daveStateWalkingRoutine(dave, map, keys);
  } else if (dave.state === DaveStateKind.JUMPING) {
    daveStateJumpingRoutine(dave, map, keys);
  } else if (dave.state === DaveStateKind.CLIMBING) {
    daveStateClimbingRoutine(dave, map, keys);
  } else if (dave.state === DaveStateKind.FREEFALLING) {
    daveStateFreefallingRoutine(dave, map, keys);
  } else if (dave.state === DaveStateKind.BURNING) {
    daveStateBurningRoutine(dave);
  } else if (dave.state === DaveStateKind.JETPACKING) {
    daveStateJetpackingRoutine(dave, map, keys);
  } else if (dave.state === DaveStateKind.DEAD) {
    daveStateDeadRoutine(dave);
  }

  // Port of dave_tick clear-collision behavior.
  dave.onTree = 0;
}

export function isDaveDead(dave: DaveEntity): boolean {
  return dave.state === DaveStateKind.DEAD;
}

export function resetDaveAfterDeath(dave: DaveEntity): void {
  dave.tile.x = dave.defaultX;
  dave.tile.y = dave.defaultY;
  dave.state = DaveStateKind.STANDING;
  dave.walkState = DaveWalkingState.STANDING;
  dave.climbState = DaveClimbingState.READY;
  dave.jumpState = 0;
  dave.jumpCooldownCount = 0;
  dave.stepCount = 0;
  dave.onFire = 0;
  dave.onTree = 0;
  dave.ticksInState = 0;
}

export function getDaveSprite(dave: DaveEntity): number {
  const walkMod = dave.stepCount % 8;

  if (dave.state === DaveStateKind.FREEFALLING) {
    if (dave.faceDirection === DaveDirection.LEFT) {
      return SPRITE_IDX_DAVE_LEFT_HANDSFREE;
    }
    if (dave.faceDirection === DaveDirection.RIGHT) {
      return SPRITE_IDX_DAVE_RIGHT_HANDSFREE;
    }
    if (dave.faceDirection === DaveDirection.FRONTR) {
      return SPRITE_IDX_DAVE_JUMP_RIGHT;
    }
    if (dave.faceDirection === DaveDirection.FRONTL) {
      return SPRITE_IDX_DAVE_JUMP_LEFT;
    }
    return SPRITE_IDX_DAVE_FRONT;
  }

  if (dave.state === DaveStateKind.JUMPING) {
    if (dave.faceDirection === DaveDirection.LEFT || dave.faceDirection === DaveDirection.FRONTL) {
      return SPRITE_IDX_DAVE_JUMP_LEFT;
    }
    return SPRITE_IDX_DAVE_JUMP_RIGHT;
  }

  if (dave.state === DaveStateKind.WALKING || dave.state === DaveStateKind.STANDING) {
    if (dave.faceDirection === DaveDirection.RIGHT) {
      if (walkMod === 0 || walkMod === 1 || walkMod === 4 || walkMod === 5) {
        return SPRITE_IDX_DAVE_RIGHT_STAND;
      }
      if (walkMod === 2 || walkMod === 3) {
        return SPRITE_IDX_DAVE_RIGHT_HANDSFREE;
      }
      if (walkMod === 6 || walkMod === 7) {
        return SPRITE_IDX_DAVE_RIGHT_SERIOUS;
      }
      return 0;
    }

    if (dave.faceDirection === DaveDirection.LEFT) {
      if (walkMod === 0 || walkMod === 1 || walkMod === 4 || walkMod === 5) {
        return SPRITE_IDX_DAVE_LEFT_STAND;
      }
      if (walkMod === 2 || walkMod === 3) {
        return SPRITE_IDX_DAVE_LEFT_HANDSFREE;
      }
      if (walkMod === 6 || walkMod === 7) {
        return SPRITE_IDX_DAVE_LEFT_SERIOUS;
      }
      return 0;
    }

    return SPRITE_IDX_DAVE_FRONT;
  }

  if (dave.state === DaveStateKind.BURNING) {
    if (dave.ticksInState > 100) {
      return 0;
    }
    if (Math.floor(dave.ticksInState / 30) % 4 === 0) {
      return SPRITE_IDX_EXPLOSION1;
    }
    if (Math.floor(dave.ticksInState / 30) % 4 === 1) {
      return SPRITE_IDX_EXPLOSION2;
    }
    if (Math.floor(dave.ticksInState / 30) % 4 === 2) {
      return SPRITE_IDX_EXPLOSION3;
    }
    return SPRITE_IDX_EXPLOSION4;
  }

  if (dave.state === DaveStateKind.JETPACKING) {
    if (dave.faceDirection === DaveDirection.LEFT) {
      if (dave.ticksInState % 3 === 0) {
        return SPRITE_IDX_DAVE_JETPACK_LEFT1;
      }
      if (dave.ticksInState % 3 === 1) {
        return SPRITE_IDX_DAVE_JETPACK_LEFT2;
      }
      if (dave.ticksInState % 3 === 2) {
        return SPRITE_IDX_DAVE_JETPACK_LEFT3;
      }
      return 0;
    }

    if (dave.ticksInState % 3 === 0) {
      return SPRITE_IDX_DAVE_JETPACK_RIGHT1;
    }
    if (dave.ticksInState % 3 === 1) {
      return SPRITE_IDX_DAVE_JETPACK_RIGHT2;
    }
    if (dave.ticksInState % 3 === 2) {
      return SPRITE_IDX_DAVE_JETPACK_RIGHT3;
    }
    return 0;
  }

  if (dave.state === DaveStateKind.CLIMBING) {
    if (
      dave.climbState === DaveClimbingState.READY ||
      dave.climbState === DaveClimbingState.COOLDOWN
    ) {
      const climbMod = dave.stepCount % 8;
      if (climbMod === 0 || climbMod === 1) {
        return SPRITE_IDX_DAVE_CLIMB_HANDS_UP;
      }
      if (climbMod === 2 || climbMod === 3 || climbMod === 6 || climbMod === 7) {
        return SPRITE_IDX_DAVE_CLIMB_HAND_RIGHT;
      }
      if (climbMod === 4 || climbMod === 5) {
        return SPRITE_IDX_DAVE_CLIMB_HAND_LEFT;
      }
      return SPRITE_IDX_DAVE_FRONT;
    }

    if (dave.climbState === DaveClimbingState.JUMP_RIGHT) {
      return SPRITE_IDX_DAVE_JUMP_RIGHT;
    }
    if (dave.climbState === DaveClimbingState.JUMP_LEFT) {
      return SPRITE_IDX_DAVE_JUMP_LEFT;
    }
    return SPRITE_IDX_DAVE_FRONT;
  }

  return SPRITE_IDX_DAVE_FRONT;
}

export function snapshotDave(dave: DaveEntity): DaveSnapshot {
  return {
    x: dave.tile.x,
    y: dave.tile.y,
    state: dave.state,
    faceDirection: dave.faceDirection,
    walkState: dave.walkState,
    climbState: dave.climbState,
    jumpState: dave.jumpState,
    jumpCooldownCount: dave.jumpCooldownCount,
    stepCount: dave.stepCount,
    jetpackBars: dave.jetpackBars,
    onFire: dave.onFire,
    onTree: dave.onTree,
    ticksInState: dave.ticksInState
  };
}
