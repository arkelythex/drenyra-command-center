/**
 * OnboardingTour — Tour step definitions
 */
import type { TourStep } from "./OnboardingTour.types";

export const TOUR_STEPS: TourStep[] = [
	{
		targetSelector: "[data-onboarding='chat']",
		title: "Bienvenido al Command Center Fiscal",
		description:
			"Este es el centro de comando de Drenyra. Acá interactuás con agentes de IA para tus tareas fiscales: revisión de CPE, SIRE, conciliaciones y más. Todo en un solo lugar, en vivo.",
		placement: "bottom",
	},
	{
		targetSelector: "[data-onboarding='sidebar']",
		title: "Tus Casos Fiscales",
		description:
			"Acá ves y gestionás todos tus casos fiscales activos. Seleccioná un caso para ver sus detalles, usá el botón + para crear uno nuevo, y cambiá de compañía con el selector superior.",
		placement: "right",
	},
	{
		targetSelector: "[data-onboarding='input']",
		title: "Chat con Agentes",
		description:
			"Escribí tus comandos acá y los agentes fiscales responden con streaming en vivo. Probá /compacto, /detalle o /rama para cambiar la vista al instante.",
		placement: "top",
	},
	{
		targetSelector: "[data-onboarding='right-panel']",
		title: "Artifacts y Aprobaciones",
		description:
			"Los resultados de los agentes aparecen acá como artifacts expandibles. Podés anclarlos, exportarlos y aprobar o rechazar propuestas directamente desde el panel.",
		placement: "left",
	},
	{
		targetSelector: "",
		title: "Comandos Rápidos",
		description:
			"Usá ⌘K para abrir la paleta de comandos, ⌘F para buscar en el historial, ⌘/ para ver todos los atajos. También podés escribir /comandos en el chat para ver la lista completa.",
		placement: "center",
	},
];
