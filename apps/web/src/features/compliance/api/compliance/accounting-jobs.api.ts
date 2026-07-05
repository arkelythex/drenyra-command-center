/**
 * Accounting jobs and country packs API methods
 *
 * @module compliance/accounting-jobs
 */

import { extractOkData, unwrap } from "@/lib/api-helpers";
import {
	type AccountingJobRunStatus,
	type AccountingJobRunsListResponse,
	type AccountingJobRunView,
	type AccountingJobsCatalogResponse,
	type CountryPackCatalogResponse,
	type CreateAccountingJobRunPayload,
	type ExecuteAccountingJobRunPayload,
	getComplianceClient,
	type UpdateAccountingJobRunStatusPayload,
} from "../compliance-client";

const complianceClient = getComplianceClient();

export const accountingJobsApi = {
	/**
	 * GET /compliance/accounting-jobs
	 * Returns the accounting jobs catalog for the requested country.
	 */
	getAccountingJobsCatalog: async (
		countryCode?: string | null,
	): Promise<AccountingJobsCatalogResponse> => {
		const body = await unwrap(
			complianceClient["accounting-jobs"].get({
				query: {
					countryCode: countryCode ?? undefined,
				},
			}),
		);
		return extractOkData(
			body,
			"No se pudo cargar el catalogo de trabajos contables",
		) as AccountingJobsCatalogResponse;
	},

	/**
	 * GET /compliance/country-packs
	 * Returns the supported country packs for cognitive-hub callers.
	 */
	getCountryPackCatalog: async (): Promise<CountryPackCatalogResponse> => {
		const body = await unwrap(complianceClient["country-packs"].get());
		return extractOkData(
			body,
			"No se pudo cargar el catalogo de paises",
		) as CountryPackCatalogResponse;
	},

	/**
	 * GET /compliance/accounting-job-runs
	 * Returns recent accounting job runs for a company.
	 */
	listAccountingJobRuns: async (query: {
		companyId: string;
		countryCode?: string;
		status?: AccountingJobRunStatus;
		limit?: number;
	}): Promise<AccountingJobRunsListResponse> => {
		const body = await unwrap(
			complianceClient["accounting-job-runs"].get({
				query,
			}),
		);
		return extractOkData(
			body,
			"No se pudo cargar la actividad contable",
		) as AccountingJobRunsListResponse;
	},

	/**
	 * POST /compliance/accounting-job-runs
	 * Creates one accounting job run for the assistant.
	 */
	createAccountingJobRun: async (
		payload: CreateAccountingJobRunPayload,
	): Promise<AccountingJobRunView> => {
		const body = await unwrap(
			complianceClient["accounting-job-runs"].post(payload),
		);
		return extractOkData(
			body,
			"No se pudo registrar el trabajo contable",
		) as AccountingJobRunView;
	},

	/**
	 * PATCH /compliance/accounting-job-runs/:id/status
	 * Updates the status of one accounting job run.
	 */
	updateAccountingJobRunStatus: async (
		runId: string,
		payload: UpdateAccountingJobRunStatusPayload,
	): Promise<AccountingJobRunView> => {
		const body = await unwrap(
			complianceClient["accounting-job-runs"]({
				id: runId,
			}).status.patch(payload),
		);
		return extractOkData(
			body,
			"No se pudo actualizar el trabajo contable",
		) as AccountingJobRunView;
	},

	/**
	 * POST /compliance/accounting-job-runs/:id/execute
	 * Executes one supported accounting job run.
	 */
	executeAccountingJobRun: async (
		runId: string,
		payload: ExecuteAccountingJobRunPayload,
	): Promise<AccountingJobRunView> => {
		const body = await unwrap(
			complianceClient["accounting-job-runs"]({
				id: runId,
			}).execute.post(payload),
		);
		return extractOkData(
			body,
			"No se pudo ejecutar el trabajo contable",
		) as AccountingJobRunView;
	},
};
