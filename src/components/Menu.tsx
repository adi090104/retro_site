import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { RefObject } from 'react';
import { createPortal } from 'react-dom';
import { cx } from '../utils/cx';
import { ArrowRight, CheckGlyph, DotGlyph } from './glyphs';
import { Icon } from './Icon';
import type { IconName } from './Icon';

export type MenuEntry =
  | 'separator'
  | {
      /** Use "&" before the access-key letter, e.g. "&File". */
      label: string;
      onClick?: () => void;
      disabled?: boolean;
      checked?: boolean;
      radio?: boolean;
      bold?: boolean;
      icon?: IconName;
      shortcut?: string;
      submenu?: MenuEntry[];
    };

export function AccessLabel({ text }: { text: string }) {
  const i = text.indexOf('&');
  if (i < 0 || i === text.length - 1) return <>{text}</>;
  return (
    <>
      {text.slice(0, i)}
      <u>{text[i + 1]}</u>
      {text.slice(i + 2)}
    </>
  );
}

/** Calls onClose on any pointerdown outside `ref` (or on Escape) while active. */
export function useOutsideClose(
  ref: RefObject<HTMLElement | null>,
  onClose: () => void,
  active = true,
  ignoreSelector?: string,
) {
  const cb = useRef(onClose);
  useEffect(() => {
    cb.current = onClose;
  });
  useEffect(() => {
    if (!active) return;
    const onPointer = (e: PointerEvent) => {
      const target = e.target as Element;
      if (ref.current?.contains(target)) return;
      if (ignoreSelector && target.closest?.(ignoreSelector)) return;
      cb.current();
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && cb.current();
    document.addEventListener('pointerdown', onPointer, true);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onPointer, true);
      document.removeEventListener('keydown', onKey);
    };
  }, [active, ref, ignoreSelector]);
}

export function MenuList({ items, onClose, className }: { items: MenuEntry[]; onClose: () => void; className?: string }) {
  const hasIcons = items.some((it) => it !== 'separator' && it.icon);
  return (
    <div className={cx('menu', className)} onPointerDown={(e) => e.stopPropagation()}>
      {items.map((it, i) =>
        it === 'separator' ? (
          <div key={i} className="menu-sep" />
        ) : (
          <div
            key={i}
            className={cx('menu-item', it.disabled && 'disabled', it.submenu && !it.disabled && 'has-sub')}
            onClick={(e) => {
              e.stopPropagation();
              if (it.disabled || it.submenu) return;
              onClose();
              it.onClick?.();
            }}
          >
            {hasIcons ? (
              <span className="menu-icon">{it.icon && <Icon name={it.icon} size={16} />}</span>
            ) : (
              <span className="menu-check">{it.checked && (it.radio ? <DotGlyph /> : <CheckGlyph />)}</span>
            )}
            <span className={cx('menu-label', it.bold && 'bold')}>
              <AccessLabel text={it.label} />
            </span>
            {it.shortcut && <span className="menu-shortcut">{it.shortcut}</span>}
            {it.submenu && (
              <span className="menu-arrow">
                <ArrowRight />
              </span>
            )}
            {it.submenu && !it.disabled && <MenuList className="submenu" items={it.submenu} onClose={onClose} />}
          </div>
        ),
      )}
    </div>
  );
}

export interface MenuBarMenu {
  label: string;
  items: MenuEntry[];
}

export function MenuBar({ menus }: { menus: MenuBarMenu[] }) {
  const [open, setOpen] = useState<number | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  useOutsideClose(ref, () => setOpen(null), open !== null);

  return (
    <div className="menubar" ref={ref}>
      {menus.map((m, i) => (
        <div
          key={m.label}
          className={cx('menubar-item', open === i && 'open')}
          onPointerDown={() => setOpen(open === i ? null : i)}
          onPointerEnter={() => open !== null && setOpen(i)}
        >
          <AccessLabel text={m.label} />
          {open === i && <MenuList className="dropdown" items={m.items} onClose={() => setOpen(null)} />}
        </div>
      ))}
    </div>
  );
}

export function ContextMenu({ x, y, items, onClose }: { x: number; y: number; items: MenuEntry[]; onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ x, y });
  useOutsideClose(ref, onClose);

  useLayoutEffect(() => {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    setPos({
      x: Math.max(0, Math.min(x, window.innerWidth - rect.width - 2)),
      y: Math.max(0, Math.min(y, window.innerHeight - rect.height - 2)),
    });
  }, [x, y]);

  return createPortal(
    <div ref={ref} className="context-menu" style={{ left: pos.x, top: pos.y }}>
      <MenuList items={items} onClose={onClose} />
    </div>,
    document.body,
  );
}
