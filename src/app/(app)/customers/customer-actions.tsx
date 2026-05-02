"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Pencil, Trash2, Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { CustomerDialog, type CustomerFormValues } from "./customer-dialog";
import { deleteCustomer } from "./actions";

export function NewCustomerButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className="size-4" />
        Thêm khách hàng
      </Button>
      <CustomerDialog open={open} onOpenChange={setOpen} />
    </>
  );
}

export function CustomerRowActions({
  customer,
  variant = "icon",
}: {
  customer: CustomerFormValues;
  variant?: "icon" | "label";
}) {
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  function handleDelete() {
    startTransition(async () => {
      const res = await deleteCustomer(customer.id!);
      if (res.ok) {
        toast.success("Đã xoá khách hàng");
        setConfirmOpen(false);
        router.refresh();
        router.push("/customers");
      } else {
        toast.error(res.error || "Lỗi");
      }
    });
  }

  return (
    <>
      <div className="flex items-center gap-1">
        <Button
          size={variant === "icon" ? "icon" : "sm"}
          variant="ghost"
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            setEditOpen(true);
          }}
          aria-label="Sửa"
          className={variant === "icon" ? "size-7" : ""}
        >
          <Pencil className={variant === "icon" ? "size-3.5" : "size-4"} />
          {variant === "label" && "Sửa"}
        </Button>
        <Button
          size={variant === "icon" ? "icon" : "sm"}
          variant="ghost"
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            setConfirmOpen(true);
          }}
          aria-label="Xoá"
          className={
            variant === "icon"
              ? "size-7 text-red-600 hover:text-red-700 hover:bg-red-50"
              : "text-red-600 hover:text-red-700 hover:bg-red-50"
          }
        >
          <Trash2 className={variant === "icon" ? "size-3.5" : "size-4"} />
          {variant === "label" && "Xoá"}
        </Button>
      </div>

      <CustomerDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        initial={customer}
      />

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Xoá khách hàng?</DialogTitle>
          </DialogHeader>
          <div className="text-sm text-muted-foreground">
            Bạn chắc chắn muốn xoá <b>{customer.name}</b>? Hành động không thể
            hoàn tác. Khách hàng đã có giao dịch không thể xoá.
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
