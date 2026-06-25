"use client";

import { useRouter } from "next/navigation";
import { PlushieForm } from "@/components/plushies/admin/plushie-form";
import { useCreateAdminPlushie } from "@/hooks/use-admin-plushies";
import type { AdminPlushieCreatePayload, AdminPlushieUpdatePayload } from "@/types/api";

export default function NewPlushiePage() {
  const router = useRouter();
  const createMutation = useCreateAdminPlushie();

  const handleSubmit = async (data: AdminPlushieCreatePayload | AdminPlushieUpdatePayload) => {
    await createMutation.mutateAsync(data as AdminPlushieCreatePayload);
    router.push("/dashboard/plushies");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-3xl font-bold tracking-tight">Nuevo Peluche</h1>
        <p className="text-muted-foreground">
          Agrega un nuevo peluche al catálogo
        </p>
      </div>
      <PlushieForm
        onSubmit={handleSubmit}
        isSubmitting={createMutation.isPending}
      />
    </div>
  );
}
