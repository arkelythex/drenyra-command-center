/**
 * Payroll Schema
 */

import { pgTable, uuid, varchar, decimal, timestamp, date, boolean } from 'drizzle-orm/pg-core';

/**
 * employees const.
 *
 * @example
 * ```ts
 * console.log(employees);
 * ```
 */
export const employees = pgTable('employees', {
  id: uuid('id').primaryKey().defaultRandom(),
  companyId: uuid('company_id').notNull(),
  
  firstName: varchar('first_name', { length: 100 }).notNull(),
  lastName: varchar('last_name', { length: 100 }).notNull(),
  documentType: varchar('document_type', { length: 10 }),
  documentNumber: varchar('document_number', { length: 20 }),
  
  position: varchar('position', { length: 100 }),
  department: varchar('department', { length: 100 }),
  salary: decimal('salary', { precision: 19, scale: 2 }),
  
  hireDate: date('hire_date'),
  isActive: boolean('is_active').default(true),
  
  createdAt: timestamp('created_at').defaultNow(),
});

/**
 * payrolls const.
 *
 * @example
 * ```ts
 * console.log(payrolls);
 * ```
 */
export const payrolls = pgTable('payrolls', {
  id: uuid('id').primaryKey().defaultRandom(),
  companyId: uuid('company_id').notNull(),
  employeeId: uuid('employee_id').notNull(),
  
  period: varchar('period', { length: 7 }), // YYYY-MM
  basicSalary: decimal('basic_salary', { precision: 19, scale: 2 }),
  bonuses: decimal('bonuses', { precision: 19, scale: 2 }),
  deductions: decimal('deductions', { precision: 19, scale: 2 }),
  netSalary: decimal('net_salary', { precision: 19, scale: 2 }),
  
  status: varchar('status', { length: 20 }),
  paymentDate: date('payment_date'),
  
  createdAt: timestamp('created_at').defaultNow(),
});
