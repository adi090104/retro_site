// A looping pixel-art scene, drawn at 160x120 and scaled up with nearest-neighbour.
export const SCENE_W = 160;
export const SCENE_H = 120;

/** Frames in one drink cycle (rest, raise glass, sip, lower). */
const SIP_CYCLE = 70;
const WATER_TOP = 63;

const C = {
  sky: ['#4fb4ee', '#6fc6f4', '#94d8f8', '#bde9fb'],
  sun: '#ffe14d',
  sunCore: '#fff6b0',
  cloud: '#ffffff',
  cloudShade: '#d6ecf9',
  hedge: '#3c9a48',
  hedgeDark: '#2b7636',
  deck: '#ecd3a3',
  deckLine: '#d3b67f',
  coping: '#f6f2e6',
  copingLine: '#c9c2ad',
  tile: '#0f5f9c',
  tileLight: '#e9f6ff',
  water: '#22a6dd',
  waterDeep: '#1a8cc4',
  waterLight: '#86e0ff',
  waterShadow: '#167fb5',
  trunk: '#8b5a2b',
  trunkDark: '#6b4220',
  leaf: '#2e8b3e',
  leafLight: '#55c262',
  coconut: '#6b3e1f',
  skin: '#f1c27d',
  skinShade: '#d9a066',
  blush: '#f59a8a',
  hair: '#5a3214',
  hat: '#f2d47f',
  hatBrim: '#e2bd5c',
  hatBand: '#e53935',
  shades: '#111111',
  mouth: '#9c4a2a',
  trunks: '#e53935',
  trunksStripe: '#ffffff',
  ringA: '#ff5fa2',
  ringAShade: '#d63f82',
  ringB: '#ffffff',
  ringBShade: '#e3d3de',
  glass: '#e8f8ff',
  glassBottom: '#bfe6f5',
  lemonade: '#fff176',
  lemon: '#ffd21f',
  lemonLight: '#fff59d',
  straw: '#ff3b3b',
  strawB: '#ffffff',
  duck: '#ffd400',
  duckShade: '#e0a800',
  duckBeak: '#ff8c00',
  heart: '#ff4f81',
  white: '#ffffff',
  black: '#000000',
  pole: '#dddddd',
  umbrellaA: '#e53935',
  umbrellaB: '#ffffff',
};

type Ctx = CanvasRenderingContext2D;

function rect(ctx: Ctx, x: number, y: number, w: number, h: number, color: string) {
  ctx.fillStyle = color;
  ctx.fillRect(Math.round(x), Math.round(y), w, h);
}

const px = (ctx: Ctx, x: number, y: number, color: string) => rect(ctx, x, y, 1, 1, color);

function line(ctx: Ctx, x0: number, y0: number, x1: number, y1: number, color: string | ((i: number) => string), size = 1) {
  const steps = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1);
  for (let i = 0; i <= steps; i++) {
    const c = typeof color === 'string' ? color : color(i);
    rect(ctx, x0 + ((x1 - x0) * i) / steps, y0 + ((y1 - y0) * i) / steps, size, size, c);
  }
}

function ellipse(ctx: Ctx, cx: number, cy: number, rx: number, ry: number, color: string) {
  for (let y = -ry; y <= ry; y++) {
    const half = Math.round(rx * Math.sqrt(Math.max(0, 1 - (y * y) / (ry * ry))));
    rect(ctx, cx - half, cy + y, half * 2 + 1, 1, color);
  }
}

/** Draws a sprite from rows of characters; '.' is transparent. */
function sprite(ctx: Ctx, x: number, y: number, rows: string[], palette: Record<string, string>) {
  rows.forEach((row, dy) => {
    for (let dx = 0; dx < row.length; dx++) {
      const c = palette[row[dx]];
      if (c) px(ctx, x + dx, y + dy, c);
    }
  });
}

const smooth = (p: number) => p * p * (3 - 2 * p);
const lerp = (a: number, b: number, p: number) => a + (b - a) * p;

// ---------------------------------------------------------------- background

function drawSky(ctx: Ctx) {
  const bands = [0, 10, 20, 30];
  bands.forEach((y, i) => rect(ctx, 0, y, SCENE_W, 10, C.sky[i]));
  // Dither the band edges so the gradient reads as 1998-era 256 colours.
  for (let i = 1; i < bands.length; i++) {
    for (let x = 0; x < SCENE_W; x++) {
      if (x % 2 === 0) px(ctx, x, bands[i] - 1, C.sky[i]);
      else px(ctx, x, bands[i], C.sky[i - 1]);
    }
  }
}

function drawSun(ctx: Ctx, t: number) {
  const cx = 134;
  const cy = 13;
  for (let i = 0; i < 8; i++) {
    const a = (i * Math.PI) / 4 + t * 0.015;
    const len = 11 + ((i + Math.floor(t / 5)) % 2) * 2;
    for (let r = 9; r <= len; r++) px(ctx, cx + Math.cos(a) * r, cy + Math.sin(a) * r, C.sun);
  }
  ellipse(ctx, cx, cy, 7, 7, C.sun);
  ellipse(ctx, cx - 1, cy - 1, 4, 4, C.sunCore);
}

function drawCloud(ctx: Ctx, x: number, y: number) {
  rect(ctx, x + 5, y, 9, 2, C.cloud);
  rect(ctx, x + 2, y + 2, 17, 2, C.cloud);
  rect(ctx, x, y + 4, 23, 2, C.cloud);
  rect(ctx, x + 2, y + 6, 19, 1, C.cloudShade);
}

function drawHedge(ctx: Ctx) {
  rect(ctx, 0, 36, SCENE_W, 8, C.hedge);
  for (let x = 0; x < SCENE_W; x += 6) ellipse(ctx, x + 3, 36, 3, 2, C.hedge);
  for (let y = 34; y < 44; y++) {
    for (let x = 0; x < SCENE_W; x++) if ((x * 7 + y * 3) % 11 === 0) px(ctx, x, y, C.hedgeDark);
  }
}

function drawDeck(ctx: Ctx) {
  rect(ctx, 0, 44, SCENE_W, 14, C.deck);
  for (let y = 44; y < 58; y += 5) rect(ctx, 0, y, SCENE_W, 1, C.deckLine);
  for (let row = 0; row < 3; row++) {
    for (let x = (row % 2) * 6; x < SCENE_W; x += 12) rect(ctx, x, 44 + row * 5, 1, 5, C.deckLine);
  }
}

function drawUmbrella(ctx: Ctx) {
  const x = 148;
  rect(ctx, x, 22, 1, 34, C.pole);
  for (let r = 0; r < 7; r++) {
    const w = 4 + r * 4;
    for (let dx = 0; dx < w; dx++) {
      const gx = x - w / 2 + dx;
      px(ctx, gx, 17 + r, Math.floor((gx - x + 40) / 4) % 2 ? C.umbrellaA : C.umbrellaB);
    }
  }
  for (let dx = -14; dx <= 14; dx += 4) px(ctx, x + dx, 24, C.umbrellaA);
}

function drawSideTable(ctx: Ctx) {
  // A refill pitcher, for obvious reasons.
  rect(ctx, 114, 52, 14, 2, C.white);
  rect(ctx, 116, 54, 1, 4, C.white);
  rect(ctx, 125, 54, 1, 4, C.white);
  rect(ctx, 117, 43, 7, 9, C.glass);
  rect(ctx, 118, 45, 5, 6, C.lemonade);
  rect(ctx, 124, 45, 1, 4, C.glass);
  px(ctx, 125, 46, C.glass);
  px(ctx, 125, 47, C.glass);
  rect(ctx, 119, 46, 2, 2, C.lemon);
}

function drawPalm(ctx: Ctx, t: number) {
  const height = 44;
  let top = { x: 0, y: 0 };
  for (let k = 0; k <= height; k++) {
    const x = 8 + Math.round(Math.sin((k / height) * 1.3) * 10);
    const y = 58 - k;
    rect(ctx, x, y, 4, 1, k % 4 === 0 ? C.trunkDark : C.trunk);
    top = { x: x + 2, y };
  }
  const sway = Math.sin(t * 0.12) * 0.08;
  const fronds = [Math.PI + 0.35, Math.PI - 0.25, -Math.PI / 2 - 0.7, -Math.PI / 2 + 0.6, -0.25, 0.35];
  for (const base of fronds) {
    const a = base + sway;
    const len = 17;
    for (let k = 0; k <= len; k++) {
      const x = top.x + Math.cos(a) * k;
      const y = top.y + Math.sin(a) * k + k * k * 0.035;
      const size = k < len * 0.6 ? 2 : 1;
      rect(ctx, x, y, size, size, C.leaf);
      if (k % 2) px(ctx, x, y - 1, C.leafLight);
    }
  }
  ellipse(ctx, top.x - 1, top.y + 2, 2, 2, C.coconut);
  ellipse(ctx, top.x + 3, top.y + 3, 2, 2, C.coconut);
}

function drawPoolEdge(ctx: Ctx) {
  rect(ctx, 0, 58, SCENE_W, 3, C.coping);
  for (let x = 0; x < SCENE_W; x += 10) rect(ctx, x, 58, 1, 3, C.copingLine);
  rect(ctx, 0, 60, SCENE_W, 1, C.copingLine);
  rect(ctx, 0, 61, SCENE_W, 2, C.tile);
  for (let x = 0; x < SCENE_W; x += 4) px(ctx, x, 61, C.tileLight);
}

// ---------------------------------------------------------------- water

const hexToRgb = (hex: string) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
const WATER_RGB = {
  base: hexToRgb(C.water),
  deep: hexToRgb(C.waterDeep),
  light: hexToRgb(C.waterLight),
};

function drawWater(ctx: Ctx, t: number) {
  const h = SCENE_H - WATER_TOP;
  const img = ctx.createImageData(SCENE_W, h);
  for (let y = 0; y < h; y++) {
    const depth = y / h;
    for (let x = 0; x < SCENE_W; x++) {
      const wave =
        Math.sin(x * 0.21 + t * 0.18 + Math.sin(y * 0.4 + t * 0.1) * 1.5) + Math.sin(y * 0.55 - t * 0.22 + x * 0.05);
      let rgb = depth > 0.7 || (depth > 0.5 && (x + y) % 2 === 0) ? WATER_RGB.deep : WATER_RGB.base;
      if (wave > 1.55) rgb = WATER_RGB.light;
      const i = (y * SCENE_W + x) * 4;
      img.data[i] = rgb[0];
      img.data[i + 1] = rgb[1];
      img.data[i + 2] = rgb[2];
      img.data[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, WATER_TOP);

  for (let i = 0; i < 7; i++) {
    const x = (i * 37 + 11) % SCENE_W;
    const y = WATER_TOP + 4 + ((i * 13) % 50);
    const phase = (t + i * 5) % 20;
    if (phase < 3) px(ctx, x, y, C.white);
    if (phase === 1) {
      px(ctx, x - 1, y, C.waterLight);
      px(ctx, x + 1, y, C.waterLight);
      px(ctx, x, y - 1, C.waterLight);
      px(ctx, x, y + 1, C.waterLight);
    }
  }
}

function drawRipples(ctx: Ctx, cx: number, cy: number, t: number) {
  for (let k = 0; k < 2; k++) {
    const r = (t * 0.4 + k * 12) % 24;
    if (r > 20) continue;
    const rx = 18 + r;
    const ry = 6 + r * 0.35;
    for (let a = 0, step = 0; a < Math.PI * 2; a += 0.07, step++) {
      if (step % 3 === 0) continue;
      const y = cy + Math.sin(a) * ry;
      if (y > WATER_TOP + 1) px(ctx, cx + Math.cos(a) * rx, y, C.waterLight);
    }
  }
}

// ---------------------------------------------------------------- floaties

function drawRing(ctx: Ctx, cx: number, cy: number, half: 'back' | 'front') {
  const rx = 17;
  const ry = 6.5;
  const irx = 9;
  const iry = 3;
  for (let y = -7; y <= 7; y++) {
    if (half === 'back' ? y >= 0 : y < 0) continue;
    for (let x = -18; x <= 18; x++) {
      const outer = (x * x) / (rx * rx) + (y * y) / (ry * ry);
      const inner = (x * x) / (irx * irx) + (y * y) / (iry * iry);
      if (outer > 1 || inner <= 1) continue;
      const angle = Math.atan2(y / ry, x / rx);
      const stripe = Math.floor(((angle + Math.PI) / (Math.PI * 2)) * 8) % 2 === 0;
      const shaded = y > 0 && outer > 0.6;
      const color = stripe ? (shaded ? C.ringAShade : C.ringA) : shaded ? C.ringBShade : C.ringB;
      px(ctx, cx + x, cy + y, color);
    }
  }
  if (half === 'back') {
    px(ctx, cx - 11, cy - 5, C.white);
    px(ctx, cx - 10, cy - 5, C.white);
  }
}

function drawDuck(ctx: Ctx, t: number) {
  const x = Math.round(30 + Math.sin(t * 0.03) * 10);
  const y = 106 + Math.round(Math.sin(t * 0.25 + 1));
  rect(ctx, x - 5, y + 2, 11, 1, C.waterLight);
  ellipse(ctx, x, y, 4, 2, C.duck);
  rect(ctx, x - 3, y + 1, 6, 1, C.duckShade);
  ellipse(ctx, x + 3, y - 3, 2, 2, C.duck);
  rect(ctx, x + 5, y - 3, 2, 1, C.duckBeak);
  px(ctx, x + 3, y - 4, C.black);
  px(ctx, x - 4, y - 1, C.duck);
}

function drawBeachBall(ctx: Ctx, t: number) {
  const cx = 134;
  const cy = 98 + Math.round(Math.sin(t * 0.2 + 2));
  const colors = ['#e53935', C.white, '#1e6bff', C.white, '#ffd400', C.white];
  rect(ctx, cx - 5, cy + 4, 11, 1, C.waterLight);
  for (let y = -4; y <= 4; y++) {
    for (let x = -4; x <= 4; x++) {
      if (x * x + y * y > 18) continue;
      const seg = Math.floor(((Math.atan2(y, x) + Math.PI + t * 0.03) / (Math.PI * 2)) * 6) % 6;
      px(ctx, cx + x, cy + y, colors[seg]);
    }
  }
  px(ctx, cx - 2, cy - 2, C.white);
}

const HEART = ['.X.X.', 'XXXXX', '.XXX.', '..X..'];

// ---------------------------------------------------------------- the chill guy

export interface SceneInfo {
  sipping: boolean;
  /** Remaining lemonade, 0..100. */
  lemonade: number;
}

function drawGuy(ctx: Ctx, t: number): SceneInfo {
  const cx = 80 + Math.round(Math.sin(t * 0.02) * 6);
  const cy = 92 + Math.round(Math.sin(t * 0.2));

  // Drink cycle: rest -> raise -> sip -> lower -> rest.
  const f = t % SIP_CYCLE;
  let p = 0;
  if (f >= 28 && f < 36) p = smooth((f - 28) / 8);
  else if (f >= 36 && f < 52) p = 1;
  else if (f >= 52 && f < 60) p = smooth(1 - (f - 52) / 8);
  const sipping = f >= 36 && f < 52;
  const level = 6 - (Math.floor(t / SIP_CYCLE) % 4);

  drawRipples(ctx, cx, cy + 2, t);
  ellipse(ctx, cx, cy + 4, 17, 5, C.waterShadow);
  drawRing(ctx, cx, cy, 'back');

  // Torso and trunks.
  rect(ctx, cx - 5, cy - 9, 10, 10, C.skin);
  rect(ctx, cx + 4, cy - 9, 1, 10, C.skinShade);
  px(ctx, cx - 2, cy - 6, C.skinShade);
  px(ctx, cx + 1, cy - 6, C.skinShade);
  px(ctx, cx, cy - 2, C.skinShade);
  rect(ctx, cx - 5, cy, 10, 2, C.trunks);
  rect(ctx, cx - 5, cy, 1, 2, C.trunksStripe);
  rect(ctx, cx - 1, cy - 11, 3, 2, C.skinShade);

  // Head, hat and shades.
  rect(ctx, cx - 4, cy - 19, 8, 8, C.skin);
  rect(ctx, cx - 5, cy - 18, 1, 4, C.hair);
  rect(ctx, cx + 4, cy - 18, 1, 3, C.hair);
  px(ctx, cx - 5, cy - 15, C.skin);
  px(ctx, cx + 4, cy - 15, C.skin);
  rect(ctx, cx - 4, cy - 23, 8, 4, C.hat);
  rect(ctx, cx - 4, cy - 20, 8, 1, C.hatBand);
  rect(ctx, cx - 8, cy - 19, 16, 1, C.hatBrim);
  rect(ctx, cx - 4, cy - 17, 3, 2, C.shades);
  rect(ctx, cx + 1, cy - 17, 3, 2, C.shades);
  px(ctx, cx - 1, cy - 17, C.shades);
  if (t % 50 < 3) {
    px(ctx, cx - 3, cy - 17, C.white);
    px(ctx, cx + 2, cy - 17, C.white);
  }
  px(ctx, cx - 4, cy - 14, C.blush);
  px(ctx, cx + 3, cy - 14, C.blush);
  if (sipping) {
    px(ctx, cx + 1, cy - 13, C.mouth);
  } else {
    rect(ctx, cx - 1, cy - 13, 3, 1, C.mouth);
    px(ctx, cx - 2, cy - 14, C.mouth);
    px(ctx, cx + 2, cy - 14, C.mouth);
  }

  // Left arm lounging on the ring.
  line(ctx, cx - 6, cy - 8, cx - 10, cy - 5, C.skin, 2);
  line(ctx, cx - 10, cy - 5, cx - 15, cy - 3, C.skin, 2);

  drawRing(ctx, cx, cy, 'front');

  // Legs draped over the front of the ring, lazily kicking.
  const kick = Math.sin(t * 0.5) > 0 ? 1 : 0;
  line(ctx, cx - 3, cy + 2, cx - 4, cy + 7, C.skin, 2);
  line(ctx, cx + 2, cy + 2, cx + 3, cy + 7, C.skin, 2);
  ctx.globalAlpha = 0.55;
  rect(ctx, cx - 4, cy + 8 + kick, 2, 2, C.skin);
  rect(ctx, cx + 3, cy + 9 - kick, 2, 2, C.skin);
  ctx.globalAlpha = 1;
  if (t % 6 === 0) {
    px(ctx, cx - 6, cy + 8, C.white);
    px(ctx, cx + 6, cy + 9, C.white);
  }

  // Right arm with the lemonade.
  const handX = Math.round(lerp(cx + 12, cx + 7, p));
  const handY = Math.round(lerp(cy - 2, cy - 4, p));
  line(ctx, cx + 4, cy - 8, handX - 1, handY - 2, C.skin, 2);

  const gx = handX - 2;
  const gy = handY - 8;
  rect(ctx, gx, gy, 5, 8, C.glass);
  rect(ctx, gx + 1, gy + 8 - level, 3, level - 1, C.lemonade);
  px(ctx, gx + 1, gy + 8 - level, C.white);
  px(ctx, gx + 3, gy + 9 - level, C.white);
  rect(ctx, gx, gy + 7, 5, 1, C.glassBottom);

  const bendX = gx + 3;
  const bendY = gy - 2;
  const tipX = Math.round(lerp(gx + 1, cx + 2, p));
  const tipY = Math.round(lerp(gy - 5, cy - 13, p));
  const strawColor = (i: number) => (i % 2 ? C.strawB : C.straw);
  line(ctx, bendX, gy + 2, bendX, bendY, strawColor);
  line(ctx, bendX, bendY, tipX, tipY, sipping && f % 4 < 2 ? C.lemonade : strawColor);

  rect(ctx, gx + 3, gy - 1, 3, 2, C.lemon);
  px(ctx, gx + 4, gy - 1, C.lemonLight);
  rect(ctx, handX - 3, handY - 3, 2, 2, C.skin);

  // Little hearts of contentment after each sip.
  if (f >= 52) {
    const rise = (f - 52) * 0.6;
    sprite(ctx, cx + 6, cy - 26 - rise, HEART, { X: C.heart });
    if (f >= 58) sprite(ctx, cx + 11, cy - 24 - (f - 58) * 0.6, HEART, { X: C.heart });
  }

  return { sipping, lemonade: Math.round(((level - 1) / 5) * 100) };
}

export function drawPoolScene(ctx: Ctx, t: number): SceneInfo {
  drawWater(ctx, t);
  drawSky(ctx);
  drawSun(ctx, t);
  drawCloud(ctx, Math.round(((t * 0.25) % (SCENE_W + 50)) - 30), 5);
  drawCloud(ctx, Math.round(((t * 0.15 + 95) % (SCENE_W + 50)) - 30), 17);
  drawHedge(ctx);
  drawDeck(ctx);
  drawUmbrella(ctx);
  drawSideTable(ctx);
  drawPalm(ctx, t);
  drawPoolEdge(ctx);
  drawDuck(ctx, t);
  drawBeachBall(ctx, t);
  return drawGuy(ctx, t);
}
