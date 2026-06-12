"use client"

import { useMemo } from "react"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"
import type { DashboardFilters } from "@/utils/dashboard"

interface DashboardFiltersProps {
  filters: DashboardFilters
  onChange: (filters: DashboardFilters) => void
}

const statusOptions = [
  { value: "", label: "Todos los estados" },
  { value: "pending", label: "Pendiente" },
  { value: "picked_up", label: "Recogido" },
  { value: "in_transit", label: "En tránsito" },
  { value: "delivered", label: "Entregado" },
  { value: "cancelled", label: "Cancelado" },
]

const defaultFilters: DashboardFilters = {
  dateFrom: "",
  dateTo: "",
  status: "",
}

const statusItems: Record<string, string> = {
  pending: "Pendiente",
  picked_up: "Recogido",
  in_transit: "En tránsito",
  delivered: "Entregado",
  cancelled: "Cancelado",
}

export function DashboardFilters({
  filters,
  onChange,
}: DashboardFiltersProps) {
  const activeCount = useMemo(() => {
    let count = 0
    if (filters.dateFrom) count++
    if (filters.dateTo) count++
    if (filters.status) count++
    return count
  }, [filters])

  const hasActiveFilters = activeCount > 0

  const handleClear = () => {
    onChange(defaultFilters)
  }

  return (
    <div className="rounded-lg border bg-muted/50 dark:bg-muted/20 p-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex flex-wrap items-end gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              Fecha desde
            </label>
            <Input
              type="date"
              value={filters.dateFrom}
              onChange={(e) =>
                onChange({ ...filters, dateFrom: e.target.value })
              }
              className="h-9 w-40"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              Fecha hasta
            </label>
            <Input
              type="date"
              value={filters.dateTo}
              onChange={(e) =>
                onChange({ ...filters, dateTo: e.target.value })
              }
              className="h-9 w-40"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              Estado de envío
            </label>
            <Select
              value={filters.status}
              onValueChange={(val: string | null) =>
                onChange({ ...filters, status: val ?? "" })
              }
              items={statusItems}
            >
              <SelectTrigger className="h-9 w-40">
                <SelectValue placeholder="Todos los estados" />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {hasActiveFilters && (
          <div className="flex items-center gap-2 self-end pb-0.5">
            <Badge variant="secondary" className="h-6 gap-1 text-xs">
              {activeCount} filtro{activeCount !== 1 ? "s" : ""} activo{activeCount !== 1 ? "s" : ""}
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClear}
              className="h-8 gap-1 text-xs text-muted-foreground hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
              Limpiar
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
