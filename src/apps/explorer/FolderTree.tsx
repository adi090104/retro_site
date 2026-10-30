import { Icon } from '../../components/Icon';
import { MinusGlyph, PlusGlyph } from '../../components/glyphs';
import { iconFor, isContainer, sortForDisplay } from '../../fs/fsUtils';
import type { Nodes } from '../../fs/types';
import { cx } from '../../utils/cx';

interface TreeProps {
  nodes: Nodes;
  expanded: Set<string>;
  currentId: string;
  onToggle: (id: string) => void;
  onSelect: (id: string) => void;
}

export function FolderTree(props: TreeProps) {
  return (
    <div className="tree">
      <ul>
        <TreeNode id="desktop" {...props} />
      </ul>
    </div>
  );
}

function TreeNode({ id, ...props }: TreeProps & { id: string }) {
  const { nodes, expanded, currentId, onToggle, onSelect } = props;
  const node = nodes[id];
  if (!node) return null;
  const kids = sortForDisplay(nodes, node.children ?? []).filter(isContainer);
  const open = expanded.has(id) && kids.length > 0;
  const current = id === currentId;

  return (
    <li>
      <div className="tree-row">
        {kids.length ? (
          <span className="tree-toggle" onPointerDown={() => onToggle(id)}>
            {open ? <MinusGlyph /> : <PlusGlyph />}
          </span>
        ) : (
          <span className="tree-spacer" />
        )}
        <span
          className={cx('tree-label', current && 'selected')}
          onPointerDown={() => onSelect(id)}
          onDoubleClick={() => onToggle(id)}
        >
          <Icon name={iconFor(node, current)} size={16} />
          <span>{node.name}</span>
        </span>
      </div>
      {open && (
        <ul>
          {kids.map((k) => (
            <TreeNode key={k.id} id={k.id} {...props} />
          ))}
        </ul>
      )}
    </li>
  );
}
