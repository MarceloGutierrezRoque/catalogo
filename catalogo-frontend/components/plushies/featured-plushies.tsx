"use client";

import Link from "next/link";
import { usePlushies } from "@/hooks/use-plushies";
import { PlushieCard } from "@/components/plushies/plushie-card";
import { ProductSkeleton } from "@/components/plushies/product-skeleton";
import { Button } from "@/components/ui/button";
import { ArrowRight, AlertCircle, RefreshCw } from "lucide-react";

export function FeaturedPlushies() {
  const { data, isLoading, isError, refetch, isFetching } = usePlushies({ page: 1 });

  if (isLoading) return <ProductSkeleton count={4} />;

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <AlertCircle className="h-10 w-10 text-destructive mb-3" />
        <p className="text-muted-foreground mb-4">No pudimos cargar los peluches destacados.</p>
        <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
          <RefreshCw className={`mr-2 h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
          Reintentar
        </Button>
      </div>
    );
  }

  const plushies = data?.results ?? [];
  if (plushies.length === 0) return null;

  return (
    <section className="py-24 sm:py-28 min-h-dvh relative sm:snap-start scroll-mt-20">
      {/* Subtle background decoration */}
      <div className="absolute inset-0 bg-gradient-to-t from-accent/[0.03] to-transparent pointer-events-none" />
      <div className="relative container mx-auto px-4">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
          <div>
            <h2 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight">
              Destacados
            </h2>
            <p className="text-muted-foreground mt-1.5 max-w-md">
              Los peluches más populares de nuestra colección, escogidos especialmente para ti
            </p>
          </div>
          <Link href="/plushies">
            <Button variant="outline" className="group/ver-todos">
              Ver todos
              <ArrowRight className="ml-2 h-4 w-4 transition-all duration-300 group-hover/ver-todos:translate-x-1 group-hover/ver-todos:scale-110" />
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {plushies.slice(0, 4).map((plushie) => (
            <PlushieCard key={plushie.id} plushie={plushie} />
          ))}
        </div>
      </div>
    </section>
  );
}
