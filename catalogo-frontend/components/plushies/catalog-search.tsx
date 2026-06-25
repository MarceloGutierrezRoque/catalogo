"use client";

import { useState, useRef, useCallback } from "react";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface CatalogSearchProps {
  value: string;
  onChange: (value: string) => void;
  resultCount?: number;
  totalCount?: number;
}

export function CatalogSearch({ value, onChange, resultCount, totalCount }: CatalogSearchProps) {
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleClear = useCallback(() => {
    onChange("");
    inputRef.current?.focus();
  }, [onChange]);

  return (
    <div className="relative">
      <div
        className={cn(
          "group relative flex items-center rounded-xl border bg-background shadow-sm transition-all duration-300",
          focused
            ? "border-primary/50 shadow-lg shadow-primary/5 ring-2 ring-primary/10 scale-[1.01]"
            : "border-border/60 hover:border-border hover:shadow-md"
        )}
      >
        <Search
          className={cn(
            "absolute left-3.5 h-4 w-4 text-muted-foreground transition-all duration-300 pointer-events-none",
            focused ? "text-primary scale-110" : "group-hover:text-foreground/70"
          )}
        />
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder="Buscar peluches..."
          className={cn(
            "h-11 w-full bg-transparent pl-10 pr-10 text-base outline-none placeholder:text-muted-foreground/60 rounded-xl transition-colors",
            "focus:placeholder:text-muted-foreground/40"
          )}
        />
        <button
          onClick={handleClear}
          className={cn(
            "absolute right-3 flex items-center justify-center rounded-lg p-1 text-muted-foreground transition-all duration-200",
            "hover:bg-muted hover:text-foreground hover:scale-110 active:scale-95",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
            value
              ? "opacity-100 translate-x-0"
              : "opacity-0 translate-x-2 pointer-events-none"
          )}
          tabIndex={value ? 0 : -1}
          aria-label="Limpiar búsqueda"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div
        className={cn(
          "h-5 transition-all duration-300 overflow-hidden",
          focused || value ? "opacity-100 mt-1.5" : "opacity-0 mt-0"
        )}
      >
        {resultCount !== undefined && totalCount !== undefined && (
          <p className="text-xs text-muted-foreground/70 px-1">
            {value
              ? `${resultCount} de ${totalCount} peluche${resultCount !== 1 ? "s" : ""}`
              : `${totalCount} peluche${totalCount !== 1 ? "s" : ""} en catálogo`}
          </p>
        )}
      </div>
    </div>
  );
}
