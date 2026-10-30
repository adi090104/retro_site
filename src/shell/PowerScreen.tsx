import { useEffect } from 'react';
import { Icon } from '../components/Icon';
import { useUI } from '../state/uiStore';

const SHUTDOWN_MS = 2000;

export function PowerScreen() {
  const power = useUI((s) => s.power);
  const restart = useUI((s) => s.restartAfterShutdown);
  const setPower = useUI((s) => s.setPower);

  useEffect(() => {
    if (power !== 'shuttingDown') return;
    const t = setTimeout(() => setPower(restart ? 'on' : 'off'), SHUTDOWN_MS);
    return () => clearTimeout(t);
  }, [power, restart, setPower]);

  if (power === 'off') {
    return (
      <div className="power-off" onClick={() => setPower('on')}>
        <p>
          It&apos;s now safe to turn off
          <br />
          your computer.
        </p>
        <small>(click anywhere to power on)</small>
      </div>
    );
  }

  return (
    <div className="splash">
      <div className="splash-logo">
        <Icon name="windows" size={96} />
        <div className="splash-brand">
          <span className="splash-retro">Retro</span>
          <span className="splash-os">OS</span>
          <sup>98</sup>
        </div>
      </div>
      <div className="splash-msg">Please wait while your computer shuts down.</div>
    </div>
  );
}
