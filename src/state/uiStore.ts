import { create } from 'zustand';
import { useWM } from './windowStore';

export type Power = 'on' | 'shuttingDown' | 'off';

interface UIState {
  power: Power;
  restartAfterShutdown: boolean;
  startOpen: boolean;
  setStartOpen: (open: boolean) => void;
  setPower: (power: Power) => void;
  shutdown: (restart: boolean) => void;
}

export const useUI = create<UIState>((set) => ({
  power: 'on',
  restartAfterShutdown: false,
  startOpen: false,
  setStartOpen: (startOpen) => set({ startOpen }),
  setPower: (power) => set({ power }),
  shutdown: (restart) => {
    useWM.getState().closeAll();
    set({ power: 'shuttingDown', restartAfterShutdown: restart, startOpen: false });
  },
}));
