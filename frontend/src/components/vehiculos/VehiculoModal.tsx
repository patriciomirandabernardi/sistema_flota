import { useEffect, useState, type FormEvent } from 'react'
import { X } from 'lucide-react'
import type { Vehiculo, VehiculoFormData } from '../../types/vehiculo'

interface VehiculoModalProps {
  vehiculo: Vehiculo | null
  onClose: () => void
  onSave: (data: VehiculoFormData) => Promise<void>
}

const CATEGORIAS = ['CAMIONES', 'SEMIS', 'UTILITARIOS']

const emptyForm: VehiculoFormData = {
  patente: '',
  marca_modelo: '',
  anio: null,
  categoria: CATEGORIAS[0],
  kilometraje_actual: null,
  vencimiento_tecnica: null,
}

function VehiculoModal({ vehiculo, onClose, onSave }: VehiculoModalProps) {
  const [formData, setFormData] = useState<VehiculoFormData>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (vehiculo) {
      setFormData({
        patente: vehiculo.patente,
        marca_modelo: vehiculo.marca_modelo,
        anio: vehiculo.anio,
        categoria: vehiculo.categoria,
        kilometraje_actual: vehiculo.kilometraje_actual,
        vencimiento_tecnica: vehiculo.vencimiento_tecnica,
      })
    } else {
      setFormData(emptyForm)
    }
  }, [vehiculo])

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setError('')
    setSaving(true)
    try {
      await onSave(formData)
    } catch {
      setError('No se pudo guardar el vehículo. Verifique los datos ingresados.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-800">
            {vehiculo ? 'Editar Vehículo' : 'Nuevo Vehículo'}
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
              Patente
            </label>
            <input
              type="text"
              required
              value={formData.patente}
              onChange={(event) =>
                setFormData({ ...formData, patente: event.target.value })
              }
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-500"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Marca / Modelo
            </label>
            <input
              type="text"
              required
              value={formData.marca_modelo}
              onChange={(event) =>
                setFormData({ ...formData, marca_modelo: event.target.value })
              }
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-500"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Categoría
            </label>
            <select
              value={formData.categoria}
              onChange={(event) =>
                setFormData({ ...formData, categoria: event.target.value })
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

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Año
              </label>
              <input
                type="number"
                value={formData.anio ?? ''}
                onChange={(event) =>
                  setFormData({
                    ...formData,
                    anio: event.target.value ? Number(event.target.value) : null,
                  })
                }
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-500"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Kilometraje
              </label>
              <input
                type="number"
                value={formData.kilometraje_actual ?? ''}
                onChange={(event) =>
                  setFormData({
                    ...formData,
                    kilometraje_actual: event.target.value
                      ? Number(event.target.value)
                      : null,
                  })
                }
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-500"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Vencimiento Técnica
            </label>
            <input
              type="date"
              value={formData.vencimiento_tecnica ?? ''}
              onChange={(event) =>
                setFormData({
                  ...formData,
                  vencimiento_tecnica: event.target.value || null,
                })
              }
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-500"
            />
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

export default VehiculoModal
