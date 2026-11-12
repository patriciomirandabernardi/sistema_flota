import { useMemo, useState, type FormEvent } from 'react'
import { X } from 'lucide-react'
import type { Tarea } from '../../types/catalogo'
import type { OrdenFormData } from '../../types/orden'
import type { Vehiculo } from '../../types/vehiculo'

interface OrdenModalProps {
  vehiculos: Vehiculo[]
  tareas: Tarea[]
  onClose: () => void
  onSave: (data: OrdenFormData, factura: File | null) => Promise<void>
}

const TIPOS_ORDEN = ['PREVENTIVO', 'CORRECTIVO']
const LUGARES = ['INTERNO', 'EXTERNO']
const KM_OBLIGATORIO_MSG = 'El kilometraje es obligatorio en tareas preventivas'

// Fecha de hoy en hora local como YYYY-MM-DD (formato que exige el
// <input type="date">). toISOString() usa UTC y después de las 21:00 en
// Argentina devolvería el día siguiente.
const hoyLocalISO = () => {
  const hoy = new Date()
  return `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-${String(hoy.getDate()).padStart(2, '0')}`
}

const emptyForm = (vehiculos: Vehiculo[]): OrdenFormData => ({
  fecha_servicio: hoyLocalISO(),
  kilometraje_servicio: null,
  tipo_orden: TIPOS_ORDEN[0],
  detalle_rotura: null,
  observaciones: null,
  lugar_ejecucion: LUGARES[0],
  proveedor_externo: null,
  chofer: null,
  vehiculo_id: vehiculos[0]?.id ?? 0,
  semi_enganchado_id: null,
  tarea_ids: [],
})

function OrdenModal({ vehiculos, tareas, onClose, onSave }: OrdenModalProps) {
  const [formData, setFormData] = useState<OrdenFormData>(emptyForm(vehiculos))
  const [factura, setFactura] = useState<File | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [errorKilometraje, setErrorKilometraje] = useState('')

  const esPreventivo = formData.tipo_orden === 'PREVENTIVO'

  const vehiculoSeleccionado = vehiculos.find((v) => v.id === formData.vehiculo_id)

  const tareasDisponibles = useMemo(() => {
    if (!vehiculoSeleccionado) return []
    return tareas.filter(
      (tarea) =>
        tarea.categoria_vehiculo === vehiculoSeleccionado.categoria &&
        tarea.tipo === formData.tipo_orden
    )
  }, [tareas, vehiculoSeleccionado, formData.tipo_orden])

  const handleVehiculoChange = (vehiculoId: number) => {
    // Al cambiar de vehículo, se limpian las tareas tildadas ya que la
    // categoría (y por lo tanto las tareas disponibles) puede cambiar.
    setFormData({ ...formData, vehiculo_id: vehiculoId, tarea_ids: [] })
  }

  const handleTipoOrdenChange = (tipoOrden: string) => {
    // Al cambiar el tipo de orden, la lista de tareas disponibles cambia
    // (PREVENTIVO vs CORRECTIVO) y "Detalle de Rotura" deja de aplicar en
    // PREVENTIVO, así que se limpian ambos campos para evitar enviar datos
    // que ya no corresponden al nuevo tipo seleccionado.
    setFormData({
      ...formData,
      tipo_orden: tipoOrden,
      tarea_ids: [],
      detalle_rotura: tipoOrden === 'PREVENTIVO' ? null : formData.detalle_rotura,
    })
  }

  const handleLugarChange = (lugarEjecucion: string) => {
    // Si el trabajo pasa a ser INTERNO, el proveedor externo deja de aplicar:
    // se limpia para no enviar al backend el nombre de un taller que ya no
    // corresponde (el campo tampoco se muestra más en pantalla).
    setFormData({
      ...formData,
      lugar_ejecucion: lugarEjecucion,
      proveedor_externo:
        lugarEjecucion === 'EXTERNO' ? formData.proveedor_externo : null,
    })
    // Misma lógica para la factura adjunta: solo aplica a trabajos externos.
    if (lugarEjecucion !== 'EXTERNO') {
      setFactura(null)
    }
  }

  const handleToggleTarea = (tareaId: number) => {
    setFormData((prev) => {
      const yaSeleccionada = prev.tarea_ids.includes(tareaId)
      return {
        ...prev,
        tarea_ids: yaSeleccionada
          ? prev.tarea_ids.filter((id) => id !== tareaId)
          : [...prev.tarea_ids, tareaId],
      }
    })
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setError('')
    setErrorKilometraje('')

    // Regla de negocio: sin kilometraje no se puede calcular el próximo
    // ciclo de un preventivo. Se bloquea acá y también lo valida el backend.
    if (esPreventivo && formData.kilometraje_servicio == null) {
      setErrorKilometraje(KM_OBLIGATORIO_MSG)
      return
    }

    setSaving(true)
    try {
      await onSave(formData, factura)
    } catch (err: any) {
      setError(
        err?.response?.data?.detail ??
          'No se pudo guardar la orden. Verifique los datos ingresados.'
      )
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-800">
            Nueva Orden de Mantenimiento
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
              Vehículo
            </label>
            <select
              value={formData.vehiculo_id}
              onChange={(event) => handleVehiculoChange(Number(event.target.value))}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-500"
            >
              {vehiculos.map((vehiculo) => (
                <option key={vehiculo.id} value={vehiculo.id}>
                  {vehiculo.patente} - {vehiculo.marca_modelo} ({vehiculo.categoria})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Fecha de Servicio
              </label>
              <input
                type="date"
                required
                value={formData.fecha_servicio}
                onChange={(event) =>
                  setFormData({ ...formData, fecha_servicio: event.target.value })
                }
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-500"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Kilometraje
                {esPreventivo && <span className="ml-1 text-red-600">*</span>}
              </label>
              <input
                type="number"
                min={0}
                aria-required={esPreventivo}
                value={formData.kilometraje_servicio ?? ''}
                onChange={(event) => {
                  setErrorKilometraje('')
                  setFormData({
                    ...formData,
                    kilometraje_servicio: event.target.value
                      ? Number(event.target.value)
                      : null,
                  })
                }}
                className={`w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 ${
                  errorKilometraje
                    ? 'border-red-500 focus:ring-red-500'
                    : 'border-gray-300 focus:ring-slate-500'
                }`}
              />
              {errorKilometraje && (
                <p className="mt-1 text-xs text-red-600">{errorKilometraje}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Tipo de Orden
              </label>
              <select
                value={formData.tipo_orden}
                onChange={(event) => handleTipoOrdenChange(event.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-500"
              >
                {TIPOS_ORDEN.map((tipo) => (
                  <option key={tipo} value={tipo}>
                    {tipo}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Lugar de Ejecución
              </label>
              <select
                value={formData.lugar_ejecucion}
                onChange={(event) => handleLugarChange(event.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-500"
              >
                {LUGARES.map((lugar) => (
                  <option key={lugar} value={lugar}>
                    {lugar}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {formData.lugar_ejecucion === 'EXTERNO' && (
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Nombre del Taller
              </label>
              <input
                type="text"
                value={formData.proveedor_externo ?? ''}
                onChange={(event) =>
                  setFormData({
                    ...formData,
                    proveedor_externo: event.target.value || null,
                  })
                }
                placeholder="Ej: Taller Mecánico San Martín"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-500"
              />

              <label className="mb-1 mt-4 block text-sm font-medium text-gray-700">
                Factura del Proveedor (PDF)
              </label>
              <input
                type="file"
                accept="application/pdf"
                onChange={(event) => setFactura(event.target.files?.[0] ?? null)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm file:mr-3 file:rounded file:border-0 file:bg-slate-100 file:px-3 file:py-1 file:text-sm file:font-medium file:text-slate-700 hover:file:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-500"
              />
              {factura && (
                <p className="mt-1 text-xs text-gray-500">
                  Archivo seleccionado: {factura.name}
                </p>
              )}
            </div>
          )}

          {formData.tipo_orden === 'CORRECTIVO' && (
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Detalle de Rotura
              </label>
              <textarea
                value={formData.detalle_rotura ?? ''}
                onChange={(event) =>
                  setFormData({ ...formData, detalle_rotura: event.target.value || null })
                }
                rows={2}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-500"
              />
            </div>
          )}

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Observaciones
            </label>
            <textarea
              value={formData.observaciones ?? ''}
              onChange={(event) =>
                setFormData({ ...formData, observaciones: event.target.value || null })
              }
              rows={2}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-500"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Chofer
            </label>
            <input
              type="text"
              value={formData.chofer ?? ''}
              onChange={(event) =>
                setFormData({ ...formData, chofer: event.target.value || null })
              }
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-500"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Tareas Realizadas{' '}
              {vehiculoSeleccionado && (
                <span className="font-normal text-gray-400">
                  (categoría: {vehiculoSeleccionado.categoria} · tipo: {formData.tipo_orden})
                </span>
              )}
            </label>
            <div className="max-h-48 overflow-y-auto rounded-md border border-gray-200 p-3">
              {tareasDisponibles.length === 0 && (
                <p className="text-sm text-gray-500">
                  No hay tareas {formData.tipo_orden.toLowerCase()}s disponibles para esta
                  categoría de vehículo.
                </p>
              )}
              {tareasDisponibles.map((tarea) => (
                <label
                  key={tarea.id}
                  className="flex items-center gap-2 py-1 text-sm text-gray-700"
                >
                  <input
                    type="checkbox"
                    checked={formData.tarea_ids.includes(tarea.id)}
                    onChange={() => handleToggleTarea(tarea.id)}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  {tarea.nombre_tarea}
                  {tarea.sistema?.nombre && (
                    <span className="rounded bg-slate-100 px-1.5 py-0.5 text-xs font-semibold text-slate-600">
                      [{tarea.sistema.nombre}]
                    </span>
                  )}
                </label>
              ))}
            </div>
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

export default OrdenModal
