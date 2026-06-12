"use client"

import * as React from "react"
import { DayPicker } from "react-day-picker"
import { es } from "react-day-picker/locale"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"

export type CalendarProps = React.ComponentProps<typeof DayPicker>

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      locale={es}
      showOutsideDays={showOutsideDays}
      className={cn("p-0", className)}
      classNames={{
        root: "w-full",
        months: "flex flex-col gap-2",
        month: "space-y-3",
        month_caption: "flex items-center justify-center relative h-8",
        caption_label: "text-sm font-medium",
        nav: "absolute inset-x-0 top-0 flex items-center justify-between",
        button_previous: cn(
          buttonVariants({ variant: "ghost", size: "icon-sm" }),
          "absolute left-0 size-7 rounded-md p-0",
        ),
        button_next: cn(
          buttonVariants({ variant: "ghost", size: "icon-sm" }),
          "absolute right-0 size-7 rounded-md p-0",
        ),
        month_grid: "w-full border-collapse",
        weekdays: "flex",
        weekday:
          "w-9 text-center text-xs font-medium text-muted-foreground pt-2 pb-1",
        week: "flex w-full mt-0.5",
        day: cn(
          "relative flex size-9 items-center justify-center p-0 text-sm outline-none",
          "focus-visible:z-10 focus-visible:rounded-md focus-visible:ring-2 focus-visible:ring-ring",
        ),
        day_button: cn(
          buttonVariants({ variant: "ghost", size: "icon-sm" }),
          "size-9 rounded-md p-0 font-normal",
          "aria-selected:bg-primary aria-selected:text-primary-foreground",
          "aria-selected:hover:bg-primary aria-selected:hover:text-primary-foreground",
        ),
        outside: "text-muted-foreground/50",
        disabled: "text-muted-foreground/30 line-through opacity-50",
        hidden: "invisible",
        today:
          "[&>.day_button]:bg-accent [&>.day_button]:text-accent-foreground",
        selected:
          "[&>.day_button]:bg-primary [&>.day_button]:text-primary-foreground [&>.day_button]:hover:bg-primary [&>.day_button]:hover:text-primary-foreground",
        range_start:
          "[&>.day_button]:bg-primary [&>.day_button]:text-primary-foreground [&>.day_button]:rounded-l-md",
        range_end:
          "[&>.day_button]:bg-primary [&>.day_button]:text-primary-foreground [&>.day_button]:rounded-r-md",
        range_middle:
          "[&>.day_button]:bg-primary/15 [&>.day_button]:text-foreground [&>.day_button]:rounded-none",
        ...classNames,
      }}
      components={{
        Chevron: (props) => {
          if (props.orientation === "left") {
            return <ChevronLeft className="size-4" {...props} />
          }
          return <ChevronRight className="size-4" {...props} />
        },
      }}
      {...props}
    />
  )
}

export { Calendar }
