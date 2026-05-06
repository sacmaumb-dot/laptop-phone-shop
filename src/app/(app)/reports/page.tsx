import { prisma } from "@/lib/prisma";
import { requireShopSession } from "@/lib/auth";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatVND, formatNumber } from "@/lib/format";
import {
  TrendingUp,
  ShoppingCart,
  Wrench,
  Users,
  BarChart3,
} from "lucide-react";
import { RevenueChart } from "@/components/revenue-chart";
import { ReportTabs } from "./report-tabs";
import {
  Reconciliation,
  type ReconRow,
  type ReconStaff,
} from "./reconciliation";

const PAYMENT_LABELS: Record<string, string> = {
  cash: "Tiền mặt",
  card: "Thẻ",
  transfer: "Chuyển khoản",
  wallet: "Ví ĐT",
};

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; date?: string }>;
}) {
  const session = await requireShopSession();
  const shopId = session.shopId;
  const sp = await searchParams;
  const tab = sp.tab === "shifts" ? "shifts" : "overview";
  const dateStr = sp.date || new Date().toISOString().slice(0, 10);

  if (tab === "shifts") {
    return (
      <ReportsLayout active="shifts">
        <ShiftsTab date={dateStr} shopId={shopId} />
      </ReportsLayout>
    );
  }
  return (
    <ReportsLayout active="overview">
      <OverviewTab shopId={shopId} />
    </ReportsLayout>
  );
}

function ReportsLayout({
  active,
  children,
}: {
  active: "overview" | "shifts";
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Báo cáo</h1>
        <p className="text-sm text-muted-foreground">
          Tổng hợp doanh thu và đối soát ca trực nhân viên.
        </p>
      </div>
      <ReportTabs active={active} />
      {children}
    </div>
  );
}

async function ShiftsTab({ date, shopId }: { date: string; shopId: string }) {
  // Build day range from local date (server-local = same as TZ used elsewhere)
  const start = new Date(date + "T00:00:00");
  const end = new Date(start);
  end.setDate(end.getDate() + 1);

  const [sales, tickets, users] = await Promise.all([
    prisma.sale.findMany({
      where: { shopId, createdAt: { gte: start, lt: end }, status: "paid" },
      include: { customer: true, user: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma.serviceTicket.findMany({
      where: {
        shopId,
        deliveredAt: { gte: start, lt: end },
        status: "delivered",
      },
      include: { customer: true, createdBy: true },
      orderBy: { deliveredAt: "asc" },
    }),
    prisma.user.findMany({ where: { shopId }, orderBy: { name: "asc" } }),
  ]);

  const userMap = new Map(users.map((u) => [u.id, u]));
  const grouped = new Map<string, ReconRow[]>();

  for (const s of sales) {
    const arr = grouped.get(s.userId) ?? [];
    arr.push({
      type: "sale",
      id: s.id,
      code: s.code,
      createdAt: s.createdAt.toISOString(),
      customerName: s.customer?.name ?? null,
      paymentMethod: s.paymentMethod,
      total: s.total,
    });
    grouped.set(s.userId, arr);
  }
  for (const t of tickets) {
    const uid = t.createdById;
    const arr = grouped.get(uid) ?? [];
    arr.push({
      type: "service",
      id: t.id,
      code: t.code,
      createdAt: (t.deliveredAt ?? t.createdAt).toISOString(),
      customerName: t.customer?.name ?? null,
      paymentMethod: t.paymentMethod || "cash",
      total: t.finalCost,
    });
    grouped.set(uid, arr);
  }

  const staff: ReconStaff[] = Array.from(grouped.entries())
    .map(([uid, rows]) => {
      const u = userMap.get(uid);
      return {
        id: uid,
        name: u?.name ?? "—",
        email: u?.email ?? "",
        role: u?.role ?? "",
        rows: rows.sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
      };
    })
    .sort((a, b) => b.rows.length - a.rows.length);

  const total = sales.reduce((s, x) => s + x.total, 0) +
    tickets.reduce((s, x) => s + x.finalCost, 0);
  const cashTotal =
    sales
      .filter((s) => s.paymentMethod === "cash")
      .reduce((s, x) => s + x.total, 0) +
    tickets
      .filter((t) => (t.paymentMethod || "cash") === "cash")
      .reduce((s, x) => s + x.finalCost, 0);
  const transferTotal =
    sales
      .filter((s) => s.paymentMethod === "transfer")
      .reduce((s, x) => s + x.total, 0) +
    tickets
      .filter((t) => t.paymentMethod === "transfer")
      .reduce((s, x) => s + x.finalCost, 0);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Kpi
          label="Tổng doanh thu ngày"
          value={formatVND(total)}
          icon={<TrendingUp className="size-4" />}
          tone="primary"
        />
        <Kpi
          label="Tiền mặt"
          value={formatVND(cashTotal)}
          icon={<ShoppingCart className="size-4" />}
        />
        <Kpi
          label="Chuyển khoản"
          value={formatVND(transferTotal)}
          icon={<Wrench className="size-4" />}
        />
        <Kpi
          label="Số nhân viên trực"
          value={String(staff.length)}
          icon={<Users className="size-4" />}
        />
      </div>
      <Reconciliation date={date} staff={staff} />
    </div>
  );
}

async function OverviewTab({ shopId }: { shopId: string }) {
  const now = new Date();
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const last30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [
    todayRevenue,
    monthRevenue,
    monthServiceRevenue,
    last30Sales,
    topProducts,
    paymentBreakdown,
  ] = await Promise.all([
    prisma.sale.aggregate({
      where: { shopId, createdAt: { gte: today }, status: "paid" },
      _sum: { total: true },
    }),
    prisma.sale.aggregate({
      where: { shopId, createdAt: { gte: startOfMonth }, status: "paid" },
      _sum: { total: true },
      _count: true,
    }),
    prisma.serviceTicket.aggregate({
      where: {
        shopId,
        deliveredAt: { gte: startOfMonth },
        status: "delivered",
      },
      _sum: { finalCost: true },
      _count: true,
    }),
    prisma.sale.findMany({
      where: { shopId, createdAt: { gte: last30 }, status: "paid" },
      orderBy: { createdAt: "asc" },
      select: { createdAt: true, total: true },
    }),
    prisma.saleItem.groupBy({
      by: ["productId"],
      where: { sale: { shopId, createdAt: { gte: startOfMonth }, status: "paid" } },
      _sum: { quantity: true, subtotal: true },
      orderBy: { _sum: { subtotal: "desc" } },
      take: 10,
    }),
    prisma.sale.groupBy({
      by: ["paymentMethod"],
      where: { shopId, createdAt: { gte: startOfMonth }, status: "paid" },
      _sum: { total: true },
      _count: true,
    }),
  ]);

  const productIds = topProducts.map((p) => p.productId);
  const productDetails = await prisma.product.findMany({
    where: { id: { in: productIds }, shopId },
  });
  const productMap = Object.fromEntries(productDetails.map((p) => [p.id, p]));

  const revenueByDay = new Map<string, number>();
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    revenueByDay.set(d.toISOString().slice(0, 10), 0);
  }
  for (const s of last30Sales) {
    const key = s.createdAt.toISOString().slice(0, 10);
    revenueByDay.set(key, (revenueByDay.get(key) || 0) + s.total);
  }
  const chartData = Array.from(revenueByDay.entries()).map(([date, total]) => ({
    date,
    total,
  }));

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard
          icon={<TrendingUp className="size-5" />}
          label="Doanh thu hôm nay"
          value={formatVND(todayRevenue._sum.total || 0)}
        />
        <KpiCard
          icon={<ShoppingCart className="size-5" />}
          label={`Doanh thu tháng (${monthRevenue._count} đơn)`}
          value={formatVND(monthRevenue._sum.total || 0)}
        />
        <KpiCard
          icon={<Wrench className="size-5" />}
          label={`Sửa chữa tháng (${monthServiceRevenue._count} phiếu)`}
          value={formatVND(monthServiceRevenue._sum.finalCost || 0)}
        />
        <KpiCard
          icon={<BarChart3 className="size-5" />}
          label="TB doanh thu / đơn"
          value={formatVND(
            monthRevenue._count
              ? (monthRevenue._sum.total || 0) / monthRevenue._count
              : 0,
          )}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Doanh thu 30 ngày qua</CardTitle>
          <CardDescription className="text-xs">
            Tổng doanh thu mỗi ngày trong 30 ngày trở lại đây.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RevenueChart data={chartData} />
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Top 10 sản phẩm bán chạy
            </CardTitle>
            <CardDescription className="text-xs">
              Theo doanh thu trong tháng.
            </CardDescription>
          </CardHeader>
          <CardContent className="px-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">#</TableHead>
                  <TableHead>Sản phẩm</TableHead>
                  <TableHead className="text-right">SL</TableHead>
                  <TableHead className="text-right">Doanh thu</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topProducts.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="text-center py-6 text-muted-foreground"
                    >
                      Chưa có dữ liệu
                    </TableCell>
                  </TableRow>
                )}
                {topProducts.map((p, idx) => {
                  const prod = productMap[p.productId];
                  return (
                    <TableRow key={p.productId}>
                      <TableCell className="text-muted-foreground">
                        {idx + 1}
                      </TableCell>
                      <TableCell>
                        <div className="font-medium text-sm">
                          {prod?.name || "—"}
                        </div>
                        <div className="text-xs text-muted-foreground font-mono">
                          {prod?.sku}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        {formatNumber(p._sum.quantity || 0)}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatVND(p._sum.subtotal || 0)}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Phương thức thanh toán</CardTitle>
            <CardDescription className="text-xs">
              Tỉ trọng doanh thu theo phương thức trong tháng.
            </CardDescription>
          </CardHeader>
          <CardContent className="px-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Phương thức</TableHead>
                  <TableHead className="text-right">Số đơn</TableHead>
                  <TableHead className="text-right">Doanh thu</TableHead>
                  <TableHead className="text-right">%</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paymentBreakdown.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="text-center py-6 text-muted-foreground"
                    >
                      Chưa có dữ liệu
                    </TableCell>
                  </TableRow>
                )}
                {paymentBreakdown.map((p) => {
                  const total = monthRevenue._sum.total || 1;
                  const pct = ((p._sum.total || 0) / total) * 100;
                  return (
                    <TableRow key={p.paymentMethod}>
                      <TableCell>
                        <Badge variant="outline">
                          {PAYMENT_LABELS[p.paymentMethod] || p.paymentMethod}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">{p._count}</TableCell>
                      <TableCell className="text-right font-medium">
                        {formatVND(p._sum.total || 0)}
                      </TableCell>
                      <TableCell className="text-right text-sm text-muted-foreground">
                        {pct.toFixed(1)}%
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
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

function KpiCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <Card>
      <CardContent className="p-4 flex items-center gap-3">
        <div className="size-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
          {icon}
        </div>
        <div className="min-w-0">
          <div className="text-[11px] uppercase tracking-wide text-muted-foreground font-medium">
            {label}
          </div>
          <div className="text-base font-bold tracking-tight truncate">
            {value}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
