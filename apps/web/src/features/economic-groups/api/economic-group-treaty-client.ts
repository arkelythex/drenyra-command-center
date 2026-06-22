import {
	getTreatyRouteClient,
	type TreatyResponse,
} from "@/lib/treaty-route-client";

interface EconomicGroupCollectionEndpoint {
	post<TBody extends object>(body: TBody): Promise<TreatyResponse<unknown>>;
	owner: (params: { ownerId: string | number }) => {
		get(): Promise<TreatyResponse<unknown>>;
	};
}

interface EconomicGroupItemEndpoint {
	get(): Promise<TreatyResponse<unknown>>;
	companies: {
		get(): Promise<TreatyResponse<unknown>>;
		post<TBody extends object>(body: TBody): Promise<TreatyResponse<unknown>>;
	};
}

interface EconomicGroupsRoute extends EconomicGroupCollectionEndpoint {
	(params: { id: string | number }): EconomicGroupItemEndpoint;
}

export const economicGroupsTreatyClient =
	getTreatyRouteClient<EconomicGroupsRoute>("economic-groups");
