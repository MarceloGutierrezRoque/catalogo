import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";

export function Hero() {
  return (
    <section className="relative overflow-hidden min-h-dvh flex items-center snap-start">
      {/* Capa 1 - Césped */}
      <div className="absolute inset-0 opacity-0 animate-rise-up [animation-duration:1s] [animation-delay:0.2s] pointer-events-none hidden sm:block">
        <img src="/img_hero/cesped.png" alt="" className="w-full h-full object-cover object-bottom" />
      </div>

      {/* Capa 2 - Nubes */}
      <div className="absolute inset-0 opacity-0 animate-rise-up [animation-duration:1s] [animation-delay:0.5s] pointer-events-none hidden sm:block">
        <img src="/img_hero/nubes.png" alt="" className="w-full h-full object-cover" />
      </div>

      {/* Capa 3 - Peluche */}
      <div className="absolute inset-0 opacity-0 animate-rise-up [animation-duration:1s] [animation-delay:0.8s] pointer-events-none hidden sm:block">
        <img src="/img_hero/imagenes.png" alt="" className="w-full h-full object-cover" />
      </div>

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-accent/5 to-transparent" />
      {/* Decorative circles */}
      <div className="absolute top-0 right-0 -translate-y-1/4 translate-x-1/4 w-96 h-96 rounded-full bg-primary/10 blur-3xl" />
      <div className="absolute bottom-0 left-0 translate-y-1/4 -translate-x-1/4 w-72 h-72 rounded-full bg-accent/10 blur-3xl" />

      {/* Content */}
      <div id="contenido_hero" className="relative container mx-auto px-4 text-center opacity-0 animate-fade-in [animation-duration:1s] [animation-delay:1.5s] sm:-translate-y-[40%]">
        <div className="inline-flex items-center gap-1.5 rounded-full border bg-background/80 backdrop-blur-sm px-4 py-1.5 text-sm font-medium text-muted-foreground mb-8">
          <Sparkles className="h-4 w-4 text-primary" />
          Colección 2026
        </div>
        <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight max-w-3xl mx-auto text-balance">
          Los mejores peluches los encuentras aquí
        </h1>
        <p className="mt-6 text-lg sm:text-xl text-muted-foreground max-w-xl mx-auto text-balance">
          Explora nuestra colección de peluches suaves, divertidos y de la mejor calidad.
          ¡Encuentra tu compañero perfecto!
        </p>
        <div className="mt-10 flex items-center justify-center gap-4">
          <Link href="/plushies">
            <Button size="lg" className="group/cta shadow-md hover:shadow-xl transition-all duration-300">
              Ver catálogo
              <ArrowRight className="ml-2 h-5 w-5 transition-transform duration-300 group-hover/cta:translate-x-1" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
