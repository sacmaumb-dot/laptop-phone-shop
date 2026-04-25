import { prisma } from "@/lib/prisma";
import { PosClient } from "./pos-client";

export default async function PosPage() {
  const [products, categories, customers] = await Promise.all([
    prisma.product.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      include: { category: true },
    }),
    prisma.category.findMany({ orderBy: { name: "asc" } }),
    prisma.customer.findMany({
      orderBy: { name: "asc" },
      take: 200,
    }),
  ]);

  return (
    <PosClient
      products={products.map((p) => ({
        id: p.id,
        sku: p.sku,
        name: p.name,
        brand: p.brand,
        price: p.price,
        stock: p.stock,
        categoryType: p.category.type,
        categoryId: p.categoryId,
      }))}
      categories={categories}
      customers={customers.map((c) => ({
        id: c.id,
        name: c.name,
        phone: c.phone,
        code: c.code,
      }))}
    />
  );
}
