const NAIRA = new Intl.NumberFormat('en-NG', {
  style: 'currency',
  currency: 'NGN',
  maximumFractionDigits: 0,
})

export function formatKobo(kobo: number): string {
  return NAIRA.format(kobo / 100)
}

export function nairaToKobo(naira: number): number {
  return Math.round(naira * 100)
}

const PHONE_RE = /^\+234\d{10}$/

export function normalisePhone(raw: string): string {
  const digits = raw.replace(/\D/g, '')
  if (digits.startsWith('234')) return `+${digits}`
  if (digits.startsWith('0')) return `+234${digits.slice(1)}`
  if (digits.length === 10) return `+234${digits}`
  return raw.startsWith('+') ? raw : `+${digits}`
}

export function isValidNigerianPhone(phone: string): boolean {
  return PHONE_RE.test(phone)
}

export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(' ')
}

const LAGOS_DATE = new Intl.DateTimeFormat('en-NG', {
  timeZone: 'Africa/Lagos',
  day: 'numeric',
  month: 'short',
  year: 'numeric',
})

const LAGOS_DATETIME = new Intl.DateTimeFormat('en-NG', {
  timeZone: 'Africa/Lagos',
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
})

export function formatDate(iso: string): string {
  return LAGOS_DATE.format(new Date(iso))
}

export function formatDateTime(iso: string): string {
  return LAGOS_DATETIME.format(new Date(iso))
}
