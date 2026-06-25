"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import type { User } from "@/types/api";
import type { UserCreatePayload, UserUpdatePayload } from "@/types/api";

// Schema de creación: password requerido
const createUserSchema = z.object({
  username: z
    .string()
    .min(3, "El nombre de usuario debe tener al menos 3 caracteres"),
  email: z.string().email("Ingresa un email válido"),
  password: z
    .string()
    .min(6, "La contraseña debe tener al menos 6 caracteres"),
  first_name: z.string().optional().default(""),
  last_name: z.string().optional().default(""),
  is_staff: z.boolean().optional().default(false),
});

// Schema de edición: password opcional
const updateUserSchema = z.object({
  username: z
    .string()
    .min(3, "El nombre de usuario debe tener al menos 3 caracteres"),
  email: z.string().email("Ingresa un email válido"),
  password: z
    .string()
    .min(6, "La contraseña debe tener al menos 6 caracteres")
    .optional()
    .or(z.literal("")),
  first_name: z.string().optional().default(""),
  last_name: z.string().optional().default(""),
  is_staff: z.boolean().optional(),
  is_active: z.boolean().optional(),
});

// Shared interface for form values (compatible with both schemas)
interface UserFormValues {
  username: string;
  email: string;
  password?: string;
  first_name?: string;
  last_name?: string;
  is_staff?: boolean;
  is_active?: boolean;
}

interface UserFormProps {
  initialData?: User;
  onSubmit: (data: UserCreatePayload | UserUpdatePayload) => Promise<void>;
  isSubmitting: boolean;
}

export function UserForm({ initialData, onSubmit, isSubmitting }: UserFormProps) {
  const isEditing = !!initialData;

  const formSchema = isEditing ? updateUserSchema : createUserSchema;

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<UserFormValues>({
    resolver: zodResolver(formSchema) as never,
    defaultValues: {
      username: initialData?.username ?? "",
      email: initialData?.email ?? "",
      password: "",
      first_name: initialData?.first_name ?? "",
      last_name: initialData?.last_name ?? "",
      is_staff: initialData?.is_staff ?? false,
      ...(isEditing ? { is_active: initialData?.is_active ?? true } : {}),
    },
  });

  const currentIsStaff = watch("is_staff");
  const currentIsActive = watch("is_active");

  const onFormSubmit = (values: UserFormValues) => {
    if (isEditing) {
      const payload: Record<string, unknown> = {
        username: values.username,
        email: values.email,
        first_name: values.first_name || "",
        last_name: values.last_name || "",
        is_staff: values.is_staff,
        is_active: values.is_active,
      };
      // Solo incluir password si se ingresó una
      if (values.password && values.password.length >= 6) {
        payload.password = values.password;
      }
      onSubmit(payload as UserUpdatePayload);
    } else {
      const payload: UserCreatePayload = {
        username: values.username,
        email: values.email,
        password: values.password!,
        first_name: values.first_name || undefined,
        last_name: values.last_name || undefined,
        is_staff: values.is_staff,
      };
      onSubmit(payload);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isEditing ? "Editar usuario" : "Nuevo usuario"}</CardTitle>
        <CardDescription>
          {isEditing
            ? "Modifica los datos del usuario administrador"
            : "Completa los datos para crear un nuevo usuario"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
          {/* Username */}
          <div className="space-y-2">
            <Label htmlFor="username">
              Nombre de usuario <span className="text-destructive">*</span>
            </Label>
            <Input
              id="username"
              placeholder="Ej: operador1"
              {...register("username")}
            />
            {errors.username && (
              <p className="text-sm text-destructive">{errors.username.message}</p>
            )}
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email">
              Email <span className="text-destructive">*</span>
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="Ej: operador@ejemplo.com"
              {...register("email")}
            />
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email.message}</p>
            )}
          </div>

          {/* Password */}
          <div className="space-y-2">
            <Label htmlFor="password">
              Contraseña {!isEditing && <span className="text-destructive">*</span>}
            </Label>
            <Input
              id="password"
              type="password"
              placeholder={
                isEditing
                  ? "Dejar vacío para no cambiar"
                  : "Mínimo 6 caracteres"
              }
              {...register("password")}
            />
            {errors.password && (
              <p className="text-sm text-destructive">{errors.password.message}</p>
            )}
            {isEditing && (
              <p className="text-xs text-muted-foreground">
                Deja este campo vacío si no deseas cambiar la contraseña.
              </p>
            )}
          </div>

          {/* Nombre y Apellido en grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="first_name">Nombre</Label>
              <Input
                id="first_name"
                placeholder="Ej: Carlos"
                {...register("first_name")}
              />
              {errors.first_name && (
                <p className="text-sm text-destructive">
                  {errors.first_name.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="last_name">Apellido</Label>
              <Input
                id="last_name"
                placeholder="Ej: López"
                {...register("last_name")}
              />
              {errors.last_name && (
                <p className="text-sm text-destructive">
                  {errors.last_name.message}
                </p>
              )}
            </div>
          </div>

          {/* Checkboxes */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_staff"
                className="h-4 w-4 rounded border-gray-300"
                checked={currentIsStaff ?? false}
                onChange={(e) => setValue("is_staff", e.target.checked)}
              />
              <Label htmlFor="is_staff" className="cursor-pointer">
                ¿Puede acceder al panel de administración?
              </Label>
            </div>

            {isEditing && (
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_active"
                  className="h-4 w-4 rounded border-gray-300"
                  checked={currentIsActive ?? true}
                  onChange={(e) => setValue("is_active", e.target.checked)}
                />
                <Label htmlFor="is_active" className="cursor-pointer">
                  Usuario activo
                </Label>
              </div>
            )}
          </div>

          {/* Submit */}
          <div className="flex items-center gap-4 pt-2">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isSubmitting
                ? "Guardando..."
                : isEditing
                ? "Guardar cambios"
                : "Crear usuario"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
