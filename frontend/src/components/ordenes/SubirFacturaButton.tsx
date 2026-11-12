import { useRef, useState, type ChangeEvent } from 'react'
import { Loader2, Upload } from 'lucide-react'
import { ordenesApi } from '../../api/ordenes'
import type { Orden } from '../../types/orden'

interface SubirFacturaButtonProps {
  ordenId: number
  onUploadSuccess: (ordenActualizada: Orden) => void
}

function SubirFacturaButton({ ordenId, onUploadSuccess }: SubirFacturaButtonProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [subiendo, setSubiendo] = useState(false)

  const handleArchivoSeleccionado = async (event: ChangeEvent<HTMLInputElement>) => {
    const archivo = event.target.files?.[0]
    // Se limpia el input para que volver a elegir el mismo archivo (ej: tras
    // un error) dispare de nuevo el onChange.
    event.target.value = ''
    if (!archivo) return

    const esPdf =
      archivo.type === 'application/pdf' || archivo.name.toLowerCase().endsWith('.pdf')
    if (!esPdf) {
      window.alert('El archivo debe ser un PDF.')
      return
    }

    setSubiendo(true)
    try {
      const ordenActualizada = await ordenesApi.uploadFactura(ordenId, archivo)
      onUploadSuccess(ordenActualizada)
    } catch (err: any) {
      window.alert(err?.response?.data?.detail ?? 'No se pudo subir la factura.')
    } finally {
      setSubiendo(false)
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={subiendo}
        className="rounded-md p-1.5 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-800 disabled:opacity-50"
        aria-label="Subir factura"
        title={subiendo ? 'Subiendo factura...' : 'Subir factura (PDF)'}
      >
        {subiendo ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf,.pdf"
        onChange={handleArchivoSeleccionado}
        className="hidden"
      />
    </>
  )
}

export default SubirFacturaButton
