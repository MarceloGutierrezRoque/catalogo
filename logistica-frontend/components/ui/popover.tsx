"use client"

import * as React from "react"
import { Popover as PopoverPrimitive } from "@base-ui/react/popover"

import { cn } from "@/lib/utils"

function PopoverRoot({ ...props }: PopoverPrimitive.Root.Props) {
  return <PopoverPrimitive.Root data-slot="popover" {...props} />
}

function PopoverTrigger({ ...props }: PopoverPrimitive.Trigger.Props) {
  return <PopoverPrimitive.Trigger data-slot="popover-trigger" {...props} />
}

function PopoverPortal({ ...props }: PopoverPrimitive.Portal.Props) {
  return <PopoverPrimitive.Portal data-slot="popover-portal" {...props} />
}

function PopoverPositioner({
  className,
  sideOffset = 4,
  ...props
}: PopoverPrimitive.Positioner.Props & { sideOffset?: number }) {
  return (
    <PopoverPrimitive.Positioner
      data-slot="popover-positioner"
      className={cn(
        "z-50 outline-none",
        "data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95",
        "data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95",
        className,
      )}
      {...props}
    />
  )
}

function PopoverPopup({
  className,
  ...props
}: PopoverPrimitive.Popup.Props) {
  return (
    <PopoverPrimitive.Popup
      data-slot="popover-popup"
      className={cn(
        "w-72 rounded-xl border bg-popover p-4 text-popover-foreground shadow-md outline-none",
        className,
      )}
      {...props}
    />
  )
}

function PopoverArrow({ ...props }: PopoverPrimitive.Arrow.Props) {
  return (
    <PopoverPrimitive.Arrow data-slot="popover-arrow" {...props}>
      <svg width="10" height="5" viewBox="0 0 10 5" fill="none">
        <title>arrow</title>
        <path d="M0 0L5 5L10 0H0Z" fill="var(--border)" />
      </svg>
    </PopoverPrimitive.Arrow>
  )
}

export {
  PopoverRoot as Popover,
  PopoverTrigger as PopoverTrigger,
  PopoverPortal as PopoverPortal,
  PopoverPositioner as PopoverPositioner,
  PopoverPopup as PopoverPopup,
  PopoverArrow as PopoverArrow,
}
