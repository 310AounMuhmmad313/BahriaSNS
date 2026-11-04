import { useMemo, useState } from 'react'
import { useAsync } from '../../hooks/useAsync'
import { contentApi } from '../../lib/api'
import { fmtDateTime } from '../../lib/utils'
import { Reveal, RevealGroup } from '../../components/ui/motion'
import { PageHero, AsyncBlock } from '../../components/ui/Bits'
import { Modal } from '../../components/ui/Modal'
import Icon from '../../components/ui/icons'
import { cn } from '../../lib/utils'

const TABS = [
  ['all', 'All'],
  ['urgent', 'Urgent'],
  ['holiday', 'Holidays'],
  ['admission', 'Admissions'],
  ['event', 'Events'],
  ['general', 'General'],
]

const badgeFor = (n) => {
  if (n.is_emergency) return 'badge badge-urgent'
  if (n.category === 'holiday') return 'badge badge-gold'
  if (n.category === 'admission') return 'badge badge-approved'
  return 'badge badge-navy'
}

export default function Notices() {
  const { data, loading, error } = useAsync(() => contentApi.notices(), [])
  const [tab, setTab] = useState('all')
  const [active, setActive] = useState(null)

  const list = useMemo(() => {
    let rows = data || []
    if (tab === 'urgent') rows = rows.filter((n) => n.is_emergency || n.category === 'urgent')
    else if (tab !== 'all') rows = rows.filter((n) => n.category === tab)
    // pinned first, then newest
    return [...rows].sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0) || new Date(b.publish_at || b.created_at) - new Date(a.publish_at || a.created_at))
  }, [data, tab])

  return (
    <>
      <PageHero
        kicker="Notice board"
        title="Notices & Updates"
        text="Holidays, early closures, urgent announcements, admission updates and school notices — published live by the administration."
      />

      <section className="section-pad bg-white">
        <div className="container-x">
          <Reveal className="mb-10 flex flex-wrap justify-center gap-2">
            {TABS.map(([v, label]) => (
              <button
                key={v}
                onClick={() => setTab(v)}
                className={cn(
                  'rounded-full border px-4 py-1.5 text-xs font-bold uppercase tracking-wider transition-all',
                  tab === v ? 'border-gold-500 bg-gold-500 text-navy-950' : 'border-navy-100 bg-white text-slate-500 hover:border-gold-400 hover:text-gold-600'
                )}
              >
                {label}
              </button>
            ))}
          </Reveal>

          <AsyncBlock
            {...{ data: list, loading, error }}
            empty={<div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-6 py-12 text-center text-sm text-slate-400">No notices in this category right now. Admins publish notices from the dashboard — including sudden holidays and early closures.</div>}
          >
            <RevealGroup className="space-y-4">
              {list.map((n) => (
                <article
                  key={n.id}
                  data-stagger
                  className={cn(
                    'group rounded-lg border bg-white p-5 transition-all hover:-translate-y-0.5 hover:shadow-lg md:p-6',
                    n.is_emergency ? 'border-red-300 bg-red-50/40' : 'border-navy-100'
                  )}
                >
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className={badgeFor(n)}>{n.is_emergency ? 'Urgent' : n.category}</span>
                    {n.pinned ? <span className="badge badge-gold">Pinned</span> : null}
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                      Published {fmtDateTime(n.publish_at || n.created_at)}
                      {n.expires_at ? ` · expires ${fmtDateTime(n.expires_at)}` : ''}
                    </span>
                  </div>
                  <div className="mt-3 flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <h3 className="text-lg font-bold leading-snug text-navy-900">{n.title}</h3>
                      <p className="clamp-2 mt-1.5 text-sm leading-relaxed text-slate-500">{n.body}</p>
                    </div>
                    <button className="btn btn-ghost btn-sm shrink-0" onClick={() => setActive(n)}>
                      Read
                    </button>
                  </div>
                  {n.media_url && n.media_type === 'image' ? (
                    <img src={n.media_url} alt="" className="mt-4 max-h-56 rounded-lg object-cover" loading="lazy" />
                  ) : null}
                </article>
              ))}
            </RevealGroup>
          </AsyncBlock>
        </div>
      </section>

      <Modal open={!!active} onClose={() => setActive(null)} title={active?.title || 'Notice'} wide>
        {active ? (
          <div>
            <div className="flex flex-wrap items-center gap-2.5 text-xs text-slate-400">
              <span className={badgeFor(active)}>{active.is_emergency ? 'Urgent' : active.category}</span>
              <span>{fmtDateTime(active.publish_at || active.created_at)}</span>
              {active.audience && active.audience !== 'all' ? <span className="badge badge-gray">For: {active.audience}</span> : null}
            </div>
            {active.media_url && active.media_type === 'image' ? (
              <img src={active.media_url} alt="" className="mt-4 max-h-80 w-full rounded-lg object-contain" />
            ) : null}
            {active.media_url && active.media_type === 'video' ? (
              <video src={active.media_url} controls className="mt-4 w-full rounded-lg" />
            ) : null}
            <p className="mt-4 whitespace-pre-line text-[15px] leading-relaxed text-slate-700">{active.body}</p>
            {active.expires_at ? (
              <p className="mt-4 flex items-center gap-2 rounded bg-slate-50 px-3 py-2 text-xs text-slate-500">
                <Icon name="clock" size={13} /> This notice expires on {fmtDateTime(active.expires_at)}.
              </p>
            ) : null}
          </div>
        ) : null}
      </Modal>
    </>
  )
}
