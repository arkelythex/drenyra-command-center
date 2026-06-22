import {
	getTreatyRouteClient,
	type TreatyResponse,
} from "@/lib/treaty-route-client";

interface PayrollEmployeesEndpoint {
	get<TQuery extends object>(options: {
		query: TQuery;
	}): Promise<TreatyResponse<unknown>>;
}

type PayrollCalculateRoute = (params: { employeeId: string | number }) => {
	get<TQuery extends object>(options: {
		query: TQuery;
	}): Promise<TreatyResponse<unknown>>;
};

interface PayrollProcessEndpoint {
	post<TBody extends object>(body: TBody): Promise<TreatyResponse<unknown>>;
}

interface PayrollRoute {
	employees: PayrollEmployeesEndpoint;
	calculate: PayrollCalculateRoute;
	process: PayrollProcessEndpoint;
}

export const payrollTreatyClient =
	getTreatyRouteClient<PayrollRoute>("payroll");
