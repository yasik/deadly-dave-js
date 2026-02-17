export function scoreValueForTag(tag: string): number {
  if (tag === " * ") {
    return 50;
  }
  if (tag === " v ") {
    return 100;
  }
  if (tag === " V ") {
    return 150;
  }
  if (tag === " O ") {
    return 550;
  }
  if (tag === " W ") {
    return 800;
  }
  if (tag === " ! ") {
    return 400;
  }
  if (tag === " Y ") {
    return 1000;
  }
  if (tag === "GUN") {
    return 100;
  }
  return 0;
}

export function scoreDigits(score: number, width = 5): number[] {
  const out = Array.from({ length: width }, () => 0);
  let value = Math.max(0, Math.floor(score));

  for (let i = 0; i < width; i += 1) {
    out[i] = value % 10;
    value = Math.floor(value / 10);
  }

  return out;
}

export function levelNumberFromFile(fileName: string): number {
  const match = /level(\d+)/.exec(fileName);
  if (!match) {
    return 0;
  }
  return Number.parseInt(match[1], 10);
}
