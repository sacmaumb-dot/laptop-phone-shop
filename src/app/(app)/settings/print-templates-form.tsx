"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Loader2,
  ShoppingCart,
  Wrench,
  PackageCheck,
  RotateCcw,
} from "lucide-react";
import { toast } from "sonner";
import type { AppSettings } from "@/lib/settings";
import { DEFAULT_PRINT_TEMPLATES } from "@/lib/print-templates-defaults";
import {
  updatePrintTemplates,
  type PrintTemplatesInput,
} from "./actions";

export function PrintTemplatesForm({ initial }: { initial: AppSettings }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [form, setForm] = useState<PrintTemplatesInput>({
    saleHeaderNote: initial.saleHeaderNote ?? "",
    saleFooterNote:
      initial.saleFooterNote ?? DEFAULT_PRINT_TEMPLATES.saleFooterNote ?? "",
    saleShowSignature: initial.saleShowSignature,
    saleShowUnitPrice: initial.saleShowUnitPrice,

    intakeHeaderNote: initial.intakeHeaderNote ?? "",
    intakeTerms: initial.intakeTerms ?? DEFAULT_PRINT_TEMPLATES.intakeTerms ?? "",
    intakeFooterNote: initial.intakeFooterNote ?? "",
    intakeShowSignature: initial.intakeShowSignature,

    returnHeaderNote: initial.returnHeaderNote ?? "",
    returnTerms: initial.returnTerms ?? DEFAULT_PRINT_TEMPLATES.returnTerms ?? "",
    returnFooterNote: initial.returnFooterNote ?? "",
    returnShowSignature: initial.returnShowSignature,
    returnWarrantyNote:
      initial.returnWarrantyNote ?? DEFAULT_PRINT_TEMPLATES.returnWarrantyNote ?? "",
  });

  function set<K extends keyof PrintTemplatesInput>(
    k: K,
    v: PrintTemplatesInput[K],
  ) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  function resetSection(kind: "sale" | "intake" | "return") {
    setForm((f) => {
      if (kind === "sale") {
        return {
          ...f,
          saleHeaderNote: "",
          saleFooterNote: DEFAULT_PRINT_TEMPLATES.saleFooterNote ?? "",
          saleShowSignature: DEFAULT_PRINT_TEMPLATES.saleShowSignature,
          saleShowUnitPrice: DEFAULT_PRINT_TEMPLATES.saleShowUnitPrice,
        };
      }
      if (kind === "intake") {
        return {
          ...f,
          intakeHeaderNote: "",
          intakeTerms: DEFAULT_PRINT_TEMPLATES.intakeTerms ?? "",
          intakeFooterNote: "",
          intakeShowSignature: DEFAULT_PRINT_TEMPLATES.intakeShowSignature,
        };
      }
      return {
        ...f,
        returnHeaderNote: "",
        returnTerms: DEFAULT_PRINT_TEMPLATES.returnTerms ?? "",
        returnFooterNote: "",
        returnShowSignature: DEFAULT_PRINT_TEMPLATES.returnShowSignature,
        returnWarrantyNote: DEFAULT_PRINT_TEMPLATES.returnWarrantyNote ?? "",
      };
    });
  }

  function submit() {
    startTransition(async () => {
      const res = await updatePrintTemplates(form);
      if (res.ok) {
        toast.success("Đã lưu mẫu in");
        router.refresh();
      } else {
        toast.error(res.error || "Lỗi");
      }
    });
  }

  return (
    <div className="space-y-3">
      {/* Sale invoice */}
      <Card>
        <CardHeader className="border-b pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <ShoppingCart className="size-4" />
            Hoá đơn bán hàng
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 space-y-3">
          <Field label="Ghi chú đầu phiếu (hiển thị dưới thông tin cửa hàng)">
            <Input
              value={form.saleHeaderNote}
              onChange={(e) => set("saleHeaderNote", e.target.value)}
              placeholder="VD: MST 0123456789 · Hotline 1900..."
            />
          </Field>
          <Field label="Lời cảm ơn / ghi chú cuối phiếu">
            <Textarea
              value={form.saleFooterNote}
              onChange={(e) => set("saleFooterNote", e.target.value)}
              rows={2}
              placeholder="Cảm ơn quý khách! Hẹn gặp lại."
            />
          </Field>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
            <ToggleRow
              label="Hiện ô ký nhận (A4)"
              hint="Khu vực 'Khách hàng / Nhân viên ký' ở cuối phiếu khi in A4."
              value={form.saleShowSignature}
              onChange={(v) => set("saleShowSignature", v)}
            />
            <ToggleRow
              label="Hiện cột đơn giá (in 80mm)"
              hint="Tắt nếu phiếu nhiệt 80mm bị hẹp, chỉ hiện thành tiền."
              value={form.saleShowUnitPrice}
              onChange={(v) => set("saleShowUnitPrice", v)}
            />
          </div>
          <ResetButton onClick={() => resetSection("sale")} />
        </CardContent>
      </Card>

      {/* Service intake */}
      <Card>
        <CardHeader className="border-b pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Wrench className="size-4" />
            Phiếu nhận máy (sửa chữa)
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 space-y-3">
          <Field label="Ghi chú đầu phiếu">
            <Input
              value={form.intakeHeaderNote}
              onChange={(e) => set("intakeHeaderNote", e.target.value)}
              placeholder="VD: Hotline kỹ thuật ..."
            />
          </Field>
          <Field label="Điều khoản / lưu ý (mỗi dòng 1 ý)">
            <Textarea
              value={form.intakeTerms}
              onChange={(e) => set("intakeTerms", e.target.value)}
              rows={5}
              placeholder={"• Cửa hàng chỉ giữ máy theo nội dung mô tả..."}
            />
          </Field>
          <Field label="Ghi chú cuối phiếu">
            <Input
              value={form.intakeFooterNote}
              onChange={(e) => set("intakeFooterNote", e.target.value)}
              placeholder="(tuỳ chọn)"
            />
          </Field>
          <ToggleRow
            label="Hiện ô ký nhận"
            value={form.intakeShowSignature}
            onChange={(v) => set("intakeShowSignature", v)}
          />
          <ResetButton onClick={() => resetSection("intake")} />
        </CardContent>
      </Card>

      {/* Service return */}
      <Card>
        <CardHeader className="border-b pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <PackageCheck className="size-4" />
            Phiếu trả máy (sửa chữa)
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 space-y-3">
          <Field label="Ghi chú đầu phiếu">
            <Input
              value={form.returnHeaderNote}
              onChange={(e) => set("returnHeaderNote", e.target.value)}
              placeholder="(tuỳ chọn)"
            />
          </Field>
          <Field label="Thông tin bảo hành">
            <Input
              value={form.returnWarrantyNote}
              onChange={(e) => set("returnWarrantyNote", e.target.value)}
              placeholder="VD: Bảo hành 30 ngày kể từ ngày trả máy"
            />
          </Field>
          <Field label="Điều khoản / lưu ý">
            <Textarea
              value={form.returnTerms}
              onChange={(e) => set("returnTerms", e.target.value)}
              rows={4}
              placeholder={"• Khách hàng vui lòng kiểm tra kỹ máy..."}
            />
          </Field>
          <Field label="Ghi chú cuối phiếu">
            <Input
              value={form.returnFooterNote}
              onChange={(e) => set("returnFooterNote", e.target.value)}
              placeholder="(tuỳ chọn)"
            />
          </Field>
          <ToggleRow
            label="Hiện ô ký nhận"
            value={form.returnShowSignature}
            onChange={(v) => set("returnShowSignature", v)}
          />
          <ResetButton onClick={() => resetSection("return")} />
        </CardContent>
      </Card>

      <div className="flex justify-end sticky bottom-2 z-10">
        <Button onClick={submit} disabled={pending} size="lg">
          {pending && <Loader2 className="size-4 animate-spin" />}
          Lưu mẫu in
        </Button>
      </div>
    </div>
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

function ToggleRow({
  label,
  hint,
  value,
  onChange,
}: {
  label: string;
  hint?: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between rounded-md border p-2.5 gap-2">
      <div className="min-w-0">
        <div className="text-sm font-medium">{label}</div>
        {hint && (
          <div className="text-[11px] text-muted-foreground mt-0.5">{hint}</div>
        )}
      </div>
      <Switch checked={value} onCheckedChange={onChange} />
    </div>
  );
}

function ResetButton({ onClick }: { onClick: () => void }) {
  return (
    <div className="flex justify-end">
      <Button variant="ghost" size="sm" onClick={onClick} type="button">
        <RotateCcw className="size-3.5" />
        Đặt lại mặc định
      </Button>
    </div>
  );
}
