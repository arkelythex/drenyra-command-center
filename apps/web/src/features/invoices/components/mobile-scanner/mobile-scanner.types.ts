export interface ScanResult {
	invoiceNumber: string;
	amount: number;
	vendor: string;
	date: string;
	confidence: number;
}

export interface MobileInvoiceScannerProps {
	onScanComplete?: (data: ScanResult) => void;
	onClose?: () => void;
}
