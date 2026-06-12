"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"
import { Search, Filter, X } from "lucide-react"

interface MobileFilterSheetProps {
  globalFilter: string
  onGlobalFilterChange: (value: string) => void
  children?: React.ReactNode
  placeholder?: string
}

export function MobileFilterSheet({
  globalFilter,
  onGlobalFilterChange,
  children,
  placeholder = "Buscar…",
}: MobileFilterSheetProps) {
  const [open, setOpen] = useState(false)

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      {/* Search — always visible */}
      <div className="relative w-full sm:max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder={placeholder}
          className="pl-9 h-9"
          value={globalFilter}
          onChange={(e) => onGlobalFilterChange(e.target.value)}
        />
      </div>

      {/* Extra filters — Sheet on mobile, inline on desktop */}
      {children && (
        <>
          {/* Mobile trigger */}
          <div className="sm:hidden">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setOpen(true)}
              className="gap-1.5 w-full"
            >
              <Filter className="h-3.5 w-3.5" />
              Filtros
              {globalFilter && (
                <span className="ml-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-medium text-primary-foreground">
                  !
                </span>
              )}
            </Button>
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetContent side="bottom" className="max-h-[70vh]">
                <SheetHeader>
                  <SheetTitle>Filtros</SheetTitle>
                  <SheetDescription>
                    Ajusta los filtros para refinar los resultados
                  </SheetDescription>
                </SheetHeader>
                <div className="space-y-4 p-4">
                  {/* Search inside sheet too */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder={placeholder}
                      className="pl-9 h-9"
                      value={globalFilter}
                      onChange={(e) => onGlobalFilterChange(e.target.value)}
                      autoFocus
                    />
                  </div>
                  {children}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      onGlobalFilterChange("")
                      setOpen(false)
                    }}
                    className="gap-1.5 text-muted-foreground w-full"
                  >
                    <X className="h-3.5 w-3.5" />
                    Limpiar filtros
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
          </div>

          {/* Desktop inline */}
          <div className="hidden sm:flex sm:items-center sm:gap-3">
            {children}
          </div>
        </>
      )}
    </div>
  )
}
