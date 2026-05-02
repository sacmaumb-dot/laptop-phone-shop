"use client";

import { useState, useTransition } from "react";
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
} from "@/components/ui/dialog";
import { SelectField } from "@/components/ui/select-field";
import { Pencil, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { updateUser, deleteUser } from "./actions";

export type UserFormValues = {
  id: string;
  name: string;
  email: string;
  role: string;
  active: boolean;
};

export function UserRowActions({ user }: { user: UserFormValues }) {
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  function handleDelete() {
    startTransition(async () => {
      const res = await deleteUser(user.id);
      if (res.ok) {
        toast.success("Đã xoá tài khoản");
        setConfirmOpen(false);
        router.refresh();
      } else {
        toast.error(res.error || "Lỗi");
      }
    });
  }

  return (
    <>
      <div className="flex items-center gap-1">
        <Button
          size="icon"
          variant="ghost"
          onClick={() => setEditOpen(true)}
          aria-label="Sửa"
          className="size-7"
        >
          <Pencil className="size-3.5" />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          onClick={() => setConfirmOpen(true)}
          aria-label="Xoá"
          className="size-7 text-red-600 hover:text-red-700 hover:bg-red-50"
        >
          <Trash2 className="size-3.5" />
        </Button>
      </div>

      <UserDialog open={editOpen} onOpenChange={setEditOpen} initial={user} />

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Xoá tài khoản?</DialogTitle>
          </DialogHeader>
          <div className="text-sm text-muted-foreground">
            Bạn chắc chắn muốn xoá <b>{user.name}</b>? Tài khoản đã có giao
            dịch sẽ không thể xoá - hãy tạm khoá thay vì xoá.
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>
              Huỷ
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={pending}
            >
              {pending && <Loader2 className="size-4 animate-spin" />}
              Xoá
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function UserDialog({
  open,
  onOpenChange,
  initial,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  initial: UserFormValues;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [form, setForm] = useState({
    name: initial.name,
    email: initial.email,
    role: initial.role,
    active: initial.active,
    password: "",
  });

  function set<K extends keyof typeof form>(k: K, v: string | boolean | null) {
    setForm((f) => ({ ...f, [k]: v ?? (typeof f[k] === "boolean" ? false : "") }));
  }

  function submit() {
    if (!form.name || !form.email) {
      toast.error("Vui lòng nhập tên và email");
      return;
    }
    if (form.password && form.password.length < 6) {
      toast.error("Mật khẩu cần ít nhất 6 ký tự");
      return;
    }
    startTransition(async () => {
      const res = await updateUser(initial.id, form);
      if (res.ok) {
        toast.success("Đã cập nhật tài khoản");
        onOpenChange(false);
        router.refresh();
      } else {
        toast.error(res.error || "Lỗi");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Sửa tài khoản</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Họ tên *</Label>
            <Input
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Email *</Label>
            <Input
              type="email"
              value={form.email}
              onChange={(e) => set("email", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Mật khẩu mới (để trống nếu không đổi)</Label>
            <Input
              type="password"
              value={form.password}
              onChange={(e) => set("password", e.target.value)}
              minLength={6}
              autoComplete="new-password"
            />
          </div>
          <div className="space-y-2">
            <Label>Vai trò</Label>
            <SelectField
              value={form.role}
              onValueChange={(v) => set("role", v)}
              options={[
                { value: "staff", label: "Nhân viên bán hàng" },
                { value: "technician", label: "Kỹ thuật viên" },
                { value: "admin", label: "Quản trị viên" },
              ]}
              className="w-full"
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              id="active"
              type="checkbox"
              checked={form.active}
              onChange={(e) => set("active", e.target.checked)}
              className="size-4 rounded border"
            />
            <Label htmlFor="active" className="cursor-pointer">
              Hoạt động (bỏ tick để tạm khoá)
            </Label>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
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
