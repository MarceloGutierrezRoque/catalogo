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

interface DatePickerProps {
  value?: Date | null
  onChange?: (date: Date | null) => void
  placeholder?: string
  disabled?: boolean
  className?: string
  fromYear?: number
  toYear?: number
}

export function DatePicker({
  value,
  onChange,
  placeholder = "Seleccionar fecha",
  disabled,
  className,
  fromYear,
  toYear,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false)

  const now = new Date()
  const startMonth = fromYear ? new Date(fromYear, 0, 1) : new Date(now.getFullYear() - 100, 0, 1)
  const endMonth = toYear ? new Date(toYear, 11, 31) : new Date(now.getFullYear() + 10, 11, 31)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        disabled={disabled}
        className={cn(
          "inline-flex h-9 w-full items-center justify-between rounded-lg border border-input bg-background px-3 py-2 text-sm whitespace-nowrap shadow-xs outline-none transition-all",
          "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
          "disabled:pointer-events-none disabled:opacity-50",
          !value && "text-muted-foreground",
          className,
        )}
      >
        {value ? (
          <span className="tabular-nums">
            {format(value, "PPP", { locale: es })}
          </span>
        ) : (
          <span>{placeholder}</span>
        )}
        <div className="flex items-center gap-1">
          {value && (
            <span
              role="button"
              tabIndex={0}
              className="flex size-4 items-center justify-center rounded-sm text-muted-foreground/60 hover:text-foreground"
              onClick={(e) => {
                e.stopPropagation()
                onChange?.(null)
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.stopPropagation()
                  onChange?.(null)
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
              mode="single"
              selected={value ?? undefined}
              onSelect={(date) => {
                onChange?.(date ?? null)
                setOpen(false)
              }}
              startMonth={startMonth}
              endMonth={endMonth}
              captionLayout="dropdown"
              autoFocus
            />
          </PopoverPopup>
        </PopoverPositioner>
      </PopoverPortal>
    </Popover>
  )
}
