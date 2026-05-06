import { prisma } from "@/lib/prisma";
import { requireShopSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Settings, Shield, UserCog, Wrench, Mail, Calendar } from "lucide-react";
import { formatDate } from "@/lib/format";
import { NewUserDialog } from "./new-user-dialog";
import { UserRowActions } from "./user-actions";

const ROLE_LABELS: Record<string, string> = {
  admin: "Quản trị",
  staff: "Nhân viên",
  technician: "Kỹ thuật viên",
};

const ROLE_ICONS: Record<string, React.ReactNode> = {
  admin: <Shield className="size-3.5" />,
  staff: <UserCog className="size-3.5" />,
  technician: <Wrench className="size-3.5" />,
};

const ROLE_COLORS: Record<string, string> = {
  admin: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
  staff: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  technician: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
};

export default async function UsersPage() {
  const session = await requireShopSession();
  if (session.role !== "admin") redirect("/dashboard");

  const users = await prisma.user.findMany({
    where: { shopId: session.shopId },
    orderBy: { createdAt: "desc" },
  });
  const counts = {
    admin: users.filter((u) => u.role === "admin").length,
    staff: users.filter((u) => u.role === "staff").length,
    technician: users.filter((u) => u.role === "technician").length,
    active: users.filter((u) => u.active).length,
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Người dùng</h1>
          <p className="text-sm text-muted-foreground">
            Quản lý tài khoản nhân viên và phân quyền hệ thống.
          </p>
        </div>
        <NewUserDialog />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Kpi
          icon={<Settings className="size-4" />}
          label="Tổng tài khoản"
          value={String(users.length)}
          tone="primary"
        />
        <Kpi
          icon={<Shield className="size-4" />}
          label="Quản trị"
          value={String(counts.admin)}
        />
        <Kpi
          icon={<UserCog className="size-4" />}
          label="Nhân viên"
          value={String(counts.staff)}
        />
        <Kpi
          icon={<Wrench className="size-4" />}
          label="Kỹ thuật viên"
          value={String(counts.technician)}
        />
      </div>

      <Card>
        <CardHeader className="border-b pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Settings className="size-4" />
            Danh sách ({users.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2">
            {users.map((u) => {
              const initials = u.name
                .split(" ")
                .filter(Boolean)
                .slice(-2)
                .map((p) => p[0])
                .join("")
                .toUpperCase();
              const roleColor =
                ROLE_COLORS[u.role] || "bg-muted text-muted-foreground";
              return (
                <div
                  key={u.id}
                  className="rounded-md border bg-card hover:border-primary/60 hover:shadow-sm transition-all p-3 group relative"
                >
                  <div className="absolute right-1.5 top-1.5 z-10 opacity-0 group-hover:opacity-100 transition">
                    <UserRowActions
                      user={{
                        id: u.id,
                        name: u.name,
                        email: u.email,
                        role: u.role,
                        active: u.active,
                      }}
                    />
                  </div>
                  <div className="flex items-start gap-2.5">
                    <div
                      className={`size-10 shrink-0 rounded-full flex items-center justify-center font-semibold text-sm ${roleColor}`}
                    >
                      {initials || <UserCog className="size-4" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">
                        {u.name}
                      </div>
                      <div className="text-[11px] text-muted-foreground flex items-center gap-1 truncate">
                        <Mail className="size-3 shrink-0" />
                        <span className="truncate">{u.email}</span>
                      </div>
                      <div className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
                        <Calendar className="size-3" />
                        Tạo {formatDate(u.createdAt)}
                      </div>
                    </div>
                  </div>
                  <div className="mt-2 flex items-center justify-between gap-2">
                    <Badge
                      variant="outline"
                      className={`text-[10px] gap-1 ${roleColor}`}
                    >
                      {ROLE_ICONS[u.role]}
                      {ROLE_LABELS[u.role] || u.role}
                    </Badge>
                    {u.active ? (
                      <Badge
                        variant="outline"
                        className="text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                      >
                        Hoạt động
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-[10px]">
                        Tạm khoá
                      </Badge>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Kpi({
  icon,
  label,
  value,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  tone?: "primary";
}) {
  return (
    <Card>
      <CardContent className="p-4 flex items-center gap-3">
        <div
          className={`size-10 rounded-md flex items-center justify-center ${
            tone === "primary"
              ? "bg-primary/10 text-primary"
              : "bg-muted text-muted-foreground"
          }`}
        >
          {icon}
        </div>
        <div className="min-w-0">
          <div className="text-[11px] text-muted-foreground uppercase tracking-wide">
            {label}
          </div>
          <div className="text-base font-bold truncate">{value}</div>
        </div>
      </CardContent>
    </Card>
  );
}
