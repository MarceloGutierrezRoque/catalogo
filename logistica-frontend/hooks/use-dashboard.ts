"use client"

import { useMemo } from "react"
import { useShipments } from "@/hooks/shipments"
import { useRoutes } from "@/hooks/routes"
import { useProducts } from "@/hooks/products"
import { useWarehouses } from "@/hooks/warehouse"
import { useTransports } from "@/hooks/transports"
import {
  applyFilters,
  countShipments,
  countActiveRoutes,
  sumStock,
  countActiveWarehouses,
  groupByStatus,
  groupByRouteStatus,
  groupByAvailability,
  groupByMonth,
  lowStockProducts,
  groupByCity,
  type DashboardFilters,
} from "@/utils/dashboard"

export type DashboardQueries = ReturnType<typeof useDashboard>

export function useDashboard(filters: DashboardFilters) {
  const shipments = useShipments()
  const routes = useRoutes()
  const products = useProducts()
  const warehouses = useWarehouses()
  const transports = useTransports()

  // Aplicar filtros a shipments
  const filteredShipments = useMemo(
    () => applyFilters(shipments.data ?? [], filters),
    [shipments.data, filters],
  )

  // KPIs
  const totalShipments = useMemo(
    () => countShipments(filteredShipments),
    [filteredShipments],
  )
  const activeRoutes = useMemo(
    () => countActiveRoutes(routes.data ?? []),
    [routes.data],
  )
  const totalStock = useMemo(
    () => sumStock(products.data ?? []),
    [products.data],
  )
  const activeWarehouses = useMemo(
    () => countActiveWarehouses(warehouses.data ?? []),
    [warehouses.data],
  )

  // Charts data
  const shipmentsByStatus = useMemo(
    () => groupByStatus(filteredShipments),
    [filteredShipments],
  )
  const routesByStatus = useMemo(
    () => groupByRouteStatus(routes.data ?? []),
    [routes.data],
  )
  const availability = useMemo(
    () => groupByAvailability(transports.data ?? []),
    [transports.data],
  )
  const shipmentsByMonth = useMemo(
    () => groupByMonth(filteredShipments),
    [filteredShipments],
  )
  const lowStock = useMemo(
    () => lowStockProducts(products.data ?? []),
    [products.data],
  )
  const shipmentsByCity = useMemo(
    () => groupByCity(filteredShipments),
    [filteredShipments],
  )

  return {
    queries: {
      shipments,
      routes,
      products,
      warehouses,
      transports,
    },
    totalShipments,
    activeRoutes,
    totalStock,
    activeWarehouses,
    shipmentsByStatus,
    routesByStatus,
    availability,
    shipmentsByMonth,
    lowStock,
    shipmentsByCity,
  }
}
