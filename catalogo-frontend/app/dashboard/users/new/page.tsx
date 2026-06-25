"use client";

import { useRouter } from "next/navigation";
import { UserForm } from "@/components/users/admin/user-form";
import { useCreateAdminUser } from "@/hooks/use-admin-users";
import type { UserCreatePayload, UserUpdatePayload } from "@/types/api";

export default function NewUserPage() {
  const router = useRouter();
  const createMutation = useCreateAdminUser();

  const handleSubmit = async (data: UserCreatePayload | UserUpdatePayload) => {
    await createMutation.mutateAsync(data as UserCreatePayload);
    router.push("/dashboard/users");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-3xl font-bold tracking-tight">Nuevo Usuario</h1>
        <p className="text-muted-foreground">
          Agrega un nuevo usuario administrador al sistema
        </p>
      </div>
      <UserForm
        onSubmit={handleSubmit}
        isSubmitting={createMutation.isPending}
      />
    </div>
  );
}
