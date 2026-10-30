import type { PointerEvent as ReactPointerEvent, ReactNode } from 'react';
import { useWM } from '../state/windowStore';
import type { Bounds, WinState } from '../state/windowStore';
import { cx } from '../utils/cx';
import { CloseGlyph, MaximizeGlyph, MinimizeGlyph, RestoreGlyph } from './glyphs';
import { Icon } from './Icon';

const RESIZE_DIRS = ['n', 's', 'e', 'w', 'ne', 'nw', 'se', 'sw'] as const;
type ResizeDir = (typeof RESIZE_DIRS)[number];

/** Tracks a pointer drag on `window` until release, reporting the delta from the start point. */
function trackDrag(e: ReactPointerEvent, onMove: (dx: number, dy: number) => void) {
  const startX = e.clientX;
  const startY = e.clientY;
  const move = (ev: PointerEvent) => onMove(ev.clientX - startX, ev.clientY - startY);
  const up = () => {
    window.removeEventListener('pointermove', move);
    window.removeEventListener('pointerup', up);
    document.body.classList.remove('dragging');
  };
  document.body.classList.add('dragging');
  window.addEventListener('pointermove', move);
  window.addEventListener('pointerup', up);
}

export function Window({ win, children }: { win: WinState; children: ReactNode }) {
  const active = useWM((s) => s.activeId === win.id);
  const { focus, requestClose, minimize, toggleMaximize, setBounds } = useWM.getState();

  const startMove = (e: ReactPointerEvent) => {
    if (e.button !== 0 || win.maximized) return;
    const { x, y } = win;
    trackDrag(e, (dx, dy) => setBounds(win.id, { x: x + dx, y: Math.max(0, y + dy) }));
  };

  const startResize = (dir: ResizeDir) => (e: ReactPointerEvent) => {
    if (e.button !== 0) return;
    e.stopPropagation();
    const start: Bounds = { x: win.x, y: win.y, width: win.width, height: win.height };
    trackDrag(e, (dx, dy) => {
      const b = { ...start };
      if (dir.includes('e')) b.width = Math.max(win.minW, start.width + dx);
      if (dir.includes('s')) b.height = Math.max(win.minH, start.height + dy);
      if (dir.includes('w')) {
        b.width = Math.max(win.minW, start.width - dx);
        b.x = start.x + start.width - b.width;
      }
      if (dir.includes('n')) {
        b.height = Math.max(win.minH, start.height - dy);
        b.y = start.y + start.height - b.height;
        if (b.y < 0) {
          b.height += b.y;
          b.y = 0;
        }
      }
      setBounds(win.id, b);
    });
  };

  const style = win.maximized
    ? { left: 0, top: 0, width: '100%', height: '100%', zIndex: win.z }
    : { left: win.x, top: win.y, width: win.width, height: win.resizable ? win.height : undefined, zIndex: win.z };

  return (
    <div
      className={cx('window', active && 'active', win.maximized && 'maximized', win.minimized && 'minimized')}
      style={style}
      onPointerDownCapture={() => focus(win.id)}
    >
      <div
        className="title-bar"
        onPointerDown={startMove}
        onDoubleClick={() => win.resizable && toggleMaximize(win.id)}
      >
        {win.icon && <Icon name={win.icon} size={16} />}
        <span className="title-text">{win.title}</span>
        <div className="title-buttons" onPointerDown={(e) => e.stopPropagation()} onDoubleClick={(e) => e.stopPropagation()}>
          {win.resizable && (
            <>
              <button className="tb-btn" aria-label="Minimize" onClick={() => minimize(win.id)}>
                <MinimizeGlyph />
              </button>
              <button className="tb-btn" aria-label={win.maximized ? 'Restore' : 'Maximize'} onClick={() => toggleMaximize(win.id)}>
                {win.maximized ? <RestoreGlyph /> : <MaximizeGlyph />}
              </button>
            </>
          )}
          <button className="tb-btn tb-close" aria-label="Close" onClick={() => requestClose(win.id)}>
            <CloseGlyph />
          </button>
        </div>
      </div>
      <div className="window-body">{children}</div>
      {win.resizable &&
        !win.maximized &&
        RESIZE_DIRS.map((d) => <div key={d} className={`rz rz-${d}`} onPointerDown={startResize(d)} />)}
    </div>
  );
}
