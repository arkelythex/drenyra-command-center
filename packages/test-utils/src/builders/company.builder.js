import { RUC } from "@drenyra/domain/value-objects/RUC";
import { BaseBuilder } from "./base.builder";
const DEFAULT_COMPANY_ID = "cmp_test_001";
const DEFAULT_RAZON_SOCIAL = "Empresa de Prueba SAC";
const DEFAULT_COMMERCIAL_NAME = "Empresa Test";
const DEFAULT_RUC = "20601234567";
const DEFAULT_CURRENCY = "PEN";
export class CompanyBuilder extends BaseBuilder {
    constructor() {
        const now = new Date();
        super({
            id: DEFAULT_COMPANY_ID,
            razonSocial: DEFAULT_RAZON_SOCIAL,
            commercialName: DEFAULT_COMMERCIAL_NAME,
            ruc: DEFAULT_RUC,
            address: "Av. Test 123, Lima",
            department: "Lima",
            province: "Lima",
            district: "Miraflores",
            phone: "+51 999 888 777",
            email: "contacto@empresa-test.pe",
            currency: DEFAULT_CURRENCY,
            isActive: true,
            plan: "pro",
            createdAt: now,
            updatedAt: now,
        });
    }
    withId(id) {
        return this.set({ id });
    }
    withRUC(ruc) {
        RUC.create(ruc);
        return this.set({ ruc });
    }
    withRazonSocial(razonSocial) {
        return this.set({ razonSocial });
    }
    withCommercialName(name) {
        return this.set({ commercialName: name });
    }
    withAddress(address) {
        return this.set({ address });
    }
    withDepartment(department) {
        return this.set({ department });
    }
    withProvince(province) {
        return this.set({ province });
    }
    withDistrict(district) {
        return this.set({ district });
    }
    withPhone(phone) {
        return this.set({ phone });
    }
    withEmail(email) {
        return this.set({ email });
    }
    withPlan(plan) {
        return this.set({ plan });
    }
    asInactive() {
        return this.set({ isActive: false });
    }
    asActive() {
        return this.set({ isActive: true });
    }
    withCurrency(currency) {
        return this.set({ currency });
    }
    build() {
        const now = new Date();
        return {
            id: this.data.id ?? DEFAULT_COMPANY_ID,
            razonSocial: this.data.razonSocial ?? DEFAULT_RAZON_SOCIAL,
            commercialName: this.data.commercialName ?? DEFAULT_COMMERCIAL_NAME,
            ruc: this.data.ruc ?? DEFAULT_RUC,
            address: this.data.address ?? "Av. Test 123, Lima",
            department: this.data.department ?? "Lima",
            province: this.data.province ?? "Lima",
            district: this.data.district ?? "Miraflores",
            phone: this.data.phone ?? "+51 999 888 777",
            email: this.data.email ?? "contacto@empresa-test.pe",
            currency: this.data.currency ?? DEFAULT_CURRENCY,
            isActive: this.data.isActive ?? true,
            plan: this.data.plan ?? "pro",
            createdAt: this.data.createdAt ?? now,
            updatedAt: this.data.updatedAt ?? now,
        };
    }
}
//# sourceMappingURL=company.builder.js.map