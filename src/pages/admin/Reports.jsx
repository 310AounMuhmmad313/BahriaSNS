import { useState } from 'react'
import { useAsync } from '../../hooks/useAsync'
import { useToast } from '../../context/ToastContext'
import { useAuth } from '../../context/AuthContext'
import { admissionsAdminApi, statsApi, auditApi, audit, contentApi } from '../../lib/api'
import { downloadCsv, fmtDate, fmtDateTime, STATUS_LABEL, cn } from '../../lib/utils'
import Icon from '../../components/ui/icons'

export default function ReportsAdmin() {
  const toast = useToast()
  const { profile } = useAuth()
  const classes = useAsync(() => contentApi.classes(), [])
  const counts = useAsync(() => statsApi.counts(), [])
  const breakdown = useAsync(() => statsApi.breakdown(), [])
  const logs = useAsync(() => auditApi.list(), [])

  const [status, setStatus] = useState('')
  const [classId, setClassId] = useState('')
  const [busy, setBusy] = useState(false)

  const exportCsv = async () => {
    setBusy(true)
    try {
      const rows = await admissionsAdminApi.exportAll({ status, classId })
      if (!rows.length) {
        toast.error('No applications match this filter.')
        return
      }
      await audit('export_csv', 'admissions', `${rows.length} rows`, { status, classId })
      downloadCsv(
        rows.map((r) => ({
          reference_no: r.reference_no,
          student_name: r.student_name,
          date_of_birth: r.date_of_birth,
          gender: r.gender,
          class: r.classes?.name || '',
          academic_year: r.academic_years?.label || '',
          guardian_name: r.guardian_name,
          guardian_phone: r.guardian_phone,
          guardian_email: r.guardian_email,
          status: STATUS_LABEL[r.status] || r.status,
          submitted_at: r.created_at,
        })),
        `admissions-report-${new Date().toISOString().slice(0, 10)}.csv`
      )
      toast.success(`Exported ${rows.length} row(s) to CSV.`)
    } catch (e) {
      toast.error(e.message || 'Export failed.')
    } finally {
      setBusy(false)
    }
  }

  const classRows = Object.entries(breakdown.data?.byClass || {}).sort((a, b) => b[1] - a[1])

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-2">
        {/* CSV export */}
        <div className="card p-6">
          <h3 className="text-xs font-black uppercase tracking-[0.18em] text-navy-900">Export admission data (CSV)</h3>
          <div className="gold-line mt-3 mb-5" />
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Status filter</label>
              <select value={status} onChange={(e) => setStatus(e.target.value)} className="select">
                <option value="">All statuses</option>
                {Object.entries(STATUS_LABEL).map(([v, l]) => (
                  <option key={v} value={v}>{l}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Class filter</label>
              <select value={classId} onChange={(e) => setClassId(e.target.value)} className="select">
                <option value="">All classes</option>
                {(classes.data || []).map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>
          <button className="btn btn-gold mt-5" onClick={exportCsv} disabled={busy}>
            <Icon name="download" size={15} /> {busy ? 'Preparing…' : 'Download CSV'}
          </button>
          <p className="mt-3 text-[11px] leading-relaxed text-slate-400">
            Opens directly in Excel. The export action is recorded in the audit log with your account email.
          </p>
        </div>

        {/* printable summary */}
        <div className="card p-6">
          <div className="no-print">
            <h3 className="text-xs font-black uppercase tracking-[0.18em] text-navy-900">Printable summary report</h3>
            <div className="gold-line mt-3 mb-5" />
          </div>
          <div className="print-area">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <div className="h-display text-lg font-bold text-navy-900">Admissions Summary</div>
                <div className="text-[11px] text-slate-400">Generated {fmtDateTime(new Date())} · by {profile?.email}</div>
              </div>
              <img src="/logos/bahria-crest.png" alt="" className="h-12 w-12 object-contain" />
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
              {[
                ['Total', counts.data?.total],
                ['Pending', counts.data?.pending],
                ['Approved', counts.data?.approved],
                ['Rejected', counts.data?.rejected],
                ['Needs correction', counts.data?.correction],
                ['Unread enquiries', counts.data?.unread],
              ].map(([k, v]) => (
                <div key={k} className="rounded border border-slate-200 px-3 py-2.5">
                  <div className="text-2xl font-black text-navy-900">{v ?? '—'}</div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{k}</div>
                </div>
              ))}
            </div>
            {classRows.length ? (
              <table className="tbl mt-5">
                <thead>
                  <tr><th>Class</th><th>Applications</th></tr>
                </thead>
                <tbody>
                  {classRows.map(([c, v]) => (
                    <tr key={c}><td className="font-semibold">{c}</td><td>{v}</td></tr>
                  ))}
                </tbody>
              </table>
            ) : null}
          </div>
          <button className="btn btn-navy no-print mt-5" onClick={() => window.print()}>
            <Icon name="print" size={15} /> Print summary
          </button>
        </div>
      </div>

      {/* audit log */}
      <div className="card overflow-hidden">
        <div className="border-b border-slate-100 px-6 py-4">
          <h3 className="text-xs font-black uppercase tracking-[0.18em] text-navy-900">Audit log — important admin actions</h3>
        </div>
        {logs.loading ? (
          <p className="px-6 py-8 text-center text-sm text-slate-400">Loading…</p>
        ) : (logs.data || []).length === 0 ? (
          <p className="px-6 py-8 text-center text-sm text-slate-400">No admin actions recorded yet. Approvals, deletions, content edits and exports will be logged here.</p>
        ) : (
          <div className="max-h-96 overflow-auto">
            <table className="tbl">
              <thead>
                <tr><th>When</th><th>Admin</th><th>Action</th><th>Entity</th><th>Details</th></tr>
              </thead>
              <tbody>
                {logs.data.map((l) => (
                  <tr key={l.id}>
                    <td className="whitespace-nowrap text-xs text-slate-500">{fmtDateTime(l.created_at)}</td>
                    <td className="text-xs font-semibold text-navy-800">{l.actor_email || '—'}</td>
                    <td><span className={cn('badge', /delete|reject/.test(l.action) ? 'badge-rejected' : 'badge-navy')}>{l.action.replace(/_/g, ' ')}</span></td>
                    <td className="text-xs">{l.entity}{l.entity_id ? ` · ${l.entity_id}` : ''}</td>
                    <td className="max-w-[240px] truncate text-[11px] text-slate-400">{l.details ? JSON.stringify(l.details) : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
