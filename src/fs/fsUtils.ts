import type { IconName } from '../components/Icon';
import type { FsNode, Nodes } from './types';

export const isContainer = (n: FsNode) => n.kind !== 'file';

export const getExt = (name: string) => {
  const i = name.lastIndexOf('.');
  return i > 0 ? name.slice(i + 1).toLowerCase() : '';
};

export const TEXT_EXTS = ['txt', 'ini', 'bat', 'sys', 'inf', 'log', 'md'];

const EXT_TYPES: Record<string, string> = {
  txt: 'Text Document',
  log: 'Text Document',
  md: 'Text Document',
  ini: 'Configuration Settings',
  bat: 'MS-DOS Batch File',
  sys: 'System file',
  inf: 'Setup Information',
  exe: 'Application',
  com: 'MS-DOS Application',
  dll: 'Application Extension',
  vxd: 'Virtual device driver',
  bmp: 'Bitmap Image',
  cpl: 'Control Panel extension',
  ttf: 'TrueType Font file',
};

export function typeLabel(n: FsNode): string {
  switch (n.kind) {
    case 'folder':
      return 'File Folder';
    case 'drive':
      return 'Local Disk';
    case 'floppy':
      return '3½ Inch Floppy Disk';
    case 'cdrom':
      return 'CD-ROM Disc';
    case 'file': {
      const ext = getExt(n.name);
      return EXT_TYPES[ext] ?? (ext ? `${ext.toUpperCase()} File` : 'File');
    }
    default:
      return 'System Folder';
  }
}

const SPECIAL_FILE_ICONS: Record<string, IconName> = {
  'notepad.exe': 'notepad',
  'explorer.exe': 'explorer',
  'command.com': 'dos',
  'pool.exe': 'pool',
  'tetris.exe': 'tetris',
};

export function iconFor(n: FsNode, open = false): IconName {
  switch (n.kind) {
    case 'desktop':
      return 'desktop';
    case 'computer':
      return 'computer';
    case 'drive':
      return 'drive';
    case 'floppy':
      return 'floppy';
    case 'cdrom':
      return 'cdrom';
    case 'network':
      return 'network';
    case 'documents':
      return 'documents';
    case 'control':
      return 'control';
    case 'recycle':
      return n.children?.length ? 'recycleFull' : 'recycle';
    case 'folder':
      return open ? 'folderOpen' : 'folder';
    case 'file': {
      const special = SPECIAL_FILE_ICONS[n.name.toLowerCase()];
      if (special) return special;
      const ext = getExt(n.name);
      if (TEXT_EXTS.includes(ext)) return ext === 'bat' ? 'dos' : 'text';
      if (ext === 'exe') return 'app';
      if (ext === 'dll' || ext === 'cpl' || ext === 'vxd') return 'gear';
      if (ext === 'bmp') return 'image';
      return 'file';
    }
  }
}

/** Chain of nodes from the root (Desktop) down to `id`, inclusive. */
export function pathOf(nodes: Nodes, id: string): FsNode[] {
  const chain: FsNode[] = [];
  let cur: FsNode | undefined = nodes[id];
  while (cur) {
    chain.unshift(cur);
    cur = cur.parentId ? nodes[cur.parentId] : undefined;
  }
  return chain;
}

export function isDescendant(nodes: Nodes, id: string, ancestorId: string): boolean {
  let cur = nodes[id]?.parentId;
  while (cur) {
    if (cur === ancestorId) return true;
    cur = nodes[cur]?.parentId ?? null;
  }
  return false;
}

export const inRecycleBin = (nodes: Nodes, id: string) => isDescendant(nodes, id, 'recycle');

export function displayPath(nodes: Nodes, id: string): string {
  const chain = pathOf(nodes, id);
  const driveIdx = chain.findIndex((n) => n.letter);
  if (driveIdx === -1) return chain[chain.length - 1]?.name ?? '';
  const rest = chain.slice(driveIdx + 1).map((n) => n.name);
  return `${chain[driveIdx].letter}:\\${rest.join('\\')}`;
}

export function resolvePath(nodes: Nodes, input: string): string | null {
  const norm = (s: string) => s.trim().replace(/\//g, '\\').replace(/\\+$/, '').toLowerCase();
  const q = norm(input);
  if (!q) return null;
  for (const n of Object.values(nodes)) {
    if (inRecycleBin(nodes, n.id)) continue;
    if (norm(displayPath(nodes, n.id)) === q) return n.id;
  }
  return null;
}

const READ_ONLY_KINDS = ['computer', 'network', 'recycle', 'control', 'cdrom', 'floppy'];

/** Whether new items can be created / pasted inside this container. */
export function canWrite(nodes: Nodes, id: string): boolean {
  const node = nodes[id];
  if (!node || !isContainer(node)) return false;
  return !pathOf(nodes, id).some((n) => READ_ONLY_KINDS.includes(n.kind));
}

export function sizeOf(nodes: Nodes, id: string): number {
  const n = nodes[id];
  if (!n) return 0;
  if (n.kind === 'file') return n.size ?? n.content?.length ?? 0;
  return (n.children ?? []).reduce((sum, c) => sum + sizeOf(nodes, c), 0);
}

export function countContents(nodes: Nodes, id: string) {
  let files = 0;
  let folders = 0;
  const walk = (nid: string) => {
    for (const c of nodes[nid]?.children ?? []) {
      const child = nodes[c];
      if (!child) continue;
      if (isContainer(child)) {
        folders++;
        walk(c);
      } else files++;
    }
  };
  walk(id);
  return { files, folders };
}

const DRIVE_SPECS: Record<string, { capacity: number; baseUsed: number; full?: boolean }> = {
  A: { capacity: 1_457_664, baseUsed: 0 },
  C: { capacity: 2_147_483_648, baseUsed: 1_342_177_280 },
  D: { capacity: 681_574_400, baseUsed: 0, full: true },
};

export function driveInfo(nodes: Nodes, node: FsNode) {
  const spec = node.letter ? DRIVE_SPECS[node.letter] : undefined;
  if (!spec) return null;
  const used = spec.full ? spec.capacity : Math.min(spec.capacity, spec.baseUsed + sizeOf(nodes, node.id));
  return { capacity: spec.capacity, used };
}

/** Details-view style size, e.g. "1KB". */
export function formatSize(bytes: number): string {
  if (bytes === 0) return '0KB';
  return `${Math.max(1, Math.ceil(bytes / 1024)).toLocaleString()}KB`;
}

/** Status-bar style size, e.g. "342 bytes", "1.25KB", "2.00GB". */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} bytes`;
  if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(bytes < 10 * 1024 ? 2 : 1)}KB`;
  if (bytes < 1024 ** 3) return `${(bytes / 1024 ** 2).toFixed(1)}MB`;
  return `${(bytes / 1024 ** 3).toFixed(2)}GB`;
}

export function formatDate(ts: number): string {
  const d = new Date(ts);
  const yy = String(d.getFullYear() % 100).padStart(2, '0');
  const h = d.getHours() % 12 || 12;
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${d.getMonth() + 1}/${d.getDate()}/${yy} ${h}:${mm} ${d.getHours() < 12 ? 'AM' : 'PM'}`;
}

/** System nodes keep their order, then folders, then files, both alphabetical. */
export function sortForDisplay(nodes: Nodes, ids: string[]): FsNode[] {
  const rank = (n: FsNode) => (n.system ? 0 : isContainer(n) ? 1 : 2);
  return ids
    .map((id) => nodes[id])
    .filter((n): n is FsNode => !!n)
    .sort((a, b) => rank(a) - rank(b) || (a.system ? 0 : a.name.localeCompare(b.name, undefined, { numeric: true })));
}
