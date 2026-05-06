import { prisma } from "@/lib/prisma";
import { requireShopSession } from "@/lib/auth";
import type { Prisma } from "@/generated/prisma";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import Link from "next/link";
import { formatVND, formatDateTime } from "@/lib/format";
import {
  Wrench,
  Plus,
  Smartphone,
  Laptop,
  Tablet,
  Phone,
  ChevronRight,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Package,
} from "lucide-react";
import { ServiceStatusBadge } from "@/components/service-status-badge";
import { ServiceFilter } from "./service-filter";

const DEVICE_ICONS: Record<string, React.ReactNode> = {
  phone: <Smartphone className="size-4" />,
  laptop: <Laptop className="size-4" />,
  tablet: <Tablet className="size-4" />,
  other: <Package className="size-4" />,
};

export default async function ServicePage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string }>;
}) {
  const session = await requireShopSession();
  const shopId = session.shopId;
  const sp = await searchParams;
  const where: Prisma.ServiceTicketWhereInput = { shopId };

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
    where: { shopId },
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
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Phiếu sửa chữa
          </h1>
          <p className="text-sm text-muted-foreground">
            Quản lý phiếu tiếp nhận thiết bị, theo dõi tiến độ và trả máy.
          </p>
        </div>
        <Link href="/pos" className={buttonVariants()}>
          <Plus className="size-4" />
          Phiếu mới
        </Link>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Kpi
          icon={<Clock className="size-4" />}
          label="Đang xử lý"
          value={String(totalActive)}
          tone="primary"
        />
        <Kpi
          icon={<AlertCircle className="size-4" />}
          label="Hoàn tất chờ trả"
          value={String(countMap.completed || 0)}
        />
        <Kpi
          icon={<CheckCircle2 className="size-4" />}
          label="Đã trả máy"
          value={String(countMap.delivered || 0)}
        />
        <Kpi
          icon={<XCircle className="size-4" />}
          label="Đã huỷ"
          value={String(countMap.cancelled || 0)}
        />
      </div>

      <Card>
        <CardHeader className="border-b pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Wrench className="size-4" />
            Danh sách ({tickets.length})
          </CardTitle>
          <ServiceFilter />
        </CardHeader>
        <CardContent className="p-3">
          {tickets.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted-foreground">
              Không có phiếu sửa chữa nào.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2">
              {tickets.map((t) => (
                <Link
                  key={t.id}
                  href={`/service/${t.id}`}
                  className="rounded-md border bg-card hover:border-primary/60 hover:shadow-sm transition-all p-3 group block"
                >
                  <div className="flex items-center gap-2">
                    <div className="size-9 shrink-0 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                      {DEVICE_ICONS[t.deviceType] ?? (
                        <Wrench className="size-4" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-sm font-semibold">
                          {t.code}
                        </span>
                      </div>
                      <div className="text-[11px] text-muted-foreground">
                        {formatDateTime(t.receivedAt)}
                      </div>
                    </div>
                    <ServiceStatusBadge status={t.status} />
                  </div>

                  <div className="mt-2 space-y-0.5">
                    <div className="text-xs font-medium truncate">
                      {t.customer.name}
                      <span className="ml-1.5 text-[10px] font-mono text-muted-foreground">
                        <Phone className="inline size-2.5 mr-0.5" />
                        {t.customer.phone}
                      </span>
                    </div>
                    <div className="text-[11px] text-muted-foreground truncate">
                      {[t.deviceBrand, t.deviceModel].filter(Boolean).join(" ") ||
                        t.deviceType}
                      {t.imei && (
                        <span className="ml-1.5 font-mono">· {t.imei}</span>
                      )}
                    </div>
                    <div className="text-[11px] text-muted-foreground line-clamp-1">
                      {t.problem}
                    </div>
                  </div>

                  <div className="mt-2 flex items-end justify-between gap-2">
                    <div className="text-[10px] text-muted-foreground">
                      KTV: {t.assignedTo?.name ?? "Chưa giao"}
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold text-primary">
                        {t.estimatedCost > 0
                          ? formatVND(t.estimatedCost)
                          : "—"}
                      </div>
                      <ChevronRight className="size-3.5 ml-auto text-muted-foreground opacity-0 group-hover:opacity-100 transition" />
                    </div>
                  </div>
                </Link>
              ))}
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
