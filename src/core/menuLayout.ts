export interface UiSpriteSpec {
  x: number;
  y: number;
  width: number;
  height: number;
  frames: number[];
}

export interface UiTextLineSpec {
  text: string;
  x: number;
  y: number;
  black?: boolean;
}

const SPRITE_DIRT = 18;
const SPRITE_CROWN = 50;
const SPRITE_FIRE_1 = 6;
const SPRITE_TITLE_FLAMES_1 = 144;
const SPRITE_POPUP_BOX_T1 = 158;
const SPRITE_POPUP_BOX_T2 = 159;
const SPRITE_POPUP_BOX_T3 = 160;
const SPRITE_POPUP_BOX_M1 = 161;
const SPRITE_POPUP_BOX_M2 = 162;
const SPRITE_POPUP_BOX_M3 = 163;
const SPRITE_POPUP_BOX_B1 = 164;
const SPRITE_POPUP_BOX_B2 = 165;
const SPRITE_POPUP_BOX_B3 = 166;
const SPRITE_CURSOR_1 = 167;

const WHITE_FONT_BASE = 500;
const BLACK_FONT_BASE = 600;

const FONT_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 ,.()!?";

function repeatedFrames(startSprite: number, count: number, repeats: number): number[] {
  const out: number[] = [];
  for (let sprite = startSprite; sprite < startSprite + count; sprite += 1) {
    for (let i = 0; i < repeats; i += 1) {
      out.push(sprite);
    }
  }
  return out;
}

function staticSprite(sprite: number, x: number, y: number, size = 16): UiSpriteSpec {
  return {
    x,
    y,
    width: size,
    height: size,
    frames: [sprite]
  };
}

const INTRO_DIRT_COORDS: Array<[number, number]> = [
  [88, 64],
  [120, 64],
  [136, 64],
  [152, 64],
  [168, 64],
  [200, 64],
  [232, 64],
  [88, 80],
  [120, 80],
  [232, 80],
  [88, 96],
  [120, 96],
  [168, 96],
  [184, 96],
  [200, 96],
  [232, 96],
  [88, 112],
  [120, 112],
  [232, 112],
  [88, 128],
  [120, 128],
  [152, 128],
  [168, 128],
  [184, 128],
  [232, 128],
  [88, 144],
  [232, 144],
  [88, 160],
  [104, 160],
  [120, 160],
  [136, 160],
  [152, 160],
  [168, 160],
  [184, 160],
  [200, 160],
  [232, 160]
];

const INTRO_CROWN_COORDS: Array<[number, number]> = [
  [136, 80],
  [216, 112]
];

const INTRO_FIRE_COORDS: Array<[number, number]> = [
  [136, 128],
  [216, 160]
];

export const INTRO_TEXT_LINES: UiTextLineSpec[] = [
  { text: "BY JOHN ROMERO", x: 110, y: 50 },
  { text: "(C) 1990 SOFTDISK, INC.", x: 79, y: 57 },
  { text: "PRESS THE F1 KEY FOR HELP", x: 72, y: 168 }
];

export const QUIT_POPUP_TEXT_LINE: UiTextLineSpec = {
  text: "QUIT? (Y OR N):",
  x: 104,
  y: 98,
  black: true
};

export const QUIT_POPUP_CURSOR: UiSpriteSpec = {
  x: 224,
  y: 96,
  width: 8,
  height: 8,
  frames: repeatedFrames(SPRITE_CURSOR_1, 4, 5)
};

export function buildIntroSceneSprites(): UiSpriteSpec[] {
  const out: UiSpriteSpec[] = [];

  out.push({
    x: 103,
    y: 0,
    width: 112,
    height: 47,
    frames: repeatedFrames(SPRITE_TITLE_FLAMES_1, 4, 6)
  });

  for (const [x, y] of INTRO_DIRT_COORDS) {
    out.push(staticSprite(SPRITE_DIRT, x, y));
  }

  for (const [x, y] of INTRO_CROWN_COORDS) {
    out.push(staticSprite(SPRITE_CROWN, x, y));
  }

  for (const [x, y] of INTRO_FIRE_COORDS) {
    out.push({
      x,
      y,
      width: 16,
      height: 16,
      frames: repeatedFrames(SPRITE_FIRE_1, 4, 6)
    });
  }

  return out;
}

export function buildPopupBoxSprites(x: number, y: number, rows: number, columns: number): UiSpriteSpec[] {
  const out: UiSpriteSpec[] = [];

  out.push(staticSprite(SPRITE_POPUP_BOX_T1, x, y, 8));
  out.push(staticSprite(SPRITE_POPUP_BOX_T3, x + ((columns - 1) * 8), y, 8));
  out.push(staticSprite(SPRITE_POPUP_BOX_B1, x, y + ((rows - 1) * 8), 8));
  out.push(staticSprite(SPRITE_POPUP_BOX_B3, x + ((columns - 1) * 8), y + ((rows - 1) * 8), 8));

  for (let i = 1; i < rows - 1; i += 1) {
    out.push(staticSprite(SPRITE_POPUP_BOX_M1, x, y + (i * 8), 8));
    out.push(staticSprite(SPRITE_POPUP_BOX_M3, x + ((columns - 1) * 8), y + (i * 8), 8));
  }

  for (let i = 1; i < columns - 1; i += 1) {
    out.push(staticSprite(SPRITE_POPUP_BOX_T2, x + (i * 8), y, 8));
    out.push(staticSprite(SPRITE_POPUP_BOX_B2, x + (i * 8), y + ((rows - 1) * 8), 8));
  }

  for (let i = 1; i < rows - 1; i += 1) {
    for (let j = 1; j < columns - 1; j += 1) {
      out.push(staticSprite(SPRITE_POPUP_BOX_M2, x + (j * 8), y + (i * 8), 8));
    }
  }

  return out;
}

export function textSpriteIndex(char: string, black = false): number | null {
  if (char.length === 0) {
    return null;
  }

  const upper = char[0].toUpperCase();
  const idx = FONT_CHARS.indexOf(upper);
  if (idx < 0) {
    return null;
  }

  return (black ? BLACK_FONT_BASE : WHITE_FONT_BASE) + idx;
}

export function buildTextLineSprites(text: string, x: number, y: number, black = false): UiSpriteSpec[] {
  const out: UiSpriteSpec[] = [];
  for (let i = 0; i < text.length; i += 1) {
    const sprite = textSpriteIndex(text[i], black);
    if (sprite === null) {
      continue;
    }
    out.push(staticSprite(sprite, x + (i * 8), y, 8));
  }
  return out;
}

