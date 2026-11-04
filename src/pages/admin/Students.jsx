import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAsync } from '../../hooks/useAsync'
import { useToast } from '../../context/ToastContext'
import { useAuth } from '../../context/AuthContext'
import { studentsApi, contentApi, audit } from '../../lib/api'
import { fmtDate, statusClass } from '../../lib/utils'
import { AsyncBlock } from '../../components/ui/Bits'
import { Modal, ConfirmDialog } from '../../components/ui/Modal'
import { Input, Select, Textarea, Toggle } from '../../components/ui/Fields'
import Icon from '../../components/ui/icons'

const EMPTY = {
  student_name: '', date_of_birth: '', gender: '', guardian_name: '', guardian_phone: '',
  class_id: '', academic_year_id: '', roll_no: '', status: 'active', notes: '',
}

export default function StudentsAdmin() {
  const toast = useToast()
  const { profile } = useAuth()
  const students = useAsync(() => studentsApi.list(), [])
  const classes = useAsync(() => contentApi.classes(), [])
  const years = useAsync(() => contentApi.years(), [])

  const [q, setQ] = useState('')
  const [editing, setEditing] = useState(null) // 'new' | row
  const [form, setForm] = useState(EMPTY)
  const [errors, setErrors] = useState({})
  const [busy, setBusy] = useState(false)
  const [deleting, setDeleting] = useState(null)

  const rows = useMemo(() => {
    let r = students.data || []
    if (q.trim()) {
      const s = q.toLowerCase()
      r = r.filter((st) => [st.student_name, st.roll_no, st.guardian_name, st.guardian_phone, st.classes?.name].some((v) => (v || '').toLowerCase().includes(s)))
    }
    return r
  }, [students.data, q])

  const openNew = () => {
    setForm({ ...EMPTY, academic_year_id: (years.data || []).find((y) => y.is_active)?.id || '' })
    setErrors({})
    setEditing('new')
  }
  const openEdit = (s) => {
    setForm({
      student_name: s.student_name || '',
      date_of_birth: s.date_of_birth ? String(s.date_of_birth).slice(0, 10) : '',
      gender: s.gender || '',
      guardian_name: s.guardian_name || '',
      guardian_phone: s.guardian_phone || '',
      class_id: s.class_id || '',
      academic_year_id: s.academic_year_id || '',
      roll_no: s.roll_no || '',
      status: s.status || 'active',
      notes: s.notes || '',
    })
    setErrors({})
    setEditing(s)
  }

  const setF = (k) => (e) => {
    setForm((f) => ({ ...f, [k]: e.target.value }))
    setErrors((er) => ({ ...er, [k]: undefined }))
  }

  const save = async () => {
    const er = {}
    if (form.student_name.trim().length < 3) er.student_name = 'Student name is required.'
    if (!form.class_id) er.class_id = 'Select a class.'
    if (form.guardian_phone && form.guardian_phone.replace(/\D/g, '').length < 10) er.guardian_phone = 'Enter a valid phone.'
    setErrors(er)
    if (Object.keys(er).length) return
    setBusy(true)
    try {
      const payload = { ...form, date_of_birth: form.date_of_birth || null }
      if (editing === 'new') {
        await studentsApi.create(payload)
        await audit('create', 'students', form.student_name, {})
        toast.success('Student record created.')
      } else {
        await studentsApi.update(editing.id, payload)
        await audit('update', 'students', form.student_name, {})
        toast.success('Student record updated.')
      }
      setEditing(null)
      students.refetch()
    } catch (e) {
      toast.error(e.message || 'Could not save the student record.')
    } finally {
      setBusy(false)
    }
  }

  const remove = async () => {
    setBusy(true)
    try {
      await studentsApi.remove(deleting.id)
      await audit('delete', 'students', deleting.student_name, {})
      toast.success('Student record deleted.')
      setDeleting(null)
      students.refetch()
    } catch (e) {
      toast.error(e.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-5">
      <div className="card flex flex-wrap items-center justify-between gap-3 p-4">
        <div className="relative min-w-[220px] flex-1 md:max-w-xs">
          <Icon name="search" size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search students…" className="input pl-9" />
        </div>
        <button className="btn btn-gold btn-sm" onClick={openNew}>
          <Icon name="plus" size={14} /> Add student manually
        </button>
      </div>

      <div className="card overflow-hidden">
        <AsyncBlock {...students} empty={<p className="px-6 py-12 text-center text-sm text-slate-400">No student records yet. Approve an admission and click “Convert to student record”, or add a student manually.</p>}>
          <div className="overflow-x-auto">
            <table className="tbl">
              <thead>
                <tr>
                  <th>Student</th><th>Class</th><th>Guardian</th><th>Roll no</th><th>Admission ref</th><th>Status</th><th />
                </tr>
              </thead>
              <tbody>
                {rows.map((s) => (
                  <tr key={s.id}>
                    <td>
                      <div className="font-semibold text-navy-900">{s.student_name}</div>
                      <div className="text-[11px] text-slate-400">{s.gender || '—'} · {s.date_of_birth ? fmtDate(s.date_of_birth) : '—'}</div>
                    </td>
                    <td>{s.classes?.name || '—'}<div className="text-[11px] text-slate-400">{s.academic_years?.label}</div></td>
                    <td>
                      <div className="text-xs font-semibold">{s.guardian_name || '—'}</div>
                      <div className="text-[11px] text-slate-400">{s.guardian_phone || ''}</div>
                    </td>
                    <td className="font-mono text-xs">{s.roll_no || '—'}</td>
                    <td>
                      {s.admissions?.reference_no ? (
                        <Link to="/admin/admissions" className="font-mono text-xs text-gold-600 hover:underline">{s.admissions.reference_no}</Link>
                      ) : (
                        <span className="text-xs text-slate-300">manual entry</span>
                      )}
                    </td>
                    <td><span className={s.status === 'active' ? 'badge badge-approved' : 'badge badge-gray'}>{s.status}</span></td>
                    <td>
                      <div className="flex justify-end gap-1.5">
                        <button className="btn btn-ghost btn-sm" onClick={() => openEdit(s)}><Icon name="edit" size={13} /></button>
                        <button className="btn btn-ghost btn-sm text-red-600" onClick={() => setDeleting(s)}><Icon name="trash" size={13} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </AsyncBlock>
      </div>

      <Modal open={!!editing} onClose={() => !busy && setEditing(null)} title={editing === 'new' ? 'Add student' : 'Edit student record'} wide>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Student name" required value={form.student_name} onChange={setF('student_name')} error={errors.student_name} />
          <Input label="Date of birth" type="date" value={form.date_of_birth} onChange={setF('date_of_birth')} />
          <Select label="Gender" value={form.gender} onChange={setF('gender')}>
            <option value="">—</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
          </Select>
          <Input label="Roll number" value={form.roll_no} onChange={setF('roll_no')} />
          <Select label="Class" required value={form.class_id} onChange={setF('class_id')} error={errors.class_id}>
            <option value="">Select class…</option>
            {(classes.data || []).map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </Select>
          <Select label="Academic year" value={form.academic_year_id} onChange={setF('academic_year_id')}>
            <option value="">—</option>
            {(years.data || []).map((y) => (
              <option key={y.id} value={y.id}>{y.label}</option>
            ))}
          </Select>
          <Input label="Guardian name" value={form.guardian_name} onChange={setF('guardian_name')} />
          <Input label="Guardian phone" value={form.guardian_phone} onChange={setF('guardian_phone')} error={errors.guardian_phone} />
          <Select label="Status" value={form.status} onChange={setF('status')}>
            <option value="active">active</option>
            <option value="graduated">graduated</option>
            <option value="transferred">transferred</option>
            <option value="inactive">inactive</option>
          </Select>
          <Textarea label="Notes" rows={3} value={form.notes} onChange={setF('notes')} className="sm:col-span-2" />
        </div>
        <div className="mt-6 flex justify-end gap-2 border-t border-navy-100 pt-4">
          <button className="btn btn-ghost" onClick={() => setEditing(null)} disabled={busy}>Cancel</button>
          <button className="btn btn-gold" onClick={save} disabled={busy}>{busy ? 'Saving…' : 'Save record'}</button>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={remove}
        busy={busy}
        title="Delete student record?"
        confirmLabel="Delete permanently"
        body={`This removes ${deleting?.student_name || 'this student'} from the students table. The linked admission application is kept for the record.`}
      />
    </div>
  )
}
