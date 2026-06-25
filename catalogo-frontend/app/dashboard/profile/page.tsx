"use client";

import { useAuthStore } from "@/stores/auth";
import { useAdminUser } from "@/hooks/use-admin-users";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertCircle, RefreshCw, ArrowLeft, User, Mail, Calendar, Shield, UserCog } from "lucide-react";
import Link from "next/link";

export default function ProfilePage() {
  const user = useAuthStore((s) => s.user);
  const userId = user?.id ?? 0;

  const { data: userData, isLoading, isError, refetch, isFetching } = useAdminUser(userId);

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-muted rounded animate-pulse" />
        <div className="h-4 w-64 bg-muted rounded animate-pulse" />
        <div className="space-y-4">
          <div className="h-10 w-full bg-muted rounded animate-pulse" />
          <div className="h-10 w-full bg-muted rounded animate-pulse" />
          <div className="h-10 w-full bg-muted rounded animate-pulse" />
        </div>
      </div>
    );
  }

  // Error state
  if (isError || !userData) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <AlertCircle className="h-16 w-16 text-destructive mb-4" />
        <h2 className="text-2xl font-semibold mb-2">Error al cargar perfil</h2>
        <p className="text-muted-foreground mb-6">
          No pudimos obtener tus datos. Intenta nuevamente.
        </p>
        <div className="flex gap-4">
          <Button variant="outline" nativeButton={false} render={<Link href="/dashboard" />}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver al dashboard
          </Button>
          <Button onClick={() => refetch()} disabled={isFetching}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
            Reintentar
          </Button>
        </div>
      </div>
    );
  }

  const joinedDate = new Date(userData.date_joined).toLocaleDateString("es-PE", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Back button */}
      <div>
        <Button variant="ghost" size="sm" nativeButton={false} render={<Link href="/dashboard" />}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver
        </Button>
      </div>

      <div>
        <h1 className="font-heading text-3xl font-bold tracking-tight">Mi Perfil</h1>
        <p className="text-muted-foreground">
          Tus datos personales en el sistema
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-lg">
                <User className="h-5 w-5" />
                {userData.username}
              </CardTitle>
              <CardDescription>
                Información de la cuenta
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {userData.is_superuser && (
                <Badge className="bg-chart-4/10 text-chart-4 border-chart-4/20 flex items-center gap-1">
                  <Shield className="h-3 w-3" />
                  Superadmin
                </Badge>
              )}
              {userData.is_staff && (
                <Badge className="bg-chart-2/10 text-chart-2 border-chart-2/20 flex items-center gap-1">
                  <UserCog className="h-3 w-3" />
                  Staff
                </Badge>
              )}
              {userData.is_active ? (
                <Badge className="bg-chart-5/10 text-chart-5 border-chart-5/20">Activo</Badge>
              ) : (
                <Badge variant="destructive">Inactivo</Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Nombre de usuario</p>
              <p className="font-medium">{userData.username}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Email</p>
              <p className="font-medium">{userData.email}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Nombre</p>
              <p className="font-medium">
                {userData.first_name || <span className="text-muted-foreground">—</span>}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Apellido</p>
              <p className="font-medium">
                {userData.last_name || <span className="text-muted-foreground">—</span>}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-sm text-muted-foreground border-t pt-4">
            <Calendar className="h-4 w-4" />
            Registrado el {joinedDate}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
