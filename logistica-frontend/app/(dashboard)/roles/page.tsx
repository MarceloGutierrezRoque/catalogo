"use client"

import { useState, useEffect } from "react"
import { useGroups, useCreateGroup, useUpdateGroup, useDeleteGroup } from "@/hooks/groups"
import { usePermissions } from "@/hooks/permissions"
import { useAuthStore } from "@/stores/auth"
import { useRouter } from "next/navigation"
import type { Group, Permission } from "@/types/api"
import { type SortingState } from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { DataTable } from "@/components/data-table"
import { roleColumns } from "@/components/columns/roles"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Plus, Trash2, Loader2 } from "lucide-react"
import { MobileFilterSheet } from "@/components/mobile-filter-sheet"

export default function RolesPage() {
  const currentUser = useAuthStore((s) => s.user)
  const router = useRouter()

  // Redirect if not superuser
  useEffect(() => {
    if (currentUser && !currentUser.is_superuser) {
      router.push("/dashboard")
    }
  }, [currentUser, router])

  const { data: groups, isLoading, isError, refetch } = useGroups()
  const { data: permissions } = usePermissions()
  const createMutation = useCreateGroup()
  const updateMutation = useUpdateGroup()
  const deleteMutation = useDeleteGroup()

  // Table state
  const [sorting, setSorting] = useState<SortingState>([])
  const [globalFilter, setGlobalFilter] = useState("")

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingGroup, setEditingGroup] = useState<Group | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Group | null>(null)

  // Form state
  const [formName, setFormName] = useState("")
  const [formPermissions, setFormPermissions] = useState<number[]>([])
  const [formError, setFormError] = useState<string | null>(null)

  const permissionsList = permissions ?? []

  // ── Table columns ──

  const columns = roleColumns({ openEditDialog, setDeleteTarget })

  const groupsList = groups ?? []

  // ── Dialog handlers ──

  function openCreateDialog() {
    setFormError(null)
    setEditingGroup(null)
    setFormName("")
    setFormPermissions([])
    setDialogOpen(true)
  }

  function openEditDialog(group: Group) {
    setFormError(null)
    setEditingGroup(group)
    setFormName(group.name)
    setFormPermissions(group.permissions ?? [])
    setDialogOpen(true)
  }

  function togglePermission(permId: number) {
    setFormPermissions((prev) =>
      prev.includes(permId)
        ? prev.filter((id) => id !== permId)
        : [...prev, permId]
    )
  }

  function handleSubmit() {
    if (!formName.trim()) {
      setFormError("El nombre del rol es obligatorio")
      return
    }

    const payload = {
      name: formName,
      permissions: formPermissions,
    }

    if (!editingGroup) {
      createMutation.mutate(payload, {
        onSuccess: () => setDialogOpen(false),
      })
    } else {
      updateMutation.mutate(
        { id: editingGroup.id, data: payload },
        { onSuccess: () => setDialogOpen(false) }
      )
    }
  }

  function handleDelete() {
    if (!deleteTarget) return
    deleteMutation.mutate(deleteTarget.id, {
      onSuccess: () => setDeleteTarget(null),
    })
  }

  // Human-readable module names
  const moduleLabels: Record<string, string> = {
    admin: "Administración",
    auth: "Autenticación",
    warehouse: "Almacenes",
    suppliers: "Proveedores",
    products: "Productos",
    customer: "Clientes",
    shipment: "Envíos",
    driver: "Conductores",
    transport: "Vehículos",
    route: "Rutas",
  }

  function moduleLabel(appLabel: string): string {
    return moduleLabels[appLabel] ?? appLabel.charAt(0).toUpperCase() + appLabel.slice(1)
  }

  // Group permissions by app_label for better UX
  const permissionsByModule = permissionsList.reduce<Record<string, Permission[]>>((acc, perm) => {
    const key = perm.app_label
    if (!acc[key]) acc[key] = []
    acc[key].push(perm)
    return acc
  }, {})

  // ── Redirect while checking ──

  if (!currentUser) return null
  if (!currentUser.is_superuser) return null

  // ── Loading / Error states ──

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary/60" />
        <p className="text-sm text-muted-foreground">Cargando roles…</p>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
          <span className="text-lg font-bold text-destructive">!</span>
        </div>
        <div>
          <p className="font-medium text-destructive">Error al cargar roles</p>
          <p className="text-sm text-muted-foreground mt-1">
            Verifica la conexión con el servidor e intenta nuevamente.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          Reintentar
        </Button>
      </div>
    )
  }

  const isMutating = createMutation.isPending || updateMutation.isPending

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Roles</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Administra los roles y permisos del sistema
          </p>
        </div>
        <Button onClick={openCreateDialog} size="lg" className="shrink-0">
          <Plus className="mr-1.5 h-4 w-4" />
          Nuevo Rol
        </Button>
      </div>

      <MobileFilterSheet
        globalFilter={globalFilter}
        onGlobalFilterChange={setGlobalFilter}
        placeholder="Buscar roles…"
      />

      <DataTable
        columns={columns}
        data={groupsList}
        sorting={sorting}
        onSortingChange={setSorting}
        globalFilter={globalFilter}
        onGlobalFilterChange={setGlobalFilter}
        emptyMessage="No hay roles registrados"
        filteredEmptyMessage="No se encontraron roles"
        noDataHint='Presiona "Nuevo Rol" para crear el primero'
      />

      {/* ── Create / Edit Dialog ── */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingGroup ? "Editar Rol" : "Nuevo Rol"}
            </DialogTitle>
            <DialogDescription>
              {editingGroup
                ? "Modifica el nombre y los permisos del rol"
                : "Crea un nuevo rol con permisos específicos"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2 max-h-[60dvh] overflow-y-auto">
            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name">
                Nombre del Rol <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                value={formName}
                onChange={(e) => {
                  setFormName(e.target.value)
                  setFormError(null)
                }}
                placeholder="ej: Operador Logístico"
                required
              />
              {formError && <p className="text-sm text-destructive">{formError}</p>}
            </div>

            {/* Permissions multi-select grouped by module */}
            <div className="space-y-2">
              <Label>Permisos</Label>
              {permissionsList.length === 0 ? (
                <p className="text-sm text-muted-foreground">No hay permisos disponibles</p>
              ) : (
                <div className="border rounded-lg p-3 space-y-3 max-h-60 overflow-y-auto">
                  {Object.entries(permissionsByModule).map(([appLabel, perms]) => (
                    <div key={appLabel}>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                        {moduleLabel(appLabel)}
                      </p>
                      <div className="space-y-1 pl-1">
                        {perms.map((perm) => (
                          <label
                            key={perm.id}
                            className="flex items-center gap-2 text-sm cursor-pointer hover:text-foreground/80"
                          >
                            <Checkbox
                              checked={formPermissions.includes(perm.id)}
                              onCheckedChange={() => togglePermission(perm.id)}
                            />
                            <span className="text-xs text-muted-foreground font-mono">{perm.codename}</span>
                            <span className="text-xs text-muted-foreground/60">— {perm.name}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              disabled={isMutating}
            >
              Cancelar
            </Button>
            <Button
              variant="default"
              onClick={handleSubmit}
              disabled={isMutating}
            >
              {isMutating ? (
                <>
                  <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                  Guardando…
                </>
              ) : editingGroup ? (
                "Actualizar"
              ) : (
                "Crear"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Delete Confirmation Dialog ── */}
      <Dialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-destructive/10">
                <Trash2 className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <DialogTitle>Eliminar Rol</DialogTitle>
                <DialogDescription className="mt-1">
                  ¿Estás seguro? Esta acción eliminará permanentemente el rol{" "}
                  <span className="font-medium text-foreground">
                    {deleteTarget?.name}
                  </span>
                  .
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <DialogFooter className="mt-2">
            <Button
              variant="outline"
              onClick={() => setDeleteTarget(null)}
              disabled={deleteMutation.isPending}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? (
                <>
                  <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                  Eliminando…
                </>
              ) : (
                "Eliminar"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
