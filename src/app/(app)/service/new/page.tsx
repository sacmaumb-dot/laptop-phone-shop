import { prisma } from "@/lib/prisma";
import { requireShopSession } from "@/lib/auth";
import { ServiceForm } from "../service-form";

export default async function NewServicePage() {
  const session = await requireShopSession();
  const shopId = session.shopId;
  const [customers, technicians, products] = await Promise.all([
    prisma.customer.findMany({ where: { shopId }, orderBy: { name: "asc" }, take: 500 }),
    prisma.user.findMany({
      where: { shopId, active: true, role: { in: ["technician", "admin"] } },
      orderBy: { name: "asc" },
    }),
    prisma.product.findMany({
      where: { shopId, isActive: true },
      orderBy: { name: "asc" },
      include: { category: true },
    }),
  ]);
  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Tạo phiếu sửa chữa mới
        </h1>
        <p className="text-sm text-muted-foreground">
          Nhập thông tin khách hàng và thiết bị nhận sửa.
        </p>
      </div>
      <ServiceForm
        customers={customers.map((c) => ({
          id: c.id,
          code: c.code,
          name: c.name,
          phone: c.phone,
        }))}
        technicians={technicians.map((t) => ({ id: t.id, name: t.name }))}
        products={products.map((p) => ({
          id: p.id,
          sku: p.sku,
          name: p.name,
          price: p.price,
          categoryType: p.category.type,
        }))}
      />
    </div>
  );
}
