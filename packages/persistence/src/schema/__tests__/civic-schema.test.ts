/**
 * Civic Schema — Structural Validation Tests
 *
 * Validates all civic Drizzle tables, columns, relations, and exports
 * are correctly defined.
 */
import { describe, expect, it } from "vitest";
import {
	auditTrails,
	auditTrailsRelations,
	elections,
	electionsRelations,
	electoralActs,
	electoralActsRelations,
	fraudIndicators,
	fraudIndicatorsRelations,
	pollingStations,
	pollingStationsRelations,
} from "../civic.schema";

function getTableColumns(table: object): Record<string, unknown> {
	return (table as Record<symbol, Record<string, unknown>>)[
		Symbol.for("drizzle:Columns")
	];
}

const TABLE_NAME_SYMBOL = Symbol.for("drizzle:Name");

function getTableName(table: object): string {
	return (table as Record<symbol, string>)[TABLE_NAME_SYMBOL];
}

describe("civic schema — table definitions", () => {
	const tableNames: [object, string][] = [
		[elections, "civic_elections"],
		[pollingStations, "civic_polling_stations"],
		[electoralActs, "civic_electoral_acts"],
		[auditTrails, "civic_audit_trails"],
		[fraudIndicators, "civic_fraud_indicators"],
	];

	it.each(tableNames)("table %s has correct name", (table, expectedName) => {
		expect(getTableName(table)).toBe(expectedName);
	});
});

describe("civic schema — elections table", () => {
	const cols = getTableColumns(elections);

	it("has required columns", () => {
		expect(cols.id).toBeDefined();
		expect(cols.name).toBeDefined();
		expect(cols.date).toBeDefined();
		expect(cols.region).toBeDefined();
		expect(cols.status).toBeDefined();
		expect(cols.createdAt).toBeDefined();
		expect(cols.updatedAt).toBeDefined();
	});

	it("id column is notNull (uuid primary key)", () => {
		const id = cols.id as { notNull?: boolean };
		expect(id.notNull).toBe(true);
	});

	it("region is notNull", () => {
		const region = cols.region as { notNull?: boolean };
		expect(region.notNull).toBe(true);
	});

	it("status is notNull", () => {
		const status = cols.status as { notNull?: boolean };
		expect(status.notNull).toBe(true);
	});
});

describe("civic schema — polling_stations table", () => {
	const cols = getTableColumns(pollingStations);

	it("has required columns", () => {
		expect(cols.id).toBeDefined();
		expect(cols.code).toBeDefined();
		expect(cols.name).toBeDefined();
		expect(cols.location).toBeDefined();
		expect(cols.urnCount).toBeDefined();
		expect(cols.registeredVoters).toBeDefined();
		expect(cols.electionId).toBeDefined();
		expect(cols.createdAt).toBeDefined();
		expect(cols.updatedAt).toBeDefined();
	});

	it("urnCount is notNull", () => {
		const urnCount = cols.urnCount as { notNull?: boolean };
		expect(urnCount.notNull).toBe(true);
	});

	it("registeredVoters is notNull", () => {
		const rv = cols.registeredVoters as { notNull?: boolean };
		expect(rv.notNull).toBe(true);
	});
});

describe("civic schema — electoral_acts table", () => {
	const cols = getTableColumns(electoralActs);

	it("has required columns", () => {
		expect(cols.id).toBeDefined();
		expect(cols.stationId).toBeDefined();
		expect(cols.urnNumber).toBeDefined();
		expect(cols.voteTallies).toBeDefined();
		expect(cols.validationStatus).toBeDefined();
		expect(cols.validatedAt).toBeDefined();
		expect(cols.validatedBy).toBeDefined();
		expect(cols.createdAt).toBeDefined();
		expect(cols.updatedAt).toBeDefined();
	});

	it("validationStatus is notNull", () => {
		const vs = cols.validationStatus as { notNull?: boolean };
		expect(vs.notNull).toBe(true);
	});

	it("voteTallies is defined (JSONB)", () => {
		expect(cols.voteTallies).toBeDefined();
	});
});

describe("civic schema — audit_trails table", () => {
	const cols = getTableColumns(auditTrails);

	it("has required columns", () => {
		expect(cols.id).toBeDefined();
		expect(cols.actId).toBeDefined();
		expect(cols.action).toBeDefined();
		expect(cols.actor).toBeDefined();
		expect(cols.timestamp).toBeDefined();
		expect(cols.evidence).toBeDefined();
		expect(cols.metadata).toBeDefined();
		expect(cols.createdAt).toBeDefined();
	});

	it("evidence column is notNull", () => {
		const ev = cols.evidence as { notNull?: boolean };
		expect(ev.notNull).toBe(true);
	});
});

describe("civic schema — fraud_indicators table", () => {
	const cols = getTableColumns(fraudIndicators);

	it("has required columns", () => {
		expect(cols.id).toBeDefined();
		expect(cols.electionId).toBeDefined();
		expect(cols.actId).toBeDefined();
		expect(cols.type).toBeDefined();
		expect(cols.severity).toBeDefined();
		expect(cols.description).toBeDefined();
		expect(cols.evidence).toBeDefined();
		expect(cols.detectedAt).toBeDefined();
	});

	it("electionId is nullable", () => {
		const eid = cols.electionId as { notNull?: boolean };
		expect(eid.notNull).toBe(false);
	});

	it("actId is nullable", () => {
		const actId = cols.actId as { notNull?: boolean };
		expect(actId.notNull).toBe(false);
	});
});

describe("civic schema — exports", () => {
	it("exports all 5 table definitions", () => {
		expect(elections).toBeDefined();
		expect(pollingStations).toBeDefined();
		expect(electoralActs).toBeDefined();
		expect(auditTrails).toBeDefined();
		expect(fraudIndicators).toBeDefined();
	});

	it("exports all 5 relation definitions", () => {
		expect(electionsRelations).toBeDefined();
		expect(pollingStationsRelations).toBeDefined();
		expect(electoralActsRelations).toBeDefined();
		expect(auditTrailsRelations).toBeDefined();
		expect(fraudIndicatorsRelations).toBeDefined();
	});
});
