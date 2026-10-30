export const COLS = 10;
export const ROWS = 20;

export type PieceType = 'I' | 'O' | 'T' | 'S' | 'Z' | 'J' | 'L';
type Shape = number[][];

const SHAPES: Record<PieceType, Shape> = {
  I: [
    [0, 0, 0, 0],
    [1, 1, 1, 1],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  ],
  O: [
    [1, 1],
    [1, 1],
  ],
  T: [
    [0, 1, 0],
    [1, 1, 1],
    [0, 0, 0],
  ],
  S: [
    [0, 1, 1],
    [1, 1, 0],
    [0, 0, 0],
  ],
  Z: [
    [1, 1, 0],
    [0, 1, 1],
    [0, 0, 0],
  ],
  J: [
    [1, 0, 0],
    [1, 1, 1],
    [0, 0, 0],
  ],
  L: [
    [0, 0, 1],
    [1, 1, 1],
    [0, 0, 0],
  ],
};

export const PIECE_TYPES = Object.keys(SHAPES) as PieceType[];

export const PIECE_COLORS: Record<PieceType, string> = {
  I: '#00c8d8',
  O: '#e8d000',
  T: '#a020d8',
  S: '#20c020',
  Z: '#e02020',
  J: '#2050f0',
  L: '#f08000',
};

export interface Piece {
  type: PieceType;
  shape: Shape;
  x: number;
  y: number;
}

export type Board = (PieceType | null)[][];
export type GameStatus = 'ready' | 'playing' | 'paused' | 'over';
export type GameEvent = 'move' | 'rotate' | 'lock' | 'clear' | 'over' | null;

export interface Game {
  board: Board;
  piece: Piece | null;
  next: PieceType;
  bag: PieceType[];
  score: number;
  lines: number;
  level: number;
  status: GameStatus;
  /** Full rows waiting to be removed after their flash animation. */
  clearing: number[] | null;
}

const LINE_SCORES = [0, 100, 300, 500, 800];
const KICKS = [0, -1, 1, -2, 2];

const emptyBoard = (): Board => Array.from({ length: ROWS }, () => Array<PieceType | null>(COLS).fill(null));

export const shapeOf = (type: PieceType) => SHAPES[type];

const rotateCW = (m: Shape): Shape => m[0].map((_, i) => m.map((row) => row[i]).reverse());

/** "7-bag" randomizer: every piece appears once per seven. */
function takeFromBag(game: Pick<Game, 'bag'>): PieceType {
  if (!game.bag.length) {
    game.bag = [...PIECE_TYPES];
    for (let i = game.bag.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [game.bag[i], game.bag[j]] = [game.bag[j], game.bag[i]];
    }
  }
  return game.bag.pop()!;
}

function collides(board: Board, shape: Shape, x: number, y: number): boolean {
  for (let r = 0; r < shape.length; r++) {
    for (let c = 0; c < shape[r].length; c++) {
      if (!shape[r][c]) continue;
      const bx = x + c;
      const by = y + r;
      if (bx < 0 || bx >= COLS || by >= ROWS) return true;
      if (by >= 0 && board[by][bx]) return true;
    }
  }
  return false;
}

function spawn(game: Game): GameEvent {
  const type = game.next;
  game.next = takeFromBag(game);
  const shape = SHAPES[type];
  const piece = { type, shape, x: Math.floor((COLS - shape[0].length) / 2), y: type === 'I' ? -1 : 0 };
  if (collides(game.board, piece.shape, piece.x, piece.y)) {
    game.piece = null;
    game.status = 'over';
    return 'over';
  }
  game.piece = piece;
  return null;
}

export function createGame(status: GameStatus = 'playing'): Game {
  const game: Game = {
    board: emptyBoard(),
    piece: null,
    next: 'T',
    bag: [],
    score: 0,
    lines: 0,
    level: 1,
    status,
    clearing: null,
  };
  game.next = takeFromBag(game);
  if (status === 'playing') spawn(game);
  return game;
}

export function move(game: Game, dx: number, dy: number): boolean {
  const p = game.piece;
  if (!p || collides(game.board, p.shape, p.x + dx, p.y + dy)) return false;
  p.x += dx;
  p.y += dy;
  return true;
}

export function rotate(game: Game, clockwise = true): boolean {
  const p = game.piece;
  if (!p || p.type === 'O') return false;
  let shape = rotateCW(p.shape);
  if (!clockwise) shape = rotateCW(rotateCW(shape));
  for (const dx of KICKS) {
    if (!collides(game.board, shape, p.x + dx, p.y)) {
      p.shape = shape;
      p.x += dx;
      return true;
    }
  }
  return false;
}

function lock(game: Game): GameEvent {
  const p = game.piece;
  if (!p) return null;
  let toppedOut = false;
  p.shape.forEach((row, r) =>
    row.forEach((cell, c) => {
      if (!cell) return;
      if (p.y + r < 0) toppedOut = true;
      else game.board[p.y + r][p.x + c] = p.type;
    }),
  );
  game.piece = null;
  if (toppedOut) {
    game.status = 'over';
    return 'over';
  }
  const full = game.board.flatMap((row, i) => (row.every(Boolean) ? [i] : []));
  if (full.length) {
    game.clearing = full;
    return 'clear';
  }
  return spawn(game) ?? 'lock';
}

/** Call once the clear animation is done. */
export function finishClear(game: Game): GameEvent {
  const rows = game.clearing ?? [];
  game.board = game.board.filter((_, i) => !rows.includes(i));
  while (game.board.length < ROWS) game.board.unshift(Array<PieceType | null>(COLS).fill(null));
  game.lines += rows.length;
  game.score += LINE_SCORES[rows.length] * game.level;
  game.level = Math.floor(game.lines / 10) + 1;
  game.clearing = null;
  return spawn(game);
}

/** One gravity tick (or a soft drop when `soft`). */
export function step(game: Game, soft = false): GameEvent {
  if (move(game, 0, 1)) {
    if (soft) game.score += 1;
    return 'move';
  }
  return lock(game);
}

export function hardDrop(game: Game): GameEvent {
  let dropped = 0;
  while (move(game, 0, 1)) dropped++;
  game.score += dropped * 2;
  return lock(game);
}

export function ghostY(game: Game): number | null {
  const p = game.piece;
  if (!p) return null;
  let y = p.y;
  while (!collides(game.board, p.shape, p.x, y + 1)) y++;
  return y;
}

export const gravityMs = (level: number) => Math.max(70, Math.round(800 * Math.pow(0.85, level - 1)));
