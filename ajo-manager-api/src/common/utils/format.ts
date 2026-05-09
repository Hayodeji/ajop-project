/**
 * Formats a kobo amount into Naira string.
 * @param kobo The amount in kobo
 * @returns Formatted string with Naira symbol
 */
export function formatKobo(kobo: number): string {
  const naira = kobo / 100
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(naira)
}

/**
 * Recursively converts ISO date strings in an object to Date objects.
 */
export function fixDates(data: any): any {
  if (data === null || data === undefined) return data
  
  if (Array.isArray(data)) {
    return data.map(fixDates)
  }
  
  if (typeof data === 'object') {
    if (data instanceof Date) return data
    const fixed: any = {}
    for (const key in data) {
      const val = data[key]
      if (typeof val === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(val)) {
        fixed[key] = new Date(val)
      } else {
        fixed[key] = fixDates(val)
      }
    }
    return fixed
  }
  
  return data
}
