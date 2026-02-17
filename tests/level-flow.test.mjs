import test from "node:test";
import assert from "node:assert/strict";

import { nextMainLevel } from "../dist/index.js";

test("nextMainLevel advances through regular sequence", () => {
  assert.deepEqual(nextMainLevel("level1.ddt"), { nextLevel: "level2.ddt", wrapped: false });
  assert.deepEqual(nextMainLevel("level5.ddt"), { nextLevel: "level6.ddt", wrapped: false });
});

test("nextMainLevel wraps after level9", () => {
  assert.deepEqual(nextMainLevel("level9.ddt"), { nextLevel: "level1.ddt", wrapped: true });
});

test("nextMainLevel falls back to level1 for unknown inputs", () => {
  assert.deepEqual(nextMainLevel("warp_right.ddt"), { nextLevel: "level1.ddt", wrapped: false });
});

