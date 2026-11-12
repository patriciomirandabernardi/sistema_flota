export interface Sistema {
  id: number
  nombre: string
}

export interface SistemaFormData {
  nombre: string
}

export interface Tarea {
  id: number
  nombre_tarea: string
  categoria_vehiculo: string
  sistema_id: number
  tipo: string
  frecuencia_dias: number | null
  frecuencia_km: number | null
  frecuencia_viaje: boolean
  sistema?: Sistema | null
}

export interface TareaFormData {
  nombre_tarea: string
  categoria_vehiculo: string
  sistema_id: number
  tipo: string
  frecuencia_dias?: number | null
  frecuencia_km?: number | null
  frecuencia_viaje: boolean
}

export interface TareaFiltros {
  categoria_vehiculo?: string
  tipo?: string
}
