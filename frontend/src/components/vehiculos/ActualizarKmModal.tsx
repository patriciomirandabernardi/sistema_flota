import { useState, type FormEvent } from 'react'
import { X } from 'lucide-react'
import type { Vehiculo } from '../../types/vehiculo'

interface ActualizarKmModalProps {
  vehiculo: Vehiculo
  onClose: () => void
  onSave: (kilometrajeActual: number) => Promise<void>
}

function ActualizarKmModal({ vehiculo, onClose, onSave }: ActualizarKmModalProps) {
  const [kilometraje, setKilometraje] = useState<string>(
    vehiculo.kilometraje_actual != null ? String(vehiculo.kilometraje_actual) : ''
  )
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setError('')

    const valor = Number(kilometraje)
    if (!kilometraje || Number.isNaN(valor) || valor < 0) {
      setError('Ingrese un kilometraje válido.')
      return
    }

    setSaving(true)
    try {
      await onSave(valor)
    } catch (err: any) {
      setError(
        err?.response?.data?.detail ?? 'No se pudo actualizar el kilometraje.'
      )
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-sm rounded-lg bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-800">Actualizar Kilometraje</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
            aria-label="Cerrar"
          >
            <X size={20} />
          </button>
        </div>

        <p className="mb-4 text-sm text-gray-500">
          {vehiculo.patente} · {vehiculo.marca_modelo}
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <p className="mb-1 text-sm text-gray-500">
              Kilometraje actual:{' '}
              <span className="font-medium text-gray-700">
                {vehiculo.kilometraje_actual != null
                  ? `${vehiculo.kilometraje_actual.toLocaleString('es-AR')} km`
                  : 'Sin dato'}
              </span>
            </p>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Nuevo Kilometraje
            </label>
            <input
              type="number"
              min={0}
              autoFocus
              required
              value={kilometraje}
              onChange={(event) => setKilometraje(event.target.value)}
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

export default ActualizarKmModal
