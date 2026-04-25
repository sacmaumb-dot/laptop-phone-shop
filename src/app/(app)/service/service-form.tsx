"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, Save } from "lucide-react";
import { createServiceTicket } from "./actions";

type Customer = { id: string; name: string; phone: string };
type Technician = { id: string; name: string };

export function ServiceForm({
  customers,
  technicians,
}: {
  customers: Customer[];
  technicians: Technician[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [customerMode, setCustomerMode] = useState<"existing" | "new">(
    customers.length > 0 ? "existing" : "new",
  );
  const [form, setForm] = useState({
    customerId: "",
    customerName: "",
    customerPhone: "",
    customerEmail: "",
    deviceType: "phone",
    deviceBrand: "",
    deviceModel: "",
    imei: "",
    accessories: "",
    appearance: "",
    problem: "",
    diagnosis: "",
    estimatedCost: "",
    deposit: "",
    assignedToId: "",
    promisedAt: "",
    note: "",
  });

  function set<K extends keyof typeof form>(key: K, value: string | null) {
    setForm((f) => ({ ...f, [key]: value ?? "" }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.problem.trim()) {
      toast.error("Vui lòng mô tả vấn đề thiết bị");
      return;
    }
    if (customerMode === "existing" && !form.customerId) {
      toast.error("Vui lòng chọn khách hàng");
      return;
    }
    if (customerMode === "new" && (!form.customerName || !form.customerPhone)) {
      toast.error("Vui lòng nhập tên và số điện thoại khách hàng");
      return;
    }
    startTransition(async () => {
      const res = await createServiceTicket({
        ...form,
        customerMode,
        estimatedCost: Number(form.estimatedCost) || 0,
        deposit: Number(form.deposit) || 0,
        promisedAt: form.promisedAt || null,
      });
      if (res.ok) {
        toast.success(`Tạo phiếu ${res.code} thành công!`);
        router.push(`/service/${res.id}`);
      } else {
        toast.error(res.error || "Có lỗi xảy ra");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Khách hàng</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button
              type="button"
              variant={customerMode === "existing" ? "default" : "outline"}
              size="sm"
              onClick={() => setCustomerMode("existing")}
            >
              Khách có sẵn
            </Button>
            <Button
              type="button"
              variant={customerMode === "new" ? "default" : "outline"}
              size="sm"
              onClick={() => setCustomerMode("new")}
            >
              Khách mới
            </Button>
          </div>

          {customerMode === "existing" ? (
            <div className="space-y-2">
              <Label>Chọn khách hàng *</Label>
              <Select
                value={form.customerId}
                onValueChange={(v) => set("customerId", v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Tìm và chọn khách hàng..." />
                </SelectTrigger>
                <SelectContent>
                  {customers.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name} · {c.phone}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Field label="Tên khách hàng *">
                <Input
                  value={form.customerName}
                  onChange={(e) => set("customerName", e.target.value)}
                  placeholder="Nguyễn Văn A"
                  required
                />
              </Field>
              <Field label="Số điện thoại *">
                <Input
                  value={form.customerPhone}
                  onChange={(e) => set("customerPhone", e.target.value)}
                  placeholder="0901234567"
                  required
                />
              </Field>
              <Field label="Email">
                <Input
                  type="email"
                  value={form.customerEmail}
                  onChange={(e) => set("customerEmail", e.target.value)}
                />
              </Field>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Thông tin thiết bị</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Field label="Loại thiết bị *">
              <Select
                value={form.deviceType}
                onValueChange={(v) => set("deviceType", v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="phone">Điện thoại</SelectItem>
                  <SelectItem value="laptop">Laptop</SelectItem>
                  <SelectItem value="tablet">Máy tính bảng</SelectItem>
                  <SelectItem value="other">Khác</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label="Hãng">
              <Input
                value={form.deviceBrand}
                onChange={(e) => set("deviceBrand", e.target.value)}
                placeholder="Apple, Samsung, Dell..."
              />
            </Field>
            <Field label="Model">
              <Input
                value={form.deviceModel}
                onChange={(e) => set("deviceModel", e.target.value)}
                placeholder="iPhone 15 Pro, MacBook Air..."
              />
            </Field>
            <Field label="IMEI / Serial Number">
              <Input
                value={form.imei}
                onChange={(e) => set("imei", e.target.value)}
                className="font-mono"
              />
            </Field>
            <Field label="Phụ kiện đi kèm">
              <Input
                value={form.accessories}
                onChange={(e) => set("accessories", e.target.value)}
                placeholder="Pin, sạc, cáp, sim..."
              />
            </Field>
            <Field label="Tình trạng bên ngoài">
              <Input
                value={form.appearance}
                onChange={(e) => set("appearance", e.target.value)}
                placeholder="Trầy xước nhẹ, móp góc..."
              />
            </Field>
          </div>
          <Field label="Vấn đề / Lỗi cần sửa *">
            <Textarea
              value={form.problem}
              onChange={(e) => set("problem", e.target.value)}
              rows={3}
              placeholder="Mô tả chi tiết lỗi, hiện tượng máy gặp phải..."
              required
            />
          </Field>
          <Field label="Chẩn đoán ban đầu">
            <Textarea
              value={form.diagnosis}
              onChange={(e) => set("diagnosis", e.target.value)}
              rows={2}
              placeholder="Đánh giá ban đầu của kỹ thuật viên..."
            />
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Phân công & Báo giá</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Kỹ thuật viên phụ trách">
              <Select
                value={form.assignedToId}
                onValueChange={(v) => set("assignedToId", v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Chưa phân công" />
                </SelectTrigger>
                <SelectContent>
                  {technicians.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Hẹn trả máy">
              <Input
                type="datetime-local"
                value={form.promisedAt}
                onChange={(e) => set("promisedAt", e.target.value)}
              />
            </Field>
            <Field label="Báo giá dự kiến (VND)">
              <Input
                type="number"
                min={0}
                value={form.estimatedCost}
                onChange={(e) => set("estimatedCost", e.target.value)}
                placeholder="0"
              />
            </Field>
            <Field label="Đặt cọc (VND)">
              <Input
                type="number"
                min={0}
                value={form.deposit}
                onChange={(e) => set("deposit", e.target.value)}
                placeholder="0"
              />
            </Field>
          </div>
          <Field label="Ghi chú">
            <Textarea
              value={form.note}
              onChange={(e) => set("note", e.target.value)}
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
        <Button type="submit" disabled={pending}>
          {pending && <Loader2 className="size-4 animate-spin" />}
          <Save className="size-4" />
          Lưu phiếu
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
    <div className="space-y-2">
      <Label>{label}</Label>
      {children}
    </div>
  );
}
