import { useFs } from '../fs/fsStore';
import { canWrite, getExt, inRecycleBin, isContainer, resolvePath, TEXT_EXTS } from '../fs/fsUtils';
import { playChord } from '../utils/sound';
import { useWM } from './windowStore';
import type { DialogButton, DialogVariant } from './windowStore';

export function showDialog(message: string, variant: DialogVariant = 'error', title = 'Error', buttons?: DialogButton[]) {
  if (variant !== 'info') playChord();
  const lines = message.split('\n').length;
  useWM
    .getState()
    .open({ type: 'dialog', message, variant, buttons }, { title, width: 380, height: 110 + lines * 13, resizable: false, center: true });
}

export const confirmDialog = (message: string, title: string, onYes: () => void) =>
  showDialog(message, 'warning', title, [{ label: '&Yes', action: onYes }, { label: '&No' }]);

export function showAbout() {
  showDialog(
    'RetroOS 98\nVersion 4.10.1998\n\nA side-project love letter to the desktop of 1998.\nBuilt with React, TypeScript, Vite and Zustand.',
    'info',
    'About RetroOS',
  );
}

export function openExplorer(nodeId = 'desktop') {
  useWM.getState().open({ type: 'explorer', nodeId }, { title: 'Exploring', icon: 'explorer', width: 720, height: 480, minW: 320, minH: 220 });
}

export function openNotepad(fileId?: string) {
  const wm = useWM.getState();
  if (fileId) {
    const existing = wm.windows.find((w) => w.app.type === 'notepad' && w.app.fileId === fileId);
    if (existing) return wm.focus(existing.id);
  }
  wm.open({ type: 'notepad', fileId }, { title: 'Notepad', icon: 'notepad', width: 540, height: 400, minW: 220, minH: 140 });
}

export function openPool() {
  const wm = useWM.getState();
  const existing = wm.windows.find((w) => w.app.type === 'pool');
  if (existing) return wm.focus(existing.id);
  wm.open({ type: 'pool' }, { title: 'Pool', icon: 'pool', width: 652, height: 540, minW: 240, minH: 220 });
}

export function openTetris() {
  const wm = useWM.getState();
  const existing = wm.windows.find((w) => w.app.type === 'tetris');
  if (existing) return wm.focus(existing.id);
  wm.open({ type: 'tetris' }, { title: 'Tetris', icon: 'tetris', width: 330, height: 500, minW: 280, minH: 360 });
}

export function openProperties(nodeId: string) {
  const node = useFs.getState().nodes[nodeId];
  if (!node) return;
  useWM.getState().open({ type: 'properties', nodeId }, { title: `${node.name} Properties`, width: 360, height: 420, resizable: false });
}

export function openRun() {
  const wm = useWM.getState();
  const existing = wm.windows.find((w) => w.app.type === 'run');
  if (existing) return wm.focus(existing.id);
  wm.open({ type: 'run' }, { title: 'Run', width: 370, height: 170, resizable: false, x: 6, y: window.innerHeight - 28 - 176 });
}

export function openShutdown() {
  const wm = useWM.getState();
  const existing = wm.windows.find((w) => w.app.type === 'shutdown');
  if (existing) return wm.focus(existing.id);
  wm.open({ type: 'shutdown' }, { title: 'Shut Down Windows', width: 340, height: 190, resizable: false, center: true });
}

const PROGRAM_MESSAGES: Record<string, [title: string, message: string, variant: DialogVariant]> = {
  'winmine.exe': ['Minesweeper', 'Minesweeper is still being swept for mines.\n\nCheck back in a future build!', 'info'],
  'sol.exe': ['Solitaire', 'The cards are still being shuffled. Coming soon!', 'info'],
  'freecell.exe': ['FreeCell', 'All 32,000 deals are still being dealt. Coming soon!', 'info'],
  'mspaint.exe': ['Paint', 'Paint is still drying. Please try again later.', 'info'],
  'wordpad.exe': ['WordPad', 'WordPad is on vacation. Try Notepad instead!', 'info'],
  'iexplore.exe': [
    'Internet Explorer',
    'The page cannot be displayed.\n\nThe server you are looking for is unavailable.\nPlease try again in 1999.',
    'warning',
  ],
  'setup.exe': ['Setup', 'Setup has detected that RetroOS 98 is already perfectly installed.', 'info'],
  'command.com': ['MS-DOS Prompt', 'MS-DOS mode is not available in this decade.', 'warning'],
};

function showProgramMessage(fileName: string): boolean {
  const program = PROGRAM_MESSAGES[fileName];
  if (program) showDialog(program[1], program[2], program[0]);
  return !!program;
}

export function openNode(id: string) {
  const node = useFs.getState().nodes[id];
  if (!node) return;
  if (node.kind === 'floppy') {
    return showDialog(`${node.letter}:\\ is not accessible.\n\nThe device is not ready.`, 'error', node.name);
  }
  if (isContainer(node)) return openExplorer(id);

  const lower = node.name.toLowerCase();
  const ext = getExt(lower);
  if (lower === 'notepad.exe') return openNotepad();
  if (lower === 'explorer.exe') return openExplorer('c');
  if (lower === 'pool.exe') return openPool();
  if (lower === 'tetris.exe') return openTetris();
  if (TEXT_EXTS.includes(ext)) return openNotepad(id);

  if (showProgramMessage(lower)) return;
  if (ext === 'exe') return showDialog(`${node.name} is not a valid Win32 application.`, 'error', node.name);
  if (ext === 'cpl') {
    return showDialog(`The ${node.name.replace(/\.cpl$/i, '')} applet is still under construction.`, 'info', 'Control Panel');
  }
  if (ext === 'bmp') return showDialog('Paint is still drying. Please try again later.', 'info', node.name);
  showDialog(
    `There is no program associated with ${node.name}.\n\nTry renaming it to end in .txt to open it with Notepad.`,
    'warning',
    'Open With',
  );
}

/** Returns the new node id, or null if the folder is read-only. */
export function createIn(parentId: string, kind: 'folder' | 'file'): string | null {
  const fs = useFs.getState();
  if (!canWrite(fs.nodes, parentId)) return null;
  return fs.createNode(parentId, kind, kind === 'folder' ? 'New Folder' : 'New Text Document.txt');
}

export function renameNode(id: string, name: string) {
  const fs = useFs.getState();
  if (fs.nodes[id]?.name === name) return;
  const error = fs.rename(id, name);
  if (error) showDialog(error, 'error', 'Error Renaming File');
}

export function deleteNodes(ids: string[], permanent = false) {
  const fs = useFs.getState();
  const targets = ids.filter((id) => fs.nodes[id] && !fs.nodes[id].system);
  if (!targets.length) return;
  const alreadyRecycled = targets.every((id) => inRecycleBin(fs.nodes, id));
  if (permanent || alreadyRecycled) {
    const what = targets.length === 1 ? `'${fs.nodes[targets[0]].name}'` : `these ${targets.length} items`;
    confirmDialog(`Are you sure you want to delete ${what}?`, 'Confirm File Delete', () =>
      useFs.getState().remove(targets, true),
    );
    return;
  }
  fs.remove(targets);
}

export function emptyRecycleBin() {
  const count = useFs.getState().nodes.recycle.children?.length ?? 0;
  if (!count) return;
  confirmDialog(
    `Are you sure you want to delete ${count === 1 ? 'this item' : `all ${count} items`} in the Recycle Bin?`,
    'Confirm File Delete',
    () => useFs.getState().emptyRecycleBin(),
  );
}

/** Start > Run. Returns false if nothing matched. */
export function runCommand(input: string): boolean {
  const cmd = input.trim().toLowerCase().replace(/\.(exe|com)$/, '');
  const builtins: Record<string, () => void> = {
    notepad: () => openNotepad(),
    explorer: () => openExplorer('c'),
    winver: showAbout,
    pool: openPool,
    tetris: openTetris,
    command: () => showProgramMessage('command.com'),
    cmd: () => showProgramMessage('command.com'),
  };
  if (!cmd) return true;
  if (builtins[cmd]) {
    builtins[cmd]();
    return true;
  }
  const id = resolvePath(useFs.getState().nodes, input);
  if (!id) return false;
  openNode(id);
  return true;
}
