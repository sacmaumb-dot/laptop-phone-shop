"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { registerAction } from "./actions";

export function RegisterForm() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [shopName, setShopName] = useState("");
  const [subdomain, setSubdomain] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  function normalizeSubdomain(v: string) {
    return v
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 32);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const res = await registerAction({
        shopName,
        subdomain,
        ownerName,
        email,
        password,
      });
      if (res.ok) {
        toast.success("Tạo cửa hàng thành công");
        router.push("/pos");
        router.refresh();
      } else {
        toast.error(res.error || "Đăng ký thất bại");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="shopName">Tên cửa hàng</Label>
        <Input
          id="shopName"
          value={shopName}
          onChange={(e) => setShopName(e.target.value)}
          required
          placeholder="VD: Cửa hàng IXFIX"
          autoComplete="organization"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="subdomain">Định danh cửa hàng</Label>
        <div className="flex items-center rounded-md border focus-within:ring-2 focus-within:ring-ring overflow-hidden">
          <Input
            id="subdomain"
            value={subdomain}
            onChange={(e) =>
              setSubdomain(normalizeSubdomain(e.target.value))
            }
            required
            placeholder="cua-hang-cua-ban"
            className="border-0 focus-visible:ring-0"
          />
          <span className="px-3 py-2 text-sm text-muted-foreground bg-muted border-l">
            .mypos.app
          </span>
        </div>
        <p className="text-xs text-muted-foreground">
          Chỉ chữ thường, số và dấu “-”, dài 2–32 ký tự.
        </p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="ownerName">Tên chủ cửa hàng</Label>
        <Input
          id="ownerName"
          value={ownerName}
          onChange={(e) => setOwnerName(e.target.value)}
          required
          placeholder="Họ và tên"
          autoComplete="name"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">Email đăng nhập</Label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
          placeholder="ban@email.com"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Mật khẩu</Label>
        <Input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete="new-password"
          minLength={6}
        />
        <p className="text-xs text-muted-foreground">
          Tối thiểu 6 ký tự.
        </p>
      </div>
      <Button type="submit" className="w-full" size="lg" disabled={pending}>
        {pending && <Loader2 className="size-4 animate-spin" />}
        Tạo cửa hàng
      </Button>
    </form>
  );
}
