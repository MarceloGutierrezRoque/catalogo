"use client"

import { AlertCircle, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"

interface ChartErrorProps {
  message: string
  onRetry?: () => void
}

export function ChartError({ message, onRetry }: ChartErrorProps) {
  return (
    <div className="flex min-h-[220px] flex-col items-center justify-center gap-3 text-sm text-destructive">
      <div className="flex items-center gap-2">
        <AlertCircle className="h-4 w-4 shrink-0" />
        Error al cargar: {message}
      </div>
      {onRetry && (
        <Button
          variant="outline"
          size="sm"
          onClick={onRetry}
          className="gap-1.5 text-xs"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Reintentar
        </Button>
      )}
    </div>
  )
}
