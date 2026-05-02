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
import { Pencil, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { ProductDialog } from "./product-dialog";
import { deleteProduct } from "./actions";

type Category = { id: string; name: string; type: string };

type ExistingProduct = {
  id: string;
  sku: string;
  name: string;
  brand: string | null;
  categoryId: string;
  price: number;
  costPrice: number;
  stock: number;
  warranty: number;
  description: string | null;
};

export function ProductActions({
  product,
  categories,
}: {
  product: ExistingProduct;
  categories: Category[];
}) {
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  function handleDelete() {
    startTransition(async () => {
      const res = await deleteProduct(product.id);
      if (res.ok) {
        toast.success("Đã xoá sản phẩm");
        setDeleteOpen(false);
        router.refresh();
      } else {
        toast.error(res.error || "Lỗi");
      }
    });
  }

  return (
    <div className="flex gap-1">
      <Button
        size="icon"
        variant="ghost"
        className="size-7"
        onClick={(e) => {
          e.stopPropagation();
          setEditOpen(true);
        }}
        aria-label="Sửa"
      >
        <Pencil className="size-3.5" />
      </Button>
      <Button
        size="icon"
        variant="ghost"
        className="size-7 text-destructive hover:text-destructive"
        onClick={(e) => {
          e.stopPropagation();
          setDeleteOpen(true);
        }}
        aria-label="Xoá"
      >
        <Trash2 className="size-3.5" />
      </Button>

      <ProductDialog
        categories={categories}
        product={product}
        open={editOpen}
        onOpenChange={setEditOpen}
      />

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Xoá sản phẩm</DialogTitle>
          </DialogHeader>
          <p className="text-sm">
            Bạn có chắc muốn xoá <b>{product.name}</b> ({product.sku})? Sản
            phẩm sẽ được ẩn khỏi danh sách bán hàng.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>
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
    </div>
  );
}
