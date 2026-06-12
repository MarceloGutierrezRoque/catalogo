"use client"

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts"
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card"
import { ChartSkeleton } from "./chart-skeleton"
import { ChartError } from "./chart-error"
import { EmptyState } from "./empty-state"
import { Info, TrendingUp } from "lucide-react"

interface AreaChartCardProps {
  title: string
  data: { date: string; Envíos: number }[]
  loading?: boolean
  error?: boolean
  description?: string
  onRetry?: () => void
}

const brandBlue = "oklch(0.546 0.245 262.881)"

export function AreaChartCard({
  title,
  data,
  loading,
  error,
  description,
  onRetry,
}: AreaChartCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="flex items-center gap-2">
          <CardTitle className="text-sm font-medium">
            {title}
          </CardTitle>
          {description && (
            <span title={description}>
              <Info className="h-3.5 w-3.5 text-muted-foreground/60 hover:text-muted-foreground cursor-help" />
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <ChartSkeleton variant="area" />
        ) : error ? (
          <ChartError
            message={title.toLocaleLowerCase()}
            onRetry={onRetry}
          />
        ) : data.length === 0 ? (
          <EmptyState
            message="No hay envíos registrados en este período"
            icon={TrendingUp}
          />
        ) : (
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={brandBlue} stopOpacity={0.3} />
                  <stop offset="100%" stopColor={brandBlue} stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="var(--border)"
                vertical={false}
              />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
              />
              <Tooltip
                contentStyle={{
                  background: "var(--popover)",
                  border: "1px solid var(--border)",
                  borderRadius: "8px",
                  fontSize: "13px",
                  color: "var(--popover-foreground)",
                }}
                formatter={(value) => [Number(value).toLocaleString("es-PE"), "Envíos"]}
                labelStyle={{ fontWeight: 600, marginBottom: 4 }}
              />
              <Area
                type="monotone"
                dataKey="Envíos"
                stroke={brandBlue}
                strokeWidth={2}
                fill="url(#areaFill)"
                isAnimationActive
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  )
}
