"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  ShoppingBag,
  Package,
  Users,
  X,
} from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/plushies", label: "Peluches", icon: Package },
  { href: "/dashboard/orders", label: "Pedidos", icon: ShoppingBag },
  { href: "/dashboard/users", label: "Usuarios", icon: Users },
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();

  const handleNavClick = () => {
    // Close sidebar on mobile after navigation
    if (window.innerWidth < 640) {
      onClose();
    }
  };

  return (
    <>
      {/* Overlay backdrop — solo mobile cuando está abierto */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 sm:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={cn(
          // Desktop: static layout
          "sm:flex sm:w-60 sm:relative sm:translate-x-0",
          // Mobile: fixed overlay
          "fixed inset-y-0 left-0 z-50 flex w-60 flex-col border-r bg-sidebar transition-transform duration-300 ease-in-out",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Logo / Title + close button */}
        <div className="flex h-14 items-center justify-between border-b border-border/60 px-4">
          <span className="font-heading font-bold tracking-tight">
            Catálogo de Peluches
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 sm:hidden"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 p-4">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href ||
              (item.href !== "/dashboard" && item.href !== "/" && pathname.startsWith(item.href + "/"));

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={handleNavClick}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm"
                    : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:translate-x-0.5"
                )}
              >
                <Icon className={cn("h-4 w-4 transition-transform duration-200", isActive ? "scale-110" : "")} />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
