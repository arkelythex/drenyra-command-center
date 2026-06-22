/**
 * @fileoverview Tool Permissions settings page.
 *
 * Lists all `ai_tool_permissions` entries in a table with inline effect
 * changes, create dialog, and delete confirmation.
 */

import { Plus, ShieldCheck, Trash2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { SurfaceCard } from "@/components/ui/SurfaceCard";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import type { ToolPermission } from "../api/tool-permissions.api";
import { SettingsSection } from "../components/SettingsPrimitives";
import { SettingsShell } from "../components/SettingsShell";
import {
	useCreateToolPermission,
	useDeleteToolPermission,
	useToolPermissions,
	useUpdateToolPermission,
} from "../hooks/useToolPermissions";
import { ToolPermissionFormDialog } from "./ToolPermissionFormDialog";

// ─── Effect Badge ─────────────────────────────────────────────────────────────

function EffectBadge({ effect }: { effect: ToolPermission["effect"] }) {
	const styles: Record<string, string> = {
		ALLOW:
			"bg-[var(--color-success)]/10 text-[var(--color-success)] border-[var(--color-success)]/20",
		DENY: "bg-[var(--color-danger)]/10 text-[var(--color-danger)] border-[var(--color-danger)]/20",
		REQUIRE_APPROVAL:
			"bg-[var(--color-warning)]/10 text-[var(--color-warning)] border-[var(--color-warning)]/20",
	};

	const labels: Record<string, string> = {
		ALLOW: "Allow",
		DENY: "Deny",
		REQUIRE_APPROVAL: "Require Approval",
	};

	return (
		<span
			className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${styles[effect] ?? styles.REQUIRE_APPROVAL}`}
		>
			{labels[effect] ?? effect}
		</span>
	);
}

// ─── Single Row ───────────────────────────────────────────────────────────────

function PermissionRow({
	permission,
	onUpdate,
	onDelete,
}: {
	permission: ToolPermission;
	onUpdate: (id: string, effect: ToolPermission["effect"]) => void;
	onDelete: (id: string) => void;
}) {
	const [updating, setUpdating] = useState(false);

	const handleEffectChange = (effect: ToolPermission["effect"]) => {
		setUpdating(true);
		onUpdate(permission.id, effect);
		// The query invalidation will refetch; we just optimistically update the UI
		setTimeout(() => setUpdating(false), 300);
	};

	return (
		<div className="flex items-center justify-between gap-4 px-5 py-3.5 transition-colors hover:bg-[var(--surface-2)]/30">
			{/* Tool name */}
			<div className="flex-1 min-w-0">
				<span className="font-mono text-sm font-medium text-[var(--text-primary)]">
					{permission.toolName}
				</span>
			</div>

			{/* Effect */}
			<div className="flex items-center gap-2">
				<EffectBadge effect={permission.effect} />

				<Select
					value={permission.effect}
					onValueChange={handleEffectChange}
					disabled={updating}
				>
					<SelectTrigger className="h-8 w-32 border-[var(--border-subtle)]">
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="ALLOW">Allow</SelectItem>
						<SelectItem value="DENY">Deny</SelectItem>
						<SelectItem value="REQUIRE_APPROVAL">Require Approval</SelectItem>
					</SelectContent>
				</Select>
			</div>

			{/* Delete */}
			<Tooltip>
				<TooltipTrigger asChild>
					<button
						type="button"
						onClick={() => onDelete(permission.id)}
						className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--text-muted)] transition-colors hover:bg-[var(--color-danger)]/10 hover:text-[var(--color-danger)]"
						aria-label={`Eliminar permiso para ${permission.toolName}`}
					>
						<Trash2 size={14} strokeWidth={2} />
					</button>
				</TooltipTrigger>
				<TooltipContent>Eliminar permiso</TooltipContent>
			</Tooltip>
		</div>
	);
}

// ─── Main Component ───────────────────────────────────────────────────────────

export const ToolPermissionsSettings = () => {
	const { data: permissions, isLoading, isError } = useToolPermissions();
	const createMutation = useCreateToolPermission();
	const updateMutation = useUpdateToolPermission();
	const deleteMutation = useDeleteToolPermission();

	const [dialogOpen, setDialogOpen] = useState(false);
	const [editingPermission, setEditingPermission] =
		useState<ToolPermission | null>(null);

	// ── Handlers ───────────────────────────────────────────────────────────

	const handleSave = (data: unknown) => {
		if (editingPermission) {
			updateMutation.mutate(
				{
					id: editingPermission.id,
					data: data as Parameters<typeof updateMutation.mutate>[0]["data"],
				},
				{ onSettled: () => setDialogOpen(false) },
			);
		} else {
			createMutation.mutate(
				data as Parameters<typeof createMutation.mutate>[0],
				{
					onSettled: () => setDialogOpen(false),
				},
			);
		}
	};

	const handleUpdate = (id: string, effect: ToolPermission["effect"]) => {
		updateMutation.mutate({ id, data: { effect } });
	};

	const handleDelete = (id: string) => {
		if (window.confirm("¿Eliminar este permiso definitivamente?")) {
			deleteMutation.mutate(id);
		}
	};

	// ── Render ─────────────────────────────────────────────────────────────

	return (
		<SettingsShell
			title="Permisos de Herramientas"
			description="Controlá qué herramientas requieren aprobación, cuáles están bloqueadas y cuáles pueden ejecutarse libremente."
			icon={ShieldCheck}
			actions={
				<Button
					onClick={() => {
						setEditingPermission(null);
						setDialogOpen(true);
					}}
				>
					<Plus size={16} strokeWidth={2} className="mr-1.5" />
					Nuevo permiso
				</Button>
			}
		>
			<SettingsSection title="Permisos configurados" className="max-w-3xl">
				<SurfaceCard
					variant="outlined"
					padding="none"
					className="divide-y divide-[var(--border-subtle)]"
				>
					{/* Header */}
					<div className="flex items-center justify-between gap-4 px-5 py-2.5">
						<span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
							Herramienta
						</span>
						<span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
							Política
						</span>
					</div>

					{/* Body */}
					{isLoading && (
						<div className="flex items-center justify-center py-12">
							<span className="text-sm text-[var(--text-secondary)]">
								Cargando permisos…
							</span>
						</div>
					)}

					{isError && (
						<div className="flex items-center justify-center py-12">
							<span className="text-sm text-[var(--color-danger)]">
								Error al cargar permisos
							</span>
						</div>
					)}

					{!isLoading &&
						!isError &&
						(!permissions || permissions.length === 0) && (
							<div className="flex flex-col items-center justify-center gap-2 py-12">
								<ShieldCheck
									size={32}
									strokeWidth={1.5}
									className="text-[var(--text-muted)]"
								/>
								<span className="text-sm text-[var(--text-secondary)]">
									No hay permisos configurados.
								</span>
								<Button
									variant="ghost"
									size="sm"
									onClick={() => {
										setEditingPermission(null);
										setDialogOpen(true);
									}}
								>
									<Plus size={14} className="mr-1" />
									Crear el primero
								</Button>
							</div>
						)}

					{!isLoading &&
						!isError &&
						permissions &&
						permissions.length > 0 &&
						permissions.map((perm) => (
							<PermissionRow
								key={perm.id}
								permission={perm}
								onUpdate={handleUpdate}
								onDelete={handleDelete}
							/>
						))}
				</SurfaceCard>

				<p className="mt-3 text-xs text-[var(--text-tertiary)]">
					Los cambios surten efecto inmediatamente en el PermissionService al
					recargar.
				</p>
			</SettingsSection>

			{/* Create/Edit Dialog */}
			<ToolPermissionFormDialog
				open={dialogOpen}
				onOpenChange={setDialogOpen}
				permission={editingPermission}
				onSave={handleSave}
				isSaving={createMutation.isPending || updateMutation.isPending}
			/>
		</SettingsShell>
	);
};
