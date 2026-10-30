import { useState } from 'react';
import { Radio } from '../components/controls';
import { Icon } from '../components/Icon';
import { useUI } from '../state/uiStore';
import { useWM } from '../state/windowStore';

export function ShutdownDialog({ winId }: { winId: string }) {
  const close = useWM((s) => s.close);
  const shutdown = useUI((s) => s.shutdown);
  const [choice, setChoice] = useState<'shutdown' | 'restart'>('shutdown');

  return (
    <div className="dialog shutdown">
      <div className="shutdown-body">
        <Icon name="shutdown" size={32} />
        <div>
          <p>What do you want the computer to do?</p>
          <Radio label={<><u>S</u>hut down</>} checked={choice === 'shutdown'} onSelect={() => setChoice('shutdown')} />
          <Radio label={<><u>R</u>estart</>} checked={choice === 'restart'} onSelect={() => setChoice('restart')} />
          <Radio label={<>Restart in <u>M</u>S-DOS mode</>} checked={false} disabled />
        </div>
      </div>
      <div className="dialog-buttons">
        <button className="btn default" onClick={() => shutdown(choice === 'restart')}>
          OK
        </button>
        <button className="btn" onClick={() => close(winId)}>
          Cancel
        </button>
        <button className="btn" disabled>
          <u>H</u>elp
        </button>
      </div>
    </div>
  );
}
