// Convierte una fecha ISO del backend ("YYYY-MM-DD" o "YYYY-MM-DDTHH:mm:ss")
// a formato argentino "DD/MM/YYYY". Se parsea el string en lugar de usar
// `new Date(iso)` porque JS interpreta "2026-10-29" como medianoche UTC y en
// Argentina (UTC-3) se mostraría el día anterior.
export function formatFecha(iso: string | null | undefined, fallback = '-'): string {
  if (!iso) return fallback
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso)
  return match ? `${match[3]}/${match[2]}/${match[1]}` : iso
}

// Fecha de hoy (hora local) en DD/MM/YYYY, para encabezados de reportes.
export function formatFechaHoy(): string {
  const hoy = new Date()
  const dd = String(hoy.getDate()).padStart(2, '0')
  const mm = String(hoy.getMonth() + 1).padStart(2, '0')
  return `${dd}/${mm}/${hoy.getFullYear()}`
}
