import { useState } from 'react';
import type { KeyboardEvent, MouseEvent } from 'react';
import { AppHost } from '../apps/AppHost';
import { FileItem } from '../components/FileItem';
import { ContextMenu } from '../components/Menu';
import type { MenuEntry } from '../components/Menu';
import { Window } from '../components/Window';
import { useFs } from '../fs/fsStore';
import { createIn, deleteNodes, openNode, renameNode, showDialog } from '../state/actions';
import { itemMenu } from '../state/itemMenu';
import { useWM } from '../state/windowStore';

export function Desktop() {
  const nodes = useFs((s) => s.nodes);
  const clipboard = useFs((s) => s.clipboard);
  const windows = useWM((s) => s.windows);
  const [selected, setSelected] = useState<string | null>(null);
  const [renaming, setRenaming] = useState<string | null>(null);
  const [ctx, setCtx] = useState<{ x: number; y: number; target: string | null } | null>(null);

  const icons = (nodes.desktop.children ?? []).map((id) => nodes[id]).filter(Boolean);
  const modal = windows.find((w) => w.app.type === 'shutdown');

  const startNew = (kind: 'folder' | 'file') => {
    const id = createIn('desktop', kind);
    if (!id) return;
    setSelected(id);
    setRenaming(id);
  };

  const onKeyDown = (e: KeyboardEvent) => {
    if (!selected || renaming) return;
    if (e.key === 'Enter') openNode(selected);
    else if (e.key === 'F2' && !nodes[selected]?.system) setRenaming(selected);
    else if (e.key === 'Delete' || (e.metaKey && e.key === 'Backspace')) deleteNodes([selected], e.shiftKey);
  };

  const onBackgroundContext = (e: MouseEvent) => {
    e.preventDefault();
    if (e.target !== e.currentTarget) return;
    setSelected(null);
    setCtx({ x: e.clientX, y: e.clientY, target: null });
  };

  const backgroundMenu: MenuEntry[] = [
    { label: 'Arrange &Icons', disabled: true },
    { label: 'Line &up Icons', disabled: true },
    'separator',
    { label: 'R&efresh' },
    'separator',
    { label: '&Paste', disabled: !clipboard, onClick: () => useFs.getState().paste('desktop') },
    'separator',
    {
      label: 'Ne&w',
      submenu: [
        { label: '&Folder', icon: 'folder', onClick: () => startNew('folder') },
        'separator',
        { label: 'Text Document', icon: 'text', onClick: () => startNew('file') },
      ],
    },
    'separator',
    {
      label: 'P&roperties',
      onClick: () => showDialog('Display Properties are still being calibrated.\n\nTeal is the only color for now.', 'info', 'Display Properties'),
    },
  ];

  return (
    <div className="desktop">
      <div
        className="desktop-icons"
        tabIndex={-1}
        onKeyDown={onKeyDown}
        onPointerDown={(e) => e.target === e.currentTarget && setSelected(null)}
        onContextMenu={onBackgroundContext}
      >
        {icons.map((n) => (
          <FileItem
            key={n.id}
            node={n}
            variant="desktop"
            selected={selected === n.id}
            cut={clipboard?.mode === 'cut' && clipboard.ids.includes(n.id)}
            renaming={renaming === n.id}
            onRename={(name) => {
              setRenaming(null);
              if (name !== null) renameNode(n.id, name);
            }}
            onPointerDown={() => setSelected(n.id)}
            onDoubleClick={() => openNode(n.id)}
            onContextMenu={(e) => {
              e.preventDefault();
              setCtx({ x: e.clientX, y: e.clientY, target: n.id });
            }}
          />
        ))}
      </div>

      {modal && <div className="modal-dither" style={{ zIndex: modal.z - 1 }} />}

      {windows.map((w) => (
        <Window key={w.id} win={w}>
          <AppHost winId={w.id} app={w.app} />
        </Window>
      ))}

      {ctx && (
        <ContextMenu
          x={ctx.x}
          y={ctx.y}
          items={
            ctx.target && nodes[ctx.target]
              ? itemMenu(ctx.target, [ctx.target], { open: openNode, rename: setRenaming })
              : backgroundMenu
          }
          onClose={() => setCtx(null)}
        />
      )}
    </div>
  );
}
