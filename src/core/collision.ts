import type { TileState } from "./types.js";

export function collisionDetect(tile1: TileState, tile2: TileState): boolean {
  const box1X = tile1.x + tile1.collisionDx;
  const box1Y = tile1.y + tile1.collisionDy;
  const box1W = tile1.width + tile1.collisionDw;
  const box1H = tile1.height + tile1.collisionDh;

  const box2X = tile2.x + tile2.collisionDx;
  const box2Y = tile2.y + tile2.collisionDy;
  const box2W = tile2.width + tile2.collisionDw;
  const box2H = tile2.height + tile2.collisionDh;

  return (
    box1X < box2X + box2W &&
    box1X + box1W > box2X &&
    box1Y < box2Y + box2H &&
    box1Y + box1H > box2Y
  );
}

