"use client"

import { Skeleton } from "@/components/ui/skeleton"

interface ChartSkeletonProps {
  variant?: "default" | "donut" | "area" | "bar"
}

export function ChartSkeleton({ variant = "default" }: ChartSkeletonProps) {
  if (variant === "donut") {
    return (
      <div className="flex min-h-[220px] items-center justify-center gap-6">
        <Skeleton className="h-32 w-32 rounded-full" />
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-2">
              <Skeleton className="h-3 w-3 rounded-full" />
              <Skeleton className="h-3 w-20" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (variant === "area") {
    return (
      <div className="flex min-h-[220px] flex-col items-center justify-end gap-1 px-4 pb-4">
        <div className="flex w-full items-end gap-2">
          {Array.from({ length: 12 }).map((_, i) => (
            <Skeleton
              key={i}
              className="flex-1 rounded-t"
              style={{
                height: `${Math.max(20, Math.min(160, 40 + Math.sin(i * 1.2) * 50 + Math.cos(i * 0.7) * 30))}px`,
              }}
            />
          ))}
        </div>
        <div className="flex w-full gap-2 pt-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-3 flex-1" />
          ))}
        </div>
      </div>
    )
  }

  if (variant === "bar") {
    return (
      <div className="flex min-h-[220px] flex-col justify-center gap-3 px-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <Skeleton className="h-3 w-24 shrink-0" />
            <Skeleton
              className="h-3 rounded"
              style={{
                width: `${Math.max(30, 90 - i * 10)}%`,
              }}
            />
            <Skeleton className="ml-auto h-3 w-12" />
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="flex min-h-[220px] items-center justify-center">
      <Skeleton className="h-full w-full rounded-lg" />
    </div>
  )
}
