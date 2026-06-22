# 🎨 Agentic Components - Usage Examples

Comprehensive examples for all components in the Agentic library.

---

## 🔵 AgentPulse

### Basic Usage

```tsx
import { AgentPulse } from "@/components/agentic";

export function AgentStatusCard() {
  return (
    <div className="flex items-center gap-3">
      <AgentPulse state="processing" size="md" />
      <span>Processing invoice...</span>
    </div>
  );
}
```

### All States

```tsx
import { AgentPulse } from "@/components/agentic";

export function AgentStatesDemo() {
  return (
    <div className="grid grid-cols-5 gap-4">
      <AgentPulse state="idle" showLabel />
      <AgentPulse state="processing" showLabel />
      <AgentPulse state="active" showLabel />
      <AgentPulse state="error" showLabel />
      <AgentPulse state="success" showLabel />
    </div>
  );
}
```

### With Custom Intensity

```tsx
<AgentPulse
  state="processing"
  intensity={0.9}  // 0-1 (higher = faster animation)
  size="lg"
/>
```

---

## 🎯 ConfidenceBadge

### Basic Usage

```tsx
import { ConfidenceBadge } from "@/components/agentic";

export function ValidationResult({ score }: { score: number }) {
  return (
    <div className="flex items-center gap-2">
      <span>Confidence:</span>
      <ConfidenceBadge score={score} />
    </div>
  );
}
```

### With Label

```tsx
<ConfidenceBadge
  score={87}
  showLabel  // Shows "High Confidence"
  variant="glass"
/>
```

### Variants

```tsx
import { ConfidenceBadge } from "@/components/agentic";

export function BadgeVariantsDemo() {
  return (
    <div className="flex gap-2">
      <ConfidenceBadge score={75} variant="solid" />
      <ConfidenceBadge score={75} variant="glass" />
      <ConfidenceBadge score={75} variant="outline" />
    </div>
  );
}
```

### With Callback

```tsx
import { ConfidenceBadge } from "@/components/agentic";
import type { ConfidenceLevel } from "@/components/agentic";

export function TrackedBadge() {
  const handleScoreChange = (score: number, level: ConfidenceLevel) => {
    console.log(`Score changed to ${score}% (${level})`);
  };

  return (
    <ConfidenceBadge
      score={score}
      onScoreChange={handleScoreChange}
    />
  );
}
```

---

## 🔍 ConflictDiffView

### Basic JSON Comparison

```tsx
import { ConflictDiffView } from "@/components/agentic";

export function InvoiceComparison() {
  const originalInvoice = {
    total: 1000,
    igv: 180,
    currency: "PEN",
  };

  const correctedInvoice = {
    total: 1180,
    igv: 212.4,
    currency: "PEN",
  };

  return (
    <ConflictDiffView
      before={originalInvoice}
      after={correctedInvoice}
      labels={{
        before: "Original Invoice",
        after: "Corrected Invoice",
      }}
    />
  );
}
```

### With PDF Preview

```tsx
<ConflictDiffView
  before={originalData}
  after={correctedData}
  pdfUrl="/uploads/invoice-123.pdf"
  ocrBounds={[
    { x: 100, y: 200, width: 150, height: 30, confidence: 0.95 },
  ]}
/>
```

### Inline Comparison

```tsx
<ConflictDiffView
  before={before}
  after={after}
  sideBySide={false}  // Stack instead of side-by-side
  defaultExpanded  // Expand all diffs by default
/>
```

### With Click Handler

```tsx
import { ConflictDiffView } from "@/components/agentic";
import type { DiffResult } from "@/components/agentic";

export function InteractiveDiff() {
  const handleDiffClick = (diff: DiffResult) => {
    console.log(`Clicked diff at: ${diff.path.join(".")}`);
  };

  return (
    <ConflictDiffView
      before={before}
      after={after}
      onDiffClick={handleDiffClick}
    />
  );
}
```

---

## ⌘ CommandBar

### Basic Setup

```tsx
import { useState } from "react";
import { CommandBar } from "@/components/agentic";
import type { CommandAction } from "@/components/agentic";
import { FileText, Calculator, Database } from "lucide-react";

export function AgenticDashboard() {
  const [commandBarOpen, setCommandBarOpen] = useState(false);

  const actions: CommandAction[] = [
    {
      id: "reconcile",
      label: "Reconcile Transactions",
      description: "Match bank transactions with invoices",
      icon: Calculator,
      group: "Banking",
      keywords: ["bank", "match", "sync"],
      shortcut: "⌘R",
    },
    {
      id: "generate-report",
      label: "Generate Report",
      description: "Create financial report",
      icon: FileText,
      group: "Reports",
      keywords: ["pdf", "export", "financial"],
      shortcut: "⌘P",
    },
    {
      id: "backup-db",
      label: "Backup Database",
      description: "Create database backup",
      icon: Database,
      group: "System",
      keywords: ["backup", "export", "db"],
    },
  ];

  const handleExecute = async (action: CommandAction) => {
    console.log("Executing:", action.id);
    // Implement action logic here
  };

  return (
    <>
      <button
        onClick={() => setCommandBarOpen(true)}
        className="px-4 py-2 bg-primary text-primary-foreground rounded-lg"
      >
        Open Command Bar (⌘K)
      </button>

      <CommandBar
        actions={actions}
        open={commandBarOpen}
        onOpenChange={setCommandBarOpen}
        onExecute={handleExecute}
      />
    </>
  );
}
```

### Keyboard Shortcut (Global)

```tsx
import { useEffect, useState } from "react";
import { CommandBar } from "@/components/agentic";

export function App() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen(true);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <CommandBar
      actions={actions}
      open={open}
      onOpenChange={setOpen}
      onExecute={handleExecute}
    />
  );
}
```

### Disabled Actions

```tsx
const actions: CommandAction[] = [
  {
    id: "delete-all",
    label: "Delete All Data",
    description: "Permanently delete all data (admin only)",
    icon: Trash2,
    group: "Danger Zone",
    disabled: !isAdmin,  // Conditional disable
  },
];
```

---

## 🎨 Composition Examples

### Agent Monitoring Dashboard

```tsx
import {
  AgentPulse,
  ConfidenceBadge,
  CommandBar
} from "@/components/agentic";
import { GlassCard } from "@/components/ui/glass-card";

export function AgentMonitorDashboard() {
  return (
    <div className="grid grid-cols-3 gap-4">
      {/* Agent Status Cards */}
      {agents.map((agent) => (
        <GlassCard key={agent.id} className="p-4">
          <div className="flex items-center justify-between mb-3">
            <AgentPulse state={agent.state} size="sm" />
            <ConfidenceBadge score={agent.confidence} />
          </div>
          <h3 className="text-sm font-bold">{agent.name}</h3>
          <p className="text-xs text-muted-foreground">{agent.task}</p>
        </GlassCard>
      ))}
    </div>
  );
}
```

### Conflict Resolution UI

```tsx
import {
  ConflictDiffView,
  CommandBar,
  ConfidenceBadge
} from "@/components/agentic";

export function ConflictResolutionPage() {
  const [selectedAction, setSelectedAction] = useState<string | null>(null);

  const resolutionActions: CommandAction[] = [
    { id: "accept-left", label: "Accept Original", icon: ArrowLeft },
    { id: "accept-right", label: "Accept Modified", icon: ArrowRight },
    { id: "merge", label: "Merge Both", icon: Merge },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">Conflict Resolution</h2>
        <ConfidenceBadge score={conflictScore} showLabel />
      </div>

      <ConflictDiffView
        before={original}
        after={modified}
        sideBySide
      />

      <CommandBar
        actions={resolutionActions}
        open={showActions}
        onExecute={handleResolve}
      />
    </div>
  );
}
```

---

## 🔧 Custom Hooks

### useFuzzySearch

```tsx
import { useFuzzySearch } from "@/components/agentic";

export function SearchableList({ items }: { items: CommandAction[] }) {
  const [query, setQuery] = useState("");
  const filtered = useFuzzySearch(items, query, 0.4);

  return (
    <div>
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search..."
      />
      {filtered.map((item) => (
        <div key={item.id}>{item.label}</div>
      ))}
    </div>
  );
}
```

### useKeyboardNav

```tsx
import { useKeyboardNav } from "@/components/agentic";

export function CustomList() {
  const [selected, setSelected] = useState(0);

  useKeyboardNav({
    itemCount: items.length,
    selectedIndex: selected,
    onSelectionChange: setSelected,
    onExecute: () => handleSelect(items[selected]),
    onClose: () => setOpen(false),
  });

  return <div>{/* Your UI */}</div>;
}
```

---

## 📱 Responsive Design

All components are **mobile-first** and fully responsive:

```tsx
// Desktop: Side-by-side
// Mobile: Stacked
<ConflictDiffView
  before={before}
  after={after}
  sideBySide  // Automatically stacks on mobile
/>

// Command Bar adapts to screen size
<CommandBar
  actions={actions}
  className="max-w-2xl md:max-w-3xl lg:max-w-4xl"
/>
```

---

## ♿ Accessibility

All components follow WCAG 2.1 AA standards:

- **ARIA labels**: All interactive elements have descriptive labels
- **Keyboard navigation**: Full keyboard support
- **Reduced motion**: Respects `prefers-reduced-motion`
- **Screen readers**: Semantic HTML and live regions

```tsx
// Disable animations for users who prefer reduced motion
<AgentPulse state="processing" disableAnimation />

// ConfidenceBadge has automatic ARIA labels
<ConfidenceBadge score={87} />
// aria-label="Confidence: 87% - High Confidence"
```

---

## 🎯 Best Practices

1. **Memoize expensive calculations**:
   ```tsx
   const diffs = useMemo(
     () => computeDeepDiff(before, after),
     [before, after]
   );
   ```

2. **Use semantic HTML**:
   ```tsx
   // ✅ Good
   <button onClick={...}>

   // ❌ Bad
   <div onClick={...}>
   ```

3. **Provide meaningful labels**:
   ```tsx
   <AgentPulse state="processing" label="Validating SUNAT compliance" />
   ```

4. **Handle loading states**:
   ```tsx
   {isLoading ? (
     <AgentPulse state="processing" showLabel />
   ) : (
     <ConfidenceBadge score={result.confidence} />
   )}
   ```

---

**Documentación generada para ARKELYTHEX v2.0**
Última actualización: 2026-02-14
