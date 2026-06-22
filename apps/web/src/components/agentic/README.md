# 🤖 Agentic Components Library

> **Elite UI/UX components for AI agent supervision and monitoring**

## Philosophy

Following ARKELYTHEX's **Glass & Steel** design system:
- **Glassmorphism**: Subtle depth with backdrop-blur
- **Micro-interactions**: Spring physics animations (iOS-inspired)
- **Information Density**: Maximum data in minimal space
- **Accessibility First**: ARIA labels, keyboard nav, reduced motion support

---

## Architecture

```
components/agentic/
├── agent-pulse/          # Visual agent activity indicator
│   ├── agent-pulse.tsx   # Main component
│   ├── types.ts          # TypeScript interfaces
│   └── variants.ts       # Animation variants
│
├── confidence-badge/     # Dynamic confidence score display
│   ├── confidence-badge.tsx
│   ├── types.ts
│   └── utils.ts          # Score → color mapping
│
├── conflict-diff/        # JSON diff viewer + PDF OCR overlay
│   ├── conflict-diff-view.tsx
│   ├── json-diff.tsx     # JSON comparison engine
│   ├── pdf-preview.tsx   # PDF viewer with bounding boxes
│   ├── types.ts
│   └── utils.ts          # Diff algorithm
│
├── command-bar/          # Raycast/Linear-style command palette
│   ├── command-bar.tsx
│   ├── command-item.tsx
│   ├── command-group.tsx
│   ├── hooks/
│   │   ├── use-fuzzy-search.ts
│   │   └── use-keyboard-nav.ts
│   ├── types.ts
│   └── actions.ts        # Command registry
│
└── index.ts              # Barrel exports
```

---

## Design Tokens (Usage)

### Colors
```tsx
// Agent states
"bg-[rgba(var(--premium-success-rgb),0.15)] text-[var(--premium-success)]"  // Active/Healthy
"bg-amber-500/15 text-amber-600"      // Processing/Warning
"bg-red-500/15 text-red-600"          // Error/Conflict
"bg-[rgba(var(--premium-info-rgb),0.15)] text-[var(--premium-action-cyan)]"        // Idle/Info
```

### Glass Effects
```tsx
className="bg-glass-surface backdrop-blur-glass border-glass-border"
```

### Animations
```tsx
import { SPRING_PHYSICS } from "@/components/ui/motion-primitives"

<motion.div
  initial={{ opacity: 0, scale: 0.95 }}
  animate={{ opacity: 1, scale: 1 }}
  transition={{ type: "spring", ...SPRING_PHYSICS }}
/>
```

---

## Component Guidelines

### 1. **File Size Limits**
- Components: **< 200 lines**
- Hooks: **< 100 lines**
- Utils: **< 150 lines**

### 2. **TypeScript Strict**
- No `any` types
- Explicit return types for exports
- Branded types for IDs: `type AgentId = string & { __brand: "AgentId" }`

### 3. **Accessibility**
```tsx
// ✅ Good
<button
  aria-label="Agent status: active"
  role="status"
  aria-live="polite"
>
  <AgentPulse state="active" />
</button>

// ❌ Bad
<div onClick={...}>
  <AgentPulse state="active" />
</div>
```

### 4. **Performance**
```tsx
// ✅ Memoize expensive calculations
const diffResult = useMemo(
  () => computeDiff(prev, next),
  [prev, next]
);

// ✅ Lazy load heavy components
const PDFPreview = lazy(() => import("./pdf-preview"));
```

---

## Testing Requirements

### Unit Tests (Vitest)
- [ ] Component renders without errors
- [ ] Props are type-safe
- [ ] Variants render correctly
- [ ] Accessibility attributes present

### Visual Tests (Chromatic/Percy)
- [ ] Light/Dark mode
- [ ] Responsive breakpoints
- [ ] Animation states
- [ ] Hover/Focus/Active states

---

## Example Usage

### AgentPulse
```tsx
import { AgentPulse } from "@/components/agentic";

<AgentPulse
  state="processing"
  intensity={0.75}
  size="md"
/>
```

### ConfidenceBadge
```tsx
import { ConfidenceBadge } from "@/components/agentic";

<ConfidenceBadge
  score={87}
  showPercentage
  variant="glass"
/>
```

### ConflictDiffView
```tsx
import { ConflictDiffView } from "@/components/agentic";

<ConflictDiffView
  before={originalInvoice}
  after={correctedInvoice}
  pdfUrl="/uploads/invoice-123.pdf"
  ocrBounds={[{ x: 100, y: 200, w: 150, h: 30 }]}
/>
```

### Command Bar
```tsx
import { CommandBar } from "@/components/agentic";

<CommandBar
  actions={[
    { id: "reconcile", label: "Reconcile Transactions", icon: CheckCircle },
    { id: "audit", label: "Run Audit Trail", icon: Shield }
  ]}
  onExecute={(actionId) => console.log(actionId)}
/>
```

---

## References

- [Framer Motion Physics](https://www.framer.com/motion/)
- [Raycast Design System](https://developers.raycast.com/design)
- [Linear Command Palette](https://linear.app/docs/keyboard-shortcuts)
- [shadcn/ui Patterns](https://ui.shadcn.com)
