import { products } from '@arkelythex/persistence/schema';
import { db } from '@arkelythex/persistence/client';
import { and, desc, eq } from '@arkelythex/persistence/query';

type ProductTaxType = 'GRAVADO' | 'EXONERADO' | 'INAFECTO';
type ProductRow = typeof products.$inferSelect;

export interface ProductCreateInput {
  companyId: string;
  sku: string;
  name: string;
  description?: string;
  category?: string;
  unitPrice: string;
  costPrice?: string;
  taxType?: ProductTaxType;
  unit?: string;
  stockQuantity?: string;
}

export interface ProductUpdateInput {
  sku?: string;
  name?: string;
  description?: string;
  category?: string;
  unitPrice?: string;
  costPrice?: string;
  taxType?: ProductTaxType;
  unit?: string;
  stockQuantity?: string;
}

function nullableString(value: string | undefined): string | null {
  return value && value.trim().length > 0 ? value : null;
}

/**
 * Products application service (CRUD + list).
 *
 * @example
 * ```ts
 * const products = await ProductsService.list('cmp_123');
 * ```
 */
export class ProductsService {
  /**
   * Crea un nuevo producto.
   */
  static async create(data: ProductCreateInput): Promise<ProductRow> {
    const [newProduct] = await db
      .insert(products)
      .values({
        companyId: data.companyId,
        sku: data.sku,
        name: data.name,
        description: nullableString(data.description),
        category: nullableString(data.category),
        unitPrice: data.unitPrice,
        costPrice: nullableString(data.costPrice),
        taxType: data.taxType || 'GRAVADO',
        unit: data.unit || 'UND',
        stockQuantity: data.stockQuantity || '0',
      })
      .returning();

    if (!newProduct) {
      throw new Error('No se pudo crear el producto');
    }

    return newProduct;
  }

  /**
   * Lista productos activos de una empresa.
   */
  static async list(companyId?: string): Promise<ProductRow[]> {
    const whereClause = companyId
      ? and(eq(products.companyId, companyId), eq(products.isActive, true))
      : eq(products.isActive, true);

    return await db.query.products.findMany({
      where: whereClause,
      orderBy: [desc(products.createdAt)],
    });
  }

  /**
   * Obtiene un producto activo por ID.
   */
  static async getById(id: string): Promise<ProductRow | null> {
    const row = await db.query.products.findFirst({
      where: and(eq(products.id, id), eq(products.isActive, true)),
    });
    return row ?? null;
  }

  /**
   * Obtiene un producto activo por SKU.
   */
  static async getBySku(companyId: string, sku: string): Promise<ProductRow | null> {
    const row = await db.query.products.findFirst({
      where: and(
        eq(products.companyId, companyId),
        eq(products.sku, sku),
        eq(products.isActive, true),
      ),
    });
    return row ?? null;
  }

  /**
   * Actualiza un producto.
   */
  static async update(id: string, data: ProductUpdateInput): Promise<ProductRow> {
    const [updatedProduct] = await db
      .update(products)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(products.id, id))
      .returning();

    if (!updatedProduct) {
      throw new Error('Producto no encontrado');
    }

    return updatedProduct;
  }

  /**
   * Elimina un producto (soft delete con `isActive = false`).
   */
  static async delete(id: string): Promise<ProductRow> {
    const [deletedProduct] = await db
      .update(products)
      .set({
        isActive: false,
        updatedAt: new Date(),
      })
      .where(eq(products.id, id))
      .returning();

    if (!deletedProduct) {
      throw new Error('Producto no encontrado');
    }

    return deletedProduct;
  }
}
