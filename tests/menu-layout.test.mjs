import test from "node:test";
import assert from "node:assert/strict";

import {
  QUIT_POPUP_CURSOR,
  QUIT_POPUP_TEXT_LINE,
  buildIntroSceneSprites,
  buildPopupBoxSprites,
  buildTextLineSprites,
  textSpriteIndex
} from "../dist/index.js";

test("intro scene parity: banner, blocks, crowns, and fires are present", () => {
  const sprites = buildIntroSceneSprites();

  assert.equal(sprites.length, 41);

  const banner = sprites[0];
  assert.equal(banner.x, 103);
  assert.equal(banner.y, 0);
  assert.equal(banner.width, 112);
  assert.equal(banner.height, 47);
  assert.equal(banner.frames.length, 24);
  assert.deepEqual(banner.frames.slice(0, 6), [144, 144, 144, 144, 144, 144]);
  assert.deepEqual(banner.frames.slice(18), [147, 147, 147, 147, 147, 147]);

  const crowns = sprites.filter((sprite) => sprite.frames[0] === 50);
  assert.equal(crowns.length, 2);
  assert.equal(crowns.some((sprite) => sprite.x === 136 && sprite.y === 80), true);
  assert.equal(crowns.some((sprite) => sprite.x === 216 && sprite.y === 112), true);

  const fires = sprites.filter((sprite) => sprite.frames.length === 24 && sprite.frames[0] === 6);
  assert.equal(fires.length, 2);
});

test("popup box parity: tile count and corners match C routine", () => {
  const popupTiles = buildPopupBoxSprites(88, 80, 5, 21);
  assert.equal(popupTiles.length, 105);

  assert.deepEqual(popupTiles[0], { x: 88, y: 80, width: 8, height: 8, frames: [158] });
  assert.deepEqual(popupTiles[1], { x: 248, y: 80, width: 8, height: 8, frames: [160] });
  assert.deepEqual(popupTiles[2], { x: 88, y: 112, width: 8, height: 8, frames: [164] });
  assert.deepEqual(popupTiles[3], { x: 248, y: 112, width: 8, height: 8, frames: [166] });
});

test("font mapping parity: white/black and unsupported chars", () => {
  assert.equal(textSpriteIndex("A"), 500);
  assert.equal(textSpriteIndex("1"), 527);
  assert.equal(textSpriteIndex("?", true), 642);
  assert.equal(textSpriteIndex(":"), null);
});

test("text line parity: unsupported chars keep spacing", () => {
  const text = buildTextLineSprites("A:B", 10, 20, false);
  assert.equal(text.length, 2);
  assert.deepEqual(text[0], { x: 10, y: 20, width: 8, height: 8, frames: [500] });
  assert.deepEqual(text[1], { x: 26, y: 20, width: 8, height: 8, frames: [501] });
});

test("quit popup assets parity: text line and cursor animation", () => {
  assert.equal(QUIT_POPUP_TEXT_LINE.text, "QUIT? (Y OR N):");
  assert.equal(QUIT_POPUP_TEXT_LINE.black, true);
  assert.equal(QUIT_POPUP_TEXT_LINE.x, 104);
  assert.equal(QUIT_POPUP_TEXT_LINE.y, 98);

  assert.equal(QUIT_POPUP_CURSOR.x, 224);
  assert.equal(QUIT_POPUP_CURSOR.y, 96);
  assert.equal(QUIT_POPUP_CURSOR.width, 8);
  assert.equal(QUIT_POPUP_CURSOR.height, 8);
  assert.equal(QUIT_POPUP_CURSOR.frames.length, 20);
  assert.deepEqual(QUIT_POPUP_CURSOR.frames.slice(0, 5), [167, 167, 167, 167, 167]);
  assert.deepEqual(QUIT_POPUP_CURSOR.frames.slice(15), [170, 170, 170, 170, 170]);
});

