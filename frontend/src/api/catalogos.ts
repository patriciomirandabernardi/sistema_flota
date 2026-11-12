import apiClient from './client'
import type {
  Sistema,
  SistemaFormData,
  Tarea,
  TareaFiltros,
  TareaFormData,
} from '../types/catalogo'

export const catalogosApi = {
  getSistemas: async (): Promise<Sistema[]> => {
    const response = await apiClient.get<Sistema[]>('/catalogos/sistemas')
    return response.data
  },

  createSistema: async (data: SistemaFormData): Promise<Sistema> => {
    const response = await apiClient.post<Sistema>('/catalogos/sistemas', data)
    return response.data
  },

  getTareas: async (filtros?: TareaFiltros): Promise<Tarea[]> => {
    const response = await apiClient.get<Tarea[]>('/catalogos/tareas', {
      params: filtros,
    })
    return response.data
  },

  createTarea: async (data: TareaFormData): Promise<Tarea> => {
    const response = await apiClient.post<Tarea>('/catalogos/tareas', data)
    return response.data
  },

  updateTarea: async (id: number, data: TareaFormData): Promise<Tarea> => {
    const response = await apiClient.put<Tarea>(`/catalogos/tareas/${id}`, data)
    return response.data
  },

  deleteSistema: async (id: number): Promise<void> => {
    await apiClient.delete(`/catalogos/sistemas/${id}`)
  },

  deleteTarea: async (id: number): Promise<void> => {
    await apiClient.delete(`/catalogos/tareas/${id}`)
  },
}
