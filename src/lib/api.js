import { sb, BUCKETS } from './supabase'

/* ============================================================
   Central data-access layer. Every Supabase read/write in the
   app goes through these functions.
   ============================================================ */

const unwrap = ({ data, error }) => {
  if (error) throw error
  return data
}

/* ---------------- generic helpers ---------------- */

export async function fetchAll(table, { order = 'created_at', asc = false, filters = [], select = '*', limit } = {}) {
  let q = sb().from(table).select(select).order(order, { ascending: asc })
  for (const [col, op, val] of filters) q = q[op](col, val)
  if (limit) q = q.limit(limit)
  return unwrap(await q)
}
// Generate safe URL and file names
const slug = (value = '') =>
  String(value)
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'file'

export async function insertRow(table, payload) {
  return unwrap(await sb().from(table).insert(payload).select().single())
}

export async function updateRow(table, id, payload) {
  return unwrap(await sb().from(table).update(payload).eq('id', id).select().single())
}

export async function deleteRow(table, id) {
  const { error } = await sb().from(table).delete().eq('id', id)
  if (error) throw error
}

/* ---------------- site settings ---------------- */

export const settingsApi = {
  getAll: async () => {
    const rows = await fetchAll('site_settings', { order: 'key', asc: true })
    return Object.fromEntries(rows.map((r) => [r.key, r.value]))
  },
  upsert: async (entries) => {
    const { error } = await sb().from('site_settings').upsert(entries, { onConflict: 'key' })
    if (error) throw error
  },
}

/* ---------------- public content ---------------- */

export const contentApi = {
  notices: async () => {
    const rows = await fetchAll('notices', { order: 'publish_at', asc: false, filters: [['status', 'eq', 'published']], limit: 60 })
    const now = Date.now()
    return rows.filter((r) => !r.expires_at || new Date(r.expires_at).getTime() > now)
  },
  events: async () => fetchAll('events', { order: 'event_date', asc: false, filters: [['status', 'eq', 'published']] }),
  gallery: async () => fetchAll('gallery_items', { order: 'created_at', asc: false, filters: [['status', 'eq', 'published']] }),
  faculty: async () => fetchAll('faculty', { order: 'display_order', asc: true, filters: [['is_active', 'eq', true]] }),
  achievements: async () => fetchAll('achievements', { order: 'year', asc: false, filters: [['is_active', 'eq', true]] }),
  history: async () => fetchAll('history_items', { order: 'sort_date', asc: true, filters: [['is_active', 'eq', true]] }),
  classes: async () => fetchAll('classes', { order: 'display_order', asc: true, filters: [['is_active', 'eq', true]] }),
  years: async () => fetchAll('academic_years', { order: 'label', asc: false }),
}

/* ---------------- contact messages ---------------- */

export const messagesApi = {
  create: (payload) => insertRow('contact_messages', payload),
  list: () => fetchAll('contact_messages', { order: 'created_at', asc: false, limit: 300 }),
  markRead: (id, is_read = true) => updateRow('contact_messages', id, { is_read }),
  remove: (id) => deleteRow('contact_messages', id),
}

/* ---------------- admissions (public) ---------------- */

export const admissionsPublicApi = {
  /** Duplicate submissions are blocked by a unique fingerprint index. */
  create: async (payload) => {
    const { data, error } = await sb()
      .from('admissions')
      .insert(payload)
      .select('reference_no, status, created_at')
      .single()
    if (error) {
      if (error.code === '23505') {
        const dup = new Error('DUPLICATE_SUBMISSION')
        dup.code = 'DUPLICATE_SUBMISSION'
        throw dup
      }
      throw error
    }
    return data
  },
  track: async (reference, phone) => {
    const { data, error } = await sb().rpc('track_application', { p_reference: reference, p_phone: phone })
    if (error) throw error
    return (data || [])[0] || null
  },
  trackHistory: async (reference, phone) => {
    const { data, error } = await sb().rpc('track_application_history', { p_reference: reference, p_phone: phone })
    if (error) throw error
    return data || []
  },
}

/* ---------------- admissions (admin) ---------------- */

export const admissionsAdminApi = {
  list: async ({ search = '', status = '', classId = '', page = 1, per = 12, sort = 'newest' } = {}) => {
    let q = sb().from('admissions').select('*, classes(name), academic_years(label)', { count: 'exact' })
    if (status) q = q.eq('status', status)
    if (classId) q = q.eq('class_id', classId)
    if (search) {
      const s = search.trim().replace(/[%,]/g, '')
      q = q.or(`reference_no.ilike.%${s}%,student_name.ilike.%${s}%,guardian_phone.ilike.%${s}%`)
    }
    q = q.order('created_at', { ascending: sort === 'oldest' }).range((page - 1) * per, page * per - 1)
    const { data, error, count } = await q
    if (error) throw error
    return { rows: data || [], total: count || 0 }
  },get: async (id) => {
  const client = sb()

  if (!client) {
    throw new Error('Supabase client is not initialized.')
  }

  const { data, error } = await client
    .from('admissions')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    console.error('Supabase Admission Error:', error)
    throw error
  }

  if (!data) {
    throw new Error('Application not found.')
  }

  return data
},
history: (admissionId) =>
  fetchAll('admission_history', {
    order: 'created_at',
    asc: true,
    filters: [['admission_id', 'eq', admissionId]],
    select: '*',
  }),

  setStatus: async ({ admission, status, note, adminId }) => {
    await updateRow('admissions', admission.id, {
      status,
      remarks: note || admission.remarks || null,
      reviewed_by: adminId,
      reviewed_at: new Date().toISOString(),
    })
    await sb().from('admission_history').insert({
      admission_id: admission.id,
      status,
      note: note || null,
      changed_by: adminId,
    })
    await audit('status_change', 'admission', admission.reference_no, { from: admission.status, to: status, note })
  },

  saveRemarks: (id, remarks, adminId) => updateRow('admissions', id, { remarks, reviewed_by: adminId }),

  convertToStudent: async (adm) => {
    const row = await insertRow('students', {
      admission_id: adm.id,
      student_name: adm.student_name,
      date_of_birth: adm.date_of_birth,
      gender: adm.gender,
      guardian_name: adm.guardian_name,
      guardian_phone: adm.guardian_phone,
      class_id: adm.class_id,
      academic_year_id: adm.academic_year_id,
      status: 'active',
    })
    await audit('convert_to_student', 'admission', adm.reference_no, { student_id: row.id })
    return row
  },

  exportAll: async ({ status = '', classId = '' } = {}) => {
    let q = sb().from('admissions').select('*, classes(name), academic_years(label)')
    if (status) q = q.eq('status', status)
    if (classId) q = q.eq('class_id', classId)
    q = q.order('created_at', { ascending: false }).limit(5000)
    return unwrap(q)
  },
}

/* ---------------- students (admin) ---------------- */

export const studentsApi = {
  list: () => fetchAll('students', { order: 'created_at', asc: false, select: '*, classes(name), academic_years(label), admissions(reference_no)' }),
  create: (payload) => insertRow('students', payload),
  update: (id, payload) => updateRow('students', id, payload),
  remove: (id) => deleteRow('students', id),
}

/* ---------------- dashboard stats ---------------- */

export const statsApi = {
  counts: async () => {
    const s = sb()
    const one = async (col, val) => {
      const { count } = await s.from('admissions').select('id', { count: 'exact', head: true }).eq(col, val)
      return count || 0
    }
    const totalQ = await s.from('admissions').select('id', { count: 'exact', head: true })
    const [pending, approved, rejected, correction] = await Promise.all([
      one('status', 'pending'), one('status', 'approved'), one('status', 'rejected'), one('status', 'correction_requested'),
    ])
    const unread = await s.from('contact_messages').select('id', { count: 'exact', head: true }).eq('is_read', false)
    if (totalQ.error || unread.error) throw totalQ.error || unread.error
    return { total: totalQ.count || 0, pending, approved, rejected, correction, unread: unread.count || 0 }
  },

  breakdown: async () => {
    const rows = await fetchAll('admissions', {
      order: 'created_at',
      asc: false,
      select: 'id, status, class_id, created_at, classes(name)',
      limit: 2000,
    })
    const byClass = {}
    const byDay = {}
    const statusByClass = {}
    for (const r of rows) {
      const c = r.classes?.name || 'Unassigned'
      byClass[c] = (byClass[c] || 0) + 1
      statusByClass[c] = statusByClass[c] || { total: 0, pending: 0 }
      statusByClass[c].total++
      if (r.status === 'pending') statusByClass[c].pending++
      const day = r.created_at?.slice(0, 10)
      if (day) byDay[day] = (byDay[day] || 0) + 1
    }
    return { total: rows.length, byClass, byDay, statusByClass }
  },
}

/* ---------------- audit logs ---------------- */

export async function audit(action, entity, entity_id, details = {}) {
  try {
    const { data } = await sb().auth.getUser()
    await sb().from('audit_logs').insert({
      actor_id: data?.user?.id || null,
      actor_email: data?.user?.email || null,
      action,
      entity,
      entity_id: String(entity_id || ''),
      details,
    })
  } catch (e) {
    console.warn('audit log failed', e)
  }
}

export const auditApi = {
  list: () => fetchAll('audit_logs', { order: 'created_at', asc: false, limit: 150 }),
}

/* ---------------- storage ---------------- */

export const storageApi = {
  /** Upload to the public media bucket, returns the public URL. */
  uploadPublic: async (folder, file) => {
    const path = `${folder}/${Date.now()}-${slug(file.name)}`
    const { error } = await sb()
      .storage.from(BUCKETS.public)
      .upload(path, file, { upsert: true, contentType: file.type || undefined })
    if (error) throw error
    const { data } = await sb().storage.from(BUCKETS.public).getPublicUrl(path)
    return data.publicUrl
  },

  /** Upload a private admission document, returns metadata stored in the row. */
  uploadDocument: async (refNo, label, file) => {
    const ext = (file.name.split('.').pop() || 'bin').toLowerCase()
    const path = `${refNo}/${slug(label)}-${Date.now()}.${ext}`
    const { error } = await sb()
      .storage.from(BUCKETS.documents)
      .upload(path, file, { contentType: file.type || undefined })

    if (error) throw error
    return { label, path, name: file.name, size: file.size, type: file.type }
  },

  /** Temporary signed URL so only authorized admins can view private documents. */
  documentViewUrl: async (path) => {
    const { data, error } = await sb().storage.from(BUCKETS.documents).createSignedUrl(path, 300)
    if (error) throw error
    return data.signedUrl
  },
}
