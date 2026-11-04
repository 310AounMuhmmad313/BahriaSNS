import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useAsync } from '../../hooks/useAsync'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { admissionsAdminApi, storageApi, studentsApi, audit } from '../../lib/api'
import { fmtDate, fmtDateTime, statusClass, STATUS_LABEL, fileSize, cn } from '../../lib/utils'
import { ConfirmDialog } from '../../components/ui/Modal'
import { Textarea } from '../../components/ui/Fields'
import Icon from '../../components/ui/icons'

export default function AdmissionDetail() {
  const { id } = useParams()
  const { profile } = useAuth()
  const toast = useToast()
  const app = useAsync(() => admissionsAdminApi.get(id), [id]) 
  const history = useAsync(() => admissionsAdminApi.history(id), [id])

  const [action, setAction] = useState(null) // 'approved' | 'rejected' | 'correction_requested'
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)
  const [remarks, setRemarks] = useState(null)
  const [confirmConvert, setConfirmConvert] = useState(false)

  const a = app.data
  const hasStudent = Boolean(a?.students?.length)

  const applyStatus = async () => {
    if (!a) return
    setBusy(true)
    try {
      await admissionsAdminApi.setStatus({ admission: a, status: action, note, adminId: profile.id })
      toast.success(`Application marked as "${STATUS_LABEL[action]}".`)
      setAction(null)
      setNote('')
      app.refetch()
      history.refetch()
    } catch (e) {
      toast.error(e.message || 'Could not update the application.')
    } finally {
      setBusy(false)
    }
  }

  const saveRemarks = async () => {
    try {
      await admissionsAdminApi.saveRemarks(a.id, remarks ?? a.remarks ?? '', profile.id)
      await audit('remarks_update', 'admission', a.reference_no, {})
      toast.success('Administrative remarks saved.')
      app.refetch()
      setRemarks(null)
    } catch (e) {
      toast.error(e.message || 'Could not save remarks.')
    }
  }

  const convert = async () => {
    setBusy(true)
    try {
      await admissionsAdminApi.convertToStudent(a)
      toast.success('Student record created from this application.')
      setConfirmConvert(false)
      app.refetch()
    } catch (e) {
      toast.error(/duplicate/i.test(e.message) ? 'A student record already exists for this application.' : e.message)
    } finally {
      setBusy(false)
    }
  }

  const viewDoc = async (path) => {
    try {
      const url = await storageApi.documentViewUrl(path)
      window.open(url, '_blank', 'noopener')
    } catch (e) {
      toast.error('Could not open the document (insufficient permission or expired link).')
    }
  }

  if (app.loading) {
    return <div className="card p-10 text-center text-sm text-slate-400">Loading application…</div>
  }
  if (app.error || !a) {
    return (
      <div className="card p-10 text-center">
        <p className="text-sm text-red-600">Could not load this application. {app.error?.message}</p>
        <Link to="/admin/admissions" className="btn btn-ghost btn-sm mt-4">← Back to list</Link>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div className="no-print flex flex-wrap items-center justify-between gap-3">
        <Link to="/admin/admissions" className="text-xs font-bold uppercase tracking-wider text-gold-600 hover:underline">← All applications</Link>
        <button className="btn btn-ghost btn-sm" onClick={() => window.print()}>
          <Icon name="print" size={14} /> Print application
        </button>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.7fr_1fr]">
        {/* ---------- details ---------- */}
        <div className="print-area space-y-5">
          {/* header */}
          <div className="card overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-4 bg-navy-950 px-6 py-5">
              <div>
                <div className="font-mono text-xs font-bold text-gold-300">{a.reference_no}</div>
                <h2 className="h-display mt-1 text-2xl font-bold text-white">{a.student_name}</h2>
                <div className="mt-1 text-xs text-navy-300">
                  {a.classes?.name || '—'} · {a.academic_years?.label || '—'} · submitted {fmtDateTime(a.created_at)}
                </div>
              </div>
              <span className={statusClass(a.status)}>{STATUS_LABEL[a.status]}</span>
            </div>
            <div className="grid gap-x-10 gap-y-0 px-6 py-2 sm:grid-cols-2">
              <Section title="Student information">
                <Row k="Full name" v={a.student_name} />
                <Row k="Date of birth" v={fmtDate(a.date_of_birth)} />
                <Row k="Gender" v={a.gender} />
                <Row k="Nationality" v={a.nationality} />
                <Row k="Address" v={a.present_address} />
              </Section>
              <Section title="Parent / guardian">
                <Row k="Name" v={a.guardian_name} />
                <Row k="Relation" v={a.guardian_relation} />
                <Row k="CNIC" v={a.guardian_cnic} />
                <Row k="Phone" v={a.guardian_phone} />
                <Row k="Email" v={a.guardian_email || '—'} />
                <Row k="Occupation" v={a.guardian_occupation || '—'} />
              </Section>
              <Section title="Academic history">
                <Row k="Class applying" v={a.classes?.name || '—'} />
                <Row k="Academic year" v={a.academic_years?.label || '—'} />
                <Row k="Previous school" v={a.previous_school} />
                <Row k="Last class passed" v={a.last_class_passed || '—'} />
                <Row k="Percentage" v={a.previous_percentage != null ? `${a.previous_percentage}%` : '—'} />
              </Section>
              <Section title="Review metadata">
                <Row k="Status" v={STATUS_LABEL[a.status]} />
                <Row k="Reviewed at" v={a.reviewed_at ? fmtDateTime(a.reviewed_at) : 'Not reviewed yet'} />
                <Row k="Remarks" v={a.remarks || '—'} />
              </Section>
            </div>
          </div>

          {/* documents */}
          <div className="card p-6">
            <h3 className="mb-4 text-xs font-black uppercase tracking-[0.18em] text-navy-900">Submitted documents</h3>
            {(a.documents || []).length === 0 ? (
              <p className="text-sm text-slate-400">No documents were uploaded with this application.</p>
            ) : (
              <ul className="grid gap-3 sm:grid-cols-2">
                {a.documents.map((d, i) => (
                  <li key={i} className="flex items-center gap-3 rounded-lg border border-navy-100 bg-navy-50/40 px-4 py-3">
                    <Icon name="doc" size={18} className="shrink-0 text-gold-600" />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-xs font-bold text-navy-900">{d.label}</div>
                      <div className="truncate text-[11px] text-slate-400">{d.name} · {fileSize(d.size)}</div>
                    </div>
                    <button className="btn btn-ghost btn-sm shrink-0" onClick={() => viewDoc(d.path)}>
                      <Icon name="eye" size={13} /> View
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <p className="mt-4 rounded bg-slate-50 px-3 py-2 text-[11px] leading-relaxed text-slate-400">
              Documents are stored in a <b>private</b> Supabase bucket. Links are temporary signed URLs — only signed-in
              admins with the admin role can open them (enforced by storage RLS).
            </p>
          </div>

          {/* remarks editor */}
          <div className="card no-print p-6">
            <h3 className="mb-4 text-xs font-black uppercase tracking-[0.18em] text-navy-900">Administrative remarks</h3>
            <Textarea
              rows={3}
              value={remarks ?? a.remarks ?? ''}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Internal notes or instructions visible in the applicant's status tracker…"
            />
            <button className="btn btn-navy btn-sm mt-3" onClick={saveRemarks}>
              <Icon name="check" size={13} /> Save remarks
            </button>
          </div>
        </div>

        {/* ---------- action panel ---------- */}
        <div className="no-print space-y-5">
          {/* decision */}
          <div className="card p-6">
            <h3 className="mb-4 text-xs font-black uppercase tracking-[0.18em] text-navy-900">Decision</h3>
            {a.status === 'pending' || a.status === 'correction_requested' ? (
              <div className="grid gap-2.5">
                <button className="btn btn-navy" onClick={() => setAction('approved')}>
                  <Icon name="check" size={15} /> Approve application
                </button>
                <button className="btn btn-ghost" onClick={() => setAction('correction_requested')}>
                  <Icon name="alert" size={15} /> Request corrections
                </button>
                <button className="btn btn-danger" onClick={() => setAction('rejected')}>
                  <Icon name="x" size={15} /> Reject application
                </button>
              </div>
            ) : (
              <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-xs leading-relaxed text-slate-500">
                This application has already been <b>{STATUS_LABEL[a.status]?.toLowerCase()}</b>. Status history is preserved
                below; remarks can still be updated.
              </div>
            )}

            {a.status === 'approved' && !hasStudent ? (
              <button className="btn btn-gold mt-4 w-full" onClick={() => setConfirmConvert(true)} disabled={busy}>
                <Icon name="grad" size={15} /> Convert to student record
              </button>
            ) : null}
            {hasStudent ? (
              <div className="mt-4 flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-xs font-bold text-green-700">
                <Icon name="check" size={14} /> Student record exists
                <Link to="/admin/students" className="ml-auto text-[10px] uppercase tracking-wider text-green-700 hover:underline">Open →</Link>
              </div>
            ) : null}
          </div>

          {/* history */}
          <div className="card p-6">
            <h3 className="mb-4 text-xs font-black uppercase tracking-[0.18em] text-navy-900">Status history</h3>
            {history.loading ? (
              <p className="text-sm text-slate-400">Loading…</p>
            ) : (
              <ol className="relative space-y-5 border-l border-slate-200 pl-5">
                {(history.data || []).map((h, i) => (
                  <li key={h.id || i} className="relative">
                    <span className={cn('absolute -left-[26px] top-1 h-3 w-3 rounded-full border-2 border-white', i === (history.data || []).length - 1 ? 'bg-gold-500' : 'bg-slate-300')} />
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={statusClass(h.status)}>{STATUS_LABEL[h.status] || h.status}</span>
                      <span className="text-[10px] font-semibold text-slate-400">{fmtDateTime(h.created_at)}</span>
                    </div>
                    {h.note ? <p className="mt-1 text-xs leading-relaxed text-slate-500">{h.note}</p> : null}
                    {h.profiles?.full_name ? <div className="mt-0.5 text-[10px] text-slate-400">by {h.profiles.full_name}</div> : null}
                  </li>
                ))}
                {(history.data || []).length === 0 ? <li className="text-sm text-slate-400">Submitted (no status changes yet).</li> : null}
              </ol>
            )}
          </div>
        </div>
      </div>

      {/* decision modal */}
      <ConfirmDialog
        open={!!action}
        onClose={() => setAction(null)}
        onConfirm={applyStatus}
        busy={busy}
        danger={action === 'rejected'}
        title={`Confirm: ${STATUS_LABEL[action] || ''}`}
        confirmLabel="Confirm decision"
        body={
          <>
            The applicant will see this status in the public tracker.{' '}
            {action === 'rejected' || action === 'correction_requested' ? 'Add a note explaining the decision:' : 'Optionally add a note:'}
            <textarea
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="textarea mt-3"
              placeholder={action === 'correction_requested' ? 'e.g. Date of birth does not match the certificate — please re-upload.' : 'Optional note…'}
            />
          </>
        }
      />

      <ConfirmDialog
        open={confirmConvert}
        onClose={() => setConfirmConvert(false)}
        onConfirm={convert}
        busy={busy}
        danger={false}
        title="Create student record?"
        confirmLabel="Create student"
        body={`A record for ${a?.student_name} (${a?.classes?.name}) will be created in the Students table, linked to this application. Duplicate conversion is blocked by the database.`}
      />
    </div>
  )
}

function Section({ title, children }) {
  return (
    <div className="border-b border-dotted border-slate-100 py-4 sm:border-none">
      <div className="mb-2.5 text-[10px] font-black uppercase tracking-[0.2em] text-gold-600">{title}</div>
      <dl className="space-y-1.5">{children}</dl>
    </div>
  )
}

function Row({ k, v }) {
  return (
    <div className="flex items-baseline justify-between gap-4 text-xs">
      <dt className="shrink-0 font-semibold text-slate-400">{k}</dt>
      <dd className="text-right font-bold text-navy-900">{v}</dd>
    </div>
  )
}
