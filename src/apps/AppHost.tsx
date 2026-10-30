import { memo } from 'react';
import type { AppSpec } from '../state/windowStore';
import { Explorer } from './explorer/Explorer';
import { MessageBox } from './MessageBox';
import { Notepad } from './Notepad';
import { Pool } from './pool/Pool';
import { Tetris } from './tetris/Tetris';
import { Properties } from './Properties';
import { RunDialog } from './RunDialog';
import { ShutdownDialog } from './ShutdownDialog';

/** Memoized so dragging/resizing a window doesn't re-render its contents. */
export const AppHost = memo(function AppHost({ winId, app }: { winId: string; app: AppSpec }) {
  switch (app.type) {
    case 'explorer':
      return <Explorer winId={winId} initialId={app.nodeId} />;
    case 'notepad':
      return <Notepad winId={winId} fileId={app.fileId} />;
    case 'dialog':
      return <MessageBox winId={winId} message={app.message} variant={app.variant} buttons={app.buttons} />;
    case 'properties':
      return <Properties winId={winId} nodeId={app.nodeId} />;
    case 'run':
      return <RunDialog winId={winId} />;
    case 'shutdown':
      return <ShutdownDialog winId={winId} />;
    case 'pool':
      return <Pool winId={winId} />;
    case 'tetris':
      return <Tetris winId={winId} />;
  }
});
