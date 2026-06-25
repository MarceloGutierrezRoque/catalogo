# Spec: Plushies — Catálogo Público

## 1. Resumen del módulo

Parte pública del sitio web (sin autenticación). Corresponde a la **Fase 3** del MVP.

Incluye:
- **Landing page** (`/`) con Hero y CTA
- **Catálogo** (`/plushies`) con grid de peluches + paginación
- **Detalle** (`/plushies/[id]`) con info completa del peluche
- **Navbar** pública con menú (Inicio, Catálogo, Iniciar sesión)
- **Footer** simple con info del sitio

---

## 2. Estructura de rutas

**Decisión: Mover el dashboard a `/dashboard`** para liberar `/` como landing pública.

| Ruta | Tipo | Descripción |
|---|---|---|
| `/` | 🔓 Pública | Landing page con Hero + CTA |
| `/plushies` | 🔓 Pública | Catálogo: grid de peluches activos |
| `/plushies/[id]` | 🔓 Pública | Detalle de peluche |
| `/login` | 🔓 Pública | Login admin |
| `/dashboard/*` | 🔒 Protegida | Panel admin |

**Justificación:**
- Landing + catálogo como sitio público superficial
- `/dashboard/*` agrupa toda la experiencia admin bajo un prefijo único
- Login redirige a `/dashboard`

---

## 3. Arquitectura de navegación pública

```
Navbar:  [🧸 Catálogo de Peluches]  [Inicio]  [Catálogo]  [Iniciar sesión →]

Footer:  © 2026 Catálogo de Peluches — Todos los derechos reservados
```

---

## 4. Archivos a crear

| # | Ruta | Propósito |
|---|---|---|
| 1 | `app/page.tsx` | Landing page con Hero + CTA + destacados |
| 2 | `app/plushies/page.tsx` | Catálogo público con grid de peluches |
| 3 | `app/plushies/[id]/page.tsx` | Detalle público de peluche |
| 4 | `services/plushies.ts` | API service para endpoints públicos |
| 5 | `hooks/use-plushies.ts` | TanStack Query hooks |
| 6 | `components/public/navbar.tsx` | Navbar pública con menú |
| 7 | `components/public/footer.tsx` | Footer simple |
| 8 | `components/public/hero.tsx` | Hero de la landing page |
| 9 | `components/plushies/plushie-card.tsx` | Tarjeta individual de peluche |
| 10 | `components/plushies/plushie-grid.tsx` | Grid con paginación |
| 11 | `components/plushies/plushie-detail.tsx` | Vista de detalle |
| 12 | `components/plushies/empty-state.tsx` | Estado vacío |
| 13 | `components/plushies/product-skeleton.tsx` | Skeleton grid |
| 14 | `components/plushies/detail-skeleton.tsx` | Skeleton detalle |

---

## 5. Archivos a modificar

| # | Ruta | Cambio |
|---|---|---|
| 1 | `app/(dashboard)/` → `app/dashboard/` | Renombrar route group a ruta real |
| 2 | `app/layout.tsx` (root) | Quitar `AuthProvider`, mantener `QueryProvider` + `Toaster` |
| 3 | `app/dashboard/layout.tsx` | Agregar `AuthProvider` wrapper (se mueve del root) |
| 4 | `components/dashboard/sidebar.tsx` | hrefs: `/` → `/dashboard`, `/plushies` → `/dashboard/plushies`, etc. |
| 5 | `app/login/page.tsx` | Redirigir a `/dashboard` en vez de `/` |

---

## 6. Detalle de cada archivo

### 6.1 `app/layout.tsx` — Layout raíz (modificado)

```tsx
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { QueryProvider } from "@/providers/query";
import { Toaster } from "@/components/ui/sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Catálogo de Peluches",
  description: "Los mejores peluches los encuentras aquí",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`} suppressHydrationWarning>
      <body className="min-h-full flex flex-col">
        <QueryProvider>
          {children}
          <Toaster richColors position="top-right" />
        </QueryProvider>
      </body>
    </html>
  );
}
```

**Cambios respecto al actual:**
- Quitar `AuthProvider` (se mueve a `app/dashboard/layout.tsx`)
- Metadata con título genérico del catálogo
- Mantener `QueryProvider` y `Toaster` globales

### 6.2 `app/page.tsx` — Landing page

```tsx
import { Navbar } from "@/components/public/navbar";
import { Hero } from "@/components/public/hero";
import { Footer } from "@/components/public/footer";

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        <Hero />
      </main>
      <Footer />
    </div>
  );
}
```

**Nota:** Server component. No necesita "use client".

### 6.3 `app/plushies/page.tsx` — Catálogo público

```tsx
import { Navbar } from "@/components/public/navbar";
import { Footer } from "@/components/public/footer";
import { PlushieGrid } from "@/components/plushies/plushie-grid";

export default function PlushiesPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold tracking-tight mb-2">Catálogo de Peluches</h1>
        <p className="text-muted-foreground mb-8">
          Explora nuestra colección de peluches
        </p>
        <PlushieGrid />
      </main>
      <Footer />
    </div>
  );
}
```

### 6.4 `app/plushies/[id]/page.tsx` — Detalle público

```tsx
"use client";

import { useParams } from "next/navigation";
import { Navbar } from "@/components/public/navbar";
import { Footer } from "@/components/public/footer";
import { PlushieDetail } from "@/components/plushies/plushie-detail";

export default function PlushieDetailPage() {
  const { id } = useParams<{ id: string }>();

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-8">
        <PlushieDetail id={Number(id)} />
      </main>
      <Footer />
    </div>
  );
}
```

### 6.5 `services/plushies.ts` — API Service

```typescript
import api from "@/lib/axios";
import type { Plushie, PaginatedResponse } from "@/types/api";

export interface PlushieListParams {
  page?: number;
}

export async function fetchPlushies(params: PlushieListParams = {}): Promise<PaginatedResponse<Plushie>> {
  const { data } = await api.get<PaginatedResponse<Plushie>>("/api/plushies/", { params });
  return data;
}

export async function fetchPlushie(id: number): Promise<Plushie> {
  const { data } = await api.get<Plushie>(`/api/plushies/${id}/`);
  return data;
}
```

### 6.6 `hooks/use-plushies.ts` — TanStack Query Hooks

```typescript
import { useQuery } from "@tanstack/react-query";
import { fetchPlushies, fetchPlushie } from "@/services/plushies";
import type { PlushieListParams } from "@/services/plushies";

export const plushieKeys = {
  all: ["plushies"] as const,
  lists: () => [...plushieKeys.all, "list"] as const,
  list: (params: PlushieListParams) => [...plushieKeys.lists(), params] as const,
  details: () => [...plushieKeys.all, "detail"] as const,
  detail: (id: number) => [...plushieKeys.details(), id] as const,
};

export function usePlushies(params: PlushieListParams = {}) {
  return useQuery({
    queryKey: plushieKeys.list(params),
    queryFn: () => fetchPlushies(params),
  });
}

export function usePlushie(id: number) {
  return useQuery({
    queryKey: plushieKeys.detail(id),
    queryFn: () => fetchPlushie(id),
    enabled: !!id && id > 0,
  });
}
```

### 6.7 `components/public/navbar.tsx` — Navbar pública

```tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { LogIn } from "lucide-react";
import { cn } from "@/lib/utils";

const navLinks = [
  { href: "/", label: "Inicio" },
  { href: "/plushies", label: "Catálogo" },
];

export function Navbar() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 font-bold text-xl">
          Catálogo de Peluches
        </Link>

        {/* Navegación */}
        <nav className="hidden sm:flex items-center gap-6">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "text-sm font-medium transition-colors hover:text-primary",
                pathname === link.href
                  ? "text-primary"
                  : "text-muted-foreground"
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Login button */}
        <Button variant="outline" size="sm" asChild>
          <Link href="/login">
            <LogIn className="mr-2 h-4 w-4" />
            Iniciar sesión
          </Link>
        </Button>
      </div>
    </header>
  );
}
```

**Notas:**
- Menú responsive: en mobile los links se ocultan (solo logo + login)
- Active link highlight según `usePathname()`
- Usa `asChild` en Button para renderizar como Link — requiere que shadcn/ui soporte `asChild` (base-ui usa `render` prop). Si hay error de tipos, cambiar a:

```tsx
<Link href="/login">
  <Button variant="outline" size="sm">
    <LogIn className="mr-2 h-4 w-4" />
    Iniciar sesión
  </Button>
</Link>
```

### 6.8 `components/public/hero.tsx` — Hero de landing

```tsx
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export function Hero() {
  return (
    <section className="relative overflow-hidden py-24 sm:py-32">
      <div className="container mx-auto px-4 text-center">
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight max-w-3xl mx-auto">
          Los mejores peluches los encuentras aquí
        </h1>
        <p className="mt-6 text-lg sm:text-xl text-muted-foreground max-w-xl mx-auto">
          Explora nuestra colección de peluches suaves, divertidos y de la mejor calidad.
          ¡Encuentra tu compañero perfecto!
        </p>
        <div className="mt-10 flex items-center justify-center gap-4">
          <Button size="lg" asChild>
            <Link href="/plushies">
              Ver catálogo
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
```

### 6.9 `components/public/footer.tsx` — Footer simple

```tsx
export function Footer() {
  return (
    <footer className="border-t bg-background">
      <div className="container mx-auto px-4 py-8 text-center text-sm text-muted-foreground">
        <p>© {new Date().getFullYear()} Catálogo de Peluches. Todos los derechos reservados.</p>
      </div>
    </footer>
  );
}
```

**Nota:** Usa `Date().getFullYear()` — como esto cambia entre server y client, puede causar hydration mismatch. Alternativa: usar año fijo `2026` o marcar como `"use client"`. Se usará año fijo `2026` para evitar mismatch.

```tsx
export function Footer() {
  return (
    <footer className="border-t bg-background">
      <div className="container mx-auto px-4 py-8 text-center text-sm text-muted-foreground">
        <p>© 2026 Catálogo de Peluches. Todos los derechos reservados.</p>
      </div>
    </footer>
  );
}
```

### 6.10 `components/plushies/plushie-card.tsx` — Tarjeta

```tsx
import Link from "next/link";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Plushie } from "@/types/api";

interface PlushieCardProps {
  plushie: Plushie;
}

export function PlushieCard({ plushie }: PlushieCardProps) {
  const imageUrl = plushie.image || "/placeholder-plushie.svg";
  const isOutOfStock = plushie.stock === 0;

  return (
    <Link href={`/plushies/${plushie.id}`}>
      <Card className="group overflow-hidden transition-all hover:shadow-lg hover:scale-[1.02] h-full">
        <div className="aspect-square relative overflow-hidden bg-muted">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageUrl}
            alt={plushie.name}
            className="object-cover w-full h-full group-hover:scale-105 transition-transform"
          />
          {isOutOfStock && (
            <div className="absolute inset-0 bg-background/60 flex items-center justify-center">
              <Badge variant="secondary" className="text-lg px-4 py-1">Agotado</Badge>
            </div>
          )}
        </div>
        <CardContent className="p-4">
          <h3 className="font-semibold text-base truncate">{plushie.name}</h3>
        </CardContent>
        <CardFooter className="p-4 pt-0 flex items-center justify-between">
          <span className="text-lg font-bold">S/ {plushie.price}</span>
          {!isOutOfStock && (
            <span className="text-sm text-muted-foreground">
              Stock: {plushie.stock}
            </span>
          )}
        </CardFooter>
      </Card>
    </Link>
  );
}
```

### 6.11 `components/plushies/plushie-grid.tsx` — Grid + paginación

```tsx
"use client";

import { useState } from "react";
import { usePlushies } from "@/hooks/use-plushies";
import { PlushieCard } from "@/components/plushies/plushie-card";
import { ProductSkeleton } from "@/components/plushies/product-skeleton";
import { EmptyState } from "@/components/plushies/empty-state";
import { Button } from "@/components/ui/button";
import { AlertCircle, RefreshCw } from "lucide-react";

export function PlushieGrid() {
  const [page, setPage] = useState(1);
  const { data, isLoading, isError, refetch, isFetching } = usePlushies({ page });

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

  if (!data || data.results.length === 0) {
    return <EmptyState />;
  }

  const totalPages = Math.ceil(data.count / 100);

  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {data.results.map((plushie) => (
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
```

### 6.12 `components/plushies/plushie-detail.tsx` — Detalle

```tsx
"use client";

import Link from "next/link";
import { usePlushie } from "@/hooks/use-plushies";
import { DetailSkeleton } from "@/components/plushies/detail-skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, AlertCircle, RefreshCw } from "lucide-react";

interface PlushieDetailProps {
  id: number;
}

export function PlushieDetail({ id }: PlushieDetailProps) {
  const { data: plushie, isLoading, isError, refetch, isFetching } = usePlushie(id);

  if (isLoading) return <DetailSkeleton />;

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <AlertCircle className="h-16 w-16 text-destructive mb-4" />
        <h2 className="text-2xl font-semibold mb-2">Peluche no encontrado</h2>
        <p className="text-muted-foreground mb-6">
          El peluche que buscas no existe o ha sido removido.
        </p>
        <div className="flex gap-4">
          <Button variant="outline" asChild>
            <Link href="/plushies">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver al catálogo
            </Link>
          </Button>
          <Button onClick={() => refetch()} disabled={isFetching}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
            Reintentar
          </Button>
        </div>
      </div>
    );
  }

  if (!plushie) return null;

  const imageUrl = plushie.image || "/placeholder-plushie.svg";
  const isOutOfStock = plushie.stock === 0;

  return (
    <div>
      <Button variant="ghost" size="sm" asChild className="mb-6">
        <Link href="/plushies">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver al catálogo
        </Link>
      </Button>

      <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
        <div className="aspect-square relative overflow-hidden rounded-xl bg-muted">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageUrl}
            alt={plushie.name}
            className="object-cover w-full h-full"
          />
        </div>

        <div className="flex flex-col justify-center space-y-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{plushie.name}</h1>
            {isOutOfStock && (
              <Badge variant="secondary" className="mt-2 text-base px-3 py-1">
                Agotado
              </Badge>
            )}
          </div>

          {plushie.description && (
            <p className="text-muted-foreground text-lg leading-relaxed">
              {plushie.description}
            </p>
          )}

          <div className="text-4xl font-bold text-primary">
            S/ {plushie.price}
          </div>

          {!isOutOfStock && (
            <div className="text-sm text-muted-foreground">
              Stock disponible: <span className="font-semibold">{plushie.stock} unidades</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
```

### 6.13 Componentes utilitarios

#### `components/plushies/product-skeleton.tsx`
```tsx
interface ProductSkeletonProps {
  count?: number;
}

export function ProductSkeleton({ count = 8 }: ProductSkeletonProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-xl border bg-card overflow-hidden animate-pulse">
          <div className="aspect-square bg-muted" />
          <div className="p-4 space-y-3">
            <div className="h-4 bg-muted rounded w-3/4" />
            <div className="h-4 bg-muted rounded w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}
```

#### `components/plushies/detail-skeleton.tsx`
```tsx
export function DetailSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="h-4 w-32 bg-muted rounded mb-6" />
      <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
        <div className="aspect-square bg-muted rounded-xl" />
        <div className="space-y-6">
          <div className="h-8 bg-muted rounded w-3/4" />
          <div className="space-y-2">
            <div className="h-4 bg-muted rounded w-full" />
            <div className="h-4 bg-muted rounded w-5/6" />
          </div>
          <div className="h-10 bg-muted rounded w-1/3" />
          <div className="h-4 bg-muted rounded w-1/4" />
        </div>
      </div>
    </div>
  );
}
```

#### `components/plushies/empty-state.tsx`
```tsx
import { Package } from "lucide-react";

export function EmptyState() {
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
```

---

## 7. Reglas de negocio

| Regla | Implementación |
|---|---|
| Solo mostrar peluches activos | Backend filtra automáticamente en `/api/plushies/` |
| Stock 0 = "Agotado" | Overlay + badge en card, badge en detalle |
| Sin imagen = placeholder | Usar `/placeholder-plushie.svg` |
| Paginación 100 items/página | Controlado por backend, frontend usa `?page=N` |
| Detalle 404 | Backend retorna 404 → hook `isError` se activa |

---

## 8. Flujo de navegación

```
[/] Landing
  ├── Hero CTA "Ver catálogo" → [/plushies]
  └── Navbar "Catálogo" → [/plushies]

[/plushies] Catálogo
  ├── Click tarjeta → [/plushies/{id}]
  │                    └── "Volver al catálogo" → [/plushies]
  ├── Paginación → Cambia página
  └── Navbar "Inicio" → [/]

[/login] (desde navbar "Iniciar sesión")
  └── Login exitoso → [/dashboard]
```

---

## 9. Migración del dashboard

**Pasos exactos:**

1. Renombrar carpeta:
   ```bash
   Move-Item -Path "app/(dashboard)" -Destination "app/dashboard"
   ```

2. Modificar `app/layout.tsx` root — quitar `AuthProvider`, actualizar metadata

3. Modificar `app/dashboard/layout.tsx` — agregar `AuthProvider`

4. Modificar `components/dashboard/sidebar.tsx` — hrefs con prefijo `/dashboard/`

5. Modificar `app/login/page.tsx` — redirigir a `/dashboard`

**Orden de ejecución recomendado:**

```
1. services/plushies.ts, hooks/use-plushies.ts
2. components/public/*.tsx (navbar, hero, footer)
3. components/plushies/*.tsx (card, grid, detail, empty, skeletons)
4. app/layout.tsx (modificar)
5. app/(dashboard)/ → app/dashboard/ (renombrar)
6. app/dashboard/layout.tsx (modificar)
7. components/dashboard/sidebar.tsx (modificar)
8. app/login/page.tsx (modificar)
9. app/page.tsx (nuevo — landing)
10. app/plushies/page.tsx (nuevo)
11. app/plushies/[id]/page.tsx (nuevo)
```

---

## 10. Criterios de aceptación

- [ ] `/` muestra landing con Hero + CTA "Ver catálogo"
- [ ] `/plushies` muestra grid de peluches activos
- [ ] Navbar pública con Inicio, Catálogo, Iniciar sesión
- [ ] Navbar tiene active link según ruta actual
- [ ] Footer simple con copyright
- [ ] Tarjetas con imagen, nombre, precio, stock
- [ ] Stock 0 = overlay "Agotado"
- [ ] Sin imagen = placeholder
- [ ] Paginación funciona (Anterior/Siguiente)
- [ ] Estado carga = skeletons
- [ ] Estado vacío = mensaje "No hay peluches disponibles"
- [ ] Estado error = mensaje + reintentar
- [ ] `/plushies/[id]` detalle completo (imagen, nombre, descripción, precio, stock)
- [ ] Detalle: "Volver al catálogo" funciona
- [ ] Detalle: error 404 manejado
- [ ] "Iniciar sesión" → `/login`
- [ ] Login exitoso → `/dashboard`
- [ ] Dashboard en `/dashboard/...` con sidebar actualizada
- [ ] `npm run build` sin errores
- [ ] `npm run lint` sin errores
