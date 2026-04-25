import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ServiceStatusBadge } from "@/components/service-status-badge";
import { formatVND, formatDateTime } from "@/lib/format";
import Link from "next/link";
import { ArrowLeft, Smartphone, Laptop, Tablet, User, Wrench } from "lucide-react";
import { PrintButton } from "@/components/print-button";
import { ServiceStatusActions } from "./service-status-actions";
import { ServiceUpdateForm } from "./service-update-form";

const DEVICE_LABELS: Record<string, string> = {
  phone: "Điện thoại",
  laptop: "Laptop",
  tablet: "Máy tính bảng",
  other: "Khác",
};

const DEVICE_ICONS: Record<string, React.ReactNode> = {
  phone: <Smartphone className="size-4" />,
  laptop: <Laptop className="size-4" />,
  tablet: <Tablet className="size-4" />,
};

export default async function ServiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [ticket, technicians] = await Promise.all([
    prisma.serviceTicket.findUnique({
      where: { id },
      include: {
        customer: true,
        createdBy: true,
        assignedTo: true,
        items: { include: { product: true } },
        history: { orderBy: { createdAt: "desc" } },
      },
    }),
    prisma.user.findMany({
      where: { active: true, role: { in: ["technician", "admin"] } },
      orderBy: { name: "asc" },
    }),
  ]);

  if (!ticket) notFound();

  const due = ticket.finalCost > 0 ? ticket.finalCost - ticket.paid : 0;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between gap-2 print:hidden">
        <Link href="/service" className={buttonVariants({ variant: "ghost", size: "sm" })}>
          <ArrowLeft className="size-4" />
          Quay lại
        </Link>
        <PrintButton label="In phiếu" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader className="border-b">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <Wrench className="size-5 text-primary" />
                    <CardTitle>PHIẾU TIẾP NHẬN SỬA CHỮA</CardTitle>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1 font-mono">
                    {ticket.code}
                  </p>
                </div>
                <ServiceStatusBadge status={ticket.status} />
              </div>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              <Section title="Khách hàng" icon={<User className="size-4" />}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                  <Info label="Họ tên" value={ticket.customer.name} />
                  <Info label="Số điện thoại" value={ticket.customer.phone} />
                  <Info label="Mã KH" value={ticket.customer.code} mono />
                  {ticket.customer.email && (
                    <Info label="Email" value={ticket.customer.email} />
                  )}
                  {ticket.customer.address && (
                    <Info
                      label="Địa chỉ"
                      value={ticket.customer.address}
                      className="sm:col-span-2"
                    />
                  )}
                </div>
              </Section>

              <Separator />

              <Section
                title="Thiết bị nhận sửa"
                icon={DEVICE_ICONS[ticket.deviceType] || <Laptop className="size-4" />}
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                  <Info
                    label="Loại"
                    value={DEVICE_LABELS[ticket.deviceType] || ticket.deviceType}
                  />
                  <Info label="Hãng" value={ticket.deviceBrand} />
                  <Info label="Model" value={ticket.deviceModel} />
                  <Info label="IMEI / Serial" value={ticket.imei} mono />
                  {ticket.accessories && (
                    <Info label="Phụ kiện đi kèm" value={ticket.accessories} className="sm:col-span-2" />
                  )}
                  {ticket.appearance && (
                    <Info label="Tình trạng ngoài" value={ticket.appearance} className="sm:col-span-2" />
                  )}
                </div>
              </Section>

              <Separator />

              <Section title="Vấn đề & Chẩn đoán">
                <div className="space-y-3 text-sm">
                  <div>
                    <div className="text-xs uppercase tracking-wide text-muted-foreground mb-1">
                      Vấn đề từ khách
                    </div>
                    <p className="whitespace-pre-wrap">{ticket.problem}</p>
                  </div>
                  {ticket.diagnosis && (
                    <div>
                      <div className="text-xs uppercase tracking-wide text-muted-foreground mb-1">
                        Chẩn đoán
                      </div>
                      <p className="whitespace-pre-wrap">{ticket.diagnosis}</p>
                    </div>
                  )}
                  {ticket.solution && (
                    <div>
                      <div className="text-xs uppercase tracking-wide text-muted-foreground mb-1">
                        Giải pháp
                      </div>
                      <p className="whitespace-pre-wrap">{ticket.solution}</p>
                    </div>
                  )}
                </div>
              </Section>
            </CardContent>
          </Card>

          <Card className="print:hidden">
            <CardHeader>
              <CardTitle>Cập nhật chẩn đoán & báo giá</CardTitle>
              <CardDescription>
                Kỹ thuật viên cập nhật thông tin trong quá trình sửa chữa.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ServiceUpdateForm
                ticket={{
                  id: ticket.id,
                  diagnosis: ticket.diagnosis,
                  solution: ticket.solution,
                  estimatedCost: ticket.estimatedCost,
                  finalCost: ticket.finalCost,
                  paid: ticket.paid,
                  warranty: ticket.warranty,
                  assignedToId: ticket.assignedToId,
                  promisedAt: ticket.promisedAt
                    ? ticket.promisedAt.toISOString().slice(0, 16)
                    : null,
                  note: ticket.note,
                }}
                technicians={technicians.map((t) => ({
                  id: t.id,
                  name: t.name,
                }))}
              />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Thanh toán</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <Row label="Báo giá" value={formatVND(ticket.estimatedCost)} />
              <Row
                label="Đặt cọc"
                value={formatVND(ticket.deposit)}
                color="text-emerald-600"
              />
              <Row
                label="Chi phí cuối"
                value={formatVND(ticket.finalCost)}
                bold
              />
              <Row label="Đã thanh toán" value={formatVND(ticket.paid)} />
              <Separator />
              <Row
                label="Còn lại"
                value={formatVND(due)}
                color={due > 0 ? "text-destructive" : "text-emerald-600"}
                bold
              />
            </CardContent>
          </Card>

          <Card className="print:hidden">
            <CardHeader>
              <CardTitle>Thay đổi trạng thái</CardTitle>
            </CardHeader>
            <CardContent>
              <ServiceStatusActions
                ticketId={ticket.id}
                currentStatus={ticket.status}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Thông tin phiếu</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <Row
                label="Tiếp nhận"
                value={formatDateTime(ticket.receivedAt)}
              />
              {ticket.promisedAt && (
                <Row
                  label="Hẹn trả"
                  value={formatDateTime(ticket.promisedAt)}
                />
              )}
              {ticket.completedAt && (
                <Row
                  label="Hoàn tất"
                  value={formatDateTime(ticket.completedAt)}
                />
              )}
              {ticket.deliveredAt && (
                <Row
                  label="Đã trả"
                  value={formatDateTime(ticket.deliveredAt)}
                />
              )}
              <Separator />
              <Row label="Người nhận" value={ticket.createdBy.name} />
              <Row
                label="KTV phụ trách"
                value={ticket.assignedTo?.name || "—"}
              />
              <Row
                label="Bảo hành"
                value={
                  ticket.warranty > 0 ? `${ticket.warranty} tháng` : "—"
                }
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Lịch sử trạng thái</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {ticket.history.map((h) => (
                <div key={h.id} className="flex gap-3 text-sm">
                  <div className="size-2 rounded-full bg-primary mt-2 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <ServiceStatusBadge status={h.status} />
                      <span className="text-xs text-muted-foreground">
                        {formatDateTime(h.createdAt)}
                      </span>
                    </div>
                    {h.note && (
                      <p className="text-muted-foreground mt-1">{h.note}</p>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Section({
  title,
  icon,
  children,
}: {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h3 className="font-semibold text-sm flex items-center gap-2 mb-3">
        {icon}
        {title}
      </h3>
      {children}
    </div>
  );
}

function Info({
  label,
  value,
  mono,
  className = "",
}: {
  label: string;
  value: string | null | undefined;
  mono?: boolean;
  className?: string;
}) {
  return (
    <div className={className}>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={mono ? "font-mono" : ""}>{value || "—"}</div>
    </div>
  );
}

function Row({
  label,
  value,
  color,
  bold,
}: {
  label: string;
  value: string;
  color?: string;
  bold?: boolean;
}) {
  return (
    <div className="flex justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className={`${color || ""} ${bold ? "font-semibold" : ""}`}>
        {value}
      </span>
    </div>
  );
}
