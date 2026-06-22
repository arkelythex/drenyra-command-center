import {
	getTreatyRouteClient,
	type TreatyResponse,
} from "@/lib/treaty-route-client";

interface AssetCollectionEndpoint {
	get<TQuery extends object>(options: {
		query: TQuery;
	}): Promise<TreatyResponse<unknown>>;
	valuation: {
		get<TQuery extends object>(options: {
			query: TQuery;
		}): Promise<TreatyResponse<unknown>>;
	};
}

interface AssetItemEndpoint {
	depreciation: {
		get(): Promise<TreatyResponse<unknown>>;
	};
}

interface AssetsRoute extends AssetCollectionEndpoint {
	(params: { id: string | number }): AssetItemEndpoint;
}

export const assetsTreatyClient = getTreatyRouteClient<AssetsRoute>("assets");
