import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useAsync } from '../../hooks/useAsync'
import { admissionsAdminApi, statsApi, auditApi } from '../../lib/api'
import { fmtDate, fmtDateTime, statusClass, STATUS_LABEL, cn } from '../../lib/utils'
import { AsyncBlock } from '../../components/ui/Bits'
import Icon from '../../components/ui/icons'

const greeting = () => {
  const h = new Date().getHours()
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'
}

export default function Dashboard() {
  const { profile } = useAuth()
  const counts = useAsync(() => statsApi.counts(), [])
  const breakdown = useAsync(() => statsApi.breakdown(), [])
  const recent = useAsync(() => admissionsAdminApi.list({ per: 6 }), [])
  const logs = useAsync(() => auditApi.list(), [])

  const name = (profile?.full_name || 'Admin').split(' ')[0]

  const cards = [
    { label: 'Total Applications', v: counts.data?.total, icon: 'doc', to: '/admin/admissions' },
    { label: 'Pending', v: counts.data?.pending, icon: 'clock', to: '/admin/admissions?status=pending', accent: 'text-amber-500' },
    { label: 'Approved', v: counts.data?.approved, icon: 'check', to: '/admin/admissions?status=approved', accent: 'text-green-600' },
    { label: 'Rejected', v: counts.data?.rejected, icon: 'x', to: '/admin/admissions?status=rejected', accent: 'text-red-500' },
    { label: 'Needs Correction', v: counts.data?.correction, icon: 'alert', to: '/admin/admissions?status=correction_requested', accent: 'text-orange-500' },
  ]

  const trend = buildTrend(breakdown.data?.byDay)
  const maxTrend = Math.max(1, ...trend.map((t) => t.count))
  const classRows = Object.entries(breakdown.data?.byClass || {}).sort((a, b) => b[1] - a[1])
  const maxClass = Math.max(1, ...classRows.map(([, v]) => v))

  return (
    <div className="space-y-7">
      {/* header */}
      <div className="rounded-xl bg-navy-950 p-7">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="text-xs font-bold uppercase tracking-[0.24em] text-gold-400">{greeting()}, {name}</div>
            <h2 className="h-display mt-1.5 text-2xl font-bold text-white md:text-3xl">Here's the current admissions overview.</h2>
          </div>
          <div className="flex gap-2.5">
            <Link to="/admin/notices" className="btn btn-outline btn-sm"><Icon name="bell" size={14} /> New notice</Link>
            <Link to="/admin/reports" className="btn btn-gold btn-sm"><Icon name="download" size={14} /> Export CSV</Link>
          </div>
        </div>
      </div>

      {/* stat cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">
        {cards.map((c) => (
          <Link key={c.label} to={c.to} className="card group p-5 transition-all hover:-translate-y-0.5 hover:shadow-lg">
            <div className="flex items-center justify-between">
              <span className={cn('text-3xl font-black tabular-nums', c.accent || 'text-navy-900')}>
                {counts.loading ? <span className="inline-block h-8 w-12 animate-pulse rounded bg-slate-100" /> : (c.v ?? 0)}
              </span>
              <Icon name={c.icon} size={20} className="text-slate-300 transition-colors group-hover:text-gold-500" />
            </div>
            <div className="mt-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">{c.label}</div>
          </Link>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        {/* trend */}
        <div className="card p-6">
          <div className="mb-5 flex items-center justify-between">
            <h3 className="text-xs font-black uppercase tracking-[0.18em] text-navy-900">Applications · last 14 days</h3>
            <Icon name="chart" size={16} className="text-gold-600" />
          </div>
          {breakdown.loading ? (
            <div className="h-36 animate-pulse rounded bg-slate-100" />
          ) : (
            <div className="flex h-36 items-end gap-1.5">
              {trend.map((t) => (
                <div key={t.day} className="group relative flex-1">
                  <div
                    className="w-full rounded-t bg-gradient-to-t from-navy-800 to-navy-500 transition-all group-hover:from-gold-600 group-hover:to-gold-400"
                    style={{ height: `${Math.max(4, (t.count / maxTrend) * 128)}px` }}
                  />
                  <span className="pointer-events-none absolute -top-7 left-1/2 hidden -translate-x-1/2 rounded bg-navy-950 px-1.5 py-0.5 text-[10px] font-bold text-white group-hover:block">
                    {t.count} · {t.day.slice(5)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* class-wise */}
        <div className="card p-6">
          <h3 className="mb-5 text-xs font-black uppercase tracking-[0.18em] text-navy-900">Class-wise applications</h3>
          {classRows.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-400">No applications yet.</p>
          ) : (
            <div className="max-h-44 space-y-3 overflow-y-auto pr-1">
              {classRows.map(([cls, v]) => (
                <div key={cls}>
                  <div className="mb-1 flex justify-between text-xs font-bold">
                    <span className="text-navy-800">{cls}</span>
                    <span className="text-slate-400">{v}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                    <div className="h-full rounded-full bg-gradient-to-r from-gold-600 to-gold-400" style={{ width: `${(v / maxClass) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* recent applications */}
      <div className="card overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <h3 className="text-xs font-black uppercase tracking-[0.18em] text-navy-900">Recent applications</h3>
          <Link to="/admin/admissions" className="text-xs font-bold uppercase tracking-wider text-gold-600 hover:underline">View all →</Link>
        </div>
        <AsyncBlock {...recent} empty={<p className="px-6 py-10 text-center text-sm text-slate-400">No applications received yet.</p>}>
          <div className="overflow-x-auto">
            <table className="tbl">
              <thead>
                <tr>
                  <th>Ref</th><th>Applicant</th><th>Class</th><th>Submitted</th><th>Status</th><th />
                </tr>
              </thead>
              <tbody>
                {recent.data?.rows.map((r) => (
                  <tr key={r.id}>
                    <td className="font-mono text-xs font-bold text-navy-800">{r.reference_no}</td>
                    <td className="font-semibold">{r.student_name}</td>
                    <td>{r.classes?.name || '—'}</td>
                    <td className="text-xs text-slate-400">{fmtDate(r.created_at)}</td>
                    <td><span className={statusClass(r.status)}>{STATUS_LABEL[r.status]}</span></td>
                    <td><Link to={`/admin/admissions/${r.id}`} className="text-xs font-bold text-gold-600 hover:underline">Review →</Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </AsyncBlock>
      </div>

      {/* notifications / activity */}
      <div className="grid gap-6 xl:grid-cols-2">
        <div className="card p-6">
          <h3 className="mb-4 text-xs font-black uppercase tracking-[0.18em] text-navy-900">Admin activity (audit log)</h3>
          <AsyncBlock {...logs} empty={<p className="py-6 text-center text-sm text-slate-400">No admin actions recorded yet.</p>}>
            <ul className="max-h-52 space-y-3 overflow-y-auto pr-1">
              {logs.data?.slice(0, 8).map((l) => (
                <li key={l.id} className="flex items-start gap-3 text-xs">
                  <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-gold-500" />
                  <span>
                    <b className="text-navy-900">{l.action.replace(/_/g, ' ')}</b>
                    {l.entity ? <span className="text-slate-400"> · {l.entity} {l.entity_id}</span> : null}
                    <span className="block text-[10px] text-slate-400">{fmtDateTime(l.created_at)} · {l.actor_email || 'system'}</span>
                  </span>
                </li>
              ))}
            </ul>
          </AsyncBlock>
        </div>

        <div className="card p-6">
          <h3 className="mb-4 text-xs font-black uppercase tracking-[0.18em] text-navy-900">Notifications</h3>
          <ul className="space-y-3 text-sm">
            <li className="flex items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
              <Icon name="alert" size={17} className="text-amber-500" />
              <span className="flex-1 text-xs font-semibold text-amber-800">
                {counts.data?.pending ?? 0} application(s) awaiting review
              </span>
              <Link to="/admin/admissions?status=pending" className="text-[10px] font-black uppercase tracking-wider text-amber-700 hover:underline">Review</Link>
            </li>
            <li className="flex items-center gap-3 rounded-lg border border-navy-100 bg-navy-50/60 px-4 py-3">
              <Icon name="mail" size={17} className="text-navy-500" />
              <span className="flex-1 text-xs font-semibold text-navy-900">{counts.data?.unread ?? 0} unread enquiry message(s)</span>
              <Link to="/admin/messages" className="text-[10px] font-black uppercase tracking-wider text-gold-600 hover:underline">Open</Link>
            </li>
            <li className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3">
              <Icon name="star" size={17} className="text-gold-600" />
              <span className="flex-1 text-xs font-semibold text-slate-600">Keep website content fresh — update notices & events regularly.</span>
              <Link to="/admin/content" className="text-[10px] font-black uppercase tracking-wider text-gold-600 hover:underline">Content</Link>
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}

function buildTrend(byDay = {}) {
  const days = []
  const now = new Date()
  for (let i = 13; i >= 0; i--) {
    const d = new Date(now)
    d.setDate(now.getDate() - i)
    const key = d.toISOString().slice(0, 10)
    days.push({ day: key, count: byDay[key] || 0 })
  }
  return days
}
