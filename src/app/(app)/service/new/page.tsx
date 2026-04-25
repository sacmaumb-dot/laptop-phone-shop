import { prisma } from "@/lib/prisma";
import { ServiceForm } from "../service-form";

export default async function NewServicePage() {
  const [customers, technicians] = await Promise.all([
    prisma.customer.findMany({ orderBy: { name: "asc" }, take: 500 }),
    prisma.user.findMany({
      where: { active: true, role: { in: ["technician", "admin"] } },
      orderBy: { name: "asc" },
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
      />
    </div>
  );
}
