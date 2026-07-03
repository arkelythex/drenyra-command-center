import { useState, useCallback } from "react";
import { Clock3, Sparkles } from "lucide-react";
import { AutomationCard } from "./AutomationCard";
import { AutomationCreateWizard, type AutomationWizardData } from "./AutomationCreateWizard";
import { useAutomations, useCreateAutomation, useToggleAutomation, useRunAutomation } from "../hooks/useAutomations";
import { useSkills } from "@/features/skills";

export function AutomationsPage() {
	const { data, isLoading } = useAutomations();
	const { data: skillsData } = useSkills();
	const createMutation = useCreateAutomation();
	const toggleMutation = useToggleAutomation();
	const runMutation = useRunAutomation();
	const [wizardOpen, setWizardOpen] = useState(false);

	const automations = data?.data ?? [];

	const handleCreate = useCallback(
		(wizardData: AutomationWizardData) => {
			createMutation.mutate(
				{
					name: wizardData.name,
					description: wizardData.description || undefined,
					triggerType: wizardData.triggerType,
					triggerConfig: wizardData.triggerConfig,
					skillIds: wizardData.skillIds,
					autonomy: wizardData.autonomy,
				},
				{
					onSuccess: () => {
						setWizardOpen(false);
					},
				},
			);
		},
		[createMutation],
	);

	const handleToggle = useCallback(
		(id: string, active: boolean) => {
			toggleMutation.mutate({ id, active });
		},
		[toggleMutation],
	);

	const handleRun = useCallback(
		(id: string) => {
			runMutation.mutate(id);
		},
		[runMutation],
	);

	const handleSelect = useCallback(
		(_automation: any) => {
			// Future: open detail/inspector
		},
		[],
	);

	const availableSkills = (skillsData?.data ?? []).filter((s) => s.installed);

	return (
		<div className="flex h-full flex-col bg-[var(--surface-1)]">
			<header className="border-b border-[var(--border-subtle)] px-8 py-8">
				<div className="mx-auto max-w-5xl flex items-end justify-between gap-8">
					<div className="space-y-4">
						<div className="flex items-center gap-3">
							<div className="rounded-xl bg-[var(--color-warning)]/10 p-2 text-[var(--color-warning)]">
								<Clock3 size={22} strokeWidth={2.5} />
							</div>
							<h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">
								Automations
							</h1>
						</div>
						<p className="max-w-xl text-sm text-[var(--text-secondary)]">
							Gestioná las rutinas automáticas que ejecutan skills en background
							bajo tu supervisión.
						</p>
					</div>

					<button
						type="button"
						onClick={() => setWizardOpen(true)}
						className="flex items-center gap-2 rounded-2xl bg-[var(--text-primary)] px-6 py-2.5 text-sm font-bold text-[var(--surface-1)] shadow-lg transition-all hover:opacity-90 active:scale-95"
					>
						<Sparkles size={16} />
						Nueva Automatización
					</button>
				</div>
			</header>

			<main className="flex-1 overflow-y-auto p-8">
				<div className="mx-auto max-w-5xl space-y-6">
					{isLoading ? (
						<div className="flex items-center justify-center py-16">
							<div className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
								<div className="h-4 w-4 animate-spin rounded-full border-2 border-[var(--border-default)] border-t-[var(--color-primary)]" />
								Cargando automations...
							</div>
						</div>
					) : automations.length === 0 ? (
						<div className="rounded-2xl border border-dashed border-[var(--border-subtle)] px-8 py-16 text-center">
							<div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--surface-2)]">
								<Clock3 size={24} className="text-[var(--text-muted)]" />
							</div>
							<p className="text-sm font-medium text-[var(--text-primary)] mb-1">
								Todavía no hay automatizaciones
							</p>
							<p className="text-xs text-[var(--text-secondary)] mb-6">
								Creá tu primera automatización para ejecutar skills sin intervención manual.
							</p>
							<button
								type="button"
								onClick={() => setWizardOpen(true)}
								className="rounded-xl bg-[var(--color-primary)] px-5 py-2 text-sm font-bold text-white hover:opacity-90"
							>
								Crear automatización
							</button>
						</div>
					) : (
						automations.map((automation) => (
							<AutomationCard
								key={automation.id}
								automation={automation}
								onToggle={handleToggle}
								onRun={handleRun}
								onSelect={handleSelect}
								isLoading={toggleMutation.isPending}
							/>
						))
					)}
				</div>
			</main>

			<AutomationCreateWizard
				open={wizardOpen}
				onClose={() => setWizardOpen(false)}
				onCreate={handleCreate}
				availableSkills={availableSkills}
				isCreating={createMutation.isPending}
			/>
		</div>
	);
}
