import { Link } from 'react-router-dom'
import { useSettings } from '../../hooks/useSiteSettings'
import { useAsync } from '../../hooks/useAsync'
import { contentApi } from '../../lib/api'
import { parseKv } from '../../lib/utils'
import { Reveal, RevealGroup } from '../../components/ui/motion'
import { PageHero, SectionHeading, AsyncBlock } from '../../components/ui/Bits'
import Icon from '../../components/ui/icons'

const RESOURCES = [
  { icon: 'book', t: 'Library & Reading', d: 'A quiet reading room with a growing catalogue of course texts, reference books and story collections.' },
  { icon: 'flask', t: 'Laboratory Work', d: 'Hands-on physics, chemistry and biology practicals supervised by subject specialists.' },
  { icon: 'chart', t: 'Assessment & Results', d: 'Regular class tests, term examinations and transparent progress reporting for parents.' },
  { icon: 'star', t: 'Coaching & Clubs', d: 'Subject coaching, quiz society, debates, sports coaching and hobby clubs after school hours.' },
]

export default function Academics() {
  const { get } = useSettings()
  const classes = useAsync(() => contentApi.classes(), [])
  const facilities = parseKv(get('home.facilities'))

  return (
    <>
      <PageHero
        kicker="Learning with purpose"
        title="Academics"
        text="Structured classes, qualified subject teachers and facilities that support serious study alongside character building."
      />

      {/* classes */}
      <section className="section-pad bg-white">
        <div className="container-x">
          <SectionHeading kicker="Classes" title="Classes & programs" text="The classes below are managed by the school administration and shown here live from the school database." />
          <AsyncBlock {...classes} empty={<div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-6 py-10 text-center text-sm text-slate-400">Classes will appear here once added in Admin → Classes & Years.</div>}>
            <RevealGroup className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
              {classes.data?.map((c) => (
                <div key={c.id} data-stagger className="group rounded-lg border border-navy-100 bg-navy-50/40 p-6 text-center transition-all hover:-translate-y-1 hover:border-gold-500/50 hover:shadow-lg">
                  <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-navy-900 text-gold-400">
                    <Icon name="grad" size={20} />
                  </span>
                  <div className="mt-4 font-bold text-navy-900">{c.name}</div>
                  {c.description ? <p className="mt-2 text-xs leading-relaxed text-slate-500">{c.description}</p> : null}
                  <div className="mt-4 text-[10px] font-black uppercase tracking-[0.2em] text-gold-600">Enrollment open</div>
                </div>
              ))}
            </RevealGroup>
          </AsyncBlock>
        </div>
      </section>

      {/* facilities */}
      <section className="bg-navy-section section-pad">
        <div className="container-x">
          <SectionHeading dark kicker="Facilities" title="Laboratories, library & sports" text="Managed and updated by the administration from Admin → Website Content." />
          <RevealGroup className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {facilities.map((f) => (
              <div key={f.t} data-stagger className="navy-card p-7">
                <span className="flex h-12 w-12 items-center justify-center rounded-lg border border-gold-500/30 bg-gold-500/10 text-gold-300">
                  <Icon name="flask" size={20} />
                </span>
                <div className="mt-5 font-bold text-white">{f.t}</div>
                <p className="mt-2 text-sm leading-relaxed text-navy-300">{f.d}</p>
              </div>
            ))}
          </RevealGroup>
        </div>
      </section>

      {/* resources */}
      <section className="section-pad bg-cream/60">
        <div className="container-x grid gap-12 lg:grid-cols-[1.1fr_1fr]">
          <div>
            <SectionHeading align="left" kicker="Learning resources" title="How we teach" className="mb-8" />
            <RevealGroup className="space-y-5">
              {RESOURCES.map((r) => (
                <div key={r.t} data-stagger className="flex gap-5 rounded-lg border border-navy-100 bg-white p-6 shadow-sm">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-gold-100 text-gold-600">
                    <Icon name={r.icon} size={20} />
                  </span>
                  <span>
                    <span className="block font-bold text-navy-900">{r.t}</span>
                    <span className="mt-1 block text-sm leading-relaxed text-slate-500">{r.d}</span>
                  </span>
                </div>
              ))}
            </RevealGroup>
          </div>
          <Reveal delay={0.15}>
            <div className="navy-card sticky top-28 p-9">
              <div className="kicker">Extracurricular</div>
              <h3 className="h-display mt-3 text-3xl font-bold text-white">Growing beyond the syllabus</h3>
              <div className="gold-line mt-5" />
              <ul className="mt-6 space-y-3.5">
                {['Annual sports day & athletics', 'Quiz, debate & literary society', 'Science & art exhibitions', 'Field trips and excursions', 'Community service projects'].map((x) => (
                  <li key={x} className="flex items-center gap-3 text-sm text-navy-200">
                    <Icon name="check" size={16} className="text-gold-400" /> {x}
                  </li>
                ))}
              </ul>
              <Link to="/admissions/apply" className="btn btn-gold mt-8 w-full">
                Apply for admission
              </Link>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  )
}
