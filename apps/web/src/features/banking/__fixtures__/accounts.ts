/**
 * Test fixtures for banking hooks.
 * These are NOT imported in production code.
 * Import only in test files and Storybook/Ladle stories.
 */
import type { Account } from "../hooks/useBanking";

export const MOCK_ACCOUNTS: Account[] = [
	{
		id: "acc1",
		name: "BCP Cta. Corriente Soles",
		type: "BANK",
		currency: "PEN",
		bankName: "BCP",
		accountNumber: "191-2233445-0-01",
		currentBalance: 145820.5,
		activityCount: 15,
	},
	{
		id: "acc2",
		name: "BBVA Continental ME",
		type: "BANK",
		currency: "USD",
		bankName: "BBVA",
		accountNumber: "0011-0123-0100045678",
		currentBalance: 45000.0,
		activityCount: 8,
	},
	{
		id: "acc3",
		name: "Detracciones - BN",
		type: "DETRACTION",
		currency: "PEN",
		bankName: "Banco de la Nación",
		accountNumber: "00-068-123456",
		currentBalance: 12500.0,
		activityCount: 4,
	},
	{
		id: "card1",
		name: "Interbank Business",
		type: "CREDIT",
		currency: "PEN",
		bankName: "Interbank",
		accountNumber: "****-9988",
		currentBalance: -5200.0,
		activityCount: 12,
	},
];
