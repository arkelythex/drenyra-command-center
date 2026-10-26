/**
 * @fileoverview Tool Permissions settings page.
 *
 * Lists all `ai_tool_permissions` entries in a table with inline effect
 * changes, create dialog, and delete confirmation.
 */

import { Plus, ShieldCheck, Trash2 } from "lucide-react";
import { useState } from "react";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { NativeSelect } from "@/components/ui/native-select";
import type {
	CreateToolPermissionDTO,
	ToolPermission,
	UpdateToolPermissionDTO,
} from "../api/tool-permissions.api";
import { SettingsSection } from "../components/SettingsPrimitives";
import { SettingsShell } from "../components/SettingsShell";
import {
	useCreateToolPermission,
	useDeleteToolPermission,
	useToolPermissions,
	useUpdateToolPermission,
} from "../hooks/useToolPermissions";
import { ToolPermissionFormDialog } from "./ToolPermissionFormDialog";

const EFFECT_LABEL: Record<ToolPermission["effect"], string> = {
	ALLOW: "Permitir",
	DENY: "Bloquear",
	REQUIRE_APPROVAL: "Requiere aprobación",
};

const EFFECT_TONE: Record<ToolPermission["effect"], string> = {
	ALLOW: "bg-success/10 text-success",
	DENY: "bg-destructive/10 text-destructive",
	REQUIRE_APPROVAL: "bg-warning/10 text-warning",
};

function EffectBadge({ effect }: { effect: ToolPermission["effect"] }) {
	return (
		<span
			className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${EFFECT_TONE[effect]}`}
		>
			{EFFECT_LABEL[effect]}
		</span>
	);
}

function PermissionRow({
	permission,
	onUpdate,
	onDelete,
}: {
	permission: ToolPermission;
	onUpdate: (id: string, effect: ToolPermission["effect"]) => Promise<void>;
	onDelete: (permission: ToolPermission) => void;
}) {
	const [updating, setUpdating] = useState(false);

	const handleEffectChange = async (effect: ToolPermission["effect"]) => {
		setUpdating(true);
		try {
			await onUpdate(permission.id, effect);
		} finally {
			setUpdating(false);
		}
	};

	return (
		<li className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
			<span className="min-w-0 flex-1 truncate font-mono text-sm">
				{permission.toolName}
			</span>
			<EffectBadge effect={permission.effect} />
			<div className="w-48">
				<NativeSelect
					aria-label={`Política para ${permission.toolName}`}
					disabled={updating}
					value={permission.effect}
					onChange={(event) =>
						void handleEffectChange(
							event.target.value as ToolPermission["effect"],
						)
					}
				>
					<option value="ALLOW">Permitir</option>
					<option value="DENY">Bloquear</option>
					<option value="REQUIRE_APPROVAL">Requiere aprobación</option>
				</NativeSelect>
			</div>
			<button
				type="button"
				onClick={() => onDelete(permission)}
				className="flex size-11 items-center justify-center rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
				aria-label={`Eliminar permiso para ${permission.toolName}`}
			>
				<Trash2 aria-hidden="true" size={16} />
			</button>
		</li>
	);
}

function DeletePermissionDialog({
	permission,
	onCancel,
	onConfirm,
}: {
	permission: ToolPermission | null;
	onCancel: () => void;
	onConfirm: (id: string) => void;
}) {
	return (
		<AlertDialog
			open={permission !== null}
			onOpenChange={(open) => !open && onCancel()}
		>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>¿Eliminar este permiso?</AlertDialogTitle>
					<AlertDialogDescription>
						{permission
							? `La herramienta ${permission.toolName} volverá a la política por defecto. Esta acción no se puede deshacer.`
							: ""}
					</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel className="h-11">Cancelar</AlertDialogCancel>
					<AlertDialogAction
						className="h-11 bg-destructive text-destructive-foreground hover:bg-destructive/90"
						onClick={() => permission && onConfirm(permission.id)}
					>
						Eliminar
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}

export const ToolPermissionsSettings = () => {
	const { data: permissions, isLoading } = useToolPermissions();
	const createMutation = useCreateToolPermission();
	const updateMutation = useUpdateToolPermission();
	const deleteMutation = useDeleteToolPermission();

	const [dialogOpen, setDialogOpen] = useState(false);
	const [editingPermission, setEditingPermission] =
		useState<ToolPermission | null>(null);
	const [pendingDelete, setPendingDelete] = useState<ToolPermission | null>(
		null,
	);
	const [operationError, setOperationError] = useState<string | null>(null);

	const openCreate = () => {
		setEditingPermission(null);
		setDialogOpen(true);
	};

	const handleSave = (
		data: CreateToolPermissionDTO | UpdateToolPermissionDTO,
	) => {
		setOperationError(null);
		if (editingPermission) {
			void updateMutation
				.mutateAsync({
					id: editingPermission.id,
					data: data as UpdateToolPermissionDTO,
				})
				.then(() => setDialogOpen(false))
				.catch(() => setOperationError("No se pudo actualizar el permiso."));
			return;
		}

		void createMutation
			.mutateAsync(data as CreateToolPermissionDTO)
			.then(() => setDialogOpen(false))
			.catch(() => setOperationError("No se pudo crear el permiso."));
	};

	const handleUpdate = async (id: string, effect: ToolPermission["effect"]) => {
		setOperationError(null);
		try {
			await updateMutation.mutateAsync({ id, data: { effect } });
		} catch (error) {
			setOperationError("No se pudo actualizar la política del permiso.");
			throw error;
		}
	};

	const handleDelete = (id: string) => {
		setPendingDelete(null);
		setOperationError(null);
		void deleteMutation
			.mutateAsync(id)
			.catch(() => setOperationError("No se pudo eliminar el permiso."));
	};

	const hasPermissions = !isLoading && permissions && permissions.length > 0;

	return (
		<SettingsShell
			title="Permisos de herramientas"
			description="Controla qué herramientas requieren aprobación, cuáles están bloqueadas y cuáles pueden ejecutarse libremente."
			icon={ShieldCheck}
			actions={
				<Button
					onClick={openCreate}
					className="h-11 bg-brand px-4 text-brand-foreground hover:bg-brand/90"
				>
					<Plus aria-hidden="true" size={16} className="mr-1.5" />
					Nuevo permiso
				</Button>
			}
		>
			<SettingsSection title="Permisos configurados">
				{isLoading && (
					<p className="px-4 py-8 text-center text-sm text-muted-foreground">
						Cargando permisos…
					</p>
				)}

				{operationError && (
					<p role="alert" className="px-4 py-3 text-sm text-destructive">
						{operationError}
					</p>
				)}

				{!isLoading && !hasPermissions && (
					<div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
						<p className="text-sm text-muted-foreground">
							No hay permisos configurados.
						</p>
						<Button variant="ghost" onClick={openCreate} className="h-11">
							Crear el primero
						</Button>
					</div>
				)}

				{hasPermissions && (
					<ul className="divide-y divide-border">
						{permissions.map((perm) => (
							<PermissionRow
								key={perm.id}
								permission={perm}
								onUpdate={handleUpdate}
								onDelete={setPendingDelete}
							/>
						))}
					</ul>
				)}
			</SettingsSection>

			<DeletePermissionDialog
				permission={pendingDelete}
				onCancel={() => setPendingDelete(null)}
				onConfirm={handleDelete}
			/>

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
