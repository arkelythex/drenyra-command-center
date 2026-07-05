/**
 * Banking Types
 */

import type { ReconciliationStatus as DomainReconciliationStatus } from "@drenyra/domain";
import type { BankAccountType } from "@drenyra/domain/value-objects/AccountType";
import type { BankTransactionType } from "@drenyra/domain/value-objects/TransactionType";
export type ReconciliationStatus = DomainReconciliationStatus;

export interface BankAccount {
	id: string;
	companyId: string;
	accountName: string;
	accountNumber: string;
	accountType: BankAccountType;
	bankName: string;
	bankCode?: string;
	branch?: string;
	currency: string;
	currentBalance: string;
	availableBalance?: string;
	isActive: boolean;
	isDefault: boolean;
	createdAt: Date;
	updatedAt: Date;
}

export interface BankTransaction {
	id: string;
	companyId: string;
	accountId: string;
	transactionDate: Date;
	description: string;
	reference?: string;
	type: BankTransactionType;
	amount: string;
	balance?: string;
	category?: string;
	tags?: string[];
	isReconciled: boolean;
	reconciledAt?: Date;
	invoiceId?: string;
	billId?: string;
	paymentId?: string;
	createdAt: Date;
	importedFrom?: string;
}

export interface BankReconciliation {
	id: string;
	companyId: string;
	accountId: string;
	startDate: Date;
	endDate: Date;
	openingBalance: string;
	closingBalance: string;
	statementBalance?: string;
	status: ReconciliationStatus;
	difference?: string;
	notes?: string;
	createdAt: Date;
	completedAt?: Date;
}

export interface CreateAccountDTO {
	accountName: string;
	accountNumber: string;
	accountType: BankAccountType;
	bankName: string;
	bankCode?: string;
	branch?: string;
	currency?: string;
	currentBalance?: number;
}

export interface CreateTransactionDTO {
	accountId: string;
	transactionDate: Date;
	description: string;
	reference?: string;
	type: BankTransactionType;
	amount: number;
	category?: string;
	tags?: string[];
}

export interface BankingSummary {
	totalAccounts: number;
	totalBalance: string;
	totalBalancePEN: string;
	totalBalanceUSD: string;
	unreconciledTransactions: number;
	lastReconciliation?: Date;
}
