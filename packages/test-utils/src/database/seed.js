export async function seedTestData(db, data) {
    if (data.companies && data.companies.length > 0) {
        await seedCompanies(db, data.companies);
    }
    if (data.users && data.users.length > 0) {
        await seedUsers(db, data.users);
    }
    if (data.products && data.products.length > 0) {
        await seedProducts(db, data.products);
    }
    if (data.rawSql && data.rawSql.length > 0) {
        for (const sql of data.rawSql) {
            await db.execute(sql);
        }
    }
}
async function seedCompanies(db, companies) {
    if (!companies)
        return;
    for (const company of companies) {
        await db.execute(`INSERT INTO companies (name, ruc, subscription_tier, created_at)
       VALUES ('${company.name}', '${company.ruc}', '${company.subscriptionTier}', NOW())
       ON CONFLICT (ruc) DO NOTHING`);
    }
}
async function seedUsers(db, users) {
    if (!users)
        return;
    for (const user of users) {
        await db.execute(`INSERT INTO users (email, password_hash, role, created_at)
       VALUES ('${user.email}', '${user.password}', '${user.role}', NOW())
       ON CONFLICT (email) DO NOTHING`);
    }
}
async function seedProducts(db, products) {
    if (!products)
        return;
    for (const product of products) {
        const currency = product.currency || "PEN";
        const priceCents = Math.round(product.price * 100);
        await db.execute(`INSERT INTO products (name, sku, price_cents, currency, created_at)
       VALUES ('${product.name}', '${product.sku}', ${priceCents}, '${currency}', NOW())
       ON CONFLICT (sku) DO NOTHING`);
    }
}
export const seedScenarios = {
    minimal: {
        users: [
            {
                email: "admin@test.drenyrafounders.com",
                password: "hashed_test_password_123",
                role: "admin",
            },
        ],
        companies: [
            {
                name: "Test Company SAC",
                ruc: "20601234567",
                subscriptionTier: "free",
            },
        ],
    },
    full: {
        users: [
            {
                email: "admin@test.drenyrafounders.com",
                password: "hashed_test_password_123",
                role: "admin",
            },
            {
                email: "accountant@test.drenyrafounders.com",
                password: "hashed_test_password_456",
                role: "accountant",
            },
        ],
        companies: [
            {
                name: "Test Company SAC",
                ruc: "20601234567",
                subscriptionTier: "pro",
            },
        ],
        products: [
            {
                name: "Producto de prueba",
                sku: "TEST-001",
                price: 100.0,
                currency: "PEN",
            },
            {
                name: "Servicio de prueba",
                sku: "TEST-002",
                price: 250.5,
                currency: "PEN",
            },
        ],
    },
    multiTenant: {
        users: [
            {
                email: "admin-a@test.drenyrafounders.com",
                password: "hashed_test_password_a",
                role: "admin",
            },
            {
                email: "admin-b@test.drenyrafounders.com",
                password: "hashed_test_password_b",
                role: "admin",
            },
        ],
        companies: [
            {
                name: "Tenant A SAC",
                ruc: "20601234567",
                subscriptionTier: "free",
            },
            {
                name: "Tenant B SAC",
                ruc: "20609876543",
                subscriptionTier: "enterprise",
            },
        ],
    },
};
//# sourceMappingURL=seed.js.map