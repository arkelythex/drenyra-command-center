/**
 * Vendor - Domain Entity
 *
 * Represents a vendor (supplier) in the system.
 * Wraps business_partners + vendor_profiles with vendor-specific behavior.
 *
 * @module vendors/domain
 */

import { RUC } from '@arkelythex/domain';

/**
 * PreferredPaymentMethod type.
 *
 * @example
 * ```ts
 * const value: PreferredPaymentMethod = {} as PreferredPaymentMethod;
 * console.log(value);
 * ```
 */
export type PreferredPaymentMethod = 'TRANSFER' | 'CASH' | 'CHECK';

/**
 * VendorData interface.
 *
 * @example
 * ```ts
 * const value: VendorData = {} as VendorData;
 * console.log(value);
 * ```
 */
export interface VendorData {
  id: string;
  companyId: string;
  taxId: string; // RUC
  legalName: string;
  email?: string;
  sunatCondition: string; // HABIDO | INACTIVO
  vendorRating: number; // 0-100
  paymentTermDays: number;
  preferredPaymentMethod: PreferredPaymentMethod;
  bankAccount?: string;
  purchaseCategories: string[];
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Vendor Entity
 *
 * Rich domain model with business logic.
 * @example
 * ```ts
 * const value = new Vendor();
 * console.log(value);
 * ```
 */

export class Vendor {
  constructor(private data: VendorData) {}

  get id(): string {
    return this.data.id;
  }

  get companyId(): string {
    return this.data.companyId;
  }

  get taxId(): string {
    return this.data.taxId;
  }

  get legalName(): string {
    return this.data.legalName;
  }

  get email(): string | undefined {
    return this.data.email;
  }

  get sunatCondition(): string {
    return this.data.sunatCondition;
  }

  get vendorRating(): number {
    return this.data.vendorRating;
  }

  get paymentTermDays(): number {
    return this.data.paymentTermDays;
  }

  get preferredPaymentMethod(): PreferredPaymentMethod {
    return this.data.preferredPaymentMethod;
  }

  get bankAccount(): string | undefined {
    return this.data.bankAccount;
  }

  get purchaseCategories(): string[] {
    return this.data.purchaseCategories;
  }

  get createdAt(): Date {
    return this.data.createdAt;
  }

  get updatedAt(): Date {
    return this.data.updatedAt;
  }

  /**
   * Validate RUC using SUNAT Módulo 11 algorithm.
   */
  static isValidRUC(ruc: string): boolean {
    return RUC.isValid(ruc);
  }

  /**
   * Check if vendor is active.
   */
  get isActive(): boolean {
    return this.data.sunatCondition === 'HABIDO';
  }

  /**
   * Check if vendor is inactive (soft deleted).
   */
  get isInactive(): boolean {
    return this.data.sunatCondition === 'INACTIVO';
  }

  /**
   * Business Rule: good vendors have rating >= 80.
   */
  hasGoodRating(): boolean {
    return this.data.vendorRating >= 80;
  }

  /**
   * Business Rule: payment is overdue if today is past billDate + paymentTermDays.
   */
  isPaymentOverdue(billDate: Date, asOf: Date = new Date()): boolean {
    if (this.data.paymentTermDays <= 0) return asOf.getTime() > billDate.getTime();
    const due = new Date(billDate);
    due.setDate(due.getDate() + this.data.paymentTermDays);
    return asOf.getTime() > due.getTime();
  }

  toJSON() {
    return {
      id: this.id,
      companyId: this.companyId,
      taxId: this.taxId,
      legalName: this.legalName,
      email: this.email,
      sunatCondition: this.sunatCondition,
      isActive: this.isActive,
      vendorRating: this.vendorRating,
      hasGoodRating: this.hasGoodRating(),
      paymentTermDays: this.paymentTermDays,
      preferredPaymentMethod: this.preferredPaymentMethod,
      bankAccount: this.bankAccount,
      purchaseCategories: this.purchaseCategories,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}
