# Andino Studio — UI/UX Redesign Design Spec

**Date:** 2026-06-22
**Status:** Approved
**Author:** Andino Drone Lab Team

## 1. Overview

Redesign the Andino Studio Next.js 16 web application from a generic dark Tailwind template to a "Command Center" design system inspired by Linear, Apple Pro Design, Star Citizen HUD, and Mass Effect. The goal is a sci-fi minimal aesthetic that feels like a real drone operations command center — professional, modern, and purposeful.

### 1.1 Design Direction

- **Style:** Dark sci-fi minimal — clean like Linear, with sci-fi elements like HUD gauges and grid backgrounds
- **Inspiration:** Linear (clean typography, spacing), Apple Pro Design (glass morphism), Star Citizen HUD (flight instruments), Mass Effect (galaxy map UI)
- **Mood:** Professional command center for drone engineering, not a game UI
- **Color temperature:** Cold — navy, cyan, ice-blue

### 1.2 User Choices

- Dashboard overview on home (command center feel)
- Desktop first, responsive
- Dark sci-fi minimal (no neon, no aggressive military, no bright themes)

## 2. Design System Foundation

### 2.1 Color Tokens

```css
/* Backgrounds */
--bg-void:      #060a13;    /* deepest black — body, modals */
--bg-primary:   #0c1220;    /* main background */
--bg-surface:   #111827;    /* cards, panels */
--bg-elevated:  #1a2332;    /* hover states, active items */
--bg-overlay:   rgba(12, 18, 32, 0.8); /* overlays, modals */

/* Borders */
--border-subtle:  rgba(255, 255, 255, 0.06);   /* general borders */
--border-default: rgba(255, 255, 255, 0.1);    /* active borders */
--border-accent:  rgba(0, 212, 255, 0.3);      /* focus rings, accent borders */

/* Accent — Cyan/Ice-Blue */
--accent-50:   #e0faff;
--accent-100:  #b3f0ff;
--accent-400:  #00d4ff;    /* primary accent */
--accent-500:  #00b8db;
--accent-600:  #0099b8;
--accent-glow: 0 0 20px rgba(0, 212, 255, 0.15); /* subtle glow */

/* Semantic */
--success: #34d399;
--warning: #fbbf24;
--error:   #f87171;
--info:    #60a5fa;

/* Text */
--text-primary:   #f0f4f8;
--text-secondary: #8899aa;
--text-muted:     #556677;
--text-accent:    #00d4ff;
```

### 2.2 Typography

```css
/* Font Stack */
--font-sans: 'Geist', 'Inter', system-ui, sans-serif;  /* UI general */
--font-mono: 'JetBrains Mono', 'Fira Code', monospace;  /* data, code, telemetry */

/* Scale */
h1:  2rem / 700      — page titles
h2:  1.25rem / 600   — section headers
h3:  0.875rem / 600  — card titles
body: 0.875rem / 400 — general text
data: 0.8125rem / 500 — monospace data
tiny: 0.75rem / 400  — labels, badges
```

### 2.3 Spacing, Radius, Shadows

```css
/* Spacing */
xs: 0.25rem (4px)
sm: 0.5rem (8px)
md: 0.75rem (12px)
lg: 1rem (16px)
xl: 1.5rem (24px)
2xl: 2rem (32px)

/* Border Radius */
sm: 6px    — buttons, badges
md: 10px   — cards, inputs
lg: 14px   — modals, large panels
full: 9999 — avatars, dots

/* Shadows */
shadow-card:      0 1px 3px rgba(0,0,0,0.3), 0 1px 2px rgba(0,0,0,0.4);
shadow-glow:      0 0 20px rgba(0, 212, 255, 0.08);
shadow-elevated:  0 4px 12px rgba(0,0,0,0.5);
```

### 2.4 Background Grid Pattern

The body and large dark surfaces have a subtle holographic grid overlay:
- Grid: 40px x 40px
- Color: rgba(255, 255, 255, 0.02)
- Only visible on large dark areas (hero, viewport)
- Implemented as CSS background-image on specific containers

## 3. Global Layout and Navigation

### 3.1 Header / Top Bar

- **Height:** 52px fixed
- **Background:** bg-void with border-b border-subtle
- **Logo:** Diamond icon in accent-400 + "Andino Studio" in Geist 700
- **Nav links:** Text-secondary, hover to text-primary, animated underline on active (3px accent-400 bottom)
- **Status:** Green pulsing dot + "Connected" in text-muted
- **Backdrop blur:** sm (backdrop-blur-sm) for glass effect on scroll

### 3.2 Sidebar (Agent and Flight pages)

- **Width:** 240px (Agent), 260px (Flight)
- **Background:** bg-void
- **Border:** border-r border-subtle
- **Items:** bg-elevated on active, hover transition
- **Status dots:** Semantic colors (green=completed, cyan=in_flight, yellow=planning, red=failed)

### 3.3 Page Layout Structure

```
Home:     [Header] -> [Full width content, max-w-7xl centered]
Agent:    [Header] -> [Sidebar 240px] [Chat area flex-1]
Design:   [Header] -> [Palette 200px] [Viewport flex-1] [Metrics 280px]
Flight:   [Header] -> [Telemetry 260px] [HUD flex-1] [AgentLog 300px]
```

### 3.4 Responsive Breakpoints

- **Desktop (>=1280px):** Full layout as described
- **Tablet (768-1279px):** Sidebar collapsed to drawer, stacked layout
- **Mobile (<768px):** Single column, bottom nav, simplified HUD

## 4. Home Dashboard

### 4.1 Stats Cards (4-column grid)

- **Grid:** 4 columns with gap-4
- **Card:** bg-surface with border border-subtle, rounded-lg
- **Value:** JetBrains Mono, text-2xl, accent-400 with subtle text-glow
- **Label:** text-muted, uppercase, letter-spacing wide
- **Hover:** bg-elevated transition, border-accent
- **Animation:** Numbers count-up on mount (fade-in + slide-up)

### 4.2 Recent Missions Table

- **Header:** "RECENT MISSIONS" in text-muted, uppercase, tracking-wider
- **Rows:** bg-surface with border-b border-subtle
- **Status badges:**
  - completed: bg-success/10 text-success
  - in_flight: bg-accent/10 text-accent with pulse animation
  - planning: bg-warning/10 text-warning
  - failed: bg-error/10 text-error
- **Hover:** bg-elevated, cursor pointer
- **Footer:** "View All Missions" link in accent-400

### 4.3 System Status Panel

- **Card bg:** bg-surface with border border-subtle
- **Evolution progress bar:** gradient accent-400 to accent-600, animated fill
- **Status items:** 3-column grid (Active, Queue, Errors)
- **Icons:** Lucide icons in text-muted

### 4.4 Quick Actions

- **3 buttons in row:**
  - "New Design" -> accent bg, primary action
  - "Flight Dashboard" -> bg-surface, secondary
  - "AI Agent" -> bg-surface, secondary
- **Icons:** Lucide icons left of each button
- **Hover:** border-accent, subtle glow

## 5. Agent Chat (AI Co-Pilot)

### 5.1 Chat Messages

**AI messages:**
- Avatar: Diamond icon in accent-400 on bg-accent/20
- Bubble: bg-surface with border-l-2 border-accent
- Text: text-primary, font-sans, text-sm leading-relaxed
- Timestamp: text-muted, font-mono, text-xs

**User messages:**
- Avatar: "U" circle in bg-elevated with text-secondary
- Bubble: bg-accent/8 with border-r-2 border-accent/30
- Text: text-primary
- Layout: flex-row-reverse (right-aligned)

**Thinking state:**
- 3 pulsing dots with stagger animation
- "Thinking..." text in text-muted
- Subtle glow pulse on avatar

### 5.2 Sidebar (Missions)

- **Width:** 240px
- **Header:** "MISSIONS" uppercase + badge count
- **Items:** Name truncated, status badge inline, date in text-muted
- **Active:** bg-elevated + border-l-2 accent

### 5.3 Chat Input

- **Container:** border-t border-subtle, bg-void
- **Input:** bg-surface, border border-subtle, rounded-lg
- **Focus:** ring-2 ring-accent/30, border-accent
- **Send button:** bg-accent text-void, rounded-lg
- **Placeholder:** text-muted, "Ask the agent about drone design..."
- **Disabled state:** opacity-50, cursor not-allowed

## 6. Design Mode (Drone Builder)

### 6.1 Component Palette (Left Panel)

- **Width:** 200px
- **Header:** "COMPONENTS" uppercase, text-muted
- **Categories:** Collapsible with ChevronRight/Down icons
- **Items:** Active -> bg-elevated + border-l-2 accent; Hover -> bg-surface transition

### 6.2 Viewport (Center)

- **Background:** bg-void with subtle grid pattern (40px grid, rgba(255,255,255,0.02))
- **Border:** border border-subtle rounded-lg
- **SVG Drone:**
  - Arms: stroke accent-400, strokeWidth 3, opacity 0.8
  - Motors: fill bg-elevated, stroke accent-400
  - Center hub: accent-400 fill with subtle glow
  - Coaxial motors (Y6/X8): dashed stroke, reduced opacity
- **Label overlay:** Bottom-left "Current: QUAD" in text-muted
- **Animation:** Hover on motor -> glow pulse

### 6.3 Metrics Panel (Right, Tabbed)

- **Width:** 280px
- **Tabs:** "Metrics" | "AI Suggestions"
  - Active: text-accent, border-b-2 accent
  - Inactive: text-muted, hover text-secondary

**Metrics:**
- Rows: label left (text-secondary), value right (text-primary, font-mono)
- TWR: color-coded (green >=2.0, yellow >=1.5, red <1.5)
- Progress bar style: filled blocks in accent

**AI Suggestions:**
- Cards with border-l-2 accent
- "AI SUGGESTION" label in text-accent uppercase
- "Apply" button: bg-accent text-void
- Hover: border-accent glow

### 6.4 Action Buttons (Header)

- **New Design:** bg-accent text-void (primary action)
- **Evolve:** bg-accent/80 text-void
- **Save CAD:** bg-surface border border-subtle
- **Export STL:** bg-surface border border-subtle
- **All:** rounded-lg, font-medium, text-sm
- **Hover:** border-accent, subtle glow

## 7. Flight Dashboard (HUD and Telemetry)

### 7.1 Telemetry Panel (Left)

- **Width:** 260px
- **Sections:** Card-based with bg-surface, border-subtle
- **Data:** JetBrains Mono, text-primary
- **Battery bar:** Filled blocks in accent (filled) + muted (empty), percentage in text-accent bold
- **Flight mode badge:** bg-accent/20 text-accent, font-mono, uppercase
- **Section headers:** text-muted, uppercase, tracking-wider, text-xs

### 7.2 HUD (Center)

- **Background:** bg-void with grid pattern
- **Horizon indicator:**
  - Top half: bg-accent/8 (sky blue subtle)
  - Bottom half: bg-warning/8 (ground amber subtle)
  - Animated roll rotation (sin wave, +/-2 degrees)
- **Center crosshair:**
  - Diamond shape in accent-400 with glow
  - Cross lines: accent-400/40
- **Data readout (top):**
  - "ALT 4027m  SPD 12.5  HDG 273"
  - JetBrains Mono, accent-400, text-lg, tracking-wider
- **Compass:** N/E/S/W labels in text-muted, font-mono
- **Altitude ladder (right):** Ticks every 5m, current altitude highlighted in accent
- **Speed ladder (left):** Ticks every 5 m/s, current speed highlighted in accent
- **Animations:** Smooth transitions on data updates, subtle pulse on critical values

### 7.3 Agent Log (Right)

- **Width:** 300px
- **Header:** "AGENT REASONING" + count badge
- **Log entries:**
  - Timestamp: JetBrains Mono, text-muted
  - Level badge:
    - INFO: bg-accent/20 text-accent
    - WARN: bg-warning/20 text-warning
    - ERROR: bg-error/20 text-error
  - Message: JetBrains Mono, text-secondary, text-[11px]
- **Auto-scroll:** Smooth to bottom on new entries

### 7.4 Emergency Controls (Bottom Bar)

- **Layout:** flex justify-between, border-t border-subtle
- **Buttons:**
  - EMERGENCY LAND: bg-error hover:brightness-110, bold, padding-lg
  - RETURN TO LAUNCH: bg-warning/80 hover:brightness-110
  - HOLD POSITION: bg-warning/60 hover:brightness-110
  - All: rounded-xl, font-medium, text-sm
- **Status:** Green/red dot + "Connected"/"Disconnected" text
- **Hover effects:** Subtle glow on emergency buttons

### 7.5 Telemetry Animations

- Altitude/Speed values: Smooth number transition (no jump)
- Battery percentage: Gradual decrease with color shift (green to yellow to red)
- GPS sats: Subtle pulse when changing
- Log entries: Fade-in animation on new entries
- HUD roll: Continuous sin wave animation (+/-2 degrees)

## 8. Animations and Transitions

### 8.1 Global Transitions

- **Duration:** 150ms (fast), 200ms (normal), 300ms (slow)
- **Easing:** ease-out for exits, ease-in-out for state changes
- **Hover transitions:** bg, border-color, box-shadow, transform
- **Page transitions:** fade-in + slide-up (8px) on mount

### 8.2 Specific Animations

- **Count-up numbers:** On home stats mount, numbers animate from 0 to final value
- **Pulse:** on in_flight status badges, connected dots
- **Glow:** on hover for accent buttons and active nav items
- **HUD roll:** Continuous sin wave for horizon indicator
- **Fade-in:** on new chat messages and log entries
- **Stagger:** on thinking dots animation (0ms, 150ms, 300ms delay)

## 9. Files Affected

### 9.1 Core Design System

- `studio/src/app/globals.css` — Complete rewrite with new tokens
- `studio/src/app/layout.tsx` — New header, font imports (Geist, JetBrains Mono)

### 9.2 Home Page

- `studio/src/app/page.tsx` — New dashboard layout with stats, missions table, status panel

### 9.3 Agent Page

- `studio/src/components/agent/AgentWindow.tsx` — New layout
- `studio/src/components/agent/ChatMessage.tsx` — New message bubbles
- `studio/src/components/agent/ChatInput.tsx` — New input styling
- `studio/src/components/agent/MissionHistory.tsx` — New sidebar items

### 9.4 Design Page

- `studio/src/components/design/DesignMode.tsx` — New layout
- `studio/src/components/design/Viewport.tsx` — New SVG drone with grid background
- `studio/src/components/design/MetricsPanel.tsx` — New metrics rows
- `studio/src/components/design/ComponentPalette.tsx` — New palette styling
- `studio/src/components/design/AISuggestions.tsx` — New suggestion cards

### 9.5 Flight Page

- `studio/src/components/flight/FlightDashboard.tsx` — New layout
- `studio/src/components/flight/HUD.tsx` — Complete rewrite with horizon, crosshair, ladders
- `studio/src/components/flight/TelemetryPanel.tsx` — New telemetry cards
- `studio/src/components/flight/AgentLog.tsx` — New log styling
- `studio/src/components/flight/EmergencyControls.tsx` — New emergency buttons

### 9.6 New Shared Components

- `studio/src/components/ui/Card.tsx` — Reusable card component
- `studio/src/components/ui/Badge.tsx` — Status badge component
- `studio/src/components/ui/Button.tsx` — Button variants (primary, secondary, danger)
- `studio/src/components/ui/GridBackground.tsx` — Holographic grid pattern

### 9.7 Package Dependencies

- Add `geist` package for Geist Sans font
- Add `@fontsource/jetbrains-mono` for JetBrains Mono font

## 10. Implementation Order

1. **Design tokens** — globals.css with all CSS custom properties
2. **Typography** — Install Geist and JetBrains Mono fonts
3. **Shared UI components** — Card, Badge, Button, GridBackground
4. **Layout** — Header, page structure, responsive breakpoints
5. **Home Dashboard** — Stats cards, missions table, status panel
6. **Agent Chat** — Chat messages, sidebar, input
7. **Design Mode** — Palette, viewport, metrics panel
8. **Flight Dashboard** — HUD, telemetry, logs, emergency controls
9. **Animations** — Transitions, hover effects, micro-interactions
10. **Responsive** — Tablet and mobile adaptations
