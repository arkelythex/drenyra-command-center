export interface AssetItem {
	id: string;
	name: string;
	cat: string;
	loc: string;
	value: number;
	life: number;
	status: "active" | "maintenance" | "disposed";
	health: number;
	prediction: string;
}

export const ASSETS: AssetItem[] = [
	{
		id: "ACT-2026-001",
		name: "Servidor Dell PowerEdge R750",
		cat: "Equipos de Computo (25%)",
		loc: "Sede Central - TI",
		value: 45000,
		life: 25,
		status: "active",
		health: 98,
		prediction: "Depreciacion Optima",
	},
	{
		id: "ACT-2026-002",
		name: "Inmueble Administrativo San Isidro",
		cat: "Edificaciones (5%)",
		loc: "Calle Las Camelias 780",
		value: 850000,
		life: 5,
		status: "active",
		health: 100,
		prediction: "Estable",
	},
	{
		id: "ACT-2025-089",
		name: "Camioneta Toyota Hilux 4x4",
		cat: "Unid. de Transporte (20%)",
		loc: "Operaciones Mina",
		value: 125000,
		life: 40,
		status: "active",
		health: 65,
		prediction: "Revisar Tasa de Uso",
	},
	{
		id: "ACT-2025-045",
		name: "Maquinaria de Produccion Industrial",
		cat: "Maquinaria y Equipo (10%)",
		loc: "Planta Lurin",
		value: 280000,
		life: 30,
		status: "active",
		health: 88,
		prediction: "Mantenimiento Pendiente",
	},
	{
		id: "ACT-2024-112",
		name: "Mobiliario Administrativo",
		cat: "Muebles y Enseres (10%)",
		loc: "Sede Central - Oficinas",
		value: 25000,
		life: 50,
		status: "active",
		health: 95,
		prediction: "Vida Util Estable",
	},
];
