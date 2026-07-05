import { api } from "@/lib/api";
import { registerClient } from "@/lib/treaty-route-client";

/** Eden `App` includes `/api/vendors`; use contract inference instead of manual casts. */
export const vendorTreatyClient = registerClient("vendors", api.api.vendors);
