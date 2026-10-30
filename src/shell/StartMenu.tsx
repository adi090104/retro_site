import { useRef } from 'react';
import { Icon } from '../components/Icon';
import type { IconName } from '../components/Icon';
import { AccessLabel, MenuList, useOutsideClose } from '../components/Menu';
import type { MenuEntry } from '../components/Menu';
import { ArrowRight } from '../components/glyphs';
import { useFs } from '../fs/fsStore';
import { iconFor } from '../fs/fsUtils';
import { confirmDialog, openExplorer, openNode, openNotepad, openPool, openRun, openTetris, openShutdown, showAbout, showDialog } from '../state/actions';
import { cx } from '../utils/cx';

interface StartItem {
  label: string;
  icon: IconName;
  onClick?: () => void;
  submenu?: MenuEntry[];
}

export function StartMenu({ onClose }: { onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const nodes = useFs((s) => s.nodes);
  useOutsideClose(ref, onClose, true, '[data-start-button]');

  const recentDocs: MenuEntry[] = (nodes.documents.children ?? [])
    .map((id) => nodes[id])
    .filter((n) => n?.kind === 'file')
    .map((n) => ({ label: n.name, icon: iconFor(n), onClick: () => openNode(n.id) }));

  const items: (StartItem | 'separator')[] = [
    {
      label: '&Programs',
      icon: 'programs',
      submenu: [
        {
          label: 'Accessories',
          icon: 'programs',
          submenu: [
            { label: 'Notepad', icon: 'notepad', onClick: () => openNotepad() },
            {
              label: 'Games',
              icon: 'programs',
              submenu: [
                { label: 'Tetris', icon: 'tetris', onClick: openTetris },
                { label: 'Minesweeper', icon: 'app', onClick: () => runGame('winmine.exe') },
              ],
            },
          ],
        },
        { label: 'Pool', icon: 'pool', onClick: openPool },
        { label: 'MS-DOS Prompt', icon: 'dos', onClick: () => showDialog('MS-DOS mode is not available in this decade.', 'warning', 'MS-DOS Prompt') },
        { label: 'Windows Explorer', icon: 'explorer', onClick: () => openExplorer('c') },
      ],
    },
    {
      label: '&Documents',
      icon: 'documents',
      submenu: [
        { label: 'My Documents', icon: 'documents', onClick: () => openExplorer('documents') },
        'separator',
        ...(recentDocs.length ? recentDocs : [{ label: '(Empty)', disabled: true }]),
      ],
    },
    {
      label: '&Settings',
      icon: 'control',
      submenu: [
        { label: '&Control Panel', icon: 'control', onClick: () => openExplorer('control') },
        'separator',
        {
          label: '&Reset RetroOS...',
          icon: 'warning',
          onClick: () =>
            confirmDialog('This will restore every file and folder to how it shipped in 1998.\n\nContinue?', 'Reset RetroOS', () =>
              useFs.getState().reset(),
            ),
        },
      ],
    },
    { label: '&Find', icon: 'find', submenu: [{ label: '&Files or Folders...', icon: 'find', disabled: true }] },
    { label: '&Help', icon: 'help', onClick: showAbout },
    { label: '&Run...', icon: 'run', onClick: openRun },
    'separator',
    { label: 'Sh&ut Down...', icon: 'shutdown', onClick: openShutdown },
  ];

  return (
    <div className="start-menu" ref={ref} onPointerDown={(e) => e.stopPropagation()}>
      <div className="start-banner">
        <span>
          <b>Retro</b>OS 98
        </span>
      </div>
      <div className="start-items">
        {items.map((it, i) =>
          it === 'separator' ? (
            <div key={i} className="menu-sep" />
          ) : (
            <div
              key={it.label}
              className={cx('start-item', it.submenu && 'has-sub')}
              onClick={() => {
                if (it.submenu) return;
                onClose();
                it.onClick?.();
              }}
            >
              <Icon name={it.icon} size={32} />
              <span className="start-label">
                <AccessLabel text={it.label} />
              </span>
              {it.submenu && (
                <>
                  <span className="menu-arrow">
                    <ArrowRight />
                  </span>
                  <MenuList className="submenu" items={it.submenu} onClose={onClose} />
                </>
              )}
            </div>
          ),
        )}
      </div>
    </div>
  );
}

function runGame(fileName: string) {
  const { nodes } = useFs.getState();
  const game = Object.values(nodes).find((n) => n.name.toLowerCase() === fileName);
  if (game) openNode(game.id);
  else showDialog(`Cannot find ${fileName}.`, 'error', 'Games');
}
