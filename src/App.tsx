import { Desktop } from './shell/Desktop';
import { PowerScreen } from './shell/PowerScreen';
import { Taskbar } from './shell/Taskbar';
import { useUI } from './state/uiStore';

export default function App() {
  const power = useUI((s) => s.power);

  return (
    <div
      className="os"
      onContextMenu={(e) => {
        if (!(e.target as HTMLElement).closest('input, textarea')) e.preventDefault();
      }}
    >
      {/* Blends selected icons 50% toward navy, like the classic dithered selection. */}
      <svg className="svg-defs" aria-hidden>
        <filter id="selection-tint">
          <feColorMatrix type="matrix" values="0.5 0 0 0 0  0 0.5 0 0 0  0 0 0.5 0 0.25  0 0 0 1 0" />
        </filter>
      </svg>
      {power === 'on' ? (
        <>
          <Desktop />
          <Taskbar />
        </>
      ) : (
        <PowerScreen />
      )}
    </div>
  );
}
