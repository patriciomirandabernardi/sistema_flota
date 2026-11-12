import { useEffect, useState } from 'react'
import { AlertTriangle, CheckCircle2, ClipboardList, Gauge, Printer, Truck } from 'lucide-react'
import { differenceInCalendarDays, parseISO } from 'date-fns'
import { dashboardApi } from '../api/dashboard'
import { useAuth } from '../context/AuthContext'
import type { AlertaPreventiva, DashboardStats } from '../types/dashboard'
import { formatFecha } from '../utils/formatters'

function badgeEstado(estado: AlertaPreventiva['estado']) {
  if (estado === 'VENCIDO') {
    return 'bg-red-100 text-red-800'
  }
  return 'bg-amber-100 text-amber-800'
}

function Dashboard() {
  const { user } = useAuth()
  const esAdmin = user?.rol === 'ADMIN'

  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const cargarStats = async () => {
      setLoading(true)
      try {
        const data = await dashboardApi.getStats()
        setStats(data)
      } finally {
        setLoading(false)
      }
    }
    cargarStats()
  }, [])

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-800">Dashboard</h1>
        {esAdmin && (
          <a
            href="/Parte_Taller_IMCAYPER.pdf"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-800"
          >
            <Printer size={16} />
            Imprimir Parte en Blanco
          </a>
        )}
      </div>

      {loading && <p className="text-gray-500">Cargando estadísticas...</p>}

      {!loading && stats && (
        <>
          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex items-center gap-4 rounded-lg bg-white p-5 shadow">
              <div className="rounded-full bg-slate-100 p-3 text-slate-700">
                <Truck size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total de Vehículos</p>
                <p className="text-2xl font-semibold text-gray-800">
                  {stats.total_vehiculos}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 rounded-lg bg-white p-5 shadow">
              <div className="rounded-full bg-slate-100 p-3 text-slate-700">
                <ClipboardList size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-500">Órdenes del Mes</p>
                <p className="text-2xl font-semibold text-gray-800">
                  {stats.ordenes_mes}
                </p>
              </div>
            </div>
          </div>

          {stats.alertas_tecnica.length === 0 ? (
            <div className="flex items-center gap-3 rounded-lg border border-green-200 bg-green-50 p-4 text-green-800">
              <CheckCircle2 size={20} />
              <p className="text-sm font-medium">Toda la flota está al día con la técnica.</p>
            </div>
          ) : (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4">
              <div className="mb-3 flex items-center gap-2 text-red-800">
                <AlertTriangle size={20} />
                <h2 className="text-sm font-semibold">
                  Alertas de Verificación Técnica (RTO)
                </h2>
              </div>
              <ul className="divide-y divide-red-200">
                {stats.alertas_tecnica.map((alerta) => {
                  const fecha = parseISO(alerta.vencimiento_tecnica)
                  const diasRestantes = differenceInCalendarDays(fecha, new Date())
                  const vencida = diasRestantes < 0

                  return (
                    <li
                      key={alerta.id}
                      className="flex items-center justify-between py-2 text-sm"
                    >
                      <span className="font-medium text-gray-800">{alerta.patente}</span>
                      <span className={vencida ? 'text-red-700' : 'text-orange-600'}>
                        {vencida
                          ? `Vencida el ${formatFecha(alerta.vencimiento_tecnica)}`
                          : `Vence el ${formatFecha(alerta.vencimiento_tecnica)} (en ${diasRestantes} días)`}
                      </span>
                    </li>
                  )
                })}
              </ul>
            </div>
          )}

          <div className="mt-6 rounded-lg bg-white p-4 shadow">
            <div className="mb-3 flex items-center gap-2 text-gray-800">
              <Gauge size={20} />
              <h2 className="text-sm font-semibold">
                Alertas Preventivas — Próximos Servicios
              </h2>
            </div>

            {stats.alertas_preventivas.length === 0 ? (
              <p className="flex items-center gap-2 text-sm text-green-700">
                <CheckCircle2 size={16} />
                No hay mantenimientos preventivos vencidos ni próximos a vencer.
              </p>
            ) : (
              <ul className="divide-y divide-gray-100">
                {stats.alertas_preventivas.map((alerta, index) => (
                  <li
                    key={`${alerta.vehiculo_id}-${alerta.tarea_id}-${alerta.criterio}-${index}`}
                    className="flex items-center justify-between py-2 text-sm"
                  >
                    <div>
                      <span className="font-medium text-gray-800">{alerta.patente}</span>
                      <span className="text-gray-500"> — {alerta.nombre_tarea}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500">{alerta.detalle}</span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-semibold ${badgeEstado(alerta.estado)}`}
                      >
                        {alerta.estado === 'VENCIDO' ? 'Vencido' : 'Próximo'}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </div>
  )
}

export default Dashboard
