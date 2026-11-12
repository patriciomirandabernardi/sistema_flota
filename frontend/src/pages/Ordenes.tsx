import { useEffect, useMemo, useState } from 'react'
import { Eye, Plus, Printer, Trash2 } from 'lucide-react'
import { catalogosApi } from '../api/catalogos'
import { ordenesApi } from '../api/ordenes'
import { vehiculosApi } from '../api/vehiculos'
import { useAuth } from '../context/AuthContext'
import OrdenDetalleModal from '../components/ordenes/OrdenDetalleModal'
import OrdenModal from '../components/ordenes/OrdenModal'
import type { Tarea } from '../types/catalogo'
import type { Orden, OrdenFormData } from '../types/orden'
import type { Vehiculo } from '../types/vehiculo'
import { formatFecha, formatFechaHoy } from '../utils/formatters'

const CATEGORIAS = ['CAMIONES', 'SEMIS', 'UTILITARIOS']

function Ordenes() {
  const { user } = useAuth()
  const esAdmin = user?.rol === 'ADMIN'

  const [ordenes, setOrdenes] = useState<Orden[]>([])
  const [vehiculos, setVehiculos] = useState<Vehiculo[]>([])
  const [tareas, setTareas] = useState<Tarea[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [ordenDetalle, setOrdenDetalle] = useState<Orden | null>(null)
  const [categoriaFiltro, setCategoriaFiltro] = useState('')

  const cargarDatos = async () => {
    setLoading(true)
    try {
      const [ordenesData, vehiculosData, tareasData] = await Promise.all([
        ordenesApi.getAll(),
        vehiculosApi.getAll(),
        catalogosApi.getTareas(),
      ])
      setOrdenes(ordenesData)
      setVehiculos(vehiculosData)
      setTareas(tareasData)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    cargarDatos()
  }, [])

  const handleNuevaOrden = () => {
    setModalOpen(true)
  }

  const handleVerDetalle = (orden: Orden) => {
    setOrdenDetalle(orden)
  }

  const handleGuardarOrden = async (data: OrdenFormData, factura: File | null) => {
    // Paso 1: crear la orden. Recién con el ID que devuelve el backend se
    // puede subir la factura, que se guarda asociada a esa orden.
    const ordenCreada = await ordenesApi.create(data)

    // Paso 2 (opcional): si el usuario adjuntó un PDF, se envía como
    // multipart/form-data al endpoint de facturas de la orden recién creada.
    if (factura) {
      await ordenesApi.uploadFactura(ordenCreada.id, factura)
    }

    setModalOpen(false)
    await cargarDatos()
  }

  const handleEliminar = async (orden: Orden) => {
    const confirmado = window.confirm(
      `¿Estás seguro de que deseas eliminar la orden #${orden.id}?`
    )
    if (!confirmado) return

    try {
      await ordenesApi.delete(orden.id)
      await cargarDatos()
    } catch (err: any) {
      window.alert(err?.response?.data?.detail ?? 'No se pudo eliminar la orden.')
    }
  }

  const obtenerPatente = (vehiculoId: number) => {
    const vehiculo = vehiculos.find((v) => v.id === vehiculoId)
    return vehiculo ? `${vehiculo.patente} - ${vehiculo.marca_modelo}` : `#${vehiculoId}`
  }

  const ordenesFiltradas = useMemo(() => {
    if (!categoriaFiltro) return ordenes
    return ordenes.filter((orden) => {
      const vehiculo = vehiculos.find((v) => v.id === orden.vehiculo_id)
      return vehiculo?.categoria === categoriaFiltro
    })
  }, [ordenes, vehiculos, categoriaFiltro])

  const handleExportarPdf = () => {
    window.print()
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between print:hidden">
        <h1 className="text-xl font-semibold text-gray-800">Órdenes de Mantenimiento</h1>
        <div className="flex items-center gap-3">
          <select
            value={categoriaFiltro}
            onChange={(event) => setCategoriaFiltro(event.target.value)}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-500"
          >
            <option value="">Todas las categorías</option>
            {CATEGORIAS.map((categoria) => (
              <option key={categoria} value={categoria}>
                {categoria}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={handleExportarPdf}
            className="flex items-center gap-2 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
          >
            <Printer size={16} />
            Exportar a PDF
          </button>

          {esAdmin && (
            <button
              type="button"
              onClick={handleNuevaOrden}
              className="flex items-center gap-2 rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-800"
            >
              <Plus size={16} />
              Nueva Orden de Mantenimiento
            </button>
          )}
        </div>
      </div>

      {/* Encabezado exclusivo para el reporte impreso/PDF */}
      <div className="mb-4 hidden print:block">
        <h1 className="text-xl font-semibold text-gray-900">
          Reporte de Órdenes de Mantenimiento — Sistema de Flota Imcayper S.A.
        </h1>
        <p className="text-sm text-gray-600">
          Categoría: {categoriaFiltro || 'Todas'} · Generado el{' '}
          {formatFechaHoy()}
        </p>
      </div>

      <div className="overflow-hidden rounded-lg bg-white shadow print:shadow-none">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-xs uppercase text-gray-500 print:bg-white">
            <tr>
              <th className="px-4 py-3">ID</th>
              <th className="px-4 py-3">Fecha</th>
              <th className="px-4 py-3">Vehículo</th>
              <th className="px-4 py-3">Tipo</th>
              <th className="px-4 py-3">Lugar</th>
              <th className="px-4 py-3">Tareas</th>
              <th className="px-4 py-3 print:hidden">Detalle</th>
              {esAdmin && <th className="px-4 py-3 print:hidden">Eliminar</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading && (
              <tr>
                <td colSpan={esAdmin ? 8 : 7} className="px-4 py-6 text-center text-gray-500">
                  Cargando...
                </td>
              </tr>
            )}

            {!loading && ordenesFiltradas.length === 0 && (
              <tr>
                <td colSpan={esAdmin ? 8 : 7} className="px-4 py-6 text-center text-gray-500">
                  No hay órdenes registradas
                </td>
              </tr>
            )}

            {!loading &&
              ordenesFiltradas.map((orden) => (
                <tr key={orden.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-800">{orden.id}</td>
                  <td className="px-4 py-3">{formatFecha(orden.fecha_servicio)}</td>
                  <td className="px-4 py-3">{obtenerPatente(orden.vehiculo_id)}</td>
                  <td className="px-4 py-3">{orden.tipo_orden}</td>
                  <td className="px-4 py-3">{orden.lugar_ejecucion}</td>
                  <td className="px-4 py-3">{orden.tareas_realizadas.length}</td>
                  <td className="px-4 py-3 print:hidden">
                    <button
                      type="button"
                      onClick={() => handleVerDetalle(orden)}
                      className="rounded-md p-1.5 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-800"
                      aria-label="Ver detalle"
                    >
                      <Eye size={16} />
                    </button>
                  </td>
                  {esAdmin && (
                    <td className="px-4 py-3 print:hidden">
                      <button
                        type="button"
                        onClick={() => handleEliminar(orden)}
                        className="rounded-md p-1.5 text-red-500 transition-colors hover:bg-red-50 hover:text-red-700"
                        aria-label="Eliminar"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {modalOpen && (
        <OrdenModal
          vehiculos={vehiculos}
          tareas={tareas}
          onClose={() => setModalOpen(false)}
          onSave={handleGuardarOrden}
        />
      )}

      {ordenDetalle && (
        <OrdenDetalleModal
          orden={ordenDetalle}
          vehiculo={vehiculos.find((v) => v.id === ordenDetalle.vehiculo_id)}
          onClose={() => setOrdenDetalle(null)}
        />
      )}
    </div>
  )
}

export default Ordenes
