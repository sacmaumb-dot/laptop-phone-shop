import { PrismaClient } from "../src/generated/prisma";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding...");

  // Users
  const adminPwd = await bcrypt.hash("admin123", 10);
  const staffPwd = await bcrypt.hash("staff123", 10);
  const techPwd = await bcrypt.hash("tech123", 10);

  await prisma.user.upsert({
    where: { email: "admin@shop.vn" },
    update: {},
    create: {
      email: "admin@shop.vn",
      name: "Quản trị viên",
      password: adminPwd,
      role: "admin",
    },
  });
  await prisma.user.upsert({
    where: { email: "staff@shop.vn" },
    update: {},
    create: {
      email: "staff@shop.vn",
      name: "Nguyễn Văn A",
      password: staffPwd,
      role: "staff",
    },
  });
  const tech = await prisma.user.upsert({
    where: { email: "tech@shop.vn" },
    update: {},
    create: {
      email: "tech@shop.vn",
      name: "Trần KTV",
      password: techPwd,
      role: "technician",
    },
  });

  // Categories
  const cats = [
    { name: "Laptop", slug: "laptop", type: "laptop" },
    { name: "Điện thoại", slug: "dien-thoai", type: "phone" },
    { name: "Phụ kiện", slug: "phu-kien", type: "accessory" },
    { name: "Dịch vụ sửa chữa", slug: "dich-vu", type: "service" },
  ];
  const catMap: Record<string, string> = {};
  for (const c of cats) {
    const cat = await prisma.category.upsert({
      where: { slug: c.slug },
      update: {},
      create: c,
    });
    catMap[c.slug] = cat.id;
  }

  // Products
  const products = [
    {
      sku: "LP001",
      name: "MacBook Pro 14 M3 Pro 18GB 512GB",
      brand: "Apple",
      price: 49990000,
      costPrice: 45000000,
      stock: 5,
      warranty: 12,
      categoryId: catMap["laptop"],
    },
    {
      sku: "LP002",
      name: "MacBook Air 13 M2 8GB 256GB",
      brand: "Apple",
      price: 26990000,
      costPrice: 24000000,
      stock: 8,
      warranty: 12,
      categoryId: catMap["laptop"],
    },
    {
      sku: "LP003",
      name: "Dell XPS 13 Plus i7 16GB 512GB",
      brand: "Dell",
      price: 35990000,
      costPrice: 32000000,
      stock: 3,
      warranty: 24,
      categoryId: catMap["laptop"],
    },
    {
      sku: "LP004",
      name: "Asus ROG Strix G16 i9 RTX4070",
      brand: "Asus",
      price: 47990000,
      costPrice: 42000000,
      stock: 4,
      warranty: 24,
      categoryId: catMap["laptop"],
    },
    {
      sku: "LP005",
      name: "Lenovo ThinkPad X1 Carbon Gen 11",
      brand: "Lenovo",
      price: 39990000,
      costPrice: 35000000,
      stock: 6,
      warranty: 36,
      categoryId: catMap["laptop"],
    },
    {
      sku: "PH001",
      name: "iPhone 15 Pro Max 256GB",
      brand: "Apple",
      price: 32990000,
      costPrice: 30000000,
      stock: 12,
      warranty: 12,
      categoryId: catMap["dien-thoai"],
    },
    {
      sku: "PH002",
      name: "iPhone 15 128GB",
      brand: "Apple",
      price: 22990000,
      costPrice: 20500000,
      stock: 15,
      warranty: 12,
      categoryId: catMap["dien-thoai"],
    },
    {
      sku: "PH003",
      name: "Samsung Galaxy S24 Ultra 256GB",
      brand: "Samsung",
      price: 28990000,
      costPrice: 26000000,
      stock: 10,
      warranty: 12,
      categoryId: catMap["dien-thoai"],
    },
    {
      sku: "PH004",
      name: "Samsung Galaxy A55 5G 256GB",
      brand: "Samsung",
      price: 9990000,
      costPrice: 8500000,
      stock: 20,
      warranty: 12,
      categoryId: catMap["dien-thoai"],
    },
    {
      sku: "PH005",
      name: "Xiaomi 14 Pro 12GB 512GB",
      brand: "Xiaomi",
      price: 19990000,
      costPrice: 17500000,
      stock: 7,
      warranty: 18,
      categoryId: catMap["dien-thoai"],
    },
    {
      sku: "AC001",
      name: "Sạc MagSafe 15W",
      brand: "Apple",
      price: 990000,
      costPrice: 750000,
      stock: 30,
      warranty: 6,
      categoryId: catMap["phu-kien"],
    },
    {
      sku: "AC002",
      name: "AirPods Pro 2",
      brand: "Apple",
      price: 5490000,
      costPrice: 4800000,
      stock: 18,
      warranty: 12,
      categoryId: catMap["phu-kien"],
    },
    {
      sku: "AC003",
      name: "Cáp USB-C to Lightning 1m",
      brand: "Apple",
      price: 590000,
      costPrice: 400000,
      stock: 50,
      warranty: 6,
      categoryId: catMap["phu-kien"],
    },
    {
      sku: "AC004",
      name: "Ốp lưng iPhone 15 Pro Max chính hãng",
      brand: "Spigen",
      price: 690000,
      costPrice: 350000,
      stock: 40,
      warranty: 0,
      categoryId: catMap["phu-kien"],
    },
    {
      sku: "SV001",
      name: "Thay màn hình iPhone 15",
      price: 6500000,
      costPrice: 4500000,
      stock: 999,
      warranty: 3,
      categoryId: catMap["dich-vu"],
    },
    {
      sku: "SV002",
      name: "Thay pin iPhone",
      price: 1500000,
      costPrice: 800000,
      stock: 999,
      warranty: 6,
      categoryId: catMap["dich-vu"],
    },
    {
      sku: "SV003",
      name: "Vệ sinh laptop chuyên sâu",
      price: 350000,
      costPrice: 50000,
      stock: 999,
      warranty: 1,
      categoryId: catMap["dich-vu"],
    },
  ];

  for (const p of products) {
    await prisma.product.upsert({
      where: { sku: p.sku },
      update: {},
      create: p,
    });
  }

  // Customers
  const customers = [
    {
      code: "KH00001",
      name: "Nguyễn Thị Hồng",
      phone: "0901234567",
      email: "hong@gmail.com",
      address: "123 Lê Lợi, Q.1, TP.HCM",
    },
    {
      code: "KH00002",
      name: "Lê Văn Tâm",
      phone: "0912345678",
      email: "tam@gmail.com",
      address: "45 Nguyễn Huệ, Q.1, TP.HCM",
    },
    {
      code: "KH00003",
      name: "Trần Minh Tuấn",
      phone: "0987654321",
      address: "78 Trần Hưng Đạo, Q.5, TP.HCM",
    },
    {
      code: "KH00004",
      name: "Phạm Thu Hà",
      phone: "0976543210",
      email: "ha@yahoo.com",
    },
    {
      code: "KH00005",
      name: "Đỗ Quang Huy",
      phone: "0965432109",
      address: "12 Pasteur, Q.3, TP.HCM",
    },
  ];
  for (const c of customers) {
    await prisma.customer.upsert({
      where: { phone: c.phone },
      update: {},
      create: c,
    });
  }

  // Demo sales
  const allProducts = await prisma.product.findMany();
  const allCustomers = await prisma.customer.findMany();
  const admin = await prisma.user.findUnique({
    where: { email: "admin@shop.vn" },
  });

  if (admin && (await prisma.sale.count()) === 0) {
    for (let i = 0; i < 10; i++) {
      const items = [
        allProducts[Math.floor(Math.random() * allProducts.length)],
        allProducts[Math.floor(Math.random() * allProducts.length)],
      ];
      const subtotal = items.reduce((s, p) => s + p.price, 0);
      const total = subtotal;
      const daysAgo = Math.floor(Math.random() * 14);
      const createdAt = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
      await prisma.sale.create({
        data: {
          code: `HD${String(i + 1).padStart(5, "0")}`,
          subtotal,
          total,
          paid: total,
          paymentMethod: ["cash", "card", "transfer"][i % 3],
          customerId:
            allCustomers[Math.floor(Math.random() * allCustomers.length)].id,
          userId: admin.id,
          createdAt,
          items: {
            create: items.map((p) => ({
              productId: p.id,
              quantity: 1,
              unitPrice: p.price,
              subtotal: p.price,
            })),
          },
        },
      });
    }
  }

  // Demo service tickets
  if (admin && (await prisma.serviceTicket.count()) === 0) {
    const sampleTickets = [
      {
        deviceType: "phone",
        deviceBrand: "Apple",
        deviceModel: "iPhone 14 Pro",
        imei: "353267100123456",
        problem: "Vỡ màn hình, không cảm ứng được",
        diagnosis: "Cần thay màn hình OLED chính hãng",
        estimatedCost: 6500000,
        status: "diagnosing",
        deposit: 1000000,
      },
      {
        deviceType: "laptop",
        deviceBrand: "Dell",
        deviceModel: "XPS 13",
        problem: "Máy chạy chậm, kêu to",
        diagnosis: "Vệ sinh, thay keo tản nhiệt, nâng RAM",
        estimatedCost: 1200000,
        status: "repairing",
      },
      {
        deviceType: "phone",
        deviceBrand: "Samsung",
        deviceModel: "Galaxy S23",
        problem: "Pin chai, sạc lâu",
        diagnosis: "Thay pin chính hãng",
        estimatedCost: 1800000,
        finalCost: 1800000,
        paid: 1800000,
        status: "completed",
      },
      {
        deviceType: "laptop",
        deviceBrand: "Apple",
        deviceModel: "MacBook Air M1",
        problem: "Bàn phím liệt phím",
        diagnosis: "Thay bàn phím",
        estimatedCost: 3500000,
        finalCost: 3500000,
        paid: 3500000,
        status: "delivered",
      },
      {
        deviceType: "phone",
        deviceBrand: "Apple",
        deviceModel: "iPhone 13",
        problem: "Loa trong rè",
        status: "received",
      },
    ];

    for (let i = 0; i < sampleTickets.length; i++) {
      const t = sampleTickets[i];
      const cust = allCustomers[i % allCustomers.length];
      const daysAgo = Math.floor(Math.random() * 10);
      const receivedAt = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
      await prisma.serviceTicket.create({
        data: {
          code: `SC${String(i + 1).padStart(5, "0")}`,
          ...t,
          customerId: cust.id,
          createdById: admin.id,
          assignedToId: tech.id,
          receivedAt,
          createdAt: receivedAt,
          history: {
            create: { status: t.status, note: "Tạo phiếu" },
          },
        },
      });
    }
  }

  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
