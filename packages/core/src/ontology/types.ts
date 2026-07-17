/**
 * Core Ontology types — the shared data model across ALL domains.
 *
 * These entities are the single source of truth referenced by every domain.
 * A "Client" in Drenyra is the same "Client" in Agricultura.
 */

import type { OrganizationId, UserId } from "../iam/types";

/** Unique branded IDs for ontology entities */
export type ClientId = string & { readonly __brand: "ClientId" };
export type ProductId = string & { readonly __brand: "ProductId" };
export type LocationId = string & { readonly __brand: "LocationId" };
export type ContractId = string & { readonly __brand: "ContractId" };

/** Client/counterparty shared across all domains */
export interface CoreClient {
	id: ClientId;
	organizationId: OrganizationId;
	documentType: "ruc" | "dni" | "ce" | "passport";
	documentNumber: string;
	businessName: string;
	tradeName?: string;
	address?: string;
	email?: string;
	phone?: string;
	isActive: boolean;
	tags: string[];
	metadata: Record<string, unknown>;
	createdBy: UserId;
	createdAt: Date;
	updatedAt: Date;
}

/** Product/service offered by an organization */
export interface CoreProduct {
	id: ProductId;
	organizationId: OrganizationId;
	name: string;
	description?: string;
	category: string;
	unitType: "unit" | "kg" | "m2" | "m3" | "hour" | "service" | "other";
	unitPrice?: number;
	currency: string;
	isActive: boolean;
	metadata: Record<string, unknown>;
	createdAt: Date;
	updatedAt: Date;
}

/** Geographic location (farm, warehouse, clinic, drone zone) */
export interface CoreLocation {
	id: LocationId;
	organizationId: OrganizationId;
	name: string;
	type: "address" | "farm" | "warehouse" | "clinic" | "airspace" | "other";
	countryCode: string;
	region?: string;
	city?: string;
	address?: string;
	coordinates?: {
		latitude: number;
		longitude: number;
	};
	isActive: boolean;
	metadata: Record<string, unknown>;
	createdAt: Date;
	updatedAt: Date;
}

/** Contract/agreement template — shared legal framework */
export interface CoreContract {
	id: ContractId;
	organizationId: OrganizationId;
	clientId: ClientId;
	contractType: "service" | "sale" | "lease" | "loan" | "employment" | "other";
	status: "draft" | "active" | "completed" | "cancelled";
	startDate: Date;
	endDate?: Date;
	value?: number;
	currency: string;
	terms?: string;
	metadata: Record<string, unknown>;
	createdAt: Date;
	updatedAt: Date;
}
