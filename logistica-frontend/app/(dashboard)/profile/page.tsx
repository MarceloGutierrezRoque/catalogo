"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuthStore } from "@/stores/auth"
import { useUpdateMe } from "@/hooks/users"
import { User, Shield, Mail, BadgeCheck, Calendar, Pencil, Loader2 } from "lucide-react"

export default function ProfilePage() {
  const user = useAuthStore((s) => s.user)
  const updateProfile = useAuthStore((s) => s.updateProfile)
  const updateMutation = useUpdateMe()

  if (!user) {
    return (
      <div className="flex items-center justify-center py-24">
        <p className="text-muted-foreground">No se pudo cargar la información del usuario</p>
      </div>
    )
  }

  const initialFirstName = user?.first_name ?? ""
  const initialLastName = user?.last_name ?? ""
  const initialEmail = user?.email ?? ""

  const [editing, setEditing] = useState(false)
  const [firstName, setFirstName] = useState(initialFirstName)
  const [lastName, setLastName] = useState(initialLastName)
  const [email, setEmail] = useState(initialEmail)
  const [error, setError] = useState<string | null>(null)

  const token = useAuthStore.getState().accessToken
  let expDate: string | null = null
  if (token) {
    try {
      const exp = JSON.parse(atob(token.split(".")[1])).exp
      if (exp) {
        expDate = new Date(exp * 1000).toLocaleDateString("es-PE", {
          dateStyle: "long",
        })
      }
    } catch {
      // ignore
    }
  }

  const safeUser = user

  function handleCancel() {
    setEditing(false)
    setFirstName(safeUser.first_name ?? "")
    setLastName(safeUser.last_name ?? "")
    setEmail(safeUser.email ?? "")
    setError(null)
  }

  function handleSave() {
    if (!email.trim()) {
      setError("El correo electrónico es obligatorio")
      return
    }
    setError(null)

    updateMutation.mutate(
      { first_name: firstName, last_name: lastName, email },
      {
        onSuccess: () => {
          updateProfile({ first_name: firstName, last_name: lastName, email })
          setEditing(false)
        },
      }
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Mi Perfil</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Información básica de tu cuenta
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Datos de la cuenta */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <User className="h-4 w-4" />
              Datos de la cuenta
            </CardTitle>
            {!editing && (
              <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
                <Pencil className="h-3.5 w-3.5 mr-1" />
                Editar
              </Button>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            {editing ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="first_name">Nombres</Label>
                  <Input
                    id="first_name"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Tu nombre"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="last_name">Apellidos</Label>
                  <Input
                    id="last_name"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Tus apellidos"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">
                    Correo electrónico <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setError(null) }}
                    placeholder="correo@ejemplo.com"
                    required
                  />
                  {error && <p className="text-sm text-destructive">{error}</p>}
                </div>
                <div className="flex gap-2 pt-2">
                  <Button
                    variant="default"
                    size="sm"
                    onClick={handleSave}
                    disabled={updateMutation.isPending}
                  >
                    {updateMutation.isPending ? (
                      <><Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />Guardando…</>
                    ) : "Guardar"}
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleCancel}>
                    Cancelar
                  </Button>
                </div>
              </>
            ) : (
              <>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Nombres</p>
                  <p className="text-sm font-medium mt-0.5">{user.first_name || "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Apellidos</p>
                  <p className="text-sm font-medium mt-0.5">{user.last_name || "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
                    <Mail className="h-3 w-3 inline mr-1" />
                    Correo electrónico
                  </p>
                  <p className="text-sm font-medium mt-0.5">{user.email || "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
                    <BadgeCheck className="h-3 w-3 inline mr-1" />
                    Usuario
                  </p>
                  <p className="text-sm font-medium mt-0.5">{user.username}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">ID de usuario</p>
                  <p className="text-sm font-medium mt-0.5 font-mono">{user.id}</p>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Seguridad y roles */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Shield className="h-4 w-4" />
                Seguridad
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Sesión</p>
                <p className="text-sm font-medium mt-0.5 text-green-600 dark:text-green-400">Activa</p>
              </div>
              {expDate && (
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
                    <Calendar className="h-3 w-3 inline mr-1" />
                    Expiración del token
                  </p>
                  <p className="text-sm font-medium mt-0.5">{expDate}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <BadgeCheck className="h-4 w-4" />
                Roles del sistema
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Superusuario</span>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${user.is_superuser ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                  {user.is_superuser ? "Sí" : "No"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Staff</span>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${user.is_staff ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                  {user.is_staff ? "Sí" : "No"}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
