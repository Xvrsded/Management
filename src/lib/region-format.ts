export function formatRegionNumber(
  value: string | number | undefined | null
): string {
  if (!value) return ''
  return String(value)
    .replace(/[^0-9]/g, '')
    .padStart(3, '0')
}

export function displayRW(
  value?: string | number | null
): string {
  if (!value) return '-'
  return `RW ${formatRegionNumber(value)}`
}

export function displayRT(
  value?: string | number | null
): string {
  if (!value) return '-'
  return `RT ${formatRegionNumber(value)}`
}
