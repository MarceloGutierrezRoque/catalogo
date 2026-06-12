import type { Shipment, Route, Product, Warehouse, Transport } from "@/types/api"

// ─── Filter ───────────────────────────────────────────────

export interface DashboardFilters {
  dateFrom: string
  dateTo: string
  status: string
}

export function applyFilters(
  shipments: Shipment[],
  filters: DashboardFilters,
): Shipment[] {
  let filtered = [...shipments]
  if (filters.dateFrom) {
    filtered = filtered.filter(
      (s) => s.created_at >= filters.dateFrom,
    )
  }
  if (filters.dateTo) {
    filtered = filtered.filter(
      (s) =>
        s.created_at <= filters.dateTo + "T23:59:59Z",
    )
  }
  if (filters.status) {
    filtered = filtered.filter(
      (s) => s.status === filters.status,
    )
  }
  return filtered
}

// ─── KPIs ──────────────────────────────────────────────────

export function countShipments(data: Shipment[]): number {
  return data.filter(
    (s) => s.is_active && s.status !== "cancelled",
  ).length
}

export function countActiveRoutes(data: Route[]): number {
  return data.filter(
    (r) =>
      r.is_active &&
      r.status !== "completed" &&
      r.status !== "cancelled",
  ).length
}

export function sumStock(data: Product[]): number {
  return data
    .filter((p) => p.is_active)
    .reduce((sum, p) => sum + p.stock_quantity, 0)
}

export function countActiveWarehouses(
  data: Warehouse[],
): number {
  return data.filter((w) => w.is_active).length
}

// ─── Labels ────────────────────────────────────────────────

export const shipmentStatusLabels: Record<string, string> = {
  pending: "Pendiente",
  picked_up: "Recogido",
  in_transit: "En tránsito",
  delivered: "Entregado",
  cancelled: "Cancelado",
}

export const routeStatusLabels: Record<string, string> = {
  planned: "Planificada",
  in_progress: "En progreso",
  completed: "Completada",
  cancelled: "Cancelada",
}

// ─── Donut data ────────────────────────────────────────────

export function groupByStatus(
  data: Shipment[],
): { name: string; value: number }[] {
  const map = new Map<string, number>()
  for (const s of data) {
    const label =
      shipmentStatusLabels[s.status] ?? s.status
    map.set(label, (map.get(label) ?? 0) + 1)
  }
  return Array.from(map.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
}

export function groupByRouteStatus(
  data: Route[],
): { name: string; value: number }[] {
  const map = new Map<string, number>()
  for (const r of data) {
    if (!r.is_active) continue
    const label =
      routeStatusLabels[r.status] ?? r.status
    map.set(label, (map.get(label) ?? 0) + 1)
  }
  return Array.from(map.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
}

export function groupByAvailability(
  data: Transport[],
): { name: string; value: number }[] {
  const available = data.filter((t) => t.is_active && t.is_available).length
  const notAvailable = data.filter(
    (t) => t.is_active && !t.is_available,
  ).length
  return [
    { name: "Disponible", value: available },
    { name: "No disponible", value: notAvailable },
  ].filter((d) => d.value > 0)
}

// ─── Area chart data ──────────────────────────────────────

export function groupByMonth(
  data: Shipment[],
): { date: string; Envíos: number }[] {
  const map = new Map<string, number>()
  for (const s of data) {
    const month = s.created_at.slice(0, 7) // "2026-05"
    map.set(month, (map.get(month) ?? 0) + 1)
  }
  return Array.from(map.entries())
    .map(([date, value]) => ({ date, Envíos: value }))
    .sort((a, b) => a.date.localeCompare(b.date))
}

// ─── Bar list data ────────────────────────────────────────

export function lowStockProducts(
  data: Product[],
  limit = 10,
): { name: string; value: number }[] {
  return data
    .filter(
      (p) =>
        p.is_active &&
        p.stock_quantity <= p.min_stock_level,
    )
    .sort(
      (a, b) => a.stock_quantity - b.stock_quantity,
    )
    .slice(0, limit)
    .map((p) => ({
      name: p.name,
      value: p.stock_quantity,
    }))
}

export function groupByCity(
  data: Shipment[],
  limit = 10,
): { name: string; value: number }[] {
  const map = new Map<string, number>()
  for (const s of data) {
    if (!s.destination_city) continue
    map.set(
      s.destination_city,
      (map.get(s.destination_city) ?? 0) + 1,
    )
  }
  return Array.from(map.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, limit)
}

// ─── Formatters ────────────────────────────────────────────

export function formatNumber(n: number): string {
  return n.toLocaleString("es-PE")
}
