import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { dataEngineSchemas } from "../contracts/data-engine-schemas";
import {
  buildCashflowAnalyzeFixture,
  buildReconcileFixture,
  buildSireCsvFixture,
} from "../contracts/data-engine-fixtures";
import { getJson, isDataEngineReachable } from "../contracts/data-engine-http";
import { DATA_ENGINE_CONTRACT_VERSION } from "../contracts/data-engine-contract-version";
import { ContractReporter } from "../contracts/contract-reporter";
import { validateSchema } from "../contracts/schema-validator";
import type {
  DataEngineCashflowAnalyzeResponse,
  DataEngineHealthResponse,
  DataEngineReconcileResponse,
  DataEngineSireResponse,
} from "../contracts/data-engine-types";

const DATA_ENGINE_URL = process.env.DATA_ENGINE_URL ?? "http://localhost:8000";
const REQUIRE_CONTRACTS = process.env.REQUIRE_DATA_ENGINE_CONTRACTS === "1";
const CONTRACT_SCOPE = process.env.DATA_ENGINE_CONTRACT_SCOPE === "smoke" ? "smoke" : "full";
const REPORT_PATH = process.env.DATA_ENGINE_CONTRACT_REPORT_PATH;
const SMOKE_ENDPOINTS = new Set(["health", "cashflow.analyze"]);
const reporter = new ContractReporter(
  REPORT_PATH,
  DATA_ENGINE_URL,
  REQUIRE_CONTRACTS
);

describe("Data Engine Contract Tests", () => {
  let dataEngineAvailable = false;

  beforeAll(async () => {
    dataEngineAvailable = await isDataEngineReachable(DATA_ENGINE_URL);
  });

  afterAll(async () => {
    await reporter.flush();
  });

  it("validates health contract", async (ctx) => {
    try {
      guardDataEngineAvailability(ctx, dataEngineAvailable, "health");

      const { response, data } = await getJson<DataEngineHealthResponse>(
        `${DATA_ENGINE_URL}/health`
      );
      expect(response.ok).toBe(true);
      expect(response.headers.get("x-contract-version")).toBe(DATA_ENGINE_CONTRACT_VERSION);

      const schemaResult = assertSchema("health", data, dataEngineSchemas.health);
      reporter.pass("health", {
        httpStatus: response.status,
        schemaValid: schemaResult.valid,
        sample: data,
      });
      expect(data.status).toBe("online");
      expect(data.service).toBe("data-engine");
    } catch (error: unknown) {
      reporter.fail("health", toErrorMessage(error));
      throw error;
    }
  });

  it("validates SIRE compras contract", async (ctx) => {
    try {
      guardDataEngineAvailability(ctx, dataEngineAvailable, "sire.compras");

      const { response, data } = await getJson<DataEngineSireResponse>(
        `${DATA_ENGINE_URL}/api/v1/sire/compras`,
        {
          method: "POST",
          body: buildSireCsvFixture(),
        }
      );
      expect(response.ok).toBe(true);
      expect(response.headers.get("x-contract-version")).toBe(DATA_ENGINE_CONTRACT_VERSION);

      const schemaResult = assertSchema("sireAnalyze", data, dataEngineSchemas.sireAnalyze);
      reporter.pass("sire.compras", {
        httpStatus: response.status,
        schemaValid: schemaResult.valid,
        sample: data,
      });
    } catch (error: unknown) {
      reporter.fail("sire.compras", toErrorMessage(error));
      throw error;
    }
  });

  it("validates cashflow analyze contract", async (ctx) => {
    try {
      guardDataEngineAvailability(ctx, dataEngineAvailable, "cashflow.analyze");

      const { response, data } = await getJson<DataEngineCashflowAnalyzeResponse>(
        `${DATA_ENGINE_URL}/api/v1/cashflow/analyze`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(buildCashflowAnalyzeFixture()),
        }
      );
      expect(response.ok).toBe(true);
      expect(response.headers.get("x-contract-version")).toBe(DATA_ENGINE_CONTRACT_VERSION);

      const schemaResult = assertSchema(
        "cashflowAnalyze",
        data,
        dataEngineSchemas.cashflowAnalyze
      );
      reporter.pass("cashflow.analyze", {
        httpStatus: response.status,
        schemaValid: schemaResult.valid,
        sample: data,
      });
      expect(data.summary.totalIncome).toBe(1000);
      expect(data.summary.totalExpenses).toBe(300);
    } catch (error: unknown) {
      reporter.fail("cashflow.analyze", toErrorMessage(error));
      throw error;
    }
  });

  it("validates banking reconcile contract", async (ctx) => {
    try {
      guardDataEngineAvailability(ctx, dataEngineAvailable, "banking.reconcile");

      const { response, data } = await getJson<DataEngineReconcileResponse>(
        `${DATA_ENGINE_URL}/api/v1/banking/reconcile`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(buildReconcileFixture()),
        }
      );
      expect(response.ok).toBe(true);
      expect(response.headers.get("x-contract-version")).toBe(DATA_ENGINE_CONTRACT_VERSION);

      const schemaResult = assertSchema("reconcile", data, dataEngineSchemas.reconcile);
      reporter.pass("banking.reconcile", {
        httpStatus: response.status,
        schemaValid: schemaResult.valid,
        sample: data,
      });
      expect(Array.isArray(data.matched)).toBe(true);
      expect(Array.isArray(data.unmatched.bank)).toBe(true);
    } catch (error: unknown) {
      reporter.fail("banking.reconcile", toErrorMessage(error));
      throw error;
    }
  });
});

function assertSchema(
  schemaName: keyof typeof dataEngineSchemas,
  data: unknown,
  schema: (typeof dataEngineSchemas)[keyof typeof dataEngineSchemas]
): { valid: boolean; errors: string[] } {
  const result = validateSchema(data, schema);
  expect(
    result.valid,
    `${schemaName} schema errors: ${result.errors.join(", ")}`
  ).toBe(true);
  return result;
}

function guardDataEngineAvailability(
  context: { skip: () => void },
  available: boolean,
  endpoint: string
): void {
  if (CONTRACT_SCOPE === "smoke" && !SMOKE_ENDPOINTS.has(endpoint)) {
    reporter.skip(endpoint, "Endpoint excluded from smoke scope");
    context.skip();
    return;
  }

  if (available) return;
  if (REQUIRE_CONTRACTS) {
    reporter.fail(
      endpoint,
      `Data Engine unavailable at ${DATA_ENGINE_URL}. Set DATA_ENGINE_URL or start apps/data-engine.`
    );
    throw new Error(
      `Data Engine unavailable at ${DATA_ENGINE_URL}. Set DATA_ENGINE_URL or start apps/data-engine.`
    );
  }
  reporter.skip(endpoint, "Data Engine unavailable in optional mode");
  context.skip();
}

function toErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message.trim()) {
    return error.message.trim();
  }
  return String(error);
}
