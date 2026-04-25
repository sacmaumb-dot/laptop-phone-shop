import { prisma } from "@/lib/prisma";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import Link from "next/link";
import { formatVND, formatDateTime } from "@/lib/format";
import { ShoppingCart, Plus } from "lucide-react";

const PAYMENT_LABELS: Record<string, string> = {
  cash: "Tiền mặt",
  card: "Thẻ NH",
  transfer: "Chuyển khoản",
  wallet: "Ví ĐT",
};

export default async function SalesPage() {
  const sales = await prisma.sale.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      customer: { select: { name: true, phone: true } },
      user: { select: { name: true } },
      items: { select: { id: true } },
    },
    take: 100,
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Đơn hàng</h1>
          <p className="text-sm text-muted-foreground">
            Danh sách hoá đơn bán hàng đã tạo.
          </p>
        </div>
        <Link href="/pos" className={buttonVariants()}>
          <Plus className="size-4" />
          Tạo đơn mới
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="size-4" />
            {sales.length} hoá đơn gần nhất
          </CardTitle>
          <CardDescription>
            Bấm vào mã hoá đơn để xem chi tiết.
          </CardDescription>
        </CardHeader>
        <CardContent className="px-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mã HĐ</TableHead>
                  <TableHead>Thời gian</TableHead>
                  <TableHead>Khách hàng</TableHead>
                  <TableHead>Nhân viên</TableHead>
                  <TableHead>SL</TableHead>
                  <TableHead>Thanh toán</TableHead>
                  <TableHead className="text-right">Tổng tiền</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sales.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      Chưa có hoá đơn nào.
                    </TableCell>
                  </TableRow>
                )}
                {sales.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-mono font-medium">
                      <Link
                        href={`/sales/${s.id}`}
                        className="text-primary hover:underline"
                      >
                        {s.code}
                      </Link>
                    </TableCell>
                    <TableCell className="text-sm whitespace-nowrap">
                      {formatDateTime(s.createdAt)}
                    </TableCell>
                    <TableCell>
                      {s.customer ? (
                        <div>
                          <div className="text-sm">{s.customer.name}</div>
                          <div className="text-xs text-muted-foreground font-mono">
                            {s.customer.phone}
                          </div>
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">
                          Khách lẻ
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm">{s.user.name}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{s.items.length}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {PAYMENT_LABELS[s.paymentMethod] || s.paymentMethod}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      {formatVND(s.total)}
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
