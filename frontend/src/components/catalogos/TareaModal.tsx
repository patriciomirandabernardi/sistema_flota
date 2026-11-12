import { useEffect, useState, type FormEvent } from 'react'
import { X } from 'lucide-react'
import type { Sistema, Tarea, TareaFormData } from '../../types/catalogo'

interface TareaModalProps {
  sistemas: Sistema[]
  tarea?: Tarea | null
  onClose: () => void
  onSave: (data: TareaFormData) => Promise<void>
}

const CATEGORIAS = ['CAMIONES', 'SEMIS', 'UTILITARIOS']
const TIPOS = ['PREVENTIVO', 'CORRECTIVO']

const emptyForm = (sistemas: Sistema[]): TareaFormData => ({
  nombre_tarea: '',
  categoria_vehiculo: CATEGORIAS[0],
  sistema_id: sistemas[0]?.id ?? 0,
  tipo: TIPOS[0],
  frecuencia_dias: null,
  frecuencia_km: null,
  frecuencia_viaje: false,
})

function TareaModal({ sistemas, tarea, onClose, onSave }: TareaModalProps) {
  const [formData, setFormData] = useState<TareaFormData>(emptyForm(sistemas))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (tarea) {
      setFormData({
        nombre_tarea: tarea.nombre_tarea,
        categoria_vehiculo: tarea.categoria_vehiculo,
        sistema_id: tarea.sistema_id,
        tipo: tarea.tipo,
        frecuencia_dias: tarea.frecuencia_dias,
        frecuencia_km: tarea.frecuencia_km,
        frecuencia_viaje: tarea.frecuencia_viaje,
      })
    } else {
      setFormData(emptyForm(sistemas))
    }
  }, [tarea, sistemas])

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setError('')
    setSaving(true)
    try {
      await onSave(formData)
    } catch {
      setError('No se pudo guardar la tarea. Verifique los datos ingresados.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-800">
            {tarea ? 'Editar Tarea' : 'Nueva Tarea'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
            aria-label="Cerrar"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Nombre de la Tarea
            </label>
            <input
              type="text"
              required
              value={formData.nombre_tarea}
              onChange={(event) =>
                setFormData({ ...formData, nombre_tarea: event.target.value })
              }
              placeholder="Ej: Revisión de frenos"
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-500"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Categoría de Vehículo
            </label>
            <select
              value={formData.categoria_vehiculo}
              onChange={(event) =>
                setFormData({ ...formData, categoria_vehiculo: event.target.value })
              }
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-500"
            >
              {CATEGORIAS.map((categoria) => (
                <option key={categoria} value={categoria}>
                  {categoria}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Sistema
            </label>
            <select
              value={formData.sistema_id}
              onChange={(event) =>
                setFormData({ ...formData, sistema_id: Number(event.target.value) })
              }
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-500"
            >
              {sistemas.map((sistema) => (
                <option key={sistema.id} value={sistema.id}>
                  {sistema.nombre}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Tipo
            </label>
            <select
              value={formData.tipo}
              onChange={(event) =>
                setFormData({ ...formData, tipo: event.target.value })
              }
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-500"
            >
              {TIPOS.map((tipo) => (
                <option key={tipo} value={tipo}>
                  {tipo}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Frecuencia (días)
              </label>
              <input
                type="number"
                value={formData.frecuencia_dias ?? ''}
                onChange={(event) =>
                  setFormData({
                    ...formData,
                    frecuencia_dias: event.target.value
                      ? Number(event.target.value)
                      : null,
                  })
                }
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-500"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Frecuencia (km)
              </label>
              <input
                type="number"
                value={formData.frecuencia_km ?? ''}
                onChange={(event) =>
                  setFormData({
                    ...formData,
                    frecuencia_km: event.target.value
                      ? Number(event.target.value)
                      : null,
                  })
                }
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-500"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="frecuencia_viaje"
              checked={formData.frecuencia_viaje}
              onChange={(event) =>
                setFormData({ ...formData, frecuencia_viaje: event.target.checked })
              }
              className="h-4 w-4 rounded border-gray-300"
            />
            <label htmlFor="frecuencia_viaje" className="text-sm text-gray-700">
              Mantenimiento Post-Viaje
            </label>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="mt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-800 disabled:opacity-50"
            >
              {saving ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default TareaModal
