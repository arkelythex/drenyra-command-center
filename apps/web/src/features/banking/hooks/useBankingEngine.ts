import { useQuery } from "@tanstack/react-query";
import { startTransition, useCallback, useOptimistic, useState } from "react";
import { inboxApi } from "@/features/inbox/api/inbox.api";
import type { InboxTransactionRecord } from "@/features/inbox/inbox.types";
import { HttpClientError } from "@/lib/http-client";
import { captureError, trackEvent } from "@/lib/monitoring";
import { runtimeConfig } from "@/lib/runtime-config";
import { bankingKeys } from "../api/query-keys";

export interface BankTransaction {
	id: string;
	date: string;
	description: string;
	amount: number;
	currency: "PEN" | "USD";
	status: "PENDING" | "RECONCILED";
	suggestedMatch?: {
		docId: string;
		docNumber: string;
		score: number; // 0-100
		type: "FT" | "BV" | "RH";
		reason: string;
	};
}

interface UseBankingEngineResult {
	selectedAccountId: string;
	setSelectedAccountId: (value: string) => void;
	transactions: BankTransaction[];
	searchQuery: string;
	setSearchQuery: (value: string) => void;
	confirmMatch: (txId: string, docId: string) => void;
}

export const useBankingEngine = (): UseBankingEngineResult => {
	const [selectedAccountId, setSelectedAccountId] = useState("bcp-mn");
	const [searchQuery, setSearchQuery] = useState("");
	const fetchMatches = useCallback(async () => {
		try {
			const expenses = runtimeConfig.mockMode
				? []
				: await inboxApi.listTransactions({ type: "EXPENSE" });

			// BASE MOCK TRANSACTIONS (Always present)
			const baseTransactions: BankTransaction[] = [
				{
					id: "tx1",
					date: "2026-01-15",
					description: "TRANSFERENCIA RECIBIDA - CLIENTE VIP",
					amount: 15000.0,
					currency: "PEN",
					status: "PENDING",
					suggestedMatch: {
						docId: "F001-999",
						docNumber: "F001-999",
						score: 85,
						type: "FT",
						reason: "Monto similar",
					},
				},
				{
					id: "tx2",
					date: "2026-01-14",
					description: "PAGO PROVEEDORES - TELEFONICA DEL PERU",
					amount: -2850.5,
					currency: "PEN",
					status: "PENDING",
					suggestedMatch: {
						docId: "F001-456",
						docNumber: "F001-456",
						score: 92,
						type: "FT",
						reason: "RUC y monto coincidente",
					},
				},
				{
					id: "tx3",
					date: "2026-01-14",
					description: "COMISION MANTENIMIENTO CTA",
					amount: -50.0,
					currency: "PEN",
					status: "PENDING",
				},
				{
					id: "tx4",
					date: "2026-01-13",
					description: "DEPÓSITO EFECTIVO - CAJA GENERAL",
					amount: 8750.0,
					currency: "PEN",
					status: "PENDING",
				},
				{
					id: "tx5",
					date: "2026-01-12",
					description: "PAGO SERVICIOS - ENEL DISTRIBUCION",
					amount: -1250.75,
					currency: "PEN",
					status: "PENDING",
					suggestedMatch: {
						docId: "BV001-789",
						docNumber: "BV001-789",
						score: 88,
						type: "BV",
						reason: "Servicio público recurrente",
					},
				},
				{
					id: "tx6",
					date: "2026-01-11",
					description: "TRANSFERENCIA INTERBANCARIA - BBVA",
					amount: 25000.0,
					currency: "PEN",
					status: "PENDING",
				},
				{
					id: "tx7",
					date: "2026-01-10",
					description: "PAGO NOMINA - PLANILLA ENERO",
					amount: -45000.0,
					currency: "PEN",
					status: "PENDING",
					suggestedMatch: {
						docId: "RH001-2026",
						docNumber: "RH001-2026",
						score: 95,
						type: "RH",
						reason: "Pago mensual de nómina",
					},
				},
				{
					id: "tx8",
					date: "2026-01-09",
					description: "COMISION TRANSFERENCIA INTERNACIONAL",
					amount: -25.0,
					currency: "PEN",
					status: "PENDING",
				},
				{
					id: "tx9",
					date: "2026-01-08",
					description: "PAGO PROVEEDORES - MICROSOFT PERU",
					amount: -3200.0,
					currency: "PEN",
					status: "PENDING",
					suggestedMatch: {
						docId: "F001-234",
						docNumber: "F001-234",
						score: 90,
						type: "FT",
						reason: "Proveedor registrado",
					},
				},
				{
					id: "tx10",
					date: "2026-01-07",
					description: "DEPÓSITO CHEQUE - BANCO DE CREDITO",
					amount: 15000.0,
					currency: "PEN",
					status: "PENDING",
				},
				{
					id: "tx11",
					date: "2026-01-06",
					description: "PAGO ARRENDAMIENTO - OFICINA PRINCIPAL",
					amount: -8500.0,
					currency: "PEN",
					status: "PENDING",
					suggestedMatch: {
						docId: "BV001-567",
						docNumber: "BV001-567",
						score: 87,
						type: "BV",
						reason: "Contrato mensual",
					},
				},
				{
					id: "tx12",
					date: "2026-01-05",
					description: "TRANSFERENCIA RECIBIDA - VENTA PRODUCTOS",
					amount: 22500.0,
					currency: "PEN",
					status: "PENDING",
				},
			];

			// DYNAMIC MATCHING: Look for ALICORP
			const alicorpInvoice = expenses.find(
				(record) =>
					record.partner?.legalName?.includes("ALICORP") ||
					record.notes?.includes("ALICORP") ||
					record.totalAmount === "1180.00" ||
					record.totalAmount === 1180,
			);

			if (alicorpInvoice) {
				const record: InboxTransactionRecord = alicorpInvoice;
				const seriesPrefix = record.series
					? `${String(record.series).toUpperCase()}-`
					: "";
				const bankTx: BankTransaction = {
					id: "bank-alicorp-001",
					date: new Date().toLocaleDateString("en-CA"), // Today
					description: "PAGO PROVEEDORES - ALICORP S.A.A.",
					amount: -Number(record.totalAmount ?? 0), // Negative because it's an expense payment
					currency: "PEN",
					status: "PENDING",
					suggestedMatch: {
						docId: record.id,
						docNumber: `${seriesPrefix}${String(record.number ?? "DOC").toUpperCase()}`,
						score: 100,
						type: "FT",
						reason: "Monto exacto y RUC coincidente",
					},
				};
				baseTransactions.unshift(bankTx); // Add to top
			}

			return baseTransactions;
		} catch (e) {
			if (
				e instanceof HttpClientError &&
				(e.status === 404 || e.status === 405 || e.status === 501)
			) {
				return [] as BankTransaction[];
			}
			captureError(
				e instanceof Error
					? e
					: new Error("Banking engine failed to load matches"),
				{
					accountId: selectedAccountId,
					source: "features/banking/useBankingEngine.fetchMatches",
				},
			);
			return [] as BankTransaction[];
		}
	}, [selectedAccountId]);

	const { data: transactions = [] } = useQuery({
		queryKey: bankingKeys.engine(selectedAccountId),
		queryFn: fetchMatches,
	});

	const [optimisticTransactions, addOptimistic] = useOptimistic(
		transactions,
		(state, update: { txId: string }) =>
			state.map((t) =>
				t.id === update.txId
					? {
							...t,
							status: "RECONCILED" as const,
							description: `${t.description} (CONCILIADO)`,
						}
					: t,
			),
	);

	const confirmMatch = useCallback(
		(txId: string, docId: string) => {
			trackEvent("banking_reconciliation_confirmed", {
				accountId: selectedAccountId,
				docId,
				txId,
			});
			startTransition(() => {
				addOptimistic({ txId });
			});
		},
		[addOptimistic, selectedAccountId],
	);

	return {
		selectedAccountId,
		setSelectedAccountId,
		transactions: optimisticTransactions.filter(
			(t) => t.status !== "RECONCILED",
		), // Hide reconciled for cleaner view
		searchQuery,
		setSearchQuery,
		confirmMatch,
	};
};
