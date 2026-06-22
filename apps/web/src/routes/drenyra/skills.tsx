import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Zap, Search, CheckCircle2, XCircle, Download, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSkillStore } from "@/features/agent-swarm/hooks/useSkillStore";
import type { SkillCategory } from "@/features/agent-swarm/types/skills.types";

const CATEGORIES: { key: SkillCategory | "all"; label: string }[] = [
  { key: "all", label: "Todas" },
  { key: "fiscal", label: "Fiscal" },
  { key: "finance", label: "Finanzas" },
  { key: "operations", label: "Operaciones" },
  { key: "audit", label: "Auditoría" },
];

const CATEGORY_COLORS: Record<SkillCategory, string> = {
  fiscal: "text-[var(--color-success)]",
  finance: "text-[var(--color-primary)]",
  operations: "text-[var(--color-steel)]",
  audit: "text-[var(--color-warning)]",
};

const CATEGORY_BG: Record<SkillCategory, string> = {
  fiscal: "bg-[var(--color-success)]/10",
  finance: "bg-[var(--color-primary)]/10",
  operations: "bg-[var(--color-steel)]/10",
  audit: "bg-[var(--color-warning)]/10",
};

const OUTPUT_ICON: Record<string, LucideIcon> = {
  table: CheckCircle2,
  chart: Zap,
  simulation: Download,
  report: CheckCircle2,
};

function SkillsPage() {
  const skills = useSkillStore((s) => s.skills);
  const installSkill = useSkillStore((s) => s.installSkill);
  const uninstallSkill = useSkillStore((s) => s.uninstallSkill);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<SkillCategory | "all">("all");

  const filtered = skills.filter((s) => {
    const matchesCategory = activeCategory === "all" || s.category === activeCategory;
    const matchesSearch =
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="flex h-full flex-col bg-[var(--surface-1)]">
      {/* Header */}
      <div className="border-b border-[var(--border-subtle)] px-8 py-8">
        <div className="mx-auto max-w-5xl space-y-4">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-[var(--color-primary)]/10 p-2 text-[var(--color-primary)]">
              <Zap size={22} strokeWidth={2.5} />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">
              Skills
            </h1>
          </div>
          <p className="max-w-2xl text-sm text-[var(--text-secondary)]">
            Capacidades agénticas que expanden lo que Drenyra puede hacer por vos.
            Instalá skills para habilitar nuevos flujos de trabajo fiscal y financiero.
          </p>

          <div className="flex items-center gap-4 pt-2">
            <div className="relative flex-1 max-w-md">
              <Search
                size={15}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
              />
              <input
                type="text"
                placeholder="Buscar skills..."
                className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-2)] py-2 pl-9 pr-4 text-sm text-[var(--text-primary)] outline-none placeholder:text-[var(--text-muted)] transition-colors focus:border-[var(--border-default)]"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                aria-label="Buscar skill"
              />
            </div>
            <div className="flex items-center gap-1.5 rounded-xl bg-[var(--surface-2)] border border-[var(--border-subtle)] px-3 py-1.5 text-xs font-medium text-[var(--text-secondary)]">
              <CheckCircle2 size={13} className="text-[var(--color-success)]" />
              {skills.filter((s) => s.isInstalled).length} Instaladas
            </div>
          </div>
        </div>
      </div>

      {/* Categories */}
      <div className="border-b border-[var(--border-subtle)] px-8 py-3">
        <div className="mx-auto flex max-w-5xl items-center gap-2">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.key}
              onClick={() => setActiveCategory(cat.key)}
              className={cn(
                "rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                activeCategory === cat.key
                  ? "bg-[var(--surface-3)] text-[var(--text-primary)]"
                  : "text-[var(--text-muted)] hover:bg-[var(--surface-2)] hover:text-[var(--text-secondary)]",
              )}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Skill Grid */}
      <div className="flex-1 overflow-y-auto p-8">
        <div className="mx-auto max-w-5xl">
          {filtered.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[var(--border-subtle)] px-8 py-16 text-center">
              <p className="text-sm text-[var(--text-muted)]">
                No se encontraron skills con ese filtro.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filtered.map((skill) => {
                const OutputIcon = OUTPUT_ICON[skill.outputArtifact] || Zap;
                const isInstalled = skill.isInstalled;

                return (
                  <div
                    key={skill.id}
                    className={cn(
                      "group flex flex-col rounded-2xl border p-6 transition-all duration-200",
                      isInstalled
                        ? "border-[var(--border-default)] bg-[var(--surface-2)]"
                        : "border-[var(--border-subtle)] bg-[var(--surface-1)] hover:border-[var(--border-default)]",
                    )}
                  >
                    {/* Header */}
                    <div className="mb-4 flex items-start justify-between">
                      <div
                        className={cn(
                          "rounded-2xl p-3 transition-colors",
                          isInstalled
                            ? CATEGORY_BG[skill.category]
                            : "bg-[var(--surface-2)]",
                        )}
                      >
                        <OutputIcon
                          size={20}
                          strokeWidth={2}
                          className={
                            isInstalled
                              ? CATEGORY_COLORS[skill.category]
                              : "text-[var(--text-muted)]"
                          }
                        />
                      </div>
                      <span
                        className={cn(
                          "rounded-md px-2 py-0.5 text-xs font-semibold uppercase tracking-wider",
                          isInstalled
                            ? "bg-[var(--color-primary)]/10 text-[var(--color-primary)]"
                            : "bg-[var(--surface-2)] text-[var(--text-muted)]",
                        )}
                      >
                        v{skill.version}
                      </span>
                    </div>

                    {/* Body */}
                    <div className="flex-1 space-y-2">
                      <h2 className="text-sm font-semibold text-[var(--text-primary)]">
                        {skill.name}
                      </h2>
                      <p className="text-xs leading-relaxed text-[var(--text-secondary)]">
                        {skill.description}
                      </p>
                      <div className="flex items-center gap-2 pt-1">
                        <span
                          className={cn(
                            "rounded-md px-1.5 py-0.5 text-xs font-medium uppercase tracking-wider",
                            CATEGORY_BG[skill.category],
                            CATEGORY_COLORS[skill.category],
                          )}
                        >
                          {skill.category}
                        </span>
                        <span className="text-xs text-[var(--text-muted)]">
                          {skill.outputArtifact}
                        </span>
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="mt-6 flex items-center justify-between border-t border-[var(--border-subtle)] pt-4">
                      <button
                        onClick={() =>
                          isInstalled ? uninstallSkill(skill.id) : installSkill(skill.id)
                        }
                        className={cn(
                          "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all",
                          isInstalled
                            ? "border border-[var(--border-subtle)] text-[var(--text-muted)] hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                            : "bg-[var(--color-primary)] text-white hover:opacity-90",
                        )}
                      >
                        {isInstalled ? (
                          <>
                            <XCircle size={12} />
                            Desinstalar
                          </>
                        ) : (
                          <>
                            <Download size={12} />
                            Instalar
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export const Route = createFileRoute("/drenyra/skills")({
  component: SkillsPage,
});
