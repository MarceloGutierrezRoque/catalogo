import { useQuery } from "@tanstack/react-query";
import { fetchDashboard } from "@/services/dashboard";

export const dashboardKeys = {
  all: ["dashboard"] as const,
};

export function useDashboard() {
  return useQuery({
    queryKey: dashboardKeys.all,
    queryFn: fetchDashboard,
    refetchInterval: 30_000, // Refrescar cada 30s (datos en tiempo real)
  });
}
