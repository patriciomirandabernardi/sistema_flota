import apiClient from './client'
import type { Orden, OrdenFormData } from '../types/orden'

export const ordenesApi = {
  getAll: async (vehiculoId?: number): Promise<Orden[]> => {
    const response = await apiClient.get<Orden[]>('/ordenes/', {
      params: vehiculoId ? { vehiculo_id: vehiculoId } : undefined,
    })
    return response.data
  },

  create: async (data: OrdenFormData): Promise<Orden> => {
    const response = await apiClient.post<Orden>('/ordenes/', data)
    return response.data
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/ordenes/${id}`)
  },

  getFacturaBlob: async (id: number): Promise<Blob> => {
    // El endpoint exige token, por eso se pide con apiClient (que ya inyecta
    // el header Authorization) en vez de abrir la URL directo en el navegador.
    const response = await apiClient.get<Blob>(`/ordenes/${id}/factura/pdf`, {
      responseType: 'blob',
    })
    return response.data
  },

  uploadFactura: async (id: number, file: File): Promise<Orden> => {
    const formData = new FormData()
    formData.append('file', file)
    // No se fija Content-Type a mano: el navegador debe generar el
    // multipart/form-data con su boundary correspondiente.
    const response = await apiClient.post<Orden>(`/ordenes/${id}/factura`, formData)
    return response.data
  },
}
