import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatVND, formatDateTime } from "@/lib/format";
import Link from "next/link";
import { ArrowLeft, Receipt } from "lucide-react";
import { PrintButton } from "@/components/print-button";

const PAYMENT_LABELS: Record<string, string> = {
  cash: "Tiền mặt",
  card: "Thẻ ngân hàng",
  transfer: "Chuyển khoản",
  wallet: "Ví điện tử",
};

export default async function SaleDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const sale = await prisma.sale.findUnique({
    where: { id },
    include: {
      customer: true,
      user: true,
      items: { include: { product: true } },
    },
  });

  if (!sale) notFound();

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between gap-2 print:hidden">
        <Link href="/sales" className={buttonVariants({ variant: "ghost", size: "sm" })}>
          <ArrowLeft className="size-4" />
          Quay lại
        </Link>
        <div className="flex gap-2">
          <PrintButton label="In hoá đơn" />
        </div>
      </div>

      <Card className="print:shadow-none print:border-0">
        <CardHeader className="border-b">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Receipt className="size-5 text-primary" />
                <CardTitle>HOÁ ĐƠN BÁN HÀNG</CardTitle>
              </div>
              <p className="text-sm text-muted-foreground mt-1 font-mono">
                {sale.code}
              </p>
            </div>
            <div className="text-right text-sm">
              <div className="font-bold text-base">TechShop</div>
              <div className="text-muted-foreground">
                Cửa hàng Laptop & Điện thoại
              </div>
              <div className="text-muted-foreground">
                Hotline: 1900 1234
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div className="space-y-1">
              <div className="text-muted-foreground text-xs uppercase tracking-wide">
                Khách hàng
              </div>
              {sale.customer ? (
                <>
                  <div className="font-medium">{sale.customer.name}</div>
                  <div>{sale.customer.phone}</div>
                  {sale.customer.address && (
                    <div className="text-muted-foreground">
                      {sale.customer.address}
                    </div>
                  )}
                </>
              ) : (
                <div className="font-medium">Khách lẻ</div>
              )}
            </div>
            <div className="space-y-1 sm:text-right">
              <div className="text-muted-foreground text-xs uppercase tracking-wide">
                Thông tin
              </div>
              <div>
                <span className="text-muted-foreground">Ngày: </span>
                {formatDateTime(sale.createdAt)}
              </div>
              <div>
                <span className="text-muted-foreground">Nhân viên: </span>
                {sale.user.name}
              </div>
              <div>
                <span className="text-muted-foreground">Thanh toán: </span>
                <Badge variant="outline">
                  {PAYMENT_LABELS[sale.paymentMethod] || sale.paymentMethod}
                </Badge>
              </div>
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">#</TableHead>
                <TableHead>Sản phẩm</TableHead>
                <TableHead className="text-right">Đơn giá</TableHead>
                <TableHead className="text-right">SL</TableHead>
                <TableHead className="text-right">Thành tiền</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sale.items.map((item, idx) => (
                <TableRow key={item.id}>
                  <TableCell className="text-muted-foreground">
                    {idx + 1}
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{item.product.name}</div>
                    <div className="text-xs text-muted-foreground font-mono">
                      {item.product.sku}
                      {item.imei && ` · IMEI: ${item.imei}`}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    {formatVND(item.unitPrice)}
                  </TableCell>
                  <TableCell className="text-right">{item.quantity}</TableCell>
                  <TableCell className="text-right font-medium">
                    {formatVND(item.subtotal)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <div className="flex justify-end">
            <div className="w-full sm:w-72 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tạm tính</span>
                <span>{formatVND(sale.subtotal)}</span>
              </div>
              {sale.discount > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Giảm giá</span>
                  <span className="text-destructive">
                    -{formatVND(sale.discount)}
                  </span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between text-lg font-bold">
                <span>Tổng cộng</span>
                <span className="text-primary">{formatVND(sale.total)}</span>
              </div>
            </div>
          </div>

          {sale.note && (
            <div className="rounded-lg border p-3 text-sm bg-muted/30">
              <span className="text-muted-foreground">Ghi chú: </span>
              {sale.note}
            </div>
          )}

          <p className="text-center text-sm text-muted-foreground italic pt-4 border-t">
            Cảm ơn quý khách! Hẹn gặp lại.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
