import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { createRow, deleteRow, listTable, updateRow } from '../services/f1Api'

export function useCrudEntity<T extends Record<string, unknown>>(table: Parameters<typeof listTable>[0], orderBy = 'created_at') {
  const queryClient = useQueryClient()
  const key = ['table', table, orderBy]

  const query = useQuery({
    queryKey: key,
    queryFn: () => listTable<T>(table, orderBy),
  })

  const createMutation = useMutation({
    mutationFn: (payload: T) => createRow(table, payload),
    onSuccess: () => {
      toast.success('Created successfully')
      queryClient.invalidateQueries({ queryKey: key })
    },
    onError: (error: Error) => toast.error(error.message),
  })

  const updateMutation = useMutation({
    mutationFn: ({
      keyField = 'id',
      keyValue,
      payload,
    }: {
      keyField?: string
      keyValue: string | number
      payload: Partial<T>
    }) => updateRow(table, keyField, keyValue, payload),
    onSuccess: () => {
      toast.success('Updated successfully')
      queryClient.invalidateQueries({ queryKey: key })
    },
    onError: (error: Error) => toast.error(error.message),
  })

  const deleteMutation = useMutation({
    mutationFn: ({ keyField = 'id', keyValue }: { keyField?: string; keyValue: string | number }) =>
      deleteRow(table, keyField, keyValue),
    onSuccess: () => {
      toast.success('Deleted successfully')
      queryClient.invalidateQueries({ queryKey: key })
    },
    onError: (error: Error) => toast.error(error.message),
  })

  return { query, createMutation, updateMutation, deleteMutation }
}
