"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LogIn, LayoutDashboard, ShoppingCart as CartIcon, Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCartStore } from "@/stores/cart";
import { useAuthStore } from "@/stores/auth";

const navLinks = [
  { href: "/", label: "Inicio" },
  { href: "/plushies", label: "Catálogo" },
  { href: "#testimonios", label: "Proveedores" },
  { href: "#nosotros", label: "Nosotros" },
];

const isHashLink = (href: string) => href.startsWith("#");

export function Navbar() {
  const pathname = usePathname();
  const totalItems = useCartStore((s) => s.items.reduce((sum, i) => sum + i.quantity, 0));
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const handleNavClick = () => {
    setDrawerOpen(false);
  };

  return (
    <>
      <header className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-7xl rounded-2xl border border-border/20 bg-gradient-to-b from-background/80 to-background/60 backdrop-blur-xl shadow-xl shadow-black/5">
        <div className="flex h-16 items-center justify-between px-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 font-heading font-bold text-lg sm:text-xl tracking-tight">
            Catálogo de Peluches
          </Link>

          <div className="flex items-center gap-2 sm:gap-4">
            {/* Navegación desktop */}
            <nav className="hidden sm:flex items-center gap-8">
              {navLinks.map((link) =>
                isHashLink(link.href) ? (
                  <a
                    key={link.href}
                    href={link.href}
                    onClick={handleNavClick}
                    className="relative text-sm font-medium transition-colors duration-200 hover:text-primary text-muted-foreground after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-0 after:bg-primary after:transition-all after:duration-300 hover:after:w-full"
                  >
                    {link.label}
                  </a>
                ) : (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={cn(
                      "relative text-sm font-medium transition-colors duration-200 hover:text-primary after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-0 after:bg-primary after:transition-all after:duration-300 hover:after:w-full",
                      pathname === link.href
                        ? "text-primary after:w-full"
                        : "text-muted-foreground"
                    )}
                  >
                    {link.label}
                  </Link>
                )
              )}
            </nav>

            {/* Cart — antes del auth */}
            <Link
              href="/cart"
              className={cn(
                "relative flex items-center gap-1.5 text-sm font-medium transition-all duration-200 hover:text-primary hover:scale-105",
                pathname === "/cart"
                  ? "text-primary"
                  : "text-muted-foreground"
              )}
            >
              <CartIcon className="h-5 w-5 sm:h-4 sm:w-4 transition-transform duration-200" />
              <span className="hidden sm:inline">Carrito</span>
              {totalItems > 0 && (
                <Badge variant="secondary" className="absolute -top-2 -right-2 sm:static sm:ml-0.5 h-5 min-w-5 px-1 text-xs font-bold">
                  {totalItems}
                </Badge>
              )}
            </Link>

            {/* Auth button — desktop, al final */}
            <div className="hidden sm:block">
              {isAuthenticated ? (
                <Button variant="outline" size="sm" nativeButton={false} render={<Link href="/dashboard" />}>
                  <LayoutDashboard className="mr-2 h-4 w-4" />
                  Dashboard
                </Button>
              ) : (
                <Button variant="outline" size="sm" nativeButton={false} render={<Link href="/login" />}>
                  <LogIn className="mr-2 h-4 w-4" />
                  Iniciar sesión
                </Button>
              )}
            </div>

            {/* Hamburger — solo mobile */}
            <Button
              variant="ghost"
              size="icon"
              className="sm:hidden h-8 w-8"
              onClick={() => setDrawerOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* ─── Mobile drawer (outside header to avoid z-index conflicts) ─── */}

      {/* Overlay */}
      <div
        className={cn(
          "fixed inset-0 z-40 bg-black/40 transition-opacity duration-300 sm:hidden",
          drawerOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={() => setDrawerOpen(false)}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        className={cn(
          "fixed inset-y-0 right-0 z-50 flex w-64 flex-col bg-gradient-to-b from-background/95 to-background/90 backdrop-blur-xl border-l border-border/20 shadow-xl transition-transform duration-300 ease-in-out sm:hidden",
          drawerOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        {/* Drawer header */}
        <div className="flex h-16 items-center justify-between border-b border-border/60 px-4">
          <span className="font-heading font-bold tracking-tight">Menú</span>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setDrawerOpen(false)}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Drawer nav links */}
        <nav className="flex-1 space-y-1 p-4">
          {navLinks.map((link) =>
            isHashLink(link.href) ? (
              <a
                key={link.href}
                href={link.href}
                onClick={handleNavClick}
                className="flex items-center rounded-lg px-3 py-2.5 text-sm font-medium transition-colors text-foreground hover:bg-muted"
              >
                {link.label}
              </a>
            ) : (
              <Link
                key={link.href}
                href={link.href}
                onClick={handleNavClick}
                className={cn(
                  "flex items-center rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  pathname === link.href
                    ? "bg-primary/10 text-primary"
                    : "text-foreground hover:bg-muted"
                )}
              >
                {link.label}
              </Link>
            )
          )}
        </nav>

        {/* Drawer footer — auth */}
        <div className="border-t border-border/60 p-4">
          {isAuthenticated ? (
            <Button className="w-full" size="sm" nativeButton={false} render={<Link href="/dashboard" onClick={handleNavClick} />}>
              <LayoutDashboard className="mr-2 h-4 w-4" />
              Dashboard
            </Button>
          ) : (
            <Button className="w-full" size="sm" nativeButton={false} render={<Link href="/login" onClick={handleNavClick} />}>
              <LogIn className="mr-2 h-4 w-4" />
              Iniciar sesión
            </Button>
          )}
        </div>
      </div>
    </>
  );
}
