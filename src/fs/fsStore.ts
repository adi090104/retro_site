import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { createInitialNodes, DESKTOP_APPS } from './initialFs';
import { inRecycleBin, isDescendant } from './fsUtils';
import type { FsNode, Nodes } from './types';

export interface Clipboard {
  ids: string[];
  mode: 'cut' | 'copy';
}

interface FsState {
  nodes: Nodes;
  clipboard: Clipboard | null;
  createNode: (parentId: string, kind: 'folder' | 'file', name: string, content?: string) => string;
  /** Returns an error message, or null on success. */
  rename: (id: string, name: string) => string | null;
  /** Moves to the Recycle Bin, or destroys if already inside it (or `permanent`). */
  remove: (ids: string[], permanent?: boolean) => void;
  restore: (ids: string[]) => void;
  emptyRecycleBin: () => void;
  writeFile: (id: string, content: string) => void;
  setClipboard: (ids: string[], mode: Clipboard['mode']) => void;
  paste: (targetId: string) => void;
  reset: () => void;
}

const newId = () => `n-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;

const INVALID_CHARS = /[\\/:*?"<>|]/;

function siblingNames(nodes: Nodes, parentId: string, excludeId?: string) {
  return new Set(
    (nodes[parentId]?.children ?? [])
      .filter((c) => c !== excludeId)
      .map((c) => nodes[c]?.name.toLowerCase()),
  );
}

export function uniqueName(nodes: Nodes, parentId: string, name: string, excludeId?: string) {
  const taken = siblingNames(nodes, parentId, excludeId);
  if (!taken.has(name.toLowerCase())) return name;
  const dot = name.lastIndexOf('.');
  const base = dot > 0 ? name.slice(0, dot) : name;
  const ext = dot > 0 ? name.slice(dot) : '';
  for (let i = 2; ; i++) {
    const candidate = `${base} (${i})${ext}`;
    if (!taken.has(candidate.toLowerCase())) return candidate;
  }
}

// The helpers below mutate a shallow copy of the node map; touched nodes are replaced, never edited.
function detach(nodes: Nodes, id: string) {
  const parentId = nodes[id]?.parentId;
  const parent = parentId ? nodes[parentId] : undefined;
  if (parent) nodes[parent.id] = { ...parent, children: (parent.children ?? []).filter((c) => c !== id) };
}

function attach(nodes: Nodes, id: string, parentId: string) {
  const parent = nodes[parentId];
  nodes[parentId] = { ...parent, children: [...(parent.children ?? []), id] };
  nodes[id] = { ...nodes[id], parentId };
}

function destroy(nodes: Nodes, id: string) {
  nodes[id]?.children?.forEach((c) => destroy(nodes, c));
  delete nodes[id];
}

function cloneTree(nodes: Nodes, id: string, parentId: string, name?: string): string {
  const src = nodes[id];
  const cloneId = newId();
  const clone: FsNode = {
    id: cloneId,
    name: name ?? src.name,
    kind: src.kind,
    parentId,
    modified: Date.now(),
    content: src.content,
    size: src.size,
    children: src.children ? [] : undefined,
  };
  nodes[cloneId] = clone;
  for (const c of src.children ?? []) clone.children!.push(cloneTree(nodes, c, cloneId));
  return cloneId;
}

export const useFs = create<FsState>()(
  persist(
    (set, get) => ({
      nodes: createInitialNodes(),
      clipboard: null,

      createNode: (parentId, kind, name, content) => {
        const id = newId();
        set((s) => {
          const nodes = { ...s.nodes };
          nodes[id] = {
            id,
            name: uniqueName(nodes, parentId, name),
            kind,
            parentId,
            modified: Date.now(),
            ...(kind === 'folder' ? { children: [] } : { content: content ?? '' }),
          };
          attach(nodes, id, parentId);
          return { nodes };
        });
        return id;
      },

      rename: (id, name) => {
        const trimmed = name.trim();
        const node = get().nodes[id];
        if (!node || node.system) return 'This item cannot be renamed.';
        if (!trimmed) return 'You must type a filename.';
        if (INVALID_CHARS.test(trimmed)) {
          return 'A filename cannot contain any of the following characters:\n\\ / : * ? " < > |';
        }
        if (node.parentId && siblingNames(get().nodes, node.parentId, id).has(trimmed.toLowerCase())) {
          return `Cannot rename ${node.name}: A file with the name you specified already exists. Specify a different filename.`;
        }
        set((s) => ({ nodes: { ...s.nodes, [id]: { ...node, name: trimmed, modified: Date.now() } } }));
        return null;
      },

      remove: (ids, permanent = false) =>
        set((s) => {
          const nodes = { ...s.nodes };
          for (const id of ids) {
            const node = nodes[id];
            if (!node || node.system || !node.parentId) continue;
            detach(nodes, id);
            if (permanent || inRecycleBin(s.nodes, id)) {
              destroy(nodes, id);
            } else {
              nodes[id] = { ...node, name: uniqueName(nodes, 'recycle', node.name), origParentId: node.parentId };
              attach(nodes, id, 'recycle');
            }
          }
          const clipboard = s.clipboard && { ...s.clipboard, ids: s.clipboard.ids.filter((c) => nodes[c]) };
          return { nodes, clipboard };
        }),

      restore: (ids) =>
        set((s) => {
          const nodes = { ...s.nodes };
          for (const id of ids) {
            const node = nodes[id];
            if (!node || node.parentId !== 'recycle') continue;
            const orig = node.origParentId;
            const target = orig && nodes[orig] && !inRecycleBin(nodes, orig) ? orig : 'documents';
            detach(nodes, id);
            nodes[id] = { ...node, name: uniqueName(nodes, target, node.name), origParentId: undefined };
            attach(nodes, id, target);
          }
          return { nodes };
        }),

      emptyRecycleBin: () =>
        set((s) => {
          const nodes = { ...s.nodes };
          for (const c of nodes.recycle.children ?? []) destroy(nodes, c);
          nodes.recycle = { ...nodes.recycle, children: [] };
          return { nodes };
        }),

      writeFile: (id, content) =>
        set((s) => {
          const node = s.nodes[id];
          if (!node) return s;
          return { nodes: { ...s.nodes, [id]: { ...node, content, size: undefined, modified: Date.now() } } };
        }),

      setClipboard: (ids, mode) => set({ clipboard: ids.length ? { ids, mode } : null }),

      paste: (targetId) =>
        set((s) => {
          const { clipboard } = s;
          if (!clipboard || !s.nodes[targetId]) return s;
          const nodes = { ...s.nodes };
          for (const id of clipboard.ids) {
            const node = nodes[id];
            if (!node || node.system) continue;
            if (id === targetId || isDescendant(nodes, targetId, id)) continue;
            if (clipboard.mode === 'cut') {
              if (node.parentId === targetId) continue;
              detach(nodes, id);
              nodes[id] = { ...nodes[id], name: uniqueName(nodes, targetId, node.name), origParentId: undefined };
              attach(nodes, id, targetId);
            } else {
              const clash = siblingNames(nodes, targetId).has(node.name.toLowerCase());
              const name = clash ? uniqueName(nodes, targetId, `Copy of ${node.name}`) : node.name;
              attach(nodes, cloneTree(nodes, id, targetId, name), targetId);
            }
          }
          return { nodes, clipboard: clipboard.mode === 'cut' ? null : clipboard };
        }),

      reset: () => set({ nodes: createInitialNodes(), clipboard: null }),
    }),
    {
      name: 'retro-os-fs',
      version: 3,
      partialize: (s) => ({ nodes: s.nodes }),
      migrate: (persisted, version) => {
        const state = persisted as { nodes?: Nodes };
        const nodes = state.nodes;
        if (!nodes?.desktop) return state as FsState;
        for (const app of DESKTOP_APPS) {
          if (version >= app.since || nodes[app.id]) continue;
          nodes[app.id] = {
            id: app.id,
            name: uniqueName(nodes, 'desktop', app.name),
            kind: 'file',
            parentId: 'desktop',
            size: app.size,
            modified: Date.now(),
          };
          nodes.desktop = { ...nodes.desktop, children: [...(nodes.desktop.children ?? []), app.id] };
        }
        return state as FsState;
      },
    },
  ),
);
