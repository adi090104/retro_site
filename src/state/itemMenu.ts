import type { MenuEntry } from '../components/Menu';
import { useFs } from '../fs/fsStore';
import { isContainer } from '../fs/fsUtils';
import { deleteNodes, emptyRecycleBin, openExplorer, openProperties, showDialog } from './actions';

/** Right-click menu for a file/folder, shared by the Desktop and Explorer. */
export function itemMenu(
  primaryId: string,
  selection: string[],
  handlers: { open: (id: string) => void; rename: (id: string) => void },
): MenuEntry[] {
  const fs = useFs.getState();
  const node = fs.nodes[primaryId];
  if (!node) return [];
  const ids = selection.includes(primaryId) ? selection : [primaryId];
  const mutable = ids.filter((id) => fs.nodes[id] && !fs.nodes[id].system);
  const properties: MenuEntry = { label: 'P&roperties', onClick: () => openProperties(primaryId) };

  if (node.parentId === 'recycle') {
    return [
      { label: 'R&estore', bold: true, onClick: () => fs.restore(mutable) },
      'separator',
      { label: 'Cu&t', onClick: () => fs.setClipboard(mutable, 'cut') },
      'separator',
      { label: '&Delete', onClick: () => deleteNodes(mutable) },
      'separator',
      properties,
    ];
  }

  const menu: MenuEntry[] = [{ label: '&Open', bold: true, onClick: () => handlers.open(primaryId) }];
  if (isContainer(node) && node.kind !== 'floppy') {
    menu.push({ label: '&Explore', onClick: () => openExplorer(primaryId) });
  }
  if (node.kind === 'recycle') {
    menu.push('separator', { label: 'Empty Recycle &Bin', disabled: !node.children?.length, onClick: emptyRecycleBin });
  }
  if (node.kind === 'floppy') {
    menu.push('separator', {
      label: 'For&mat...',
      onClick: () => showDialog('Formatting a floppy in 2026? Bold move.\n\nUnfortunately, the device is not ready.', 'warning', 'Format - 3½ Floppy (A:)'),
    });
  }
  if (!node.system) {
    menu.push(
      'separator',
      { label: 'Cu&t', onClick: () => fs.setClipboard(mutable, 'cut') },
      { label: '&Copy', onClick: () => fs.setClipboard(mutable, 'copy') },
      'separator',
      { label: '&Delete', onClick: () => deleteNodes(mutable) },
      { label: 'Rena&me', disabled: ids.length > 1, onClick: () => handlers.rename(primaryId) },
    );
  }
  menu.push('separator', properties);
  return menu;
}
