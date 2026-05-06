// Default print template content. Kept in a server-safe-free module so it can
// be imported from client components without pulling in next/headers etc.

export type PrintTemplates = {
  saleHeaderNote: string | null;
  saleFooterNote: string | null;
  saleShowSignature: boolean;
  saleShowUnitPrice: boolean;

  intakeHeaderNote: string | null;
  intakeTerms: string | null;
  intakeFooterNote: string | null;
  intakeShowSignature: boolean;

  returnHeaderNote: string | null;
  returnTerms: string | null;
  returnFooterNote: string | null;
  returnShowSignature: boolean;
  returnWarrantyNote: string | null;
};

export const DEFAULT_PRINT_TEMPLATES: PrintTemplates = {
  saleHeaderNote: null,
  saleFooterNote: "Cảm ơn quý khách! Hẹn gặp lại.",
  saleShowSignature: true,
  saleShowUnitPrice: true,

  intakeHeaderNote: null,
  intakeTerms:
    "• Cửa hàng chỉ giữ máy theo nội dung mô tả ở phiếu này. Khách hàng vui lòng giữ phiếu để nhận lại máy.\n• Báo giá có thể thay đổi sau khi kiểm tra chi tiết, cửa hàng sẽ thông báo trước khi tiến hành sửa.\n• Mọi phát sinh hư hỏng do người dùng tự ý mở máy/sửa chữa nơi khác trước đó, cửa hàng không chịu trách nhiệm.",
  intakeFooterNote: null,
  intakeShowSignature: true,

  returnHeaderNote: null,
  returnTerms:
    "• Khách hàng vui lòng kiểm tra kỹ máy trước khi rời cửa hàng.\n• Bảo hành chỉ áp dụng cho hạng mục đã sửa, các lỗi khác phát sinh sau không thuộc phạm vi bảo hành.",
  returnFooterNote: null,
  returnShowSignature: true,
  returnWarrantyNote: "Bảo hành dịch vụ 30 ngày kể từ ngày trả máy.",
};
