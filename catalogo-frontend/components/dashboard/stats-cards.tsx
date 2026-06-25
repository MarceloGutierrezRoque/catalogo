"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Clock, Phone, CheckCircle2, XCircle } from "lucide-react";
import type { DashboardStats } from "@/types/api";

interface StatsCardsProps {
  data: DashboardStats["orders"];
}

const orderConfig = [
  {
    key: "pending" as const,
    label: "Pendientes",
    icon: Clock,
    borderColor: "border-chart-3/30",
    bgIcon: "bg-chart-3/10",
    textIcon: "text-chart-3",
  },
  {
    key: "contacted" as const,
    label: "Contactadas",
    icon: Phone,
    borderColor: "border-chart-1/30",
    bgIcon: "bg-chart-1/10",
    textIcon: "text-chart-1",
  },
  {
    key: "closed" as const,
    label: "Cerradas",
    icon: CheckCircle2,
    borderColor: "border-chart-5/30",
    bgIcon: "bg-chart-5/10",
    textIcon: "text-chart-5",
  },
  {
    key: "cancelled" as const,
    label: "Canceladas",
    icon: XCircle,
    borderColor: "border-destructive/30",
    bgIcon: "bg-destructive/10",
    textIcon: "text-destructive",
  },
] as const;

export function StatsCards({ data }: StatsCardsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {orderConfig.map((config) => {
        const Icon = config.icon;
        const value = data[config.key];

        return (
          <Card
            key={config.key}
            className={`${config.borderColor} border-2`}
          >
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                {config.label}
              </CardTitle>
              <div className={`rounded-full p-2 ${config.bgIcon}`}>
                <Icon className={`h-4 w-4 ${config.textIcon}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className={`text-3xl font-bold ${config.textIcon}`}>
                {value}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                de {data.total} órdenes totales
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
