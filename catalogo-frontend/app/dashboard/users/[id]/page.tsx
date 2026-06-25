"use client";

import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { UserForm } from "@/components/users/admin/user-form";
import { DeleteUserDialog } from "@/components/users/admin/delete-user-dialog";
import {
  useAdminUser,
  useUpdateAdminUser,
  useDeleteAdminUser,
} from "@/hooks/use-admin-users";
import type { UserUpdatePayload } from "@/types/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  AlertCircle,
  RefreshCw,
  Trash2,
  Shield,
  ShieldOff,
  UserCog,
  Calendar,
} from "lucide-react";
import Link from "next/link";

export default function EditUserPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const userId = Number(id);

  const { data: user, isLoading, isError, refetch, isFetching } = useAdminUser(userId);
  const updateMutation = useUpdateAdminUser();
  const deleteMutation = useDeleteAdminUser();

  const [deleteOpen, setDeleteOpen] = useState(false);

  const handleSubmit = async (data: UserUpdatePayload) => {
    await updateMutation.mutateAsync({ id: userId, data });
    router.push("/dashboard/users");
  };

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
  if (isError || !user) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <AlertCircle className="h-16 w-16 text-destructive mb-4" />
        <h2 className="text-2xl font-semibold mb-2">Usuario no encontrado</h2>
        <p className="text-muted-foreground mb-6">
          El usuario que buscas no existe o ha sido eliminado.
        </p>
        <div className="flex gap-4">
          <Button variant="outline" nativeButton={false} render={<Link href="/dashboard/users" />}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver al listado
          </Button>
          <Button onClick={() => refetch()} disabled={isFetching}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
            Reintentar
          </Button>
        </div>
      </div>
    );
  }

  const createdDate = new Date(user.date_joined).toLocaleDateString("es-PE", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="space-y-6">
      {/* Back button */}
      <div>
        <Button variant="ghost" size="sm" nativeButton={false} render={<Link href="/dashboard/users" />}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver
        </Button>
      </div>

      {/* Header con información del usuario */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-heading text-3xl font-bold tracking-tight">{user.username}</h1>
          <p className="text-muted-foreground">
            {user.first_name || user.last_name
              ? [user.first_name, user.last_name].filter(Boolean).join(" ")
              : user.email}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {user.is_superuser && (
            <Badge className="bg-chart-4/10 text-chart-4 border-chart-4/20 flex items-center gap-1">
              <Shield className="h-3 w-3" />
              Superadmin
            </Badge>
          )}
          {user.is_staff ? (
            <Badge className="bg-chart-2/10 text-chart-2 border-chart-2/20 flex items-center gap-1">
              <UserCog className="h-3 w-3" />
              Staff
            </Badge>
          ) : null}
          {user.is_active ? (
            <Badge className="bg-chart-5/10 text-chart-5 border-chart-5/20">Activo</Badge>
          ) : (
            <Badge variant="destructive">Inactivo</Badge>
          )}
        </div>
      </div>

      {/* Info adicional */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Calendar className="h-4 w-4" />
        Registrado el {createdDate}
      </div>

      {/* Formulario de edición */}
      <UserForm
        initialData={user}
        onSubmit={handleSubmit}
        isSubmitting={updateMutation.isPending}
      />

      {/* Zona de peligro: eliminar usuario */}
      {!user.is_superuser && (
        <div className="border border-destructive/20 rounded-lg p-6 space-y-3">
          <div className="flex items-center gap-2">
            <Trash2 className="h-5 w-5 text-destructive" />
            <h2 className="text-lg font-semibold text-destructive">Zona de peligro</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            Desactivar este usuario evitará que pueda acceder al panel de administración.
            Puedes reactivarlo después editando su perfil.
          </p>
          <Button
            variant="destructive"
            onClick={() => setDeleteOpen(true)}
            disabled={deleteMutation.isPending}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Desactivar usuario
          </Button>
        </div>
      )}

      {user.is_superuser && (
        <div className="border border-muted rounded-lg p-6 space-y-3">
          <div className="flex items-center gap-2">
            <ShieldOff className="h-5 w-5 text-muted-foreground" />
            <h2 className="text-lg font-semibold">Superadmin</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            Los usuarios superadministradores no pueden ser desactivados desde esta interfaz.
          </p>
        </div>
      )}

      <DeleteUserDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        username={user.username}
        onConfirm={async () => {
          await deleteMutation.mutateAsync(userId);
          router.push("/dashboard/users");
        }}
        isPending={deleteMutation.isPending}
      />
    </div>
  );
}
