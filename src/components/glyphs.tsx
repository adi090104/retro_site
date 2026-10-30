// Tiny pixel glyphs used by window chrome, menus and controls.

export const MinimizeGlyph = () => (
  <svg width="6" height="2" viewBox="0 0 6 2" fill="currentColor">
    <path d="M0 0h6v2H0z" />
  </svg>
);

export const MaximizeGlyph = () => (
  <svg width="9" height="9" viewBox="0 0 9 9" fill="currentColor">
    <path d="M0 0h9v2H0zM0 2h1v7H0zM8 2h1v7H8zM1 8h7v1H1z" />
  </svg>
);

export const RestoreGlyph = () => (
  <svg width="8" height="9" viewBox="0 0 8 9" fill="currentColor">
    <path d="M2 0h6v2H2zM7 2h1v4H7zM2 2h1v1H2zM6 5h1v1H6z" />
    <path d="M0 3h6v2H0zM0 5h1v4H0zM5 5h1v4H5zM1 8h4v1H1z" />
  </svg>
);

export const CloseGlyph = () => (
  <svg width="8" height="7" viewBox="0 0 8 7" fill="currentColor">
    <path d="M0 0h2v1h1v1h2V1h1V0h2v1H7v1H6v1H5v1h1v1h1v1h1v1H6V6H5V5H3v1H2v1H0V6h1V5h1V4h1V3H2V2H1V1H0z" />
  </svg>
);

export const ArrowRight = () => (
  <svg width="4" height="7" viewBox="0 0 4 7" fill="currentColor">
    <path d="M0 0h1v1h1v1h1v1h1v1H3v1H2v1H1v1H0z" />
  </svg>
);

export const ArrowDown = () => (
  <svg width="7" height="4" viewBox="0 0 7 4" fill="currentColor">
    <path d="M0 0h7v1H6v1H5v1H4v1H3V3H2V2H1V1H0z" />
  </svg>
);

export const CheckGlyph = () => (
  <svg width="7" height="7" viewBox="0 0 7 7" fill="currentColor">
    <path d="M7 0H6v1H5v1H4v1H3v1H2V3H1V2H0v3h1v1h1v1h1V6h1V5h1V4h1V3h1z" />
  </svg>
);

export const DotGlyph = () => (
  <svg width="6" height="6" viewBox="0 0 6 6" fill="currentColor">
    <path d="M1 0h4v1h1v4H5v1H1V5H0V1h1z" />
  </svg>
);

export const PlusGlyph = () => (
  <svg width="5" height="5" viewBox="0 0 5 5" fill="currentColor">
    <path d="M2 0h1v2h2v1H3v2H2V3H0V2h2z" />
  </svg>
);

export const MinusGlyph = () => (
  <svg width="5" height="5" viewBox="0 0 5 5" fill="currentColor">
    <path d="M0 2h5v1H0z" />
  </svg>
);

export const SizeGrip = () => (
  <svg className="size-grip" width="12" height="12" viewBox="0 0 12 12">
    <path d="M11 1L1 11M11 5L5 11M11 9L9 11" stroke="#fff" />
    <path d="M12 1L1 12M12 5L5 12M12 9L9 12" stroke="#808080" />
  </svg>
);
