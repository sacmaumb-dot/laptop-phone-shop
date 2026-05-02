"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SelectField } from "@/components/ui/select-field";
import {
  CustomerPhoneField,
  type CustomerSelection,
} from "@/components/customer-phone-field";
import { toast } from "sonner";
import { Loader2, Plus, Save, Trash2, Wrench, Printer } from "lucide-react";
import { createServiceTicket } from "./actions";
import { formatVND } from "@/lib/format";

type Customer = { id: string; code: string; name: string; phone: string };
type Technician = { id: string; name: string };

type ServiceItemDraft = {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
};

const DEVICE_TYPES = [
  { value: "phone", label: "Điện thoại" },
  { value: "laptop", label: "Laptop" },
  { value: "tablet", label: "Máy tính bảng" },
  { value: "other", label: "Khác" },
];

export function ServiceForm({
  customers,
  technicians,
  onCreated,
}: {
  customers: Customer[];
  technicians: Technician[];
  onCreated?: (info: { id: string; code: string; print: boolean }) => void;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [customer, setCustomer] = useState<CustomerSelection>({ mode: "none" });
  const [device, setDevice] = useState({
    type: "phone",
    brand: "",
    model: "",
    imei: "",
    accessories: "",
    appearance: "",
    problem: "",
  });
  const [items, setItems] = useState<ServiceItemDraft[]>([
    { id: crypto.randomUUID(), description: "", quantity: 1, unitPrice: 0 },
  ]);
  const [deposit, setDeposit] = useState<string>("");
  const [assignedToId, setAssignedToId] = useState<string>("");
  const [promisedAt, setPromisedAt] = useState("");
  const [note, setNote] = useState("");

  function setDev<K extends keyof typeof device>(k: K, v: string) {
    setDevice((d) => ({ ...d, [k]: v }));
  }

  function addItem() {
    setItems((curr) => [
      ...curr,
      { id: crypto.randomUUID(), description: "", quantity: 1, unitPrice: 0 },
    ]);
  }
  function updateItem(id: string, patch: Partial<ServiceItemDraft>) {
    setItems((curr) => curr.map((i) => (i.id === id ? { ...i, ...patch } : i)));
  }
  function removeItem(id: string) {
    setItems((curr) => curr.filter((i) => i.id !== id));
  }

  const validItems = items.filter(
    (i) => i.description.trim() && i.quantity > 0,
  );
  const estimatedCost = validItems.reduce(
    (s, i) => s + i.unitPrice * i.quantity,
    0,
  );

  function submit(e: React.FormEvent, opts: { print: boolean }) {
    e.preventDefault();
    if (customer.mode === "none") {
      toast.error("Vui lòng nhập SĐT khách hàng");
      return;
    }
    if (customer.mode === "new" && !customer.name.trim()) {
      toast.error("Vui lòng nhập tên khách hàng mới");
      return;
    }
    if (!device.problem.trim()) {
      toast.error("Vui lòng mô tả tình trạng / yêu cầu");
      return;
    }

    const payload = {
      customer:
        customer.mode === "existing"
          ? { id: customer.customer.id }
          : { name: customer.name.trim(), phone: customer.phone.trim() },
      device: {
        type: device.type,
        brand: device.brand.trim() || null,
        model: device.model.trim() || null,
        imei: device.imei.trim() || null,
        accessories: device.accessories.trim() || null,
        appearance: device.appearance.trim() || null,
        problem: device.problem.trim(),
      },
      items: validItems.map((i) => ({
        description: i.description.trim(),
        quantity: i.quantity,
        unitPrice: i.unitPrice,
      })),
      estimatedCost,
      deposit: Number(deposit) || 0,
      assignedToId: assignedToId || null,
      promisedAt: promisedAt || null,
      note: note.trim() || null,
    };

    startTransition(async () => {
      const res = await createServiceTicket(payload);
      if (res.ok) {
        toast.success(`Tạo phiếu ${res.code} thành công!`);
        if (onCreated) {
          if (opts.print) {
            window.open(`/service/${res.id}/intake?print=1`, "_blank");
          }
          onCreated({ id: res.id, code: res.code, print: opts.print });
        } else if (opts.print) {
          router.push(`/service/${res.id}/intake?print=1`);
        } else {
          router.push(`/service/${res.id}`);
        }
      } else {
        toast.error(res.error || "Có lỗi xảy ra");
      }
    });
  }

  return (
    <form onSubmit={(e) => submit(e, { print: false })} className="space-y-4">
      <Card className="overflow-visible">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Khách hàng</CardTitle>
        </CardHeader>
        <CardContent>
          <CustomerPhoneField
            customers={customers}
            value={customer}
            onChange={setCustomer}
            label="Số điện thoại khách hàng"
            required
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Thông tin thiết bị</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Field label="Loại thiết bị *">
              <SelectField
                value={device.type}
                onValueChange={(v) => setDev("type", v)}
                options={DEVICE_TYPES}
                className="w-full"
              />
            </Field>
            <Field label="Hãng">
              <Input
                value={device.brand}
                onChange={(e) => setDev("brand", e.target.value)}
                placeholder="Apple, Dell, Samsung..."
              />
            </Field>
            <Field label="Model">
              <Input
                value={device.model}
                onChange={(e) => setDev("model", e.target.value)}
                placeholder="Latitude 7470, iPhone 13..."
              />
            </Field>
            <Field label="IMEI / Serial">
              <Input
                value={device.imei}
                onChange={(e) => setDev("imei", e.target.value)}
                className="font-mono"
              />
            </Field>
            <Field label="Phụ kiện kèm theo">
              <Input
                value={device.accessories}
                onChange={(e) => setDev("accessories", e.target.value)}
                placeholder="Sạc, cáp, sim..."
              />
            </Field>
            <Field label="Tình trạng máy">
              <Input
                value={device.appearance}
                onChange={(e) => setDev("appearance", e.target.value)}
                placeholder="Trầy nhẹ, móp góc..."
              />
            </Field>
          </div>
          <Field label="Tình trạng / Yêu cầu sửa chữa *">
            <Textarea
              value={device.problem}
              onChange={(e) => setDev("problem", e.target.value)}
              rows={2}
              placeholder="VD: Máy lỗi win, không lên hình. Yêu cầu cài lại win + kiểm tra phần cứng."
              required
            />
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Báo giá dịch vụ</CardTitle>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addItem}
              className="h-7"
            >
              <Plus className="size-3.5" />
              Thêm dịch vụ
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {items.map((item, idx) => (
            <div
              key={item.id}
              className="grid grid-cols-12 gap-2 items-start"
            >
              <div className="col-span-12 sm:col-span-6">
                <Input
                  value={item.description}
                  onChange={(e) =>
                    updateItem(item.id, { description: e.target.value })
                  }
                  placeholder={
                    idx === 0 ? "VD: Cài Windows 10" : "Dịch vụ..."
                  }
                />
              </div>
              <div className="col-span-3 sm:col-span-2">
                <Input
                  type="number"
                  min={1}
                  value={item.quantity}
                  onChange={(e) =>
                    updateItem(item.id, {
                      quantity: Number(e.target.value) || 1,
                    })
                  }
                />
              </div>
              <div className="col-span-7 sm:col-span-3">
                <Input
                  type="number"
                  min={0}
                  step={1000}
                  value={item.unitPrice || ""}
                  onChange={(e) =>
                    updateItem(item.id, {
                      unitPrice: Number(e.target.value) || 0,
                    })
                  }
                  placeholder="Đơn giá"
                />
              </div>
              <div className="col-span-2 sm:col-span-1 flex">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeItem(item.id)}
                  className="text-muted-foreground hover:text-destructive"
                  disabled={items.length === 1}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </div>
          ))}

          <Separator className="my-2" />

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Field label="Đặt cọc (VND)">
              <Input
                type="number"
                min={0}
                step={1000}
                value={deposit}
                onChange={(e) => setDeposit(e.target.value)}
                placeholder="0"
              />
            </Field>
            <Field label="Hẹn trả máy">
              <Input
                type="datetime-local"
                value={promisedAt}
                onChange={(e) => setPromisedAt(e.target.value)}
              />
            </Field>
            <Field label="Kỹ thuật viên">
              <SelectField
                value={assignedToId}
                onValueChange={setAssignedToId}
                placeholder="Chưa phân công"
                options={technicians.map((t) => ({
                  value: t.id,
                  label: t.name,
                }))}
                className="w-full"
              />
            </Field>
          </div>

          <div className="flex items-center justify-between rounded-md bg-primary/5 p-3 text-sm">
            <div className="flex items-center gap-2">
              <Wrench className="size-4 text-primary" />
              <span>Tổng báo giá dự kiến</span>
            </div>
            <span className="text-base font-bold text-primary">
              {formatVND(estimatedCost)}
            </span>
          </div>

          <Field label="Ghi chú nội bộ">
            <Textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
            />
          </Field>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={pending}
        >
          Huỷ
        </Button>
        <Button type="submit" variant="outline" disabled={pending}>
          {pending && <Loader2 className="size-4 animate-spin" />}
          <Save className="size-4" />
          Lưu phiếu
        </Button>
        <Button
          type="button"
          onClick={(e) => submit(e as unknown as React.FormEvent, { print: true })}
          disabled={pending}
        >
          {pending && <Loader2 className="size-4 animate-spin" />}
          <Printer className="size-4" />
          Lưu & In phiếu nhận
        </Button>
      </div>
    </form>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      {children}
    </div>
  );
}
