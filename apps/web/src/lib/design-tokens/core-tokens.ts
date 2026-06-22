export const BORDER_RADIUS = {
  sm: "var(--radius-sm)",
  md: "var(--radius-md)",
  lg: "var(--radius-lg)",
  xl: "var(--radius-xl)",
  pill: "var(--radius-pill)",
  card: "var(--radius-lg)",
  modal: "var(--radius-xl)",
  overlay: "var(--radius-xl)",
  button: "var(--radius-md)",
  input: "var(--radius-md)",
  badge: "var(--radius-pill)",
  icon: "var(--radius-sm)",
  avatar: "var(--radius-lg)",
  dot: "var(--radius-pill)",
  tooltip: "var(--radius-sm)",
  dropdown: "var(--radius-md)",
  notification: "var(--radius-lg)",
} as const;

export const SHADOWS = {
  1: "var(--shadow-1)",
  2: "var(--shadow-2)",
  subtle: "var(--shadow-1)",
  soft: "var(--shadow-1)",
  card: "var(--shadow-1)",
  elevated: "var(--shadow-2)",
  modal: "var(--shadow-2)",
  tooltip: "var(--shadow-1)",
  tooltipStrong: "var(--shadow-2)",
  primary:
    "0 0 0 1px rgba(var(--premium-info-rgb), 0.3), 0 0 24px rgba(var(--premium-action-blue-rgb), 0.22)",
  blue:
    "0 0 0 1px rgba(var(--premium-info-rgb), 0.3), 0 0 24px rgba(var(--premium-action-blue-rgb), 0.22)",
  emerald: "0 0 0 1px rgba(45, 255, 122, 0.24), 0 0 24px rgba(45, 255, 122, 0.16)",
  amber: "0 0 0 1px rgba(255, 200, 87, 0.24), 0 0 24px rgba(255, 200, 87, 0.14)",
  red: "0 0 0 1px rgba(255, 107, 107, 0.24), 0 0 24px rgba(255, 107, 107, 0.14)",
  glow:
    "0 0 0 1px rgba(var(--premium-info-rgb), 0.3), 0 0 24px rgba(var(--premium-action-blue-rgb), 0.22)",
  intense:
    "0 0 0 1px rgba(var(--premium-info-rgb), 0.4), 0 0 36px rgba(var(--premium-action-blue-rgb), 0.3)",
  dynamic: "0 0 8px currentColor",
  pulse: "0 0 10px currentColor",
} as const;

export const Z_INDEX = {
  base: 0,
  sticky: 10,
  floating: 20,
  navigation: 20,
  sidebar: 20,
  mobileNav: 20,
  dropdown: 80,
  tooltip: 30,
  overlay: 50,
  modal: 70,
  modalBackdrop: 50,
  drawer: 70,
  notification: 80,
  commandPalette: 80,
  toast: 90,
  debug: 110,
} as const;

export const BLUR = {
  subtle: "blur-sm",
  soft: "blur-md",
  background: "blur-[120px]",
  ambient: "blur-[140px]",
  overlay: "blur-lg",
  glass: "blur-xl",
  accent: "blur-[60px]",
  subtleAccent: "blur-[40px]",
} as const;

export const SPACING = {
  0: "0rem",
  1: "0.25rem",
  2: "0.5rem",
  3: "0.75rem",
  4: "1rem",
  5: "1.25rem",
  6: "1.5rem",
  7: "2rem",
  8: "2.5rem",
  9: "3rem",
  10: "4rem",
  xs: "0.25rem",
  sm: "0.5rem",
  md: "0.75rem",
  lg: "1rem",
  xl: "1.25rem",
  "2xl": "1.5rem",
  "3xl": "2rem",
  "4xl": "2.5rem",
  "5xl": "3rem",
  card: "1.5rem",
  modal: "2rem",
  section: "4rem",
} as const;

export const TRANSITIONS = {
  fast: "120ms",
  normal: "180ms",
  slow: "260ms",
  ease: "var(--ease-standard)",
  easeIn: "var(--ease-enter)",
  easeOut: "var(--ease-exit)",
  easeInOut: "var(--ease-standard)",
  quick: "120ms var(--ease-standard)",
  smooth: "180ms var(--ease-standard)",
  bounce: "260ms cubic-bezier(0.2, 0.8, 0.2, 1)",
} as const;

export const OPACITY = {
  transparent: "0",
  invisible: "0.01",
  subtle: "0.05",
  hint: "0.1",
  light: "0.2",
  medium: "0.5",
  strong: "0.8",
  solid: "1",
} as const;
