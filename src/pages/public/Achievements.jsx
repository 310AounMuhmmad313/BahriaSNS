import { useMemo, useState } from 'react'
import { useAsync } from '../../hooks/useAsync'
import { contentApi } from '../../lib/api'
import { Reveal, RevealGroup } from '../../components/ui/motion'
import { PageHero, AsyncBlock } from '../../components/ui/Bits'
import Icon from '../../components/ui/icons'
import { cn } from '../../lib/utils'

const CATS = [
  ['all', 'All'],
  ['result', 'Examination Results'],
  ['award', 'Awards'],
  ['competition', 'Competitions'],
  ['scholarship', 'Scholarships'],
  ['alumni', 'Alumni'],
]

export default function Achievements() {
  const { data, loading, error } = useAsync(() => contentApi.achievements(), [])
  const [cat, setCat] = useState('all')

  const filtered = useMemo(() => {
    const rows = data || []
    return cat === 'all' ? rows : rows.filter((a) => a.category === cat)
  }, [data, cat])

  return (
    <>
      <PageHero
        kicker="Pride of our campus"
        title="Achievements & Alumni"
        text="Examination results, verified distinctions, competitions and scholarships. Every entry here is managed from the admin dashboard — only approved records are shown."
      />

      <section className="section-pad bg-white">
        <div className="container-x">
          <Reveal className="mb-10 flex flex-wrap justify-center gap-2">
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
          </Reveal>

          <AsyncBlock
            {...{ data: filtered, loading, error }}
            empty={<div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-6 py-12 text-center text-sm text-slate-400">No achievements published in this category yet.</div>}
          >
            <RevealGroup className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filtered.map((a, i) => (
                <article
                  key={a.id}
                  data-stagger
                  className={cn(
                    'group overflow-hidden rounded-lg border transition-all hover:-translate-y-1 hover:shadow-xl',
                    i === 0 && cat === 'all' ? 'border-gold-500/40 bg-gradient-to-b from-gold-100/50 to-white md:col-span-2 lg:row-span-1' : 'border-navy-100 bg-white'
                  )}
                >
                  {a.image_url ? (
                    <div className="h-44 overflow-hidden">
                      <img src={a.image_url} alt={a.title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />
                    </div>
                  ) : null}
                  <div className="p-6">
                    <div className="flex items-center justify-between gap-3">
                      <span className="badge badge-gold">{(a.category || 'award').replace('_', ' ')}</span>
                      {a.year ? <span className="h-display text-2xl font-bold text-navy-200">{a.year}</span> : null}
                    </div>
                    <h3 className="mt-3 text-lg font-bold leading-snug text-navy-900 group-hover:text-gold-600">{a.title}</h3>
                    {a.student_name ? (
                      <div className="mt-1.5 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-navy-500">
                        <Icon name="star" size={13} className="text-gold-500" /> {a.student_name}
                      </div>
                    ) : null}
                    <p className="mt-3 text-sm leading-relaxed text-slate-500">{a.description}</p>
                  </div>
                </article>
              ))}
            </RevealGroup>
          </AsyncBlock>

          <Reveal className="mt-12 rounded-lg border border-dashed border-slate-200 bg-slate-50 px-6 py-5 text-center text-xs leading-relaxed text-slate-400">
            Positions, marks and records shown here must always match official school documentation before being published.
          </Reveal>
        </div>
      </section>
    </>
  )
}
