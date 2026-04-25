import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Settings } from "lucide-react";
import { formatDate } from "@/lib/format";
import { NewUserDialog } from "./new-user-dialog";

const ROLE_LABELS: Record<string, string> = {
  admin: "Quản trị",
  staff: "Nhân viên",
  technician: "Kỹ thuật viên",
};

const ROLE_COLORS: Record<string, string> = {
  admin: "bg-purple-100 text-purple-700 border-purple-200",
  staff: "bg-blue-100 text-blue-700 border-blue-200",
  technician: "bg-amber-100 text-amber-800 border-amber-200",
};

export default async function UsersPage() {
  const session = await getSession();
  if (!session || session.role !== "admin") redirect("/");

  const users = await prisma.user.findMany({ orderBy: { createdAt: "desc" } });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Người dùng</h1>
          <p className="text-sm text-muted-foreground">
            Quản lý tài khoản nhân viên và phân quyền.
          </p>
        </div>
        <NewUserDialog />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="size-4" />
            {users.length} tài khoản
          </CardTitle>
          <CardDescription>
            Tài khoản admin demo: admin@shop.vn / admin123
          </CardDescription>
        </CardHeader>
        <CardContent className="px-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Họ tên</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Vai trò</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead>Ngày tạo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium">{u.name}</TableCell>
                    <TableCell>{u.email}</TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={ROLE_COLORS[u.role] || ""}
                      >
                        {ROLE_LABELS[u.role] || u.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {u.active ? (
                        <Badge variant="outline" className="bg-emerald-100 text-emerald-700 border-emerald-200">
                          Hoạt động
                        </Badge>
                      ) : (
                        <Badge variant="outline">Tạm khoá</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {formatDate(u.createdAt)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
