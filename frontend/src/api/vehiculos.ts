import apiClient from './client'
import type { Vehiculo, VehiculoFormData } from '../types/vehiculo'

export const vehiculosApi = {
  getAll: async (): Promise<Vehiculo[]> => {
    const response = await apiClient.get<Vehiculo[]>('/vehiculos/')
    return response.data
  },

  getById: async (id: number): Promise<Vehiculo> => {
    const response = await apiClient.get<Vehiculo>(`/vehiculos/${id}`)
    return response.data
  },

  create: async (data: VehiculoFormData): Promise<Vehiculo> => {
    const response = await apiClient.post<Vehiculo>('/vehiculos/', data)
    return response.data
  },

  update: async (id: number, data: VehiculoFormData): Promise<Vehiculo> => {
    const response = await apiClient.patch<Vehiculo>(`/vehiculos/${id}`, data)
    return response.data
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/vehiculos/${id}`)
  },

  updateKilometraje: async (id: number, kilometraje_actual: number): Promise<Vehiculo> => {
    const response = await apiClient.patch<Vehiculo>(`/vehiculos/${id}/kilometraje`, {
      kilometraje_actual,
    })
    return response.data
  },
}
