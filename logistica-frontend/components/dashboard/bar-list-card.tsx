"use client"

import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card"
import { ChartSkeleton } from "./chart-skeleton"
import { ChartError } from "./chart-error"
import { EmptyState } from "./empty-state"
import { Info, List } from "lucide-react"

interface BarListCardProps {
  title: string
  data: { name: string; value: number }[]
  loading?: boolean
  error?: boolean
  valueFormatter?: (n: number) => string
  sortOrder?: "ascending" | "descending" | "none"
  description?: string
  onRetry?: () => void
}

function sortData(
  data: { name: string; value: number }[],
  order: "ascending" | "descending" | "none",
) {
  if (order === "none") return data
  return [...data].sort((a, b) =>
    order === "descending" ? b.value - a.value : a.value - b.value,
  )
}

export function BarListCard({
  title,
  data,
  loading,
  error,
  valueFormatter,
  sortOrder = "descending",
  description,
  onRetry,
}: BarListCardProps) {
  const sorted = sortData(data, sortOrder)
  const maxValue = Math.max(...sorted.map((d) => d.value), 1)

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
          <ChartSkeleton variant="bar" />
        ) : error ? (
          <ChartError
            message={title.toLocaleLowerCase()}
            onRetry={onRetry}
          />
        ) : data.length === 0 ? (
          <EmptyState
            message={`Sin datos de ${title.toLocaleLowerCase()}`}
            icon={List}
          />
        ) : (
          <div className="space-y-2.5">
            {sorted.map((item) => {
              const pct = (item.value / maxValue) * 100
              return (
                <div key={item.name} className="flex items-center gap-3">
                  <span className="w-28 shrink-0 truncate text-sm text-muted-foreground">
                    {item.name}
                  </span>
                  <div className="flex-1 h-5 rounded-md bg-muted relative overflow-hidden">
                    <div
                      className="h-full rounded-md bg-primary/70 transition-all duration-500 ease-out"
                      style={{ width: `${Math.max(pct, 2)}%` }}
                    />
                  </div>
                  <span className="w-16 shrink-0 text-right text-sm font-medium tabular-nums">
                    {valueFormatter
                      ? valueFormatter(item.value)
                      : item.value.toLocaleString("es-PE")}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
