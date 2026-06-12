import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { getGroups, getGroup, createGroup, updateGroup, deleteGroup } from "@/services/groups"
import type { Group } from "@/types/api"

export function useGroups() {
  return useQuery({
    queryKey: ["groups"],
    queryFn: getGroups,
    staleTime: 5 * 60 * 1000,
  })
}

export function useGroup(id: number) {
  return useQuery({
    queryKey: ["groups", id],
    queryFn: () => getGroup(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  })
}

export function useCreateGroup() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Partial<Group>) => createGroup(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["groups"] })
      toast.success("Rol creado exitosamente")
    },
    onError: () => {
      toast.error("Error al crear el rol")
    },
  })
}

export function useUpdateGroup() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Group> }) =>
      updateGroup(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["groups"] })
      toast.success("Rol actualizado exitosamente")
    },
    onError: () => {
      toast.error("Error al actualizar el rol")
    },
  })
}

export function useDeleteGroup() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => deleteGroup(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["groups"] })
      toast.success("Rol eliminado exitosamente")
    },
    onError: () => {
      toast.error("Error al eliminar el rol")
    },
  })
}
