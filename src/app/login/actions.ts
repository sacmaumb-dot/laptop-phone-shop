"use server";

import { login } from "@/lib/auth";

export async function loginAction(email: string, password: string) {
  try {
    const user = await login(email, password);
    if (!user) {
      return { ok: false as const, error: "Email hoặc mật khẩu không đúng" };
    }
    return { ok: true as const };
  } catch {
    return { ok: false as const, error: "Có lỗi xảy ra. Vui lòng thử lại." };
  }
}
