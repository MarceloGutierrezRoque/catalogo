import api from "@/lib/axios";
import type { DashboardStats } from "@/types/api";

export async function fetchDashboard(): Promise<DashboardStats> {
  const { data } = await api.get<DashboardStats>("/api/dashboard/");
  return data;
}
