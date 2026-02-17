import {
  LEFT_SCROLL_TRIGGER,
  MAX_SCROLL_OFFSET,
  RIGHT_SCROLL_TRIGGER,
  SCROLL_STEP
} from "./constants.js";
import type { ScrollState } from "./types.js";

export interface ScrollTickResult {
  state: ScrollState;
  didAdjust: boolean;
}

/*
 * Port of game_adjust_scroll_to_dave().
 */
export function adjustScrollToDave(
  scrollState: ScrollState,
  daveX: number
): ScrollTickResult {
  let { scrollOffset, scrollRemaining } = scrollState;

  if (scrollRemaining !== 0) {
    if (scrollRemaining > 0) {
      scrollRemaining -= 1;
      scrollOffset += 1;
    } else {
      scrollRemaining += 1;
      scrollOffset -= 1;
    }

    return {
      didAdjust: true,
      state: { scrollOffset, scrollRemaining }
    };
  }

  const delta = daveX - scrollOffset * 16;
  if (delta > RIGHT_SCROLL_TRIGGER && scrollOffset < MAX_SCROLL_OFFSET) {
    if (MAX_SCROLL_OFFSET - scrollOffset < SCROLL_STEP) {
      scrollRemaining = MAX_SCROLL_OFFSET - scrollOffset;
    } else {
      scrollRemaining = SCROLL_STEP;
    }

    return {
      didAdjust: true,
      state: { scrollOffset, scrollRemaining }
    };
  }

  if (delta < LEFT_SCROLL_TRIGGER && scrollOffset > 0) {
    if (scrollOffset < SCROLL_STEP) {
      scrollRemaining = 0 - scrollOffset;
    } else {
      scrollRemaining = -SCROLL_STEP;
    }

    return {
      didAdjust: true,
      state: { scrollOffset, scrollRemaining }
    };
  }

  return {
    didAdjust: false,
    state: { scrollOffset, scrollRemaining }
  };
}

export function settleScrollToDave(initial: ScrollState, daveX: number): ScrollState {
  let cursor = initial;

  // Safety cap to avoid accidental infinite loops.
  for (let i = 0; i < 1024; i += 1) {
    const tick = adjustScrollToDave(cursor, daveX);
    cursor = tick.state;
    if (!tick.didAdjust) {
      return cursor;
    }
  }

  throw new Error("Failed to settle scroll in bounded ticks.");
}

