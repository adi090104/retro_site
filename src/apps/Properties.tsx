import { Checkbox } from '../components/controls';
import { DiskPie } from '../components/DiskPie';
import { Icon } from '../components/Icon';
import { useFs } from '../fs/fsStore';
import { countContents, displayPath, driveInfo, formatBytes, iconFor, isContainer, pathOf, sizeOf, typeLabel } from '../fs/fsUtils';
import { useWM } from '../state/windowStore';

const longDate = (ts: number) =>
  new Date(ts).toLocaleString(undefined, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });

export function Properties({ winId, nodeId }: { winId: string; nodeId: string }) {
  const nodes = useFs((s) => s.nodes);
  const close = useWM((s) => s.close);
  const node = nodes[nodeId];
  const done = () => close(winId);

  const buttons = (
    <div className="dialog-buttons">
      <button className="btn default" onClick={done}>
        OK
      </button>
      <button className="btn" onClick={done}>
        Cancel
      </button>
      <button className="btn" disabled>
        <u>A</u>pply
      </button>
    </div>
  );

  if (!node) {
    return (
      <div className="dialog props">
        <div className="tab-panel">This item no longer exists.</div>
        {buttons}
      </div>
    );
  }

  const drive = driveInfo(nodes, node);
  const bytes = sizeOf(nodes, nodeId);
  const contents = isContainer(node) ? countContents(nodes, nodeId) : null;
  const readOnly = pathOf(nodes, nodeId).some((n) => n.kind === 'cdrom');

  return (
    <div className="dialog props">
      <div className="tabs">
        <div className="tab active">General</div>
      </div>
      <div className="tab-panel">
        <div className="props-head">
          <Icon name={iconFor(node)} size={32} />
          <div className="field">{node.name}</div>
        </div>
        <hr className="etched" />
        <dl className="props-grid">
          <dt>Type:</dt>
          <dd>{typeLabel(node)}</dd>
          {node.parentId && (
            <>
              <dt>Location:</dt>
              <dd>{displayPath(nodes, node.parentId)}</dd>
            </>
          )}
          {!drive && (
            <>
              <dt>Size:</dt>
              <dd>
                {formatBytes(bytes)} ({bytes.toLocaleString()} bytes)
              </dd>
            </>
          )}
          {contents && !drive && (
            <>
              <dt>Contains:</dt>
              <dd>
                {contents.files} Files, {contents.folders} Folders
              </dd>
            </>
          )}
        </dl>
        <hr className="etched" />
        {drive ? (
          <DiskPie used={drive.used} capacity={drive.capacity} large />
        ) : (
          <>
            <dl className="props-grid">
              <dt>Modified:</dt>
              <dd>{longDate(node.modified)}</dd>
            </dl>
            <hr className="etched" />
            <div className="props-attrs">
              <span>Attributes:</span>
              <div>
                <Checkbox label="Read-only" checked={readOnly} disabled />
                <Checkbox label="Hidden" disabled />
                <Checkbox label="Archive" checked={node.kind === 'file'} disabled />
                <Checkbox label="System" checked={node.system} disabled />
              </div>
            </div>
          </>
        )}
      </div>
      {buttons}
    </div>
  );
}
