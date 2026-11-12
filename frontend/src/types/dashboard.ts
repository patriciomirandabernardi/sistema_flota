export interface AlertaTecnica {
  id: number
  patente: string
  vencimiento_tecnica: string
}

export interface AlertaPreventiva {
  vehiculo_id: number
  patente: string
  tarea_id: number
  nombre_tarea: string
  criterio: 'KM' | 'DIAS'
  estado: 'VENCIDO' | 'PROXIMO'
  detalle: string
}

export interface DashboardStats {
  total_vehiculos: number
  ordenes_mes: number
  alertas_tecnica: AlertaTecnica[]
  alertas_preventivas: AlertaPreventiva[]
}
