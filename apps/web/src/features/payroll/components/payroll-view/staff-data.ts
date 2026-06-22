export interface StaffMember {
	id: string;
	name: string;
	role: string;
	salary: number;
	tax: number;
	performance: number;
	risk: "Bajo" | "Medio" | "Alto" | "High" | "Medium";
	status: "Activo" | "Licencia" | "Prueba";
}

export const STAFF: StaffMember[] = [
	{
		id: "EMP-001",
		name: "Luis Alberto Quispe",
		role: "Gerente de Operaciones",
		salary: 12500,
		tax: 980,
		performance: 98,
		risk: "Bajo",
		status: "Activo",
	},
	{
		id: "EMP-002",
		name: "Rosa Maria Flores",
		role: "Analista Senior",
		salary: 7200,
		tax: 540,
		performance: 92,
		risk: "Medio",
		status: "Activo",
	},
	{
		id: "EMP-003",
		name: "Javier Mendoza",
		role: "Jefe de Almacen",
		salary: 4800,
		tax: 150,
		performance: 88,
		risk: "Bajo",
		status: "Licencia",
	},
	{
		id: "EMP-004",
		name: "Sofia Ramos Vera",
		role: "Contadora Junior",
		salary: 3500,
		tax: 0,
		performance: 95,
		risk: "Bajo",
		status: "Activo",
	},
	{
		id: "EMP-005",
		name: "Diego Armando Lostaunau",
		role: "Desarrollador Fullstack",
		salary: 8500,
		tax: 680,
		performance: 78,
		risk: "Alto",
		status: "Prueba",
	},
];
