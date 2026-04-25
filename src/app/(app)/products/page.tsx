import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma";
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
import { Package } from "lucide-react";
import { formatVND } from "@/lib/format";
import { ProductFilter } from "./product-filter";
import { NewProductDialog } from "./new-product-dialog";

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; cat?: string }>;
}) {
  const sp = await searchParams;
  const where: Prisma.ProductWhereInput = { isActive: true };
  if (sp.q) {
    where.OR = [
      { name: { contains: sp.q } },
      { sku: { contains: sp.q } },
      { brand: { contains: sp.q } },
    ];
  }
  if (sp.cat && sp.cat !== "all") {
    where.category = { type: sp.cat };
  }

  const [products, categories] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy: { name: "asc" },
      include: { category: true },
      take: 200,
    }),
    prisma.category.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Sản phẩm / Kho</h1>
          <p className="text-sm text-muted-foreground">
            Quản lý danh mục sản phẩm, giá, tồn kho.
          </p>
        </div>
        <NewProductDialog categories={categories} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="size-4" />
            {products.length} sản phẩm
          </CardTitle>
          <CardDescription>Toàn bộ sản phẩm đang kinh doanh.</CardDescription>
          <ProductFilter categories={categories} />
        </CardHeader>
        <CardContent className="px-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>SKU</TableHead>
                  <TableHead>Tên sản phẩm</TableHead>
                  <TableHead>Danh mục</TableHead>
                  <TableHead>Hãng</TableHead>
                  <TableHead className="text-right">Giá bán</TableHead>
                  <TableHead className="text-right">Giá nhập</TableHead>
                  <TableHead className="text-right">Tồn kho</TableHead>
                  <TableHead className="text-right">BH</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="text-center py-8 text-muted-foreground"
                    >
                      Không có sản phẩm.
                    </TableCell>
                  </TableRow>
                )}
                {products.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-mono text-xs">{p.sku}</TableCell>
                    <TableCell>
                      <div className="font-medium">{p.name}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{p.category.name}</Badge>
                    </TableCell>
                    <TableCell className="text-sm">{p.brand || "—"}</TableCell>
                    <TableCell className="text-right font-medium">
                      {formatVND(p.price)}
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {formatVND(p.costPrice)}
                    </TableCell>
                    <TableCell className="text-right">
                      {p.category.type === "service" ? (
                        <Badge variant="outline">Dịch vụ</Badge>
                      ) : (
                        <Badge
                          variant={
                            p.stock <= 0
                              ? "destructive"
                              : p.stock < 5
                                ? "outline"
                                : "secondary"
                          }
                        >
                          {p.stock}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right text-sm text-muted-foreground">
                      {p.warranty > 0 ? `${p.warranty}t` : "—"}
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
