"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Search,
  Plus,
  Minus,
  X,
  ShoppingCart,
  Trash2,
  Receipt,
  UserPlus,
  Loader2,
  Smartphone,
  Laptop,
  Wrench,
  Package as PackageIcon,
} from "lucide-react";
import { formatVND } from "@/lib/format";
import { toast } from "sonner";
import { createSale } from "./actions";

type Product = {
  id: string;
  sku: string;
  name: string;
  brand: string | null;
  price: number;
  stock: number;
  categoryType: string;
  categoryId: string;
};

type Category = { id: string; name: string; type: string };
type Customer = { id: string; name: string; phone: string; code: string };

type CartItem = {
  productId: string;
  name: string;
  unitPrice: number;
  quantity: number;
  discount: number;
  imei?: string;
};

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  laptop: <Laptop className="size-4" />,
  phone: <Smartphone className="size-4" />,
  accessory: <PackageIcon className="size-4" />,
  service: <Wrench className="size-4" />,
};

export function PosClient({
  products,
  categories,
  customers,
}: {
  products: Product[];
  categories: Category[];
  customers: Customer[];
}) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [activeCat, setActiveCat] = useState<string>("all");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerId, setCustomerId] = useState<string>("walkin");
  const setCustomerSel = (v: string | null) => setCustomerId(v ?? "walkin");
  const [paymentMethod, setPaymentMethod] = useState<string>("cash");
  const setPaymentSel = (v: string | null) => setPaymentMethod(v ?? "cash");
  const [discount, setDiscount] = useState<number>(0);
  const [note, setNote] = useState("");
  const [openCheckout, setOpenCheckout] = useState(false);
  const [openCart, setOpenCart] = useState(false);
  const [pending, startTransition] = useTransition();

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return products.filter((p) => {
      if (activeCat !== "all" && p.categoryType !== activeCat) return false;
      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        (p.brand || "").toLowerCase().includes(q)
      );
    });
  }, [products, search, activeCat]);

  function addToCart(p: Product) {
    if (p.stock <= 0 && p.categoryType !== "service") {
      toast.error("Sản phẩm đã hết hàng");
      return;
    }
    setCart((curr) => {
      const idx = curr.findIndex((c) => c.productId === p.id);
      if (idx >= 0) {
        const next = [...curr];
        if (
          next[idx].quantity >= p.stock &&
          p.categoryType !== "service"
        ) {
          toast.error("Vượt quá số lượng tồn kho");
          return curr;
        }
        next[idx] = { ...next[idx], quantity: next[idx].quantity + 1 };
        return next;
      }
      return [
        ...curr,
        {
          productId: p.id,
          name: p.name,
          unitPrice: p.price,
          quantity: 1,
          discount: 0,
        },
      ];
    });
  }

  function updateQty(productId: string, qty: number) {
    if (qty <= 0) {
      setCart((curr) => curr.filter((c) => c.productId !== productId));
      return;
    }
    setCart((curr) =>
      curr.map((c) => (c.productId === productId ? { ...c, quantity: qty } : c)),
    );
  }

  function updateImei(productId: string, imei: string) {
    setCart((curr) =>
      curr.map((c) => (c.productId === productId ? { ...c, imei } : c)),
    );
  }

  function removeItem(productId: string) {
    setCart((curr) => curr.filter((c) => c.productId !== productId));
  }

  const subtotal = cart.reduce(
    (s, c) => s + c.unitPrice * c.quantity - c.discount,
    0,
  );
  const total = Math.max(0, subtotal - discount);
  const itemCount = cart.reduce((s, c) => s + c.quantity, 0);

  function handleCheckout() {
    if (cart.length === 0) {
      toast.error("Giỏ hàng trống");
      return;
    }
    setOpenCheckout(true);
  }

  function confirmCheckout() {
    startTransition(async () => {
      const res = await createSale({
        items: cart,
        customerId: customerId === "walkin" ? null : customerId,
        paymentMethod,
        discount,
        note,
      });
      if (res.ok) {
        toast.success(`Tạo hoá đơn ${res.code} thành công!`);
        setCart([]);
        setDiscount(0);
        setNote("");
        setCustomerId("walkin");
        setOpenCheckout(false);
        setOpenCart(false);
        router.refresh();
        router.push(`/sales/${res.id}`);
      } else {
        toast.error(res.error || "Có lỗi xảy ra");
      }
    });
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-4 -mx-2 sm:-mx-0">
      {/* Product catalog */}
      <div className="space-y-4 px-2 sm:px-0">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Bán hàng (POS)</h1>
          <p className="text-sm text-muted-foreground">
            Chọn sản phẩm để thêm vào giỏ hàng.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="Tìm theo tên, mã SKU, thương hiệu..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          <Tabs value={activeCat} onValueChange={setActiveCat}>
            <TabsList className="overflow-x-auto justify-start w-full">
              <TabsTrigger value="all">Tất cả</TabsTrigger>
              {categories.map((c) => (
                <TabsTrigger key={c.id} value={c.type}>
                  <span className="flex items-center gap-1.5">
                    {CATEGORY_ICONS[c.type]}
                    {c.name}
                  </span>
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
          {filtered.map((p) => (
            <button
              key={p.id}
              onClick={() => addToCart(p)}
              disabled={p.stock <= 0 && p.categoryType !== "service"}
              className="text-left disabled:opacity-50 disabled:cursor-not-allowed group"
            >
              <Card className="h-full transition-all hover:border-primary/50 hover:shadow-md group-hover:-translate-y-0.5">
                <CardContent className="p-3 flex flex-col h-full gap-2">
                  <div className="aspect-square bg-muted/40 rounded-md flex items-center justify-center text-muted-foreground">
                    {CATEGORY_ICONS[p.categoryType] || (
                      <PackageIcon className="size-8" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="text-xs text-muted-foreground font-mono">
                      {p.sku}
                    </div>
                    <div className="text-sm font-medium leading-snug line-clamp-2">
                      {p.name}
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-bold text-primary">
                      {formatVND(p.price)}
                    </div>
                    {p.categoryType !== "service" && (
                      <Badge
                        variant={p.stock <= 0 ? "destructive" : "secondary"}
                        className="text-[10px]"
                      >
                        {p.stock <= 0 ? "Hết" : `Còn ${p.stock}`}
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            </button>
          ))}
          {filtered.length === 0 && (
            <div className="col-span-full text-center text-muted-foreground py-12">
              Không tìm thấy sản phẩm phù hợp.
            </div>
          )}
        </div>
      </div>

      {/* Cart - desktop sidebar */}
      <div className="hidden lg:block">
        <CartPanel
          cart={cart}
          subtotal={subtotal}
          total={total}
          discount={discount}
          setDiscount={setDiscount}
          updateQty={updateQty}
          updateImei={updateImei}
          removeItem={removeItem}
          customers={customers}
          customerId={customerId}
          setCustomerId={setCustomerSel}
          onCheckout={handleCheckout}
        />
      </div>

      {/* Cart - mobile sheet */}
      <div className="lg:hidden fixed bottom-4 right-4 z-30">
        <Sheet open={openCart} onOpenChange={setOpenCart}>
          <SheetTrigger
            render={<Button size="lg" className="rounded-full shadow-lg h-14 px-6" />}
          >
            <ShoppingCart className="size-5" />
            <span className="ml-2 font-semibold">{itemCount}</span>
            <Separator orientation="vertical" className="mx-2 h-5 bg-primary-foreground/30" />
            <span>{formatVND(total)}</span>
          </SheetTrigger>
          <SheetContent side="right" className="w-full sm:max-w-md p-0 flex flex-col">
            <CartPanel
              cart={cart}
              subtotal={subtotal}
              total={total}
              discount={discount}
              setDiscount={setDiscount}
              updateQty={updateQty}
              updateImei={updateImei}
              removeItem={removeItem}
              customers={customers}
              customerId={customerId}
              setCustomerId={setCustomerSel}
              onCheckout={handleCheckout}
              className="border-0 shadow-none rounded-none h-full"
            />
          </SheetContent>
        </Sheet>
      </div>

      {/* Checkout dialog */}
      <Dialog open={openCheckout} onOpenChange={setOpenCheckout}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Xác nhận thanh toán</DialogTitle>
            <DialogDescription>
              Vui lòng kiểm tra lại thông tin trước khi tạo hoá đơn.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="rounded-lg border p-3 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Số mặt hàng</span>
                <span className="font-medium">{itemCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tạm tính</span>
                <span className="font-medium">{formatVND(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Giảm giá</span>
                <span className="font-medium text-destructive">
                  -{formatVND(discount)}
                </span>
              </div>
              <Separator />
              <div className="flex justify-between text-base">
                <span className="font-semibold">Tổng cộng</span>
                <span className="font-bold text-primary">
                  {formatVND(total)}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Phương thức thanh toán</Label>
              <Select value={paymentMethod} onValueChange={setPaymentSel}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Tiền mặt</SelectItem>
                  <SelectItem value="card">Thẻ ngân hàng</SelectItem>
                  <SelectItem value="transfer">Chuyển khoản</SelectItem>
                  <SelectItem value="wallet">Ví điện tử</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Ghi chú</Label>
              <Textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Ghi chú cho hoá đơn..."
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenCheckout(false)}>
              Huỷ
            </Button>
            <Button onClick={confirmCheckout} disabled={pending}>
              {pending && <Loader2 className="size-4 animate-spin" />}
              <Receipt className="size-4" />
              Tạo hoá đơn
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function CartPanel({
  cart,
  subtotal,
  total,
  discount,
  setDiscount,
  updateQty,
  updateImei,
  removeItem,
  customers,
  customerId,
  setCustomerId,
  onCheckout,
  className = "",
}: {
  cart: CartItem[];
  subtotal: number;
  total: number;
  discount: number;
  setDiscount: (v: number) => void;
  updateQty: (productId: string, qty: number) => void;
  updateImei: (productId: string, imei: string) => void;
  removeItem: (productId: string) => void;
  customers: Customer[];
  customerId: string;
  setCustomerId: (v: string | null) => void;
  onCheckout: () => void;
  className?: string;
}) {
  return (
    <Card
      className={`sticky top-20 flex flex-col max-h-[calc(100vh-6rem)] ${className}`}
    >
      <div className="p-4 border-b flex items-center gap-2">
        <ShoppingCart className="size-4" />
        <span className="font-semibold">Giỏ hàng</span>
        <Badge variant="secondary" className="ml-auto">
          {cart.length} mặt hàng
        </Badge>
      </div>

      <div className="p-4 border-b space-y-2">
        <Label className="text-xs">Khách hàng</Label>
        <Select value={customerId} onValueChange={setCustomerId}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="walkin">
              <span className="flex items-center gap-2">
                <UserPlus className="size-3.5" />
                Khách lẻ
              </span>
            </SelectItem>
            {customers.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name} · {c.phone}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-2 min-h-0">
        {cart.length === 0 ? (
          <div className="text-center text-sm text-muted-foreground py-12 px-4">
            <ShoppingCart className="size-8 mx-auto mb-3 text-muted-foreground/50" />
            Chưa có sản phẩm nào. <br />
            Bấm vào sản phẩm để thêm vào giỏ.
          </div>
        ) : (
          cart.map((item) => (
            <div
              key={item.productId}
              className="rounded-lg border p-3 space-y-2 bg-card"
            >
              <div className="flex items-start gap-2">
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium leading-snug line-clamp-2">
                    {item.name}
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {formatVND(item.unitPrice)}
                  </div>
                </div>
                <button
                  onClick={() => removeItem(item.productId)}
                  className="text-muted-foreground hover:text-destructive transition-colors p-1"
                  aria-label="Xoá"
                >
                  <X className="size-4" />
                </button>
              </div>

              <Input
                placeholder="IMEI / Serial (nếu có)"
                value={item.imei || ""}
                onChange={(e) => updateImei(item.productId, e.target.value)}
                className="h-8 text-xs"
              />

              <div className="flex items-center justify-between">
                <div className="flex items-center border rounded-md">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-7"
                    onClick={() =>
                      updateQty(item.productId, item.quantity - 1)
                    }
                  >
                    <Minus className="size-3" />
                  </Button>
                  <Input
                    type="number"
                    min={1}
                    value={item.quantity}
                    onChange={(e) =>
                      updateQty(item.productId, Number(e.target.value) || 0)
                    }
                    className="h-7 w-12 text-center border-0 shadow-none focus-visible:ring-0 p-0"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-7"
                    onClick={() =>
                      updateQty(item.productId, item.quantity + 1)
                    }
                  >
                    <Plus className="size-3" />
                  </Button>
                </div>
                <div className="text-sm font-semibold">
                  {formatVND(item.unitPrice * item.quantity)}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="border-t p-4 space-y-3">
        <div className="space-y-2">
          <Label className="text-xs">Giảm giá</Label>
          <Input
            type="number"
            min={0}
            value={discount}
            onChange={(e) => setDiscount(Number(e.target.value) || 0)}
            placeholder="0"
          />
        </div>
        <div className="space-y-1.5 text-sm">
          <div className="flex justify-between text-muted-foreground">
            <span>Tạm tính</span>
            <span>{formatVND(subtotal)}</span>
          </div>
          <div className="flex justify-between text-muted-foreground">
            <span>Giảm giá</span>
            <span className="text-destructive">-{formatVND(discount)}</span>
          </div>
          <Separator />
          <div className="flex justify-between text-base font-bold pt-1">
            <span>Tổng</span>
            <span className="text-primary">{formatVND(total)}</span>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="outline"
            onClick={() => {
              cart.forEach((c) => removeItem(c.productId));
              setDiscount(0);
            }}
            disabled={cart.length === 0}
          >
            <Trash2 className="size-4" />
            Xoá hết
          </Button>
          <Button onClick={onCheckout} disabled={cart.length === 0}>
            <Receipt className="size-4" />
            Thanh toán
          </Button>
        </div>
      </div>
    </Card>
  );
}
