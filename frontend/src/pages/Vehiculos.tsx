import { useEffect, useMemo, useState, type MouseEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Gauge, History, Pencil, Plus, Trash2 } from 'lucide-react'
import { vehiculosApi } from '../api/vehiculos'
import { useAuth } from '../context/AuthContext'
import ActualizarKmModal from '../components/vehiculos/ActualizarKmModal'
import VehiculoModal from '../components/vehiculos/VehiculoModal'
import type { Vehiculo, VehiculoFormData } from '../types/vehiculo'
import { formatFecha } from '../utils/formatters'

const CATEGORIAS = ['CAMIONES', 'SEMIS', 'UTILITARIOS']

function Vehiculos() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [vehiculos, setVehiculos] = useState<Vehiculo[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [vehiculoEditando, setVehiculoEditando] = useState<Vehiculo | null>(null)
  const [vehiculoKm, setVehiculoKm] = useState<Vehiculo | null>(null)
  const [categoriaFiltro, setCategoriaFiltro] = useState('')

  const irAHistorial = (vehiculo: Vehiculo) => navigate(`/vehiculos/${vehiculo.id}`)

  const esAdmin = user?.rol === 'ADMIN'

  const cargarVehiculos = async () => {
    setLoading(true)
    try {
      const data = await vehiculosApi.getAll()
      setVehiculos(data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    cargarVehiculos()
  }, [])

  const handleNuevo = () => {
    setVehiculoEditando(null)
    setModalOpen(true)
  }

  const handleEditar = (vehiculo: Vehiculo) => {
    setVehiculoEditando(vehiculo)
    setModalOpen(true)
  }

  const handleGuardar = async (data: VehiculoFormData) => {
    if (vehiculoEditando) {
      await vehiculosApi.update(vehiculoEditando.id, data)
    } else {
      await vehiculosApi.create(data)
    }
    setModalOpen(false)
    await cargarVehiculos()
  }

  const handleEliminar = async (event: MouseEvent, vehiculo: Vehiculo) => {
    event.stopPropagation()
    const confirmado = window.confirm(
      `¿Estás seguro de que deseas eliminar el vehículo ${vehiculo.patente}?`
    )
    if (!confirmado) return

    try {
      await vehiculosApi.delete(vehiculo.id)
      await cargarVehiculos()
    } catch (err: any) {
      window.alert(
        err?.response?.data?.detail ?? 'No se pudo eliminar el vehículo.'
      )
    }
  }

  const handleGuardarKm = async (kilometrajeActual: number) => {
    if (!vehiculoKm) return
    await vehiculosApi.updateKilometraje(vehiculoKm.id, kilometrajeActual)
    setVehiculoKm(null)
    await cargarVehiculos()
  }

  const renderKilometraje = (vehiculo: Vehiculo) => {
    // Regla de negocio: los SEMIS no tienen motor propio, por lo que nunca
    // registran kilometraje (el dato no aplica, no es que falte cargarlo).
    if (vehiculo.categoria === 'SEMIS') {
      return <span className="text-xs font-semibold text-gray-400">NO REGISTRA KM</span>
    }
    if (vehiculo.kilometraje_actual == null) {
      return <span className="text-xs font-semibold text-gray-400">SIN DATO</span>
    }
    return <span>{vehiculo.kilometraje_actual.toLocaleString('es-AR')} km</span>
  }

  const vehiculosFiltrados = useMemo(() => {
    if (!categoriaFiltro) return vehiculos
    return vehiculos.filter((vehiculo) => vehiculo.categoria === categoriaFiltro)
  }, [vehiculos, categoriaFiltro])

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-800">Vehículos</h1>
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

          {esAdmin && (
            <button
              type="button"
              onClick={handleNuevo}
              className="flex items-center gap-2 rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-800"
            >
              <Plus size={16} />
              Nuevo Vehículo
            </button>
          )}
        </div>
      </div>

      <div className="overflow-hidden rounded-lg bg-white shadow">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-xs uppercase text-gray-500">
            <tr>
              <th className="px-4 py-3">Patente</th>
              <th className="px-4 py-3">Marca / Modelo</th>
              <th className="px-4 py-3">Categoría</th>
              <th className="px-4 py-3">Año</th>
              <th className="px-4 py-3">Km</th>
              <th className="px-4 py-3">Vencimiento RTO</th>
              <th className="px-4 py-3">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading && (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-gray-500">
                  Cargando...
                </td>
              </tr>
            )}

            {!loading && vehiculosFiltrados.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-gray-500">
                  {categoriaFiltro
                    ? 'No hay vehículos en esta categoría'
                    : 'No hay vehículos registrados'}
                </td>
              </tr>
            )}

            {!loading &&
              vehiculosFiltrados.map((vehiculo) => (
                <tr
                  key={vehiculo.id}
                  onClick={() => irAHistorial(vehiculo)}
                  className="cursor-pointer hover:bg-gray-50"
                  title="Ver historial del vehículo"
                >
                  <td className="px-4 py-3 font-medium text-gray-800">
                    {vehiculo.patente}
                  </td>
                  <td className="px-4 py-3">{vehiculo.marca_modelo}</td>
                  <td className="px-4 py-3">{vehiculo.categoria}</td>
                  <td className="px-4 py-3">{vehiculo.anio ?? '-'}</td>
                  <td className="px-4 py-3">{renderKilometraje(vehiculo)}</td>
                  <td className="px-4 py-3">
                    {formatFecha(vehiculo.vencimiento_tecnica)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation()
                          irAHistorial(vehiculo)
                        }}
                        className="flex items-center gap-1 rounded-md border border-gray-300 px-2 py-1 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-100"
                        title="Ver historial"
                      >
                        <History size={14} />
                        Ver Historial
                      </button>
                      {esAdmin && (
                        <>
                        {vehiculo.categoria !== 'SEMIS' && (
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation()
                              setVehiculoKm(vehiculo)
                            }}
                            className="rounded-md p-1.5 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-800"
                            aria-label="Actualizar kilometraje"
                            title="Actualizar kilometraje"
                          >
                            <Gauge size={16} />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation()
                            handleEditar(vehiculo)
                          }}
                          className="rounded-md p-1.5 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-800"
                          aria-label="Editar"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={(event) => handleEliminar(event, vehiculo)}
                          className="rounded-md p-1.5 text-red-500 transition-colors hover:bg-red-50 hover:text-red-700"
                          aria-label="Eliminar"
                        >
                          <Trash2 size={16} />
                        </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {modalOpen && (
        <VehiculoModal
          vehiculo={vehiculoEditando}
          onClose={() => setModalOpen(false)}
          onSave={handleGuardar}
        />
      )}

      {vehiculoKm && (
        <ActualizarKmModal
          vehiculo={vehiculoKm}
          onClose={() => setVehiculoKm(null)}
          onSave={handleGuardarKm}
        />
      )}
    </div>
  )
}

export default Vehiculos
