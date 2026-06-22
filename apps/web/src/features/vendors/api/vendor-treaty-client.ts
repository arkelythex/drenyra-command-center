import { registerClient } from "@/lib/treaty-route-client";
import { api } from "@/lib/api";

/** Eden `App` includes `/api/vendors`; use contract inference instead of manual casts. */
export const vendorTreatyClient = registerClient("vendors", api.api.vendors);
