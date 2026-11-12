import type { Tarea } from './catalogo'

export interface DetalleOrden {
  id: number
  tarea_id: number
  tarea?: Tarea | null
}

export interface Orden {
  id: number
  fecha_servicio: string
  kilometraje_servicio: number | null
  tipo_orden: string
  detalle_rotura: string | null
  observaciones: string | null
  lugar_ejecucion: string
  proveedor_externo: string | null
  chofer: string | null
  vehiculo_id: number
  semi_enganchado_id: number | null
  factura_pdf_url: string | null
  tareas_realizadas: DetalleOrden[]
}

export interface OrdenFormData {
  fecha_servicio: string
  kilometraje_servicio?: number | null
  tipo_orden: string
  detalle_rotura?: string | null
  observaciones?: string | null
  lugar_ejecucion: string
  proveedor_externo?: string | null
  chofer?: string | null
  vehiculo_id: number
  semi_enganchado_id?: number | null
  tarea_ids: number[]
}
