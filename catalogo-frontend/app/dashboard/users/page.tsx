import { AdminUsersTable } from "@/components/users/admin/admin-users-table";

export default function AdminUsersPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-3xl font-bold tracking-tight">Usuarios</h1>
          <p className="text-muted-foreground">
            Gestiona los usuarios administradores del sistema
          </p>
        </div>
      </div>
      <AdminUsersTable />
    </div>
  );
}
