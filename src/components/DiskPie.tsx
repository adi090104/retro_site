import { formatBytes } from '../fs/fsUtils';

const USED = '#0000ff';
const FREE = '#ff00ff';

export function DiskPie({ used, capacity, large }: { used: number; capacity: number; large?: boolean }) {
  const pct = Math.min(100, (used / capacity) * 100);
  return (
    <div className={large ? 'diskpie large' : 'diskpie'}>
      <div className="pie" style={{ background: `conic-gradient(${USED} 0 ${pct}%, ${FREE} ${pct}% 100%)` }} />
      <div className="pie-legend">
        <span>
          <i style={{ background: USED }} /> Used: {formatBytes(used)}
        </span>
        <span>
          <i style={{ background: FREE }} /> Free: {formatBytes(capacity - used)}
        </span>
        <span className="pie-cap">Capacity: {formatBytes(capacity)}</span>
      </div>
    </div>
  );
}
