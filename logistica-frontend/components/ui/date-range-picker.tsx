"use client"

import * as React from "react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { CalendarIcon, X } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverTrigger,
  PopoverPortal,
  PopoverPositioner,
  PopoverPopup,
} from "@/components/ui/popover"
import type { DateRange } from "react-day-picker"

interface DateRangePickerProps {
  value?: DateRange
  onChange?: (range: DateRange | undefined) => void
  placeholder?: string
  className?: string
}

export function DateRangePicker({
  value,
  onChange,
  placeholder = "Seleccionar rango",
  className,
}: DateRangePickerProps) {
  const [open, setOpen] = React.useState(false)
  const [selected, setSelected] = React.useState<DateRange | undefined>(value)

  React.useEffect(() => {
    setSelected(value)
  }, [value])

  const hasSelection = selected?.from || selected?.to

  function formatRange(range: DateRange): string {
    if (range.from && range.to) {
      return `${format(range.from, "d MMM", { locale: es })} - ${format(range.to, "d MMM, yyyy", { locale: es })}`
    }
    if (range.from) {
      return `Desde ${format(range.from, "PPP", { locale: es })}`
    }
    return ""
  }

  function handleSelect(range: DateRange | undefined) {
    setSelected(range)
    if (range?.from && range?.to) {
      onChange?.(range)
      setOpen(false)
    } else {
      onChange?.(range)
    }
  }

  function handleClear(e: React.MouseEvent) {
    e.stopPropagation()
    setSelected(undefined)
    onChange?.(undefined)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        className={cn(
          "inline-flex h-9 w-full items-center justify-between rounded-lg border border-input bg-background px-3 py-2 text-sm whitespace-nowrap shadow-xs outline-none transition-all",
          "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
          !hasSelection && "text-muted-foreground",
          className,
        )}
      >
        {hasSelection ? (
          <span className="tabular-nums text-foreground">
            {formatRange(selected!)}
          </span>
        ) : (
          <span>{placeholder}</span>
        )}
        <div className="flex items-center gap-1">
          {hasSelection && (
            <span
              role="button"
              tabIndex={0}
              className="flex size-4 items-center justify-center rounded-sm text-muted-foreground/60 hover:text-foreground"
              onClick={handleClear}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  handleClear(e as unknown as React.MouseEvent)
                }
              }}
            >
              <X className="size-3.5" />
            </span>
          )}
          <CalendarIcon className="size-4 text-muted-foreground/60" />
        </div>
      </PopoverTrigger>
      <PopoverPortal>
        <PopoverPositioner align="start" sideOffset={4}>
          <PopoverPopup className="w-auto p-3">
            <Calendar
              mode="range"
              selected={selected}
              onSelect={handleSelect}
              numberOfMonths={2}
              captionLayout="dropdown"
              autoFocus
            />
          </PopoverPopup>
        </PopoverPositioner>
      </PopoverPortal>
    </Popover>
  )
}
