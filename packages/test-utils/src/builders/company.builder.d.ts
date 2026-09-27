import type { Currency } from "@drenyra/domain/value-objects/Money";
import { BaseBuilder } from "./base.builder";
export interface CompanyData {
    id: string;
    razonSocial: string;
    commercialName: string;
    ruc: string;
    address: string;
    department: string;
    province: string;
    district: string;
    phone: string;
    email: string;
    currency: Currency;
    isActive: boolean;
    plan: "free" | "pro" | "enterprise";
    createdAt: Date;
    updatedAt: Date;
}
export declare class CompanyBuilder extends BaseBuilder<CompanyData> {
    constructor();
    withId(id: string): this;
    withRUC(ruc: string): this;
    withRazonSocial(razonSocial: string): this;
    withCommercialName(name: string): this;
    withAddress(address: string): this;
    withDepartment(department: string): this;
    withProvince(province: string): this;
    withDistrict(district: string): this;
    withPhone(phone: string): this;
    withEmail(email: string): this;
    withPlan(plan: "free" | "pro" | "enterprise"): this;
    asInactive(): this;
    asActive(): this;
    withCurrency(currency: Currency): this;
    build(): CompanyData;
}
//# sourceMappingURL=company.builder.d.ts.map