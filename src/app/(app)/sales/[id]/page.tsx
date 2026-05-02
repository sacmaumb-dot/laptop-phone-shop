import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { formatVND, formatDateTime } from "@/lib/format";
import {
  PrintReceiptShell,
  ReceiptHeader,
  ReceiptSection,
} from "@/components/print-receipt-shell";
import { getSettings } from "@/lib/settings";

const PAYMENT_LABELS: Record<string, string> = {
  cash: "Tiền mặt",
  card: "Thẻ ngân hàng",
  transfer: "Chuyển khoản",
  wallet: "Ví điện tử",
};

export default async function SaleDetailPage({
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
    <PrintReceiptShell
      backHref="/sales"
      backLabel="Quay lại"
      printLabel="In hoá đơn"
      size={size}
      settings={settings}
    >
      <ReceiptHeader
        title="HOÁ ĐƠN BÁN HÀNG"
        code={sale.code}
        subtitle={formatDateTime(sale.createdAt)}
        settings={settings}
      />

      <div className="receipt-padding p-5 space-y-4 text-sm">
        <ReceiptSection title="Khách hàng">
          {sale.customer ? (
            <div className="grid grid-cols-2 gap-2">
              <div>
                <div className="text-xs text-muted-foreground">Họ tên</div>
                <div className="font-medium">{sale.customer.name}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">SĐT</div>
                <div className="font-medium font-mono">
                  {sale.customer.phone}
                </div>
              </div>
              {sale.customer.address && (
                <div className="col-span-2">
                  <div className="text-xs text-muted-foreground">Địa chỉ</div>
                  <div>{sale.customer.address}</div>
                </div>
              )}
            </div>
          ) : (
            <div className="font-medium">Khách lẻ</div>
          )}
        </ReceiptSection>

        <ReceiptSection title="Chi tiết">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-xs text-muted-foreground">
                <th className="text-left font-medium py-1.5">Sản phẩm</th>
                <th className="text-right font-medium py-1.5 w-10">SL</th>
                <th className="text-right font-medium py-1.5 w-24 print-hide-on-thermal">
                  Đơn giá
                </th>
                <th className="text-right font-medium py-1.5 w-28">
                  Thành tiền
                </th>
              </tr>
            </thead>
            <tbody>
              {sale.items.map((item) => (
                <tr key={item.id} className="border-b last:border-0 align-top">
                  <td className="py-1.5">
                    <div className="font-medium">{item.product.name}</div>
                    {(item.product.sku || item.imei) && (
                      <div className="text-[10px] text-muted-foreground font-mono">
                        {item.product.sku}
                        {item.imei && ` · IMEI: ${item.imei}`}
                      </div>
                    )}
                  </td>
                  <td className="text-right py-1.5">{item.quantity}</td>
                  <td className="text-right py-1.5 print-hide-on-thermal">
                    {formatVND(item.unitPrice)}
                  </td>
                  <td className="text-right py-1.5 font-medium">
                    {formatVND(item.subtotal)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </ReceiptSection>

        <div className="rounded-md border p-3 space-y-1.5">
          <Row label="Tạm tính" value={formatVND(sale.subtotal)} />
          {sale.discount > 0 && (
            <Row
              label="Giảm giá"
              value={`-${formatVND(sale.discount)}`}
              color="text-emerald-600"
            />
          )}
          <Row
            label="Phương thức"
            value={PAYMENT_LABELS[sale.paymentMethod] || sale.paymentMethod}
          />
          <div className="border-t pt-1.5">
            <Row
              label="Tổng cộng"
              value={formatVND(sale.total)}
              bold
              color="text-primary"
            />
          </div>
        </div>

        {sale.note && (
          <div className="text-xs text-muted-foreground">
            <span className="font-semibold">Ghi chú:</span> {sale.note}
          </div>
        )}

        <div className="text-center text-xs text-muted-foreground italic pt-2 border-t">
          Cảm ơn quý khách! Hẹn gặp lại.
        </div>

        <div className="grid grid-cols-2 gap-8 pt-3 print-hide-on-thermal">
          <div className="text-center">
            <div className="text-[11px] text-muted-foreground mb-10">
              Khách hàng
            </div>
            <div className="border-t pt-1 text-[10px] text-muted-foreground">
              Ký, ghi rõ họ tên
            </div>
          </div>
          <div className="text-center">
            <div className="text-[11px] text-muted-foreground mb-1">
              Nhân viên
            </div>
            <div className="text-sm font-medium mb-7">{sale.user.name}</div>
            <div className="border-t pt-1 text-[10px] text-muted-foreground">
              Ký xác nhận
            </div>
          </div>
        </div>
      </div>
    </PrintReceiptShell>
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
      <span className={bold ? "font-semibold" : "text-muted-foreground"}>
        {label}
      </span>
      <span className={`${bold ? "font-bold" : ""} ${color || ""}`}>
        {value}
      </span>
    </div>
  );
}
