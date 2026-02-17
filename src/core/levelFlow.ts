export const MAIN_LEVEL_FILES = [
  "level1.ddt",
  "level2.ddt",
  "level3.ddt",
  "level4.ddt",
  "level5.ddt",
  "level6.ddt",
  "level7.ddt",
  "level8.ddt",
  "level9.ddt"
] as const;

export interface LevelAdvanceResult {
  nextLevel: string;
  wrapped: boolean;
}

export function nextMainLevel(currentLevel: string): LevelAdvanceResult {
  const idx = MAIN_LEVEL_FILES.indexOf(currentLevel as (typeof MAIN_LEVEL_FILES)[number]);
  if (idx < 0) {
    return {
      nextLevel: MAIN_LEVEL_FILES[0],
      wrapped: false
    };
  }

  const nextIdx = idx + 1;
  if (nextIdx >= MAIN_LEVEL_FILES.length) {
    return {
      nextLevel: MAIN_LEVEL_FILES[0],
      wrapped: true
    };
  }

  return {
    nextLevel: MAIN_LEVEL_FILES[nextIdx],
    wrapped: false
  };
}

