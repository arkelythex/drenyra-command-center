export const COMMAND_CATEGORIES = [
	{
		id: "recent",
		label: "Recientes",
		commands: [],
	},
	{
		id: "navigation",
		label: "Navegación",
		commands: [
			{
				id: "go-inbox",
				label: "Ir al inicio",
				description: "Accounting Inbox",
				category: "navigation" as const,
				action: () => (window.location.href = "/"),
				keywords: ["inicio", "home", "inbox"],
			},
			{
				id: "go-close",
				label: "Cierre mensual",
				description: "Monthly close workflow",
				category: "navigation" as const,
				action: () => (window.location.href = "/cierre-mensual"),
				keywords: ["close", "cierre", "monthly"],
			},
			{
				id: "go-sire",
				label: "SIRE",
				description: "SUNAT electronic books",
				category: "navigation" as const,
				action: () => (window.location.href = "/sire-diff"),
				keywords: ["sire", "sunat", "libros"],
			},
		],
	},
	{
		id: "actions",
		label: "Acciones",
		commands: [
			{
				id: "new-thread",
				label: "Nuevo thread",
				description: "Start a new conversation",
				category: "action" as const,
				action: () => (window.location.href = "/threads/new"),
				keywords: ["nuevo", "thread", "chat"],
			},
			{
				id: "new-invoice",
				label: "Nueva factura",
				description: "Create an invoice",
				category: "action" as const,
				action: () => (window.location.href = "/invoices"),
				keywords: ["factura", "invoice", "crear"],
			},
		],
	},
];
