import test from "node:test";
import assert from "node:assert/strict";

import { reduceUiMode } from "../dist/index.js";

test("ui flow: intro start enters gameplay", () => {
  assert.equal(reduceUiMode("intro", "start"), "gameplay");
});

test("ui flow: gameplay quit request enters confirm dialog", () => {
  assert.equal(reduceUiMode("gameplay", "request_quit"), "quit_confirm");
});

test("ui flow: quit confirm handles yes/no", () => {
  assert.equal(reduceUiMode("quit_confirm", "confirm_quit"), "intro");
  assert.equal(reduceUiMode("quit_confirm", "cancel_quit"), "gameplay");
});

test("ui flow: gameplay game over returns to intro", () => {
  assert.equal(reduceUiMode("gameplay", "game_over"), "intro");
});

test("ui flow: unsupported transitions keep current mode", () => {
  assert.equal(reduceUiMode("intro", "confirm_quit"), "intro");
  assert.equal(reduceUiMode("quit_confirm", "start"), "quit_confirm");
});
