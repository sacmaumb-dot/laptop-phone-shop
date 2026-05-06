"use server";

import { registerShop } from "@/lib/register";
import { login } from "@/lib/auth";

export async function registerAction(input: {
  shopName: string;
  subdomain: string;
  ownerName: string;
  email: string;
  password: string;
}) {
  const res = await registerShop(input);
  if (!res.ok) return { ok: false as const, error: res.error };
  // Auto-login the newly created admin so they land directly in the POS.
  await login(input.email, input.password);
  return {
    ok: true as const,
    shopId: res.shopId,
    subdomain: res.subdomain,
  };
}
