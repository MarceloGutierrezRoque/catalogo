"use client";

import { Button } from "@/components/ui/button";
import { ArrowLeft, Home, RefreshCw } from "lucide-react";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="es">
      <body className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background p-4">
        <h1 className="text-4xl font-bold tracking-tight">
          Error crítico
        </h1>
        <p className="max-w-md text-center text-muted-foreground">
          Ocurrió un error grave en la aplicación. Reintente o regrese al
          inicio.
        </p>
        <div className="flex gap-4">
          <Button variant="outline" onClick={() => window.history.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver atrás
          </Button>
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
          <a href="/">
            <Button variant="outline">
              <Home className="mr-2 h-4 w-4" />
              Ir al inicio
            </Button>
          </a>
          <Button onClick={reset}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Reintentar
          </Button>
        </div>
      </body>
    </html>
  );
}
