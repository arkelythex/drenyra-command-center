export const heroTrustCopy = {
	hero: {
		headline: "Infraestructura fiscal para operar sin fallar.",
		subhead:
			"Prevalidación, evidencia y revisión humana para cierre, SIRE y CPE en Perú.",
		ctaPrimary: "Explorar Drenyra",
		ctaPrimaryHref: "/drenyra",
		ctaSecondary: "API Docs",
		ctaSecondaryHref: "/api",
	},

	trust: {
		title:
			"Infraestructura fiscal de precisi\u00f3n, no software contable gen\u00e9rico",
		subtitle:
			"Declaras con evidencia, no con fe. Compliance operativo con trazabilidad estructurada para equipos que necesitan control, no promesas.",
		items: [
			"SUNAT",
			"SIRE / PLE",
			"CPE (UBL 2.1)",
			"Evidence-first",
			"Multi-RUC",
			"Trazabilidad",
			"Auditor\u00eda",
		] as const,
		trustLine:
			"Dise\u00f1ado para estudios contables peruanos que operan bajo los m\u00e1s altos est\u00e1ndares de rigor tributario.",
		authorityMetrics: {
			kicker: "Rigor operativo y precisi\u00f3n tributaria",
			disclaimer:
				"Capacidades de producto expresadas como áreas de control; el rendimiento final depende del volumen documental, la calidad de datos y la complejidad del RUC.",
			items: [
				{
					label: "Auditor\u00eda de precisi\u00f3n",
					value: "UBL",
					context: "Detecci\u00f3n de inconsistencias documentarias",
				},
				{
					label: "Tiempo SIRE",
					value: "RVIE/RCE",
					context: "Preparaci\u00f3n de registros para revisi\u00f3n",
				},
				{
					label: "Compliance",
					value: "2026",
					context: "Seguimiento normativo y reglas versionadas",
				},
				{
					label: "Integraci\u00f3n",
					value: "API/OSE",
					context: "Flujos t\u00e9cnicos con control operativo",
				},
			] as const,
			cta: { label: "Verificar capacidades 2026", href: "/sire" } as const,
		},
		proofCards: [
			{
				label: "Para qui\u00e9n",
				value: "Equipos bajo presi\u00f3n fiscal real",
				detail:
					"Cierre mensual, multi-RUC y volumen documental donde el tiempo y el error tienen costo directo.",
			},
			{
				label: "Modo de operaci\u00f3n",
				value: "Panel de riesgo + acci\u00f3n guiada + evidencia",
				detail:
					"La IA prioriza expedientes y el equipo decide con estados expl\u00edcitos y trazabilidad.",
			},
			{
				label: "Entrada sugerida",
				value: "SIRE + facturaci\u00f3n como wedge",
				detail:
					"Entramos por cumplimiento mensual y luego escalamos a m\u00f3dulos contables, anal\u00edtica y API.",
			},
		] as const,
	},
} as const;
