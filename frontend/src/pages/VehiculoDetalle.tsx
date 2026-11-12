import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Eye, Wrench, ShieldCheck } from 'lucide-react'
import { ordenesApi } from '../api/ordenes'
import { vehiculosApi } from '../api/vehiculos'
import { useAuth } from '../context/AuthContext'
import OrdenDetalleModal from '../components/ordenes/OrdenDetalleModal'
import SubirFacturaButton from '../components/ordenes/SubirFacturaButton'
import VerFacturaButton from '../components/ordenes/VerFacturaButton'
import type { Orden } from '../types/orden'
import type { Vehiculo } from '../types/vehiculo'
import { formatFecha } from '../utils/formatters'

type TipoOrden = 'PREVENTIVO' | 'CORRECTIVO'

interface HistorialTablaProps {
  titulo: string
  tipo: TipoOrden
  ordenes: Orden[]
  esAdmin: boolean
  onVerDetalle: (orden: Orden) => void
  onOrdenActualizada: (orden: Orden) => void
}

function HistorialTabla({
  titulo,
  tipo,
  ordenes,
  esAdmin,
  onVerDetalle,
  onOrdenActualizada,
}: HistorialTablaProps) {
  const esPreventivo = tipo === 'PREVENTIVO'
  const Icono = esPreventivo ? ShieldCheck : Wrench

  return (
    <section className="overflow-hidden rounded-lg bg-white shadow">
      <header
        className={`flex items-center justify-between border-b px-4 py-3 ${
          esPreventivo ? 'border-slate-200 bg-slate-50' : 'border-red-100 bg-red-50'
        }`}
      >
        <h2
          className={`flex items-center gap-2 text-sm font-semibold uppercase ${
            esPreventivo ? 'text-slate-800' : 'text-red-800'
          }`}
        >
          <Icono size={16} />
          {titulo}
        </h2>
        <span className="text-xs font-medium text-gray-500">
          {ordenes.length} {ordenes.length === 1 ? 'orden' : 'órdenes'}
        </span>
      </header>

      <table className="w-full text-left text-sm">
        <thead className="bg-gray-50 text-xs uppercase text-gray-500">
          <tr>
            <th className="px-4 py-3">ID</th>
            <th className="px-4 py-3">Fecha</th>
            <th className="px-4 py-3">Km</th>
            <th className="px-4 py-3">Lugar</th>
            {!esPreventivo && <th className="px-4 py-3">Rotura</th>}
            <th className="px-4 py-3">Tareas</th>
            <th className="px-4 py-3">Acciones</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {ordenes.length === 0 && (
            <tr>
              <td colSpan={esPreventivo ? 6 : 7} className="px-4 py-6 text-center text-gray-500">
                No hay mantenimientos {esPreventivo ? 'preventivos' : 'correctivos'} registrados
                para este vehículo.
              </td>
            </tr>
          )}

          {ordenes.map((orden) => (
            <tr key={orden.id} className="hover:bg-gray-50">
              <td className="px-4 py-3 font-medium text-gray-800">#{orden.id}</td>
              <td className="px-4 py-3">{formatFecha(orden.fecha_servicio)}</td>
              <td className="px-4 py-3">
                {orden.kilometraje_servicio != null
                  ? `${orden.kilometraje_servicio.toLocaleString('es-AR')} km`
                  : '-'}
              </td>
              <td className="px-4 py-3">
                {orden.lugar_ejecucion}
                {orden.proveedor_externo && (
                  <span className="block text-xs text-gray-400">{orden.proveedor_externo}</span>
                )}
              </td>
              {!esPreventivo && (
                <td className="max-w-xs truncate px-4 py-3 text-gray-600" title={orden.detalle_rotura ?? ''}>
                  {orden.detalle_rotura ?? '-'}
                </td>
              )}
              <td className="px-4 py-3">
                {orden.tareas_realizadas.length === 0 ? (
                  <span className="text-gray-400">Sin tareas</span>
                ) : (
                  <ul className="flex flex-wrap gap-1">
                    {orden.tareas_realizadas.map((detalle) => (
                      <li
                        key={detalle.id}
                        className="rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-700"
                      >
                        {detalle.tarea?.nombre_tarea ?? `Tarea #${detalle.tarea_id}`}
                      </li>
                    ))}
                  </ul>
                )}
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => onVerDetalle(orden)}
                    className="rounded-md p-1.5 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-800"
                    aria-label="Ver detalle"
                    title="Ver detalle"
                  >
                    <Eye size={16} />
                  </button>
                  {!orden.factura_pdf_url?.trim() ? (
                    // El endpoint de subida exige rol ADMIN: no se ofrece el
                    // botón a otros roles para no mostrar una acción que da 403.
                    esAdmin && (
                      <SubirFacturaButton
                        ordenId={orden.id}
                        onUploadSuccess={onOrdenActualizada}
                      />
                    )
                  ) : (
                    <VerFacturaButton ordenId={orden.id} compact />
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  )
}

function VehiculoDetalle() {
  const { id } = useParams<{ id: string }>()
  const vehiculoId = Number(id)
  const { user } = useAuth()
  // El campo del JWT/contexto es "rol" (no "role"); el backend guarda 'ADMIN'
  // o 'LECTOR'. Se normaliza por si llegara con otro casing o espacios.
  const esAdmin = user?.rol?.trim().toUpperCase() === 'ADMIN'

  const [vehiculo, setVehiculo] = useState<Vehiculo | null>(null)
  const [ordenes, setOrdenes] = useState<Orden[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [ordenDetalle, setOrdenDetalle] = useState<Orden | null>(null)

  useEffect(() => {
    if (!Number.isInteger(vehiculoId) || vehiculoId <= 0) {
      setError('Identificador de vehículo inválido.')
      setLoading(false)
      return
    }

    const cargar = async () => {
      setLoading(true)
      setError('')
      try {
        const [vehiculoData, ordenesData] = await Promise.all([
          vehiculosApi.getById(vehiculoId),
          ordenesApi.getAll(vehiculoId),
        ])
        setVehiculo(vehiculoData)
        setOrdenes(ordenesData)
      } catch (err: any) {
        setError(
          err?.response?.status === 404
            ? 'El vehículo no existe.'
            : err?.response?.data?.detail ?? 'No se pudo cargar la ficha del vehículo.'
        )
      } finally {
        setLoading(false)
      }
    }
    cargar()
  }, [vehiculoId])

  // Más recientes primero: la ficha se lee como un historial clínico.
  const ordenarPorFecha = (lista: Orden[]) =>
    [...lista].sort((a, b) => b.fecha_servicio.localeCompare(a.fecha_servicio) || b.id - a.id)

  const preventivos = useMemo(
    () => ordenarPorFecha(ordenes.filter((o) => o.tipo_orden === 'PREVENTIVO')),
    [ordenes]
  )
  const correctivos = useMemo(
    () => ordenarPorFecha(ordenes.filter((o) => o.tipo_orden === 'CORRECTIVO')),
    [ordenes]
  )

  const ultimoPreventivo = preventivos[0]

  // Se reemplaza solo la orden que cambió con la versión que devuelve el
  // backend, evitando volver a pedir toda la ficha (sin parpadeo de carga).
  const handleOrdenActualizada = (ordenActualizada: Orden) => {
    setOrdenes((prev) =>
      prev.map((orden) => (orden.id === ordenActualizada.id ? ordenActualizada : orden))
    )
  }

  const renderKilometraje = () => {
    if (!vehiculo) return '-'
    if (vehiculo.categoria === 'SEMIS') return 'No registra km'
    if (vehiculo.kilometraje_actual == null) return 'Sin dato'
    return `${vehiculo.kilometraje_actual.toLocaleString('es-AR')} km`
  }

  return (
    <div>
      <Link
        to="/vehiculos"
        className="mb-4 inline-flex items-center gap-1 text-sm text-gray-500 transition-colors hover:text-gray-800"
      >
        <ArrowLeft size={16} />
        Volver a Vehículos
      </Link>

      {loading && <p className="text-sm text-gray-500">Cargando ficha técnica...</p>}

      {!loading && error && (
        <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {!loading && !error && vehiculo && (
        <>
          <header className="mb-6 rounded-lg bg-white p-6 shadow">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase text-gray-400">Ficha Técnica</p>
                <h1 className="text-2xl font-bold tracking-wide text-gray-900">
                  {vehiculo.patente}
                </h1>
                <p className="text-base text-gray-600">{vehiculo.marca_modelo}</p>
              </div>
              <div className="flex flex-col items-end gap-3">
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                  {vehiculo.categoria}
                </span>
              </div>
            </div>

            <dl className="mt-6 grid grid-cols-2 gap-4 text-sm md:grid-cols-5">
              <div>
                <dt className="text-xs uppercase text-gray-400">Año</dt>
                <dd className="font-medium text-gray-800">{vehiculo.anio ?? '-'}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase text-gray-400">Km actual</dt>
                <dd className="font-medium text-gray-800">{renderKilometraje()}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase text-gray-400">Vencimiento RTO</dt>
                <dd className="font-medium text-gray-800">{formatFecha(vehiculo.vencimiento_tecnica)}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase text-gray-400">Último preventivo</dt>
                <dd className="font-medium text-gray-800">
                  {ultimoPreventivo
                    ? `${formatFecha(ultimoPreventivo.fecha_servicio)}${
                        ultimoPreventivo.kilometraje_servicio != null
                          ? ` · ${ultimoPreventivo.kilometraje_servicio.toLocaleString('es-AR')} km`
                          : ''
                      }`
                    : '-'}
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase text-gray-400">Total órdenes</dt>
                <dd className="font-medium text-gray-800">
                  {ordenes.length}{' '}
                  <span className="font-normal text-gray-400">
                    ({preventivos.length} prev. / {correctivos.length} corr.)
                  </span>
                </dd>
              </div>
            </dl>
          </header>

          <div className="flex flex-col gap-6">
            <HistorialTabla
              titulo="Mantenimientos Preventivos"
              tipo="PREVENTIVO"
              ordenes={preventivos}
              esAdmin={esAdmin}
              onVerDetalle={setOrdenDetalle}
              onOrdenActualizada={handleOrdenActualizada}
            />
            <HistorialTabla
              titulo="Mantenimientos Correctivos"
              tipo="CORRECTIVO"
              ordenes={correctivos}
              esAdmin={esAdmin}
              onVerDetalle={setOrdenDetalle}
              onOrdenActualizada={handleOrdenActualizada}
            />
          </div>
        </>
      )}

      {ordenDetalle && vehiculo && (
        <OrdenDetalleModal
          orden={ordenDetalle}
          vehiculo={vehiculo}
          onClose={() => setOrdenDetalle(null)}
        />
      )}
    </div>
  )
}

export default VehiculoDetalle
