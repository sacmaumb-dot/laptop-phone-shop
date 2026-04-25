"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { createProduct } from "./actions";

export function NewProductDialog({
  categories,
}: {
  categories: { id: string; name: string; type: string }[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [form, setForm] = useState({
    sku: "",
    name: "",
    brand: "",
    categoryId: categories[0]?.id || "",
    price: "",
    costPrice: "",
    stock: "",
    warranty: "",
    description: "",
  });

  function set<K extends keyof typeof form>(k: K, v: string | null) {
    setForm((f) => ({ ...f, [k]: v ?? "" }));
  }

  function submit() {
    if (!form.sku || !form.name || !form.categoryId) {
      toast.error("Vui lòng nhập SKU, tên và danh mục");
      return;
    }
    startTransition(async () => {
      const res = await createProduct({
        sku: form.sku,
        name: form.name,
        brand: form.brand,
        categoryId: form.categoryId,
        price: Number(form.price) || 0,
        costPrice: Number(form.costPrice) || 0,
        stock: Number(form.stock) || 0,
        warranty: Number(form.warranty) || 0,
        description: form.description,
      });
      if (res.ok) {
        toast.success("Đã thêm sản phẩm");
        setOpen(false);
        setForm({
          sku: "",
          name: "",
          brand: "",
          categoryId: categories[0]?.id || "",
          price: "",
          costPrice: "",
          stock: "",
          warranty: "",
          description: "",
        });
        router.refresh();
      } else {
        toast.error(res.error || "Lỗi");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button />}>
        <Plus className="size-4" />
        Thêm sản phẩm
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Thêm sản phẩm mới</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>SKU *</Label>
              <Input
                value={form.sku}
                onChange={(e) => set("sku", e.target.value)}
                placeholder="LP006"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Danh mục *</Label>
              <Select
                value={form.categoryId}
                onValueChange={(v) => set("categoryId", v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Tên sản phẩm *</Label>
            <Input
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="VD: MacBook Pro 16 M3 Max..."
              required
            />
          </div>
          <div className="space-y-2">
            <Label>Hãng</Label>
            <Input
              value={form.brand}
              onChange={(e) => set("brand", e.target.value)}
              placeholder="Apple, Dell, Samsung..."
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Giá bán (VND)</Label>
              <Input
                type="number"
                min={0}
                value={form.price}
                onChange={(e) => set("price", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Giá nhập (VND)</Label>
              <Input
                type="number"
                min={0}
                value={form.costPrice}
                onChange={(e) => set("costPrice", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Tồn kho</Label>
              <Input
                type="number"
                min={0}
                value={form.stock}
                onChange={(e) => set("stock", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Bảo hành (tháng)</Label>
              <Input
                type="number"
                min={0}
                value={form.warranty}
                onChange={(e) => set("warranty", e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Mô tả</Label>
            <Textarea
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              rows={2}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Huỷ
          </Button>
          <Button onClick={submit} disabled={pending}>
            {pending && <Loader2 className="size-4 animate-spin" />}
            Lưu
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
