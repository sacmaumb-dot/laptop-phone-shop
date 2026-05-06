import { prisma } from "@/lib/prisma";
import { requireShopSession } from "@/lib/auth";
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

export default async function ServiceIntakePrintPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ size?: string }>;
}) {
  const session = await requireShopSession();
  const { id } = await params;
  const sp = await searchParams;
  const settings = await getSettings(session.shopId);
  const size = sp.size || settings.printSize || "A4";
  const ticket = await prisma.serviceTicket.findFirst({
    where: { id, shopId: session.shopId },
    include: {
      customer: true,
      createdBy: true,
      items: true,
    },
  });
  if (!ticket) notFound();

  return (
    <Suspense fallback={null}>
      <PrintReceiptShell
        backHref={`/service/${id}`}
        backLabel="Quay lại phiếu"
        printLabel="In phiếu nhận"
        size={size}
        settings={settings}
      >
        <ReceiptHeader
          title="PHIẾU NHẬN MÁY"
          code={ticket.code}
          subtitle={`Tiếp nhận: ${formatDateTime(ticket.receivedAt)}`}
          settings={settings}
          headerNote={settings.intakeHeaderNote}
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
              <Field label="Loại" value={DEVICE_LABELS[ticket.deviceType] || ticket.deviceType} />
              <Field label="Hãng" value={ticket.deviceBrand} />
              <Field label="Model" value={ticket.deviceModel} />
              <Field label="IMEI / Serial" value={ticket.imei} mono />
              <Field
                label="Phụ kiện kèm theo"
                value={ticket.accessories}
                wide
              />
              <Field label="Tình trạng máy" value={ticket.appearance} wide />
            </div>
          </ReceiptSection>

          <ReceiptSection title="Yêu cầu sửa chữa">
            <p className="whitespace-pre-wrap">{ticket.problem}</p>
          </ReceiptSection>

          {ticket.items.length > 0 && (
            <ReceiptSection title="Báo giá dịch vụ">
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
                <tfoot>
                  <tr>
                    <td colSpan={3} className="text-right pt-2 font-semibold">
                      Tổng báo giá
                    </td>
                    <td className="text-right pt-2 font-bold text-base text-primary">
                      {formatVND(ticket.estimatedCost)}
                    </td>
                  </tr>
                  {ticket.deposit > 0 && (
                    <tr>
                      <td
                        colSpan={3}
                        className="text-right text-muted-foreground"
                      >
                        Đặt cọc
                      </td>
                      <td className="text-right text-emerald-600">
                        {formatVND(ticket.deposit)}
                      </td>
                    </tr>
                  )}
                </tfoot>
              </table>
            </ReceiptSection>
          )}

          {ticket.promisedAt && (
            <div className="rounded-md border border-dashed p-3 text-sm">
              <span className="text-muted-foreground">Hẹn trả máy: </span>
              <span className="font-medium">
                {formatDateTime(ticket.promisedAt)}
              </span>
            </div>
          )}

          {settings.intakeTerms && (
            <div className="rounded-md bg-muted/40 p-3 text-xs text-muted-foreground whitespace-pre-line">
              {settings.intakeTerms}
            </div>
          )}

          {settings.intakeFooterNote && (
            <div className="text-center text-xs text-muted-foreground italic whitespace-pre-line">
              {settings.intakeFooterNote}
            </div>
          )}

          {settings.intakeShowSignature && (
            <div className="grid grid-cols-2 gap-8 pt-4 print-hide-on-thermal">
              <div className="text-center">
                <div className="text-xs text-muted-foreground mb-12">
                  Khách hàng
                </div>
                <div className="border-t pt-1 text-xs text-muted-foreground">
                  Ký, ghi rõ họ tên
                </div>
              </div>
              <div className="text-center">
                <div className="text-xs text-muted-foreground mb-1">
                  Nhân viên tiếp nhận
                </div>
                <div className="text-sm font-medium mb-9">
                  {ticket.createdBy.name}
                </div>
                <div className="border-t pt-1 text-xs text-muted-foreground">
                  Ký xác nhận
                </div>
              </div>
            </div>
          )}
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
