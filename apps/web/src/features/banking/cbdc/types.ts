export interface CBDCTransaction {
	id: string;
	type: "RECEIVED" | "SENT";
	amount: number;
	currency: "PEN_CBDC";
	status: "PENDING" | "CONFIRMED" | "FAILED";
	reconciliation_status: "MATCHED" | "PENDING" | "EXCEPTION";
	from_wallet: string;
	to_wallet: string;
	from_name: string;
	to_name: string;
	wallet_provider: "CBDC_BCRP" | "BiPay" | "Yape" | "Plin";
	timestamp: string; // ISO 8601
	blockchain_hash: string;
	confirmations: number;
	metadata: {
		concept: string;
		reference?: string;
		category?: string;
	};
	matched_invoice_id?: string;
}

export interface WalletBalance {
	wallet_id: string;
	balance: {
		available: number;
		pending: number;
		currency: "PEN_CBDC";
	};
	last_update: string; // ISO 8601
}

export interface CBDCWalletOptions {
	walletId?: string | null;
	enableRealTime?: boolean;
}
