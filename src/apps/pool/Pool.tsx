import { useEffect, useRef, useState } from 'react';
import { MenuBar } from '../../components/Menu';
import type { MenuBarMenu } from '../../components/Menu';
import { showDialog } from '../../state/actions';
import { useWM } from '../../state/windowStore';
import { drawPoolScene, SCENE_H, SCENE_W } from './poolScene';

const FRAME_MS = 100;

export function Pool({ winId }: { winId: string }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const paused = useRef(false);
  const [isPaused, setIsPaused] = useState(false);
  const [sipping, setSipping] = useState(false);
  const [lemonade, setLemonade] = useState(100);

  useEffect(() => {
    const ctx = canvas.current?.getContext('2d');
    if (!ctx) return;
    let t = 0;
    const tick = () => {
      const info = drawPoolScene(ctx, t);
      setSipping(info.sipping);
      setLemonade(info.lemonade);
    };
    tick();
    const id = setInterval(() => {
      if (paused.current) return;
      t++;
      tick();
    }, FRAME_MS);
    return () => clearInterval(id);
  }, []);

  const togglePause = () => {
    paused.current = !paused.current;
    setIsPaused(paused.current);
  };

  const menus: MenuBarMenu[] = [
    { label: '&File', items: [{ label: 'E&xit', onClick: () => useWM.getState().close(winId) }] },
    { label: '&View', items: [{ label: '&Pause', checked: isPaused, onClick: togglePause }] },
    {
      label: '&Help',
      items: [
        {
          label: '&About Pool',
          onClick: () =>
            showDialog('Pool\nVersion 1.0\n\nA pixel man, a pool, and an endless glass of lemonade.\nThat is the whole program.', 'info', 'About Pool'),
        },
      ],
    },
  ];

  return (
    <div className="pool">
      <MenuBar menus={menus} />
      <div className="pool-stage" onDoubleClick={togglePause} title="Double-click to pause">
        <canvas ref={canvas} width={SCENE_W} height={SCENE_H} />
      </div>
      <div className="statusbar">
        <div className="status-cell grow">{isPaused ? 'Paused.' : sipping ? 'Sipping lemonade...' : 'Chilling. Water: 82°F'}</div>
        <div className="status-cell" style={{ width: 120 }}>
          Lemonade: {lemonade}%
        </div>
      </div>
    </div>
  );
}
