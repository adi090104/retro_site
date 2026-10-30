import type { ReactElement } from 'react';

// All icons are drawn on a 32x32 grid; strokes sit on half-pixels so they stay crisp.
const K = '#000';

const folderBack = <path d="M2.5 7.5h10l2 2h14v18h-26z" fill="#c99a14" stroke={K} />;
const folderFront = (
  <>
    <path d="M2.5 11.5h26v16h-26z" fill="#ffe680" stroke={K} />
    <path d="M3.5 12.5h24" stroke="#fff8cc" />
  </>
);
const page = (
  <>
    <path d="M7.5 2.5h12l6 6v21h-18z" fill="#fff" stroke={K} />
    <path d="M19.5 2.5v6h6" fill="#d0d0d0" stroke={K} />
  </>
);
const textLines = <path d="M10.5 12.5h12M10.5 15.5h12M10.5 18.5h12M10.5 21.5h12M10.5 24.5h8" stroke="#404040" />;
const appWindow = (
  <>
    <path d="M2.5 5.5h27v21h-27z" fill="#fff" stroke={K} />
    <path d="M3 6h26v4H3z" fill="#000080" />
    <path d="M25 7h3v2h-3z" fill="#c0c0c0" />
  </>
);
const monitor = (screen: string) => (
  <>
    <path d="M5.5 3.5h21v16h-21z" fill="#d4d0c8" stroke={K} />
    <path d="M8.5 6.5h15v10h-15z" fill={screen} stroke="#404040" />
    <path d="M12.5 19.5h7v2h-7z" fill="#a0a0a0" stroke={K} />
    <path d="M2.5 21.5h27v7h-27z" fill="#d4d0c8" stroke={K} />
    <path d="M17.5 24.5h9" stroke="#404040" />
  </>
);
const recycleBin = (
  <>
    <path d="M7.5 9.5h17l-2.5 19h-12z" fill="#eef4ee" stroke={K} />
    <path d="M9 13.5h14M9.5 18.5h13M10 23.5h12M12.5 10v18M16.5 10v18M20.5 10v18" stroke="#8fb08f" />
    <path d="M6.5 7.5h19v2h-19z" fill="#c0c0c0" stroke={K} />
  </>
);
const smallMonitor = (x: number, y: number) => (
  <>
    <path d={`M${x + 0.5} ${y + 0.5}h13v10h-13z`} fill="#d4d0c8" stroke={K} />
    <path d={`M${x + 2} ${y + 2}h10v7H${x + 2}z`} fill="#0b6e9e" />
    <path d={`M${x + 3.5} ${y + 10.5}h7v2h-7z`} fill="#a0a0a0" stroke={K} />
  </>
);
const magnifier = (
  <>
    <circle cx="20" cy="18" r="6.5" fill="#bfe8ff" stroke={K} />
    <path d="M24.5 22.5l5 5" stroke={K} strokeWidth="3" />
  </>
);
const glyph = (text: string, fill: string, y = 21, size = 15) => (
  <text x="16" y={y} textAnchor="middle" fontSize={size} fontWeight="bold" fill={fill} fontFamily="'Times New Roman', serif">
    {text}
  </text>
);

const ICONS = {
  folder: (
    <>
      {folderBack}
      {folderFront}
    </>
  ),
  folderOpen: (
    <>
      {folderBack}
      <path d="M6.5 13.5h25l-4 14h-25z" fill="#ffe680" stroke={K} />
    </>
  ),
  documents: (
    <>
      {folderBack}
      <path d="M7.5 4.5h17v14h-17z" fill="#fff" stroke={K} />
      <path d="M10 8.5h12M10 11.5h12" stroke="#000080" />
      <path d="M2.5 13.5h26v14h-26z" fill="#ffe680" stroke={K} />
    </>
  ),
  control: (
    <>
      {folderBack}
      {folderFront}
      <path d="M6 17h5v5H6z" fill="#d00000" />
      <circle cx="16.5" cy="19.5" r="3" fill="#0000c0" />
      <path d="M21 22l3-6 3 6z" fill="#008000" />
    </>
  ),
  programs: (
    <>
      {folderBack}
      {folderFront}
      <path d="M9.5 15.5h13v9h-13z" fill="#fff" stroke={K} />
      <path d="M10 16h12v2H10z" fill="#000080" />
    </>
  ),
  desktop: (
    <>
      <path d="M2.5 3.5h27v19h-27z" fill="#008080" stroke={K} />
      <path d="M5 6h4v4H5zM5 13h4v4H5zM12 6h4v4h-4z" fill="#fff" />
      <path d="M10.5 22.5h11v3h-11zM6.5 25.5h19v3h-19z" fill="#c0c0c0" stroke={K} />
    </>
  ),
  computer: monitor('#0b6e9e'),
  shutdown: (
    <>
      {monitor('#101040')}
      <path d="M17 8a4 4 0 1 0 4 6 3 3 0 1 1-4-6z" fill="#ffd400" />
    </>
  ),
  drive: (
    <>
      <path d="M2.5 13.5l4-5h19l4 5" fill="#e8e8e8" stroke={K} />
      <path d="M2.5 13.5h27v10h-27z" fill="#c0c0c0" stroke={K} />
      <path d="M5.5 18.5h13" stroke="#606060" />
      <path d="M23 17h4v3h-4z" fill="#00d000" />
    </>
  ),
  floppy: (
    <>
      <path d="M4.5 4.5h21l3 3v21h-24z" fill="#30307a" stroke={K} />
      <path d="M10.5 4.5h12v8h-12z" fill="#c0c0c0" stroke={K} />
      <path d="M18 6h3v5h-3z" fill="#30307a" />
      <path d="M7.5 16.5h18v12h-18z" fill="#fff" stroke={K} />
      <path d="M9.5 19.5h14M9.5 22.5h14" stroke="#c00000" />
    </>
  ),
  cdrom: (
    <>
      <circle cx="16" cy="16" r="12.5" fill="#d8d8e8" stroke={K} />
      <path d="M16 4a12 12 0 0 1 11 7l-8 3z" fill="#9fe7ff" />
      <path d="M16 28a12 12 0 0 1-11-7l8-3z" fill="#ffc8f0" />
      <circle cx="16" cy="16" r="4.5" fill="#fff" stroke={K} />
      <circle cx="16" cy="16" r="1.5" fill="#808080" />
    </>
  ),
  network: (
    <>
      <path d="M8.5 15v10.5h13" fill="none" stroke={K} />
      {smallMonitor(1, 1)}
      {smallMonitor(17, 14)}
    </>
  ),
  recycle: recycleBin,
  recycleFull: (
    <>
      <path d="M8.5 10.5l2-7 4 3 3-5 2 6 4-2-1 6z" fill="#fff" stroke={K} />
      {recycleBin}
    </>
  ),
  file: page,
  text: (
    <>
      {page}
      {textLines}
    </>
  ),
  image: (
    <>
      {page}
      <path d="M10.5 12.5h12v11h-12z" fill="#80c0ff" stroke={K} />
      <circle cx="19" cy="16" r="2" fill="#ffd400" />
      <path d="M11 23l4-5 3 3 2-2 2 4z" fill="#008000" />
    </>
  ),
  gear: (
    <>
      {page}
      <circle cx="16.5" cy="18.5" r="5" fill="#c0c0c0" stroke={K} strokeDasharray="2 1.2" strokeWidth="2" />
      <circle cx="16.5" cy="18.5" r="1.5" fill="#fff" stroke={K} />
    </>
  ),
  app: appWindow,
  run: (
    <>
      {appWindow}
      <path d="M8 18h10v-4l6 6-6 6v-4H8z" fill="#008000" stroke={K} />
    </>
  ),
  dos: (
    <>
      <path d="M2.5 5.5h27v21h-27z" fill="#c0c0c0" stroke={K} />
      <path d="M3 6h26v3H3z" fill="#000080" />
      <path d="M4.5 10.5h23v14h-23z" fill="#000" stroke="#808080" />
      <path d="M7 14h2v2H7zm0 4h2v2H7zm4 2h5v1h-5z" fill="#c0c0c0" />
    </>
  ),
  notepad: (
    <>
      <path d="M6.5 5.5h19v23h-19z" fill="#fff" stroke={K} />
      <path d="M7 6h18v3H7z" fill="#5fd3d3" />
      <path d="M9.5 3.5v4M13.5 3.5v4M17.5 3.5v4M21.5 3.5v4" stroke={K} />
      <path d="M9 13.5h14M9 16.5h14M9 19.5h14M9 22.5h10" stroke="#808080" />
    </>
  ),
  explorer: (
    <>
      {folderBack}
      {folderFront}
      {magnifier}
    </>
  ),
  find: (
    <>
      {page}
      {magnifier}
    </>
  ),
  help: (
    <>
      <path d="M6.5 4.5h18l2 2v22h-18l-2-2z" fill="#1c3fae" stroke={K} />
      <path d="M8.5 26.5h17" stroke="#fff" />
      {glyph('?', '#ffd400', 21, 16)}
    </>
  ),
  windows: (
    <>
      <path d="M3 7l5-1 6 1v8l-6-1-5 1z" fill="#ff3d00" />
      <path d="M16 7l6-1 6 1v8l-6-1-6 1z" fill="#2fbf2f" />
      <path d="M3 17l5-1 6 1v8l-6-1-5 1z" fill="#1e6bff" />
      <path d="M16 17l6-1 6 1v8l-6-1-6 1z" fill="#ffd400" />
    </>
  ),
  error: (
    <>
      <circle cx="16" cy="16" r="13.5" fill="#e00000" stroke="#600000" />
      <path d="M11 11l10 10M21 11L11 21" stroke="#fff" strokeWidth="3" />
    </>
  ),
  info: (
    <>
      <path d="M16 2.5c8 0 13.5 4.5 13.5 10.5s-5.5 10.5-13.5 10.5h-1l-6 5.5v-6.5c-4-2-6.5-5-6.5-9.5 0-6 5.5-10.5 13.5-10.5z" fill="#fff" stroke={K} />
      {glyph('i', '#0000c0', 19, 15)}
    </>
  ),
  warning: (
    <>
      <path d="M16 2.5l13.5 25h-27z" fill="#ffd400" stroke={K} />
      {glyph('!', K, 25, 17)}
    </>
  ),
  pool: (
    <>
      <path d="M1.5 13.5h29v16h-29z" fill="#22a6dd" stroke={K} />
      <path d="M3 18.5h4M20 17.5h6M5 26.5h7M22 25.5h5" stroke="#86e0ff" />
      <ellipse cx="13" cy="21" rx="7.5" ry="3.5" fill="none" stroke="#ff5fa2" strokeWidth="3" />
      <path d="M21.5 5.5h6l-1 10h-4z" fill="#fff176" stroke={K} />
      <path d="M25 6V2.5h3" fill="none" stroke="#e53935" strokeWidth="1.5" />
      <circle cx="22" cy="6" r="2.5" fill="#ffd21f" stroke={K} />
    </>
  ),
  tetris: (
    <>
      <path d="M9.5 2.5h7v7h-7zM16.5 2.5h7v7h-7zM16.5 9.5h7v7h-7z" fill="#a020d8" stroke={K} />
      <path d="M2.5 16.5h7v7h-7zM2.5 23.5h7v7h-7zM9.5 23.5h7v7h-7z" fill="#2050f0" stroke={K} />
      <path d="M16.5 23.5h7v7h-7zM23.5 23.5h7v7h-7zM23.5 16.5h7v7h-7z" fill="#f08000" stroke={K} />
      <path d="M9.5 16.5h7v7h-7z" fill="#e8d000" stroke={K} />
      <path d="M11 4h5M18 4h5M18 11h5M4 18h5M4 25h5M11 25h5M18 25h5M25 25h5M25 18h5M11 18h5" stroke="#fff" strokeOpacity="0.6" />
    </>
  ),
  speaker: (
    <>
      <path d="M5.5 12.5h5l7-6v20l-7-6h-5z" fill="#ffd400" stroke={K} />
      <path d="M21 11c2 3 2 7 0 10M24 8c4 5 4 11 0 16" fill="none" stroke={K} strokeWidth="2" />
    </>
  ),
  back: <path d="M3.5 16.5l11-10v6h14v8h-14v6z" fill="#2aa52a" stroke={K} />,
  forward: <path d="M28.5 16.5l-11-10v6h-14v8h14v6z" fill="#2aa52a" stroke={K} />,
  up: (
    <>
      {folderBack}
      {folderFront}
      <path d="M16.5 3.5l7 7h-4v9h-6v-9h-4z" fill={K} />
    </>
  ),
  cut: (
    <>
      <path d="M12 19L21 3M20 19L11 3" stroke="#404040" strokeWidth="2" />
      <circle cx="10" cy="24" r="4.5" fill="none" stroke={K} strokeWidth="2" />
      <circle cx="22" cy="24" r="4.5" fill="none" stroke={K} strokeWidth="2" />
    </>
  ),
  copy: (
    <>
      <path d="M4.5 3.5h12l4 4v14h-16z" fill="#fff" stroke={K} />
      <path d="M11.5 10.5h12l4 4v14h-16z" fill="#fff" stroke={K} />
      <path d="M14 18.5h10M14 21.5h10M14 24.5h7" stroke="#000080" />
    </>
  ),
  paste: (
    <>
      <path d="M4.5 5.5h18v23h-18z" fill="#b07a3a" stroke={K} />
      <path d="M9.5 3.5h8v4h-8z" fill="#c0c0c0" stroke={K} />
      <path d="M13.5 11.5h12l4 4v14h-16z" fill="#fff" stroke={K} />
      <path d="M16 19.5h11M16 22.5h11M16 25.5h8" stroke="#000080" />
    </>
  ),
  undo: (
    <>
      <path d="M9 15c3-6 13-7 17 1" fill="none" stroke={K} strokeWidth="3" />
      <path d="M3 9l10 1-7 9z" fill={K} />
    </>
  ),
  delete: <path d="M7 7l18 18M25 7L7 25" stroke="#d00000" strokeWidth="4" />,
  properties: (
    <>
      {page}
      <path d="M10.5 12.5h4v4h-4zM10.5 19.5h4v4h-4z" fill="#fff" stroke={K} />
      <path d="M16.5 14.5h6M16.5 21.5h6" stroke="#404040" />
      <path d="M11 14l1.5 1.5L15 12" fill="none" stroke="#008000" strokeWidth="1.5" />
    </>
  ),
  views: (
    <>
      <path d="M4.5 4.5h10v10h-10zM17.5 4.5h10v10h-10zM4.5 17.5h10v10h-10zM17.5 17.5h10v10h-10z" fill="#fff" stroke={K} />
      <path d="M6 6h7v4H6zM19 6h7v4h-7zM6 19h7v4H6zM19 19h7v4h-7z" fill="#000080" />
    </>
  ),
} satisfies Record<string, ReactElement>;

export type IconName = keyof typeof ICONS;

export function Icon({ name, size = 32 }: { name: IconName; size?: number }) {
  return (
    <svg className="icon" width={size} height={size} viewBox="0 0 32 32" shapeRendering="crispEdges" aria-hidden>
      {ICONS[name]}
    </svg>
  );
}
