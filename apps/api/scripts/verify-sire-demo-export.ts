import {
  db,
  desc,
  eq,
  invoices,
} from '@arkelythex/infrastructure';
import { SIREService } from '../src/services/sire.service';

const DEMO_COMPANY_ID = '00000000-0000-0000-0000-000000000001';

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

async function resolveLatestPeriod() {
  const [latestInvoice] = await db.query.invoices.findMany({
    where: eq(invoices.companyId, DEMO_COMPANY_ID),
    orderBy: [desc(invoices.issueDate)],
    limit: 1,
  });

  assert(
    latestInvoice?.issueDate,
    'No seeded invoices found for the demo company. Run `bun run seed:dashboard:demo` first.',
  );

  return {
    year: latestInvoice.issueDate.getFullYear(),
    month: latestInvoice.issueDate.getMonth() + 1,
  };
}

async function verifyRegister(kind: 'sales' | 'purchases', year: number, month: number) {
  const generator =
    kind === 'sales'
      ? SIREService.generateSalesRegister.bind(SIREService)
      : SIREService.generatePurchasesRegister.bind(SIREService);

  const txt = await generator({
    year,
    month,
    companyId: DEMO_COMPANY_ID,
    format: 'TXT',
  });

  assert(typeof txt === 'string', `${kind} TXT export must be a string`);

  const validation = SIREService.validateSIREFormat(
    txt,
    kind === 'sales' ? 'sales' : 'purchases',
  );

  assert(validation.isValid, `${kind} TXT export failed structural validation`);
  assert(
    validation.recordCount > 0,
    `${kind} TXT export must include at least one record for the seeded period`,
  );

  const excel = await generator({
    year,
    month,
    companyId: DEMO_COMPANY_ID,
    format: 'EXCEL',
  });

  assert(Buffer.isBuffer(excel), `${kind} Excel export must be a Buffer`);
  assert(excel.length > 1_000, `${kind} Excel export buffer is unexpectedly small`);

  return {
    recordCount: validation.recordCount,
    warningCount: validation.warnings.length,
    excelBytes: excel.length,
  };
}

export async function verifySireDemoExport() {
  const { year, month } = await resolveLatestPeriod();
  const sales = await verifyRegister('sales', year, month);
  const purchases = await verifyRegister('purchases', year, month);

  console.log('✅ SIRE demo export verified');
  console.log(JSON.stringify({
    companyId: DEMO_COMPANY_ID,
    period: `${year}-${String(month).padStart(2, '0')}`,
    sales,
    purchases,
  }, null, 2));
}

if (import.meta.main) {
  verifySireDemoExport().catch((error) => {
    console.error('❌ SIRE demo export verification failed');
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
