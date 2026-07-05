/**
 * Types for SubmitBatchDialog.
 */

export interface SubmitBatchDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	companyId: string;
}

export interface DraftInvoice {
	id: string;
	type: "image" | "pdf" | "xml";
	data: string;
	label: string;
}
