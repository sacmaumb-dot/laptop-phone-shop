import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { Laptop, Sparkles } from "lucide-react";
import { RegisterForm } from "./register-form";

export const metadata = {
  title: "Đăng ký cửa hàng — MyPOS",
};

export default async function RegisterPage() {
  const session = await getSession();
  if (session) redirect("/pos");

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      <div className="hidden lg:flex flex-col justify-between bg-gradient-to-br from-primary via-primary to-blue-700 p-12 text-primary-foreground">
        <Link href="/" className="flex items-center gap-2 text-2xl font-bold">
          <div className="size-10 rounded-xl bg-white/15 flex items-center justify-center">
            <Laptop className="size-6" />
          </div>
          MyPOS
        </Link>
        <div className="space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-medium">
            <Sparkles className="size-3.5" />
            Dùng thử miễn phí 14 ngày
          </div>
          <h1 className="text-4xl font-bold leading-tight">
            Tạo cửa hàng riêng
            <br />
            của bạn trong 5 phút.
          </h1>
          <ul className="space-y-2 text-base text-white/85 max-w-md">
            <li>• Dữ liệu cách ly hoàn toàn với các shop khác</li>
            <li>• Tài khoản admin được tạo sẵn ngay khi đăng ký</li>
            <li>• Không cần thẻ tín dụng, huỷ bất cứ lúc nào</li>
          </ul>
        </div>
        <p className="text-sm text-white/60">
          © {new Date().getFullYear()} MyPOS.
        </p>
      </div>

      <div className="flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md space-y-6">
          <Link
            href="/"
            className="lg:hidden flex items-center gap-2 text-2xl font-bold text-primary"
          >
            <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Laptop className="size-6" />
            </div>
            MyPOS
          </Link>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold tracking-tight">
              Đăng ký cửa hàng
            </h2>
            <p className="text-muted-foreground text-sm">
              Tạo cửa hàng và tài khoản quản trị đầu tiên cho shop của bạn.
            </p>
          </div>
          <RegisterForm />
          <p className="text-sm text-muted-foreground text-center">
            Đã có tài khoản?{" "}
            <Link
              href="/login"
              className="text-primary hover:underline font-medium"
            >
              Đăng nhập
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
