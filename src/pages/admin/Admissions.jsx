import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useAsync } from '../../hooks/useAsync'
import { admissionsAdminApi, contentApi } from '../../lib/api'
import { fmtDate, statusClass, STATUS_LABEL, cn } from '../../lib/utils'
import { AsyncBlock } from '../../components/ui/Bits'
import Icon from '../../components/ui/icons'
import { downloadCsv } from '../../lib/utils'

const PER = 12

export default function AdmissionsAdmin() {
  const [params, setParams] = useSearchParams()
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [sort, setSort] = useState('newest')
  const [exporting, setExporting] = useState(false)

  const status = params.get('status') || ''
  const classId = params.get('class') || ''
  const classes = useAsync(() => contentApi.classes(), [])
  const list = useAsync(
    () => admissionsAdminApi.list({ search, status, classId, page, per: PER, sort }),
    [search, status, classId, page, sort]
  )

  const setParam = (key, value) => {
    const next = new URLSearchParams(params)
    if (value) next.set(key, value)
    else next.delete(key)
    setParams(next, { replace: true })
    setPage(1)
  }

  const total = list.data?.total || 0
  const pages = Math.max(1, Math.ceil(total / PER))

  const exportCsv = async () => {
    setExporting(true)
    try {
      const rows = await admissionsAdminApi.exportAll({ status, classId })
      downloadCsv(
        rows.map((r) => ({
          reference_no: r.reference_no,
          student_name: r.student_name,
          date_of_birth: r.date_of_birth,
          gender: r.gender,
          class: r.classes?.name || '',
          academic_year: r.academic_years?.label || '',
          guardian_name: r.guardian_name,
          guardian_relation: r.guardian_relation,
          guardian_phone: r.guardian_phone,
          guardian_email: r.guardian_email,
          guardian_cnic: r.guardian_cnic,
          previous_school: r.previous_school,
          last_class_passed: r.last_class_passed,
          percentage: r.previous_percentage,
          status: STATUS_LABEL[r.status] || r.status,
          remarks: r.remarks || '',
          submitted_at: r.created_at,
          reviewed_at: r.reviewed_at || '',
        })),
        `admissions-${new Date().toISOString().slice(0, 10)}.csv`
      )
    } catch (e) {
      console.error(e)
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="space-y-5">
      {/* filters */}
      <div className="card flex flex-wrap items-end gap-3 p-4">
        <div className="relative min-w-[220px] flex-1">
          <label className="label">Search</label>
          <Icon name="search" size={15} className="absolute left-3 top-[calc(50%+8px)] -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
            placeholder="Reference no, name or phone…"
            className="input pl-9"
          />
        </div>
        <div className="w-40">
          <label className="label">Status</label>
          <select value={status} onChange={(e) => setParam('status', e.target.value)} className="select">
            <option value="">All statuses</option>
            {Object.entries(STATUS_LABEL).map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </select>
        </div>
        <div className="w-40">
          <label className="label">Class</label>
          <select value={classId} onChange={(e) => setParam('class', e.target.value)} className="select">
            <option value="">All classes</option>
            {(classes.data || []).map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <div className="w-36">
          <label className="label">Sort</label>
          <select value={sort} onChange={(e) => setSort(e.target.value)} className="select">
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
          </select>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={exportCsv} disabled={exporting}>
          <Icon name="download" size={14} /> {exporting ? 'Exporting…' : 'CSV'}
        </button>
      </div>

      {/* table */}
      <div className="card overflow-hidden">
        <AsyncBlock {...list} empty={<p className="px-6 py-12 text-center text-sm text-slate-400">No applications match these filters.</p>}>
          <div className="overflow-x-auto">
            <table className="tbl">
              <thead>
                <tr>
                  <th>Ref</th><th>Applicant</th><th>Class</th><th>Guardian</th><th>Submitted</th><th>Status</th><th />
                </tr>
              </thead>
              <tbody>
                {list.data?.rows.map((r) => (
                  <tr key={r.id}>
                    <td className="font-mono text-xs font-bold text-navy-800">{r.reference_no}</td>
                    <td>
                      <div className="font-semibold text-navy-900">{r.student_name}</div>
                      <div className="text-[11px] text-slate-400">{r.gender} · {fmtDate(r.date_of_birth)}</div>
                    </td>
                    <td>{r.classes?.name || '—'}<div className="text-[11px] text-slate-400">{r.academic_years?.label}</div></td>
                    <td>
                      <div className="text-xs font-semibold">{r.guardian_name}</div>
                      <div className="text-[11px] text-slate-400">{r.guardian_phone}</div>
                    </td>
                    <td className="text-xs text-slate-400">{fmtDate(r.created_at)}</td>
                    <td><span className={statusClass(r.status)}>{STATUS_LABEL[r.status]}</span></td>
                    <td>
                      <Link to={`/admin/admissions/${r.id}`} className="btn btn-ghost btn-sm">Review <Icon name="chevronRight" size={13} /></Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* pagination */}
          <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3.5 text-xs text-slate-500">
            <span>
              Showing <b>{(page - 1) * PER + 1}–{Math.min(page * PER, total)}</b> of <b>{total}</b>
            </span>
            <div className="flex items-center gap-1.5">
              <button className="btn btn-ghost btn-sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                <Icon name="chevronLeft" size={13} />
              </button>
              <span className="px-2 font-bold text-navy-900">{page} / {pages}</span>
              <button className="btn btn-ghost btn-sm" disabled={page >= pages} onClick={() => setPage((p) => p + 1)}>
                <Icon name="chevronRight" size={13} />
              </button>
            </div>
          </div>
        </AsyncBlock>
      </div>
    </div>
  )
}
