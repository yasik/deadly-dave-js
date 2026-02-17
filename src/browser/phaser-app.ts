import { TILE_SIZE } from "../core/constants.js";
import {
  DaveDirection,
  DaveStateKind,
  MAIN_LEVEL_FILES,
  SPRITE_DAVE_FRONT,
  TileMod,
  collisionDetect,
  collectSpriteIndexesFromCells,
  createMonsterFromSpawn,
  createDave,
  buildIntroSceneSprites,
  buildPopupBoxSprites,
  buildTextLineSprites,
  getDaveSprite,
  getMonsterSprite,
  INTRO_TEXT_LINES,
  isDaveDead,
  isMonsterAlive,
  isProjectileDead,
  levelNumberFromFile,
  nextMainLevel,
  parseLevelMap,
  reduceUiMode,
  resetDaveAfterDeath,
  QUIT_POPUP_CURSOR,
  QUIT_POPUP_TEXT_LINE,
  scoreDigits,
  scoreValueForTag,
  spawnDaveBullet,
  tagToSpriteFrames,
  tickMonster,
  tickDave,
  tickProjectile,
  type UiSpriteSpec,
  type UiMode,
  type LevelParseResult,
  type MonsterEntity,
  type MonsterSpawn,
  type ParsedCell
} from "../index.js";
import { SoundFxPlayer, queueSoundFxAssets, type SoundTune } from "./sfx.js";

declare const Phaser: any;

const GAME_WIDTH = 320;
const GAME_HEIGHT = 200;
const TICK_MS = 14;

interface RuntimeTile {
  tile: {
    x: number;
    y: number;
    width: number;
    height: number;
    collisionDx: number;
    collisionDy: number;
    collisionDw: number;
    collisionDh: number;
    mod: TileMod;
    firstSprite: number;
    scoreValue?: number;
  };
  frames: number[];
  image: any | null;
}

interface AnimatedTile {
  image: any;
  frames: number[];
  runtime: RuntimeTile;
}

interface AnimatedUiSprite {
  image: any;
  frames: number[];
}

interface RuntimeMonster {
  entity: MonsterEntity;
  image: any | null;
}

function tileKey(spriteIndex: number): string {
  return `tile-${spriteIndex}`;
}

function computeMapBounds(cells: ParsedCell[]): { width: number; height: number } {
  let maxCol = 0;
  let maxRow = 0;

  for (const cell of cells) {
    if (cell.col > maxCol) {
      maxCol = cell.col;
    }
    if (cell.row > maxRow) {
      maxRow = cell.row;
    }
  }

  return {
    width: (maxCol + 1) * TILE_SIZE,
    height: (maxRow + 1) * TILE_SIZE
  };
}

class StaticMapScene extends Phaser.Scene {
  private cursors: any = null;
  private keyEscape: any = null;
  private keyEnter: any = null;
  private keySpace: any = null;
  private keyY: any = null;
  private keyN: any = null;
  private keyJetpackAlt: any = null;
  private keyJetpackJ: any = null;
  private keyJetpackShift: any = null;
  private keyFireCtrl: any = null;
  private keyFireX: any = null;
  private keyFireSpace: any = null;

  private runtimeTiles: RuntimeTile[] = [];
  private animatedTiles: AnimatedTile[] = [];
  private runtimeMonsters: RuntimeMonster[] = [];
  private bulletState: ReturnType<typeof spawnDaveBullet> = null;
  private bulletImage: any | null = null;

  private dave: ReturnType<typeof createDave> | null = null;
  private daveImage: any | null = null;
  private background: any | null = null;
  private sfx: SoundFxPlayer | null = null;

  private score = 0;
  private lives = 4;
  private uiMode: UiMode = "intro";

  private headerText: any | null = null;
  private mapText: any | null = null;
  private helpText: any | null = null;
  private statusText: any | null = null;
  private loadingLabel: any | null = null;
  private introBackdrop: any | null = null;
  private introSprites: AnimatedUiSprite[] = [];
  private introTextSprites: any[] = [];
  private introMessage: any | null = null;
  private quitPopupSprites: any[] = [];
  private quitCursor: AnimatedUiSprite | null = null;
  private menuAnimationTick = 0;
  private menuAnimationAccumulatorMs = 0;
  private menuAssetsReady = false;
  private hudTopSeparator: any | null = null;
  private hudBottomSeparator: any | null = null;
  private hudScoreLabel: any | null = null;
  private hudScoreDigits: any[] = [];
  private hudLevelLabel: any | null = null;
  private hudLevelTens: any | null = null;
  private hudLevelOnes: any | null = null;
  private hudLivesLabel: any | null = null;
  private hudLivesIcons: any[] = [];
  private hudGunBanner: any | null = null;
  private hudTrophyBanner: any | null = null;
  private hudJetpackLabel: any | null = null;
  private hudJetpackFrame: any | null = null;
  private hudJetpackBars: any[] = [];

  private currentLevelFile: string = MAIN_LEVEL_FILES[0];
  private ready = false;
  private isLevelLoading = false;
  private isTransitioning = false;
  private tickAccumulatorMs = 0;
  private logicTick = 0;

  constructor() {
    super("static-map");
  }

  create(): void {
    const keyboard = this.input.keyboard;
    this.cursors = keyboard.createCursorKeys();
    this.keyEscape = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
    this.keyEnter = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
    this.keySpace = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this.keyY = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Y);
    this.keyN = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.N);
    this.keyJetpackAlt = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ALT);
    this.keyJetpackJ = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.J);
    this.keyJetpackShift = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT);
    this.keyFireCtrl = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.CTRL);
    this.keyFireX = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.X);
    this.keyFireSpace = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    keyboard.addCapture([
      Phaser.Input.Keyboard.KeyCodes.LEFT,
      Phaser.Input.Keyboard.KeyCodes.RIGHT,
      Phaser.Input.Keyboard.KeyCodes.UP,
      Phaser.Input.Keyboard.KeyCodes.DOWN,
      Phaser.Input.Keyboard.KeyCodes.ESC,
      Phaser.Input.Keyboard.KeyCodes.ENTER,
      Phaser.Input.Keyboard.KeyCodes.Y,
      Phaser.Input.Keyboard.KeyCodes.N,
      Phaser.Input.Keyboard.KeyCodes.ALT,
      Phaser.Input.Keyboard.KeyCodes.J,
      Phaser.Input.Keyboard.KeyCodes.SHIFT,
      Phaser.Input.Keyboard.KeyCodes.CTRL,
      Phaser.Input.Keyboard.KeyCodes.X,
      Phaser.Input.Keyboard.KeyCodes.SPACE
    ]);

    this.ensureHud();
    this.sfx = new SoundFxPlayer(this);
    this.setLoading("Loading intro...");
    const queued = this.queueMenuAssets();
    if (queued > 0) {
      this.load.once(Phaser.Loader.Events.COMPLETE, () => {
        this.menuAssetsReady = true;
        this.showIntro("ENTER OR SPACE: START | ESC: QUIT");
      });
      this.load.start();
    } else {
      this.menuAssetsReady = true;
      this.showIntro("ENTER OR SPACE: START | ESC: QUIT");
    }
  }

  update(_time: number, delta: number): void {
    this.stepMenuTick(delta);
    if (this.uiMode !== "gameplay") {
      return;
    }

    if (!this.ready || this.isTransitioning) {
      return;
    }

    if (Phaser.Input.Keyboard.JustDown(this.keyEscape)) {
      this.showQuitPrompt();
      return;
    }

    this.tickAccumulatorMs += delta;
    while (this.tickAccumulatorMs >= TICK_MS) {
      this.tickAccumulatorMs -= TICK_MS;
      this.stepGameplayTick();
      this.logicTick += 1;
      this.stepAnimations();
    }
  }

  private ensureHud(): void {
    if (this.headerText) {
      return;
    }

    this.headerText = this.add
      .text(6, 6, "", {
        fontFamily: "Courier New",
        fontSize: "10px",
        color: "#f5f5f5",
        backgroundColor: "#000000aa"
      })
      .setScrollFactor(0);
    this.headerText.setVisible(false);

    this.mapText = this.add
      .text(6, 20, "", {
        fontFamily: "Courier New",
        fontSize: "10px",
        color: "#f5f5f5",
        backgroundColor: "#000000aa"
      })
      .setScrollFactor(0);
    this.mapText.setVisible(false);

    this.helpText = this.add
      .text(6, 34, "Controls: <- -> move | Up jump | Down descend | Alt/J/Shift jetpack | Ctrl/X/Space fire", {
        fontFamily: "Courier New",
        fontSize: "10px",
        color: "#f5f5f5",
        backgroundColor: "#000000aa"
      })
      .setScrollFactor(0);
    this.helpText.setVisible(false);

    this.statusText = this.add
      .text(6, 48, "", {
        fontFamily: "Courier New",
        fontSize: "10px",
        color: "#f5f5f5",
        backgroundColor: "#000000aa"
      })
      .setScrollFactor(0);
    this.statusText.setVisible(false);

    this.loadingLabel = this.add
      .text(6, 62, "", {
        fontFamily: "Courier New",
        fontSize: "10px",
        color: "#f5f5f5",
        backgroundColor: "#000000aa"
      })
      .setScrollFactor(0);
  }

  private setLoading(message: string): void {
    if (!this.loadingLabel) {
      return;
    }
    this.loadingLabel.setText(message);
    this.loadingLabel.setVisible(message.length > 0);
  }

  private createUiSprite(spec: UiSpriteSpec, depth: number): AnimatedUiSprite | null {
    if (spec.frames.length === 0) {
      return null;
    }

    const key = tileKey(spec.frames[0]);
    if (!this.textures.exists(key)) {
      return null;
    }

    const image = this.add.image(spec.x, spec.y, key).setOrigin(0, 0).setScrollFactor(0).setDepth(depth);
    image.setDisplaySize(spec.width, spec.height);
    image.setVisible(false);
    return { image, frames: [...spec.frames] };
  }

  private ensureMenuOverlays(): void {
    if (!this.menuAssetsReady || this.introSprites.length > 0) {
      return;
    }

    if (!this.introBackdrop) {
      this.introBackdrop = this.add
        .rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x000000, 1)
        .setOrigin(0, 0)
        .setScrollFactor(0)
        .setDepth(79)
        .setVisible(false);
    }

    for (const spec of buildIntroSceneSprites()) {
      const runtime = this.createUiSprite(spec, 80);
      if (runtime) {
        this.introSprites.push(runtime);
      }
    }

    for (const line of INTRO_TEXT_LINES) {
      const textSpecs = buildTextLineSprites(line.text, line.x, line.y, line.black === true);
      for (const spec of textSpecs) {
        const runtime = this.createUiSprite(spec, 81);
        if (runtime) {
          this.introTextSprites.push(runtime.image);
        }
      }
    }

    if (!this.introMessage) {
      this.introMessage = this.add
        .text(160, 186, "", {
          fontFamily: "Courier New",
          fontSize: "10px",
          color: "#f7d35c"
        })
        .setOrigin(0.5, 0.5)
        .setScrollFactor(0)
        .setDepth(82)
        .setVisible(false);
    }

    for (const spec of buildPopupBoxSprites(88, 80, 5, 21)) {
      const runtime = this.createUiSprite(spec, 90);
      if (runtime) {
        this.quitPopupSprites.push(runtime.image);
      }
    }

    for (const spec of buildTextLineSprites(
      QUIT_POPUP_TEXT_LINE.text,
      QUIT_POPUP_TEXT_LINE.x,
      QUIT_POPUP_TEXT_LINE.y,
      QUIT_POPUP_TEXT_LINE.black === true
    )) {
      const runtime = this.createUiSprite(spec, 91);
      if (runtime) {
        this.quitPopupSprites.push(runtime.image);
      }
    }

    this.quitCursor = this.createUiSprite(QUIT_POPUP_CURSOR, 92);
    if (this.quitCursor) {
      this.quitCursor.image.setVisible(false);
    }
  }

  private showIntro(message: string): void {
    this.ensureMenuOverlays();
    this.uiMode = "intro";
    this.ready = false;
    this.isTransitioning = false;
    this.menuAnimationTick = 0;
    this.menuAnimationAccumulatorMs = 0;
    this.setHudVisible(false);

    this.introBackdrop?.setVisible(this.menuAssetsReady);
    for (const sprite of this.introSprites) {
      sprite.image.setVisible(true);
      const key = tileKey(sprite.frames[0]);
      if (this.textures.exists(key)) {
        sprite.image.setTexture(key);
      }
    }
    for (const image of this.introTextSprites) {
      image.setVisible(true);
    }
    this.introMessage?.setText(message);
    this.introMessage?.setVisible(message.length > 0);
    for (const image of this.quitPopupSprites) {
      image.setVisible(false);
    }
    if (this.quitCursor) {
      this.quitCursor.image.setVisible(false);
    }
    this.setLoading("");
  }

  private hideIntro(): void {
    this.introBackdrop?.setVisible(false);
    for (const sprite of this.introSprites) {
      sprite.image.setVisible(false);
    }
    for (const image of this.introTextSprites) {
      image.setVisible(false);
    }
    this.introMessage?.setVisible(false);
  }

  private showQuitPrompt(): void {
    if (this.uiMode !== "gameplay") {
      return;
    }
    this.ensureMenuOverlays();
    this.uiMode = reduceUiMode(this.uiMode, "request_quit");
    for (const image of this.quitPopupSprites) {
      image.setVisible(true);
    }
    if (this.quitCursor) {
      this.quitCursor.image.setVisible(true);
    }
  }

  private hideQuitPrompt(): void {
    if (this.uiMode === "quit_confirm") {
      this.uiMode = reduceUiMode(this.uiMode, "cancel_quit");
    }
    for (const image of this.quitPopupSprites) {
      image.setVisible(false);
    }
    if (this.quitCursor) {
      this.quitCursor.image.setVisible(false);
    }
  }

  private stepMenuAnimations(delta: number): void {
    this.menuAnimationAccumulatorMs += delta;
    while (this.menuAnimationAccumulatorMs >= TICK_MS) {
      this.menuAnimationAccumulatorMs -= TICK_MS;
      this.menuAnimationTick += 1;
    }

    for (const sprite of this.introSprites) {
      if (!sprite.image.visible || sprite.frames.length <= 1) {
        continue;
      }
      const frame = sprite.frames[this.menuAnimationTick % sprite.frames.length];
      const key = tileKey(frame);
      if (this.textures.exists(key)) {
        sprite.image.setTexture(key);
      }
    }

    if (this.quitCursor?.image.visible) {
      const frame = this.quitCursor.frames[this.menuAnimationTick % this.quitCursor.frames.length];
      const key = tileKey(frame);
      if (this.textures.exists(key)) {
        this.quitCursor.image.setTexture(key);
      }
    }
  }

  private stepMenuTick(delta: number): void {
    if (!this.menuAssetsReady) {
      return;
    }

    this.stepMenuAnimations(delta);

    if (this.uiMode === "intro") {
      if (Phaser.Input.Keyboard.JustDown(this.keyEnter) || Phaser.Input.Keyboard.JustDown(this.keySpace)) {
        void this.startNewRun();
      } else if (Phaser.Input.Keyboard.JustDown(this.keyEscape)) {
        this.requestBrowserQuitFromIntro();
      }
      return;
    }

    if (this.uiMode === "quit_confirm") {
      if (Phaser.Input.Keyboard.JustDown(this.keyY)) {
        this.hideQuitPrompt();
        this.uiMode = reduceUiMode("quit_confirm", "confirm_quit");
        this.returnToIntro("ENTER OR SPACE: START | ESC: QUIT");
        this.requestBrowserQuitFromIntro();
      } else if (
        Phaser.Input.Keyboard.JustDown(this.keyN) ||
        Phaser.Input.Keyboard.JustDown(this.keyEscape)
      ) {
        this.hideQuitPrompt();
      }
    }
  }

  private async startNewRun(): Promise<void> {
    if (this.uiMode !== "intro" || this.isLevelLoading) {
      return;
    }

    this.uiMode = reduceUiMode(this.uiMode, "start");
    this.hideIntro();
    this.setHudVisible(true);
    this.lives = 4;
    this.score = 0;
    this.currentLevelFile = MAIN_LEVEL_FILES[0];

    await this.loadLevel(MAIN_LEVEL_FILES[0]);
  }

  private requestBrowserQuitFromIntro(): void {
    if (typeof window !== "undefined" && typeof window.close === "function") {
      try {
        window.close();
      } catch {
        // no-op
      }
    }
    this.introMessage?.setText("Close this browser tab/window to quit.");
    this.introMessage?.setVisible(true);
  }

  private returnToIntro(message: string): void {
    this.clearLevelVisuals();
    this.cameras.main.stopFollow();
    this.cameras.main.setScroll(0, 0);
    this.showIntro(message);
  }

  private queueSpriteIndexes(spriteIndexes: Iterable<number>): number {
    let queued = 0;
    for (const spriteIndex of spriteIndexes) {
      if (spriteIndex <= 0) {
        continue;
      }
      const key = tileKey(spriteIndex);
      if (!this.textures.exists(key)) {
        this.load.image(key, `./public/tiles/tile${spriteIndex}.bmp`);
        queued += 1;
      }
    }
    return queued;
  }

  private queueMenuAssets(): number {
    const needed = new Set<number>();

    for (const spec of buildIntroSceneSprites()) {
      for (const frame of spec.frames) {
        needed.add(frame);
      }
    }

    for (const line of INTRO_TEXT_LINES) {
      for (const spec of buildTextLineSprites(line.text, line.x, line.y, line.black === true)) {
        needed.add(spec.frames[0]);
      }
    }

    for (const spec of buildPopupBoxSprites(88, 80, 5, 21)) {
      needed.add(spec.frames[0]);
    }

    for (const spec of buildTextLineSprites(
      QUIT_POPUP_TEXT_LINE.text,
      QUIT_POPUP_TEXT_LINE.x,
      QUIT_POPUP_TEXT_LINE.y,
      QUIT_POPUP_TEXT_LINE.black === true
    )) {
      needed.add(spec.frames[0]);
    }

    for (const frame of QUIT_POPUP_CURSOR.frames) {
      needed.add(frame);
    }

    return this.queueSpriteIndexes(needed);
  }

  private async loadLevel(fileName: string): Promise<void> {
    if (this.isLevelLoading) {
      return;
    }

    this.ready = false;
    this.isLevelLoading = true;
    this.currentLevelFile = fileName;
    this.tickAccumulatorMs = 0;
    this.logicTick = 0;
    this.setLoading(`Loading ${fileName}...`);

    try {
      const source = await this.fetchLevelSource(fileName);
      const parsed = parseLevelMap(source);

      const queued = this.queueRequiredTileImages(parsed) + queueSoundFxAssets(this);
      if (queued > 0) {
        await this.runLoaderQueue();
      }

      this.applyLevel(parsed, fileName);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.setLoading(`Load error: ${message}`);
    } finally {
      this.isLevelLoading = false;
    }
  }

  private async fetchLevelSource(fileName: string): Promise<string> {
    const response = await fetch(`./public/levels/${fileName}`, { cache: "no-store" });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status} while loading ${fileName}`);
    }
    return response.text();
  }

  private runLoaderQueue(): Promise<void> {
    return new Promise((resolve) => {
      this.load.once(Phaser.Loader.Events.COMPLETE, () => resolve());
      this.load.start();
    });
  }

  private queueRequiredTileImages(parsed: LevelParseResult): number {
    const needed = new Set<number>(collectSpriteIndexesFromCells(parsed.cells));
    needed.add(SPRITE_DAVE_FRONT);
    needed.add(53);
    needed.add(54);
    needed.add(55);
    needed.add(57);
    needed.add(58);
    needed.add(59);
    needed.add(67);
    needed.add(68);
    needed.add(71);
    needed.add(72);
    needed.add(73);
    needed.add(77);
    needed.add(78);
    needed.add(79);
    needed.add(80);
    needed.add(81);
    needed.add(82);
    needed.add(129);
    needed.add(130);
    needed.add(131);
    needed.add(132);
    needed.add(127);
    needed.add(128);
    needed.add(133);
    needed.add(134);
    needed.add(135);
    needed.add(136);
    needed.add(137);
    needed.add(138);
    needed.add(141);
    needed.add(142);
    needed.add(143);
    needed.add(171);
    needed.add(172);
    for (let i = 148; i <= 157; i += 1) {
      needed.add(i);
    }

    for (const spawn of parsed.monsterSpawns) {
      const monster = createMonsterFromSpawn(spawn);
      for (const sprite of monster.sprites) {
        needed.add(sprite);
      }
    }

    return this.queueSpriteIndexes(needed);
  }

  private applyLevel(parsed: LevelParseResult, fileName: string): void {
    this.clearLevelVisuals();

    const bounds = computeMapBounds(parsed.cells);
    const worldHeight = Math.max(bounds.height, GAME_HEIGHT);
    const worldWidth = Math.max(bounds.width, GAME_WIDTH);
    this.cameras.main.stopFollow();
    this.cameras.main.setBounds(0, 0, worldWidth, worldHeight);

    this.drawBackground(worldWidth, worldHeight);
    this.drawMapTiles(parsed.cells);
    this.initializeMonsters(parsed.monsterSpawns);
    this.initializeDave(parsed);
    this.initializeHudSprites();
    this.updateHud();
    this.setHudVisible(true);

    if (this.daveImage) {
      this.cameras.main.startFollow(this.daveImage, false, 0.20, 0.20);
    }

    this.hideIntro();
    this.hideQuitPrompt();
    this.setLoading("");

    this.ready = true;
    this.isTransitioning = false;
    this.uiMode = "gameplay";
  }

  private clearLevelVisuals(): void {
    if (this.background) {
      this.background.destroy();
      this.background = null;
    }

    for (const runtime of this.runtimeTiles) {
      if (runtime.image) {
        runtime.image.destroy();
      }
    }
    this.runtimeTiles = [];
    this.animatedTiles = [];

    for (const runtimeMonster of this.runtimeMonsters) {
      if (runtimeMonster.image) {
        runtimeMonster.image.destroy();
      }
    }
    this.runtimeMonsters = [];

    this.destroyBullet();
    this.sfx?.stop();

    if (this.daveImage) {
      this.daveImage.destroy();
      this.daveImage = null;
    }
    this.dave = null;
  }

  private drawBackground(width: number, height: number): void {
    this.background = this.add.graphics();
    this.background.fillStyle(0x101820, 1);
    this.background.fillRect(0, 0, width, height);
  }

  private drawMapTiles(cells: ParsedCell[]): void {
    for (const cell of cells) {
      const frames = tagToSpriteFrames(cell.tag) ?? [];
      const mod = this.tagToMod(cell.tag);
      const collision = this.tagCollisionAdjustments(cell.tag);
      const runtime: RuntimeTile = {
        tile: {
          x: cell.x,
          y: cell.y,
          width: TILE_SIZE,
          height: TILE_SIZE,
          collisionDx: collision.collisionDx,
          collisionDy: collision.collisionDy,
          collisionDw: collision.collisionDw,
          collisionDh: collision.collisionDh,
          mod,
          firstSprite: frames[0] ?? 0,
          scoreValue: scoreValueForTag(cell.tag)
        },
        frames,
        image: null
      };

      this.runtimeTiles.push(runtime);
      if (runtime.tile.firstSprite === 0) {
        continue;
      }

      const key = tileKey(runtime.tile.firstSprite);
      if (!this.textures.exists(key)) {
        continue;
      }

      const image = this.add.image(cell.x, cell.y, key).setOrigin(0, 0);
      image.setDisplaySize(TILE_SIZE, TILE_SIZE);
      runtime.image = image;

      if (frames.length > 1) {
        this.animatedTiles.push({ image, frames, runtime });
      }
    }
  }

  private initializeMonsters(spawns: MonsterSpawn[]): void {
    for (const spawn of spawns) {
      const entity = createMonsterFromSpawn(spawn);
      const spriteIdx = getMonsterSprite(entity);
      const key = tileKey(spriteIdx);
      const image =
        spriteIdx !== 0 && this.textures.exists(key)
          ? this.add.image(entity.tile.x, entity.tile.y, key).setOrigin(0, 0).setDepth(3)
          : null;

      this.runtimeMonsters.push({ entity, image });
    }
  }

  private initializeDave(parsed: LevelParseResult): void {
    const spawn = parsed.daveSpawn ?? { x: 16, y: 16 };
    this.dave = createDave(spawn.x, spawn.y);

    const key = tileKey(SPRITE_DAVE_FRONT);
    if (!this.textures.exists(key)) {
      return;
    }

    this.daveImage = this.add.image(this.dave.tile.x, this.dave.tile.y, key).setOrigin(0, 0).setDepth(4);
  }

  private stepGameplayTick(): void {
    if (!this.dave || !this.daveImage) {
      return;
    }

    const mapTiles = this.runtimeTiles.map((runtime) => runtime.tile);
    const prevDaveState = this.dave.state;
    const input = {
      left: this.cursors?.left?.isDown === true,
      right: this.cursors?.right?.isDown === true,
      jump: this.cursors?.up?.isDown === true,
      down: this.cursors?.down?.isDown === true,
      jetpack: this.isJetpackTogglePressed()
    };

    tickDave(this.dave, mapTiles, input);
    this.handleDaveStateAudio(prevDaveState, this.dave.state);
    this.stepMonsters();
    this.stepBullet(mapTiles);

    if (isDaveDead(this.dave)) {
      this.handleDaveDeath();
      return;
    }

    this.handleDaveInteractions();
    this.handleCombatInteractions();

    if (this.dave.tile.y > 200) {
      this.dave.tile.y = -20;
    }

    const spriteIdx = getDaveSprite(this.dave);
    const spriteKey = tileKey(spriteIdx);
    if (this.textures.exists(spriteKey)) {
      this.daveImage.setTexture(spriteKey);
    }
    this.daveImage.x = this.dave.tile.x;
    this.daveImage.y = this.dave.tile.y;
    this.updateHud();
  }

  private playTune(tune: SoundTune, options: { loop?: boolean; restart?: boolean } = {}): void {
    this.sfx?.play(tune, options);
  }

  private handleDaveStateAudio(prevState: number, nextState: number): void {
    if (nextState === DaveStateKind.JETPACKING) {
      if (prevState !== DaveStateKind.JETPACKING) {
        this.playTune("tojetpack", { restart: true });
      } else {
        this.playTune("flying", { loop: true });
      }
      return;
    }

    if (prevState === DaveStateKind.JETPACKING && this.sfx?.getActiveTune() === "flying") {
      this.sfx.stop();
    }

    if (prevState === nextState) {
      return;
    }

    if (nextState === DaveStateKind.STANDING || nextState === DaveStateKind.DEAD) {
      this.sfx?.stop();
      return;
    }

    if (nextState === DaveStateKind.WALKING) {
      this.playTune("walking", { restart: true });
    } else if (nextState === DaveStateKind.JUMPING) {
      this.playTune("jumping", { restart: true });
    } else if (nextState === DaveStateKind.FREEFALLING) {
      this.playTune("falling", { restart: true });
    } else if (nextState === DaveStateKind.CLIMBING) {
      this.playTune("climbing", { restart: true });
    }
  }

  private stepMonsters(): void {
    if (!this.dave) {
      return;
    }

    for (const runtimeMonster of this.runtimeMonsters) {
      tickMonster(runtimeMonster.entity, this.dave.tile.x);
      const spriteIdx = getMonsterSprite(runtimeMonster.entity);

      if (spriteIdx === 0) {
        if (runtimeMonster.image?.visible) {
          runtimeMonster.image.setVisible(false);
        }
        continue;
      }

      const key = tileKey(spriteIdx);
      if (!this.textures.exists(key)) {
        continue;
      }

      if (!runtimeMonster.image) {
        runtimeMonster.image = this.add
          .image(runtimeMonster.entity.tile.x, runtimeMonster.entity.tile.y, key)
          .setOrigin(0, 0)
          .setDepth(3);
      }

      if (!runtimeMonster.image.visible) {
        runtimeMonster.image.setVisible(true);
      }
      runtimeMonster.image.setTexture(key);
      runtimeMonster.image.x = runtimeMonster.entity.tile.x;
      runtimeMonster.image.y = runtimeMonster.entity.tile.y;
    }
  }

  private stepBullet(mapTiles: RuntimeTile["tile"][]): void {
    if (this.bulletState) {
      const deadzoneLeft = Math.floor(this.cameras.main.scrollX);
      const deadzoneRight = deadzoneLeft + GAME_WIDTH;
      this.bulletState = tickProjectile(this.bulletState, mapTiles, deadzoneLeft, deadzoneRight);

      if (isProjectileDead(this.bulletState)) {
        this.destroyBullet();
        return;
      }

      const spriteIdx = this.bulletState.speedX < 0 ? 128 : 127;
      const key = tileKey(spriteIdx);
      if (!this.textures.exists(key)) {
        return;
      }

      if (!this.bulletImage) {
        this.bulletImage = this.add
          .image(this.bulletState.x, this.bulletState.y, key)
          .setOrigin(0, 0)
          .setDepth(3);
      }

      this.bulletImage.setTexture(key);
      this.bulletImage.x = this.bulletState.x;
      this.bulletImage.y = this.bulletState.y;
      return;
    }

    if (!this.isFirePressed() || !this.dave) {
      return;
    }

    this.bulletState = spawnDaveBullet(this.dave);
    if (!this.bulletState) {
      return;
    }

    const spriteIdx =
      this.dave.faceDirection === DaveDirection.LEFT || this.dave.faceDirection === DaveDirection.FRONTL
        ? 128
        : 127;
    const key = tileKey(spriteIdx);
    if (!this.textures.exists(key)) {
      return;
    }

    this.bulletImage = this.add
      .image(this.bulletState.x, this.bulletState.y, key)
      .setOrigin(0, 0)
      .setDepth(3);
  }

  private isFirePressed(): boolean {
    return (
      this.keyFireCtrl?.isDown === true ||
      this.keyFireX?.isDown === true ||
      this.keyFireSpace?.isDown === true
    );
  }

  private isJetpackTogglePressed(): boolean {
    return (
      Phaser.Input.Keyboard.JustDown(this.keyJetpackAlt) ||
      Phaser.Input.Keyboard.JustDown(this.keyJetpackJ) ||
      Phaser.Input.Keyboard.JustDown(this.keyJetpackShift)
    );
  }

  private bulletAsTile(): RuntimeTile["tile"] | null {
    if (!this.bulletState) {
      return null;
    }

    return {
      x: this.bulletState.x,
      y: this.bulletState.y,
      width: 2,
      height: 2,
      collisionDx: 0,
      collisionDy: 0,
      collisionDw: 0,
      collisionDh: 0,
      mod: TileMod.EMPTY,
      firstSprite: 1
    };
  }

  private handleCombatInteractions(): void {
    if (!this.dave) {
      return;
    }

    let bulletTile = this.bulletAsTile();
    for (const runtimeMonster of this.runtimeMonsters) {
      if (bulletTile && collisionDetect(bulletTile, runtimeMonster.entity.tile)) {
        if (runtimeMonster.entity.onFire !== 1) {
          runtimeMonster.entity.onFire = 1;
          this.destroyBullet();
          this.playTune("explosion", { restart: true });
          bulletTile = null;
        }
      }

      if (collisionDetect(this.dave.tile, runtimeMonster.entity.tile)) {
        if (isMonsterAlive(runtimeMonster.entity)) {
          this.dave.onFire = 1;
          runtimeMonster.entity.onFire = 1;
          this.playTune("explosion", { restart: true });
        }
      }
    }
  }

  private destroyBullet(): void {
    this.bulletState = null;
    if (this.bulletImage) {
      this.bulletImage.destroy();
      this.bulletImage = null;
    }
  }

  private handleDaveInteractions(): void {
    if (!this.dave) {
      return;
    }

    let didPlayFireSound = false;
    for (const runtime of this.runtimeTiles) {
      const tile = runtime.tile;
      if (tile.firstSprite === 0) {
        continue;
      }

      if (!collisionDetect(this.dave.tile, tile)) {
        continue;
      }

      if (tile.mod === TileMod.LOOT) {
        this.score += tile.scoreValue ?? 0;
        this.playTune("treasure", { restart: true });
        this.consumeTile(runtime);
      } else if (tile.mod === TileMod.TROPHY) {
        this.dave.hasTrophy = 1;
        this.score += tile.scoreValue ?? 0;
        this.playTune("got_trophy", { restart: true });
        this.consumeTile(runtime);
      } else if (tile.mod === TileMod.GUN) {
        this.dave.hasGun = 1;
        this.score += tile.scoreValue ?? 0;
        this.playTune("got_something", { restart: true });
        this.consumeTile(runtime);
      } else if (tile.mod === TileMod.JETPACK) {
        this.dave.jetpackBars = 900;
        this.playTune("got_something", { restart: true });
        this.consumeTile(runtime);
      } else if (tile.mod === TileMod.FIRE) {
        if (this.dave.onFire !== 1 && !didPlayFireSound) {
          this.playTune("ouch", { restart: true });
          didPlayFireSound = true;
        }
        this.dave.onFire = 1;
      } else if (tile.mod === TileMod.CLIMB) {
        this.dave.onTree = 1;
      } else if (tile.mod === TileMod.DOOR) {
        if (this.dave.hasTrophy === 1) {
          this.startDoorTransition();
          return;
        }
      }
    }
  }

  private consumeTile(runtime: RuntimeTile): void {
    runtime.tile.firstSprite = 0;
    runtime.tile.mod = TileMod.EMPTY;
    runtime.tile.scoreValue = 0;
    if (runtime.image) {
      runtime.image.setVisible(false);
    }
  }

  private handleDaveDeath(): void {
    if (!this.dave) {
      return;
    }

    this.lives = Math.max(0, this.lives - 1);
    if (this.lives > 0) {
      resetDaveAfterDeath(this.dave);
      this.updateHud();
      return;
    }

    this.ready = false;
    this.isTransitioning = true;
    this.setLoading("Game over...");
    this.cameras.main.fadeOut(220, 0, 0, 0);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, async () => {
      this.lives = 4;
      this.score = 0;
      this.uiMode = reduceUiMode("gameplay", "game_over");
      this.returnToIntro("GAME OVER. PRESS ENTER OR SPACE TO START");
      this.cameras.main.fadeIn(220, 0, 0, 0);
    });
  }

  private addHudSprite(spriteIndex: number, x: number, y: number, depth = 20): any | null {
    const key = tileKey(spriteIndex);
    if (!this.textures.exists(key)) {
      return null;
    }
    return this.add.image(x, y, key).setOrigin(0, 0).setScrollFactor(0).setDepth(depth);
  }

  private initializeHudSprites(): void {
    if (this.hudTopSeparator) {
      return;
    }

    this.hudTopSeparator = this.addHudSprite(172, 0, 11);
    this.hudBottomSeparator = this.addHudSprite(171, 0, 166);
    this.hudScoreLabel = this.addHudSprite(137, 0, 0);
    this.hudLevelLabel = this.addHudSprite(136, 104, 0);
    this.hudLevelTens = this.addHudSprite(148, 176, 0);
    this.hudLevelOnes = this.addHudSprite(148, 184, 0);
    this.hudLivesLabel = this.addHudSprite(135, 192, 0);
    this.hudTrophyBanner = this.addHudSprite(138, 70, 183);
    this.hudGunBanner = this.addHudSprite(134, 240, 170);
    this.hudJetpackLabel = this.addHudSprite(133, 0, 170);
    this.hudJetpackFrame = this.addHudSprite(141, 72, 170);

    this.hudScoreDigits = [];
    for (let i = 0; i < 5; i += 1) {
      const image = this.addHudSprite(148, 96 - (8 * i), 0);
      if (image) {
        this.hudScoreDigits.push(image);
      }
    }

    this.hudLivesIcons = [];
    for (let i = 0; i < 4; i += 1) {
      const image = this.addHudSprite(143, 256 + (16 * i), 0);
      if (image) {
        this.hudLivesIcons.push(image);
      }
    }

    this.hudJetpackBars = [];
    for (let i = 0; i < 60; i += 1) {
      const image = this.addHudSprite(142, 76 + (2 * i), 174);
      if (image) {
        this.hudJetpackBars.push(image);
      }
    }
  }

  private setHudVisible(visible: boolean): void {
    const nodes = [
      this.hudTopSeparator,
      this.hudBottomSeparator,
      this.hudScoreLabel,
      this.hudLevelLabel,
      this.hudLevelTens,
      this.hudLevelOnes,
      this.hudLivesLabel,
      this.hudGunBanner,
      this.hudTrophyBanner,
      this.hudJetpackLabel,
      this.hudJetpackFrame
    ];
    for (const node of nodes) {
      if (node) {
        node.setVisible(visible);
      }
    }
    for (const node of this.hudScoreDigits) {
      node.setVisible(visible);
    }
    for (const node of this.hudLivesIcons) {
      node.setVisible(visible);
    }
    for (const node of this.hudJetpackBars) {
      node.setVisible(visible);
    }
  }

  private updateHud(): void {
    const digits = scoreDigits(this.score, 5);
    for (let i = 0; i < this.hudScoreDigits.length && i < digits.length; i += 1) {
      const key = tileKey(148 + digits[i]);
      if (this.textures.exists(key)) {
        this.hudScoreDigits[i].setTexture(key);
      }
    }

    const level = Math.max(0, Math.min(9, levelNumberFromFile(this.currentLevelFile)));
    if (this.hudLevelOnes) {
      const key = tileKey(148 + level);
      if (this.textures.exists(key)) {
        this.hudLevelOnes.setTexture(key);
      }
    }

    for (let i = 0; i < this.hudLivesIcons.length; i += 1) {
      this.hudLivesIcons[i].setVisible(i < (this.lives - 1) && i < 4);
    }

    if (!this.dave) {
      return;
    }

    if (this.hudTrophyBanner) {
      this.hudTrophyBanner.setVisible(this.dave.hasTrophy === 1);
    }
    if (this.hudGunBanner) {
      this.hudGunBanner.setVisible(this.dave.hasGun === 1);
    }

    const clampedBars = Math.max(0, Math.min(900, this.dave.jetpackBars));
    const visibleBars = Math.floor(clampedBars / 15);
    if (this.hudJetpackLabel) {
      this.hudJetpackLabel.setVisible(visibleBars > 0);
    }
    if (this.hudJetpackFrame) {
      this.hudJetpackFrame.setVisible(visibleBars > 0);
    }
    for (let i = 0; i < this.hudJetpackBars.length; i += 1) {
      this.hudJetpackBars[i].setVisible(i < visibleBars);
    }
  }

  private startDoorTransition(): void {
    if (this.isTransitioning) {
      return;
    }

    this.ready = false;
    this.isTransitioning = true;
    const next = nextMainLevel(this.currentLevelFile);
    const loadingMessage = next.wrapped
      ? "All main levels complete. Restarting at level1..."
      : `Transitioning to ${next.nextLevel}...`;

    this.setLoading(loadingMessage);
    this.playTune("nextlevel", { restart: true });
    this.cameras.main.fadeOut(220, 0, 0, 0);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, async () => {
      await this.loadLevel(next.nextLevel);
      this.cameras.main.fadeIn(220, 0, 0, 0);
    });
  }

  private stepAnimations(): void {
    for (const animated of this.animatedTiles) {
      if (animated.runtime.tile.firstSprite === 0) {
        if (animated.image.visible) {
          animated.image.setVisible(false);
        }
        continue;
      }

      const frame = animated.frames[this.logicTick % animated.frames.length];
      const key = tileKey(frame);
      if (this.textures.exists(key)) {
        animated.image.setTexture(key);
      }
    }
  }

  private tagToMod(tag: string): TileMod {
    if (
      tag === "RBK" ||
      tag === "BBK" ||
      tag === "PPK" ||
      tag === "PCK" ||
      tag === "DRT" ||
      tag === "BIM" ||
      tag === "DRB" ||
      tag === "BCM" ||
      tag === "PIR" ||
      tag === "PID" ||
      tag === "DR1" ||
      tag === "DR2" ||
      tag === "DR3" ||
      tag === "DR4"
    ) {
      return TileMod.BRICK;
    }

    if (tag === " X ") {
      return TileMod.DOOR;
    }

    if (tag === "GUN") {
      return TileMod.GUN;
    }

    if (tag === "JPK") {
      return TileMod.JETPACK;
    }

    if (tag === " * " || tag === " v " || tag === " V " || tag === " O " || tag === " W " || tag === " ! ") {
      return TileMod.LOOT;
    }

    if (tag === " Y ") {
      return TileMod.TROPHY;
    }

    if (tag === "D+M") {
      return TileMod.MOSS;
    }

    if (
      tag === "FR1" ||
      tag === "FR2" ||
      tag === "FR3" ||
      tag === "FR4" ||
      tag === "VI1" ||
      tag === "VI2" ||
      tag === "VI3" ||
      tag === "VI4" ||
      tag === "WT1" ||
      tag === "WT2" ||
      tag === "WT3" ||
      tag === "WT4" ||
      tag === "WT5"
    ) {
      return TileMod.FIRE;
    }

    if (
      tag === "TRK" ||
      tag === "TR1" ||
      tag === "TR2" ||
      tag === "TR3" ||
      tag === "TR4" ||
      tag === "TR5" ||
      tag === "TR6" ||
      tag === "STR" ||
      tag === "MON"
    ) {
      return TileMod.CLIMB;
    }

    return TileMod.EMPTY;
  }

  private tagCollisionAdjustments(tag: string): {
    collisionDx: number;
    collisionDy: number;
    collisionDw: number;
    collisionDh: number;
  } {
    if (tag === " X ") {
      return { collisionDx: 0, collisionDy: 0, collisionDw: 0, collisionDh: 4 };
    }

    if (tag === "FR1" || tag === "FR2" || tag === "FR3" || tag === "FR4") {
      return { collisionDx: 6, collisionDy: 0, collisionDw: -12, collisionDh: 0 };
    }

    if (tag === "VI1" || tag === "VI2" || tag === "VI3" || tag === "VI4") {
      return { collisionDx: 4, collisionDy: 0, collisionDw: -8, collisionDh: 0 };
    }

    if (tag === "WT1" || tag === "WT2" || tag === "WT3" || tag === "WT4" || tag === "WT5") {
      return { collisionDx: 6, collisionDy: 4, collisionDw: -12, collisionDh: -8 };
    }

    if (tag === "STR") {
      return { collisionDx: 7, collisionDy: 7, collisionDw: -14, collisionDh: -4 };
    }

    if (tag === "MON") {
      return { collisionDx: 0, collisionDy: 3, collisionDw: 0, collisionDh: 0 };
    }

    return { collisionDx: 0, collisionDy: 0, collisionDw: 0, collisionDh: 0 };
  }
}

function createGame(): void {
  const config: any = {
    type: Phaser.AUTO,
    parent: "game",
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    pixelArt: true,
    backgroundColor: "#000000",
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH
    },
    scene: [StaticMapScene]
  };

  new Phaser.Game(config);
}

createGame();
