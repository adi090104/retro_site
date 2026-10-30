export type NodeKind =
  | 'desktop'
  | 'computer'
  | 'drive'
  | 'floppy'
  | 'cdrom'
  | 'folder'
  | 'file'
  | 'recycle'
  | 'network'
  | 'documents'
  | 'control';

export interface FsNode {
  id: string;
  name: string;
  kind: NodeKind;
  parentId: string | null;
  modified: number;
  children?: string[];
  content?: string;
  /** Fake size in bytes for binary files that have no text content. */
  size?: number;
  /** Drive letter, only set on drives. */
  letter?: string;
  /** System nodes cannot be deleted, moved or renamed. */
  system?: boolean;
  /** Where a recycled node came from, used by Restore. */
  origParentId?: string;
}

export type Nodes = Record<string, FsNode>;
