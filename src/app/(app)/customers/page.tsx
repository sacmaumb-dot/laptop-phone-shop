import { prisma } from "@/lib/prisma";
import { requireShopSession } from "@/lib/auth";
import type { Prisma } from "@/generated/prisma";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  UserPlus,
  TrendingUp,
  Phone,
  Mail,
  MapPin,
  Wrench,
  ShoppingCart,
} from "lucide-react";
import { formatVND, formatDate } from "@/lib/format";
import { CustomerSearch } from "./customer-search";
import { NewCustomerButton, CustomerRowActions } from "./customer-actions";
import Link from "next/link";

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const session = await requireShopSession();
  const shopId = session.shopId;
  const sp = await searchParams;
  const where: Prisma.CustomerWhereInput = { shopId };
  if (sp.q) {
    where.OR = [
      { name: { contains: sp.q } },
      { phone: { contains: sp.q } },
      { code: { contains: sp.q } },
      { email: { contains: sp.q } },
    ];
  }

  const [customers, totalCount, monthCount] = await Promise.all([
    prisma.customer.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        sales: { select: { total: true } },
        serviceTickets: { select: { id: true } },
      },
      take: 200,
    }),
    prisma.customer.count({ where: { shopId } }),
    prisma.customer.count({
      where: {
        shopId,
        createdAt: {
          gte: new Date(new Date().setDate(new Date().getDate() - 30)),
        },
      },
    }),
  ]);

  const totalSpent = customers.reduce(
    (s, c) => s + c.sales.reduce((ss, x) => ss + x.total, 0),
    0,
  );
  const totalSC = customers.reduce((s, c) => s + c.serviceTickets.length, 0);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Khách hàng</h1>
          <p className="text-sm text-muted-foreground">
            Quản lý thông tin khách hàng và lịch sử giao dịch.
          </p>
        </div>
        <NewCustomerButton />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Kpi
          icon={<Users className="size-4" />}
          label="Tổng khách hàng"
          value={String(totalCount)}
        />
        <Kpi
          icon={<UserPlus className="size-4" />}
          label="Mới (30 ngày)"
          value={String(monthCount)}
          tone="primary"
        />
        <Kpi
          icon={<TrendingUp className="size-4" />}
          label="Tổng chi tiêu"
          value={formatVND(totalSpent)}
        />
        <Kpi
          icon={<Wrench className="size-4" />}
          label="Phiếu sửa chữa"
          value={String(totalSC)}
        />
      </div>

      <Card>
        <CardHeader className="border-b pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="size-4" />
            Danh sách ({customers.length})
          </CardTitle>
          <CustomerSearch />
        </CardHeader>
        <CardContent className="p-3">
          {customers.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted-foreground">
              Chưa có khách hàng nào.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2">
              {customers.map((c) => {
                const spent = c.sales.reduce((s, x) => s + x.total, 0);
                const initials = c.name
                  .split(" ")
                  .filter(Boolean)
                  .slice(-2)
                  .map((p) => p[0])
                  .join("")
                  .toUpperCase();
                return (
                  <div
                    key={c.id}
                    className="rounded-md border bg-card hover:border-primary/60 hover:shadow-sm transition-all p-3 group relative"
                  >
                    <Link
                      href={`/customers/${c.id}`}
                      className="absolute inset-0"
                      aria-label={`Xem ${c.name}`}
                    />
                    <div className="absolute right-1.5 top-1.5 z-10 opacity-0 group-hover:opacity-100 transition">
                      <CustomerRowActions
                        customer={{
                          id: c.id,
                          name: c.name,
                          phone: c.phone,
                          email: c.email,
                          address: c.address,
                          note: c.note,
                        }}
                      />
                    </div>
                    <div className="flex items-start gap-2.5 relative pointer-events-none">
                      <div className="size-10 shrink-0 rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold text-sm">
                        {initials || <Users className="size-4" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-medium text-sm truncate">
                            {c.name}
                          </span>
                          <Badge
                            variant="outline"
                            className="text-[9px] h-4 px-1 font-mono"
                          >
                            {c.code}
                          </Badge>
                        </div>
                        <div className="text-[11px] text-muted-foreground flex items-center gap-1 font-mono">
                          <Phone className="size-3" />
                          {c.phone}
                        </div>
                        {c.email && (
                          <div className="text-[11px] text-muted-foreground flex items-center gap-1 truncate">
                            <Mail className="size-3 shrink-0" />
                            <span className="truncate">{c.email}</span>
                          </div>
                        )}
                        {c.address && (
                          <div className="text-[11px] text-muted-foreground flex items-center gap-1 truncate">
                            <MapPin className="size-3 shrink-0" />
                            <span className="truncate">{c.address}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="mt-2.5 grid grid-cols-3 gap-1.5 relative pointer-events-none">
                      <Stat
                        icon={<ShoppingCart className="size-3" />}
                        label="HD"
                        value={String(c.sales.length)}
                      />
                      <Stat
                        icon={<Wrench className="size-3" />}
                        label="HDSC"
                        value={String(c.serviceTickets.length)}
                      />
                      <Stat
                        icon={<TrendingUp className="size-3" />}
                        label="Chi tiêu"
                        value={
                          spent > 0 ? formatVND(spent).replace(" ₫", "") : "0"
                        }
                        tone="primary"
                      />
                    </div>
                    <div className="mt-2 text-[10px] text-muted-foreground relative pointer-events-none">
                      Tham gia {formatDate(c.createdAt)}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Kpi({
  icon,
  label,
  value,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  tone?: "primary";
}) {
  return (
    <Card>
      <CardContent className="p-4 flex items-center gap-3">
        <div
          className={`size-10 rounded-md flex items-center justify-center ${
            tone === "primary"
              ? "bg-primary/10 text-primary"
              : "bg-muted text-muted-foreground"
          }`}
        >
          {icon}
        </div>
        <div className="min-w-0">
          <div className="text-[11px] text-muted-foreground uppercase tracking-wide">
            {label}
          </div>
          <div className="text-base font-bold truncate">{value}</div>
        </div>
      </CardContent>
    </Card>
  );
}

function Stat({
  icon,
  label,
  value,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  tone?: "primary";
}) {
  return (
    <div
      className={`rounded border px-1.5 py-1 ${
        tone === "primary" ? "bg-primary/5 border-primary/20" : "bg-muted/30"
      }`}
    >
      <div className="text-[9px] text-muted-foreground uppercase tracking-wide flex items-center gap-0.5">
        {icon}
        {label}
      </div>
      <div
        className={`text-xs font-semibold truncate ${
          tone === "primary" ? "text-primary" : ""
        }`}
      >
        {value}
      </div>
    </div>
  );
}
