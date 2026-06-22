import { useMemo, useState } from "react";

export interface Integration {
	id: string;
	name: string;
	description: string;
	logo: string;
	category: string;
	status: "connected" | "available";
}

const INTEGRATIONS: Integration[] = [
	// === BANCOS PERÚ ===
	{
		id: "bcp",
		name: "BCP - Banco de Crédito",
		description: "Integración con Telecrédito y banca empresarial del BCP.",
		logo: "https://logo.clearbit.com/viabcp.com",
		category: "Banca",
		status: "available",
	},
	{
		id: "bbva-pe",
		name: "BBVA Perú",
		description:
			"APIs abiertas para pagos, transferencias y gestión de cuentas empresariales.",
		logo: "https://logo.clearbit.com/bbva.pe",
		category: "Banca",
		status: "available",
	},
	{
		id: "interbank",
		name: "Interbank",
		description: "Conexión con banca digital empresarial y cobros.",
		logo: "https://logo.clearbit.com/interbank.pe",
		category: "Banca",
		status: "available",
	},
	{
		id: "scotiabank-pe",
		name: "Scotiabank Perú",
		description: "Integración con banca empresarial y telebanking.",
		logo: "https://logo.clearbit.com/scotiabank.com.pe",
		category: "Banca",
		status: "available",
	},
	{
		id: "banbif",
		name: "BanBif",
		description: "Banca empresarial y conexión con sistema financiero.",
		logo: "https://logo.clearbit.com/banbif.com.pe",
		category: "Banca",
		status: "available",
	},

	// === FACTURACIÓN ELECTRÓNICA - SUNAT ===
	{
		id: "sunat-ose",
		name: "SUNAT - OSE",
		description: "Emisión de comprobantes electrónicos validados ante SUNAT.",
		logo: "☀️",
		category: "Facturación",
		status: "available",
	},
	{
		id: "nubefact",
		name: "NubeFacT",
		description: "Operador de Servicios Electrónicos autorizado por SUNAT.",
		logo: "https://logo.clearbit.com/nubefact.com",
		category: "Facturación",
		status: "available",
	},
	{
		id: "factpro",
		name: "Factpro",
		description: "API de facturación electrónica autorizada por SUNAT.",
		logo: "https://logo.clearbit.com/factpro.la",
		category: "Facturación",
		status: "available",
	},
	{
		id: "apirest-pe",
		name: "APIREST.PE",
		description:
			"Consultas RUC, DNI RENIEC, tipo de cambio SUNAT y validación CPE.",
		logo: "https://logo.clearbit.com/apirest.pe",
		category: "Validación",
		status: "available",
	},
	{
		id: "aurora-api",
		name: "Aurora API",
		description: "Generación y anulación de comprobantes electrónicos.",
		logo: "https://logo.clearbit.com/aurora.net.pe",
		category: "Facturación",
		status: "available",
	},

	// === PASARELAS DE PAGO PERÚ ===
	{
		id: "culqi",
		name: "Culqi",
		description:
			"Pasarela de pagos con tarjetas, Yape, Plin y billeteras digitales.",
		logo: "https://logo.clearbit.com/culqi.com",
		category: "Pagos",
		status: "connected",
	},
	{
		id: "niubiz",
		name: "Niubiz",
		description: "Procesador de pagos con tarjetas Visa y Mastercard.",
		logo: "https://logo.clearbit.com/niubiz.com.pe",
		category: "Pagos",
		status: "available",
	},
	{
		id: "yape",
		name: "Yape",
		description: "Integración con la billetera digital #1 del Perú.",
		logo: "💜",
		category: "Pagos",
		status: "available",
	},
	{
		id: "plin",
		name: "Plin",
		description: "Pagos interbancarios instantáneos entre billeteras.",
		logo: "⚡",
		category: "Pagos",
		status: "available",
	},
	{
		id: "mercadopago-pe",
		name: "Mercado Pago Perú",
		description: "Checkout online, Point y pagos QR.",
		logo: "https://logo.clearbit.com/mercadopago.com.pe",
		category: "Pagos",
		status: "available",
	},
	{
		id: "izipay",
		name: "Izipay",
		description: "Adquirente de pagos con tarjetas y soluciones POS.",
		logo: "https://logo.clearbit.com/izipay.pe",
		category: "Pagos",
		status: "available",
	},
	{
		id: "ligopay",
		name: "LigoPay",
		description: "Infraestructura de pagos B2B e interoperabilidad.",
		logo: "https://logo.clearbit.com/ligopay.pe",
		category: "Pagos",
		status: "available",
	},
	{
		id: "pagoefectivo",
		name: "PagoEfectivo",
		description: "Pagos en efectivo a través de agentes y bodegas.",
		logo: "https://logo.clearbit.com/pagoefectivo.pe",
		category: "Pagos",
		status: "available",
	},

	// === MENSAJERÍA Y COMUNICACIONES ===
	{
		id: "whatsapp-api",
		name: "WhatsApp Business API",
		description:
			"Envío de notificaciones, facturas y atención al cliente masiva.",
		logo: "https://logo.clearbit.com/whatsapp.com",
		category: "Mensajería",
		status: "available",
	},
	{
		id: "telegram-bot",
		name: "Telegram Bot API",
		description:
			"Bots para notificaciones automatizadas y alertas empresariales.",
		logo: "https://logo.clearbit.com/telegram.org",
		category: "Mensajería",
		status: "available",
	},

	// === AGENTES IA Y AUTOMATIZACIÓN ===
	{
		id: "openclaw",
		name: "OpenClaw",
		description:
			"Agente IA autónomo para automatización de tareas complejas. Integración con 50+ plataformas.",
		logo: "https://logo.clearbit.com/openclawapi.org",
		category: "Inteligencia Artificial",
		status: "available",
	},

	// === GLOBALES (mantenemos algunas útiles) ===
	{
		id: "stripe",
		name: "Stripe",
		description: "Pagos internacionales y suscripciones globales.",
		logo: "https://logo.clearbit.com/stripe.com",
		category: "Pagos",
		status: "connected",
	},
];

export const useConnections = () => {
	const [activeView, setActiveView] = useState<"all" | "my">("all");
	const [searchQuery, setSearchQuery] = useState("");
	const normalizedQuery = searchQuery.trim().toLowerCase();

	const connectedCount = INTEGRATIONS.filter(
		(i) => i.status === "connected",
	).length;
	const totalCount = INTEGRATIONS.length;
	const availableCount = totalCount - connectedCount;

	const filteredIntegrations = useMemo(() => {
		return INTEGRATIONS.filter((item) => {
			const matchesSearch =
				normalizedQuery.length === 0 ||
				item.name.toLowerCase().includes(normalizedQuery) ||
				item.category.toLowerCase().includes(normalizedQuery) ||
				item.description.toLowerCase().includes(normalizedQuery);
			const matchesView = activeView === "all" || item.status === "connected";
			return matchesSearch && matchesView;
		});
	}, [activeView, normalizedQuery]);

	return {
		activeView,
		setActiveView,
		searchQuery,
		setSearchQuery,
		filteredIntegrations,
		connectedCount,
		totalCount,
		availableCount,
	};
};
