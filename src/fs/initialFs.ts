import type { FsNode, NodeKind, Nodes } from './types';

const WELCOME = `Welcome to RetroOS 98!
======================

This is a little art project: a love letter to the
desktops of the late '90s.

Things to try:
  * Double-click "My Computer" and go exploring.
  * Right-click inside a folder to make new files.
  * Drag windows around by their title bars.
  * Rename things with F2, delete them with Del.
  * Peek inside the Recycle Bin.
  * Try Start > Run... and type "notepad".
  * Start > Shut Down... when you're done. ;)

Everything you create is saved in your browser.
`;

const README = `README.TXT
----------

Thanks for using RetroOS 98.

If your computer makes a strange noise, that is
normal. If it stops making a strange noise, that
is also normal.

Remember: always eject your floppy disk before
throwing your computer out the window.
`;

const TODO = `TODO
----
[x] defragment C:
[x] beat Minesweeper on Expert
[ ] figure out what "Network Neighborhood" is
[ ] make a personal homepage on GeoCities
[ ] find out who keeps moving the mouse pointer
[ ] burn a mixtape CD (80 min!!)
`;

const DIARY = `Dear diary,

Today I changed my wallpaper to "Clouds".
It changed my life.

I also discovered you can hold down Shift while
deleting to skip the Recycle Bin. Living dangerously.

P.S. Do NOT open the floppy drive. Trust me.
`;

const HOMEWORK = `Homework - Due Monday

1. Explain how the internet works.
   - it's a series of tubes?

(I deleted this. Please don't restore it.)
`;

const AUTOEXEC = `@ECHO OFF
PROMPT $p$g
PATH C:\\WINDOWS;C:\\WINDOWS\\COMMAND
SET TEMP=C:\\WINDOWS\\TEMP
REM Keep calm and carry on.
`;

const CONFIG_SYS = `DEVICE=C:\\WINDOWS\\HIMEM.SYS
DEVICE=C:\\WINDOWS\\EMM386.EXE NOEMS
DOS=HIGH,UMB
FILES=40
BUFFERS=20
`;

const WIN_INI = `[windows]
load=
run=
NullPort=None

[Desktop]
Wallpaper=(None)
TileWallpaper=0
Pattern=(None)

[fonts]
[extensions]
txt=notepad.exe ^.txt
`;

const SYSTEM_INI = `[boot]
shell=Explorer.exe
system.drv=system.drv
drivers=mmsystem.dll power.drv

[386Enh]
woafont=dosapp.fon
`;

const AUTORUN = `[autorun]
open=SETUP.EXE
icon=SETUP.EXE,0
`;

const CD_README = `RetroOS 98 Companion CD
=======================

This CD contains:
  - SETUP.EXE      Reinstalls nothing, very quickly.
  - AUTORUN.INF    Makes the CD spin up dramatically.
`;

/** Desktop programs; `since` is the storage version that introduced each one. */
export const DESKTOP_APPS = [
  { id: 'pool-app', name: 'Pool.exe', size: 1_998_000, since: 2 },
  { id: 'tetris-app', name: 'Tetris.exe', size: 49_152, since: 3 },
];

export function createInitialNodes(): Nodes {
  const nodes: Nodes = {};
  const t = new Date(1998, 5, 25, 9, 30).getTime();
  let counter = 0;

  const add = (
    parentId: string | null,
    name: string,
    kind: NodeKind,
    extra: Partial<FsNode> = {},
    id = `init-${++counter}`,
  ) => {
    nodes[id] = {
      id,
      name,
      kind,
      parentId,
      modified: t + counter * 7_200_000,
      ...(kind !== 'file' ? { children: [] } : {}),
      ...extra,
    };
    if (parentId) nodes[parentId].children!.push(id);
    return id;
  };
  const file = (parentId: string, name: string, content: string) => add(parentId, name, 'file', { content });
  const bin = (parentId: string, name: string, size: number) => add(parentId, name, 'file', { size });

  add(null, 'Desktop', 'desktop', { system: true }, 'desktop');
  add('desktop', 'My Computer', 'computer', { system: true }, 'computer');
  add('desktop', 'My Documents', 'documents', { system: true }, 'documents');
  add('desktop', 'Network Neighborhood', 'network', { system: true }, 'network');
  add('desktop', 'Recycle Bin', 'recycle', { system: true }, 'recycle');
  file('desktop', 'Welcome.txt', WELCOME);
  for (const app of DESKTOP_APPS) add('desktop', app.name, 'file', { size: app.size }, app.id);

  add('computer', '3½ Floppy (A:)', 'floppy', { system: true, letter: 'A' }, 'a');
  add('computer', 'Local Disk (C:)', 'drive', { system: true, letter: 'C' }, 'c');
  add('computer', 'CD-ROM (D:)', 'cdrom', { system: true, letter: 'D' }, 'd');
  add('computer', 'Control Panel', 'control', { system: true }, 'control');

  const programFiles = add('c', 'Program Files', 'folder');
  const accessories = add(programFiles, 'Accessories', 'folder');
  bin(accessories, 'mspaint.exe', 344_064);
  bin(accessories, 'wordpad.exe', 204_800);
  const games = add(accessories, 'Games', 'folder');
  bin(games, 'winmine.exe', 24_576);
  bin(games, 'sol.exe', 180_224);
  bin(games, 'freecell.exe', 32_768);
  const ie = add(programFiles, 'Internet Explorer', 'folder');
  bin(ie, 'iexplore.exe', 93_184);

  const windows = add('c', 'Windows', 'folder');
  const system = add(windows, 'System', 'folder');
  bin(system, 'kernel32.dll', 425_984);
  bin(system, 'user.exe', 74_608);
  bin(system, 'gdi.exe', 135_536);
  bin(system, 'vmm32.vxd', 1_036_288);
  const fonts = add(windows, 'Fonts', 'folder');
  bin(fonts, 'arial.ttf', 65_412);
  bin(fonts, 'times.ttf', 82_256);
  bin(fonts, 'comic.ttf', 126_660);
  add(windows, 'Temp', 'folder');
  bin(windows, 'explorer.exe', 204_288);
  bin(windows, 'notepad.exe', 52_736);
  file(windows, 'win.ini', WIN_INI);
  file(windows, 'system.ini', SYSTEM_INI);

  add('c', 'My Games', 'folder');
  file('c', 'autoexec.bat', AUTOEXEC);
  file('c', 'config.sys', CONFIG_SYS);
  bin('c', 'command.com', 93_890);

  file('d', 'autorun.inf', AUTORUN);
  bin('d', 'setup.exe', 3_211_264);
  file('d', 'readme.txt', CD_README);

  bin('control', 'Display.cpl', 61_440);
  bin('control', 'Mouse.cpl', 28_672);
  bin('control', 'Sounds.cpl', 40_960);
  bin('control', 'Add-Remove Programs.cpl', 98_304);

  file('documents', 'readme.txt', README);
  file('documents', 'todo.txt', TODO);
  const pictures = add('documents', 'Pictures', 'folder');
  bin(pictures, 'sunset.bmp', 230_454);
  bin(pictures, 'clouds.bmp', 307_254);
  const secret = add('documents', 'Secret Stuff', 'folder');
  file(secret, 'diary.txt', DIARY);

  add('network', 'Entire Network', 'folder');

  add('recycle', 'old_homework.txt', 'file', { content: HOMEWORK, origParentId: 'documents' });

  return nodes;
}
