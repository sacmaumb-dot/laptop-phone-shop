import { prisma } from "@/lib/prisma";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatVND, formatDateTime, formatNumber } from "@/lib/format";
import {
  ShoppingCart,
  Wrench,
  Users,
  TrendingUp,
  AlertCircle,
  Clock,
  CheckCircle2,
} from "lucide-react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { ServiceStatusBadge } from "@/components/service-status-badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { RevenueChart } from "@/components/revenue-chart";

export default async function DashboardPage() {
  const now = new Date();
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const last30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [
    todayRevenue,
    monthRevenue,
    todayOrders,
    activeTickets,
    lowStockProducts,
    customerCount,
    recentTickets,
    last30Sales,
  ] = await Promise.all([
    prisma.sale.aggregate({
      where: { createdAt: { gte: today }, status: "paid" },
      _sum: { total: true },
    }),
    prisma.sale.aggregate({
      where: { createdAt: { gte: startOfMonth }, status: "paid" },
      _sum: { total: true },
    }),
    prisma.sale.count({ where: { createdAt: { gte: today } } }),
    prisma.serviceTicket.count({
      where: {
        status: { notIn: ["delivered", "cancelled"] },
      },
    }),
    prisma.product.findMany({
      where: { stock: { lt: 5 }, isActive: true },
      orderBy: { stock: "asc" },
      take: 5,
    }),
    prisma.customer.count(),
    prisma.serviceTicket.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: { customer: true },
    }),
    prisma.sale.findMany({
      where: { createdAt: { gte: last30 }, status: "paid" },
      orderBy: { createdAt: "asc" },
      select: { createdAt: true, total: true },
    }),
  ]);

  // Build chart data: revenue by day for last 30 days
  const revenueByDay = new Map<string, number>();
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const key = d.toISOString().slice(0, 10);
    revenueByDay.set(key, 0);
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
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Tổng quan</h1>
          <p className="text-sm text-muted-foreground">
            Số liệu tổng hợp hoạt động kinh doanh hôm nay và tháng này.
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/pos" className={buttonVariants()}>
            <ShoppingCart className="size-4" />
            Bán hàng
          </Link>
          <Link href="/pos" className={buttonVariants({ variant: "outline" })}>
            <Wrench className="size-4" />
            Phiếu sửa chữa
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          icon={<TrendingUp className="size-5" />}
          label="Doanh thu hôm nay"
          value={formatVND(todayRevenue._sum.total || 0)}
          sub={`${todayOrders} đơn hàng`}
          color="blue"
        />
        <KpiCard
          icon={<ShoppingCart className="size-5" />}
          label="Doanh thu tháng"
          value={formatVND(monthRevenue._sum.total || 0)}
          sub={`Từ ngày 01/${String(today.getMonth() + 1).padStart(2, "0")}`}
          color="emerald"
        />
        <KpiCard
          icon={<Wrench className="size-5" />}
          label="Phiếu sửa chữa"
          value={formatNumber(activeTickets)}
          sub="Đang xử lý"
          color="amber"
        />
        <KpiCard
          icon={<Users className="size-5" />}
          label="Khách hàng"
          value={formatNumber(customerCount)}
          sub="Tổng số trong hệ thống"
          color="purple"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Doanh thu 30 ngày qua</CardTitle>
            <CardDescription>
              Tổng doanh thu mỗi ngày trong vòng 30 ngày trở lại đây.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RevenueChart data={chartData} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="size-4 text-amber-500" />
              Sản phẩm sắp hết
            </CardTitle>
            <CardDescription>Tồn kho dưới 5 đơn vị</CardDescription>
          </CardHeader>
          <CardContent>
            {lowStockProducts.length === 0 ? (
              <div className="text-sm text-muted-foreground py-6 text-center flex flex-col items-center gap-2">
                <CheckCircle2 className="size-8 text-emerald-500" />
                Tất cả sản phẩm còn đủ hàng.
              </div>
            ) : (
              <ul className="space-y-3">
                {lowStockProducts.map((p) => (
                  <li
                    key={p.id}
                    className="flex items-center justify-between gap-2"
                  >
                    <div className="min-w-0">
                      <div className="text-sm font-medium truncate">
                        {p.name}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {p.sku} · {p.brand}
                      </div>
                    </div>
                    <Badge
                      variant={p.stock === 0 ? "destructive" : "secondary"}
                    >
                      {p.stock} còn lại
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Clock className="size-4" />
              Phiếu sửa chữa gần đây
            </CardTitle>
            <CardDescription>
              5 phiếu mới nhất được tiếp nhận.
            </CardDescription>
          </div>
          <Link href="/service" className={buttonVariants({ variant: "outline", size: "sm" })}>
            Xem tất cả
          </Link>
        </CardHeader>
        <CardContent className="px-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mã phiếu</TableHead>
                  <TableHead>Khách hàng</TableHead>
                  <TableHead>Thiết bị</TableHead>
                  <TableHead>Tiếp nhận</TableHead>
                  <TableHead>Trạng thái</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentTickets.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="text-center text-muted-foreground py-8"
                    >
                      Chưa có phiếu sửa chữa nào.
                    </TableCell>
                  </TableRow>
                )}
                {recentTickets.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell className="font-mono font-medium">
                      <Link
                        href={`/service/${t.id}`}
                        className="text-primary hover:underline"
                      >
                        {t.code}
                      </Link>
                    </TableCell>
                    <TableCell>{t.customer.name}</TableCell>
                    <TableCell>
                      <div className="text-sm">{t.deviceModel || "—"}</div>
                      <div className="text-xs text-muted-foreground capitalize">
                        {t.deviceType} · {t.deviceBrand}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDateTime(t.receivedAt)}
                    </TableCell>
                    <TableCell>
                      <ServiceStatusBadge status={t.status} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function KpiCard({
  icon,
  label,
  value,
  sub,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
  color: "blue" | "emerald" | "amber" | "purple";
}) {
  const colors: Record<string, string> = {
    blue: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
    emerald: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    amber: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    purple: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
  };
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-center gap-3">
          <div
            className={`size-10 rounded-lg flex items-center justify-center ${colors[color]}`}
          >
            {icon}
          </div>
          <div className="min-w-0">
            <div className="text-xs uppercase tracking-wide text-muted-foreground font-medium">
              {label}
            </div>
            <div className="text-xl font-bold tracking-tight truncate">
              {value}
            </div>
            {sub && (
              <div className="text-xs text-muted-foreground mt-0.5">{sub}</div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
