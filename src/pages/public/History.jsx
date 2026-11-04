import { useAsync } from '../../hooks/useAsync'
import { contentApi } from '../../lib/api'
import { useParallax } from '../../hooks/useSmoothScroll'
import { useRef } from 'react'
import { Reveal, RevealGroup } from '../../components/ui/motion'
import { PageHero, SectionHeading, AsyncBlock } from '../../components/ui/Bits'
import Icon from '../../components/ui/icons'
import { fmtDate } from '../../lib/utils'

export default function History() {
  const { data, loading, error } = useAsync(() => contentApi.history(), [])
  const imgRef = useRef(null)
  useParallax(imgRef, { y: 50 })

  const milestones = (data || []).filter((h) => h.item_type === 'milestone')
  const visitors = (data || []).filter((h) => h.item_type === 'visit')

  return (
    <>
      <PageHero
        kicker="Our heritage"
        title="School History & Important Visitors"
        text="Institutional milestones, ceremonies and distinguished visits — including the school's Pakistan Navy and PNET heritage. Entries are database-managed and clearly marked until verified."
      />

      {/* heritage band */}
      <section className="border-b border-navy-800 bg-navy-950 py-10">
        <div className="container-x flex flex-col items-center justify-center gap-6 text-center md:flex-row md:gap-12">
          <Reveal className="flex items-center gap-4">
            <img src="/logos/navy-badge.png" alt="Pakistan Navy emblem" className="h-14 w-14 object-contain" />
            <div className="text-left">
              <div className="font-bold text-white">Pakistan Navy heritage</div>
              <div className="text-xs uppercase tracking-[0.2em] text-navy-400">Official history to be provided</div>
            </div>
          </Reveal>
          <span className="hidden h-10 w-px bg-navy-700 md:block" />
          <Reveal delay={0.1} className="flex items-center gap-4">
            <img src="/logos/bahria-crest.png" alt="School crest" className="h-14 w-14 object-contain" />
            <div className="text-left">
              <div className="font-bold text-white">Institutional identity</div>
              <div className="text-xs uppercase tracking-[0.2em] text-navy-400">Establishment year on approved record</div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* timeline */}
      <section className="bg-navy-section section-pad">
        <div className="container-x">
          <SectionHeading dark kicker="Milestones" title="Historical timeline" text="Add or edit milestones any time from Admin → History — no code required." />
          <AsyncBlock
            {...{ data: milestones, loading, error }}
            empty={<div className="rounded-lg border border-dashed border-navy-700 px-6 py-10 text-center text-sm text-navy-400">No milestones published yet.</div>}
          >
            <div className="relative mx-auto max-w-3xl">
              <div className="absolute bottom-0 left-[19px] top-0 w-px bg-gradient-to-b from-gold-500/60 via-navy-600 to-transparent md:left-1/2" />
              <RevealGroup className="space-y-10">
                {milestones.map((m, i) => (
                  <div key={m.id} data-stagger className={`relative flex gap-8 md:w-1/2 ${i % 2 ? 'md:ml-auto md:pl-10' : 'md:flex-row-reverse md:pr-10 md:text-right'}`}>
                    <span className="timeline-dot absolute left-0 top-1.5 hidden md:block" style={i % 2 ? { left: '-7px' } : { right: '-7px' }} />
                    <div className="ml-10 md:ml-0">
                      <div className="h-display text-2xl font-bold text-gold-400">{m.date_label || fmtDate(m.sort_date)}</div>
                      <div className="mt-1 font-bold text-white">{m.title}</div>
                      <p className="mt-1.5 text-sm leading-relaxed text-navy-300">{m.description}</p>
                    </div>
                  </div>
                ))}
              </RevealGroup>
            </div>
          </AsyncBlock>
        </div>
      </section>

      {/* visitors */}
      <section className="section-pad bg-white">
        <div className="container-x">
          <SectionHeading
            kicker="Distinguished guests"
            title="Important visitors & ceremonies"
            text="Visitor names, designations and dates are published only when verified by the school administration."
          />
          <AsyncBlock
            {...{ data: visitors, loading, error }}
            empty={<div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-6 py-10 text-center text-sm text-slate-400">No visitor records published yet.</div>}
          >
            <RevealGroup className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {visitors.map((v) => (
                <article key={v.id} data-stagger className="card overflow-hidden transition-all hover:-translate-y-1 hover:shadow-xl">
                  {v.image_url ? (
                    <div className="h-52 overflow-hidden">
                      <img src={v.image_url} alt={v.title} className="h-full w-full object-cover" loading="lazy" />
                    </div>
                  ) : (
                    <div className="flex h-32 items-center justify-center bg-navy-50 text-navy-300">
                      <Icon name="star" size={30} />
                    </div>
                  )}
                  <div className="p-6">
                    <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.18em] text-gold-600">
                      <Icon name="calendar" size={13} /> {v.date_label || fmtDate(v.sort_date)}
                    </div>
                    <h3 className="mt-2.5 text-lg font-bold leading-snug text-navy-900">{v.title}</h3>
                    {v.visitor_name ? (
                      <div className="mt-2 text-sm">
                        <b className="text-navy-800">{v.visitor_name}</b>
                        {v.visitor_designation ? <span className="block text-xs text-slate-500">{v.visitor_designation}</span> : null}
                      </div>
                    ) : null}
                    <p className="mt-3 text-sm leading-relaxed text-slate-500">{v.description}</p>
                  </div>
                </article>
              ))}
            </RevealGroup>
          </AsyncBlock>
        </div>
      </section>
    </>
  )
}
