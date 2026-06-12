"use client"

import { usePermissions } from "@/hooks/permissions"
import { useAuthStore } from "@/stores/auth"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Loader2, Shield } from "lucide-react"

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

export default function PermissionsPage() {
  const user = useAuthStore((s) => s.user)
  const router = useRouter()

  useEffect(() => {
    if (user && !user.is_superuser) {
      router.push("/dashboard")
    }
  }, [user, router])

  const { data: permissions, isLoading, isError, refetch } = usePermissions()

  if (!user) return null
  if (!user.is_superuser) return null

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary/60" />
        <p className="text-sm text-muted-foreground">Cargando permisos…</p>
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
          <p className="font-medium text-destructive">Error al cargar permisos</p>
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

  const permissionsList = permissions ?? []

  // Group by app_label
  const grouped = permissionsList.reduce<Record<string, typeof permissionsList>>((acc, perm) => {
    const key = perm.app_label
    if (!acc[key]) acc[key] = []
    acc[key].push(perm)
    return acc
  }, {})

  const sortedModules = Object.keys(grouped).sort()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Permisos del Sistema</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Listado completo de todos los permisos disponibles en el sistema, organizados por módulo
        </p>
      </div>

      {sortedModules.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Shield className="h-12 w-12 text-muted-foreground/40 mb-3" />
          <p className="text-muted-foreground">No hay permisos registrados</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {sortedModules.map((appLabel) => {
            const perms = grouped[appLabel]
            return (
              <Card key={appLabel}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">
                    {moduleLabel(appLabel)}
                  </CardTitle>
                  <CardDescription>
                    {perms.length} {perms.length === 1 ? "permiso" : "permisos"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  {perms.map((perm) => (
                    <div key={perm.id} className="flex items-center gap-2">
                      <Badge
                        variant="outline"
                        className="font-mono text-[11px] shrink-0"
                      >
                        {perm.codename}
                      </Badge>
                      <span className="text-xs text-muted-foreground leading-tight">
                        {perm.name}
                      </span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
