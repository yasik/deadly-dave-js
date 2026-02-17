export enum TileMod {
  EMPTY = 0,
  CLEAR = 1,
  BRICK = 2,
  LOOT = 3,
  TROPHY = 4,
  MOSS = 5,
  CLIMB = 6,
  FIRE = 7,
  DOOR = 8,
  DAVE = 9,
  GUN = 10,
  JETPACK = 11,
  MONSTER = 12
}

export interface TileState {
  x: number;
  y: number;
  width: number;
  height: number;
  collisionDx: number;
  collisionDy: number;
  collisionDw: number;
  collisionDh: number;
  mod: TileMod;
  firstSprite: number;
  scoreValue?: number;
}

export interface ScrollState {
  scrollOffset: number;
  scrollRemaining: number;
}

export type MonsterKind =
  | "sun"
  | "spider"
  | "swirl"
  | "bones"
  | "ufo"
  | "guard";

export interface SpawnPoint {
  x: number;
  y: number;
}

export interface MonsterSpawn extends SpawnPoint {
  kind: MonsterKind;
}

export interface ParsedCell {
  tag: string;
  col: number;
  row: number;
  x: number;
  y: number;
}

export interface LevelParseResult {
  cells: ParsedCell[];
  daveSpawn?: SpawnPoint;
  monsterSpawns: MonsterSpawn[];
}

export const PROJECTILE_STATE_FLYING_RIGHT = 1;
export const PROJECTILE_STATE_FLYING_LEFT = 2;
export const PROJECTILE_STATE_DEAD = 3;

export type ProjectileKind = "bullet" | "plasma";
export type ProjectileStateCode =
  | typeof PROJECTILE_STATE_FLYING_RIGHT
  | typeof PROJECTILE_STATE_FLYING_LEFT
  | typeof PROJECTILE_STATE_DEAD;

export interface ProjectileState {
  kind: ProjectileKind;
  x: number;
  y: number;
  speedX: number;
  state: ProjectileStateCode;
}

