import { prisma } from "@/lib/prisma";
import { requireShopSession } from "@/lib/auth";
import { WorkspaceClient } from "./workspace-client";

export default async function PosPage() {
  const session = await requireShopSession();
  const shopId = session.shopId;
  const [products, categories, customers, technicians] = await Promise.all([
    prisma.product.findMany({
      where: { shopId, isActive: true },
      orderBy: { name: "asc" },
      include: { category: true },
    }),
    prisma.category.findMany({ where: { shopId }, orderBy: { name: "asc" } }),
    prisma.customer.findMany({
      where: { shopId },
      orderBy: { name: "asc" },
      take: 200,
    }),
    prisma.user.findMany({
      where: { shopId, role: { in: ["technician", "admin"] }, active: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  return (
    <div className="space-y-3">
      <WorkspaceClient
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
        technicians={technicians}
      />
    </div>
  );
}
