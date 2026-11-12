import { useState } from 'react'
import { X } from 'lucide-react'
import VerFacturaButton from './VerFacturaButton'
import type { Orden } from '../../types/orden'
import type { Vehiculo } from '../../types/vehiculo'
import { formatFecha } from '../../utils/formatters'

interface OrdenDetalleModalProps {
  orden: Orden
  vehiculo: Vehiculo | undefined
  onClose: () => void
}

function OrdenDetalleModal({ orden, vehiculo, onClose }: OrdenDetalleModalProps) {
  const [errorFactura, setErrorFactura] = useState('')

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-lg bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-800">
            Orden de Mantenimiento #{orden.id}
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

        <section className="mb-4 rounded-md border border-gray-200 p-4">
          <h3 className="mb-2 text-xs font-semibold uppercase text-gray-500">
            Encabezado
          </h3>
          <dl className="grid grid-cols-2 gap-y-2 text-sm">
            <dt className="text-gray-500">Tipo</dt>
            <dd className="text-gray-800">{orden.tipo_orden}</dd>

            <dt className="text-gray-500">Fecha</dt>
            <dd className="text-gray-800">{formatFecha(orden.fecha_servicio)}</dd>

            <dt className="text-gray-500">Lugar</dt>
            <dd className="text-gray-800">{orden.lugar_ejecucion}</dd>

            <dt className="text-gray-500">Vehículo</dt>
            <dd className="text-gray-800">
              {vehiculo ? `${vehiculo.patente} - ${vehiculo.marca_modelo}` : 'No especificado'}
            </dd>
          </dl>
        </section>

        <section className="mb-4 rounded-md border border-gray-200 p-4">
          <h3 className="mb-2 text-xs font-semibold uppercase text-gray-500">
            Detalles Técnicos
          </h3>
          <dl className="grid grid-cols-2 gap-y-2 text-sm">
            <dt className="text-gray-500">Kilometraje</dt>
            <dd className="text-gray-800">{orden.kilometraje_servicio ?? '-'}</dd>

            <dt className="text-gray-500">Chofer</dt>
            <dd className="text-gray-800">{orden.chofer ?? '-'}</dd>

            <dt className="text-gray-500">Proveedor Externo</dt>
            <dd className="text-gray-800">{orden.proveedor_externo ?? '-'}</dd>

            {orden.tipo_orden === 'CORRECTIVO' && (
              <>
                <dt className="col-span-2 text-gray-500">Detalle de Rotura</dt>
                <dd className="col-span-2 text-gray-800">
                  {orden.detalle_rotura ?? 'No especificado'}
                </dd>
              </>
            )}

            <dt className="col-span-2 text-gray-500">Observaciones</dt>
            <dd className="col-span-2 text-gray-800">
              {orden.observaciones ?? 'No especificado'}
            </dd>
          </dl>
        </section>

        <section className="mb-4 rounded-md border border-gray-200 p-4">
          <h3 className="mb-2 text-xs font-semibold uppercase text-gray-500">
            Tareas Realizadas
          </h3>
          {orden.tareas_realizadas.length === 0 ? (
            <p className="text-sm text-gray-500">No se registraron tareas.</p>
          ) : (
            <ul className="list-inside list-disc text-sm text-gray-800">
              {orden.tareas_realizadas.map((detalle) => (
                <li key={detalle.id}>
                  {detalle.tarea?.nombre_tarea ?? `Tarea #${detalle.tarea_id}`}
                  {detalle.tarea?.sistema?.nombre && (
                    <span className="text-gray-400"> ({detalle.tarea.sistema.nombre})</span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>

        {errorFactura && (
          <p className="mb-2 text-right text-sm text-red-600">{errorFactura}</p>
        )}

        <div className="flex items-center justify-end gap-2">
          {orden.factura_pdf_url && (
            <VerFacturaButton ordenId={orden.id} onError={setErrorFactura} />
          )}
          <button
            type="button"
            onClick={onClose}
            className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-800"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  )
}

export default OrdenDetalleModal
