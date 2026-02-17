import test from "node:test";
import assert from "node:assert/strict";

import { adjustScrollToDave, settleScrollToDave } from "../dist/index.js";

test("adjustScrollToDave consumes positive scrollRemaining and increments offset", () => {
  const tick = adjustScrollToDave({ scrollOffset: 10, scrollRemaining: 3 }, 0);
  assert.equal(tick.didAdjust, true);
  assert.deepEqual(tick.state, {
    scrollOffset: 11,
    scrollRemaining: 2
  });
});

test("adjustScrollToDave schedules right scroll when Dave nears right edge", () => {
  const tick = adjustScrollToDave({ scrollOffset: 0, scrollRemaining: 0 }, 500);
  assert.equal(tick.didAdjust, true);
  assert.equal(tick.state.scrollOffset, 0);
  assert.equal(tick.state.scrollRemaining, 15);
});

test("adjustScrollToDave schedules left scroll when Dave nears left edge", () => {
  const tick = adjustScrollToDave({ scrollOffset: 20, scrollRemaining: 0 }, 20);
  assert.equal(tick.didAdjust, true);
  assert.equal(tick.state.scrollOffset, 20);
  assert.equal(tick.state.scrollRemaining, -15);
});

test("settleScrollToDave reaches stable state", () => {
  const finalState = settleScrollToDave({ scrollOffset: 0, scrollRemaining: 0 }, 500);
  assert.equal(finalState.scrollRemaining, 0);
  assert.equal(finalState.scrollOffset, 15);
});

