"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { usePlushies } from "@/hooks/use-plushies";
import { PlushieCard } from "@/components/plushies/plushie-card";
import { CatalogSearch } from "@/components/plushies/catalog-search";
import { ProductSkeleton } from "@/components/plushies/product-skeleton";
import { EmptyState } from "@/components/plushies/empty-state";
import { Button } from "@/components/ui/button";
import { AlertCircle, RefreshCw } from "lucide-react";

export function PlushieGrid() {
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const prevSearchRef = useRef(debouncedSearch);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput);
      if (searchInput !== prevSearchRef.current) {
        setPage(1);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    prevSearchRef.current = debouncedSearch;
  }, [debouncedSearch]);

  const { data, isLoading, isError, refetch, isFetching } = usePlushies({
    page,
    search: debouncedSearch || undefined,
  });

  const filteredResults = useMemo(() => {
    if (!data?.results) return [];
    if (!debouncedSearch) return data.results;
    const q = debouncedSearch.toLowerCase();
    return data.results.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q)
    );
  }, [data?.results, debouncedSearch]);

  const handleClearSearch = useCallback(() => {
    setSearchInput("");
    setDebouncedSearch("");
    setPage(1);
  }, []);

  const isSearching = debouncedSearch.length > 0;

  if (isLoading) return <ProductSkeleton count={8} />;

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <AlertCircle className="h-12 w-12 text-destructive mb-4" />
        <h2 className="text-xl font-semibold mb-2">Error al cargar</h2>
        <p className="text-muted-foreground mb-4">
          No pudimos obtener los peluches. Intenta nuevamente.
        </p>
        <Button onClick={() => refetch()} disabled={isFetching}>
          <RefreshCw className={`mr-2 h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
          Reintentar
        </Button>
      </div>
    );
  }

  if (!data || filteredResults.length === 0) {
    if (isSearching) {
      return (
        <div>
          <div className="mb-8">
            <CatalogSearch
              value={searchInput}
              onChange={setSearchInput}
              resultCount={0}
              totalCount={data?.count ?? 0}
            />
          </div>
          <EmptyState variant="search" searchQuery={debouncedSearch} onClearSearch={handleClearSearch} />
        </div>
      );
    }
    return <EmptyState />;
  }

  const totalPages = Math.ceil(data.count / 100);

  return (
    <div>
      <div className="mb-8">
        <CatalogSearch
          value={searchInput}
          onChange={setSearchInput}
          resultCount={filteredResults.length}
          totalCount={data.count}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {filteredResults.map((plushie) => (
          <PlushieCard key={plushie.id} plushie={plushie} />
        ))}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-8">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1 || isFetching}
          >
            Anterior
          </Button>
          <span className="text-sm text-muted-foreground px-4">
            Página {page} de {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages || isFetching}
          >
            Siguiente
          </Button>
        </div>
      )}

      {isFetching && (
        <div className="flex justify-center mt-4">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      )}
    </div>
  );
}
