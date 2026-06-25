"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import { useAuthStore } from "@/stores/auth"
import { Button } from "@/components/ui/button"
import {
  LayoutDashboard,
  Warehouse,
  Truck,
  Package,
  Users,
  Ship,
  ShoppingCart,
  UserCircle,
  Bus,
  MapPin,
  Shield,
  UserCog,
  Menu,
  X,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { ThemeToggle } from "@/components/theme-toggle"
import { UserNav } from "@/components/user-nav"

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, permission: null as string | null },
  { href: "/warehouses", label: "Almacenes", icon: Warehouse, permission: "warehouse.view_warehouse" },
  { href: "/suppliers", label: "Proveedores", icon: Truck, permission: "suppliers.view_supplier" },
  { href: "/products", label: "Productos", icon: Package, permission: "products.view_product" },
  { href: "/customers", label: "Clientes", icon: Users, permission: "customer.view_customer" },
  { href: "/drivers", label: "Conductores", icon: UserCircle, permission: "driver.view_driver" },
  { href: "/transports", label: "Vehículos", icon: Bus, permission: "transport.view_transport" },
  { href: "/routes", label: "Rutas", icon: MapPin, permission: "route.view_route" },
  { href: "/shipments", label: "Envíos", icon: Ship, permission: "shipment.view_shipment" },
  { href: "/cart", label: "Carrito", icon: ShoppingCart, permission: null },
]

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const user = useAuthStore((s) => s.user)
  const can = useAuthStore((s) => s.can)
  const initialize = useAuthStore((s) => s.initialize)
  const router = useRouter()
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const sidebarRef = useRef<HTMLDivElement>(null)
  const hamburgerRef = useRef<HTMLButtonElement>(null)

  // ── Auth init + redirect ──
  useEffect(() => {
    initialize()
  }, [initialize])

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login")
    }
  }, [isAuthenticated, router])

  // ── Escape key closes sidebar ──
  const handleEscape = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape" && sidebarOpen) {
        setSidebarOpen(false)
        hamburgerRef.current?.focus()
      }
    },
    [sidebarOpen],
  )

  useEffect(() => {
    document.addEventListener("keydown", handleEscape)
    return () => document.removeEventListener("keydown", handleEscape)
  }, [handleEscape])

  // ── Focus trap: focus sidebar when opened ──
  useEffect(() => {
    if (sidebarOpen) {
      // Small timeout to let the transition start
      const timer = setTimeout(() => {
        sidebarRef.current?.focus()
      }, 50)
      return () => clearTimeout(timer)
    }
  }, [sidebarOpen])

  const closeSidebar = useCallback(() => {
    setSidebarOpen(false)
    hamburgerRef.current?.focus()
  }, [])

  const openSidebar = useCallback(() => {
    setSidebarOpen(true)
  }, [])

  if (!isAuthenticated) {
    return null
  }

  return (
    <div className="flex min-h-dvh overflow-hidden bg-background">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          aria-hidden="true"
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar */}
      <aside
        ref={sidebarRef}
        role={sidebarOpen ? "dialog" : "navigation"}
        aria-modal={sidebarOpen ? "true" : undefined}
        aria-label="Navegación principal"
        tabIndex={-1}
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r bg-sidebar outline-none transition-transform duration-200 ease-out lg:static lg:w-72 lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        {/* Sidebar header */}
        <div className="flex h-14 items-center justify-between border-b px-4">
          <Link
            href="/dashboard"
            className="font-semibold text-lg tracking-tight"
            onClick={closeSidebar}
          >
            Logística App
          </Link>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={closeSidebar}
              aria-label="Cerrar menú"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-1 scrollbar-thin">
          {navItems
            .filter((item) => !item.permission || can(item.permission))
            .map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={closeSidebar}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring",
                  isActive
                    ? "bg-primary/10 text-primary font-semibold"
                    : "text-sidebar-foreground hover:bg-sidebar-accent",
                )}
              >
                <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                {item.label}
              </Link>
            )
          })}
          {user?.is_superuser && (
            <Link
              key="/users"
              href="/users"
              onClick={closeSidebar}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring",
                pathname === "/users" || pathname.startsWith("/users/")
                  ? "bg-primary/10 text-primary font-semibold"
                  : "text-sidebar-foreground hover:bg-sidebar-accent",
              )}
            >
              <Shield className="h-4 w-4 shrink-0" aria-hidden="true" />
              Usuarios
            </Link>
          )}
          {user?.is_superuser && (
            <Link
              key="/roles"
              href="/roles"
              onClick={closeSidebar}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring",
                pathname === "/roles" || pathname.startsWith("/roles/")
                  ? "bg-primary/10 text-primary font-semibold"
                  : "text-sidebar-foreground hover:bg-sidebar-accent",
              )}
            >
              <UserCog className="h-4 w-4 shrink-0" aria-hidden="true" />
              Roles
            </Link>
          )}
          {user?.is_superuser && (
            <Link
              key="/permissions"
              href="/permissions"
              onClick={closeSidebar}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring",
                pathname === "/permissions" || pathname.startsWith("/permissions/")
                  ? "bg-primary/10 text-primary font-semibold"
                  : "text-sidebar-foreground hover:bg-sidebar-accent",
              )}
            >
              <Shield className="h-4 w-4 shrink-0" aria-hidden="true" />
              Permisos
            </Link>
          )}
        </nav>

        {/* Sidebar footer */}
        <div className="border-t p-3">
          <p className="text-xs text-muted-foreground/60 px-3">
            Logística App v1.0
          </p>
        </div>
      </aside>

      {/* Main area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background/95 backdrop-blur-sm px-4">
          <Button ref={hamburgerRef} variant="ghost" size="icon" onClick={openSidebar} aria-label="Abrir menú" className="lg:hidden">
            <Menu className="h-5 w-5" />
          </Button>
          <div className="ml-auto flex items-center gap-1">
            <ThemeToggle />
            <UserNav />
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-7xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
