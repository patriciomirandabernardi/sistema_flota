import { useEffect, useState } from 'react'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { catalogosApi } from '../api/catalogos'
import { useAuth } from '../context/AuthContext'
import SistemaModal from '../components/catalogos/SistemaModal'
import TareaModal from '../components/catalogos/TareaModal'
import type {
  Sistema,
  SistemaFormData,
  Tarea,
  TareaFormData,
} from '../types/catalogo'

function Catalogo() {
  const { user } = useAuth()
  const esAdmin = user?.rol === 'ADMIN'

  const [sistemas, setSistemas] = useState<Sistema[]>([])
  const [tareas, setTareas] = useState<Tarea[]>([])
  const [loading, setLoading] = useState(true)

  const [sistemaModalOpen, setSistemaModalOpen] = useState(false)
  const [tareaModalOpen, setTareaModalOpen] = useState(false)
  const [tareaEditando, setTareaEditando] = useState<Tarea | null>(null)

  const cargarDatos = async () => {
    setLoading(true)
    try {
      const [sistemasData, tareasData] = await Promise.all([
        catalogosApi.getSistemas(),
        catalogosApi.getTareas(),
      ])
      setSistemas(sistemasData)
      setTareas(tareasData)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    cargarDatos()
  }, [])

  const handleGuardarSistema = async (data: SistemaFormData) => {
    await catalogosApi.createSistema(data)
    setSistemaModalOpen(false)
    await cargarDatos()
  }

  const handleNuevaTarea = () => {
    setTareaEditando(null)
    setTareaModalOpen(true)
  }

  const handleEditarTarea = (tarea: Tarea) => {
    setTareaEditando(tarea)
    setTareaModalOpen(true)
  }

  const handleGuardarTarea = async (data: TareaFormData) => {
    if (tareaEditando) {
      await catalogosApi.updateTarea(tareaEditando.id, data)
    } else {
      await catalogosApi.createTarea(data)
    }
    setTareaModalOpen(false)
    setTareaEditando(null)
    await cargarDatos()
  }

  const handleEliminarSistema = async (sistema: Sistema) => {
    const confirmado = window.confirm(
      `¿Estás seguro de que deseas eliminar el sistema "${sistema.nombre}"?`
    )
    if (!confirmado) return

    try {
      await catalogosApi.deleteSistema(sistema.id)
      await cargarDatos()
    } catch (err: any) {
      window.alert(err?.response?.data?.detail ?? 'No se pudo eliminar el sistema.')
    }
  }

  const handleEliminarTarea = async (tarea: Tarea) => {
    const confirmado = window.confirm(
      `¿Estás seguro de que deseas eliminar la tarea "${tarea.nombre_tarea}"?`
    )
    if (!confirmado) return

    try {
      await catalogosApi.deleteTarea(tarea.id)
      await cargarDatos()
    } catch (err: any) {
      window.alert(err?.response?.data?.detail ?? 'No se pudo eliminar la tarea.')
    }
  }

  return (
    <div>
      <h1 className="mb-4 text-xl font-semibold text-gray-800">Catálogos</h1>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-base font-semibold text-gray-700">
              Sistemas de Vehículos
            </h2>
            {esAdmin && (
              <button
                type="button"
                onClick={() => setSistemaModalOpen(true)}
                className="flex items-center gap-2 rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-slate-800"
              >
                <Plus size={14} />
                Nuevo
              </button>
            )}
          </div>

          <div className="overflow-hidden rounded-lg bg-white shadow">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                <tr>
                  <th className="px-4 py-3">Nombre</th>
                  {esAdmin && <th className="px-4 py-3">Eliminar</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading && (
                  <tr>
                    <td colSpan={esAdmin ? 2 : 1} className="px-4 py-6 text-center text-gray-500">
                      Cargando...
                    </td>
                  </tr>
                )}
                {!loading && sistemas.length === 0 && (
                  <tr>
                    <td colSpan={esAdmin ? 2 : 1} className="px-4 py-6 text-center text-gray-500">
                      Sin sistemas registrados
                    </td>
                  </tr>
                )}
                {!loading &&
                  sistemas.map((sistema) => (
                    <tr key={sistema.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-800">
                        {sistema.nombre}
                      </td>
                      {esAdmin && (
                        <td className="px-4 py-3">
                          <button
                            type="button"
                            onClick={() => handleEliminarSistema(sistema)}
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
        </div>

        <div className="lg:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-base font-semibold text-gray-700">
              Catálogo de Tareas
            </h2>
            {esAdmin && (
              <button
                type="button"
                onClick={handleNuevaTarea}
                className="flex items-center gap-2 rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-slate-800"
              >
                <Plus size={14} />
                Nueva Tarea
              </button>
            )}
          </div>

          <div className="overflow-hidden rounded-lg bg-white shadow">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                <tr>
                  <th className="px-4 py-3">Tarea</th>
                  <th className="px-4 py-3">Categoría</th>
                  <th className="px-4 py-3">Sistema</th>
                  <th className="px-4 py-3">Tipo</th>
                  <th className="px-4 py-3">Frecuencia (días)</th>
                  <th className="px-4 py-3">Frecuencia (KM)</th>
                  <th className="px-4 py-3">Post-Viaje</th>
                  {esAdmin && <th className="px-4 py-3">Acciones</th>}
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
                {!loading && tareas.length === 0 && (
                  <tr>
                    <td colSpan={esAdmin ? 8 : 7} className="px-4 py-6 text-center text-gray-500">
                      Sin tareas registradas
                    </td>
                  </tr>
                )}
                {!loading &&
                  tareas.map((tarea) => (
                    <tr key={tarea.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-800">
                        {tarea.nombre_tarea}
                      </td>
                      <td className="px-4 py-3">{tarea.categoria_vehiculo}</td>
                      <td className="px-4 py-3">{tarea.sistema?.nombre ?? '-'}</td>
                      <td className="px-4 py-3">{tarea.tipo}</td>
                      <td className="px-4 py-3">{tarea.frecuencia_dias ?? '-'}</td>
                      <td className="px-4 py-3">
                        {tarea.frecuencia_km != null
                          ? `${tarea.frecuencia_km.toLocaleString('es-AR')} km`
                          : '-'}
                      </td>
                      <td className="px-4 py-3">
                        {tarea.frecuencia_viaje ? 'Sí' : 'No'}
                      </td>
                      {esAdmin && (
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleEditarTarea(tarea)}
                              className="rounded-md p-1.5 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-800"
                              aria-label="Editar"
                            >
                              <Pencil size={16} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleEliminarTarea(tarea)}
                              className="rounded-md p-1.5 text-red-500 transition-colors hover:bg-red-50 hover:text-red-700"
                              aria-label="Eliminar"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {sistemaModalOpen && (
        <SistemaModal
          onClose={() => setSistemaModalOpen(false)}
          onSave={handleGuardarSistema}
        />
      )}

      {tareaModalOpen && (
        <TareaModal
          sistemas={sistemas}
          tarea={tareaEditando}
          onClose={() => {
            setTareaModalOpen(false)
            setTareaEditando(null)
          }}
          onSave={handleGuardarTarea}
        />
      )}
    </div>
  )
}

export default Catalogo
