import { useEffect, useRef, useState } from 'react';
import { Icon } from '../components/Icon';
import { runCommand, showDialog } from '../state/actions';
import { useWM } from '../state/windowStore';

const LAST_RUN_KEY = 'retro-os-last-run';

export function RunDialog({ winId }: { winId: string }) {
  const close = useWM((s) => s.close);
  const [value, setValue] = useState(() => localStorage.getItem(LAST_RUN_KEY) ?? '');
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => input.current?.select(), []);

  const submit = () => {
    close(winId);
    localStorage.setItem(LAST_RUN_KEY, value);
    if (!runCommand(value)) {
      showDialog(
        `Cannot find the file '${value}' (or one of its components). Make sure the path and filename are correct and that all required libraries are available.`,
        'error',
        value,
      );
    }
  };

  return (
    <div className="dialog run">
      <div className="run-body">
        <Icon name="run" size={32} />
        <p>Type the name of a program, folder, document, or Internet resource, and Windows will open it for you.</p>
      </div>
      <label className="run-row">
        <span>
          <u>O</u>pen:
        </span>
        <input
          ref={input}
          className="field"
          value={value}
          spellCheck={false}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
        />
      </label>
      <div className="dialog-buttons">
        <button className="btn default" onClick={submit}>
          OK
        </button>
        <button className="btn" onClick={() => close(winId)}>
          Cancel
        </button>
        <button className="btn" disabled>
          <u>B</u>rowse...
        </button>
      </div>
    </div>
  );
}
