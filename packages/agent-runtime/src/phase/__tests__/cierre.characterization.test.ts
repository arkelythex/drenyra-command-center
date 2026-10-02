import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
	CierreAgent,
	type CierreAgentInput,
} from "../phase-agents/cierre.agent";

const cuentas: CierreAgentInput["cuentas"] = [
	{
		cuentaPCGE: "10",
		nombre: "Caja",
		saldoInicial: 1000,
		movimientosDebe: 500.5,
		movimientosHaber: 200.25,
	},
	{
		cuentaPCGE: "33",
		nombre: "Inmuebles",
		saldoInicial: 0,
		movimientosDebe: 100.004,
		movimientosHaber: 0,
	},
	{
		cuentaPCGE: "30",
		nombre: "Inversiones",
		saldoInicial: 50,
		movimientosDebe: 0,
		movimientosHaber: 50,
	},
	{
		cuentaPCGE: "60",
		nombre: "Compras",
		saldoInicial: 0,
		movimientosDebe: 0.1,
		movimientosHaber: 0.2,
	},
];

const ajustes: NonNullable<CierreAgentInput["ajustes"]> = [
	{
		id: "a1",
		cuentaPCGE: "10",
		tipo: "devengo",
		monto: 99.99,
		descripcion: "d",
	},
	{
		id: "a2",
		cuentaPCGE: "10",
		tipo: "provision",
		monto: -40.01,
		descripcion: "p",
	},
	{
		id: "a3",
		cuentaPCGE: "30",
		tipo: "revaluacion",
		monto: 0.005,
		descripcion: "r",
	},
	{
		id: "a4",
		cuentaPCGE: "99",
		tipo: "cierre",
		monto: 10,
		descripcion: "sin cuenta",
	},
	{
		id: "a5",
		cuentaPCGE: "60",
		tipo: "diferencia-cambio",
		monto: 0,
		descripcion: "cero",
	},
];

describe("CierreAgent (characterization)", () => {
	beforeEach(() => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date("2026-07-01T10:00:00.000Z"));
	});
	afterEach(() => vi.useRealTimers());

	const base = { ruc: "20123456789", periodo: "2026-06" };

	it.each([
		["without adjustments", { ...base, cuentas }],
		["with adjustments", { ...base, cuentas, ajustes }],
		["empty accounts", { ...base, cuentas: [], ajustes }],
	])("pins the full report: %s", async (_n, input) => {
		expect(
			await new CierreAgent().execute(input as CierreAgentInput),
		).toMatchSnapshot();
	});

	it("counts only class-3 accounts with a residual balance as pending", async () => {
		const r = await new CierreAgent().execute({ ...base, cuentas });
		expect(r.data.pendientes).toBe(1); // only 33 (100.004); 30 nets to 0
	});
});
