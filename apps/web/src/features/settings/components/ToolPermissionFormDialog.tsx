/**
 * @fileoverview Create/edit dialog for a single tool permission entry.
 *
 * Renders a form inside a Dialog that lets the user pick a tool name and
 * an effect. Used both for creating new permissions and editing existing ones.
 */

import { useEffect, useState } from "react";
import { ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogDescription,
} from "@/components/ui/dialog";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type {
	PermissionEffect,
	ToolPermission,
	CreateToolPermissionDTO,
	UpdateToolPermissionDTO,
} from "../api/tool-permissions.api";

// ─── Known tool names ─────────────────────────────────────────────────────────

const KNOWN_TOOLS = [
	"crear_asiento",
	"registrar_gasto_voz",
	"crear_factura",
	"enviar_a_ose",
	"consultar_ruc",
	"generar_reporte",
	"analizar_documento",
];

const EFFECT_OPTIONS: { value: PermissionEffect; label: string; description: string }[] = [
	{ value: "ALLOW", label: "Allow", description: "Ejecutar sin aprobación" },
	{ value: "DENY", label: "Deny", description: "Bloquear ejecución" },
	{ value: "REQUIRE_APPROVAL", label: "Require Approval", description: "Requiere aprobación manual" },
];

// ─── Props ────────────────────────────────────────────────────────────────────

interface ToolPermissionFormDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	/** If provided, we're editing; if null, we're creating */
	permission?: ToolPermission | null;
	onSave: (data: CreateToolPermissionDTO | UpdateToolPermissionDTO) => void;
	isSaving: boolean;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ToolPermissionFormDialog({
	open,
	onOpenChange,
	permission,
	onSave,
	isSaving,
}: ToolPermissionFormDialogProps) {
	const isEditing = !!permission;

	const [toolName, setToolName] = useState("");
	const [customToolName, setCustomToolName] = useState("");
	const [effect, setEffect] = useState<PermissionEffect>("REQUIRE_APPROVAL");

	// Reset form when dialog opens
	useEffect(() => {
		if (open) {
			if (permission) {
				setToolName(KNOWN_TOOLS.includes(permission.toolName) ? permission.toolName : "__custom__");
				setCustomToolName(KNOWN_TOOLS.includes(permission.toolName) ? "" : permission.toolName);
				setEffect(permission.effect);
			} else {
				setToolName("");
				setCustomToolName("");
				setEffect("REQUIRE_APPROVAL");
			}
		}
	}, [open, permission]);

	const resolvedToolName = toolName === "__custom__" ? customToolName : toolName;
	const canSave = resolvedToolName.trim().length > 0;

	const handleSave = () => {
		if (!canSave) return;

		const base = { toolName: resolvedToolName.trim(), effect };

		if (isEditing && permission) {
			onSave(base as UpdateToolPermissionDTO);
		} else {
			onSave(base as CreateToolPermissionDTO);
		}
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-[480px]">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2">
						<ShieldCheck size={18} strokeWidth={1.75} />
						{isEditing ? "Editar permiso" : "Nuevo permiso"}
					</DialogTitle>
					<DialogDescription>
						{isEditing
							? "Cambiá el efecto del permiso o su nombre."
							: "Seleccioná una herramienta y definí su política de aprobación."}
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-5 py-2">
					{/* Tool name */}
					<div className="space-y-2">
						<Label htmlFor="tool-name">Herramienta</Label>
						<Select value={toolName} onValueChange={setToolName}>
							<SelectTrigger id="tool-name" className="w-full">
								<SelectValue placeholder="Seleccionar herramienta…" />
							</SelectTrigger>
							<SelectContent>
								{KNOWN_TOOLS.map((t) => (
									<SelectItem key={t} value={t}>
										<span className="font-mono text-sm">{t}</span>
									</SelectItem>
								))}
								<SelectItem value="__custom__">✏️ Otra…</SelectItem>
							</SelectContent>
						</Select>

						{toolName === "__custom__" && (
							<Input
								placeholder="Nombre de la herramienta (ej: crear_nota_credito)"
								value={customToolName}
								onChange={(e) => setCustomToolName(e.target.value)}
								className="mt-2"
							/>
						)}
					</div>

					{/* Effect */}
					<div className="space-y-2">
						<Label>Política</Label>
						<div className="space-y-2">
							{EFFECT_OPTIONS.map((opt) => (
								<label
									key={opt.value}
									className={`flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 transition-colors ${
										effect === opt.value
											? "border-[var(--color-primary)]/40 bg-[var(--color-primary)]/5"
											: "border-[var(--border-subtle)] hover:border-[var(--border-default)]"
									}`}
								>
									<input
										type="radio"
										name="effect"
										value={opt.value}
										checked={effect === opt.value}
										onChange={() => setEffect(opt.value)}
										className="h-4 w-4 accent-[var(--color-primary)]"
									/>
									<div className="flex flex-col">
										<span className="text-sm font-semibold text-[var(--text-primary)]">
											{opt.label}
										</span>
										<span className="text-xs text-[var(--text-secondary)]">
											{opt.description}
										</span>
									</div>
								</label>
							))}
						</div>
					</div>
				</div>

				{/* Actions */}
				<div className="flex items-center justify-end gap-3 pt-2">
					<Button
						variant="ghost"
						onClick={() => onOpenChange(false)}
						disabled={isSaving}
					>
						Cancelar
					</Button>
					<Button onClick={handleSave} disabled={!canSave || isSaving}>
						{isSaving ? "Guardando…" : isEditing ? "Guardar cambios" : "Crear permiso"}
					</Button>
				</div>
			</DialogContent>
		</Dialog>
	);
}
