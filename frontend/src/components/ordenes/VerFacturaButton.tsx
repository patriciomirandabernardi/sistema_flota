import { useState } from 'react'
import { FileText } from 'lucide-react'
import { ordenesApi } from '../../api/ordenes'

interface VerFacturaButtonProps {
  ordenId: number
  compact?: boolean
  onError?: (mensaje: string) => void
}

function VerFacturaButton({ ordenId, compact = false, onError }: VerFacturaButtonProps) {
  const [abriendo, setAbriendo] = useState(false)

  const handleVerFactura = async () => {
    setAbriendo(true)
    try {
      // El PDF ya no es un archivo estático público: se pide autenticado y se
      // abre desde un ObjectURL temporal generado en memoria del navegador.
      const blob = await ordenesApi.getFacturaBlob(ordenId)
      const objectUrl = URL.createObjectURL(blob)
      window.open(objectUrl, '_blank', 'noopener,noreferrer')
      // Se libera el ObjectURL más tarde: revocarlo de inmediato haría que la
      // pestaña recién abierta no llegue a cargar el archivo.
      setTimeout(() => URL.revokeObjectURL(objectUrl), 60000)
    } catch {
      const mensaje = 'No se pudo abrir la factura.'
      if (onError) onError(mensaje)
      else window.alert(mensaje)
    } finally {
      setAbriendo(false)
    }
  }

  if (compact) {
    return (
      <button
        type="button"
        onClick={handleVerFactura}
        disabled={abriendo}
        className="rounded-md p-1.5 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-800 disabled:opacity-50"
        aria-label="Ver factura"
        title="Ver factura"
      >
        <FileText size={16} />
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={handleVerFactura}
      disabled={abriendo}
      className="flex items-center gap-2 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50"
    >
      <FileText size={16} />
      {abriendo ? 'Abriendo...' : 'Ver Factura'}
    </button>
  )
}

export default VerFacturaButton
