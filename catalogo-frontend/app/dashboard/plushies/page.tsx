import { AdminPlushiesTable } from "@/components/plushies/admin/admin-plushies-table";

export default function AdminPlushiesPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-3xl font-bold tracking-tight">Peluches</h1>
          <p className="text-muted-foreground">
            Gestiona el catálogo completo de peluches
          </p>
        </div>
      </div>
      <AdminPlushiesTable />
    </div>
  );
}
