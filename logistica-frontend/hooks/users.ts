import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import {
  getUsers,
  getUser,
  createUser,
  patchUser,
  updateMe,
  deleteUser,
} from "@/services/users"
import type { User, Profile } from "@/types/api"

export function useUsers() {
  return useQuery({
    queryKey: ["users"],
    queryFn: getUsers,
    staleTime: 5 * 60 * 1000,
  })
}

export function useUser(id: number) {
  return useQuery({
    queryKey: ["users", id],
    queryFn: () => getUser(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  })
}

export function useCreateUser() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Partial<User> & { password: string }) => createUser(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["users"] })
      toast.success("Usuario creado exitosamente")
    },
    onError: () => {
      toast.error("Error al crear el usuario")
    },
  })
}

export function useUpdateUser() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<User> }) =>
      patchUser(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["users"] })
      toast.success("Usuario actualizado exitosamente")
    },
    onError: () => {
      toast.error("Error al actualizar el usuario")
    },
  })
}

export function useUpdateMe() {
  return useMutation({
    mutationFn: (data: Partial<Profile>) => updateMe(data),
    onSuccess: () => {
      toast.success("Perfil actualizado exitosamente")
    },
    onError: () => {
      toast.error("Error al actualizar el perfil")
    },
  })
}

export function useDeleteUser() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => deleteUser(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["users"] })
      toast.success("Usuario eliminado exitosamente")
    },
    onError: () => {
      toast.error("Error al eliminar el usuario")
    },
  })
}
