"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { updateServiceStatus } from "../actions";
import { SERVICE_STATUSES } from "@/components/service-status-badge";

export function ServiceStatusActions({
  ticketId,
  currentStatus,
}: {
  ticketId: string;
  currentStatus: string;
}) {
  const router = useRouter();
  const [status, setStatus] = useState<string>(currentStatus);
  const setStatusSel = (v: string | null) => setStatus(v ?? currentStatus);
  const [note, setNote] = useState("");
  const [pending, startTransition] = useTransition();

  function submit() {
    if (status === currentStatus && !note) {
      toast.error("Vui lòng đổi trạng thái hoặc thêm ghi chú");
      return;
    }
    startTransition(async () => {
      const res = await updateServiceStatus(ticketId, status, note);
      if (res.ok) {
        toast.success("Đã cập nhật trạng thái");
        setNote("");
        router.refresh();
      } else {
        toast.error(res.error || "Lỗi");
      }
    });
  }

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <Label className="text-xs">Trạng thái mới</Label>
        <Select value={status} onValueChange={setStatusSel}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SERVICE_STATUSES.map((s) => (
              <SelectItem key={s.value} value={s.value}>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label className="text-xs">Ghi chú</Label>
        <Textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={2}
          placeholder="VD: Đã chẩn đoán xong, cần thay màn hình..."
        />
      </div>
      <Button onClick={submit} disabled={pending} className="w-full">
        {pending ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <RefreshCw className="size-4" />
        )}
        Cập nhật
      </Button>
    </div>
  );
}
