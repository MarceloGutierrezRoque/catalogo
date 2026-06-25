"use client";

import { useAuthStore } from "@/stores/auth";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { LogOut, User, Home, UserCircle, Menu } from "lucide-react";
import { toast } from "sonner";

interface HeaderProps {
  onToggleSidebar: () => void;
}

export function Header({ onToggleSidebar }: HeaderProps) {
  const { user, logout } = useAuthStore();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    toast.success("Sesión cerrada");
    router.push("/login");
  };

  return (
    <header className="flex h-14 items-center justify-between border-b border-border/60 bg-background px-4 md:px-6">
      {/* Hamburger — solo mobile */}
      <Button
        variant="ghost"
        size="icon"
        className="sm:hidden h-8 w-8"
        onClick={onToggleSidebar}
      >
        <Menu className="h-5 w-5" />
      </Button>

      {/* Spacer for desktop (logo is in sidebar) */}
      <div className="hidden sm:block" />

      {/* User dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger className="flex cursor-default items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium outline-none transition-all duration-200 hover:bg-muted hover:text-foreground active:scale-[0.97]">
          <User className="h-4 w-4" />
          <span className="text-sm font-medium">
            {user?.username ?? "Admin"}
          </span>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuGroup>
            <DropdownMenuLabel>
              {user?.email || "Sin correo"}
            </DropdownMenuLabel>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem render={<Link href="/dashboard/profile" />}>
            <UserCircle className="mr-2 h-4 w-4" />
            Ver perfil
          </DropdownMenuItem>
          <DropdownMenuItem render={<Link href="/" />}>
            <Home className="mr-2 h-4 w-4" />
            Ir al inicio
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            variant="destructive"
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
