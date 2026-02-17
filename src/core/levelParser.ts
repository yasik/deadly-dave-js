import { TILE_SIZE } from "./constants.js";
import type {
  LevelParseResult,
  MonsterKind,
  MonsterSpawn,
  SpawnPoint
} from "./types.js";

export class LevelParseError extends Error {
  readonly code: -1 | -2 | -3;

  constructor(code: -1 | -2 | -3, message: string) {
    super(message);
    this.code = code;
  }
}

function parseDaveSpawn(tag: string, col: number, row: number): SpawnPoint | undefined {
  if (tag === " D " || tag === "D+M") {
    return {
      x: col * TILE_SIZE,
      y: row * TILE_SIZE
    };
  }

  return undefined;
}

function createMonsterSpawn(
  kind: MonsterKind,
  col: number,
  row: number,
  xOffset: number,
  yOffset: number,
  yScale: number
): MonsterSpawn {
  return {
    kind,
    x: col * TILE_SIZE + xOffset,
    y: row * yScale + yOffset
  };
}

function parseMonsterSpawn(tag: string, col: number, row: number): MonsterSpawn | undefined {
  if (tag === "SU1") {
    return createMonsterSpawn("sun", col, row, 0, 0, 20);
  }
  if (tag === "SU2") {
    return createMonsterSpawn("sun", col, row, -8, -16, 20);
  }
  if (tag === "SP1") {
    return createMonsterSpawn("spider", col, row, 0, -12, 20);
  }
  if (tag === "SW1") {
    return createMonsterSpawn("swirl", col, row, 3, -14, 20);
  }
  if (tag === "BZ1") {
    return createMonsterSpawn("bones", col, row, 0, -2, TILE_SIZE);
  }
  if (tag === "UF1") {
    return createMonsterSpawn("ufo", col, row, 0, 0, TILE_SIZE);
  }
  if (tag === "GD1") {
    return createMonsterSpawn("guard", col, row, 0, 0, TILE_SIZE);
  }

  return undefined;
}

function commitTag(
  result: LevelParseResult,
  tag: string,
  col: number,
  row: number
): void {
  const x = col * TILE_SIZE;
  const y = row * TILE_SIZE;

  result.cells.push({
    tag,
    col,
    row,
    x,
    y
  });

  const daveSpawn = parseDaveSpawn(tag, col, row);
  if (daveSpawn) {
    result.daveSpawn = daveSpawn;
  }

  const monsterSpawn = parseMonsterSpawn(tag, col, row);
  if (monsterSpawn) {
    result.monsterSpawns.push(monsterSpawn);
  }
}

/*
 * Port of game_level_load() parser behavior.
 */
export function parseLevelMap(source: string): LevelParseResult {
  const result: LevelParseResult = {
    cells: [],
    monsterSpawns: []
  };

  let pos = 0;
  let curCol = 0;
  let collectedCount = 0;
  let inComment = false;
  let tag = ["", "", ""];

  for (let i = 0; i < source.length; i += 1) {
    const ch = source[i];

    if (inComment) {
      if (ch === "\n" || ch === "\r") {
        inComment = false;
      }
      continue;
    }

    if (ch === "#") {
      inComment = true;
      continue;
    }

    if (ch === "," || ch === ";") {
      if (collectedCount !== 3) {
        const errorCode = ch === "," ? -1 : -2;
        throw new LevelParseError(
          errorCode,
          `Malformed level tag before '${ch}' at source index ${i}`
        );
      }

      commitTag(result, tag.join(""), curCol, pos);
      tag = ["", "", ""];
      collectedCount = 0;

      if (ch === ",") {
        pos += 1;
      } else {
        curCol += 1;
        pos = 0;
      }

      continue;
    }

    if (ch === "\n" || ch === "\r") {
      continue;
    }

    if (collectedCount >= 3) {
      throw new LevelParseError(
        -3,
        `Tag exceeded 3 characters before delimiter at source index ${i}`
      );
    }

    tag[collectedCount] = ch;
    collectedCount += 1;
  }

  return result;
}

