"use client"

import { useState } from "react"
import { useDashboard } from "@/hooks/use-dashboard"
import { KpiCard } from "./kpi-card"
import { DonutCard } from "./donut-card"
import { AreaChartCard } from "./area-chart-card"
import { BarListCard } from "./bar-list-card"
import { DashboardFilters } from "./dashboard-filters"
import { RefreshCw, Ship, MapPin, Package, Warehouse } from "lucide-react"
import type { DashboardFilters as FilterValues } from "@/utils/dashboard"

const defaultFilters: FilterValues = {
  dateFrom: "",
  dateTo: "",
  status: "",
}

function DashboardContent({
  data,
}: {
  data: ReturnType<typeof useDashboard>
}) {
  const { shipments, routes, products, warehouses, transports } = data.queries

  return (
    <div className="space-y-6">
      {/* Row 1 — KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          title="Total Envíos"
          value={data.totalShipments}
          icon={Ship}
          accentColor="blue"
          loading={shipments.isLoading}
          error={shipments.isError}
        />
        <KpiCard
          title="Rutas Activas"
          value={data.activeRoutes}
          icon={MapPin}
          accentColor="emerald"
          loading={routes.isLoading}
          error={routes.isError}
        />
        <KpiCard
          title="Stock Total"
          value={data.totalStock}
          icon={Package}
          accentColor="amber"
          loading={products.isLoading}
          error={products.isError}
        />
        <KpiCard
          title="Almacenes Activos"
          value={data.activeWarehouses}
          icon={Warehouse}
          accentColor="violet"
          loading={warehouses.isLoading}
          error={warehouses.isError}
        />
      </div>

      {/* Row 2 — Donuts */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <DonutCard
          title="Envíos por Estado"
          data={data.shipmentsByStatus}
          loading={shipments.isLoading}
          error={shipments.isError}
          onRetry={() => shipments.refetch()}
          description="Distribución de envíos según su estado actual (pendiente, en tránsito, entregado, etc.)"
          colors={[
            "yellow",
            "blue",
            "cyan",
            "green",
            "red",
          ]}
        />
        <DonutCard
          title="Rutas por Estado"
          data={data.routesByStatus}
          loading={routes.isLoading}
          error={routes.isError}
          onRetry={() => routes.refetch()}
          description="Distribución de rutas según su estado (planificada, en progreso, completada, cancelada)"
          colors={["blue", "cyan", "green", "red"]}
        />
        <DonutCard
          title="Disponibilidad Vehículos"
          data={data.availability}
          loading={transports.isLoading}
          error={transports.isError}
          onRetry={() => transports.refetch()}
          description="Vehículos disponibles vs no disponibles en la flota"
          colors={["emerald", "red"]}
        />
      </div>

      {/* Row 3 — Area Chart */}
      <AreaChartCard
        title="Envíos en el Tiempo"
        data={data.shipmentsByMonth}
        loading={shipments.isLoading}
        error={shipments.isError}
        onRetry={() => shipments.refetch()}
        description="Evolución mensual de envíos registrados"
      />

      {/* Row 4 — Bar Lists */}
      <div className="grid gap-4 sm:grid-cols-2">
        <BarListCard
          title="Productos con Stock Bajo"
          data={data.lowStock}
          loading={products.isLoading}
          error={products.isError}
          onRetry={() => products.refetch()}
          description="Productos cuyo stock actual está por debajo del nivel mínimo configurado"
          sortOrder="ascending"
          valueFormatter={(n: number) =>
            `${n.toLocaleString("es-PE")} uds.`
          }
        />
        <BarListCard
          title="Envíos por Ciudad"
          data={data.shipmentsByCity}
          loading={shipments.isLoading}
          error={shipments.isError}
          onRetry={() => shipments.refetch()}
          description="Cantidad de envíos agrupados por ciudad de destino"
        />
      </div>
    </div>
  )
}

export function DashboardAnalytics() {
  const [filters, setFilters] = useState<FilterValues>(defaultFilters)
  const dashboardData = useDashboard(filters)

  const { shipments, routes, products, warehouses, transports } = dashboardData.queries

  const hasData =
    (dashboardData.queries.shipments.data ?? []).length > 0 ||
    (dashboardData.queries.routes.data ?? []).length > 0 ||
    (dashboardData.queries.products.data ?? []).length > 0 ||
    (dashboardData.queries.warehouses.data ?? []).length > 0 ||
    (dashboardData.queries.transports.data ?? []).length > 0

  const isAnythingLoading =
    shipments.isLoading ||
    routes.isLoading ||
    products.isLoading ||
    warehouses.isLoading ||
    transports.isLoading

  return (
    <section aria-label="Analytics del dashboard" className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-xl font-semibold tracking-tight">
            Analytics
          </h2>
          <p className="text-sm text-muted-foreground">
            Resumen del estado actual del sistema logístico.
          </p>
        </div>
        {isAnythingLoading && (
          <RefreshCw className="h-4 w-4 animate-spin text-muted-foreground" />
        )}
      </div>

      <DashboardFilters
        filters={filters}
        onChange={setFilters}
      />

      {hasData ? (
        <DashboardContent data={dashboardData} />
      ) : (
        <div className="flex h-40 items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground">
          No hay datos disponibles. Agrega registros en los
          módulos para ver analytics.
        </div>
      )}
    </section>
  )
}
