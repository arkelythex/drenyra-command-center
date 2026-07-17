# Andino Studio UI/UX Redesign — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the Andino Studio Next.js 16 web app from a generic dark Tailwind template to a "Command Center" design system with sci-fi minimal aesthetic.

**Architecture:** Replace all styling with a comprehensive CSS custom properties design system. Rewrite each page's layout and components to match the new design tokens. Add shared UI components (Card, Badge, Button, GridBackground). Install Geist and JetBrains Mono fonts.

**Tech Stack:** Next.js 16, React 19, Tailwind CSS 4, TypeScript, Lucide React icons, Geist font, JetBrains Mono font

## Global Constraints

- Next.js 16 App Router with React 19
- Tailwind CSS 4 with @theme directive in globals.css
- All colors via CSS custom properties (no hardcoded Tailwind colors in components)
- Font stack: Geist for UI, JetBrains Mono for data/code
- Desktop-first, responsive (breakpoints: 768px tablet, 1280px desktop)
- Use `bun` as package manager (not npm)
- Conventional commits required

---

## File Structure

```
studio/src/
  app/
    globals.css                    -- REWRITE: Design tokens, animations, grid pattern
    layout.tsx                     -- REWRITE: New header, font imports, nav links
    page.tsx                       -- REWRITE: Dashboard with stats, missions, status
  components/
    ui/
      Card.tsx                     -- CREATE: Reusable card component
      Badge.tsx                    -- CREATE: Status badge component
      Button.tsx                   -- CREATE: Button variants (primary, secondary, danger)
      GridBackground.tsx           -- CREATE: Holographic grid pattern overlay
    agent/
      AgentWindow.tsx              -- REWRITE: New layout structure
      ChatMessage.tsx              -- REWRITE: New message bubble design
      ChatInput.tsx                -- REWRITE: New input styling
      MissionHistory.tsx           -- REWRITE: New sidebar items
    design/
      DesignMode.tsx               -- REWRITE: New layout structure
      Viewport.tsx                 -- REWRITE: SVG drone with grid background
      MetricsPanel.tsx             -- REWRITE: New metrics rows
      ComponentPalette.tsx         -- REWRITE: New palette styling
      AISuggestions.tsx            -- REWRITE: New suggestion cards
    flight/
      FlightDashboard.tsx          -- REWRITE: New layout structure
      HUD.tsx                      -- REWRITE: Horizon, crosshair, ladders
      TelemetryPanel.tsx           -- REWRITE: New telemetry cards
      AgentLog.tsx                 -- REWRITE: New log styling
      EmergencyControls.tsx        -- REWRITE: New emergency buttons
```

---

## Task 1: Install Fonts and Dependencies

**Files:**
- Modify: `studio/package.json` (via bun add)
- Create: `studio/src/app/fonts.ts` (font configuration)

**Interfaces:**
- Consumes: None (first task)
- Produces: Geist and JetBrains Mono fonts available for import

- [ ] **Step 1: Install font packages**

```bash
cd /home/dreamcoder08/Documents/PROYECTOS/arkelythex/ventures/andino-drone-lab/studio
bun add geist @fontsource/jetbrains-mono
```

Expected: Packages installed successfully

- [ ] **Step 2: Create font configuration file**

Create `studio/src/app/fonts.ts`:

```typescript
import { Geist_Mono } from "next/font/google";
import { JetBrains_Mono } from "@fontsource/jetbrains-mono";
import "@fontsource/jetbrains-mono/400.css";
import "@fontsource/jetbrains-mono/500.css";
import "@fontsource/jetbrains-mono/600.css";
import "@fontsource/jetbrains-mono/700.css";

export const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
});

// JetBrains Mono is imported via @fontsource, just add the class
export const jetbrainsMono = "font-jetbrains-mono";
```

- [ ] **Step 3: Verify packages installed**

```bash
cd /home/dreamcoder08/Documents/PROYECTOS/arkelythex/ventures/andino-drone-lab/studio
ls node_modules/geist/package.json && ls node_modules/@fontsource/jetbrains-mono/package.json && echo "OK"
```

Expected: "OK"

- [ ] **Step 4: Commit**

```bash
cd /home/dreamcoder08/Documents/PROYECTOS/arkelythex/ventures/andino-drone-lab
git add studio/package.json studio/package-lock.json studio/src/app/fonts.ts
git commit -m "chore(studio): add Geist and JetBrains Mono fonts"
```

---

## Task 2: Design Tokens in globals.css

**Files:**
- Rewrite: `studio/src/app/globals.css`

**Interfaces:**
- Consumes: Font packages from Task 1
- Produces: All CSS custom properties used by every subsequent task

- [ ] **Step 1: Rewrite globals.css with complete design system**

Replace entire contents of `studio/src/app/globals.css`:

```css
@import "tailwindcss";

@theme {
  /* === BACKGROUND TOKENS === */
  --color-bg-void: #060a13;
  --color-bg-primary: #0c1220;
  --color-bg-surface: #111827;
  --color-bg-elevated: #1a2332;
  --color-bg-overlay: rgba(12, 18, 32, 0.8);

  /* === BORDER TOKENS === */
  --color-border-subtle: rgba(255, 255, 255, 0.06);
  --color-border-default: rgba(255, 255, 255, 0.1);
  --color-border-accent: rgba(0, 212, 255, 0.3);

  /* === ACCENT (Cyan/Ice-Blue) === */
  --color-accent-50: #e0faff;
  --color-accent-100: #b3f0ff;
  --color-accent-400: #00d4ff;
  --color-accent-500: #00b8db;
  --color-accent-600: #0099b8;

  /* === SEMANTIC COLORS === */
  --color-success: #34d399;
  --color-warning: #fbbf24;
  --color-error: #f87171;
  --color-info: #60a5fa;

  /* === TEXT COLORS === */
  --color-text-primary: #f0f4f8;
  --color-text-secondary: #8899aa;
  --color-text-muted: #556677;
  --color-text-accent: #00d4ff;

  /* === ANIMATIONS === */
  --animate-fade-in: fade-in 0.3s ease-out;
  --animate-slide-up: slide-up 0.3s ease-out;
  --animate-pulse-glow: pulse-glow 2s ease-in-out infinite;
  --animate-count-up: count-up 0.8s ease-out;
}

@keyframes fade-in {
  from { opacity: 0; transform: translateY(4px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes slide-up {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes pulse-glow {
  0%, 100% { box-shadow: 0 0 0 0 rgba(0, 212, 255, 0); }
  50% { box-shadow: 0 0 20px 4px rgba(0, 212, 255, 0.15); }
}

@keyframes count-up {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}

/* === BASE STYLES === */
body {
  background-color: var(--color-bg-void);
  color: var(--color-text-primary);
  font-family: 'Geist', 'Inter', system-ui, sans-serif;
}

/* === HOLOGRAPHIC GRID PATTERN === */
.grid-pattern {
  background-image:
    linear-gradient(rgba(255, 255, 255, 0.02) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.02) 1px, transparent 1px);
  background-size: 40px 40px;
}

/* === GLOW EFFECTS === */
.glow-accent {
  box-shadow: 0 0 20px rgba(0, 212, 255, 0.15);
}

.glow-text {
  text-shadow: 0 0 20px rgba(0, 212, 255, 0.3);
}

/* === SCROLLBAR STYLING === */
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

::-webkit-scrollbar-track {
  background: var(--color-bg-void);
}

::-webkit-scrollbar-thumb {
  background: var(--color-border-default);
  border-radius: 3px;
}

::-webkit-scrollbar-thumb:hover {
  background: var(--color-border-accent);
}
```

- [ ] **Step 2: Verify CSS compiles**

```bash
cd /home/dreamcoder08/Documents/PROYECTOS/arkelythex/ventures/andino-drone-lab/studio
bun next build 2>&1 | tail -5
```

Expected: Build completes without CSS errors

- [ ] **Step 3: Commit**

```bash
cd /home/dreamcoder08/Documents/PROYECTOS/arkelythex/ventures/andino-drone-lab
git add studio/src/app/globals.css
git commit -m "feat(studio): add Command Center design tokens and animations"
```

---

## Task 3: Shared UI Components

**Files:**
- Create: `studio/src/components/ui/Card.tsx`
- Create: `studio/src/components/ui/Badge.tsx`
- Create: `studio/src/components/ui/Button.tsx`
- Create: `studio/src/components/ui/GridBackground.tsx`

**Interfaces:**
- Consumes: CSS tokens from Task 2
- Produces: Card, Badge, Button, GridBackground components used by all pages

- [ ] **Step 1: Create Card component**

Create `studio/src/components/ui/Card.tsx`:

```tsx
import { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
}

export default function Card({ children, className = '', hover = false }: CardProps) {
  return (
    <div
      className={`
        bg-bg-surface border border-border-subtle rounded-[10px]
        ${hover ? 'hover:bg-bg-elevated hover:border-border-accent transition-all duration-200 cursor-pointer' : ''}
        ${className}
      `}
    >
      {children}
    </div>
  );
}
```

- [ ] **Step 2: Create Badge component**

Create `studio/src/components/ui/Badge.tsx`:

```tsx
type BadgeVariant = 'success' | 'warning' | 'error' | 'info' | 'accent';

interface BadgeProps {
  variant: BadgeVariant;
  children: React.ReactNode;
  pulse?: boolean;
}

const variantStyles: Record<BadgeVariant, string> = {
  success: 'bg-success/10 text-success',
  warning: 'bg-warning/10 text-warning',
  error: 'bg-error/10 text-error',
  info: 'bg-info/10 text-info',
  accent: 'bg-accent-400/10 text-accent-400',
};

export default function Badge({ variant, children, pulse = false }: BadgeProps) {
  return (
    <span
      className={`
        inline-block px-2 py-0.5 rounded text-xs font-medium
        ${variantStyles[variant]}
        ${pulse ? 'animate-pulse-glow' : ''}
      `}
    >
      {children}
    </span>
  );
}
```

- [ ] **Step 3: Create Button component**

Create `studio/src/components/ui/Button.tsx`:

```tsx
import { ReactNode } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'warning';

interface ButtonProps {
  variant: ButtonVariant;
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  icon?: ReactNode;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: 'bg-accent-400 text-bg-void hover:bg-accent-500 shadow-glow',
  secondary: 'bg-bg-surface border border-border-subtle text-text-primary hover:bg-bg-elevated hover:border-border-accent',
  danger: 'bg-error text-white hover:brightness-110',
  warning: 'bg-warning/80 text-white hover:brightness-110',
};

export default function Button({
  variant,
  children,
  onClick,
  disabled = false,
  className = '',
  icon,
}: ButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium
        transition-all duration-200
        disabled:opacity-50 disabled:cursor-not-allowed
        ${variantStyles[variant]}
        ${className}
      `}
    >
      {icon}
      {children}
    </button>
  );
}
```

- [ ] **Step 4: Create GridBackground component**

Create `studio/src/components/ui/GridBackground.tsx`:

```tsx
import { ReactNode } from 'react';

interface GridBackgroundProps {
  children: ReactNode;
  className?: string;
}

export default function GridBackground({ children, className = '' }: GridBackgroundProps) {
  return (
    <div className={`relative bg-bg-void grid-pattern ${className}`}>
      {children}
    </div>
  );
}
```

- [ ] **Step 5: Verify components compile**

```bash
cd /home/dreamcoder08/Documents/PROYECTOS/arkelythex/ventures/andino-drone-lab/studio
bun next build 2>&1 | tail -5
```

Expected: Build completes without errors

- [ ] **Step 6: Commit**

```bash
cd /home/dreamcoder08/Documents/PROYECTOS/arkelythex/ventures/andino-drone-lab
git add studio/src/components/ui/
git commit -m "feat(studio): add shared UI components (Card, Badge, Button, GridBackground)"
```

---

## Task 4: Redesign Layout and Header

**Files:**
- Rewrite: `studio/src/app/layout.tsx`

**Interfaces:**
- Consumes: Font config from Task 1, CSS tokens from Task 2
- Produces: Global header and layout structure used by all pages

- [ ] **Step 1: Rewrite layout.tsx**

Replace entire contents of `studio/src/app/layout.tsx`:

```tsx
import type { Metadata } from "next";
import Link from "next/link";
import { geistMono } from "./fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: "Andino Studio",
  description: "Command Center for Drone Evolution",
};

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/agent", label: "Agent" },
  { href: "/design", label: "Design" },
  { href: "/flight", label: "Flight" },
];

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistMono.variable} antialiased min-h-screen flex flex-col`}>
        <header className="h-[52px] shrink-0 border-b border-border-subtle bg-bg-void/80 backdrop-blur-sm sticky top-0 z-50">
          <div className="max-w-[1600px] mx-auto px-6 h-full flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-accent-400 text-xl glow-text">◆</span>
              <span className="font-bold text-base text-text-primary">Andino Studio</span>
            </div>
            <nav className="flex items-center gap-8">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-sm text-text-secondary hover:text-text-primary transition-colors duration-200 relative after:absolute after:bottom-[-2px] after:left-0 after:right-0 after:h-[2px] after:bg-accent-400 after:scale-x-0 hover:after:scale-x-100 after:transition-transform after:duration-200"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
            <div className="flex items-center gap-2 text-sm text-text-muted">
              <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
              Connected
            </div>
          </div>
        </header>
        <main className="flex-1">{children}</main>
      </body>
    </html>
  );
}
```

- [ ] **Step 2: Verify layout renders**

```bash
cd /home/dreamcoder08/Documents/PROYECTOS/arkelythex/ventures/andino-drone-lab/studio
bun next build 2>&1 | tail -5
```

Expected: Build completes without errors

- [ ] **Step 3: Commit**

```bash
cd /home/dreamcoder08/Documents/PROYECTOS/arkelythex/ventures/andino-drone-lab
git add studio/src/app/layout.tsx
git commit -m "feat(studio): redesign layout with Command Center header and navigation"
```

---

## Task 5: Redesign Home Dashboard

**Files:**
- Rewrite: `studio/src/app/page.tsx`

**Interfaces:**
- Consumes: Card, Badge, Button from Task 3, CSS tokens from Task 2
- Produces: Complete home dashboard with stats, missions table, status panel, quick actions

- [ ] **Step 1: Rewrite page.tsx**

Replace entire contents of `studio/src/app/page.tsx`:

```tsx
import Link from "next/link";
import { mockMissions } from "@/lib/mock-data";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";

const stats = [
  { label: "Missions Flown", value: "47", icon: "◆" },
  { label: "Designs Evolved", value: "1,284", icon: "◇" },
  { label: "Flight Hours", value: "312", icon: "⏱" },
  { label: "AI Iterations", value: "9,847", icon: "⚡" },
];

const statusVariant: Record<string, 'success' | 'accent' | 'warning' | 'error'> = {
  planning: 'warning',
  in_flight: 'accent',
  completed: 'success',
  failed: 'error',
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export default function Home() {
  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Hero Section */}
      <section className="mb-12 animate-fade-in">
        <h1 className="text-4xl font-bold text-text-primary mb-2 tracking-tight">
          Andino Studio
        </h1>
        <p className="text-lg text-text-secondary mb-1">
          Command Center for Drone Evolution
        </p>
        <p className="text-sm text-text-muted max-w-xl">
          Design, simulate, and evolve custom drone platforms for high-altitude
          mining operations in the Andes.
        </p>
      </section>

      {/* Stats Grid */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        {stats.map((s, i) => (
          <Card key={s.label} hover className="p-5 animate-slide-up" style={{ animationDelay: `${i * 100}ms` }}>
            <div className="text-2xl font-bold font-mono text-accent-400 glow-text">
              {s.value}
            </div>
            <div className="text-xs text-text-muted uppercase tracking-wider mt-2">
              {s.label}
            </div>
          </Card>
        ))}
      </section>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
        {/* Recent Missions - 2 cols */}
        <Card className="lg:col-span-2 p-5">
          <h2 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-4">
            Recent Missions
          </h2>
          <div className="space-y-2">
            {mockMissions.slice(0, 5).map((m) => (
              <div
                key={m.id}
                className="flex items-center justify-between py-3 px-4 rounded-lg bg-bg-elevated/50 hover:bg-bg-elevated transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-4">
                  <span className="text-sm font-mono text-text-muted">{m.id}</span>
                  <span className="text-sm text-text-primary">{m.name}</span>
                </div>
                <div className="flex items-center gap-4">
                  <Badge variant={statusVariant[m.status]}>
                    {m.status.replace("_", " ")}
                  </Badge>
                  <span className="text-xs text-text-muted">{formatDate(m.startedAt)}</span>
                </div>
              </div>
            ))}
          </div>
          <Link
            href="/flight"
            className="inline-block mt-4 text-sm text-accent-400 hover:text-accent-500 transition-colors"
          >
            View All Missions →
          </Link>
        </Card>

        {/* System Status - 1 col */}
        <Card className="p-5">
          <h2 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-4">
            System Status
          </h2>

          {/* Evolution Progress */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-text-secondary">Evolution Progress</span>
              <span className="text-sm font-mono text-accent-400">71%</span>
            </div>
            <div className="h-2 bg-bg-elevated rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-accent-400 to-accent-600 rounded-full transition-all duration-500"
                style={{ width: "71%" }}
              />
            </div>
            <div className="flex justify-between mt-2 text-xs text-text-muted">
              <span>Gen 142 / 200</span>
              <span>Fitness: 0.847</span>
            </div>
          </div>

          {/* Status Items */}
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center p-3 bg-bg-elevated rounded-lg">
              <div className="text-lg font-bold font-mono text-accent-400">3</div>
              <div className="text-xs text-text-muted">Active</div>
            </div>
            <div className="text-center p-3 bg-bg-elevated rounded-lg">
              <div className="text-lg font-bold font-mono text-warning">2</div>
              <div className="text-xs text-text-muted">Queue</div>
            </div>
            <div className="text-center p-3 bg-bg-elevated rounded-lg">
              <div className="text-lg font-bold font-mono text-success">0</div>
              <div className="text-xs text-text-muted">Errors</div>
            </div>
          </div>
        </Card>
      </div>

      {/* Quick Actions */}
      <section className="flex flex-wrap gap-4">
        <Link href="/design">
          <Button variant="primary" icon={<span>◇</span>}>
            New Design
          </Button>
        </Link>
        <Link href="/flight">
          <Button variant="secondary" icon={<span>▶</span>}>
            Flight Dashboard
          </Button>
        </Link>
        <Link href="/agent">
          <Button variant="secondary" icon={<span>◆</span>}>
            AI Agent
          </Button>
        </Link>
      </section>
    </div>
  );
}
```

- [ ] **Step 2: Verify home page renders**

```bash
cd /home/dreamcoder08/Documents/PROYECTOS/arkelythex/ventures/andino-drone-lab/studio
bun next build 2>&1 | tail -5
```

Expected: Build completes without errors

- [ ] **Step 3: Commit**

```bash
cd /home/dreamcoder08/Documents/PROYECTOS/arkelythex/ventures/andino-drone-lab
git add studio/src/app/page.tsx
git commit -m "feat(studio): redesign home dashboard with Command Center layout"
```

---

## Task 6: Redesign Agent Chat

**Files:**
- Rewrite: `studio/src/components/agent/AgentWindow.tsx`
- Rewrite: `studio/src/components/agent/ChatMessage.tsx`
- Rewrite: `studio/src/components/agent/ChatInput.tsx`
- Rewrite: `studio/src/components/agent/MissionHistory.tsx`

**Interfaces:**
- Consumes: Card, Badge from Task 3, CSS tokens from Task 2
- Produces: Complete agent chat interface

- [ ] **Step 1: Rewrite ChatMessage.tsx**

Replace entire contents of `studio/src/components/agent/ChatMessage.tsx`:

```tsx
'use client';

import type { AgentMessage } from '@/types/drone';

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function ChatMessage({ message }: { message: AgentMessage }) {
  const isUser = message.role === 'user';

  return (
    <div
      className={`flex gap-3 items-start animate-fade-in ${
        isUser ? 'flex-row-reverse' : ''
      }`}
    >
      {/* Avatar */}
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
          isUser
            ? 'bg-bg-elevated text-text-secondary'
            : 'bg-accent-400/20 text-accent-400'
        }`}
      >
        {isUser ? 'U' : '◆'}
      </div>

      {/* Message Bubble */}
      <div className={`max-w-[70%] ${isUser ? 'text-right' : ''}`}>
        <div
          className={`rounded-[10px] px-4 py-2.5 text-sm leading-relaxed ${
            isUser
              ? 'bg-accent-400/8 border-r-2 border-accent-400/30 text-text-primary'
              : 'bg-bg-surface border-l-2 border-accent-400 text-text-primary'
          }`}
        >
          {message.text}
        </div>
        <div className="text-xs text-text-muted mt-1 px-1 font-mono">
          {formatTime(message.timestamp)}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Rewrite ChatInput.tsx**

Replace entire contents of `studio/src/components/agent/ChatInput.tsx`:

```tsx
'use client';

import { useState } from 'react';

export default function ChatInput({
  onSend,
  disabled,
}: {
  onSend: (text: string) => void;
  disabled: boolean;
}) {
  const [text, setText] = useState('');

  function handleSubmit() {
    const trimmed = text.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setText('');
  }

  return (
    <div className="border-t border-border-subtle p-4 bg-bg-void">
      <div className="flex gap-3 max-w-4xl mx-auto">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSubmit();
            }
          }}
          placeholder="Ask the agent about drone design, missions, or optimization..."
          disabled={disabled}
          className="flex-1 bg-bg-surface border border-border-subtle rounded-lg px-4 py-2.5 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-accent-400/30 focus:border-accent-400 disabled:opacity-50 transition-all duration-200"
        />
        <button
          onClick={handleSubmit}
          disabled={disabled || !text.trim()}
          className="px-5 py-2.5 bg-accent-400 hover:bg-accent-500 disabled:bg-bg-elevated disabled:text-text-muted text-bg-void rounded-lg text-sm font-medium transition-all duration-200"
        >
          Send
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Rewrite MissionHistory.tsx**

Replace entire contents of `studio/src/components/agent/MissionHistory.tsx`:

```tsx
'use client';

import type { Mission } from '@/types/drone';

const statusStyle: Record<Mission['status'], string> = {
  completed: 'bg-success/10 text-success',
  in_flight: 'bg-accent-400/10 text-accent-400',
  failed: 'bg-error/10 text-error',
  planning: 'bg-warning/10 text-warning',
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

export default function MissionHistory({
  missions,
  activeId,
  onSelect,
}: {
  missions: Mission[];
  activeId: string;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="h-full flex flex-col bg-bg-void">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border-subtle">
        <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">Missions</span>
        <span className="text-xs bg-bg-elevated text-text-muted px-1.5 py-0.5 rounded-full font-mono">
          {missions.length}
        </span>
      </div>
      <div className="flex-1 overflow-y-auto">
        {missions.map((m) => (
          <button
            key={m.id}
            onClick={() => onSelect(m.id)}
            className={`w-full text-left px-4 py-3 border-b border-border-subtle/50 transition-all duration-200 hover:bg-bg-elevated ${
              m.id === activeId ? 'bg-bg-elevated border-l-2 border-l-accent-400' : ''
            }`}
          >
            <div className="text-sm font-medium text-text-primary truncate">
              {m.name}
            </div>
            <div className="flex items-center gap-2 mt-1.5">
              <span
                className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-medium uppercase ${
                  statusStyle[m.status]
                }`}
              >
                {m.status.replace('_', ' ')}
              </span>
              <span className="text-[11px] text-text-muted font-mono">
                {formatDate(m.startedAt)}
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Rewrite AgentWindow.tsx**

Replace entire contents of `studio/src/components/agent/AgentWindow.tsx`:

```tsx
'use client';

import { useState, useRef, useEffect } from 'react';
import type { AgentMessage, Mission } from '@/types/drone';
import { mockMessages, mockMissions } from '@/lib/mock-data';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';
import MissionHistory from './MissionHistory';

const mockReply: AgentMessage = {
  id: 'msg-reply',
  role: 'assistant',
  text: "I've analyzed the mission requirements for high-altitude mining inspection. Based on the 4000m altitude constraint, I recommend optimizing for thrust-to-weight ratio above 2.0. The current Pareto-optimal design uses a quad configuration with 280mm arms and 13\" props. Want me to evolve this further?",
  timestamp: '',
};

let msgCounter = mockMessages.length + 1;

export default function AgentWindow() {
  const [messages, setMessages] = useState<AgentMessage[]>(mockMessages);
  const [isThinking, setIsThinking] = useState(false);
  const [missions] = useState<Mission[]>(mockMissions);
  const [activeMissionId, setActiveMissionId] = useState(mockMissions[0].id);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isThinking]);

  function handleSend(text: string) {
    const userMsg: AgentMessage = {
      id: `msg-${++msgCounter}`,
      role: 'user',
      text,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsThinking(true);

    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        { ...mockReply, id: `msg-${++msgCounter}`, timestamp: new Date().toISOString() },
      ]);
      setIsThinking(false);
    }, 1500);
  }

  return (
    <div className="flex h-[calc(100vh-52px)]">
      {/* Sidebar */}
      <aside className="w-[240px] shrink-0 border-r border-border-subtle bg-bg-void flex flex-col">
        <MissionHistory
          missions={missions}
          activeId={activeMissionId}
          onSelect={setActiveMissionId}
        />
      </aside>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col bg-bg-primary">
        <div className="flex-1 overflow-y-auto px-4 py-6">
          <div className="max-w-3xl mx-auto space-y-4">
            {messages.map((msg) => (
              <ChatMessage key={msg.id} message={msg} />
            ))}
            {isThinking && (
              <div className="flex gap-3 items-start animate-fade-in">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 bg-accent-400/20 text-accent-400">
                  ◆
                </div>
                <div className="bg-bg-surface border-l-2 border-accent-400 rounded-[10px] px-4 py-2.5 text-sm text-text-muted">
                  Thinking
                  <span className="inline-flex gap-0.5 ml-1">
                    <span className="w-1 h-1 rounded-full bg-accent-400 animate-bounce [animation-delay:0ms]" />
                    <span className="w-1 h-1 rounded-full bg-accent-400 animate-bounce [animation-delay:150ms]" />
                    <span className="w-1 h-1 rounded-full bg-accent-400 animate-bounce [animation-delay:300ms]" />
                  </span>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        </div>
        <ChatInput onSend={handleSend} disabled={isThinking} />
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Verify agent page compiles**

```bash
cd /home/dreamcoder08/Documents/PROYECTOS/arkelythex/ventures/andino-drone-lab/studio
bun next build 2>&1 | tail -5
```

Expected: Build completes without errors

- [ ] **Step 6: Commit**

```bash
cd /home/dreamcoder08/Documents/PROYECTOS/arkelythex/ventures/andino-drone-lab
git add studio/src/components/agent/
git commit -m "feat(studio): redesign agent chat with Command Center styling"
```

---

## Task 7: Redesign Design Mode

**Files:**
- Rewrite: `studio/src/components/design/DesignMode.tsx`
- Rewrite: `studio/src/components/design/Viewport.tsx`
- Rewrite: `studio/src/components/design/MetricsPanel.tsx`
- Rewrite: `studio/src/components/design/ComponentPalette.tsx`
- Rewrite: `studio/src/components/design/AISuggestions.tsx`

**Interfaces:**
- Consumes: Card, Badge, Button, GridBackground from Task 3, CSS tokens from Task 2
- Produces: Complete drone builder interface

- [ ] **Step 1: Rewrite Viewport.tsx**

Replace entire contents of `studio/src/components/design/Viewport.tsx`:

```tsx
'use client';

import type { DroneDesign } from '@/types/drone';

interface ViewportProps {
  design: DroneDesign;
}

function getArmAngles(frameType: DroneDesign['frameType']): number[] {
  switch (frameType) {
    case 'quad': return [45, 135, 225, 315];
    case 'y6': return [0, 60, 120, 180, 240, 300];
    case 'x8': return [22.5, 67.5, 112.5, 157.5, 202.5, 247.5, 292.5, 337.5];
    case 'hexa': return [0, 60, 120, 180, 240, 300];
    case 'octo': return [22.5, 67.5, 112.5, 157.5, 202.5, 247.5, 292.5, 337.5];
  }
}

interface Point { x: number; y: number; }

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number): Point {
  const rad = (angleDeg * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

export default function Viewport({ design }: ViewportProps) {
  const cx = 200;
  const cy = 200;
  const armLength = 120;
  const motorRadius = 10;
  const frameRadius = 22;
  const angles = getArmAngles(design.frameType);

  return (
    <div className="flex-1 min-h-[400px] border border-border-subtle rounded-[10px] bg-bg-void grid-pattern relative overflow-hidden flex items-center justify-center">
      <svg viewBox="0 0 400 400" className="w-full h-full max-h-[600px] p-4">
        {/* Arms */}
        {angles.map((angle, i) => {
          const end = polarToCartesian(cx, cy, armLength, angle);
          return (
            <line
              key={`arm-${i}`}
              x1={cx} y1={cy} x2={end.x} y2={end.y}
              stroke="#00d4ff" strokeWidth="3" strokeLinecap="round" opacity={0.8}
            />
          );
        })}

        {/* Frame center */}
        <circle cx={cx} cy={cy} r={frameRadius} fill="none" stroke="#00d4ff" strokeWidth="2.5" opacity={0.7} />
        <circle cx={cx} cy={cy} r={6} fill="#00d4ff" opacity={0.9} />

        {/* Motors */}
        {angles.map((angle, i) => {
          const pos = polarToCartesian(cx, cy, armLength, angle);
          return (
            <g key={`motor-${i}`}>
              <circle cx={pos.x} cy={pos.y} r={motorRadius} fill="#1a2332" stroke="#00d4ff" strokeWidth="1.5" />
              <circle cx={pos.x} cy={pos.y} r={3} fill="#00d4ff" opacity={0.6} />
            </g>
          );
        })}

        {/* Coaxial inner motors for Y6 and X8 */}
        {(design.frameType === 'y6' || design.frameType === 'x8') &&
          angles.map((angle, i) => {
            const pos = polarToCartesian(cx, cy, armLength * 0.55, angle);
            return (
              <g key={`coax-${i}`}>
                <circle cx={pos.x} cy={pos.y} r={motorRadius * 0.8} fill="none" stroke="#00d4ff" strokeWidth="1" strokeDasharray="3 2" opacity={0.5} />
                <circle cx={pos.x} cy={pos.y} r={2.5} fill="#00d4ff" opacity={0.3} />
              </g>
            );
          })}
      </svg>

      {/* Bottom label */}
      <div className="absolute bottom-3 left-4 text-sm text-text-muted">
        Current: <span className="text-text-primary font-medium font-mono uppercase">{design.frameType}</span>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Rewrite MetricsPanel.tsx**

Replace entire contents of `studio/src/components/design/MetricsPanel.tsx`:

```tsx
'use client';

import type { DroneDesign } from '@/types/drone';

function twrColor(twr: number): string {
  if (twr >= 2.0) return 'text-success';
  if (twr >= 1.5) return 'text-warning';
  return 'text-error';
}

function MetricRow({ label, value, unit, valueClassName = 'text-text-primary' }: {
  label: string; value: string; unit?: string; valueClassName?: string;
}) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-border-subtle/50 last:border-b-0">
      <span className="text-sm text-text-secondary">{label}</span>
      <span className={`text-sm font-medium font-mono ${valueClassName}`}>
        {value}
        {unit && <span className="text-text-muted ml-1 text-xs">{unit}</span>}
      </span>
    </div>
  );
}

export default function MetricsPanel({ design }: { design: DroneDesign }) {
  return (
    <div className="bg-bg-surface border border-border-subtle rounded-[10px] p-4">
      <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">Design Metrics</h3>
      <MetricRow label="Frame Type" value={design.frameType.toUpperCase()} />
      <MetricRow label="Arm Length" value={design.armLength.toString()} unit="mm" />
      <MetricRow label="Motor Count" value={design.motorCount.toString()} />
      <MetricRow label="TWR" value={design.twr.toFixed(1)} unit=":1" valueClassName={twrColor(design.twr)} />
      <MetricRow label="Payload" value={design.payloadMass.toString()} unit="g" />
      <MetricRow label="Flight Time" value={design.flightTimeMin.toFixed(1)} unit="min" />
      <MetricRow label="Cost" value={`$${design.costUsd.toLocaleString()}`} />
      <MetricRow label="Battery" value={`${design.batteryCells}S ${design.batteryCapacity}mAh`} />
      <MetricRow label="Propeller" value={`${design.propellerDiameter}"x${design.propellerPitch}"`} />
      <MetricRow label="Material" value={design.frameMaterial.charAt(0).toUpperCase() + design.frameMaterial.slice(1)} />
    </div>
  );
}
```

- [ ] **Step 3: Rewrite ComponentPalette.tsx**

Replace entire contents of `studio/src/components/design/ComponentPalette.tsx`:

```tsx
'use client';

import { useState } from 'react';
import { ChevronDown, ChevronRight, Box, RotateCw, Airplay, Battery } from 'lucide-react';

interface PaletteCategory {
  name: string;
  icon: React.ReactNode;
  items: { label: string; detail?: string }[];
}

const categories: PaletteCategory[] = [
  {
    name: 'Frames', icon: <Box size={16} />,
    items: [
      { label: 'Quad', detail: '4 arms' }, { label: 'Y6', detail: '6 arms, coaxial' },
      { label: 'X8', detail: '8 arms, coaxial' }, { label: 'Hexa', detail: '6 arms' },
      { label: 'Octo', detail: '8 arms' },
    ],
  },
  {
    name: 'Motors', icon: <RotateCw size={16} />,
    items: [
      { label: '2207', detail: '1960KV' }, { label: '4010', detail: '480KV' },
      { label: '501S', detail: '320KV' }, { label: '6010', detail: '280KV' },
    ],
  },
  {
    name: 'Propellers', icon: <Airplay size={16} />,
    items: [
      { label: '6x3.5', detail: '6" dia' }, { label: '10x4.5', detail: '10" dia' },
      { label: '13x4.5', detail: '13" dia' }, { label: '15x5', detail: '15" dia' },
    ],
  },
  {
    name: 'Batteries', icon: <Battery size={16} />,
    items: [
      { label: '4S 4200', detail: '15.4V' }, { label: '6S 10000', detail: '22.2V' },
      { label: '12S 16000', detail: '44.4V' },
    ],
  },
];

export default function ComponentPalette({ onSelectComponent }: {
  onSelectComponent: (category: string, item: string) => void;
}) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const toggle = (name: string) => {
    setExpanded((prev) => ({ ...prev, [name]: !prev[name] }));
  };

  return (
    <aside className="w-[200px] flex-shrink-0 bg-bg-surface border border-border-subtle rounded-[10px] p-3 overflow-y-auto">
      <h2 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">Components</h2>
      <div className="space-y-2">
        {categories.map((cat) => (
          <div key={cat.name}>
            <button
              onClick={() => toggle(cat.name)}
              className="flex items-center gap-2 w-full text-left text-sm text-text-secondary hover:text-text-primary py-1.5 px-2 rounded-lg hover:bg-bg-elevated transition-colors duration-200"
            >
              {expanded[cat.name] ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              <span className="text-text-muted">{cat.icon}</span>
              {cat.name}
            </button>
            {expanded[cat.name] && (
              <div className="ml-1 mt-1 space-y-1">
                {cat.items.map((item) => (
                  <button
                    key={item.label}
                    onClick={() => onSelectComponent(cat.name, item.label)}
                    className="w-full text-left bg-bg-elevated hover:bg-bg-primary rounded-lg p-2 cursor-pointer border-l-2 border-accent-400/50 transition-colors duration-200"
                  >
                    <div className="text-sm text-text-primary">{item.label}</div>
                    {item.detail && <div className="text-xs text-text-muted">{item.detail}</div>}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </aside>
  );
}
```

- [ ] **Step 4: Rewrite AISuggestions.tsx**

Replace entire contents of `studio/src/components/design/AISuggestions.tsx`:

```tsx
'use client';

import { Loader2 } from 'lucide-react';

export default function AISuggestions({ suggestions, onApply }: {
  suggestions: string[];
  onApply: (index: number) => void;
}) {
  if (suggestions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-12 text-text-muted">
        <Loader2 size={24} className="animate-spin text-accent-400" />
        <span className="text-sm">Analyzing design...</span>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {suggestions.map((suggestion, i) => (
        <div
          key={i}
          className="bg-bg-surface border border-border-subtle rounded-[10px] p-4 border-l-2 border-l-accent-400/60"
        >
          <span className="text-[10px] font-semibold text-accent-400 uppercase tracking-wider">
            AI Suggestion
          </span>
          <p className="text-sm text-text-secondary mt-1 mb-3 leading-relaxed">{suggestion}</p>
          <button
            onClick={() => onApply(i)}
            className="text-xs px-3 py-1.5 bg-accent-400 hover:bg-accent-500 text-bg-void rounded-md font-medium transition-colors duration-200"
          >
            Apply
          </button>
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 5: Rewrite DesignMode.tsx**

Replace entire contents of `studio/src/components/design/DesignMode.tsx`:

```tsx
'use client';

import { useState, useCallback } from 'react';
import type { DroneDesign } from '@/types/drone';
import { mockDesign, mockSuggestions } from '@/lib/mock-data';
import ComponentPalette from './ComponentPalette';
import Viewport from './Viewport';
import MetricsPanel from './MetricsPanel';
import AISuggestions from './AISuggestions';

export default function DesignMode() {
  const [currentDesign] = useState<DroneDesign>(mockDesign);
  const [activeTab, setActiveTab] = useState<'metrics' | 'suggestions'>('metrics');

  const handleSelectComponent = useCallback((_category: string, _item: string) => {}, []);
  const handleApplySuggestion = useCallback((_index: number) => {}, []);

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 flex flex-col h-[calc(100vh-52px)]">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-text-primary">Design Mode</h1>
        <div className="flex gap-3">
          <button className="px-4 py-2 bg-accent-400 hover:bg-accent-500 text-bg-void rounded-lg text-sm font-medium transition-colors duration-200">
            New Design
          </button>
          <button className="px-4 py-2 bg-accent-400/80 hover:bg-accent-400 text-bg-void rounded-lg text-sm font-medium transition-colors duration-200">
            Evolve
          </button>
          <button className="px-4 py-2 bg-bg-surface hover:bg-bg-elevated border border-border-subtle rounded-lg text-sm font-medium transition-colors duration-200">
            Save CAD
          </button>
          <button className="px-4 py-2 bg-bg-surface hover:bg-bg-elevated border border-border-subtle rounded-lg text-sm font-medium transition-colors duration-200">
            Export STL
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex gap-4 flex-1 min-h-0">
        <ComponentPalette onSelectComponent={handleSelectComponent} />
        <Viewport design={currentDesign} />

        {/* Right Panel */}
        <div className="w-[280px] flex-shrink-0 flex flex-col">
          {/* Tabs */}
          <div className="flex border-b border-border-subtle mb-3">
            <button
              onClick={() => setActiveTab('metrics')}
              className={`flex-1 pb-2 text-sm font-medium transition-colors duration-200 ${
                activeTab === 'metrics'
                  ? 'text-accent-400 border-b-2 border-accent-400'
                  : 'text-text-muted hover:text-text-secondary'
              }`}
            >
              Metrics
            </button>
            <button
              onClick={() => setActiveTab('suggestions')}
              className={`flex-1 pb-2 text-sm font-medium transition-colors duration-200 ${
                activeTab === 'suggestions'
                  ? 'text-accent-400 border-b-2 border-accent-400'
                  : 'text-text-muted hover:text-text-secondary'
              }`}
            >
              AI Suggestions
            </button>
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-y-auto">
            {activeTab === 'metrics' ? (
              <MetricsPanel design={currentDesign} />
            ) : (
              <AISuggestions suggestions={mockSuggestions} onApply={handleApplySuggestion} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 6: Verify design page compiles**

```bash
cd /home/dreamcoder08/Documents/PROYECTOS/arkelythex/ventures/andino-drone-lab/studio
bun next build 2>&1 | tail -5
```

Expected: Build completes without errors

- [ ] **Step 7: Commit**

```bash
cd /home/dreamcoder08/Documents/PROYECTOS/arkelythex/ventures/andino-drone-lab
git add studio/src/components/design/
git commit -m "feat(studio): redesign Design Mode with Command Center styling"
```

---

## Task 8: Redesign Flight Dashboard

**Files:**
- Rewrite: `studio/src/components/flight/FlightDashboard.tsx`
- Rewrite: `studio/src/components/flight/HUD.tsx`
- Rewrite: `studio/src/components/flight/TelemetryPanel.tsx`
- Rewrite: `studio/src/components/flight/AgentLog.tsx`
- Rewrite: `studio/src/components/flight/EmergencyControls.tsx`

**Interfaces:**
- Consumes: Card, Badge, Button, GridBackground from Task 3, CSS tokens from Task 2
- Produces: Complete flight dashboard with HUD, telemetry, logs, emergency controls

- [ ] **Step 1: Rewrite TelemetryPanel.tsx**

Replace entire contents of `studio/src/components/flight/TelemetryPanel.tsx`:

```tsx
import type { Telemetry } from "@/types/drone";

export default function TelemetryPanel({ telemetry }: { telemetry: Telemetry }) {
  const batteryBars = Math.round(telemetry.batteryPercent / 10);

  return (
    <div className="w-[260px] border-r border-border-subtle p-3 flex flex-col gap-3 overflow-y-auto bg-bg-void/50">
      {/* Position */}
      <div className="bg-bg-surface rounded-[10px] p-3">
        <div className="text-xs text-text-muted font-medium uppercase tracking-wider mb-1">Position</div>
        <div className="text-sm font-mono text-text-primary leading-relaxed">
          <div>Lat: {telemetry.lat.toFixed(4)}</div>
          <div>Lon: {telemetry.lon.toFixed(4)}</div>
          <div>Alt: {Math.round(telemetry.altitude).toLocaleString()} m</div>
        </div>
      </div>

      {/* Speed */}
      <div className="bg-bg-surface rounded-[10px] p-3">
        <div className="text-xs text-text-muted font-medium uppercase tracking-wider mb-1">Speed</div>
        <div className="text-sm font-mono text-text-primary leading-relaxed">
          <div>Ground: {telemetry.speed.toFixed(1)} m/s</div>
          <div>Vertical: 0.3 m/s</div>
        </div>
      </div>

      {/* Battery */}
      <div className="bg-bg-surface rounded-[10px] p-3">
        <div className="text-xs text-text-muted font-medium uppercase tracking-wider mb-1">Battery</div>
        <div className="text-sm font-mono text-text-primary leading-relaxed">
          <div>{telemetry.voltage.toFixed(1)}V | {telemetry.current.toFixed(1)}A</div>
          <div className="mt-1 flex items-center gap-1">
            <span className="text-accent-400 text-sm font-mono">
              {'█'.repeat(batteryBars)}{'░'.repeat(10 - batteryBars)}
            </span>
            <span className="text-xs text-text-muted">{Math.round(telemetry.batteryPercent)}%</span>
          </div>
        </div>
      </div>

      {/* GPS */}
      <div className="bg-bg-surface rounded-[10px] p-3">
        <div className="text-xs text-text-muted font-medium uppercase tracking-wider mb-1">GPS</div>
        <div className="text-sm font-mono text-text-primary leading-relaxed">
          <div>{telemetry.gpsSats} sats | 3D Fix</div>
          <div>HDOP: 0.8</div>
        </div>
      </div>

      {/* Flight Mode */}
      <div className="mt-auto">
        <span className="inline-block px-3 py-1 rounded-lg bg-accent-400/20 text-accent-400 text-sm font-bold font-mono">
          {telemetry.flightMode}
        </span>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Rewrite HUD.tsx**

Replace entire contents of `studio/src/components/flight/HUD.tsx`:

```tsx
"use client";

import { useState, useEffect } from "react";
import type { Telemetry } from "@/types/drone";

export default function HUD({ telemetry }: { telemetry: Telemetry }) {
  const [roll, setRoll] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setRoll(Math.sin(Date.now() / 2000) * 2);
    }, 50);
    return () => clearInterval(interval);
  }, []);

  const altitudeTicks = [4040, 4035, 4030, 4025, 4020];
  const speedTicks = [20, 15, 10, 5, 0];
  const headings = [
    { label: "N", deg: 0 }, { label: "E", deg: 90 },
    { label: "S", deg: 180 }, { label: "W", deg: 270 },
  ];

  return (
    <div className="flex-1 min-h-[400px] m-3 bg-bg-void rounded-[10px] border border-border-subtle relative overflow-hidden grid-pattern">
      {/* Horizon */}
      <div
        className="absolute inset-0 flex items-center justify-center"
        style={{ transform: `rotate(${roll}deg)` }}
      >
        <div className="absolute inset-0 bg-accent-400/5" style={{ clipPath: "polygon(0 0, 100% 0, 100% 50%, 0 50%)" }} />
        <div className="absolute inset-0 bg-warning/5" style={{ clipPath: "polygon(0 50%, 100% 50%, 100% 100%, 0 100%)" }} />
        <div className="absolute left-0 right-0 h-px bg-text-muted/40 z-10" style={{ top: "50%" }} />
      </div>

      {/* Center Crosshair */}
      <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
        <div className="relative w-12 h-12">
          <div className="absolute top-1/2 left-0 right-0 h-px bg-accent-400/60" />
          <div className="absolute left-1/2 top-0 bottom-0 w-px bg-accent-400/60" />
          <div className="absolute top-1/2 left-1/2 w-2 h-2 -translate-x-1/2 -translate-y-1/2 border border-accent-400/60 rounded-full" />
        </div>
      </div>

      {/* Data Readout */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20">
        <div className="text-lg font-bold font-mono text-accent-400 tracking-wider glow-text">
          ALT {Math.round(telemetry.altitude)}m&nbsp;&nbsp;&nbsp;SPD {telemetry.speed.toFixed(1)}&nbsp;&nbsp;&nbsp;HDG 273
        </div>
      </div>

      {/* Compass Labels */}
      <div className="absolute top-12 left-1/2 -translate-x-1/2 z-20 flex gap-8">
        {headings.map((h) => (
          <span key={h.label} className="text-xs font-mono text-text-muted">{h.label}</span>
        ))}
      </div>
      <div className="absolute top-[58px] left-1/2 -translate-x-1/2 z-20">
        <span className="text-accent-400 text-[10px]">▲</span>
      </div>

      {/* Altitude Ladder (right) */}
      <div className="absolute right-4 top-1/2 -translate-y-1/2 z-20 flex flex-col gap-3">
        {altitudeTicks.map((alt) => {
          const isCurrent = Math.abs(alt - Math.round(telemetry.altitude)) < 3;
          return (
            <div key={alt} className="flex items-center gap-2 justify-end">
              <span className={`text-xs font-mono ${isCurrent ? "text-accent-400 font-bold glow-text" : "text-text-muted"}`}>
                {alt}
              </span>
              <div className={`w-4 h-px ${isCurrent ? "bg-accent-400" : "bg-text-muted/40"}`} />
            </div>
          );
        })}
      </div>

      {/* Speed Ladder (left) */}
      <div className="absolute left-4 top-1/2 -translate-y-1/2 z-20 flex flex-col gap-3">
        {speedTicks.map((spd) => {
          const isCurrent = Math.abs(spd - Math.round(telemetry.speed)) < 2;
          return (
            <div key={spd} className="flex items-center gap-2">
              <div className={`w-4 h-px ${isCurrent ? "bg-accent-400" : "bg-text-muted/40"}`} />
              <span className={`text-xs font-mono ${isCurrent ? "text-accent-400 font-bold glow-text" : "text-text-muted"}`}>
                {spd}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Rewrite AgentLog.tsx**

Replace entire contents of `studio/src/components/flight/AgentLog.tsx`:

```tsx
"use client";

import { useEffect, useRef } from "react";
import type { LogEntry } from "@/types/drone";

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-US", { hour12: false });
}

const levelStyles: Record<LogEntry["level"], string> = {
  INFO: "bg-accent-400/20 text-accent-400",
  WARN: "bg-warning/20 text-warning",
  ERROR: "bg-error/20 text-error",
};

export default function AgentLog({ logs }: { logs: LogEntry[] }) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs.length]);

  return (
    <div className="w-[300px] border-l border-border-subtle bg-bg-void/50 flex flex-col">
      <div className="px-3 py-2 border-b border-border-subtle flex items-center justify-between">
        <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Agent Reasoning</span>
        <span className="text-xs text-text-muted bg-bg-elevated px-1.5 py-0.5 rounded font-mono">{logs.length}</span>
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-2" style={{ maxHeight: "calc(100vh - 250px)" }}>
        {logs.map((log) => (
          <div key={log.id} className="text-xs leading-relaxed animate-fade-in">
            <div className="flex items-center gap-1.5 mb-0.5">
              <span className="text-text-muted font-mono">{formatTime(log.timestamp)}</span>
              <span className={`px-1 py-0.5 rounded text-[10px] font-semibold ${levelStyles[log.level]}`}>
                {log.level}
              </span>
            </div>
            <p className="text-text-secondary font-mono text-[11px] pl-[52px]">{log.message}</p>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Rewrite EmergencyControls.tsx**

Replace entire contents of `studio/src/components/flight/EmergencyControls.tsx`:

```tsx
"use client";

interface Props {
  onEmergency: (action: string) => void;
  isConnected: boolean;
}

export default function EmergencyControls({ onEmergency, isConnected }: Props) {
  return (
    <div className="flex items-center justify-between px-4 py-2 border-t border-border-subtle bg-bg-void/80">
      <div className="flex items-center gap-3">
        <button
          onClick={() => onEmergency("EMERGENCY LAND")}
          className="bg-error hover:brightness-110 text-white font-bold px-8 py-3 rounded-xl text-sm transition-all duration-200"
        >
          EMERGENCY LAND
        </button>
        <button
          onClick={() => onEmergency("RETURN TO LAUNCH")}
          className="bg-warning/80 hover:brightness-110 text-white px-6 py-3 rounded-xl text-sm font-medium transition-all duration-200"
        >
          RETURN TO LAUNCH
        </button>
        <button
          onClick={() => onEmergency("HOLD POSITION")}
          className="bg-warning/60 hover:brightness-110 text-white px-6 py-3 rounded-xl text-sm font-medium transition-all duration-200"
        >
          HOLD POSITION
        </button>
      </div>
      <div className="flex items-center gap-2">
        <span className={`w-2 h-2 rounded-full ${isConnected ? "bg-success animate-pulse" : "bg-error"}`} />
        <span className="text-xs text-text-muted">{isConnected ? "Connected" : "Disconnected"}</span>
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Rewrite FlightDashboard.tsx**

Replace entire contents of `studio/src/components/flight/FlightDashboard.tsx`:

```tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import type { Telemetry, LogEntry } from "@/types/drone";
import { mockTelemetry } from "@/lib/mock-data";
import TelemetryPanel from "./TelemetryPanel";
import HUD from "./HUD";
import AgentLog from "./AgentLog";
import EmergencyControls from "./EmergencyControls";

function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

const newLogMessages = [
  "Wind reading: 6.2 m/s from 315 - within acceptable range.",
  "LiDAR scan line 247/1024 complete.",
  "Telemetry downlink stable. Packet loss: 0.3%.",
  "Battery cell voltage: 3.73 / 3.74 / 3.72 / 3.74 / 3.73 / 3.75 V.",
  "Calculating remaining flight time: 18.4 min at current draw.",
  "Orbit waypoint received. Adjusting course 12 starboard.",
  "Camera gimbal stable. Pitch: -45. Roll: 0.2.",
  "RF interference detected on 2.4 GHz. Hopping to 5.8 GHz.",
  "Geofence boundary at 500m. Current distance: 347m.",
  "Memory buffer at 68%. Flushing to SD card.",
];

const logLevels: LogEntry["level"][] = [
  "INFO", "INFO", "INFO", "WARN", "INFO",
  "INFO", "ERROR", "INFO", "INFO", "INFO",
];

const messages: string[] = [
  "System initialized. Cerebrum online.",
  "Mission plan loaded: Open Pit Survey - Tajo Norte",
  "Pre-flight checks passed. All systems nominal.",
  "Wind 8.5 m/s from NW - above optimal. Adjusting heading.",
  "Arming motors.",
  "Takeoff initiated. Target altitude: 50m AGL.",
  "Altitude 50m reached. Transitioning to survey pattern.",
  "Beginning grid survey at 100m spacing.",
  "Thermal anomaly detected at Sector 3. Logging coordinates.",
  "45% of survey area complete.",
  "Battery at 72%. Adjusting speed to optimize coverage.",
  "78% of survey area complete.",
  "Grid survey complete. Transitioning to inspection pass.",
  "High-res capture of anomaly area complete.",
  "Mission objectives met. Initiating RTL.",
  "Approaching landing zone. Descending.",
  "Landed. Disarming motors.",
  "Mission complete. Writing telemetry to episodic memory.",
];

const initialLogs: LogEntry[] = messages.map((msg, i) => {
  const h = 9;
  const m = 47 + Math.floor(i * 1.1);
  const s = Math.round((i * 1.1 - Math.floor(i * 1.1)) * 60);
  const minutes = m % 60;
  const hours = h + Math.floor(m / 60);
  return {
    id: `init-log-${i + 1}`,
    timestamp: `2026-06-21T${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}Z`,
    level: i === 3 || i === 10 ? "WARN" : "INFO",
    message: msg,
  };
});

export default function FlightDashboard() {
  const [telemetry, setTelemetry] = useState<Telemetry>({ ...mockTelemetry });
  const [logs, setLogs] = useState<LogEntry[]>(initialLogs);
  const [isConnected] = useState(true);
  const [flightTime, setFlightTime] = useState(1247);

  useEffect(() => {
    const telemetryInterval = setInterval(() => {
      setTelemetry((prev) => ({
        ...prev,
        altitude: 4020 + Math.random() * 15,
        speed: 11 + Math.random() * 3,
        voltage: 22.2 + Math.random() * 0.4,
        current: 7.5 + Math.random() * 1.5,
        batteryPercent: Math.max(0, prev.batteryPercent - 0.1),
        gpsSats: Math.floor(12 + Math.random() * 4),
      }));
    }, 2000);

    const logInterval = setInterval(() => {
      const idx = Math.floor(Math.random() * newLogMessages.length);
      const now = new Date();
      const entry: LogEntry = {
        id: `log-auto-${Date.now()}`,
        timestamp: now.toISOString(),
        level: logLevels[idx],
        message: newLogMessages[idx],
      };
      setLogs((prev) => [...prev, entry]);
    }, 8000);

    const timeInterval = setInterval(() => {
      setFlightTime((prev) => prev + 1);
    }, 1000);

    return () => {
      clearInterval(telemetryInterval);
      clearInterval(logInterval);
      clearInterval(timeInterval);
    };
  }, []);

  const handleEmergency = useCallback((action: string) => {
    const now = new Date().toISOString();
    const entry: LogEntry = {
      id: `log-emergency-${Date.now()}`,
      timestamp: now,
      level: "WARN",
      message: `Emergency action triggered: ${action}`,
    };
    setLogs((prev) => [...prev, entry]);
  }, []);

  return (
    <div className="flex flex-col h-[calc(100vh-52px)] bg-bg-primary">
      {/* Top Bar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border-subtle bg-bg-void/50">
        <div className="flex items-center gap-3">
          <h2 className="text-sm font-semibold text-text-primary">Open Pit Survey - Tajo Norte</h2>
          <span className="text-xs text-accent-400 font-mono glow-text">{formatTime(flightTime)}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${isConnected ? "bg-success animate-pulse" : "bg-error"}`} />
          <span className="text-xs text-text-muted">{isConnected ? "Connected" : "Disconnected"}</span>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        <TelemetryPanel telemetry={telemetry} />
        <HUD telemetry={telemetry} />
        <AgentLog logs={logs} />
      </div>

      {/* Emergency Controls */}
      <EmergencyControls onEmergency={handleEmergency} isConnected={isConnected} />
    </div>
  );
}
```

- [ ] **Step 6: Verify flight page compiles**

```bash
cd /home/dreamcoder08/Documents/PROYECTOS/arkelythex/ventures/andino-drone-lab/studio
bun next build 2>&1 | tail -5
```

Expected: Build completes without errors

- [ ] **Step 7: Commit**

```bash
cd /home/dreamcoder08/Documents/PROYECTOS/arkelythex/ventures/andino-drone-lab
git add studio/src/components/flight/
git commit -m "feat(studio): redesign Flight Dashboard with Command Center HUD"
```

---

## Task 9: Final Verification and Cleanup

**Files:**
- Verify: All modified files

**Interfaces:**
- Consumes: All previous tasks
- Produces: Fully working redesigned Studio app

- [ ] **Step 1: Full build verification**

```bash
cd /home/dreamcoder08/Documents/PROYECTOS/arkelythex/ventures/andino-drone-lab/studio
bun next build 2>&1 | tail -10
```

Expected: Build completes successfully with no errors

- [ ] **Step 2: Type check**

```bash
cd /home/dreamcoder08/Documents/PROYECTOS/arkelythex/ventures/andino-drone-lab/studio
bun tsc --noEmit 2>&1 | tail -5
```

Expected: No type errors

- [ ] **Step 3: Start dev server and verify**

```bash
cd /home/dreamcoder08/Documents/PROYECTOS/arkelythex/ventures/andino-drone-lab/studio
bun next dev &
sleep 5
curl -s http://localhost:3000 | head -20
```

Expected: HTML returned with page content

- [ ] **Step 4: Final commit**

```bash
cd /home/dreamcoder08/Documents/PROYECTOS/arkelythex/ventures/andino-drone-lab
git add -A
git commit -m "chore(studio): verify and cleanup after UI redesign"
```

---

## Implementation Order Summary

| Task | Description | Dependencies |
|------|-------------|--------------|
| 1 | Install fonts and dependencies | None |
| 2 | Design tokens in globals.css | Task 1 |
| 3 | Shared UI components | Task 2 |
| 4 | Layout and header | Tasks 1, 2 |
| 5 | Home dashboard | Tasks 2, 3 |
| 6 | Agent chat | Tasks 2, 3 |
| 7 | Design mode | Tasks 2, 3 |
| 8 | Flight dashboard | Tasks 2, 3 |
| 9 | Final verification | All tasks |

**Estimated time:** 45-60 minutes for full implementation
