// RGB constants para charts/SVG — generados desde tokens.dtcg.json
// Para usar en recharts, SVG gradients, etc. donde no aplican CSS vars
export { PALETTE } from "./generated/tokens"

export const GRADIENTS = {
  ambient:
    "bg-[radial-gradient(110%_120%_at_20%_0%,rgba(var(--premium-info-rgb),0.2)_0%,transparent_45%),radial-gradient(110%_120%_at_80%_100%,rgba(var(--premium-action-blue-rgb),0.16)_0%,transparent_42%)]",
  ambientVertical: "bg-gradient-to-b from-[var(--premium-action-cyan)] via-transparent to-[var(--premium-action-blue)]",
  iconBlue: "bg-gradient-to-br from-[var(--premium-action-cyan)] to-[var(--premium-action-blue)]",
  iconEmerald: "bg-gradient-to-br from-[var(--premium-success)] to-[rgba(var(--premium-success-rgb),0.25)]",
  iconAmber: "bg-gradient-to-br from-amber-400/24 to-amber-500/10",
  iconRed: "bg-gradient-to-br from-[var(--color-danger)]/24 to-[var(--color-danger)]/10",
  hoverBlue: "bg-gradient-to-r from-[var(--premium-action-cyan)] to-[var(--premium-action-blue)]",
  hoverEmerald: "bg-gradient-to-r from-[var(--premium-success)] to-[rgba(var(--premium-success-rgb),0.25)]",
  hoverSteel: "bg-gradient-to-r from-[var(--premium-action-cyan)] to-[var(--premium-action-blue)]",
  premiumGlass:
    "bg-[linear-gradient(140deg,rgba(18,18,18,0.95)_0%,rgba(14,14,14,0.88)_55%,rgba(20,20,20,0.95)_100%)]",
  premiumCard:
    "linear-gradient(140deg, rgba(18,18,18,0.95) 0%, rgba(14,14,14,0.88) 55%, rgba(20,20,20,0.95) 100%)",
  textSilver: "bg-gradient-to-b from-foreground to-muted-foreground",
  textGold: "bg-gradient-to-br from-foreground to-slate-400",
  radialBlue:
    "bg-[radial-gradient(ellipse_at_top,rgba(var(--premium-info-rgb),0.18),rgba(0,0,0,0)_65%)]",
  radialCenter:
    "bg-[radial-gradient(circle_at_center,rgba(var(--premium-action-blue-rgb),0.16),rgba(0,0,0,0)_65%)]",
  hoverOverlay: "bg-gradient-to-r from-transparent via-[rgba(var(--premium-info-rgb),0.20)] to-transparent",
  hoverOverlayTr: "bg-gradient-to-tr from-[var(--premium-action-cyan)] to-transparent",
} as const

export const BACKDROP_BLUR = {
  none: "backdrop-blur-none",
  sm: "backdrop-blur-sm",
  md: "backdrop-blur-md",
  lg: "backdrop-blur-lg",
  xl: "backdrop-blur-xl",
  "2xl": "backdrop-blur-2xl",
  "3xl": "backdrop-blur-3xl",
  glass: "backdrop-blur-xl",
  modal: "backdrop-blur-2xl",
  header: "backdrop-blur-xl",
  panel: "backdrop-blur-xl",
} as const

export const GLASS_EFFECTS = {
  card: "bg-[rgba(24,24,24,0.78)] border border-white/10 backdrop-blur-[20px] shadow-[var(--shadow-1)]",
  cardPremium: "bg-[rgba(24,24,24,0.86)] border border-white/12 backdrop-blur-[22px] shadow-[var(--shadow-2)]",
  panel: "bg-[rgba(24,24,24,0.8)] border border-white/8 backdrop-blur-[20px] shadow-[var(--shadow-1)]",
  sidebar:
    "bg-[rgba(18,18,18,0.9)] border-r border-white/8 shadow-[0_1px_0_rgba(255,255,255,0.03)]",
  active: "bg-[rgba(var(--premium-info-rgb),0.16)] border-[rgba(var(--premium-info-rgb),0.35)] text-[var(--color-text-primary)]",
} as const

export const COLORS = {
  text: {
    primary: "var(--color-text-primary)",
    secondary: "var(--color-text-secondary)",
    muted: "var(--color-text-muted)",
    disabled: "var(--color-text-disabled)",
  },
  surface: {
    1: "var(--color-surface-1)",
    2: "var(--color-surface-2)",
    3: "var(--color-surface-3)",
  },
  accent: {
    green: "var(--color-success)",
    blue: "var(--color-blue-base)",
    steel: "var(--color-steel-base)",
  },
  glass: {
    light: "rgba(255, 255, 255, 0.1)",
    medium: "rgba(255, 255, 255, 0.2)",
    heavy: "rgba(255, 255, 255, 0.3)",
    border: "rgba(255, 255, 255, 0.2)",
  },
  dark: {
    light: "rgba(0, 0, 0, 0.1)",
    medium: "rgba(0, 0, 0, 0.2)",
    heavy: "rgba(0, 0, 0, 0.3)",
    border: "rgba(0, 0, 0, 0.1)",
  },
  shadows: {
    subtle: "rgba(0, 0, 0, 0.05)",
    light: "rgba(0, 0, 0, 0.1)",
    medium: "rgba(0, 0, 0, 0.2)",
    heavy: "rgba(0, 0, 0, 0.4)",
  },
} as const

export const INTERACTIONS = {
  hover: {
    lift: "hover:-translate-y-0.5 hover:shadow-[var(--shadow-2)]",
    glow: "hover:shadow-[0_0_22px_rgba(var(--premium-info-rgb),0.26)]",
    scale: "hover:scale-[1.02]",
    scaleSubtle: "hover:scale-[1.01]",
    border: "hover:border-[var(--color-stroke-3)]",
    bg: "hover:bg-surface-3",
  },
  active: {
    press: "active:scale-95",
    pressSubtle: "active:scale-[0.98]",
    glow: "active:shadow-[0_0_16px_rgba(var(--premium-action-blue-rgb),0.24)]",
  },
  focus: {
    ring: "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(var(--premium-info-rgb),0.55)]",
    ringOffset:
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[rgba(var(--premium-info-rgb),0.55)]",
  },
} as const
