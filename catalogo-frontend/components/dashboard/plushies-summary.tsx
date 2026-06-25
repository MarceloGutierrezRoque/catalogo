"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Package, CheckCircle, XCircle } from "lucide-react";
import type { DashboardStats } from "@/types/api";

interface PlushiesSummaryProps {
  data: DashboardStats["plushies"];
}

export function PlushiesSummary({ data }: PlushiesSummaryProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Package className="h-5 w-5" />
          Peluches
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 sm:grid-cols-3">
          {/* Activos */}
          <div className="flex items-center gap-3 rounded-lg border border-chart-5/20 bg-chart-5/5 p-4">
            <div className="rounded-full bg-chart-5/10 p-2">
              <CheckCircle className="h-5 w-5 text-chart-5" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Activos</p>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-chart-5">
                  {data.active}
                </span>
                <Badge className="bg-chart-5/10 text-chart-5 border-chart-5/20">
                  En catálogo
                </Badge>
              </div>
            </div>
          </div>

          {/* Inactivos */}
          <div className="flex items-center gap-3 rounded-lg border border-destructive/20 bg-destructive/5 p-4">
            <div className="rounded-full bg-destructive/10 p-2">
              <XCircle className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Inactivos</p>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-destructive">
                  {data.inactive}
                </span>
                <Badge className="bg-destructive/10 text-destructive border-destructive/20">
                  No visible
                </Badge>
              </div>
            </div>
          </div>

          {/* Total */}
          <div className="flex items-center gap-3 rounded-lg border bg-muted/50 p-4">
            <div className="rounded-full bg-muted p-2">
              <Package className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total</p>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold">{data.total}</span>
                <Badge variant="outline">Peluches</Badge>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
