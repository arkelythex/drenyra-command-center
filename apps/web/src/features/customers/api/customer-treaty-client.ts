import { registerClient } from "@/lib/treaty-route-client";
import { api } from "@/lib/api";

/** Eden `App` includes `/api/customers`; use contract inference instead of manual casts. */
export const customerTreatyClient = registerClient("customers", api.api.customers);
