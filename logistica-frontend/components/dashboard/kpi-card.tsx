"use client"

import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import { TrendingUp, TrendingDown, type LucideIcon } from "lucide-react"

interface KpiCardProps {
  title: string
  value: number
  icon?: LucideIcon
  accentColor?: string
  trend?: { direction: "up" | "down"; percentage: number }
  loading?: boolean
  error?: boolean
  formatter?: (n: number) => string
}

const accentBorderMap: Record<string, string> = {
  blue: "border-l-blue-500",
  emerald: "border-l-emerald-500",
  amber: "border-l-amber-500",
  violet: "border-l-violet-500",
  rose: "border-l-rose-500",
  cyan: "border-l-cyan-500",
}

const accentIconMap: Record<string, string> = {
  blue: "text-blue-600 dark:text-blue-400",
  emerald: "text-emerald-600 dark:text-emerald-400",
  amber: "text-amber-600 dark:text-amber-400",
  violet: "text-violet-600 dark:text-violet-400",
  rose: "text-rose-600 dark:text-rose-400",
  cyan: "text-cyan-600 dark:text-cyan-400",
}

const accentBgMap: Record<string, string> = {
  blue: "bg-blue-100 dark:bg-blue-950",
  emerald: "bg-emerald-100 dark:bg-emerald-950",
  amber: "bg-amber-100 dark:bg-amber-950",
  violet: "bg-violet-100 dark:bg-violet-950",
  rose: "bg-rose-100 dark:bg-rose-950",
  cyan: "bg-cyan-100 dark:bg-cyan-950",
}

export function KpiCard({
  title,
  value,
  icon: Icon,
  accentColor = "blue",
  trend,
  loading,
  error,
  formatter,
}: KpiCardProps) {
  return (
    <Card
      className={cn(
        "border-l-4 transition-all",
        accentBorderMap[accentColor] ?? "border-l-border",
      )}
    >
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        {Icon && (
          <div
            className={cn(
              "rounded-lg p-2",
              accentBgMap[accentColor] ?? "bg-muted",
              accentIconMap[accentColor] ?? "text-muted-foreground",
            )}
          >
            <Icon className="h-4 w-4" />
          </div>
        )}
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-2">
            <Skeleton className="h-8 w-24" />
            <Skeleton className="h-3 w-16" />
          </div>
        ) : error ? (
          <p className="text-sm text-destructive">Error</p>
        ) : (
          <div className="space-y-1">
            <p className="text-3xl font-bold tracking-tight">
              {formatter?.(value) ?? value.toLocaleString("es-PE")}
            </p>
            {trend && (
              <Badge
                variant="secondary"
                className={cn(
                  "gap-1 text-xs font-normal",
                  trend.direction === "up"
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-rose-600 dark:text-rose-400",
                )}
              >
                {trend.direction === "up" ? (
                  <TrendingUp className="h-3 w-3" />
                ) : (
                  <TrendingDown className="h-3 w-3" />
                )}
                {trend.percentage}%
              </Badge>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
