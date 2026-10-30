import { useEffect, useState } from 'react';
import { Icon } from '../components/Icon';
import { openExplorer, openNotepad } from '../state/actions';
import { useUI } from '../state/uiStore';
import { useWM } from '../state/windowStore';
import { cx } from '../utils/cx';
import { StartMenu } from './StartMenu';

function Clock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 5000);
    return () => clearInterval(t);
  }, []);
  return (
    <span title={now.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}>
      {now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
    </span>
  );
}

export function Taskbar() {
  const windows = useWM((s) => s.windows);
  const activeId = useWM((s) => s.activeId);
  const { focus, minimize, minimizeAll } = useWM.getState();
  const startOpen = useUI((s) => s.startOpen);
  const setStartOpen = useUI((s) => s.setStartOpen);

  return (
    <div className="taskbar">
      <button
        data-start-button
        className={cx('start-btn', startOpen && 'pressed')}
        onPointerDown={() => setStartOpen(!startOpen)}
      >
        <Icon name="windows" size={16} />
        <b>Start</b>
      </button>
      <span className="tb-divider" />
      <span className="tb-grip" />
      <div className="quick-launch">
        <button className="ql-btn" title="Show Desktop" onClick={minimizeAll}>
          <Icon name="desktop" size={16} />
        </button>
        <button className="ql-btn" title="Windows Explorer" onClick={() => openExplorer('c')}>
          <Icon name="explorer" size={16} />
        </button>
        <button className="ql-btn" title="Notepad" onClick={() => openNotepad()}>
          <Icon name="notepad" size={16} />
        </button>
      </div>
      <span className="tb-divider" />
      <span className="tb-grip" />
      <div className="task-buttons">
        {windows.map((w) => {
          const active = w.id === activeId && !w.minimized;
          return (
            <button
              key={w.id}
              className={cx('task-btn', active && 'active')}
              title={w.title}
              onClick={() => (active ? minimize(w.id) : focus(w.id))}
            >
              {w.icon && <Icon name={w.icon} size={16} />}
              <span>{w.title}</span>
            </button>
          );
        })}
      </div>
      <div className="tray">
        <Icon name="speaker" size={16} />
        <Clock />
      </div>
      {startOpen && <StartMenu onClose={() => setStartOpen(false)} />}
    </div>
  );
}
