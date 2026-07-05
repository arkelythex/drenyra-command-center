import { api } from "@/lib/api";
import { registerClient } from "@/lib/treaty-route-client";

/** Eden `App` includes `/api/customers`; use contract inference instead of manual casts. */
export const customerTreatyClient = registerClient(
	"customers",
	api.api.customers,
);
