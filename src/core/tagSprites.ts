import type { MonsterKind, ParsedCell } from "./types.js";

export const SPRITE_DAVE_FRONT = 56;

export function monsterKindToSprite(kind: MonsterKind): number {
  if (kind === "sun") {
    return 97;
  }
  if (kind === "spider") {
    return 89;
  }
  if (kind === "swirl") {
    return 93;
  }
  if (kind === "bones") {
    return 101;
  }
  if (kind === "ufo") {
    return 105;
  }
  return 109;
}

function repeat(sprite: number, count: number): number[] {
  return Array.from({ length: count }, () => sprite);
}

function rotate(frames: number[], start: number): number[] {
  if (frames.length === 0) {
    return frames;
  }
  const offset = ((start % frames.length) + frames.length) % frames.length;
  return [...frames.slice(offset), ...frames.slice(0, offset)];
}

const FIRE_ANIM = [...repeat(6, 10), ...repeat(7, 10), ...repeat(8, 10), ...repeat(9, 10)];
const VINES_ANIM = [...repeat(25, 10), ...repeat(26, 10), ...repeat(27, 10), ...repeat(28, 10)];
const WATER_ANIM = [
  ...repeat(36, 10),
  ...repeat(37, 10),
  ...repeat(38, 10),
  ...repeat(39, 10),
  ...repeat(40, 10)
];
const GRAIL_ANIM = [
  ...repeat(13, 10),
  ...repeat(14, 10),
  ...repeat(10, 10),
  ...repeat(11, 10),
  ...repeat(12, 10)
];

/*
 * Port-oriented mapping from level tags to tile sprite animation frames.
 * Empty/unknown tags return null.
 */
export function tagToSpriteFrames(tag: string): number[] | null {
  if (tag.trim().length === 0) {
    return null;
  }

  if (tag === "RBK") return [17];
  if (tag === "BBK") return [5];
  if (tag === "PPK") return [30];
  if (tag === "PPF") return [31];
  if (tag === "PCK") return [29];
  if (tag === "DRT") return [18];
  if (tag === "BIM") return [3];
  if (tag === "DRB") return [1];
  if (tag === "BCM") return [19];
  if (tag === "PIR") return [15];
  if (tag === "PID") return [16];
  if (tag === " X ") return [2];
  if (tag === "GUN") return [20];
  if (tag === "JPK") return [4];
  if (tag === " * ") return [48];
  if (tag === " v ") return [47];
  if (tag === " V ") return [49];
  if (tag === " O ") return [51];
  if (tag === " W ") return [50];
  if (tag === " ! ") return [52];
  if (tag === " Y ") return GRAIL_ANIM;
  if (tag === "FR1") return FIRE_ANIM;
  if (tag === "FR2") return rotate(FIRE_ANIM, 10);
  if (tag === "FR3") return rotate(FIRE_ANIM, 20);
  if (tag === "FR4") return rotate(FIRE_ANIM, 30);
  if (tag === "WT1") return WATER_ANIM;
  if (tag === "WT2") return rotate(WATER_ANIM, 10);
  if (tag === "WT3") return rotate(WATER_ANIM, 20);
  if (tag === "WT4") return rotate(WATER_ANIM, 30);
  if (tag === "WT5") return rotate(WATER_ANIM, 40);
  if (tag === "VI1") return VINES_ANIM;
  if (tag === "VI2") return rotate(VINES_ANIM, 10);
  if (tag === "VI3") return rotate(VINES_ANIM, 20);
  if (tag === "VI4") return rotate(VINES_ANIM, 30);
  if (tag === "DR1") return [23];
  if (tag === "DR2") return [24];
  if (tag === "DR3") return [21];
  if (tag === "DR4") return [22];
  if (tag === "  M" || tag === "D+M") return [32];
  if (tag === "TRK") return [33];
  if (tag === "TR1") return [34];
  if (tag === "TR2") return [35];
  if (tag === "TR3") return [44];
  if (tag === "TR4") return [43];
  if (tag === "TR5") return [46];
  if (tag === "TR6") return [45];
  if (tag === "STR") return [41];
  if (tag === "MON") return [42];

  return null;
}

export function collectSpriteIndexesFromCells(cells: ParsedCell[]): number[] {
  const set = new Set<number>();

  for (const cell of cells) {
    const frames = tagToSpriteFrames(cell.tag);
    if (!frames) {
      continue;
    }
    for (const frame of frames) {
      set.add(frame);
    }
  }

  return [...set.values()].sort((a, b) => a - b);
}

