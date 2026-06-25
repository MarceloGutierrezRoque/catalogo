import { Package, SearchX } from "lucide-react";

interface EmptyStateProps {
  variant?: "default" | "search";
  searchQuery?: string;
  onClearSearch?: () => void;
}

export function EmptyState({ variant = "default", searchQuery, onClearSearch }: EmptyStateProps) {
  if (variant === "search") {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="rounded-full bg-muted p-4 mb-4">
          <SearchX className="h-8 w-8 text-muted-foreground" />
        </div>
        <h2 className="text-xl font-semibold mb-2">Sin resultados</h2>
        <p className="text-muted-foreground mb-6 max-w-sm">
          No encontramos peluches que coincidan con{" "}
          <span className="font-medium text-foreground">&ldquo;{searchQuery}&rdquo;</span>
        </p>
        {onClearSearch && (
          <button
            onClick={onClearSearch}
            className="text-sm font-medium text-primary hover:text-primary/80 transition-colors hover:underline"
          >
            Ver todos los peluches
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <Package className="h-16 w-16 text-muted-foreground mb-4" />
      <h2 className="text-xl font-semibold mb-2">No hay peluches disponibles</h2>
      <p className="text-muted-foreground">
        Pronto tendremos nuevos peluches en nuestro catálogo. Vuelve a visitarnos.
      </p>
    </div>
  );
}
