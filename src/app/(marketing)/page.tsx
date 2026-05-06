import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getShopFromSubdomain } from "@/lib/tenant";
import { buttonVariants } from "@/components/ui/button";
import {
  Laptop,
  Smartphone,
  Wrench,
  ShoppingCart,
  Bell,
  Search,
  BarChart3,
  Boxes,
  Users,
  ShieldCheck,
  Receipt,
  Sparkles,
  Check,
} from "lucide-react";

export const metadata = {
  title: "MyPOS — Phần mềm quản lý cửa hàng laptop & điện thoại",
  description:
    "MyPOS là nền tảng SaaS quản lý bán hàng, sửa chữa, kho và khách hàng — đăng ký 5 phút có cửa hàng riêng.",
};

export default async function LandingPage() {
  // If the request is on a shop subdomain, the landing page should not show:
  // route them to login / dashboard instead.
  const shop = await getShopFromSubdomain();
  if (shop) {
    const session = await getSession();
    redirect(session ? "/pos" : "/login");
  }

  const session = await getSession();

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <header className="border-b bg-background/80 backdrop-blur sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-bold">
            <span className="size-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center">
              <Laptop className="size-4" />
            </span>
            <span>MyPOS</span>
          </Link>
          <nav className="hidden sm:flex items-center gap-1 text-sm">
            <a
              href="#features"
              className="px-3 py-2 rounded-md hover:bg-muted transition"
            >
              Tính năng
            </a>
            <a
              href="#pricing"
              className="px-3 py-2 rounded-md hover:bg-muted transition"
            >
              Bảng giá
            </a>
            <a
              href="#faq"
              className="px-3 py-2 rounded-md hover:bg-muted transition"
            >
              Hỏi đáp
            </a>
          </nav>
          <div className="flex items-center gap-2">
            {session ? (
              <Link
                href="/pos"
                className={buttonVariants({ size: "sm" })}
              >
                Vào hệ thống
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className={buttonVariants({ variant: "ghost", size: "sm" })}
                >
                  Đăng nhập
                </Link>
                <Link
                  href="/register"
                  className={buttonVariants({ size: "sm" })}
                >
                  Dùng thử miễn phí
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden bg-gradient-to-b from-primary/5 to-background">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-24 grid lg:grid-cols-2 gap-10 items-center">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full border bg-background px-3 py-1 text-xs font-medium">
                <Sparkles className="size-3.5 text-primary" />
                SaaS dùng thử 14 ngày, không cần thẻ tín dụng
              </div>
              <h1 className="text-4xl sm:text-5xl font-bold tracking-tight leading-[1.1]">
                Quản lý cửa hàng laptop & điện thoại
                <span className="block text-primary mt-2">
                  trên một nền tảng duy nhất.
                </span>
              </h1>
              <p className="text-lg text-muted-foreground max-w-xl">
                Bán hàng, sửa chữa, kho hàng, khách hàng và báo cáo doanh thu —
                tất cả tích hợp sẵn. Đăng ký 5 phút là có cửa hàng riêng, dữ
                liệu tách biệt hoàn toàn với các shop khác.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link
                  href="/register"
                  className={buttonVariants({ size: "lg" })}
                >
                  Tạo cửa hàng miễn phí
                </Link>
                <Link
                  href="/login"
                  className={buttonVariants({
                    size: "lg",
                    variant: "outline",
                  })}
                >
                  Đã có tài khoản — Đăng nhập
                </Link>
              </div>
              <div className="flex items-center gap-4 text-xs text-muted-foreground pt-2">
                <span className="flex items-center gap-1">
                  <Check className="size-3.5 text-emerald-500" /> Không cần
                  cài đặt
                </span>
                <span className="flex items-center gap-1">
                  <Check className="size-3.5 text-emerald-500" /> Hỗ trợ in
                  80mm & A4
                </span>
                <span className="flex items-center gap-1">
                  <Check className="size-3.5 text-emerald-500" /> Đa người
                  dùng
                </span>
              </div>
            </div>
            <div className="relative">
              <div className="rounded-2xl border bg-card shadow-2xl overflow-hidden">
                <div className="bg-muted/40 border-b px-4 py-3 flex items-center gap-1.5">
                  <span className="size-3 rounded-full bg-red-400" />
                  <span className="size-3 rounded-full bg-yellow-400" />
                  <span className="size-3 rounded-full bg-green-400" />
                  <span className="ml-3 text-xs text-muted-foreground">
                    shop-cua-ban.mypos.app
                  </span>
                </div>
                <div className="p-6 space-y-4">
                  <div className="grid grid-cols-3 gap-3">
                    <MockStat label="Doanh thu hôm nay" value="42.5M" />
                    <MockStat label="Đơn bán" value="18" />
                    <MockStat label="Phiếu sửa" value="6" />
                  </div>
                  <div className="rounded-lg border p-4 space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">HD00018 · Anh Minh</span>
                      <span className="text-emerald-600 font-semibold">
                        4.290.000 ₫
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">SC00012 · Chị Lan</span>
                      <span className="text-blue-600 font-semibold">
                        Đang sửa
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">HD00017 · Anh Hùng</span>
                      <span className="text-emerald-600 font-semibold">
                        980.000 ₫
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="py-20 sm:py-24">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
                Mọi thứ bạn cần để vận hành cửa hàng
              </h2>
              <p className="mt-3 text-muted-foreground">
                Thiết kế dành riêng cho shop laptop & điện thoại — không phải
                phần mềm POS thuần bán hàng đa ngành.
              </p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <Feature
                icon={<ShoppingCart className="size-5" />}
                title="POS bán hàng"
                desc="Multi-tab, mở nhiều đơn cùng lúc, chuyển nhanh giữa khách. Hỗ trợ đa phương thức thanh toán."
              />
              <Feature
                icon={<Wrench className="size-5" />}
                title="Quản lý sửa chữa"
                desc="Phiếu nhận – chẩn đoán – sửa – trả máy đầy đủ. Thông báo cho KTV phụ trách. In phiếu nhận/trả."
              />
              <Feature
                icon={<Boxes className="size-5" />}
                title="Nhập / xuất / kiểm kho"
                desc="Theo dõi tồn kho real-time, ghi đầy đủ lịch sử nhập-xuất-kiểm. Báo động sản phẩm sắp hết."
              />
              <Feature
                icon={<Users className="size-5" />}
                title="Khách hàng & lịch sử"
                desc="Thẻ KH với toàn bộ lịch sử mua hàng, sửa chữa, chi tiêu. Tìm khách qua SĐT siêu nhanh."
              />
              <Feature
                icon={<BarChart3 className="size-5" />}
                title="Báo cáo & đối soát ca"
                desc="Doanh thu theo ngày/tháng, top sản phẩm. Đối soát tiền mặt – chuyển khoản cuối ca trực."
              />
              <Feature
                icon={<Receipt className="size-5" />}
                title="Hoá đơn 80mm & A4"
                desc="Giấy in nhiệt 80mm hoặc A4 bằng 1 click. Tuỳ biến logo, địa chỉ, SĐT shop in lên hoá đơn."
              />
              <Feature
                icon={<Bell className="size-5" />}
                title="Thông báo real-time"
                desc="KTV nhận thông báo khi được giao phiếu, đổi trạng thái. Admin biết phiếu mới ngay lập tức."
              />
              <Feature
                icon={<Search className="size-5" />}
                title="Tìm kiếm toàn cục"
                desc="Cmd+K từ bất cứ đâu, tìm theo SĐT, mã phiếu, IMEI, model, SKU… kết quả gom nhóm rõ ràng."
              />
              <Feature
                icon={<ShieldCheck className="size-5" />}
                title="Phân quyền 3 vai trò"
                desc="Admin – Nhân viên – KTV mỗi vai trò một bộ quyền riêng. Tạm khoá tài khoản 1 click."
              />
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section id="pricing" className="py-20 sm:py-24 bg-muted/30">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
                Bảng giá
              </h2>
              <p className="mt-3 text-muted-foreground">
                Bắt đầu miễn phí 14 ngày, không cần thẻ tín dụng. Huỷ bất cứ
                lúc nào.
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-4 max-w-4xl mx-auto">
              <PricingCard
                name="Free trial"
                price="0₫"
                period="/ 14 ngày"
                features={[
                  "Bán hàng & sửa chữa không giới hạn",
                  "1 cửa hàng, tối đa 3 nhân viên",
                  "Báo cáo cơ bản",
                  "Hỗ trợ qua email",
                ]}
                ctaLabel="Bắt đầu dùng thử"
                ctaHref="/register"
              />
              <PricingCard
                name="Cơ bản"
                price="199.000₫"
                period="/ tháng"
                highlighted
                features={[
                  "Tất cả tính năng Free trial",
                  "Tối đa 10 nhân viên",
                  "Báo cáo nâng cao + đối soát ca",
                  "Sao lưu tự động hằng ngày",
                  "Hỗ trợ ưu tiên",
                ]}
                ctaLabel="Liên hệ tư vấn"
                ctaHref="/register"
              />
              <PricingCard
                name="Pro"
                price="499.000₫"
                period="/ tháng"
                features={[
                  "Tất cả tính năng Cơ bản",
                  "Không giới hạn nhân viên",
                  "Subdomain riêng & branding",
                  "API tích hợp",
                  "Hỗ trợ 24/7",
                ]}
                ctaLabel="Liên hệ tư vấn"
                ctaHref="/register"
              />
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="py-20 sm:py-24">
          <div className="max-w-3xl mx-auto px-4 sm:px-6">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-center mb-12">
              Câu hỏi thường gặp
            </h2>
            <div className="space-y-3">
              <FaqItem
                q="Dữ liệu của tôi có an toàn không?"
                a="Mọi cửa hàng có dữ liệu tách biệt hoàn toàn ở mức database. Chúng tôi sao lưu hằng ngày và mã hoá toàn bộ kết nối qua HTTPS."
              />
              <FaqItem
                q="Tôi có thể chuyển dữ liệu hiện tại sang MyPOS không?"
                a="Có. Chúng tôi hỗ trợ import từ Excel/CSV danh sách sản phẩm và khách hàng. Liên hệ nếu bạn cần migrate từ phần mềm khác."
              />
              <FaqItem
                q="Có hợp đồng dài hạn không?"
                a="Không. Bạn trả theo tháng và có thể huỷ bất kỳ lúc nào. Dữ liệu của bạn vẫn được giữ trong 90 ngày sau khi huỷ."
              />
              <FaqItem
                q="In hoá đơn được những loại giấy nào?"
                a="A4 chuẩn và 80mm giấy in nhiệt cuộn. Bạn chuyển 1 click ngay trên trang xem hoá đơn."
              />
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20 bg-primary text-primary-foreground">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center space-y-6">
            <h2 className="text-3xl sm:text-4xl font-bold">
              Sẵn sàng để có cửa hàng riêng?
            </h2>
            <p className="text-lg text-primary-foreground/80 max-w-xl mx-auto">
              Đăng ký 5 phút, miễn phí 14 ngày, không cần thẻ tín dụng.
            </p>
            <Link
              href="/register"
              className={buttonVariants({ size: "lg", variant: "secondary" })}
            >
              Tạo cửa hàng ngay
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t bg-background">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 flex flex-wrap items-center justify-between gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2 font-medium">
            <span className="size-7 rounded-md bg-primary text-primary-foreground flex items-center justify-center">
              <Laptop className="size-3.5" />
            </span>
            <span>MyPOS</span>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <span>© {new Date().getFullYear()} MyPOS</span>
            <Link href="/login" className="hover:text-foreground transition">
              Đăng nhập
            </Link>
            <Link
              href="/register"
              className="hover:text-foreground transition"
            >
              Đăng ký
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

function MockStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-card p-3">
      <div className="text-[11px] text-muted-foreground">{label}</div>
      <div className="text-lg font-bold mt-0.5">{value}</div>
    </div>
  );
}

function Feature({
  icon,
  title,
  desc,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <div className="rounded-xl border bg-card p-5 hover:shadow-md transition">
      <div className="size-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-3">
        {icon}
      </div>
      <h3 className="font-semibold">{title}</h3>
      <p className="text-sm text-muted-foreground mt-1">{desc}</p>
    </div>
  );
}

function PricingCard({
  name,
  price,
  period,
  features,
  highlighted,
  ctaLabel,
  ctaHref,
}: {
  name: string;
  price: string;
  period: string;
  features: string[];
  highlighted?: boolean;
  ctaLabel: string;
  ctaHref: string;
}) {
  return (
    <div
      className={`rounded-xl border p-6 flex flex-col ${
        highlighted
          ? "border-primary shadow-lg ring-1 ring-primary bg-card"
          : "bg-card"
      }`}
    >
      <div className="flex items-baseline justify-between">
        <h3 className="font-semibold text-lg">{name}</h3>
        {highlighted && (
          <span className="text-[10px] font-bold uppercase tracking-wide rounded-full bg-primary text-primary-foreground px-2 py-0.5">
            Phổ biến
          </span>
        )}
      </div>
      <div className="mt-4">
        <span className="text-3xl font-bold">{price}</span>
        <span className="text-sm text-muted-foreground"> {period}</span>
      </div>
      <ul className="mt-5 space-y-2 text-sm flex-1">
        {features.map((f) => (
          <li key={f} className="flex items-start gap-2">
            <Check className="size-4 text-emerald-500 shrink-0 mt-0.5" />
            <span>{f}</span>
          </li>
        ))}
      </ul>
      <Link
        href={ctaHref}
        className={
          buttonVariants({
            size: "lg",
            variant: highlighted ? "default" : "outline",
          }) + " mt-6 w-full"
        }
      >
        {ctaLabel}
      </Link>
    </div>
  );
}

function FaqItem({ q, a }: { q: string; a: string }) {
  return (
    <details className="group rounded-lg border bg-card p-4 open:shadow-sm">
      <summary className="cursor-pointer font-semibold list-none flex items-center justify-between">
        <span>{q}</span>
        <span className="text-muted-foreground transition group-open:rotate-180">
          ▾
        </span>
      </summary>
      <p className="mt-3 text-sm text-muted-foreground">{a}</p>
    </details>
  );
}

// Suppress unused warnings for icons we may move later
const _unused = { Smartphone, Wrench };
void _unused;
