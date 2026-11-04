import { useMemo, useState } from 'react'
import { useAsync } from '../../hooks/useAsync'
import { contentApi } from '../../lib/api'
import { Reveal, RevealGroup } from '../../components/ui/motion'
import { PageHero, SectionHeading, AsyncBlock } from '../../components/ui/Bits'
import { Modal } from '../../components/ui/Modal'
import Icon from '../../components/ui/icons'
import { cn } from '../../lib/utils'

const CATS = [
  ['all', 'All'],
  ['principal', 'Principal'],
  ['vice_principal', 'Vice Principal'],
  ['teacher', 'Teachers'],
  ['staff', 'Staff'],
]

export default function Faculty() {
  const { data, loading, error } = useAsync(() => contentApi.faculty(), [])
  const [cat, setCat] = useState('all')
  const [q, setQ] = useState('')
  const [active, setActive] = useState(null)

  const filtered = useMemo(() => {
    let rows = data || []
    if (cat !== 'all') rows = rows.filter((f) => f.category === cat)
    if (q.trim()) {
      const s = q.toLowerCase()
      rows = rows.filter((f) => [f.name, f.designation, f.department, f.bio].some((v) => (v || '').toLowerCase().includes(s)))
    }
    return rows
  }, [data, cat, q])

  return (
    <>
      <PageHero
        kicker="Our people"
        title="Faculty & Management"
        text="Principal, vice principal, teachers and authorized staff. Profiles below are database-driven — update them any time from the admin dashboard."
      />

      <section className="section-pad bg-white">
        <div className="container-x">
          {/* filters */}
          <Reveal className="mb-10 flex flex-col items-center justify-between gap-4 md:flex-row">
            <div className="flex flex-wrap justify-center gap-2">
              {CATS.map(([v, label]) => (
                <button
                  key={v}
                  onClick={() => setCat(v)}
                  className={cn(
                    'rounded-full border px-4 py-1.5 text-xs font-bold uppercase tracking-wider transition-all',
                    cat === v ? 'border-gold-500 bg-gold-500 text-navy-950' : 'border-navy-100 bg-white text-slate-500 hover:border-gold-400 hover:text-gold-600'
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
            <div className="relative w-full md:w-72">
              <Icon name="search" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search by name, subject…"
                className="input pl-9"
                aria-label="Search faculty"
              />
            </div>
          </Reveal>

          <AsyncBlock
            {...{ data: filtered, loading, error }}
            empty={<div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-6 py-12 text-center text-sm text-slate-400">No profiles match your search. Faculty profiles are added in Admin → Faculty.</div>}
          >
            <RevealGroup className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filtered.map((f) => (
                <button key={f.id} data-stagger onClick={() => setActive(f)} className="text-left">
                  <article className="card group h-full overflow-hidden transition-all hover:-translate-y-1 hover:shadow-xl">
                    <div className="relative h-56 overflow-hidden bg-navy-900">
                      {f.photo_url ? (
                        <img src={f.photo_url} alt={f.name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />
                      ) : (
                        <div className="flex h-full items-center justify-center text-navy-500">
                          <Icon name="users" size={44} />
                        </div>
                      )}
                      <span className="absolute left-3 top-3 badge badge-gold">{f.category.replace('_', ' ')}</span>
                    </div>
                    <div className="p-5">
                      <div className="font-bold text-navy-900 group-hover:text-gold-600">{f.name}</div>
                      <div className="mt-0.5 text-xs font-bold uppercase tracking-wider text-gold-600">{f.designation}</div>
                      {f.department ? <div className="mt-1 text-xs text-slate-400">{f.department}</div> : null}
                      <p className="clamp-2 mt-2.5 text-xs leading-relaxed text-slate-500">{f.bio}</p>
                    </div>
                  </article>
                </button>
              ))}
            </RevealGroup>
          </AsyncBlock>
        </div>
      </section>

      <Modal open={!!active} onClose={() => setActive(null)} title={active?.name || ''} wide>
        {active ? (
          <div className="flex flex-col gap-5 sm:flex-row">
            {active.photo_url ? (
              <img src={active.photo_url} alt={active.name} className="h-44 w-44 shrink-0 rounded-lg object-cover" />
            ) : (
              <div className="flex h-44 w-44 shrink-0 items-center justify-center rounded-lg bg-navy-900 text-navy-400"><Icon name="users" size={40} /></div>
            )}
            <div>
              <span className="badge badge-gold">{active.category.replace('_', ' ')}</span>
              <div className="mt-2 text-lg font-bold text-navy-900">{active.designation}</div>
              {active.department ? <div className="text-sm text-slate-500">{active.department}</div> : null}
              {active.qualification ? <div className="mt-1 text-sm font-semibold text-navy-700">{active.qualification}</div> : null}
              <p className="mt-3 text-sm leading-relaxed text-slate-600">{active.bio}</p>
            </div>
          </div>
        ) : null}
      </Modal>
    </>
  )
}
