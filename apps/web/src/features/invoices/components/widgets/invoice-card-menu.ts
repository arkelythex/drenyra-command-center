import {
	CheckCircle2,
	Copy,
	Download,
	Edit,
	Eye,
	type LucideIcon,
	Mail,
	Route,
	Send,
	Trash2,
} from "lucide-react";

export interface MenuEntry {
	id: string;
	label: string;
	icon: LucideIcon;
	onSelect: () => void;
	disabled?: boolean;
	destructive?: boolean;
}

export interface InvoiceMenuInput {
	status: string;
	hasCdr: boolean;
	hasTicket: boolean;
	hasEmail: boolean;
	isSendingToOse: boolean;
	isLoadingLifecycle: boolean;
	isDownloadingPDF: boolean;
	on: {
		sendToOse: () => void;
		loadLifecycle: () => void;
		edit: () => void;
		openCdr: () => void;
		copyTicket: () => void;
		previewPDF: () => void;
		downloadPDF: () => void;
		email: () => void;
		remove: () => void;
	};
}

const pending = (busy: boolean, busyLabel: string, label: string) =>
	busy ? busyLabel : label;

function sendGroup({
	status,
	isSendingToOse,
	on,
}: InvoiceMenuInput): MenuEntry[] {
	if (status !== "draft" && status !== "sent") return [];
	const label = pending(
		isSendingToOse,
		"Enviando…",
		status === "draft" ? "Enviar a OSE" : "Reintentar OSE",
	);
	return [
		{
			id: "send",
			label,
			icon: Send,
			onSelect: on.sendToOse,
			disabled: isSendingToOse,
		},
	];
}

function lifecycleGroup({
	status,
	isLoadingLifecycle,
	on,
}: InvoiceMenuInput): MenuEntry[] {
	if (status === "draft") return [];
	const label = pending(
		isLoadingLifecycle,
		"Cargando…",
		"Ver trazabilidad OSE",
	);
	return [
		{
			id: "lifecycle",
			label,
			icon: Route,
			onSelect: on.loadLifecycle,
			disabled: isLoadingLifecycle,
		},
	];
}

function editGroup({ status, on }: InvoiceMenuInput): MenuEntry[] {
	return status === "draft"
		? [{ id: "edit", label: "Editar", icon: Edit, onSelect: on.edit }]
		: [];
}

function documentsGroup({
	status,
	hasCdr,
	hasTicket,
	on,
}: InvoiceMenuInput): MenuEntry[] {
	if (status === "draft") return [];
	const entries: MenuEntry[] = [];
	if (hasCdr)
		entries.push({
			id: "cdr",
			label: "Abrir CDR",
			icon: CheckCircle2,
			onSelect: on.openCdr,
		});
	if (hasTicket)
		entries.push({
			id: "ticket",
			label: "Copiar ticket",
			icon: Copy,
			onSelect: on.copyTicket,
		});
	entries.push({
		id: "preview",
		label: "Vista previa PDF",
		icon: Eye,
		onSelect: on.previewPDF,
	});
	return entries;
}

function downloadGroup({
	status,
	isDownloadingPDF,
	on,
}: InvoiceMenuInput): MenuEntry[] {
	if (status === "draft") return [];
	const label = pending(isDownloadingPDF, "Descargando…", "Descargar PDF");
	return [
		{
			id: "download",
			label,
			icon: Download,
			onSelect: on.downloadPDF,
			disabled: isDownloadingPDF,
		},
	];
}

function emailGroup({ status, hasEmail, on }: InvoiceMenuInput): MenuEntry[] {
	return status !== "draft" && hasEmail
		? [{ id: "email", label: "Enviar email", icon: Mail, onSelect: on.email }]
		: [];
}

function deleteGroup({ on }: InvoiceMenuInput): MenuEntry[] {
	return [
		{
			id: "delete",
			label: "Eliminar",
			icon: Trash2,
			onSelect: on.remove,
			destructive: true,
		},
	];
}

/** Actions available for an invoice in its current state, as groups the menu separates. */
export function buildInvoiceMenuGroups(input: InvoiceMenuInput): MenuEntry[][] {
	return [
		sendGroup,
		lifecycleGroup,
		editGroup,
		documentsGroup,
		downloadGroup,
		emailGroup,
		deleteGroup,
	]
		.map((build) => build(input))
		.filter((group) => group.length > 0);
}
