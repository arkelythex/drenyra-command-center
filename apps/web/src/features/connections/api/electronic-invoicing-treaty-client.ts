import {
	getTreatyRouteClient,
	type TreatyResponse,
} from "@/lib/treaty-route-client";

interface ElectronicInvoicingRoute {
	ose: {
		readiness: {
			get(options?: {
				headers?: Record<string, string>;
			}): Promise<TreatyResponse<unknown>>;
		};
	};
}

export const electronicInvoicingTreatyClient =
	getTreatyRouteClient<ElectronicInvoicingRoute>("electronic-invoicing");
