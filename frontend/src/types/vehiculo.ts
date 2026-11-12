export interface Vehiculo {
  id: number
  patente: string
  marca_modelo: string
  anio: number | null
  categoria: string
  kilometraje_actual: number | null
  vencimiento_tecnica: string | null
}

export interface VehiculoFormData {
  patente: string
  marca_modelo: string
  anio?: number | null
  categoria: string
  kilometraje_actual?: number | null
  vencimiento_tecnica?: string | null
}
