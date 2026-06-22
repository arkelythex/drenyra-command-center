import { FolderClosed, Truck, Users2 } from "lucide-react";
import type { NavigationItem } from "../types";

export const OPERACIONES_ITEMS: readonly NavigationItem[] = [
	{
		id: "customers",
		section: "operaciones",
		label: "Clientes",
		description: "Clientes y condiciones de cobro",
		to: "/operaciones/customers",
		icon: Users2,
		keywords: ["clientes", "crm", "ventas", "cobranza"],
		showInSidebar: false,
	},
	{
		id: "vendors",
		section: "operaciones",
		label: "Proveedores",
		description: "Proveedores y condiciones de pago",
		to: "/operaciones/vendors",
		icon: Truck,
		keywords: ["proveedores", "compras", "abastecimiento"],
		showInSidebar: false,
	},
	{
		id: "documents",
		section: "operaciones",
		label: "Comprobantes",
		description: "Archivo de XML, PDF y soportes",
		to: "/operaciones/documents",
		icon: FolderClosed,
		keywords: ["documentos", "archivo", "pdf", "xml"],
		showInSidebar: false,
	},
];
