"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SelectField } from "@/components/ui/select-field";
import { Loader2, Upload, Trash2, Store, Printer } from "lucide-react";
import { toast } from "sonner";
import type { AppSettings } from "@/lib/settings";
import { updateSettings, uploadAsset, clearAsset } from "./actions";

export function SettingsForm({ initial }: { initial: AppSettings }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [form, setForm] = useState({
    shopName: initial.shopName,
    siteTitle: initial.siteTitle,
    shopTagline: initial.shopTagline,
    shopAddress: initial.shopAddress ?? "",
    shopPhone: initial.shopPhone ?? "",
    shopEmail: initial.shopEmail ?? "",
    printSize: initial.printSize,
  });

  function set<K extends keyof typeof form>(k: K, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  function submit() {
    if (!form.shopName || !form.siteTitle) {
      toast.error("Vui lòng nhập tên cửa hàng & tiêu đề trang");
      return;
    }
    startTransition(async () => {
      const res = await updateSettings(form);
      if (res.ok) {
        toast.success("Đã lưu cài đặt");
        router.refresh();
      } else {
        toast.error(res.error || "Lỗi");
      }
    });
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
      <Card className="lg:col-span-2">
        <CardHeader className="border-b pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Store className="size-4" />
            Thông tin cửa hàng
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Field label="Tên cửa hàng *">
              <Input
                value={form.shopName}
                onChange={(e) => set("shopName", e.target.value)}
              />
            </Field>
            <Field label="Slogan / Tagline">
              <Input
                value={form.shopTagline}
                onChange={(e) => set("shopTagline", e.target.value)}
                placeholder="Laptop & Điện thoại"
              />
            </Field>
          </div>
          <Field label="Tiêu đề trang web (browser tab) *">
            <Input
              value={form.siteTitle}
              onChange={(e) => set("siteTitle", e.target.value)}
            />
          </Field>
          <Field label="Địa chỉ cửa hàng (in trên hoá đơn)">
            <Input
              value={form.shopAddress}
              onChange={(e) => set("shopAddress", e.target.value)}
              placeholder="123 Lê Lợi, Q.1, TP.HCM"
            />
          </Field>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Field label="SĐT cửa hàng (in trên hoá đơn)">
              <Input
                value={form.shopPhone}
                onChange={(e) => set("shopPhone", e.target.value)}
                placeholder="1900 1234"
              />
            </Field>
            <Field label="Email cửa hàng">
              <Input
                type="email"
                value={form.shopEmail}
                onChange={(e) => set("shopEmail", e.target.value)}
              />
            </Field>
          </div>

          <div className="border-t pt-3">
            <div className="text-sm font-semibold mb-2 flex items-center gap-1.5">
              <Printer className="size-3.5" />
              Cài đặt in hoá đơn
            </div>
            <Field label="Khổ giấy in mặc định">
              <SelectField
                value={form.printSize}
                onValueChange={(v) => set("printSize", v ?? "A4")}
                options={[
                  { value: "A4", label: "A4 (giấy thường)" },
                  { value: "80mm", label: "80mm (giấy in nhiệt cuộn)" },
                ]}
                className="w-full md:w-72"
              />
            </Field>
          </div>

          <div className="flex justify-end pt-2">
            <Button onClick={submit} disabled={pending}>
              {pending && <Loader2 className="size-4 animate-spin" />}
              Lưu cài đặt
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-3">
        <AssetCard
          kind="logo"
          label="Logo cửa hàng"
          hint="Hiển thị trên header và phiếu in. PNG/JPG/SVG, tối đa 2MB."
          currentUrl={initial.logoUrl}
        />
        <AssetCard
          kind="favicon"
          label="Favicon"
          hint="Biểu tượng tab trình duyệt. Khuyến nghị PNG vuông 32×32 hoặc 64×64."
          currentUrl={initial.faviconUrl}
        />
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

function AssetCard({
  kind,
  label,
  hint,
  currentUrl,
}: {
  kind: "logo" | "favicon";
  label: string;
  hint: string;
  currentUrl: string | null;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  function onPick(file: File) {
    if (file.size > 2 * 1024 * 1024) {
      toast.error("File tối đa 2MB");
      return;
    }
    const fd = new FormData();
    fd.append("file", file);
    fd.append("kind", kind);
    startTransition(async () => {
      const res = await uploadAsset(fd);
      if (res.ok) {
        toast.success("Đã tải lên");
        router.refresh();
      } else {
        toast.error(res.error || "Lỗi");
      }
    });
  }

  function onClear() {
    startTransition(async () => {
      const res = await clearAsset(kind);
      if (res.ok) {
        toast.success("Đã xoá");
        router.refresh();
      } else {
        toast.error(res.error || "Lỗi");
      }
    });
  }

  return (
    <Card>
      <CardHeader className="border-b pb-3">
        <CardTitle className="text-sm">{label}</CardTitle>
      </CardHeader>
      <CardContent className="p-4 space-y-3">
        <div className="aspect-video bg-muted/30 rounded border flex items-center justify-center overflow-hidden">
          {currentUrl ? (
            <Image
              src={currentUrl}
              alt={label}
              width={200}
              height={120}
              className="object-contain max-h-32"
              unoptimized
            />
          ) : (
            <div className="text-xs text-muted-foreground">Chưa có</div>
          )}
        </div>
        <p className="text-[11px] text-muted-foreground">{hint}</p>
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) onPick(f);
              e.target.value = "";
            }}
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => inputRef.current?.click()}
            disabled={pending}
            className="flex-1"
          >
            {pending ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Upload className="size-3.5" />
            )}
            Tải lên
          </Button>
          {currentUrl && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onClear}
              disabled={pending}
              className="text-red-600"
              aria-label="Xoá"
            >
              <Trash2 className="size-3.5" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
