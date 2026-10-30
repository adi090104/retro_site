import { useEffect, useMemo, useRef, useState } from 'react';
import type { KeyboardEvent, MouseEvent, PointerEvent } from 'react';
import { FileItem, RenameInput } from '../../components/FileItem';
import { ArrowDown, CloseGlyph, SizeGrip } from '../../components/glyphs';
import { Icon } from '../../components/Icon';
import type { IconName } from '../../components/Icon';
import { ContextMenu, MenuBar, useOutsideClose } from '../../components/Menu';
import type { MenuBarMenu, MenuEntry } from '../../components/Menu';
import { useFs } from '../../fs/fsStore';
import {
  canWrite,
  displayPath,
  formatBytes,
  formatDate,
  formatSize,
  iconFor,
  isContainer,
  pathOf,
  resolvePath,
  sizeOf,
  typeLabel,
} from '../../fs/fsUtils';
import type { FsNode } from '../../fs/types';
import {
  createIn,
  deleteNodes,
  emptyRecycleBin,
  openNode,
  openProperties,
  renameNode,
  showAbout,
  showDialog,
} from '../../state/actions';
import { itemMenu } from '../../state/itemMenu';
import { useWM } from '../../state/windowStore';
import { cx } from '../../utils/cx';
import { FolderTree } from './FolderTree';
import { WebView } from './WebView';

type ViewMode = 'large' | 'list' | 'details';
type SortKey = 'name' | 'size' | 'type' | 'modified';

const VIEW_ORDER: ViewMode[] = ['large', 'list', 'details'];
const COLUMNS: { key: SortKey; label: string; width: number }[] = [
  { key: 'name', label: 'Name', width: 190 },
  { key: 'size', label: 'Size', width: 70 },
  { key: 'type', label: 'Type', width: 140 },
  { key: 'modified', label: 'Modified', width: 120 },
];

function ToolButton({ icon, label, onClick, disabled }: { icon: IconName; label: string; onClick?: () => void; disabled?: boolean }) {
  return (
    <button className="tool-btn" disabled={disabled} onClick={onClick} onMouseDown={(e) => e.preventDefault()} title={label}>
      <Icon name={icon} size={20} />
      <span>{label}</span>
    </button>
  );
}

export function Explorer({ winId, initialId }: { winId: string; initialId: string }) {
  const nodes = useFs((s) => s.nodes);
  const clipboard = useFs((s) => s.clipboard);
  const setTitle = useWM((s) => s.setTitle);
  const closeWindow = useWM((s) => s.close);

  const [nav, setNav] = useState({ stack: [initialId], index: 0 });
  const currentId = nodes[nav.stack[nav.index]] ? nav.stack[nav.index] : 'desktop';
  const folder = nodes[currentId];

  const [view, setView] = useState<ViewMode>('large');
  const [sort, setSort] = useState<{ key: SortKey; dir: 1 | -1 }>({ key: 'name', dir: 1 });
  const [showTree, setShowTree] = useState(true);
  const [showStatus, setShowStatus] = useState(true);
  const [webView, setWebView] = useState(true);
  const [treeWidth, setTreeWidth] = useState(180);
  const [selected, setSelected] = useState<string[]>([]);
  const [renaming, setRenaming] = useState<string | null>(null);
  const [ctx, setCtx] = useState<{ x: number; y: number; target: string | null } | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(
    () => new Set(['desktop', 'computer', ...pathOf(useFs.getState().nodes, initialId).slice(0, -1).map((n) => n.id)]),
  );
  const [address, setAddress] = useState('');
  const [addrOpen, setAddrOpen] = useState(false);

  const anchor = useRef<string | null>(null);
  const filesRef = useRef<HTMLDivElement>(null);
  const addrRef = useRef<HTMLDivElement>(null);
  useOutsideClose(addrRef, () => setAddrOpen(false), addrOpen);

  const path = displayPath(nodes, currentId);
  const folderIcon = iconFor(folder, true);
  useEffect(() => setAddress(path), [path]);
  useEffect(() => setTitle(winId, `Exploring - ${path}`, folderIcon), [winId, path, folderIcon, setTitle]);

  const items = useMemo(() => {
    const kids = (folder.children ?? []).map((id) => nodes[id]).filter((n): n is FsNode => !!n);
    const rank = (n: FsNode) => (n.system ? 0 : isContainer(n) ? 1 : 2);
    const byName = (a: FsNode, b: FsNode) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' });
    const cmp = (a: FsNode, b: FsNode) => {
      switch (sort.key) {
        case 'size':
          return sizeOf(nodes, a.id) - sizeOf(nodes, b.id);
        case 'type':
          return typeLabel(a).localeCompare(typeLabel(b));
        case 'modified':
          return a.modified - b.modified;
        default:
          return byName(a, b);
      }
    };
    return kids.sort((a, b) => rank(a) - rank(b) || (a.system && b.system ? 0 : cmp(a, b) * sort.dir || byName(a, b)));
  }, [folder, nodes, sort]);

  const sel = useMemo(() => selected.filter((id) => folder.children?.includes(id)), [selected, folder]);
  const mutableSel = sel.filter((id) => !nodes[id].system);
  const writable = canWrite(nodes, currentId);
  const inBin = currentId === 'recycle';
  const fs = useFs.getState;

  // ---- navigation ----
  const navigate = (id: string) => {
    const target = nodes[id];
    if (!target || id === currentId) return;
    if (!isContainer(target) || target.kind === 'floppy') return openNode(id);
    setNav((h) => ({ stack: [...h.stack.slice(0, h.index + 1), id], index: h.index + 1 }));
    setSelected([]);
    setRenaming(null);
    setExpanded((prev) => new Set([...prev, ...pathOf(nodes, id).slice(0, -1).map((n) => n.id)]));
  };
  const canBack = nav.index > 0;
  const canForward = nav.index < nav.stack.length - 1;
  const step = (delta: number) => {
    setNav((h) => ({ ...h, index: Math.max(0, Math.min(h.stack.length - 1, h.index + delta)) }));
    setSelected([]);
    setRenaming(null);
  };
  const goBack = () => canBack && step(-1);
  const goForward = () => canForward && step(1);
  const goUp = () => {
    if (folder.parentId) navigate(folder.parentId);
  };

  const goToAddress = () => {
    const id = resolvePath(nodes, address);
    if (id) return navigate(id);
    showDialog(
      `Windows cannot find '${address}'. Make sure you typed the name correctly, and then try again.`,
      'error',
      folder.name,
    );
    setAddress(path);
  };

  const toggleExpanded = (id: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  // ---- commands ----
  const startNew = (kind: 'folder' | 'file') => {
    const id = createIn(currentId, kind);
    if (!id) return;
    setSelected([id]);
    setRenaming(id);
  };
  const cmd = {
    newFolder: () => startNew('folder'),
    newText: () => startNew('file'),
    del: (permanent = false) => deleteNodes(mutableSel, permanent),
    cut: () => fs().setClipboard(mutableSel, 'cut'),
    copy: () => fs().setClipboard(mutableSel, 'copy'),
    paste: () => writable && clipboard && fs().paste(currentId),
    rename: () => sel.length === 1 && mutableSel.length === 1 && setRenaming(sel[0]),
    restore: () => fs().restore(sel),
    props: () => openProperties(sel[0] ?? currentId),
    selectAll: () => setSelected(items.map((n) => n.id)),
    invert: () => setSelected(items.filter((n) => !sel.includes(n.id)).map((n) => n.id)),
    cycleView: () => setView(VIEW_ORDER[(VIEW_ORDER.indexOf(view) + 1) % VIEW_ORDER.length]),
  };

  const commitRename = (id: string, name: string | null) => {
    setRenaming(null);
    if (name !== null) renameNode(id, name);
    filesRef.current?.focus();
  };

  // ---- pointer / keyboard ----
  const onItemDown = (e: PointerEvent, id: string) => {
    if (e.button === 2) {
      if (!sel.includes(id)) setSelected([id]);
      return;
    }
    if (e.button !== 0) return;
    if (e.metaKey || e.ctrlKey) {
      setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
      anchor.current = id;
    } else if (e.shiftKey && anchor.current) {
      const ids = items.map((n) => n.id);
      const a = ids.indexOf(anchor.current);
      const b = ids.indexOf(id);
      setSelected(a < 0 ? [id] : ids.slice(Math.min(a, b), Math.max(a, b) + 1));
    } else {
      setSelected([id]);
      anchor.current = id;
    }
  };
  const onItemContext = (e: MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    setCtx({ x: e.clientX, y: e.clientY, target: id });
  };
  const onBackgroundDown = (e: PointerEvent) => {
    if ((e.target as HTMLElement).closest('[data-item]')) return;
    if (!e.metaKey && !e.ctrlKey && !e.shiftKey) setSelected([]);
  };
  const onBackgroundContext = (e: MouseEvent) => {
    e.preventDefault();
    setCtx({ x: e.clientX, y: e.clientY, target: null });
  };

  const onKeyDown = (e: KeyboardEvent) => {
    if (renaming) return;
    const mod = e.metaKey || e.ctrlKey;
    const shortcuts: Record<string, () => unknown> = { a: cmd.selectAll, c: cmd.copy, x: cmd.cut, v: cmd.paste };
    let action: (() => unknown) | undefined;
    if (e.key === 'Delete' || (e.metaKey && e.key === 'Backspace')) action = () => cmd.del(e.shiftKey);
    else if (e.key === 'F2') action = cmd.rename;
    else if (e.key === 'Enter') action = () => sel[0] && navigate(sel[0]);
    else if (e.key === 'Backspace') action = goUp;
    else if (e.altKey && e.key === 'ArrowLeft') action = goBack;
    else if (e.altKey && e.key === 'ArrowRight') action = goForward;
    else if (mod) action = shortcuts[e.key.toLowerCase()];
    if (!action) return;
    e.preventDefault();
    action();
  };

  const startSplitDrag = (e: PointerEvent) => {
    const startX = e.clientX;
    const startW = treeWidth;
    const move = (ev: globalThis.PointerEvent) => setTreeWidth(Math.max(100, Math.min(420, startW + ev.clientX - startX)));
    const up = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  };

  // ---- menus ----
  const viewItems: MenuEntry[] = [
    { label: 'Lar&ge Icons', radio: true, checked: view === 'large', onClick: () => setView('large') },
    { label: '&List', radio: true, checked: view === 'list', onClick: () => setView('list') },
    { label: '&Details', radio: true, checked: view === 'details', onClick: () => setView('details') },
  ];
  const arrangeItems: MenuEntry[] = COLUMNS.map((c) => ({
    label: `by &${c.key === 'modified' ? 'Date' : c.label}`,
    radio: true,
    checked: sort.key === c.key,
    onClick: () => setSort({ key: c.key, dir: 1 }),
  }));
  const newItems: MenuEntry[] = [
    { label: '&Folder', icon: 'folder', onClick: cmd.newFolder },
    'separator',
    { label: 'Text Document', icon: 'text', onClick: cmd.newText },
  ];
  const binItems: MenuEntry[] = inBin
    ? [
        { label: 'Empty Recycle &Bin', disabled: !items.length, onClick: emptyRecycleBin },
        { label: 'R&estore', disabled: !sel.length, onClick: cmd.restore },
        'separator',
      ]
    : [];
  const goItems: MenuEntry[] = [
    { label: '&Back', shortcut: 'Alt+Left', disabled: !canBack, onClick: goBack },
    { label: '&Forward', shortcut: 'Alt+Right', disabled: !canForward, onClick: goForward },
    { label: '&Up One Level', disabled: !folder.parentId, onClick: goUp },
    'separator',
    { label: '&Desktop', icon: 'desktop', onClick: () => navigate('desktop') },
    { label: 'My &Computer', icon: 'computer', onClick: () => navigate('computer') },
    { label: 'My Docu&ments', icon: 'documents', onClick: () => navigate('documents') },
    { label: '&Recycle Bin', icon: 'recycle', onClick: () => navigate('recycle') },
  ];
  const emptyFolder: MenuEntry[] = [{ label: '(Empty)', disabled: true }];

  const menus: MenuBarMenu[] = [
    {
      label: '&File',
      items: [
        { label: 'Ne&w', disabled: !writable, submenu: newItems },
        'separator',
        ...binItems,
        { label: '&Delete', disabled: !mutableSel.length, onClick: () => cmd.del() },
        { label: 'Rena&me', disabled: mutableSel.length !== 1 || sel.length !== 1, onClick: cmd.rename },
        { label: 'P&roperties', onClick: cmd.props },
        'separator',
        { label: '&Close', onClick: () => closeWindow(winId) },
      ],
    },
    {
      label: '&Edit',
      items: [
        { label: '&Undo', shortcut: 'Ctrl+Z', disabled: true },
        'separator',
        { label: 'Cu&t', shortcut: 'Ctrl+X', disabled: !mutableSel.length, onClick: cmd.cut },
        { label: '&Copy', shortcut: 'Ctrl+C', disabled: !mutableSel.length, onClick: cmd.copy },
        { label: '&Paste', shortcut: 'Ctrl+V', disabled: !clipboard || !writable, onClick: cmd.paste },
        'separator',
        { label: 'Select &All', shortcut: 'Ctrl+A', onClick: cmd.selectAll },
        { label: '&Invert Selection', onClick: cmd.invert },
      ],
    },
    {
      label: '&View',
      items: [
        { label: '&Status Bar', checked: showStatus, onClick: () => setShowStatus(!showStatus) },
        { label: 'Explorer &Bar', checked: showTree, onClick: () => setShowTree(!showTree) },
        { label: 'As &Web Page', checked: webView, onClick: () => setWebView(!webView) },
        'separator',
        ...viewItems,
        'separator',
        { label: 'Arrange &Icons', submenu: arrangeItems },
        'separator',
        { label: '&Refresh', shortcut: 'F5' },
      ],
    },
    { label: '&Go', items: goItems },
    {
      label: 'F&avorites',
      items: [
        { label: '&Add to Favorites...', disabled: true },
        { label: '&Organize Favorites...', disabled: true },
        'separator',
        { label: '&Channels', icon: 'folder', submenu: emptyFolder },
        { label: '&Links', icon: 'folder', submenu: emptyFolder },
        { label: 'Software &Updates', icon: 'folder', submenu: emptyFolder },
      ],
    },
    {
      label: '&Help',
      items: [
        { label: '&Help Topics', onClick: () => showDialog('Help is on the way.\n\n(It is not.)', 'info', 'Help') },
        'separator',
        { label: '&About RetroOS', onClick: showAbout },
      ],
    },
  ];

  const backgroundMenu: MenuEntry[] = [
    { label: '&View', submenu: viewItems },
    'separator',
    { label: 'Arrange &Icons', submenu: arrangeItems },
    { label: 'Line &up Icons', disabled: true },
    'separator',
    { label: 'R&efresh' },
    'separator',
    { label: '&Paste', disabled: !clipboard || !writable, onClick: cmd.paste },
    ...(inBin ? (['separator', { label: 'Empty Recycle &Bin', disabled: !items.length, onClick: emptyRecycleBin }] as MenuEntry[]) : []),
    'separator',
    { label: 'Ne&w', disabled: !writable, submenu: newItems },
    'separator',
    { label: 'P&roperties', onClick: () => openProperties(currentId) },
  ];

  // ---- address dropdown: top-level places plus the current folder's ancestry ----
  const addressEntries = useMemo(() => {
    if (!addrOpen) return [];
    const chain = new Set(pathOf(nodes, currentId).map((n) => n.id));
    const out: { node: FsNode; depth: number }[] = [];
    const walk = (id: string, depth: number) => {
      const n = nodes[id];
      if (!n || !isContainer(n)) return;
      out.push({ node: n, depth });
      for (const c of n.children ?? []) {
        if (chain.has(c) || id === 'desktop' || id === 'computer') walk(c, depth + 1);
      }
    };
    walk('desktop', 0);
    return out;
  }, [addrOpen, nodes, currentId]);

  // ---- render ----
  const isCut = (id: string) => clipboard?.mode === 'cut' && clipboard.ids.includes(id);
  const itemHandlers = (n: FsNode) => ({
    onPointerDown: (e: PointerEvent) => onItemDown(e, n.id),
    onDoubleClick: () => navigate(n.id),
    onContextMenu: (e: MouseEvent) => onItemContext(e, n.id),
  });

  let content;
  if (view === 'details') {
    content = (
      <table className="details">
        <colgroup>
          {COLUMNS.map((c) => (
            <col key={c.key} style={{ width: c.width }} />
          ))}
        </colgroup>
        <thead>
          <tr>
            {COLUMNS.map((c) => (
              <th
                key={c.key}
                className={cx(c.key === 'size' && 'num')}
                onClick={() => setSort((s) => ({ key: c.key, dir: s.key === c.key ? (-s.dir as 1 | -1) : 1 }))}
              >
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {items.map((n) => (
            <tr key={n.id} data-item={n.id} className={cx(sel.includes(n.id) && 'selected', isCut(n.id) && 'cut')} {...itemHandlers(n)}>
              <td>
                <span className="cell-name">
                  <Icon name={iconFor(n)} size={16} />
                  {renaming === n.id ? (
                    <RenameInput initial={n.name} onDone={(name) => commitRename(n.id, name)} />
                  ) : (
                    <span className="fitem-label">{n.name}</span>
                  )}
                </span>
              </td>
              <td className="num">{n.kind === 'file' ? formatSize(sizeOf(nodes, n.id)) : ''}</td>
              <td>{typeLabel(n)}</td>
              <td>{formatDate(n.modified)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  } else {
    content = (
      <div className={`view-${view}`}>
        {items.map((n) => (
          <FileItem
            key={n.id}
            node={n}
            variant={view}
            selected={sel.includes(n.id)}
            cut={isCut(n.id)}
            renaming={renaming === n.id}
            onRename={(name) => commitRename(n.id, name)}
            {...itemHandlers(n)}
          />
        ))}
      </div>
    );
  }

  const statusIds = sel.length ? sel : items.map((n) => n.id);
  const statusBytes = statusIds.reduce((sum, id) => sum + (nodes[id].kind === 'file' ? sizeOf(nodes, id) : 0), 0);

  return (
    <div className="explorer">
      <div className="coolbar">
        <div className="cool-row">
          <span className="gripper" />
          <MenuBar menus={menus} />
          <span className="throbber">
            <Icon name="windows" size={20} />
          </span>
        </div>
        <div className="cool-row">
          <span className="gripper" />
          <div className="toolbar">
            <ToolButton icon="back" label="Back" disabled={!canBack} onClick={goBack} />
            <ToolButton icon="forward" label="Forward" disabled={!canForward} onClick={goForward} />
            <ToolButton icon="up" label="Up" disabled={!folder.parentId} onClick={goUp} />
            <span className="tool-sep" />
            <ToolButton icon="cut" label="Cut" disabled={!mutableSel.length} onClick={cmd.cut} />
            <ToolButton icon="copy" label="Copy" disabled={!mutableSel.length} onClick={cmd.copy} />
            <ToolButton icon="paste" label="Paste" disabled={!clipboard || !writable} onClick={cmd.paste} />
            <span className="tool-sep" />
            <ToolButton icon="undo" label="Undo" disabled />
            <span className="tool-sep" />
            <ToolButton icon="delete" label="Delete" disabled={!mutableSel.length} onClick={() => cmd.del()} />
            <ToolButton icon="properties" label="Properties" onClick={cmd.props} />
            <span className="tool-sep" />
            <ToolButton icon="views" label="Views" onClick={cmd.cycleView} />
          </div>
        </div>
        <div className="cool-row">
          <span className="gripper" />
          <div className="addressbar">
            <span className="addr-label">
              A<u>d</u>dress
            </span>
            <div className="addr-field" ref={addrRef}>
              <Icon name={folderIcon} size={16} />
              <input
                value={address}
                spellCheck={false}
                onChange={(e) => setAddress(e.target.value)}
                onFocus={(e) => e.target.select()}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') goToAddress();
                  if (e.key === 'Escape') setAddress(path);
                }}
              />
              <button className="addr-drop" tabIndex={-1} onClick={() => setAddrOpen(!addrOpen)}>
                <ArrowDown />
              </button>
              {addrOpen && (
                <div className="addr-list">
                  {addressEntries.map(({ node, depth }) => (
                    <div
                      key={node.id}
                      className={cx('addr-list-item', node.id === currentId && 'current')}
                      style={{ paddingLeft: 4 + depth * 12 }}
                      onClick={() => {
                        setAddrOpen(false);
                        navigate(node.id);
                      }}
                    >
                      <Icon name={iconFor(node)} size={16} />
                      {node.name}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="explorer-main">
        {showTree && (
          <>
            <div className="tree-pane" style={{ width: treeWidth }}>
              <div className="pane-header">
                <span>All Folders</span>
                <button className="pane-close" aria-label="Close Explorer Bar" onClick={() => setShowTree(false)}>
                  <CloseGlyph />
                </button>
              </div>
              <FolderTree nodes={nodes} expanded={expanded} currentId={currentId} onToggle={toggleExpanded} onSelect={navigate} />
            </div>
            <div className="splitter" onPointerDown={startSplitDrag} />
          </>
        )}
        <div className="files-area">
          {webView && <WebView nodes={nodes} folder={folder} selection={sel} />}
          <div
            ref={filesRef}
            className="files"
            tabIndex={0}
            onKeyDown={onKeyDown}
            onPointerDown={onBackgroundDown}
            onContextMenu={onBackgroundContext}
          >
            {content}
          </div>
        </div>
      </div>

      {showStatus && (
        <div className="statusbar">
          <div className="status-cell grow">{sel.length ? `${sel.length} object(s) selected` : `${items.length} object(s)`}</div>
          <div className="status-cell" style={{ width: 90 }}>
            {formatBytes(statusBytes)}
          </div>
          <div className="status-cell" style={{ width: 130 }}>
            <Icon name="computer" size={16} />
            My Computer
          </div>
          <SizeGrip />
        </div>
      )}

      {ctx && (
        <ContextMenu
          x={ctx.x}
          y={ctx.y}
          items={
            ctx.target && nodes[ctx.target]
              ? itemMenu(ctx.target, sel, {
                  open: navigate,
                  rename: (id) => {
                    setSelected([id]);
                    setRenaming(id);
                  },
                })
              : backgroundMenu
          }
          onClose={() => setCtx(null)}
        />
      )}
    </div>
  );
}
