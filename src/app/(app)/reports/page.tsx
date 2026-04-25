import { prisma } from "@/lib/prisma";
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
import { TrendingUp, ShoppingCart, Wrench, Users } from "lucide-react";
import { RevenueChart } from "@/components/revenue-chart";

export default async function ReportsPage() {
  const now = new Date();
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const last30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [
    todayRevenue,
    monthRevenue,
    monthSales,
    monthServiceRevenue,
    last30Sales,
    topProducts,
    paymentBreakdown,
  ] = await Promise.all([
    prisma.sale.aggregate({
      where: { createdAt: { gte: today }, status: "paid" },
      _sum: { total: true },
    }),
    prisma.sale.aggregate({
      where: { createdAt: { gte: startOfMonth }, status: "paid" },
      _sum: { total: true },
      _count: true,
    }),
    prisma.sale.count({ where: { createdAt: { gte: startOfMonth } } }),
    prisma.serviceTicket.aggregate({
      where: {
        deliveredAt: { gte: startOfMonth },
        status: "delivered",
      },
      _sum: { finalCost: true },
      _count: true,
    }),
    prisma.sale.findMany({
      where: { createdAt: { gte: last30 }, status: "paid" },
      orderBy: { createdAt: "asc" },
      select: { createdAt: true, total: true },
    }),
    prisma.saleItem.groupBy({
      by: ["productId"],
      where: { sale: { createdAt: { gte: startOfMonth }, status: "paid" } },
      _sum: { quantity: true, subtotal: true },
      orderBy: { _sum: { subtotal: "desc" } },
      take: 10,
    }),
    prisma.sale.groupBy({
      by: ["paymentMethod"],
      where: { createdAt: { gte: startOfMonth }, status: "paid" },
      _sum: { total: true },
      _count: true,
    }),
  ]);

  const productIds = topProducts.map((p) => p.productId);
  const productDetails = await prisma.product.findMany({
    where: { id: { in: productIds } },
  });
  const productMap = Object.fromEntries(productDetails.map((p) => [p.id, p]));

  // Build chart data
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

  const PAYMENT_LABELS: Record<string, string> = {
    cash: "Tiền mặt",
    card: "Thẻ",
    transfer: "Chuyển khoản",
    wallet: "Ví ĐT",
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Báo cáo</h1>
        <p className="text-sm text-muted-foreground">
          Tổng hợp doanh thu, sản phẩm bán chạy và phân bổ thanh toán.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          icon={<TrendingUp className="size-5" />}
          label="Doanh thu hôm nay"
          value={formatVND(todayRevenue._sum.total || 0)}
        />
        <KpiCard
          icon={<ShoppingCart className="size-5" />}
          label={`Doanh thu tháng (${monthSales} đơn)`}
          value={formatVND(monthRevenue._sum.total || 0)}
        />
        <KpiCard
          icon={<Wrench className="size-5" />}
          label={`Sửa chữa tháng (${monthServiceRevenue._count} phiếu)`}
          value={formatVND(monthServiceRevenue._sum.finalCost || 0)}
        />
        <KpiCard
          icon={<Users className="size-5" />}
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
          <CardTitle>Doanh thu 30 ngày qua</CardTitle>
          <CardDescription>
            Tổng doanh thu mỗi ngày trong vòng 30 ngày trở lại đây.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RevenueChart data={chartData} />
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Top 10 sản phẩm bán chạy (tháng)</CardTitle>
            <CardDescription>
              Theo doanh thu trong tháng hiện tại.
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
            <CardTitle>Phương thức thanh toán (tháng)</CardTitle>
            <CardDescription>
              Tỉ trọng doanh thu theo phương thức thanh toán.
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
                          {PAYMENT_LABELS[p.paymentMethod] ||
                            p.paymentMethod}
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
      <CardContent className="p-5 flex items-center gap-3">
        <div className="size-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
          {icon}
        </div>
        <div className="min-w-0">
          <div className="text-xs uppercase tracking-wide text-muted-foreground font-medium">
            {label}
          </div>
          <div className="text-lg font-bold tracking-tight truncate">
            {value}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
