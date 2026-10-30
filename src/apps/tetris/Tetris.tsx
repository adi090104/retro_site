import { useCallback, useEffect, useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';
import { MenuBar } from '../../components/Menu';
import type { MenuBarMenu } from '../../components/Menu';
import { showDialog } from '../../state/actions';
import { useWM } from '../../state/windowStore';
import { playBlip } from '../../utils/sound';
import {
  COLS,
  createGame,
  finishClear,
  ghostY,
  gravityMs,
  hardDrop,
  move,
  PIECE_COLORS,
  ROWS,
  rotate,
  shapeOf,
  step,
} from './engine';
import type { Game, GameEvent, PieceType } from './engine';

const CELL = 16;
const NEXT_CELL = 12;
const CLEAR_FLASH_MS = 320;
const HIGH_SCORE_KEY = 'retro-os-tetris-high';

const SOUNDS: Partial<Record<NonNullable<GameEvent>, [number, number][]>> = {
  rotate: [[880, 0]],
  lock: [[196, 0]],
  clear: [
    [523, 0],
    [659, 0.06],
    [784, 0.12],
  ],
  over: [
    [392, 0],
    [330, 0.15],
    [262, 0.3],
    [196, 0.45],
  ],
};

function drawBlock(ctx: CanvasRenderingContext2D, x: number, y: number, color: string, size: number) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, size, size);
  ctx.fillStyle = 'rgba(255,255,255,0.55)';
  ctx.fillRect(x, y, size, 2);
  ctx.fillRect(x, y, 2, size);
  ctx.fillStyle = 'rgba(0,0,0,0.45)';
  ctx.fillRect(x, y + size - 2, size, 2);
  ctx.fillRect(x + size - 2, y, 2, size);
}

function drawOverlay(ctx: CanvasRenderingContext2D, title: string, subtitle: string) {
  const w = COLS * CELL;
  const y = (ROWS * CELL) / 2 - 22;
  ctx.fillStyle = 'rgba(0,0,128,0.85)';
  ctx.fillRect(0, y, w, 44);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, y, w, 1);
  ctx.fillRect(0, y + 43, w, 1);
  ctx.textAlign = 'center';
  ctx.font = 'bold 16px "Courier New", monospace';
  ctx.fillText(title, w / 2, y + 20);
  ctx.font = '10px "Courier New", monospace';
  ctx.fillStyle = '#ffff80';
  ctx.fillText(subtitle, w / 2, y + 35);
}

function drawBoard(ctx: CanvasRenderingContext2D, game: Game, now: number) {
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, COLS * CELL, ROWS * CELL);
  ctx.fillStyle = '#141428';
  for (let x = 1; x < COLS; x++) ctx.fillRect(x * CELL, 0, 1, ROWS * CELL);
  for (let y = 1; y < ROWS; y++) ctx.fillRect(0, y * CELL, COLS * CELL, 1);

  const flashOn = Math.floor(now / 60) % 2 === 0;
  game.board.forEach((row, y) =>
    row.forEach((cell, x) => {
      if (!cell) return;
      const flashing = game.clearing?.includes(y);
      drawBlock(ctx, x * CELL, y * CELL, flashing && flashOn ? '#ffffff' : PIECE_COLORS[cell], CELL);
    }),
  );

  const piece = game.piece;
  if (piece) {
    const gy = ghostY(game);
    piece.shape.forEach((row, r) =>
      row.forEach((filled, c) => {
        if (!filled) return;
        const x = (piece.x + c) * CELL;
        if (gy !== null && gy !== piece.y && gy + r >= 0) {
          ctx.strokeStyle = PIECE_COLORS[piece.type];
          ctx.globalAlpha = 0.5;
          ctx.strokeRect(x + 1.5, (gy + r) * CELL + 1.5, CELL - 3, CELL - 3);
          ctx.globalAlpha = 1;
        }
        if (piece.y + r >= 0) drawBlock(ctx, x, (piece.y + r) * CELL, PIECE_COLORS[piece.type], CELL);
      }),
    );
  }

  if (game.status === 'ready') drawOverlay(ctx, 'TETRIS', 'Press F2 to start');
  if (game.status === 'paused') drawOverlay(ctx, 'PAUSED', 'Press P to resume');
  if (game.status === 'over') drawOverlay(ctx, 'GAME OVER', 'Press F2 to play again');
}

function drawNext(ctx: CanvasRenderingContext2D, type: PieceType) {
  const { width, height } = ctx.canvas;
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, width, height);
  const shape = shapeOf(type).filter((row) => row.some(Boolean));
  const offX = (width - shape[0].length * NEXT_CELL) / 2;
  const offY = (height - shape.length * NEXT_CELL) / 2;
  shape.forEach((row, r) =>
    row.forEach((filled, c) => {
      if (filled) drawBlock(ctx, offX + c * NEXT_CELL, offY + r * NEXT_CELL, PIECE_COLORS[type], NEXT_CELL);
    }),
  );
}

interface Hud {
  score: number;
  lines: number;
  level: number;
  next: PieceType;
  status: Game['status'];
}

const hudOf = (g: Game): Hud => ({ score: g.score, lines: g.lines, level: g.level, next: g.next, status: g.status });

export function Tetris({ winId }: { winId: string }) {
  const root = useRef<HTMLDivElement>(null);
  const boardCanvas = useRef<HTMLCanvasElement>(null);
  const nextCanvas = useRef<HTMLCanvasElement>(null);
  const game = useRef<Game>(createGame('ready'));
  const lastDrop = useRef(0);
  const clearUntil = useRef(0);
  const soundOn = useRef(true);

  const [hud, setHud] = useState<Hud>(() => hudOf(game.current));
  const [sound, setSound] = useState(true);
  const [high, setHigh] = useState(() => Number(localStorage.getItem(HIGH_SCORE_KEY)) || 0);
  const minimized = useWM((s) => s.windows.find((w) => w.id === winId)?.minimized ?? false);
  const active = useWM((s) => s.activeId === winId);

  const render = useCallback(() => {
    const g = game.current;
    const ctx = boardCanvas.current?.getContext('2d');
    if (ctx) drawBoard(ctx, g, performance.now());
    const nextCtx = nextCanvas.current?.getContext('2d');
    if (nextCtx) drawNext(nextCtx, g.next);
    setHud(hudOf(g));
  }, []);

  const handleEvent = useCallback((event: GameEvent) => {
    if (!event) return;
    const notes = SOUNDS[event];
    if (notes && soundOn.current) playBlip(notes, event === 'over' ? 0.18 : 0.07);
    if (event === 'clear') clearUntil.current = performance.now() + CLEAR_FLASH_MS;
    if (event === 'over') {
      const score = game.current.score;
      setHigh((prev) => {
        if (score <= prev) return prev;
        localStorage.setItem(HIGH_SCORE_KEY, String(score));
        return score;
      });
    }
  }, []);

  const newGame = useCallback(() => {
    game.current = createGame('playing');
    lastDrop.current = performance.now();
    render();
    root.current?.focus();
  }, [render]);

  const setPaused = useCallback(
    (paused: boolean) => {
      const g = game.current;
      if (paused && g.status === 'playing') g.status = 'paused';
      else if (!paused && g.status === 'paused') {
        g.status = 'playing';
        lastDrop.current = performance.now();
      } else return;
      render();
    },
    [render],
  );

  // Gravity + line-clear animation loop.
  useEffect(() => {
    let raf = 0;
    const frame = (now: number) => {
      const g = game.current;
      if (g.status === 'playing') {
        if (g.clearing) {
          if (now >= clearUntil.current) {
            handleEvent(finishClear(g));
            lastDrop.current = now;
            render();
          } else {
            const ctx = boardCanvas.current?.getContext('2d');
            if (ctx) drawBoard(ctx, g, now);
          }
        } else if (now - lastDrop.current >= gravityMs(g.level)) {
          lastDrop.current = now;
          handleEvent(step(g));
          render();
        }
      }
      raf = requestAnimationFrame(frame);
    };
    render();
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [handleEvent, render]);

  // Classic Windows games pause when you look away.
  useEffect(() => {
    if (minimized || !active) setPaused(true);
  }, [minimized, active, setPaused]);

  useEffect(() => root.current?.focus(), []);

  const onKeyDown = (e: KeyboardEvent) => {
    const g = game.current;
    const key = e.key;
    if (key === 'F2') {
      e.preventDefault();
      return newGame();
    }
    if (key === 'p' || key === 'P' || key === 'Escape') {
      e.preventDefault();
      return setPaused(g.status === 'playing');
    }
    if ((g.status === 'ready' || g.status === 'over') && (key === 'Enter' || key === ' ')) {
      e.preventDefault();
      return newGame();
    }
    if (g.status !== 'playing' || g.clearing || !g.piece) return;

    let event: GameEvent = null;
    if (key === 'ArrowLeft') event = move(g, -1, 0) ? 'move' : null;
    else if (key === 'ArrowRight') event = move(g, 1, 0) ? 'move' : null;
    else if (key === 'ArrowDown') {
      event = step(g, true);
      lastDrop.current = performance.now();
    } else if (key === 'ArrowUp' || key === 'x' || key === 'X') event = rotate(g) ? 'rotate' : null;
    else if (key === 'z' || key === 'Z') event = rotate(g, false) ? 'rotate' : null;
    else if (key === ' ') {
      event = hardDrop(g);
      lastDrop.current = performance.now();
    } else return;

    e.preventDefault();
    handleEvent(event);
    render();
  };

  const isPlaying = hud.status === 'playing' || hud.status === 'paused';
  const menus: MenuBarMenu[] = [
    {
      label: '&Game',
      items: [
        { label: '&New', shortcut: 'F2', onClick: newGame },
        { label: '&Pause', shortcut: 'P', checked: hud.status === 'paused', disabled: !isPlaying, onClick: () => setPaused(hud.status === 'playing') },
        'separator',
        {
          label: '&Sound',
          checked: sound,
          onClick: () => {
            soundOn.current = !soundOn.current;
            setSound(soundOn.current);
          },
        },
        {
          label: '&Reset High Score',
          onClick: () => {
            localStorage.removeItem(HIGH_SCORE_KEY);
            setHigh(0);
          },
        },
        'separator',
        { label: 'E&xit', onClick: () => useWM.getState().close(winId) },
      ],
    },
    {
      label: '&Help',
      items: [
        {
          label: '&Controls',
          onClick: () =>
            showDialog(
              'Left / Right: Move\nUp or X: Rotate clockwise\nZ: Rotate counter-clockwise\nDown: Soft drop\nSpace: Hard drop\nP or Esc: Pause\nF2: New game',
              'info',
              'Tetris Controls',
            ),
        },
        'separator',
        {
          label: '&About Tetris',
          onClick: () => showDialog('Tetris for RetroOS 98\nVersion 1.0\n\nClear lines. Go faster. Lose anyway.', 'info', 'About Tetris'),
        },
      ],
    },
  ];

  return (
    <div className="tetris" ref={root} tabIndex={0} onKeyDown={onKeyDown} onPointerDown={() => root.current?.focus()}>
      <MenuBar menus={menus} />
      <div className="tetris-body">
        <div className="tetris-well">
          <canvas ref={boardCanvas} width={COLS * CELL} height={ROWS * CELL} />
        </div>
        <div className="tetris-side">
          <fieldset className="groupbox">
            <legend>Next</legend>
            <canvas ref={nextCanvas} className="tetris-next" width={NEXT_CELL * 5} height={NEXT_CELL * 3} />
          </fieldset>
          <fieldset className="groupbox tetris-stats">
            <legend>Stats</legend>
            <dl>
              <dt>Score</dt>
              <dd>{hud.score.toLocaleString()}</dd>
              <dt>Lines</dt>
              <dd>{hud.lines}</dd>
              <dt>Level</dt>
              <dd>{hud.level}</dd>
              <dt>High</dt>
              <dd>{Math.max(high, hud.score).toLocaleString()}</dd>
            </dl>
          </fieldset>
          <button className="btn" onClick={newGame} onMouseDown={(e) => e.preventDefault()}>
            <u>N</u>ew Game
          </button>
          <button
            className="btn"
            disabled={!isPlaying}
            onClick={() => setPaused(hud.status === 'playing')}
            onMouseDown={(e) => e.preventDefault()}
          >
            {hud.status === 'paused' ? 'Resume' : 'Pause'}
          </button>
          <p className="tetris-help">
            ← → move
            <br />↑ rotate
            <br />↓ soft drop
            <br />
            Space: drop
          </p>
        </div>
      </div>
    </div>
  );
}
