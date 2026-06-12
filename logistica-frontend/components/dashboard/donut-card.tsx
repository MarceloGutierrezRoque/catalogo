"use client"

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts"
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card"
import { ChartSkeleton } from "./chart-skeleton"
import { ChartError } from "./chart-error"
import { EmptyState } from "./empty-state"
import { cn } from "@/lib/utils"
import { Info, PieChartIcon } from "lucide-react"

interface DonutCardProps {
  title: string
  data: { name: string; value: number }[]
  loading?: boolean
  error?: boolean
  colors?: string[]
  description?: string
  onRetry?: () => void
}

const paletteMap: Record<string, string> = {
  blue: "oklch(0.546 0.245 262.881)",
  cyan: "oklch(0.65 0.18 190)",
  emerald: "oklch(0.65 0.2 145)",
  amber: "oklch(0.7 0.2 55)",
  violet: "oklch(0.55 0.2 275)",
  rose: "oklch(0.65 0.2 10)",
  indigo: "oklch(0.55 0.2 275)",
  orange: "oklch(0.7 0.2 55)",
  teal: "oklch(0.65 0.18 180)",
  pink: "oklch(0.65 0.2 340)",
  yellow: "oklch(0.75 0.18 85)",
  green: "oklch(0.6 0.2 145)",
  red: "oklch(0.6 0.2 25)",
}

const swatchMap: Record<string, string> = {
  blue: "bg-[oklch(0.546_0.245_262.881)] dark:bg-[oklch(0.65_0.18_265)]",
  cyan: "bg-[oklch(0.65_0.18_190)]",
  emerald: "bg-[oklch(0.65_0.2_145)]",
  amber: "bg-[oklch(0.7_0.2_55)]",
  violet: "bg-[oklch(0.55_0.2_275)]",
  rose: "bg-[oklch(0.65_0.2_10)]",
  indigo: "bg-[oklch(0.55_0.2_275)]",
  orange: "bg-[oklch(0.7_0.2_55)]",
  teal: "bg-[oklch(0.65_0.18_180)]",
  pink: "bg-[oklch(0.65_0.2_340)]",
  yellow: "bg-[oklch(0.75_0.18_85)]",
  green: "bg-[oklch(0.6_0.2_145)]",
  red: "bg-[oklch(0.6_0.2_25)]",
}

export function DonutCard({
  title,
  data,
  loading,
  error,
  colors,
  description,
  onRetry,
}: DonutCardProps) {
  const palette = colors ?? ["blue", "emerald", "amber", "violet", "rose"]

  const total = data.reduce((sum, d) => sum + d.value, 0)

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
          <ChartSkeleton variant="donut" />
        ) : error ? (
          <ChartError
            message={title.toLocaleLowerCase()}
            onRetry={onRetry}
          />
        ) : data.length === 0 ? (
          <EmptyState
            message={`Sin datos de ${title.toLocaleLowerCase()}`}
            icon={PieChartIcon}
          />
        ) : (
          <div className="space-y-3">
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={data}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={85}
                  isAnimationActive
                >
                  {data.map((_, i) => (
                    <Cell
                      key={i}
                      fill={paletteMap[palette[i % palette.length]] ?? paletteMap.blue}
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: "var(--popover)",
                    border: "1px solid var(--border)",
                    borderRadius: "8px",
                    fontSize: "13px",
                    color: "var(--popover-foreground)",
                  }}
                  formatter={(value, name) => [
                    `${Number(value).toLocaleString("es-PE")} (${total > 0 ? ((Number(value) / total) * 100).toFixed(1) : 0}%)`,
                    name,
                  ]}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap justify-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
              {data.map((item, i) => (
                <div key={item.name} className="flex items-center gap-1.5">
                  <span
                    className={cn(
                      "h-2.5 w-2.5 rounded-full",
                      swatchMap[palette[i % palette.length]] ?? "bg-gray-400",
                    )}
                  />
                  <span>{item.name}</span>
                  <span className="font-medium tabular-nums">
                    {item.value.toLocaleString("es-PE")}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
