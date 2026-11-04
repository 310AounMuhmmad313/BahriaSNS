export const cn = (...a) => a.filter(Boolean).join(' ')

export const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'

export const fmtDateTime = (d) =>
  d
    ? new Date(d).toLocaleString('en-GB', {
        day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
      })
    : '—'

export const STATUS_LABEL = {
  pending: 'Pending',
  approved: 'Approved',
  rejected: 'Rejected',
  correction_requested: 'Needs Correction',
}

export const statusClass = (s) =>
  ({
    pending: 'badge badge-pending',
    approved: 'badge badge-approved',
    rejected: 'badge badge-rejected',
    correction_requested: 'badge badge-correction',
  })[s] || 'badge badge-navy'

export function genRef() {
  const y = String(new Date().getFullYear()).slice(-2)
  const n = Math.floor(100000 + Math.random() * 900000)
  return `BA-${y}-${n}`
}

/** Stable fingerprint used to block duplicate admission submissions. */
export function fingerprint(obj) {
  const s = Object.values(obj).join('|').toLowerCase().replace(/\s+/g, '')
  let h = 5381
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) >>> 0
  return 'fp-' + h.toString(36)
}

export const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v || '')
export const digits = (v) => (v || '').replace(/\D/g, '')
export const slug = (s) => (s || '').toLowerCase().replace(/[^a-z0-9.]+/g, '-').replace(/^-+|-+$/g, '')

export function validateFile(file, { maxMB = 5, accept = ['image/', 'application/pdf'] } = {}) {
  if (!file) return 'No file selected.'
  if (file.size > maxMB * 1024 * 1024) return `File is too large (max ${maxMB} MB).`
  if (file.type && !accept.some((a) => file.type.startsWith(a))) return 'Only JPG, PNG or PDF files are allowed.'
  return null
}

export const fileSize = (n) =>
  n > 1048576 ? (n / 1048576).toFixed(1) + ' MB' : Math.max(1, Math.round(n / 1024)) + ' KB'

export function ageYears(dob) {
  if (!dob) return null
  const d = new Date(dob)
  if (isNaN(d.getTime())) return null
  const diff = Date.now() - d.getTime()
  return Math.floor(diff / (365.25 * 24 * 3600 * 1000))
}

/** Parse "Title: description" multiline settings into [{t, d}]. */
export function parseKv(text) {
  return String(text || '')
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
    .map((line) => {
      const i = line.indexOf(':')
      return i > 0 ? { t: line.slice(0, i).trim(), d: line.slice(i + 1).trim() } : { t: line, d: '' }
    })
}

/** Download any array of objects as a CSV file (Excel-friendly, UTF-8 BOM). */
export function downloadCsv(rows, filename) {
  if (!rows || !rows.length) return
  const cols = [...new Set(rows.flatMap((r) => Object.keys(r)))]
  const esc = (v) => {
    const s = v === null || v === undefined ? '' : String(v)
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
  }
  const csv = [cols.join(','), ...rows.map((r) => cols.map((c) => esc(r[c])).join(','))].join('\n')
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = filename
  a.click()
  URL.revokeObjectURL(a.href)
}

/** Turn a YouTube URL into an embeddable URL (or return as-is). */
export function videoEmbed(url) {
  if (!url) return null
  const m = String(url).match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{6,})/)
  return m ? `https://www.youtube.com/embed/${m[1]}` : url
}

export const reducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
