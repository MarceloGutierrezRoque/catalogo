# Spec: Módulo Auth

## 1. Resumen del módulo

Autenticación de administradores mediante JWT (SimpleJWT).  
Provee login, logout, refresh automático de tokens, layout protegido con sidebar y header, e infraestructura de sesión global.

**Endpoints que consume:**
| Método | Ruta | Propósito |
|--------|------|-----------|
| POST | `/api/token/` | Obtener tokens (access + refresh) |
| POST | `/api/token/refresh/` | Refrescar access token |

**Rutas del módulo:**
| Ruta | Tipo | Propósito |
|------|------|-----------|
| `/login` | Pública (solo no-auth) | Formulario de inicio de sesión |
| `/(dashboard)` | Privada (requires auth) | Layout protegido con sidebar + header |
| `/(dashboard)/` | Privada | Placeholder del dashboard |

---

## 2. Archivos a crear

| # | Ruta | Responsabilidad |
|---|------|-----------------|
| 1 | `providers/auth.tsx` | AuthProvider — carga sesión del store, provee contexto de auth |
| 2 | `app/login/page.tsx` | Página de login — formulario username + password |
| 3 | `app/(dashboard)/layout.tsx` | Layout protegido — sidebar + header + verificación auth |
| 4 | `app/(dashboard)/page.tsx` | Dashboard placeholder — bienvenida |
| 5 | `components/dashboard/sidebar.tsx` | Sidebar de navegación del dashboard |
| 6 | `components/dashboard/header.tsx` | Header con info de usuario + logout |
| 7 | `lib/auth.ts` | Funciones helper: `getAccessToken()`, `isTokenExpired()`, `decodeToken()` |
| 8 | `hooks/use-auth.ts` | Hook personalizado que consume AuthContext |
| 9 | `types/auth.ts` | Tipos específicos de auth (opcional si se ponen en api.ts) |

---

## 3. Archivos a modificar

| # | Ruta | Cambio |
|---|------|--------|
| 1 | `app/layout.tsx` | Envolver con `<QueryProvider>` y `<AuthProvider>` |
| 2 | `types/api.ts` | Agregar interfaz `LoginCredentials` y `TokenResponse` |
| 3 | `stores/auth.ts` | Agregar `isLoading` al estado, mejorar `user` con datos reales (decodificar JWT) |

---

## 4. Detalle de cada archivo

### 4.1 `types/auth.ts`

```typescript
export interface LoginCredentials {
  username: string;
  password: string;
}

export interface TokenResponse {
  access: string;
  refresh: string;
}

/** Payload decodificado del JWT access token */
export interface JwtPayload {
  token_type: string;
  exp: number;
  iat: number;
  jti: string;
  user_id: number;
  username?: string;
  email?: string;
}
```

### 4.2 `types/api.ts` — Agregar al archivo existente

```typescript
// Al final del archivo
export type { LoginCredentials, TokenResponse, JwtPayload } from "./auth";
// O mejor inline:
export interface LoginCredentials {
  username: string;
  password: string;
}

export interface TokenResponse {
  access: string;
  refresh: string;
}
```

**Decisión:** Poner `LoginCredentials` y `TokenResponse` directamente en `types/api.ts` para mantener un solo lugar de tipos. No crear `types/auth.ts` separado.

### 4.3 `lib/auth.ts` — Helpers de autenticación

```typescript
import type { JwtPayload } from "@/types/api";

/**
 * Decodifica un JWT (solo payload, sin verificar firma).
 * Útil para extraer user_id, exp, etc.
 */
export function decodeToken(token: string): JwtPayload | null {
  try {
    const payload = token.split(".")[1];
    return JSON.parse(atob(payload));
  } catch {
    return null;
  }
}

/**
 * Verifica si un token JWT está expirado.
 * Retorna true si exp < Date.now()/1000.
 */
export function isTokenExpired(token: string): boolean {
  const decoded = decodeToken(token);
  if (!decoded?.exp) return true;
  return decoded.exp * 1000 < Date.now();
}

/**
 * Extrae info básica del usuario desde el access token.
 */
export function getUserFromToken(token: string): {
  id: number;
  username: string;
  email: string;
} | null {
  const decoded = decodeToken(token);
  if (!decoded) return null;
  return {
    id: decoded.user_id,
    username: decoded.username ?? "",
    email: decoded.email ?? "",
  };
}
```

### 4.4 `stores/auth.ts` — Mejoras al store existente

**Cambios respecto al actual:**
- Agregar `isLoading: boolean` al estado (true mientras se verifica sesión al cargar)
- Extraer `user` desde el JWT decodificado en lugar de hardcodear `id: 0`
- El método `login()` debe decodificar el token para obtener datos reales del usuario

```typescript
// Fragmento conceptual de los cambios:
interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  user: { id: number; username: string; email: string } | null;
  isAuthenticated: boolean;
  isLoading: boolean;          // ← NUEVO
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  setLoading: (loading: boolean) => void;  // ← NUEVO
}

// login() debe decodificar el token:
login: async (username, password) => {
  const { data } = await api.post<TokenResponse>("/api/token/", { username, password });
  const user = getUserFromToken(data.access);  // del helper
  set({
    accessToken: data.access,
    refreshToken: data.refresh,
    user: user ?? { id: 0, username, email: "" },
    isAuthenticated: true,
    isLoading: false,
  });
},
```

### 4.5 `providers/auth.tsx` — AuthProvider

**Responsabilidad:**
- Cargar sesión desde el store al montar (persist ya funciona con localStorage)
- Proveer contexto de autenticación para hooks
- Escuchar eventos de expiración (el interceptor de axios ya redirige a /login)

```typescript
"use client";

import { createContext, useContext, useEffect, type ReactNode } from "react";
import { useAuthStore } from "@/stores/auth";

interface AuthContextValue {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: { id: number; username: string; email: string } | null;
}

const AuthContext = createContext<AuthContextValue>({
  isAuthenticated: false,
  isLoading: true,
  user: null,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated, user, isLoading, setLoading } = useAuthStore();

  useEffect(() => {
    // Marcar como cargado después del montaje
    // El store ya persistió, así que el estado está disponible
    setLoading(false);
  }, [setLoading]);

  return (
    <AuthContext.Provider value={{ isAuthenticated, isLoading, user }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
```

**Nota:** El `setLoading(false)` se ejecuta en el useEffect. Como el store usa `persist`, en el primer render el store ya tiene los valores persistentes. Pero el efecto asegura que sepamos que la hidratación ocurrió.

### 4.6 `hooks/use-auth.ts`

```typescript
"use client";

import { AuthContext } from "@/providers/auth";
// O simplemente re-exportar desde providers/auth:
export { useAuth } from "@/providers/auth";
```

**Decisión:** No crear archivo separado. El hook `useAuth` se exporta directamente desde `providers/auth.tsx`.

### 4.7 `app/layout.tsx` — Modificación

```typescript
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { QueryProvider } from "@/providers/query";
import { AuthProvider } from "@/providers/auth";
import { Toaster } from "sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Catálogo de Peluches — Admin",
  description: "Panel de administración del catálogo de peluches",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <QueryProvider>
          <AuthProvider>
            {children}
            <Toaster richColors position="top-right" />
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
```

**Cambios clave:**
- Envolver children en `QueryProvider` → `AuthProvider`
- Agregar `<Toaster />` de sonner para notificaciones toast
- Cambiar `lang="en"` a `lang="es"`
- Actualizar metadata para el proyecto

### 4.8 `app/login/page.tsx` — Página de Login

**Responsabilidad:**
- Formulario con campos username + password
- Validación Zod: username required, password required (min 1 char)
- Submit → `useAuthStore.getState().login()` → redirigir a `/dashboard`
- Si ya autenticado, redirigir automáticamente a `/dashboard`
- Mostrar errores con sonner toast
- Loading state en el botón de submit
- Diseño centrado, minimalista, con logo/título

```typescript
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { useAuthStore } from "@/stores/auth";
import { useAuth } from "@/providers/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loader2 } from "lucide-react";

const loginSchema = z.object({
  username: z.string().min(1, "El usuario es requerido"),
  password: z.string().min(1, "La contraseña es requerida"),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const login = useAuthStore((s) => s.login);
  const { isAuthenticated, isLoading } = useAuth();
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  // Si ya autenticado, redirigir al dashboard
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace("/");
    }
  }, [isAuthenticated, isLoading, router]);

  // No renderizar nada mientras carga (evita flash)
  if (isLoading) return null;
  // Si ya autenticado, no mostrar login
  if (isAuthenticated) return null;

  const onSubmit = async (data: LoginForm) => {
    setSubmitting(true);
    try {
      await login(data.username, data.password);
      toast.success("Inicio de sesión exitoso");
      router.push("/");
    } catch (error: any) {
      const message =
        error?.response?.data?.detail ||
        "Credenciales inválidas. Intente nuevamente.";
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Catálogo de Peluches</CardTitle>
          <CardDescription>Panel de administración</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Usuario</Label>
              <Input
                id="username"
                placeholder="Ingrese su usuario"
                autoComplete="username"
                {...register("username")}
              />
              {errors.username && (
                <p className="text-sm text-destructive">{errors.username.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                placeholder="Ingrese su contraseña"
                autoComplete="current-password"
                {...register("password")}
              />
              {errors.password && (
                <p className="text-sm text-destructive">{errors.password.message}</p>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {submitting ? "Iniciando sesión..." : "Iniciar sesión"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
```

**Dependencia adicional:** Se necesita `@hookform/resolvers` para integrar Zod con react-hook-form. Agregar al `package.json`:

```json
"@hookform/resolvers": "^4.1.0",
"react-hook-form": "^7.55.0"
```

### 4.9 `app/(dashboard)/layout.tsx` — Layout Protegido

**Responsabilidad:**
- Verificar autenticación; si no hay sesión, redirigir a `/login`
- Renderizar Sidebar a la izquierda + Header arriba + contenido principal
- Estructura responsive: sidebar colapsable en mobile

```typescript
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/providers/auth";
import { Sidebar } from "@/components/dashboard/sidebar";
import { Header } from "@/components/dashboard/header";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
```

### 4.10 `app/(dashboard)/page.tsx` — Dashboard Placeholder

```typescript
export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
      <p className="text-muted-foreground">
        Seleccione un módulo en la barra lateral para comenzar.
      </p>
    </div>
  );
}
```

### 4.11 `components/dashboard/sidebar.tsx`

**Responsabilidad:**
- Navegación del dashboard (enlaces a futuro)
- Logo/nombre del proyecto arriba
- Links: Dashboard, Plushies, Orders, Users
- Active link highlighting
- Versión mobile colapsable (para el MVP inicial, siempre visible en desktop)

```typescript
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  ShoppingBag,
  Package,
  Users,
} from "lucide-react";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/plushies", label: "Peluches", icon: Package },
  { href: "/orders", label: "Pedidos", icon: ShoppingBag },
  { href: "/users", label: "Usuarios", icon: Users },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex w-60 flex-col border-r bg-sidebar">
      {/* Logo / Título */}
      <div className="flex h-14 items-center border-b px-6 font-semibold">
        Catálogo de Peluches
      </div>

      {/* Navegación */}
      <nav className="flex-1 space-y-1 p-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href ||
            (item.href !== "/" && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent/50"
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
```

### 4.12 `components/dashboard/header.tsx`

**Responsabilidad:**
- Mostrar nombre de usuario autenticado
- Botón/avatar con dropdown-menu para logout
- Breadcrumb o título de página (opcional para MVP)

```typescript
"use client";

import { useAuthStore } from "@/stores/auth";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogOut, User } from "lucide-react";
import { toast } from "sonner";

export function Header() {
  const { user, logout } = useAuthStore();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    toast.success("Sesión cerrada");
    router.push("/login");
  };

  return (
    <header className="flex h-14 items-center justify-end border-b bg-background px-6">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="gap-2">
            <User className="h-4 w-4" />
            <span className="text-sm font-medium">
              {user?.username ?? "Admin"}
            </span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuLabel>
            {user?.email || "Sin correo"}
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="text-destructive focus:text-destructive"
            onClick={handleLogout}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Cerrar sesión
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
```

---

## 5. Reglas de negocio y validaciones

### 5.1 Login
- **Username:** obligatorio, mínimo 1 carácter.
- **Password:** obligatorio, mínimo 1 carácter.
- **Error de credenciales:** mostrar toast con el mensaje devuelto por el backend (`detail`).
- **Rate limiting:** el backend podría rechazar request; mostrar el error tal cual.

### 5.2 Sesión
- **Persistencia:** los tokens persisten en localStorage vía Zustand `persist`.
- **Refresh automático:** el interceptor de Axios en `lib/axios.ts` intenta refresh automático si 401.
- **Expiración de refresh:** si el refresh falla, se limpia el store y redirige a `/login`.
- **Carga inicial:** `AuthProvider` marca `isLoading=true` hasta que el store se hidrata (el useEffect se ejecuta).

### 5.3 Redirecciones
- **Login → Dashboard:** si el usuario ya está autenticado y visita `/login`, redirigir a `/`.
- **Dashboard → Login:** si no está autenticado y visita cualquier ruta `/(dashboard)`, redirigir a `/login`.

### 5.4 Protección de rutas
- El `DashboardLayout` es el guardian: verifica `isAuthenticated` antes de renderizar children.
- No se necesita middleware de Next.js para el MVP (el layout es suficiente).
- La redirección ocurre en el cliente (useEffect), no hay server-side redirect.

---

## 6. Flujo de navegación

```
Usuario no autenticado:
  /login → ingresa credenciales → POST /api/token/ → éxito → / (dashboard)

Usuario autenticado:
  /login → detecta isAuthenticated → redirige a / (dashboard)
  / (dashboard) → renderiza layout protegido + sidebar + header

Usuario con sesión expirada:
  Cualquier request → 401 → interceptor refresca → éxito → continúa
  Si refresh falla → limpia store → redirige a /login

Logout:
  Click "Cerrar sesión" → limpia store → redirige a /login
```

---

## 7. Dependencias a agregar

```bash
npm install react-hook-form @hookform/resolvers
```

Estas son necesarias para el formulario de login con validación Zod.

---

## 8. Árbol de archivos resultante

```
app/
├── globals.css
├── layout.tsx                    ← MODIFICADO (QueryProvider + AuthProvider + Toaster)
├── page.tsx                      ← (se reemplazará después con el dashboard o catálogo público)
├── login/
│   └── page.tsx                  ← NUEVO
└── (dashboard)/
    ├── layout.tsx                ← NUEVO
    └── page.tsx                  ← NUEVO (placeholder)

components/
├── ui/                           ← ya existe (11 componentes)
└── dashboard/
    ├── sidebar.tsx               ← NUEVO
    └── header.tsx                ← NUEVO

providers/
├── query.tsx                     ← ya existe
└── auth.tsx                      ← NUEVO

lib/
├── axios.ts                      ← ya existe (sin cambios)
├── utils.ts                      ← ya existe
└── auth.ts                       ← NUEVO (helpers)

stores/
└── auth.ts                       ← MODIFICADO (agregar isLoading, decodificar token)

types/
└── api.ts                        ← MODIFICADO (agregar LoginCredentials, TokenResponse, JwtPayload)
```

---

## 9. Criterios de aceptación

### Funcionales
1. [ ] El formulario de login valida campos vacíos y muestra errores.
2. [ ] Con credenciales válidas, inicia sesión, muestra toast de éxito y redirige a `/`.
3. [ ] Con credenciales inválidas, muestra toast con el mensaje de error del backend.
4. [ ] Si el usuario ya está autenticado y visita `/login`, es redirigido automáticamente a `/`.
5. [ ] El sidebar muestra enlaces a Dashboard, Peluches, Pedidos y Usuarios.
6. [ ] El header muestra el nombre de usuario y un dropdown con opción "Cerrar sesión".
7. [ ] Al hacer logout, se limpia la sesión y redirige a `/login`.
8. [ ] Sin sesión activa, acceder a `/(dashboard)` redirige a `/login`.
9. [ ] El refresh automático de tokens funciona sin intervención del usuario.

### Técnicos
10. [ ] `app/layout.tsx` envuelve con `<QueryProvider>` → `<AuthProvider>` → `<Toaster>`.
11. [ ] `stores/auth.ts` expone `isLoading` y decodifica el JWT para extraer datos del usuario.
12. [ ] `lib/auth.ts` contiene helpers `decodeToken`, `isTokenExpired`, `getUserFromToken`.
13. [ ] `providers/auth.tsx` exporta `AuthProvider` y hook `useAuth`.
14. [ ] No hay fugas: un usuario no autenticado no ve ninguna ruta protegida.
15. [ ] `npm run build` pasa sin errores.
16. [ ] `npm run lint` pasa sin errores.

---

## 10. Implementación futura (post-MVP)

- Middleware de Next.js (server-side) para proteger rutas antes de renderizar.
- Página de "Sesión expirada" con botón para volver a login.
- Tema oscuro toggle en el header.
- Sidebar colapsable en mobile.
- Avatar con iniciales del usuario.
