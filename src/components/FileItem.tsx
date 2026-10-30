import { useEffect, useRef, useState } from 'react';
import type { MouseEvent, PointerEvent } from 'react';
import { iconFor } from '../fs/fsUtils';
import type { FsNode } from '../fs/types';
import { cx } from '../utils/cx';
import { Icon } from './Icon';

export function RenameInput({ initial, onDone }: { initial: string; onDone: (name: string | null) => void }) {
  const ref = useRef<HTMLInputElement>(null);
  const [value, setValue] = useState(initial);
  const finished = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.focus();
    const dot = initial.lastIndexOf('.');
    el.setSelectionRange(0, dot > 0 ? dot : initial.length);
  }, [initial]);

  const finish = (name: string | null) => {
    if (finished.current) return;
    finished.current = true;
    onDone(name);
  };

  return (
    <input
      ref={ref}
      className="rename-input"
      value={value}
      spellCheck={false}
      onChange={(e) => setValue(e.target.value)}
      onKeyDown={(e) => {
        e.stopPropagation();
        if (e.key === 'Enter') finish(value);
        if (e.key === 'Escape') finish(null);
      }}
      onBlur={() => finish(value)}
      onPointerDown={(e) => e.stopPropagation()}
      onDoubleClick={(e) => e.stopPropagation()}
    />
  );
}

interface FileItemProps {
  node: FsNode;
  variant: 'desktop' | 'large' | 'list';
  selected: boolean;
  cut?: boolean;
  renaming: boolean;
  onRename: (name: string | null) => void;
  onPointerDown: (e: PointerEvent) => void;
  onDoubleClick: () => void;
  onContextMenu: (e: MouseEvent) => void;
}

export function FileItem({ node, variant, selected, cut, renaming, onRename, ...handlers }: FileItemProps) {
  return (
    <div data-item={node.id} className={cx('fitem', `fitem-${variant}`, selected && 'selected', cut && 'cut')} {...handlers}>
      <span className="fitem-icon">
        <Icon name={iconFor(node)} size={variant === 'list' ? 16 : 32} />
      </span>
      {renaming ? <RenameInput initial={node.name} onDone={onRename} /> : <span className="fitem-label">{node.name}</span>}
    </div>
  );
}
