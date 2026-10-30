import { useEffect, useRef } from 'react';
import { Icon } from '../components/Icon';
import { AccessLabel } from '../components/Menu';
import { useWM } from '../state/windowStore';
import type { DialogButton, DialogVariant } from '../state/windowStore';
import { cx } from '../utils/cx';

const OK: DialogButton[] = [{ label: 'OK' }];

export function MessageBox({
  winId,
  message,
  variant,
  buttons = OK,
}: {
  winId: string;
  message: string;
  variant: DialogVariant;
  buttons?: DialogButton[];
}) {
  const close = useWM((s) => s.close);
  const first = useRef<HTMLButtonElement>(null);
  useEffect(() => first.current?.focus(), []);

  return (
    <div className="dialog msgbox">
      <div className="msgbox-body">
        <Icon name={variant} size={32} />
        <p>{message}</p>
      </div>
      <div className="dialog-buttons center">
        {buttons.map((b, i) => (
          <button
            key={b.label}
            ref={i === 0 ? first : undefined}
            className={cx('btn', i === 0 && 'default')}
            onClick={() => {
              close(winId);
              b.action?.();
            }}
          >
            <AccessLabel text={b.label} />
          </button>
        ))}
      </div>
    </div>
  );
}
