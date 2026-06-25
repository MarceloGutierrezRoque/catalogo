"use client";

import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Save } from "lucide-react";
import {
  ORDER_STATUS_TRANSITIONS,
  ORDER_STATUS_LABELS,
  ORDER_STATUS_COLORS,
} from "@/types/api";

interface OrderStatusSelectProps {
  currentStatus: string;
  onStatusChange: (newStatus: string) => Promise<void>;
  isPending: boolean;
}

export function OrderStatusSelect({
  currentStatus,
  onStatusChange,
  isPending,
}: OrderStatusSelectProps) {
  const allowedTransitions = ORDER_STATUS_TRANSITIONS[currentStatus] ?? [];
  const [selectedStatus, setSelectedStatus] = useState<string>("");

  const handleSave = async () => {
    if (!selectedStatus || selectedStatus === currentStatus) return;
    try {
      await onStatusChange(selectedStatus);
      setSelectedStatus("");
    } catch {
      // Error manejado por el caller
    }
  };

  const hasChanges = selectedStatus && selectedStatus !== currentStatus;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Estado actual:</span>
        <Badge className={ORDER_STATUS_COLORS[currentStatus] ?? ""}>
          {ORDER_STATUS_LABELS[currentStatus] ?? currentStatus}
        </Badge>
      </div>

      <div className="flex items-end gap-2">
        <div className="space-y-1">
          <span className="text-sm text-muted-foreground">Cambiar a:</span>
          <Select value={selectedStatus} onValueChange={(value) => setSelectedStatus(value ?? "")}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Seleccionar estado..." />
            </SelectTrigger>
            <SelectContent>
              {allowedTransitions.map((status) => (
                <SelectItem key={status} value={status}>
                  {ORDER_STATUS_LABELS[status] ?? status}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button
          onClick={handleSave}
          disabled={!hasChanges || isPending}
          className="transition-all duration-200"
        >
          {isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          {isPending ? "Guardando..." : "Guardar"}
        </Button>
      </div>
    </div>
  );
}
