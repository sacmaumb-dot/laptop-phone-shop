"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { updateServiceTicket } from "../actions";

type Ticket = {
  id: string;
  diagnosis: string | null;
  solution: string | null;
  estimatedCost: number;
  finalCost: number;
  paid: number;
  warranty: number;
  assignedToId: string | null;
  promisedAt: string | null;
  note: string | null;
};

export function ServiceUpdateForm({
  ticket,
  technicians,
}: {
  ticket: Ticket;
  technicians: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [form, setForm] = useState({
    diagnosis: ticket.diagnosis || "",
    solution: ticket.solution || "",
    estimatedCost: String(ticket.estimatedCost),
    finalCost: String(ticket.finalCost),
    paid: String(ticket.paid),
    warranty: String(ticket.warranty),
    assignedToId: ticket.assignedToId || "",
    promisedAt: ticket.promisedAt || "",
    note: ticket.note || "",
  });

  function set<K extends keyof typeof form>(k: K, v: string | null) {
    setForm((f) => ({ ...f, [k]: v ?? "" }));
  }

  function submit() {
    startTransition(async () => {
      const res = await updateServiceTicket(ticket.id, {
        diagnosis: form.diagnosis,
        solution: form.solution,
        estimatedCost: Number(form.estimatedCost) || 0,
        finalCost: Number(form.finalCost) || 0,
        paid: Number(form.paid) || 0,
        warranty: Number(form.warranty) || 0,
        assignedToId: form.assignedToId,
        promisedAt: form.promisedAt || null,
        note: form.note,
      });
      if (res.ok) {
        toast.success("Đã lưu thông tin");
        router.refresh();
      } else {
        toast.error(res.error || "Lỗi");
      }
    });
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Chẩn đoán</Label>
        <Textarea
          value={form.diagnosis}
          onChange={(e) => set("diagnosis", e.target.value)}
          rows={2}
        />
      </div>
      <div className="space-y-2">
        <Label>Giải pháp / Linh kiện thay</Label>
        <Textarea
          value={form.solution}
          onChange={(e) => set("solution", e.target.value)}
          rows={2}
        />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label>Báo giá (VND)</Label>
          <Input
            type="number"
            min={0}
            value={form.estimatedCost}
            onChange={(e) => set("estimatedCost", e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label>Chi phí cuối (VND)</Label>
          <Input
            type="number"
            min={0}
            value={form.finalCost}
            onChange={(e) => set("finalCost", e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label>Đã thanh toán (VND)</Label>
          <Input
            type="number"
            min={0}
            value={form.paid}
            onChange={(e) => set("paid", e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label>Bảo hành (tháng)</Label>
          <Input
            type="number"
            min={0}
            value={form.warranty}
            onChange={(e) => set("warranty", e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label>KTV phụ trách</Label>
          <Select
            value={form.assignedToId}
            onValueChange={(v) => set("assignedToId", v)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Chưa phân công" />
            </SelectTrigger>
            <SelectContent>
              {technicians.map((t) => (
                <SelectItem key={t.id} value={t.id}>
                  {t.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Hẹn trả</Label>
          <Input
            type="datetime-local"
            value={form.promisedAt}
            onChange={(e) => set("promisedAt", e.target.value)}
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label>Ghi chú</Label>
        <Textarea
          value={form.note}
          onChange={(e) => set("note", e.target.value)}
          rows={2}
        />
      </div>
      <div className="flex justify-end">
        <Button onClick={submit} disabled={pending}>
          {pending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Save className="size-4" />
          )}
          Lưu thông tin
        </Button>
      </div>
    </div>
  );
}
