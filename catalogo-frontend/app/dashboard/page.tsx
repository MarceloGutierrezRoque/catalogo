"use client";

import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDashboard } from "@/hooks/use-dashboard";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { PlushiesSummary } from "@/components/dashboard/plushies-summary";

export default function DashboardPage() {
  const { data, isLoading, isError, refetch, isFetching } = useDashboard();

  // ── LOADING ──
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <div className="h-9 w-48 bg-muted rounded animate-pulse" />
          <div className="h-5 w-64 bg-muted rounded animate-pulse mt-2" />
        </div>

        {/* Skeleton: 4 cards grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-32 bg-muted rounded-xl animate-pulse" />
          ))}
        </div>

        {/* Skeleton: plushies summary card */}
        <div className="h-40 bg-muted rounded-xl animate-pulse" />

        {/* Skeleton: second row card */}
        <div className="h-32 bg-muted rounded-xl animate-pulse" />
      </div>
    );
  }

  // ── ERROR ──
  if (isError || !data) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <AlertCircle className="h-16 w-16 text-destructive mb-4" />
        <h2 className="text-2xl font-semibold mb-2">
          Error al cargar estadísticas
        </h2>
        <p className="text-muted-foreground mb-6 max-w-md">
          No pudimos obtener los datos del dashboard. Verifica que el servidor
          esté funcionando e intenta nuevamente.
        </p>
        <Button onClick={() => refetch()} disabled={isFetching}>
          <RefreshCw
            className={`mr-2 h-4 w-4 ${isFetching ? "animate-spin" : ""}`}
          />
          Reintentar
        </Button>
      </div>
    );
  }

  // ── SUCCESS ──
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Resumen general del catálogo y pedidos
        </p>
      </div>

      <StatsCards data={data.orders} />
      <PlushiesSummary data={data.plushies} />
    </div>
  );
}
