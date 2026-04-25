import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma";
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
import { buttonVariants } from "@/components/ui/button";
import Link from "next/link";
import { formatVND, formatDateTime } from "@/lib/format";
import { Wrench, Plus, Smartphone, Laptop, Tablet } from "lucide-react";
import { ServiceStatusBadge } from "@/components/service-status-badge";
import { ServiceFilter } from "./service-filter";

const DEVICE_ICONS: Record<string, React.ReactNode> = {
  phone: <Smartphone className="size-4" />,
  laptop: <Laptop className="size-4" />,
  tablet: <Tablet className="size-4" />,
};

export default async function ServicePage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string }>;
}) {
  const sp = await searchParams;
  const where: Prisma.ServiceTicketWhereInput = {};

  if (sp.status && sp.status !== "all") {
    where.status = sp.status;
  }

  if (sp.q) {
    where.OR = [
      { code: { contains: sp.q } },
      { deviceModel: { contains: sp.q } },
      { imei: { contains: sp.q } },
      { customer: { name: { contains: sp.q } } },
      { customer: { phone: { contains: sp.q } } },
    ];
  }

  const tickets = await prisma.serviceTicket.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: { customer: true, assignedTo: true },
    take: 200,
  });

  const counts = await prisma.serviceTicket.groupBy({
    by: ["status"],
    _count: true,
  });
  const countMap: Record<string, number> = {};
  counts.forEach((c) => (countMap[c.status] = c._count));
  const totalActive =
    (countMap.received || 0) +
    (countMap.diagnosing || 0) +
    (countMap.waiting_parts || 0) +
    (countMap.repairing || 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Sửa chữa & Dịch vụ
          </h1>
          <p className="text-sm text-muted-foreground">
            Quản lý phiếu tiếp nhận thiết bị, theo dõi tiến độ và trả máy.
          </p>
        </div>
        <Link href="/service/new" className={buttonVariants()}>
          <Plus className="size-4" />
          Phiếu sửa chữa mới
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Đang xử lý" value={totalActive} accent="bg-blue-500/10 text-blue-600" />
        <StatCard
          label="Hoàn tất chờ trả"
          value={countMap.completed || 0}
          accent="bg-emerald-500/10 text-emerald-600"
        />
        <StatCard
          label="Đã trả máy"
          value={countMap.delivered || 0}
          accent="bg-zinc-500/10 text-zinc-600"
        />
        <StatCard
          label="Đã huỷ"
          value={countMap.cancelled || 0}
          accent="bg-red-500/10 text-red-600"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wrench className="size-4" />
            Danh sách phiếu
          </CardTitle>
          <CardDescription>
            Tìm kiếm theo mã phiếu, IMEI, tên/SĐT khách, model thiết bị.
          </CardDescription>
          <ServiceFilter />
        </CardHeader>
        <CardContent className="px-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mã phiếu</TableHead>
                  <TableHead>Khách hàng</TableHead>
                  <TableHead>Thiết bị</TableHead>
                  <TableHead>Vấn đề</TableHead>
                  <TableHead>Tiếp nhận</TableHead>
                  <TableHead>KTV</TableHead>
                  <TableHead className="text-right">Dự kiến</TableHead>
                  <TableHead>Trạng thái</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tickets.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="text-center py-12 text-muted-foreground"
                    >
                      Không có phiếu sửa chữa nào.
                    </TableCell>
                  </TableRow>
                )}
                {tickets.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell className="font-mono font-medium">
                      <Link
                        href={`/service/${t.id}`}
                        className="text-primary hover:underline"
                      >
                        {t.code}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">{t.customer.name}</div>
                      <div className="text-xs text-muted-foreground font-mono">
                        {t.customer.phone}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">
                          {DEVICE_ICONS[t.deviceType]}
                        </span>
                        <div>
                          <div className="text-sm">
                            {t.deviceBrand} {t.deviceModel}
                          </div>
                          {t.imei && (
                            <div className="text-xs text-muted-foreground font-mono">
                              {t.imei}
                            </div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-[240px]">
                      <div className="text-sm line-clamp-2">{t.problem}</div>
                    </TableCell>
                    <TableCell className="text-sm whitespace-nowrap text-muted-foreground">
                      {formatDateTime(t.receivedAt)}
                    </TableCell>
                    <TableCell className="text-sm">
                      {t.assignedTo?.name || "—"}
                    </TableCell>
                    <TableCell className="text-right text-sm whitespace-nowrap">
                      {t.estimatedCost > 0
                        ? formatVND(t.estimatedCost)
                        : "—"}
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

function StatCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent: string;
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div
          className={`size-8 rounded-md ${accent} flex items-center justify-center mb-2`}
        >
          <Wrench className="size-4" />
        </div>
        <div className="text-2xl font-bold">{value}</div>
        <div className="text-xs text-muted-foreground">{label}</div>
      </CardContent>
    </Card>
  );
}
