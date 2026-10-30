import { DiskPie } from '../../components/DiskPie';
import { Icon } from '../../components/Icon';
import { driveInfo, formatBytes, formatDate, iconFor, sizeOf, typeLabel } from '../../fs/fsUtils';
import type { FsNode, Nodes } from '../../fs/types';

const DESCRIPTIONS: Partial<Record<FsNode['kind'], string>> = {
  computer: 'Displays the contents of your computer.',
  recycle:
    'This folder contains files and folders that you have deleted from your computer.\n\nTo permanently remove all items and reclaim disk space, choose Empty Recycle Bin from the File menu.',
  documents: 'Use this folder to store your letters, reports, notes and other kinds of documents.',
  network: 'Nobody else is on the network. It is 1998, after all.',
  control: 'Use the settings in Control Panel to personalize your computer.',
  cdrom: 'This disc is read-only.',
};

/** The "View as Web Page" info panel on the left of the folder contents. */
export function WebView({ nodes, folder, selection }: { nodes: Nodes; folder: FsNode; selection: string[] }) {
  const one = selection.length === 1 ? nodes[selection[0]] : undefined;
  const drive = driveInfo(nodes, one ?? folder);

  return (
    <div className="webview">
      <Icon name={iconFor(folder, true)} size={32} />
      <h1>{folder.name}</h1>
      <div className="webview-rule" />
      {one ? (
        <>
          <p>
            <b>{one.name}</b>
            <br />
            {typeLabel(one)}
          </p>
          {one.kind === 'file' && <p>Size: {formatBytes(sizeOf(nodes, one.id))}</p>}
          <p>
            Modified:
            <br />
            {formatDate(one.modified)}
          </p>
        </>
      ) : selection.length > 1 ? (
        <p>{selection.length} items selected.</p>
      ) : (
        <>
          {DESCRIPTIONS[folder.kind] && <p className="pre">{DESCRIPTIONS[folder.kind]}</p>}
          <p>Select an item to view its description.</p>
        </>
      )}
      {drive && <DiskPie used={drive.used} capacity={drive.capacity} />}
    </div>
  );
}
