"use client"

import { Inbox, type LucideIcon } from "lucide-react"
import { Button } from "@/components/ui/button"

interface EmptyStateProps {
  message?: string
  icon?: LucideIcon
  action?: { label: string; onClick: () => void }
}

export function EmptyState({
  message = "Sin datos",
  icon: Icon,
  action,
}: EmptyStateProps) {
  return (
    <div className="flex min-h-[220px] flex-col items-center justify-center gap-3 text-sm text-muted-foreground">
      {Icon ? (
        <Icon className="h-8 w-8 text-muted-foreground/40" />
      ) : (
        <Inbox className="h-8 w-8 text-muted-foreground/40" />
      )}
      <p>{message}</p>
      {action && (
        <Button
          variant="outline"
          size="sm"
          onClick={action.onClick}
          className="text-xs"
        >
          {action.label}
        </Button>
      )}
    </div>
  )
}
