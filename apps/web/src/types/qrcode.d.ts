declare module "qrcode" {
	export interface QRCodeToDataURLOptions {
		width?: number;
		margin?: number;
		errorCorrectionLevel?: "L" | "M" | "Q" | "H";
		type?: string;
	}

	interface QRCodeModule {
		toDataURL(text: string, options?: QRCodeToDataURLOptions): Promise<string>;
	}

	const QRCode: QRCodeModule;

	export default QRCode;
}
