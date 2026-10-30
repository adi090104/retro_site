import { create } from 'zustand';
import type { IconName } from '../components/Icon';

export type DialogVariant = 'error' | 'info' | 'warning';

export interface DialogButton {
  label: string;
  action?: () => void;
}

export type AppSpec =
  | { type: 'explorer'; nodeId: string }
  | { type: 'notepad'; fileId?: string }
  | { type: 'dialog'; message: string; variant: DialogVariant; buttons?: DialogButton[] }
  | { type: 'properties'; nodeId: string }
  | { type: 'run' }
  | { type: 'pool' }
  | { type: 'tetris' }
  | { type: 'shutdown' };

export interface WinState {
  id: string;
  app: AppSpec;
  title: string;
  icon?: IconName;
  x: number;
  y: number;
  width: number;
  height: number;
  minW: number;
  minH: number;
  resizable: boolean;
  minimized: boolean;
  maximized: boolean;
  z: number;
}

export interface OpenOptions {
  title: string;
  icon?: IconName;
  width: number;
  height: number;
  minW?: number;
  minH?: number;
  resizable?: boolean;
  center?: boolean;
  x?: number;
  y?: number;
}

export type Bounds = Pick<WinState, 'x' | 'y' | 'width' | 'height'>;

interface WMState {
  windows: WinState[];
  activeId: string | null;
  nextZ: number;
  open: (app: AppSpec, opts: OpenOptions) => string;
  close: (id: string) => void;
  /** Like close, but lets the app veto (e.g. Notepad asking to save). */
  requestClose: (id: string) => void;
  focus: (id: string) => void;
  minimize: (id: string) => void;
  minimizeAll: () => void;
  toggleMaximize: (id: string) => void;
  setBounds: (id: string, bounds: Partial<Bounds>) => void;
  setTitle: (id: string, title: string, icon?: IconName) => void;
  closeAll: () => void;
}

export const TASKBAR_HEIGHT = 28;

const closeGuards = new Map<string, () => boolean>();

/** Register a callback that returns false to block closing a window. */
export function setCloseGuard(id: string, guard: (() => boolean) | null) {
  if (guard) closeGuards.set(id, guard);
  else closeGuards.delete(id);
}

const topmost = (windows: WinState[]) =>
  windows.filter((w) => !w.minimized).sort((a, b) => b.z - a.z)[0]?.id ?? null;

let seq = 0;

export const useWM = create<WMState>((set, get) => ({
  windows: [],
  activeId: null,
  nextZ: 1,

  open: (app, o) => {
    const id = `win-${++seq}`;
    const { windows, nextZ } = get();
    const deskW = window.innerWidth;
    const deskH = window.innerHeight - TASKBAR_HEIGHT;
    const width = Math.min(o.width, deskW - 8);
    const height = Math.min(o.height, deskH - 8);
    let x: number;
    let y: number;
    if (o.x !== undefined && o.y !== undefined) {
      x = o.x;
      y = o.y;
    } else if (o.center) {
      x = (deskW - width) / 2;
      y = (deskH - height) / 2 - 40;
    } else {
      const step = windows.filter((w) => !w.minimized).length % 8;
      x = 60 + step * 26;
      y = 30 + step * 26;
    }
    x = Math.round(Math.max(0, Math.min(x, deskW - width)));
    y = Math.round(Math.max(0, Math.min(y, deskH - height)));

    const win: WinState = {
      id,
      app,
      title: o.title,
      icon: o.icon,
      x,
      y,
      width,
      height,
      minW: o.minW ?? 200,
      minH: o.minH ?? 120,
      resizable: o.resizable ?? true,
      minimized: false,
      maximized: false,
      z: nextZ,
    };
    // z steps by 2 so a modal overlay can sit at z - 1 underneath its dialog.
    set({ windows: [...windows, win], activeId: id, nextZ: nextZ + 2 });
    return id;
  },

  close: (id) => {
    closeGuards.delete(id);
    set((s) => {
      const windows = s.windows.filter((w) => w.id !== id);
      return { windows, activeId: s.activeId === id ? topmost(windows) : s.activeId };
    });
  },

  requestClose: (id) => {
    const guard = closeGuards.get(id);
    if (guard && !guard()) return;
    get().close(id);
  },

  focus: (id) =>
    set((s) => {
      const win = s.windows.find((w) => w.id === id);
      if (!win) return s;
      if (s.activeId === id && !win.minimized && win.z === s.nextZ - 2) return s;
      return {
        windows: s.windows.map((w) => (w.id === id ? { ...w, z: s.nextZ, minimized: false } : w)),
        activeId: id,
        nextZ: s.nextZ + 2,
      };
    }),

  minimize: (id) =>
    set((s) => {
      const windows = s.windows.map((w) => (w.id === id ? { ...w, minimized: true } : w));
      return { windows, activeId: s.activeId === id ? topmost(windows) : s.activeId };
    }),

  minimizeAll: () => set((s) => ({ windows: s.windows.map((w) => ({ ...w, minimized: true })), activeId: null })),

  toggleMaximize: (id) =>
    set((s) => ({ windows: s.windows.map((w) => (w.id === id ? { ...w, maximized: !w.maximized } : w)) })),

  setBounds: (id, b) => set((s) => ({ windows: s.windows.map((w) => (w.id === id ? { ...w, ...b } : w)) })),

  setTitle: (id, title, icon) =>
    set((s) => {
      const win = s.windows.find((w) => w.id === id);
      if (!win || (win.title === title && win.icon === icon)) return s;
      return { windows: s.windows.map((w) => (w.id === id ? { ...w, title, icon } : w)) };
    }),

  closeAll: () => {
    closeGuards.clear();
    set({ windows: [], activeId: null });
  },
}));
