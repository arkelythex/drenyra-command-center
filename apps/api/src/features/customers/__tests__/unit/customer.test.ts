/**
 * Customer Domain Tests
 *
 * @module customer/__tests__
 */

import { describe, expect, it } from "vitest";
import { Customer, type CustomerData } from "../../domain/customer";

describe("Customer Domain", () => {
	function buildValidRucFromFirst10Digits(first10: string): string {
		if (!/^\d{10}$/.test(first10))
			throw new Error("first10 must be exactly 10 digits");

		const weights = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];
		let sum = 0;
		for (let i = 0; i < 10; i++) {
			sum += Number(first10[i]) * weights[i];
		}

		const mod = sum % 11;
		const checkDigit = 11 - mod;

		let finalCheckDigit = checkDigit;
		if (checkDigit === 10) finalCheckDigit = 0;
		if (checkDigit === 11) finalCheckDigit = 1;

		return `${first10}${finalCheckDigit}`;
	}

	const mockCustomerData: CustomerData = {
		id: "customer-1",
		companyId: "company-1",
		taxId: buildValidRucFromFirst10Digits("2012345678"),
		legalName: "Empresa Test SAC",
		email: "contacto@test.com",
		address: "Av. Test 123",
		phone: "987654321",
		creditLimit: 10000,
		creditDays: 30,
		customerSegment: "RETAIL",
		paymentBehaviorScore: 90,
		lastPurchaseDate: new Date("2025-12-15"),
		totalPurchases: 2500,
		complianceScore: 85,
		sunatCondition: "HABIDO",
		logoUrl: "https://example.com/logo.png",
		createdAt: new Date("2026-01-01"),
		updatedAt: new Date("2026-01-02"),
	};

	describe("constructor and getters", () => {
		it("should create customer with all properties", () => {
			const customer = new Customer(mockCustomerData);

			expect(customer.id).toBe("customer-1");
			expect(customer.taxId).toBe(mockCustomerData.taxId);
			expect(customer.legalName).toBe("Empresa Test SAC");
			expect(customer.email).toBe("contacto@test.com");
			expect(customer.creditLimit).toBe(10000);
		});
	});

	describe("RUC validation", () => {
		it("should validate correct RUC", () => {
			const valid20 = buildValidRucFromFirst10Digits("2012345678");
			const valid10 = buildValidRucFromFirst10Digits("1012345678");

			expect(Customer.isValidRUC(valid20)).toBe(true);
			expect(Customer.isValidRUC(valid10)).toBe(true);
		});

		it("should reject invalid RUC", () => {
			const valid = buildValidRucFromFirst10Digits("2012345678");
			const invalidChecksum = `${valid.slice(0, 10)}${(Number(valid[10]) + 1) % 10}`;

			expect(Customer.isValidRUC(invalidChecksum)).toBe(false);
			expect(Customer.isValidRUC("123")).toBe(false); // Too short
			expect(Customer.isValidRUC("")).toBe(false); // Empty
		});
	});

	describe("isActive / isInactive", () => {
		it("should identify active customer", () => {
			const customer = new Customer(mockCustomerData);

			expect(customer.isActive).toBe(true);
			expect(customer.isInactive).toBe(false);
		});

		it("should identify inactive customer", () => {
			const inactiveCustomer = new Customer({
				...mockCustomerData,
				sunatCondition: "INACTIVO",
			});

			expect(inactiveCustomer.isActive).toBe(false);
			expect(inactiveCustomer.isInactive).toBe(true);
		});
	});

	describe("hasGoodCompliance", () => {
		it("should identify good compliance (>= 80)", () => {
			const customer = new Customer(mockCustomerData); // 85

			expect(customer.hasGoodCompliance).toBe(true);
		});

		it("should identify poor compliance (< 80)", () => {
			const poorCustomer = new Customer({
				...mockCustomerData,
				complianceScore: 70,
			});

			expect(poorCustomer.hasGoodCompliance).toBe(false);
		});
	});

	describe("credit management", () => {
		it("should check if credit is available", () => {
			const customer = new Customer(mockCustomerData); // creditLimit: 10000

			expect(customer.hasCreditAvailable(5000)).toBe(true); // 5000 < 10000
			expect(customer.hasCreditAvailable(10000)).toBe(false); // 10000 = 10000
			expect(customer.hasCreditAvailable(12000)).toBe(false); // 12000 > 10000
		});

		it("should calculate remaining credit", () => {
			const customer = new Customer(mockCustomerData); // creditLimit: 10000

			expect(customer.getRemainingCredit(3000)).toBe(7000);
			expect(customer.getRemainingCredit(10000)).toBe(0);
			expect(customer.getRemainingCredit(12000)).toBe(0); // No negative
		});

		it("should allow unlimited credit when no limit set", () => {
			const customerNoLimit = new Customer({
				...mockCustomerData,
				creditLimit: 0,
			});

			expect(customerNoLimit.hasCreditAvailable(1000000)).toBe(true);
			expect(customerNoLimit.getRemainingCredit(1000000)).toBe(Infinity);
		});
	});

	describe("toJSON", () => {
		it("should serialize to JSON with computed properties", () => {
			const customer = new Customer(mockCustomerData);
			const json = customer.toJSON();

			expect(json.id).toBe("customer-1");
			expect(json.taxId).toBe(mockCustomerData.taxId);
			expect(json.legalName).toBe("Empresa Test SAC");
			expect(json.isActive).toBe(true);
			expect(json.hasGoodCompliance).toBe(true);
			expect(json.hasGoodPaymentBehavior).toBe(true);
		});
	});
});
