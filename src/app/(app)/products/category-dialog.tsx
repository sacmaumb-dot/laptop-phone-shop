"use client";

import { useState, useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { SelectField } from "@/components/ui/select-field";
import {
  Loader2,
  Pencil,
  Plus,
  Trash2,
  Tag,
  Smartphone,
  Wrench,
  Headphones,
  Laptop as LaptopIcon,
} from "lucide-react";
import { toast } from "sonner";
import {
  createCategory,
  updateCategory,
  deleteCategory,
} from "./category-actions";

type Category = {
  id: string;
  name: string;
  slug: string;
  type: string;
};

const TYPE_OPTIONS = [
  { value: "laptop", label: "Laptop" },
  { value: "phone", label: "Điện thoại" },
  { value: "accessory", label: "Phụ kiện / Linh kiện" },
  { value: "service", label: "Dịch vụ sửa chữa" },
];

const TYPE_LABEL: Record<string, string> = {
  laptop: "Laptop",
  phone: "Điện thoại",
  accessory: "Phụ kiện",
  service: "Dịch vụ",
};

const TYPE_ICON: Record<string, React.ReactNode> = {
  laptop: <LaptopIcon className="size-4" />,
  phone: <Smartphone className="size-4" />,
  accessory: <Headphones className="size-4" />,
  service: <Wrench className="size-4" />,
};

export function CategoryManagerDialog({
  categories,
  trigger,
}: {
  categories: Category[];
  trigger?: ReactNode;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [form, setForm] = useState<{ name: string; type: string }>({
    name: "",
    type: "laptop",
  });

  function reset() {
    setEditingId(null);
    setForm({ name: "", type: "laptop" });
  }

  function startEdit(c: Category) {
    setEditingId(c.id);
    setForm({ name: c.name, type: c.type });
  }

  function submit() {
    if (!form.name.trim()) {
      toast.error("Vui lòng nhập tên danh mục");
      return;
    }
    startTransition(async () => {
      const res = editingId
        ? await updateCategory(editingId, form)
        : await createCategory(form);
      if (res.ok) {
        toast.success(editingId ? "Đã cập nhật" : "Đã thêm danh mục");
        reset();
        router.refresh();
      } else {
        toast.error(res.error || "Lỗi");
      }
    });
  }

  function onDelete(id: string, name: string) {
    if (!confirm(`Xoá danh mục "${name}"?`)) return;
    startTransition(async () => {
      const res = await deleteCategory(id);
      if (res.ok) {
        toast.success("Đã xoá");
        router.refresh();
      } else {
        toast.error(res.error || "Lỗi");
      }
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) reset();
      }}
    >
      {trigger ? (
        <DialogTrigger render={trigger as React.ReactElement}></DialogTrigger>
      ) : (
        <DialogTrigger render={<Button variant="outline" />}>
          <Tag className="size-4" />
          Quản lý danh mục
        </DialogTrigger>
      )}
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Quản lý danh mục</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <div className="rounded-md border p-3 space-y-2 bg-muted/30">
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {editingId ? "Sửa danh mục" : "Thêm danh mục mới"}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs">Tên danh mục *</Label>
                <Input
                  value={form.name}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, name: e.target.value }))
                  }
                  placeholder="VD: Laptop gaming"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Loại *</Label>
                <SelectField
                  value={form.type}
                  onValueChange={(v) =>
                    setForm((f) => ({ ...f, type: v ?? "laptop" }))
                  }
                  options={TYPE_OPTIONS}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-1">
              {editingId && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={reset}
                  disabled={pending}
                >
                  Huỷ
                </Button>
              )}
              <Button size="sm" onClick={submit} disabled={pending}>
                {pending && <Loader2 className="size-4 animate-spin" />}
                {editingId ? "Lưu" : (
                  <>
                    <Plus className="size-4" />
                    Thêm
                  </>
                )}
              </Button>
            </div>
          </div>

          <div className="border rounded-md divide-y max-h-[360px] overflow-auto">
            {categories.length === 0 ? (
              <div className="text-center text-sm text-muted-foreground py-8">
                Chưa có danh mục nào
              </div>
            ) : (
              categories.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center justify-between gap-2 p-2.5"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="size-8 rounded-md bg-muted flex items-center justify-center shrink-0">
                      {TYPE_ICON[c.type] ?? <Tag className="size-4" />}
                    </div>
                    <div className="min-w-0">
                      <div className="font-medium text-sm truncate">
                        {c.name}
                      </div>
                      <div className="text-[11px] text-muted-foreground">
                        {TYPE_LABEL[c.type] ?? c.type} · {c.slug}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => startEdit(c)}
                      disabled={pending}
                      aria-label="Sửa"
                    >
                      <Pencil className="size-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onDelete(c.id, c.name)}
                      disabled={pending}
                      aria-label="Xoá"
                    >
                      <Trash2 className="size-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Đóng
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
