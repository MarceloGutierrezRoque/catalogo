"use client"

import { useState, useEffect } from "react"
import { useUsers, useCreateUser, useUpdateUser, useDeleteUser } from "@/hooks/users"
import { useGroups } from "@/hooks/groups"
import { useAuthStore } from "@/stores/auth"
import { useRouter } from "next/navigation"
import type { User, Group } from "@/types/api"
import { type SortingState } from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { DataTable } from "@/components/data-table"
import { userColumns } from "@/components/columns/users"
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

interface FormErrors {
  username?: string
  email?: string
  password?: string
}

export default function UsersPage() {
  const currentUser = useAuthStore((s) => s.user)
  const router = useRouter()

  // Redirect if not superuser
  useEffect(() => {
    if (currentUser && !currentUser.is_superuser) {
      router.push("/dashboard")
    }
  }, [currentUser, router])

  const { data: users, isLoading, isError, refetch } = useUsers()
  const { data: groups } = useGroups()
  const createMutation = useCreateUser()
  const updateMutation = useUpdateUser()
  const deleteMutation = useDeleteUser()

  // Table state
  const [sorting, setSorting] = useState<SortingState>([])
  const [globalFilter, setGlobalFilter] = useState("")

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null)

  // Form state
  const [formUsername, setFormUsername] = useState("")
  const [formEmail, setFormEmail] = useState("")
  const [formPassword, setFormPassword] = useState("")
  const [formFirstName, setFormFirstName] = useState("")
  const [formLastName, setFormLastName] = useState("")
  const [formIsActive, setFormIsActive] = useState(true)
  const [formIsStaff, setFormIsStaff] = useState(false)
  const [formIsSuperuser, setFormIsSuperuser] = useState(false)
  const [formGroups, setFormGroups] = useState<number[]>([])
  const [errors, setErrors] = useState<FormErrors>({})

  const groupsList = groups ?? []

  // Build a map of group name by id for display
  const groupNames = new Map(groupsList.map((g: Group) => [g.id, g.name]))

  // Resolve group names from ids
  function resolveGroupNames(ids: number[]): string {
    return ids.map((id) => groupNames.get(id) ?? `ID ${id}`).join(", ")
  }

  // ── Table columns ──

  const columns = userColumns({ openEditDialog, setDeleteTarget, currentUser, resolveGroupNames })

  const usersList = users ?? []

  // ── Dialog handlers ──

  function openCreateDialog() {
    setErrors({})
    setEditingUser(null)
    setFormUsername("")
    setFormEmail("")
    setFormPassword("")
    setFormFirstName("")
    setFormLastName("")
    setFormIsActive(true)
    setFormIsStaff(false)
    setFormIsSuperuser(false)
    setFormGroups([])
    setDialogOpen(true)
  }

  function openEditDialog(user: User) {
    setErrors({})
    setEditingUser(user)
    setFormUsername(user.username)
    setFormEmail(user.email)
    setFormPassword("")
    setFormFirstName(user.first_name)
    setFormLastName(user.last_name)
    setFormIsActive(user.is_active)
    setFormIsStaff(user.is_staff)
    setFormIsSuperuser(user.is_superuser)
    setFormGroups(user.groups ?? [])
    setDialogOpen(true)
  }

  function toggleGroup(groupId: number) {
    setFormGroups((prev) =>
      prev.includes(groupId)
        ? prev.filter((id) => id !== groupId)
        : [...prev, groupId]
    )
  }

  function validate(): FormErrors {
    const errs: FormErrors = {}
    if (!formUsername.trim()) errs.username = "El nombre de usuario es obligatorio"
    if (!editingUser && !formPassword) errs.password = "La contraseña es obligatoria"
    return errs
  }

  function clearError(field: keyof FormErrors) {
    setErrors((prev) => ({ ...prev, [field]: undefined }))
  }

  function handleSubmit() {
    const errs = validate()
    setErrors(errs)
    if (Object.keys(errs).length > 0) return

    const payload: Record<string, unknown> = {
      username: formUsername,
      email: formEmail,
      first_name: formFirstName,
      last_name: formLastName,
      is_active: formIsActive,
      is_staff: formIsStaff,
      is_superuser: formIsSuperuser,
      groups: formGroups,
    }

    if (!editingUser) {
      payload.password = formPassword
      createMutation.mutate(payload as Parameters<typeof createMutation.mutate>[0], {
        onSuccess: () => setDialogOpen(false),
      })
    } else {
      // Only send password if provided
      if (formPassword) {
        payload.password = formPassword
      }
      updateMutation.mutate(
        { id: editingUser.id, data: payload },
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

  // ── Redirect while checking ──

  if (!currentUser) return null

  if (!currentUser.is_superuser) return null

  // ── Loading / Error states ──

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary/60" />
        <p className="text-sm text-muted-foreground">Cargando usuarios…</p>
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
          <p className="font-medium text-destructive">Error al cargar usuarios</p>
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
          <h1 className="text-3xl font-bold tracking-tight">Usuarios</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Administra los usuarios del sistema (solo superusuarios)
          </p>
        </div>
        <Button onClick={openCreateDialog} size="lg" className="shrink-0">
          <Plus className="mr-1.5 h-4 w-4" />
          Nuevo Usuario
        </Button>
      </div>

      <MobileFilterSheet
        globalFilter={globalFilter}
        onGlobalFilterChange={setGlobalFilter}
        placeholder="Buscar…"
      />

      <DataTable
        columns={columns}
        data={usersList}
        sorting={sorting}
        onSortingChange={setSorting}
        globalFilter={globalFilter}
        onGlobalFilterChange={setGlobalFilter}
        emptyMessage="No hay usuarios registrados"
        filteredEmptyMessage="No se encontraron usuarios"
        noDataHint='Presiona "Nuevo Usuario" para crear el primero'
      />

      {/* ── Create / Edit Dialog ── */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingUser ? "Editar Usuario" : "Nuevo Usuario"}
            </DialogTitle>
            <DialogDescription>
              {editingUser
                ? "Modifica los datos del usuario"
                : "Ingresa los datos del nuevo usuario"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2 max-h-[60dvh] overflow-y-auto">
            {/* Username */}
            <div className="space-y-2">
              <Label htmlFor="username">
                Usuario <span className="text-destructive">*</span>
              </Label>
              <Input
                id="username"
                value={formUsername}
                onChange={(e) => {
                  setFormUsername(e.target.value)
                  clearError("username")
                }}
                placeholder="jperez"
                required
              />
              {errors.username && <p className="text-sm text-destructive">{errors.username}</p>}
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formEmail}
                onChange={(e) => {
                  setFormEmail(e.target.value)
                  clearError("email")
                }}
                placeholder="jperez@example.com"
              />
              {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
            </div>

            {/* Password */}
            <div className="space-y-2">
              <Label htmlFor="password">
                Contraseña {!editingUser && <span className="text-destructive">*</span>}
              </Label>
              <Input
                id="password"
                type="password"
                value={formPassword}
                onChange={(e) => {
                  setFormPassword(e.target.value)
                  clearError("password")
                }}
                placeholder={editingUser ? "Dejar vacío para no cambiar" : "••••••••"}
              />
              {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
              {editingUser && (
                <p className="text-xs text-muted-foreground">
                  Dejar vacío para mantener la contraseña actual
                </p>
              )}
            </div>

            {/* First Name / Last Name */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="first_name">Nombre</Label>
                <Input
                  id="first_name"
                  value={formFirstName}
                  onChange={(e) => setFormFirstName(e.target.value)}
                  placeholder="Juan"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="last_name">Apellido</Label>
                <Input
                  id="last_name"
                  value={formLastName}
                  onChange={(e) => setFormLastName(e.target.value)}
                  placeholder="Pérez"
                />
              </div>
            </div>

            {/* Toggles row */}
            <div className="flex items-center gap-6 pt-2">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <Checkbox
                  checked={formIsActive}
                  onCheckedChange={(c) => setFormIsActive(c === true)}
                />
                Activo
              </label>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <Checkbox
                  checked={formIsStaff}
                  onCheckedChange={(c) => setFormIsStaff(c === true)}
                />
                Staff
              </label>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <Checkbox
                  checked={formIsSuperuser}
                  onCheckedChange={(c) => setFormIsSuperuser(c === true)}
                />
                Superuser
              </label>
            </div>

            {/* Groups multi-select with checkboxes */}
            <div className="space-y-2">
              <Label>Roles (Grupos)</Label>
              {groupsList.length === 0 ? (
                <p className="text-sm text-muted-foreground">No hay roles disponibles</p>
              ) : (
                <div className="border rounded-lg p-3 space-y-2 max-h-40 overflow-y-auto">
                  {groupsList.map((group: Group) => (
                    <label
                      key={group.id}
                      className="flex items-center gap-2 text-sm cursor-pointer hover:text-foreground/80"
                    >
                      <Checkbox
                        checked={formGroups.includes(group.id)}
                        onCheckedChange={() => toggleGroup(group.id)}
                      />
                      {group.name}
                    </label>
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
              ) : editingUser ? (
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
                <DialogTitle>Eliminar Usuario</DialogTitle>
                <DialogDescription className="mt-1">
                  ¿Estás seguro? Esta acción eliminará permanentemente a{" "}
                  <span className="font-medium text-foreground">
                    {deleteTarget?.username}
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
