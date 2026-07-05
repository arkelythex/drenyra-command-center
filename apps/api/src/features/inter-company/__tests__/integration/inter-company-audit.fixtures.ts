import { randomUUID } from 'node:crypto';
import {
  companies,
  db,
  economicGroups,
  eq,
  interCompanyTransactions,
  users,
} from '@drenyra/infrastructure';

export type InterCompanyAuditFixture = {
  userId: string;
  economicGroupId: string;
  companyAId: string;
  companyBId: string;
  txBeforeStartId: string;
  txAtStartId: string;
  txTieAId: string;
  txTieBId: string;
};

export async function createInterCompanyAuditFixture(): Promise<InterCompanyAuditFixture> {
  const userId = randomUUID();
  const economicGroupId = randomUUID();
  const companyAId = randomUUID();
  const companyBId = randomUUID();
  const txBeforeStartId = randomUUID();
  const txAtStartId = randomUUID();
  const txTieAId = randomUUID();
  const txTieBId = randomUUID();
  const rucSuffix = randomUUID().replace(/-/g, '').slice(0, 9);
  const groupCode = `ITG-${randomUUID().replace(/-/g, '').slice(0, 8)}`;

  await db.insert(users).values({
    id: userId,
    email: `itg-${userId}@ark.local`,
    password: 'x',
    name: 'Integration User',
    role: 'ADMIN',
    isActive: true,
  });

  await db.insert(economicGroups).values({
    id: economicGroupId,
    ownerId: userId,
    groupName: 'Integration Group',
    groupCode,
    isActive: true,
  });

  await db.insert(companies).values([
    {
      id: companyAId,
      ownerId: userId,
      economicGroupId,
      ruc: `20${rucSuffix}`,
      businessName: 'Integration Company A',
      tradeName: 'ICA',
      isActive: true,
    },
    {
      id: companyBId,
      ownerId: userId,
      economicGroupId,
      ruc: `21${rucSuffix}`,
      businessName: 'Integration Company B',
      tradeName: 'ICB',
      isActive: true,
    },
  ]);

  await db.insert(interCompanyTransactions).values([
    {
      id: txBeforeStartId,
      economicGroupId,
      fromCompanyId: companyAId,
      toCompanyId: companyBId,
      concept: 'Boundary Before Start',
      amount: '100.00',
      currency: 'PEN',
      taxType: 'GRAVADO',
      igvAmount: '18.00',
      detractionAmount: '0.00',
      detractionRate: '0.00',
      status: 'RECONCILED',
      createdAt: new Date('2026-01-01T04:59:59.000Z'),
    },
    {
      id: txAtStartId,
      economicGroupId,
      fromCompanyId: companyAId,
      toCompanyId: companyBId,
      concept: 'Boundary At Start',
      amount: '120.00',
      currency: 'PEN',
      taxType: 'GRAVADO',
      igvAmount: '21.60',
      detractionAmount: '0.00',
      detractionRate: '0.00',
      status: 'RECONCILED',
      createdAt: new Date('2026-01-01T05:00:00.000Z'),
    },
    {
      id: txTieAId,
      economicGroupId,
      fromCompanyId: companyAId,
      toCompanyId: companyBId,
      concept: 'Tie A',
      amount: '150.00',
      currency: 'PEN',
      taxType: 'GRAVADO',
      igvAmount: '27.00',
      detractionAmount: '0.00',
      detractionRate: '0.00',
      status: 'RECONCILED',
      createdAt: new Date('2026-01-01T07:00:00.000Z'),
    },
    {
      id: txTieBId,
      economicGroupId,
      fromCompanyId: companyAId,
      toCompanyId: companyBId,
      concept: 'Tie B',
      amount: '150.00',
      currency: 'PEN',
      taxType: 'GRAVADO',
      igvAmount: '27.00',
      detractionAmount: '0.00',
      detractionRate: '0.00',
      status: 'RECONCILED',
      createdAt: new Date('2026-01-01T07:00:00.000Z'),
    },
  ]);

  return {
    userId,
    economicGroupId,
    companyAId,
    companyBId,
    txBeforeStartId,
    txAtStartId,
    txTieAId,
    txTieBId,
  };
}

export async function cleanupInterCompanyAuditFixture(
  fixture: InterCompanyAuditFixture
): Promise<void> {
  for (const txId of [
    fixture.txBeforeStartId,
    fixture.txAtStartId,
    fixture.txTieAId,
    fixture.txTieBId,
  ]) {
    await db
      .delete(interCompanyTransactions)
      .where(eq(interCompanyTransactions.id, txId));
  }

  await db.delete(companies).where(eq(companies.id, fixture.companyAId));
  await db.delete(companies).where(eq(companies.id, fixture.companyBId));
  await db
    .delete(economicGroups)
    .where(eq(economicGroups.id, fixture.economicGroupId));
  await db.delete(users).where(eq(users.id, fixture.userId));
}
