import { prisma } from "./prisma";
import bcrypt from "bcryptjs";

const SUBDOMAIN_RE = /^[a-z0-9](?:[a-z0-9-]{1,30}[a-z0-9])?$/;

const RESERVED_SUBDOMAINS = new Set([
  "www",
  "app",
  "api",
  "admin",
  "mypos",
  "register",
  "signup",
  "login",
  "auth",
  "dashboard",
  "static",
  "assets",
  "cdn",
  "mail",
  "smtp",
  "imap",
]);

export type RegisterInput = {
  shopName: string;
  subdomain: string;
  email: string;
  password: string;
  ownerName: string;
};

export type RegisterResult =
  | { ok: true; shopId: string; userId: string; subdomain: string }
  | { ok: false; error: string };

export async function registerShop(input: RegisterInput): Promise<RegisterResult> {
  const shopName = input.shopName.trim();
  const subdomain = input.subdomain.trim().toLowerCase();
  const email = input.email.trim().toLowerCase();
  const password = input.password;
  const ownerName = input.ownerName.trim();

  if (!shopName) return { ok: false, error: "Vui lòng nhập tên cửa hàng" };
  if (!subdomain) return { ok: false, error: "Vui lòng nhập tên định danh (subdomain)" };
  if (!SUBDOMAIN_RE.test(subdomain))
    return {
      ok: false,
      error:
        "Định danh chỉ gồm chữ thường, số và dấu '-', dài 2–32 ký tự, không bắt đầu/kết thúc bằng '-'",
    };
  if (RESERVED_SUBDOMAINS.has(subdomain))
    return { ok: false, error: "Định danh này đã được hệ thống giữ chỗ, vui lòng chọn tên khác" };
  if (!ownerName) return { ok: false, error: "Vui lòng nhập tên chủ cửa hàng" };
  if (!email || !email.includes("@"))
    return { ok: false, error: "Email không hợp lệ" };
  if (!password || password.length < 6)
    return { ok: false, error: "Mật khẩu phải có ít nhất 6 ký tự" };

  const existingShop = await prisma.shop.findUnique({ where: { subdomain } });
  if (existingShop)
    return { ok: false, error: "Định danh này đã được đăng ký, vui lòng chọn tên khác" };

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser)
    return { ok: false, error: "Email này đã được đăng ký, vui lòng dùng email khác" };

  const hashed = await bcrypt.hash(password, 10);

  const result = await prisma.$transaction(async (tx) => {
    const shop = await tx.shop.create({
      data: {
        subdomain,
        name: shopName,
        ownerEmail: email,
        status: "trial",
        trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      },
    });

    await tx.appSetting.create({
      data: {
        shopId: shop.id,
        shopName,
      },
    });

    // Default categories so a new shop can start adding products immediately.
    // Admins can edit / add / delete categories from the Products page.
    await tx.category.createMany({
      data: [
        { shopId: shop.id, name: "Laptop", slug: "laptop", type: "laptop" },
        { shopId: shop.id, name: "Điện thoại", slug: "dien-thoai", type: "phone" },
        { shopId: shop.id, name: "Phụ kiện", slug: "phu-kien", type: "accessory" },
        { shopId: shop.id, name: "Linh kiện", slug: "linh-kien", type: "accessory" },
        { shopId: shop.id, name: "Dịch vụ sửa chữa", slug: "dich-vu", type: "service" },
      ],
    });

    const user = await tx.user.create({
      data: {
        shopId: shop.id,
        email,
        name: ownerName,
        password: hashed,
        role: "admin",
      },
    });

    return { shopId: shop.id, userId: user.id, subdomain: shop.subdomain };
  });

  return { ok: true, ...result };
}
