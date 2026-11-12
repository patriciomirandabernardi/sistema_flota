import type { Vehiculo } from '../types/vehiculo'

// Genera un documento HTML autónomo (sin Tailwind ni layout de la app) y lo
// imprime desde un iframe oculto. Así cada carátula ocupa exactamente 1 página
// A4 sin importar qué pantalla tenga abierta el usuario.

const ORDEN_CATEGORIAS: Record<string, number> = {
  CAMIONES: 0,
  SEMIS: 1,
  UTILITARIOS: 2,
}

function escapeHtml(valor: string): string {
  return valor
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

// Formatea la patente para la placa: Mercosur "AF862TS" → "AF 862 TS",
// formato viejo "CWN427" → "CWN 427". Devuelve también si es formato Mercosur
// para dibujar la franja azul superior de la chapa.
function formatPatente(patente: string): { texto: string; esMercosur: boolean } {
  const limpia = patente.trim().toUpperCase().replace(/\s+/g, '')
  const mercosur = /^([A-Z]{2})(\d{3})([A-Z]{2})$/.exec(limpia)
  if (mercosur) {
    return { texto: `${mercosur[1]} ${mercosur[2]} ${mercosur[3]}`, esMercosur: true }
  }
  const vieja = /^([A-Z]{3})(\d{3})$/.exec(limpia)
  if (vieja) {
    return { texto: `${vieja[1]} ${vieja[2]}`, esMercosur: false }
  }
  return { texto: limpia, esMercosur: false }
}

function renderCaratula(vehiculo: Vehiculo): string {
  const patente = formatPatente(vehiculo.patente)
  const legajo = `Nº ${String(vehiculo.id).padStart(4, '0')}`

  return `<section class="page">
    <header class="header">
      <div>
        <div class="brand">IMCAYPER S.A.</div>
        <div class="brand-sub">Fábrica de Caños y Perfiles de Acero — Rosario, Santa Fe</div>
      </div>
      <div class="doc-data">
        <div class="doc-titulo">LEGAJO TÉCNICO E HISTORIAL DE UNIDAD</div>
        <div class="doc-legajo">LEGAJO ${legajo}</div>
      </div>
    </header>

    <div class="content">
      <div class="plate">
        ${patente.esMercosur ? '<div class="plate-strip">ARGENTINA</div>' : ''}
        <div class="plate-inner">${escapeHtml(patente.texto)}</div>
      </div>
    </div>
  </section>`
}

// margin: 0 en @page elimina los encabezados/pies del navegador (fecha, URL).
const ESTILOS = `
  @page { size: A4 portrait; margin: 0 !important; }
  * { -webkit-print-color-adjust: exact; print-color-adjust: exact; box-sizing: border-box; margin: 0; padding: 0; }
  html, body { background: #fff; }
  body { font-family: 'Segoe UI', Arial, Helvetica, sans-serif; color: #1e293b; }

  .page { height: 297mm; display: flex; flex-direction: column; overflow: hidden; page-break-after: always; box-sizing: border-box; }
  .page:last-child { page-break-after: auto; }

  .header {
    background: #0f172a;
    color: #fff;
    padding: 5mm 7mm;
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex: none;
  }
  .brand { font-size: 15pt; font-weight: 800; letter-spacing: 0.08em; }
  .brand-sub { font-size: 7.5pt; color: #94a3b8; letter-spacing: 0.05em; margin-top: 1mm; }
  .doc-data { text-align: right; }
  .doc-titulo { font-size: 8.5pt; font-weight: 700; letter-spacing: 0.12em; color: #e2e8f0; }
  .doc-legajo { font-size: 12pt; font-weight: 800; letter-spacing: 0.06em; margin-top: 1mm; }

  .content { flex: 1; display: flex; align-items: center; justify-content: center; }

  .plate {
    display: inline-block;
    text-align: center;
    background: #fff;
    border: 4pt solid #1f2937;
    border-radius: 4mm;
    overflow: hidden;
  }
  .plate-strip {
    background: #1d4ed8; color: #fff;
    font-size: 11pt; font-weight: 700; letter-spacing: 0.5em;
    padding: 2mm 0 2mm 0.5em;
    border-bottom: 1.5pt solid #1f2937;
  }
  .plate-inner {
    border: 1.5pt solid #1f2937;
    margin: 2mm;
    border-radius: 2mm;
    padding: 4mm 14mm 5mm;
    font-family: Consolas, 'Courier New', monospace;
    font-size: 72pt; font-weight: 700; letter-spacing: 0.1em;
    color: #111827; white-space: nowrap; line-height: 1.05;
  }
`

// Imprime una carátula A4 por vehículo. La lista se ordena por categoría
// (CAMIONES → SEMIS → UTILITARIOS) y patente para que el paquete impreso
// coincida con el orden físico del archivo de legajos.
export function imprimirCaratulas(vehiculos: Vehiculo[]): void {
  if (vehiculos.length === 0) return

  const ordenados = [...vehiculos].sort((a, b) => {
    const cat = (ORDEN_CATEGORIAS[a.categoria] ?? 99) - (ORDEN_CATEGORIAS[b.categoria] ?? 99)
    return cat !== 0 ? cat : a.patente.localeCompare(b.patente)
  })

  const titulo =
    ordenados.length === 1
      ? `Legajo ${ordenados[0].patente} — IMCAYPER S.A.`
      : `Carátulas de Legajo — Flota IMCAYPER S.A.`

  const html = `<!doctype html>
<html lang="es">
<head>
<meta charset="UTF-8" />
<title>${escapeHtml(titulo)}</title>
<style>${ESTILOS}</style>
</head>
<body>${ordenados.map(renderCaratula).join('')}</body>
</html>`

  const iframe = document.createElement('iframe')
  iframe.style.position = 'fixed'
  iframe.style.right = '0'
  iframe.style.bottom = '0'
  iframe.style.width = '0'
  iframe.style.height = '0'
  iframe.style.border = '0'
  document.body.appendChild(iframe)

  const win = iframe.contentWindow
  if (!win) {
    iframe.remove()
    return
  }

  win.onafterprint = () => iframe.remove()
  // Fallback por si el navegador no dispara afterprint (p. ej. diálogo cancelado).
  setTimeout(() => iframe.isConnected && iframe.remove(), 60000)

  win.document.open()
  win.document.write(html)
  win.document.close()

  // Pequeño delay para que el documento termine de layoutear antes del diálogo.
  setTimeout(() => {
    win.focus()
    win.print()
  }, 100)
}
