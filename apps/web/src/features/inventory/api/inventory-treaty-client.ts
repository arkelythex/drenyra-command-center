import {
	getTreatyRouteClient,
	type TreatyResponse,
} from "@/lib/treaty-route-client";

interface InventoryRoute {
	get<TQuery extends object>(options: {
		query: TQuery;
	}): Promise<TreatyResponse<unknown>>;
	movement: {
		post<TBody extends object, TQuery extends object>(
			body: TBody,
			options: { query: TQuery },
		): Promise<TreatyResponse<unknown>>;
	};
	kardex: (params: { productId: string | number }) => {
		get<TQuery extends object>(options: {
			query: TQuery;
		}): Promise<TreatyResponse<unknown>>;
	};
	summary: {
		get<TQuery extends object>(options: {
			query: TQuery;
		}): Promise<TreatyResponse<unknown>>;
	};
	warehouses: {
		get<TQuery extends object>(options: {
			query: TQuery;
		}): Promise<TreatyResponse<unknown>>;
		post<TBody extends object, TQuery extends object>(
			body: TBody,
			options: { query: TQuery },
		): Promise<TreatyResponse<unknown>>;
	};
}

export const inventoryTreatyClient =
	getTreatyRouteClient<InventoryRoute>("inventory");
