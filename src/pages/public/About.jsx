import { useSettings } from '../../hooks/useSiteSettings'
import { useAsync } from '../../hooks/useAsync'
import { contentApi } from '../../lib/api'
import { parseKv, fmtDate } from '../../lib/utils'
import { Reveal, RevealGroup } from '../../components/ui/motion'
import { PageHero, SectionHeading, AsyncBlock } from '../../components/ui/Bits'
import Icon from '../../components/ui/icons'

export default function About() {
  const { get } = useSettings()
  const history = useAsync(() => contentApi.history(), [])
  const faculty = useAsync(() => contentApi.faculty(), [])
  const values = parseKv(get('home.values'))
  const leadership = (faculty.data || []).filter((f) => ['principal', 'vice_principal'].includes(f.category))
  const milestones = (history.data || []).filter((h) => h.item_type === 'milestone')

  return (
    <>
      <PageHero kicker="Our school • Our values" title={get('about.history_title')} text="Academic learning, character development and a spirit of service — together on one campus.">
        <div className="mt-8 flex flex-wrap gap-8">
          {values.slice(0, 3).map((v, i) => (
            <Reveal key={v.t} delay={0.1 * i} y={14}>
              <div className="flex items-center gap-3">
                <span className="h-display text-3xl font-bold text-gold-500">{String(i + 1).padStart(2, '0')}</span>
                <span className="text-sm font-bold uppercase tracking-[0.2em] text-navy-200">{v.t}</span>
              </div>
            </Reveal>
          ))}
        </div>
      </PageHero>

      {/* history + mission */}
      <section className="section-pad bg-white">
        <div className="container-x grid gap-14 lg:grid-cols-2">
          <Reveal>
            <div className="kicker">Our story</div>
            <h2 className="h-display mt-3 text-3xl font-bold text-navy-900 md:text-4xl">A foundation of discipline & knowledge</h2>
            <div className="gold-line mt-6" />
            <p className="mt-6 leading-relaxed text-slate-600">{get('about.history_text')}</p>
            <div className="mt-8 overflow-hidden rounded-lg">
              <img src="/placeholders/campus-1.png" alt="Campus (placeholder)" className="h-64 w-full object-cover" loading="lazy" />
            </div>
          </Reveal>
          <div className="space-y-6">
            <Reveal delay={0.1}>
              <div className="card p-8">
                <div className="flex items-center gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-full bg-navy-900 text-gold-400"><Icon name="flag" size={20} /></span>
                  <h3 className="h-display text-2xl font-bold text-navy-900">Mission</h3>
                </div>
                <p className="mt-4 leading-relaxed text-slate-600">{get('home.mission')}</p>
              </div>
            </Reveal>
            <Reveal delay={0.2}>
              <div className="card p-8">
                <div className="flex items-center gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-full bg-navy-900 text-gold-400"><Icon name="globe" size={20} /></span>
                  <h3 className="h-display text-2xl font-bold text-navy-900">Vision</h3>
                </div>
                <p className="mt-4 leading-relaxed text-slate-600">{get('home.vision')}</p>
              </div>
            </Reveal>
            <Reveal delay={0.3}>
              <div className="navy-card p-8">
                <h3 className="mb-5 text-xs font-black uppercase tracking-[0.24em] text-gold-400">What we stand for</h3>
                <ul className="space-y-4">
                  {values.map((v) => (
                    <li key={v.t} className="flex gap-3">
                      <Icon name="check" size={17} className="mt-0.5 shrink-0 text-gold-400" />
                      <span>
                        <b className="text-white">{v.t}.</b>{' '}
                        <span className="text-navy-300">{v.d}</span>
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* milestones timeline */}
      <section className="bg-navy-section section-pad">
        <div className="container-x">
          <SectionHeading dark kicker="Milestones" title="Our journey so far" text="Key moments from the institution's history. (Timeline entries are sample placeholders until approved content is provided.)" />
          <AsyncBlock {...history} dark empty={<div className="rounded-lg border border-dashed border-navy-700 px-6 py-10 text-center text-sm text-navy-400">No milestones published yet — add them in Admin → History.</div>}>
            <div className="relative mx-auto max-w-3xl">
              <div className="absolute bottom-0 left-[19px] top-0 w-px bg-gradient-to-b from-gold-500/60 via-navy-600 to-transparent md:left-1/2" />
              <RevealGroup className="space-y-10">
                {milestones.map((m, i) => (
                  <div key={m.id} data-stagger className={`relative flex gap-8 md:w-1/2 ${i % 2 ? 'md:ml-auto md:pl-10' : 'md:flex-row-reverse md:pr-10 md:text-right'}`}>
                    <span className="timeline-dot absolute left-0 top-1.5 md:left-auto md:right-[-7px]" style={i % 2 ? { left: '-7px' } : {}} />
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

      {/* leadership */}
      <section className="section-pad bg-white">
        <div className="container-x">
          <SectionHeading kicker="Leadership" title="Principal & management messages" text="Portraits and messages below are placeholders — add approved profiles in Admin → Faculty." />
          <AsyncBlock {...faculty} empty={<div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-6 py-10 text-center text-sm text-slate-400">Leadership profiles appear here once added in Admin → Faculty.</div>}>
            <RevealGroup className="grid gap-6 md:grid-cols-2">
              {leadership.map((p) => (
                <div key={p.id} data-stagger className="card flex flex-col gap-5 p-7 sm:flex-row">
                  {p.photo_url ? (
                    <img src={p.photo_url} alt={p.name} className="h-28 w-28 shrink-0 rounded-lg object-cover" loading="lazy" />
                  ) : (
                    <div className="flex h-28 w-28 shrink-0 items-center justify-center rounded-lg bg-navy-900 text-navy-500"><Icon name="users" size={34} /></div>
                  )}
                  <div>
                    <span className="badge badge-gold">{p.category.replace('_', ' ')}</span>
                    <div className="mt-2 text-lg font-bold text-navy-900">{p.name}</div>
                    <div className="text-xs font-semibold uppercase tracking-wider text-gold-600">{p.designation}</div>
                    <p className="clamp-4 mt-3 text-sm leading-relaxed text-slate-500" style={{ display: '-webkit-box', WebkitLineClamp: 4, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{p.bio}</p>
                  </div>
                </div>
              ))}
            </RevealGroup>
          </AsyncBlock>
        </div>
      </section>
    </>
  )
}
