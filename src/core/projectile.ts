import type { DaveEntity } from "./dave.js";
import { DaveDirection } from "./dave.js";
import type { ProjectileKind, ProjectileState, TileState } from "./types.js";
import {
  PROJECTILE_STATE_DEAD,
  PROJECTILE_STATE_FLYING_LEFT,
  PROJECTILE_STATE_FLYING_RIGHT,
  TileMod
} from "./types.js";

function tileContainsPoint(tile: TileState, x: number, y: number): boolean {
  return (
    x >= tile.x &&
    y >= tile.y &&
    x < tile.x + tile.width &&
    y < tile.y + tile.height
  );
}

function collidesWithBrick(tiles: TileState[], probeX: number, probeY: number): boolean {
  for (const tile of tiles) {
    if (tile.firstSprite !== 0 && tile.mod === TileMod.BRICK) {
      if (tileContainsPoint(tile, probeX, probeY)) {
        return true;
      }
    }
  }
  return false;
}

function rightProbeOffset(kind: ProjectileKind): number {
  return kind === "plasma" ? 20 : 10;
}

function leftProbeOffset(): number {
  return -2;
}

function normalizeState(speedX: number): typeof PROJECTILE_STATE_FLYING_RIGHT | typeof PROJECTILE_STATE_FLYING_LEFT {
  return speedX < 0 ? PROJECTILE_STATE_FLYING_LEFT : PROJECTILE_STATE_FLYING_RIGHT;
}

export function createBulletLeft(x: number, y: number): ProjectileState {
  return {
    kind: "bullet",
    x,
    y,
    speedX: -2,
    state: PROJECTILE_STATE_FLYING_LEFT
  };
}

export function createBulletRight(x: number, y: number): ProjectileState {
  return {
    kind: "bullet",
    x,
    y,
    speedX: 2,
    state: PROJECTILE_STATE_FLYING_RIGHT
  };
}

export function createPlasmaLeft(x: number, y: number): ProjectileState {
  return {
    kind: "plasma",
    x,
    y,
    speedX: -2,
    state: PROJECTILE_STATE_FLYING_LEFT
  };
}

export function createPlasmaRight(x: number, y: number): ProjectileState {
  return {
    kind: "plasma",
    x,
    y,
    speedX: 2,
    state: PROJECTILE_STATE_FLYING_RIGHT
  };
}

export function isProjectileDead(projectile: ProjectileState): boolean {
  return projectile.state === PROJECTILE_STATE_DEAD;
}

export function spawnDaveBullet(dave: Pick<DaveEntity, "hasGun" | "faceDirection" | "tile">): ProjectileState | null {
  if (dave.hasGun !== 1) {
    return null;
  }

  if (dave.faceDirection === DaveDirection.LEFT || dave.faceDirection === DaveDirection.FRONTL) {
    return createBulletLeft(dave.tile.x - 8, dave.tile.y + 8);
  }

  if (dave.faceDirection === DaveDirection.RIGHT || dave.faceDirection === DaveDirection.FRONTR) {
    return createBulletRight(dave.tile.x + 8, dave.tile.y + 8);
  }

  return null;
}

/*
 * Shared port of bullet_tick() and plasma_tick().
 */
export function tickProjectile(
  projectile: ProjectileState,
  map: TileState[],
  deadzoneLeft: number,
  deadzoneRight: number
): ProjectileState {
  if (projectile.state === PROJECTILE_STATE_DEAD) {
    return projectile;
  }

  const next: ProjectileState = {
    ...projectile,
    x: projectile.x + projectile.speedX,
    state: normalizeState(projectile.speedX)
  };

  if (next.x >= deadzoneRight || next.x <= deadzoneLeft) {
    next.state = PROJECTILE_STATE_DEAD;
    return next;
  }

  const rightProbeX = next.x + rightProbeOffset(next.kind);
  const leftProbeX = next.x + leftProbeOffset();
  const probeY = next.y + 1;

  if (
    collidesWithBrick(map, rightProbeX, probeY) ||
    collidesWithBrick(map, leftProbeX, probeY)
  ) {
    next.state = PROJECTILE_STATE_DEAD;
  }

  return next;
}
