type CreateInvoiceDialogModule = typeof import("./CreateInvoiceDialog");

let createInvoiceDialogModulePromise: Promise<CreateInvoiceDialogModule> | null =
	null;

export function loadCreateInvoiceDialogModule(): Promise<CreateInvoiceDialogModule> {
	createInvoiceDialogModulePromise ??= import("./CreateInvoiceDialog");
	return createInvoiceDialogModulePromise;
}

export function preloadCreateInvoiceDialog(): void {
	void loadCreateInvoiceDialogModule().catch(() => {
		createInvoiceDialogModulePromise = null;
	});
}
