import type { ReactNode } from 'react';
import { cx } from '../utils/cx';
import { CheckGlyph } from './glyphs';

export function Checkbox({ label, checked, disabled }: { label: ReactNode; checked?: boolean; disabled?: boolean }) {
  return (
    <span className={cx('checkbox', disabled && 'disabled')}>
      <span className="checkbox-box">{checked && <CheckGlyph />}</span>
      {label}
    </span>
  );
}

export function Radio({
  label,
  checked,
  disabled,
  onSelect,
}: {
  label: ReactNode;
  checked: boolean;
  disabled?: boolean;
  onSelect?: () => void;
}) {
  return (
    <label className={cx('radio', disabled && 'disabled')} onClick={() => !disabled && onSelect?.()}>
      <span className="radio-dot">{checked && <i />}</span>
      <span className="radio-label">{label}</span>
    </label>
  );
}
