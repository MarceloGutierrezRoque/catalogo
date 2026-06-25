"use client";

import { useParams, useRouter } from "next/navigation";
import { PlushieForm } from "@/components/plushies/admin/plushie-form";
import { DeleteDialog } from "@/components/plushies/admin/delete-dialog";
import {
  useAdminPlushie,
  useUpdateAdminPlushie,
  useDeleteAdminPlushie,
  useActivateAdminPlushie,
  useDeactivateAdminPlushie,
} from "@/hooks/use-admin-plushies";
import type { AdminPlushieUpdatePayload } from "@/types/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, AlertCircle, RefreshCw, Power, PowerOff, Trash2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export default function EditPlushiePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const plushieId = Number(id);

  const { data: plushie, isLoading, isError, refetch, isFetching } = useAdminPlushie(plushieId);
  const updateMutation = useUpdateAdminPlushie();
  const deleteMutation = useDeleteAdminPlushie();
  const activateMutation = useActivateAdminPlushie();
  const deactivateMutation = useDeactivateAdminPlushie();

  const [deleteOpen, setDeleteOpen] = useState(false);

  const handleSubmit = async (data: AdminPlushieUpdatePayload) => {
    await updateMutation.mutateAsync({ id: plushieId, data });
    router.push("/dashboard/plushies");
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-muted rounded animate-pulse" />
        <div className="h-4 w-64 bg-muted rounded animate-pulse" />
        <div className="space-y-4">
          <div className="h-10 w-full bg-muted rounded animate-pulse" />
          <div className="h-32 w-full bg-muted rounded animate-pulse" />
          <div className="h-10 w-48 bg-muted rounded animate-pulse" />
        </div>
      </div>
    );
  }

  // Error state
  if (isError || !plushie) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <AlertCircle className="h-16 w-16 text-destructive mb-4" />
        <h2 className="text-2xl font-semibold mb-2">Peluche no encontrado</h2>
        <p className="text-muted-foreground mb-6">
          El peluche que buscas no existe o ha sido eliminado.
        </p>
        <div className="flex gap-4">
          <Link href="/dashboard/plushies">
            <Button variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver al listado
            </Button>
          </Link>
          <Button onClick={() => refetch()} disabled={isFetching}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
            Reintentar
          </Button>
        </div>
      </div>
    );
  }

  // Si está eliminado (soft-delete), mostrar bloqueado
  const isDeleted = plushie.is_deleted;
  const isActive = plushie.is_active;

  return (
    <div className="space-y-6">
      {/* Back button */}
      <div>
        <Button variant="ghost" size="sm" nativeButton={false} render={<Link href="/dashboard/plushies" />}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver
        </Button>
      </div>

      {/* Header con acciones */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-heading text-3xl font-bold tracking-tight">{plushie.name}</h1>
          <p className="text-muted-foreground">Editar peluche</p>
        </div>

        <div className="flex items-center gap-2">
          {isDeleted ? (
            <Badge variant="destructive">Eliminado</Badge>
          ) : isActive ? (
            <>
              <Badge className="bg-chart-5/10 text-chart-5 border-chart-5/20">Activo</Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={() => deactivateMutation.mutate(plushieId)}
                disabled={deactivateMutation.isPending}
              >
                <PowerOff className="mr-2 h-4 w-4" />
                Desactivar
              </Button>
            </>
          ) : (
            <>
              <Badge variant="secondary">Inactivo</Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={() => activateMutation.mutate(plushieId)}
                disabled={activateMutation.isPending}
              >
                <Power className="mr-2 h-4 w-4" />
                Activar
              </Button>
            </>
          )}

          {!isDeleted && (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setDeleteOpen(true)}
              disabled={deleteMutation.isPending}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Eliminar
            </Button>
          )}
        </div>
      </div>

      {/* Formulario de edición */}
      <PlushieForm
        initialData={plushie}
        onSubmit={handleSubmit}
        isSubmitting={updateMutation.isPending}
      />

      <DeleteDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        plushieName={plushie.name}
        onConfirm={async () => {
          await deleteMutation.mutateAsync(plushieId);
          router.push("/dashboard/plushies");
        }}
        isPending={deleteMutation.isPending}
      />
    </div>
  );
}
