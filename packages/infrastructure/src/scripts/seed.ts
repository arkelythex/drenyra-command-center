import { db } from '@arkelythex/persistence/client';
import { users, companies, transactions, businessPartners, accounts, categories } from '@arkelythex/persistence/schema';
import { v4 as uuidv4 } from 'uuid';

type SeedAccountRef = {
  id: string;
  currency: typeof accounts.$inferInsert.currency;
};

type SeedCategoryRef = {
  id: string;
  type: typeof categories.$inferInsert.type;
};

type SeedPartnerRef = {
  id: string;
  type: typeof transactions.$inferInsert.type;
};

const main = async () => {
  console.log("🌱 Limpiando base de datos...");
  // Orden inverso por FKs
  await db.delete(transactions);
  await db.delete(accounts);
  await db.delete(categories);
  await db.delete(businessPartners);
  await db.delete(companies);
  await db.delete(users);

  console.log("🌱 Iniciando siembra de datos (Banking Edition)...");

  // 1. Crear Usuario y Empresa
  const userId = uuidv4();
  await db.insert(users).values({
    id: userId,
    email: "demo@arkelythexfounders.com",
    password: "demo-demo-demo",
    name: "CFO Arkelythex",
  });

  const companyId = uuidv4();
  await db.insert(companies).values({
    id: companyId,
    ownerId: userId,
    ruc: "20609999999",
    businessName: "ARKELYTHEX TECHNOLOGIES S.A.C.",
    tradeName: "Arkelythex",
    isActive: true,
  });

  // 2. Crear Cuentas Bancarias (Treasury)
  const accountData = [
    { name: "BCP Corriente Soles", type: "BANK", currency: "PEN", bankName: "BCP", accountNumber: "193-1234567-0-99", balance: "15400.00" },
    { name: "Interbank Dólares", type: "BANK", currency: "USD", bankName: "Interbank", accountNumber: "200-3000500090", balance: "5200.00" },
    { name: "AMEX Corporate", type: "CREDIT", currency: "USD", bankName: "Interbank", accountNumber: "**** 4001", balance: "-1200.00" },
  ];

  const accountIds: SeedAccountRef[] = [];
  for (const acc of accountData) {
    const id = uuidv4();
    await db.insert(accounts).values({
        id,
        companyId,
        ...acc,
        currentBalance: acc.balance
    });
    accountIds.push({ id, currency: acc.currency });
  }

  // 3. Crear Plan de Cuentas (Categorías)
  const categoryData = [
    { name: "Ingresos por Servicios", type: "INCOME", color: "emerald" },
    { name: "Nómina y Salarios", type: "EXPENSE", color: "sky" },
    { name: "Software & SaaS", type: "EXPENSE", color: "violet" },
    { name: "Marketing & Ads", type: "EXPENSE", color: "orange" },
    { name: "Oficina y Servicios", type: "EXPENSE", color: "slate" },
    { name: "Impuestos (SUNAT)", type: "EXPENSE", color: "red" },
  ];

  const categoryIds: SeedCategoryRef[] = [];
  for (const cat of categoryData) {
    const id = uuidv4();
    await db.insert(categories).values({
        id,
        companyId,
        ...cat
    });
    categoryIds.push({ id, type: cat.type });
  }

  // 4. Crear Partners
  const partners = [
    { name: "AMAZON WEB SERVICES", ruc: "EXT-0001", type: "EXPENSE", logo: "https://logo.clearbit.com/aws.amazon.com" },
    { name: "GOOGLE CLOUD", ruc: "EXT-0002", type: "EXPENSE", logo: "https://logo.clearbit.com/cloud.google.com" },
    { name: "SUNAT", ruc: "20000000001", type: "EXPENSE", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5a/Sunat_Logo.svg/1200px-Sunat_Logo.svg.png" },
    { name: "CLIENTE MINERA X", ruc: "20100000000", type: "INCOME", logo: null },
    { name: "UBER RIDES", ruc: "EXT-0003", type: "EXPENSE", logo: "https://logo.clearbit.com/uber.com" },
  ];

  const partnerIds: SeedPartnerRef[] = [];
  for (const p of partners) {
    const pid = uuidv4();
    await db.insert(businessPartners).values({
        id: pid,
        companyId,
        taxId: p.ruc,
        legalName: p.name,
        logoUrl: p.logo,
        complianceScore: 100
    });
    partnerIds.push({ id: pid, type: p.type });
  }

  // 5. Crear Transacciones (Últimos 60 días)
  const transactionsData: Array<typeof transactions.$inferInsert> = [];
  const now = new Date();

  for (let i = 0; i < 50; i++) {
    const isIncome = Math.random() > 0.7; // 30% income
    const partner = partnerIds.find(p => p.type === (isIncome ? 'INCOME' : 'EXPENSE'));
    
    // Asignar cuenta random
    const account = accountIds[Math.floor(Math.random() * accountIds.length)];
    
    // Asignar categoría random compatible
    const category = categoryIds.find(c => c.type === (isIncome ? 'INCOME' : 'EXPENSE'));

    if (!partner || !category) {
      continue;
    }

    const amountBase = Math.floor(Math.random() * 2000) + 50;
    const igv = Number((amountBase * 0.18).toFixed(2));
    const total = amountBase + igv;
    
    const date = new Date();
    date.setDate(now.getDate() - Math.floor(Math.random() * 60));

    transactionsData.push({
        companyId,
        partnerId: partner.id,
        accountId: account.id,
        categoryId: category.id,
        
        type: isIncome ? 'INCOME' : 'EXPENSE',
        documentType: 'MOVIMIENTO_BANCARIO',
        
        issueDate: date,
        currency: account.currency, // Match account currency
        
        subtotal: amountBase.toString(),
        igvAmount: igv.toString(),
        totalAmount: total.toString(),
        
        status: 'ACCEPTED'
    });
  }

  await db.insert(transactions).values(transactionsData);
  
  console.log("✅ Seed completado: Cuentas, Categorías y Transacciones listas.");
  process.exit(0);
};

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
