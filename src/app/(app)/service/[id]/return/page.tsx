import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { formatVND, formatDateTime } from "@/lib/format";
import {
  PrintReceiptShell,
  ReceiptHeader,
  ReceiptSection,
} from "@/components/print-receipt-shell";
import { getSettings } from "@/lib/settings";

const DEVICE_LABELS: Record<string, string> = {
  phone: "Điện thoại",
  laptop: "Laptop",
  tablet: "Máy tính bảng",
  other: "Khác",
};

const PAYMENT_LABELS: Record<string, string> = {
  cash: "Tiền mặt",
  transfer: "Chuyển khoản",
};

export default async function ServiceReturnPrintPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ size?: string }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const settings = await getSettings();
  const size = sp.size || settings.printSize || "A4";
  const ticket = await prisma.serviceTicket.findUnique({
    where: { id },
    include: {
      customer: true,
      createdBy: true,
      assignedTo: true,
      items: true,
    },
  });
  if (!ticket) notFound();

  const due = ticket.finalCost - ticket.paid - ticket.deposit;

  return (
    <Suspense fallback={null}>
      <PrintReceiptShell
        backHref={`/service/${id}`}
        backLabel="Quay lại phiếu"
        printLabel="In phiếu trả"
        size={size}
        settings={settings}
      >
        <ReceiptHeader
          title="PHIẾU TRẢ MÁY"
          code={ticket.code}
          subtitle={
            ticket.deliveredAt
              ? `Trả máy: ${formatDateTime(ticket.deliveredAt)}`
              : undefined
          }
          settings={settings}
        />

        <div className="receipt-padding p-5 space-y-4 text-sm">
          <ReceiptSection title="Khách hàng">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <div className="text-xs text-muted-foreground">Họ tên</div>
                <div className="font-medium">{ticket.customer.name}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">SĐT</div>
                <div className="font-medium">{ticket.customer.phone}</div>
              </div>
            </div>
          </ReceiptSection>

          <ReceiptSection title="Thiết bị">
            <div className="grid grid-cols-2 gap-2">
              <Field
                label="Loại"
                value={DEVICE_LABELS[ticket.deviceType] || ticket.deviceType}
              />
              <Field label="Hãng & Model" value={[ticket.deviceBrand, ticket.deviceModel].filter(Boolean).join(" ")} />
              <Field label="IMEI / Serial" value={ticket.imei} mono wide />
            </div>
          </ReceiptSection>

          {ticket.solution && (
            <ReceiptSection title="Đã thực hiện">
              <p className="whitespace-pre-wrap">{ticket.solution}</p>
            </ReceiptSection>
          )}

          {ticket.items.length > 0 && (
            <ReceiptSection title="Chi tiết dịch vụ & vật tư">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-xs text-muted-foreground">
                    <th className="text-left font-medium py-1.5">Nội dung</th>
                    <th className="text-right font-medium py-1.5 w-12">SL</th>
                    <th className="text-right font-medium py-1.5 w-28">
                      Đơn giá
                    </th>
                    <th className="text-right font-medium py-1.5 w-28">
                      Thành tiền
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {ticket.items.map((it) => (
                    <tr key={it.id} className="border-b last:border-0">
                      <td className="py-2">{it.description}</td>
                      <td className="text-right">{it.quantity}</td>
                      <td className="text-right">{formatVND(it.unitPrice)}</td>
                      <td className="text-right font-medium">
                        {formatVND(it.subtotal)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </ReceiptSection>
          )}

          <ReceiptSection title="Thanh toán">
            <div className="rounded-md border p-3 space-y-1.5">
              <Row label="Tổng chi phí" value={formatVND(ticket.finalCost)} />
              {ticket.deposit > 0 && (
                <Row
                  label="Đã đặt cọc"
                  value={`-${formatVND(ticket.deposit)}`}
                  color="text-emerald-600"
                />
              )}
              <Row
                label="Phương thức"
                value={
                  ticket.paymentMethod
                    ? PAYMENT_LABELS[ticket.paymentMethod] || ticket.paymentMethod
                    : "—"
                }
              />
              <Row label="Đã thanh toán" value={formatVND(ticket.paid)} />
              <div className="border-t pt-1.5">
                <Row
                  label={due > 0 ? "Còn lại" : "Đủ thanh toán"}
                  value={due > 0 ? formatVND(due) : "0 đ"}
                  color={
                    due > 0 ? "text-destructive" : "text-emerald-600"
                  }
                  bold
                />
              </div>
            </div>
          </ReceiptSection>

          {ticket.warranty > 0 && (
            <div className="rounded-md border border-dashed p-3 text-sm">
              <span className="text-muted-foreground">Bảo hành: </span>
              <span className="font-medium">{ticket.warranty} tháng</span>
              {ticket.deliveredAt && (
                <span className="text-muted-foreground ml-2">
                  (kể từ ngày trả máy)
                </span>
              )}
            </div>
          )}

          <div className="grid grid-cols-2 gap-8 pt-4">
            <div className="text-center">
              <div className="text-xs text-muted-foreground mb-12">
                Khách hàng nhận máy
              </div>
              <div className="border-t pt-1 text-xs text-muted-foreground">
                Ký, ghi rõ họ tên
              </div>
            </div>
            <div className="text-center">
              <div className="text-xs text-muted-foreground mb-1">
                Nhân viên trả máy
              </div>
              <div className="text-sm font-medium mb-9">
                {ticket.createdBy.name}
              </div>
              <div className="border-t pt-1 text-xs text-muted-foreground">
                Ký xác nhận
              </div>
            </div>
          </div>
        </div>
      </PrintReceiptShell>
    </Suspense>
  );
}

function Field({
  label,
  value,
  mono,
  wide,
}: {
  label: string;
  value: string | null | undefined;
  mono?: boolean;
  wide?: boolean;
}) {
  if (!value) return wide ? null : <div />;
  return (
    <div className={wide ? "col-span-2" : ""}>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={mono ? "font-mono" : ""}>{value}</div>
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
    <div className="flex justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className={`${color || ""} ${bold ? "font-semibold text-base" : ""}`}>
        {value}
      </span>
    </div>
  );
}
