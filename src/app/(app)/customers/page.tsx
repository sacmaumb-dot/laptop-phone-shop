import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma";
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
import { Users } from "lucide-react";
import { formatVND, formatDate } from "@/lib/format";
import { CustomerSearch } from "./customer-search";
import { NewCustomerDialog } from "./new-customer-dialog";

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const sp = await searchParams;
  const where: Prisma.CustomerWhereInput = {};
  if (sp.q) {
    where.OR = [
      { name: { contains: sp.q } },
      { phone: { contains: sp.q } },
      { code: { contains: sp.q } },
      { email: { contains: sp.q } },
    ];
  }

  const customers = await prisma.customer.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      sales: { select: { total: true } },
      serviceTickets: { select: { id: true } },
    },
    take: 200,
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Khách hàng</h1>
          <p className="text-sm text-muted-foreground">
            Quản lý thông tin khách hàng và lịch sử giao dịch.
          </p>
        </div>
        <NewCustomerDialog />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="size-4" />
            {customers.length} khách hàng
          </CardTitle>
          <CardDescription>
            Tìm kiếm theo tên, số điện thoại, email, mã khách hàng.
          </CardDescription>
          <CustomerSearch />
        </CardHeader>
        <CardContent className="px-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mã KH</TableHead>
                  <TableHead>Họ tên</TableHead>
                  <TableHead>Số điện thoại</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Địa chỉ</TableHead>
                  <TableHead className="text-right">Số đơn</TableHead>
                  <TableHead className="text-right">Tổng chi tiêu</TableHead>
                  <TableHead className="text-right">Phiếu SC</TableHead>
                  <TableHead>Ngày tạo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customers.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={9}
                      className="text-center py-8 text-muted-foreground"
                    >
                      Chưa có khách hàng.
                    </TableCell>
                  </TableRow>
                )}
                {customers.map((c) => {
                  const totalSpent = c.sales.reduce((s, x) => s + x.total, 0);
                  return (
                    <TableRow key={c.id}>
                      <TableCell className="font-mono text-xs">
                        {c.code}
                      </TableCell>
                      <TableCell className="font-medium">{c.name}</TableCell>
                      <TableCell className="font-mono text-sm">
                        {c.phone}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {c.email || "—"}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
                        {c.address || "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        {c.sales.length}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatVND(totalSpent)}
                      </TableCell>
                      <TableCell className="text-right">
                        {c.serviceTickets.length}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(c.createdAt)}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
