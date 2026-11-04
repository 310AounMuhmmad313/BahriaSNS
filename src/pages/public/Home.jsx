import { Suspense, lazy } from 'react'
import { Link } from 'react-router-dom'
import { useSettings } from '../../hooks/useSiteSettings'
import { useAsync } from '../../hooks/useAsync'
import { contentApi } from '../../lib/api'
import { parseKv, fmtDate, statusClass, STATUS_LABEL } from '../../lib/utils'
import { Reveal, RevealGroup, AnimatedHeadline, StatCounter, TiltCard } from '../../components/ui/motion'
import { SectionHeading, AsyncBlock, Spinner } from '../../components/ui/Bits'
import { Modal } from '../../components/ui/Modal'
import { useState } from 'react'
import Icon from '../../components/ui/icons'

const OceanScene = lazy(() => import('../../components/three/OceanScene'))

export default function Home() {
  const { get } = useSettings()

  return (
    <>
      <Hero />
      <Marquee />
      <QuickRoutes />
      <Welcome />
      <MissionVision />
      <Programs />
      <Stats />
      <FacultyHighlights />
      <NoticesPreview />
      <EventsPreview />
      <CtaBanner />
    </>
  )
}

/* ================= HERO ================= */

function Hero() {
  const { get } = useSettings()
  return (
   <section className="relative flex min-h-[100svh] items-center overflow-hidden bg-navy-950">
  <img
    src="/images/school.jpg"
    alt="Bahria SNS School campus"
    className="absolute inset-0 h-full w-full object-cover object-center"
    fetchPriority="high"
  />
  <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-navy-950/95 via-navy-950/75 to-navy-950/35" />
  <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-navy-950/25 via-transparent to-navy-950/80" />
      <div className="container-x relative z-10 pb-28 pt-44 md:pt-48">
        <Reveal y={16} duration={0.8}>
          <div className="flex items-center gap-3">
            <span className="gold-line" style={{ width: 34 }} />
            <span className="kicker">{get('hero.kicker')}</span>
          </div>
        </Reveal>

        <AnimatedHeadline
          text={get('hero.title')}
          className="h-display mt-6 max-w-4xl text-5xl font-bold leading-[1.05] text-white md:text-7xl lg:text-[5.2rem]"
        />

        <Reveal delay={0.7} y={20}>
          <p className="mt-6 max-w-xl text-base leading-relaxed text-navy-200 md:text-lg">{get('hero.subtitle')}</p>
        </Reveal>

        <Reveal delay={0.9} y={20}>
          <div className="mt-10 flex flex-wrap items-center gap-4">
            <Link to="/admissions/apply" className="btn btn-gold px-7 py-4 text-[13px]">
              Apply Online <Icon name="arrowRight" size={16} />
            </Link>
            <Link to="/about" className="btn btn-outline px-7 py-4 text-[13px]">
              Explore School
            </Link>
          </div>
        </Reveal>

        <Reveal delay={1.15}>
          <div className="mt-14 flex items-center gap-6 text-[11px] font-bold uppercase tracking-[0.3em] text-navy-300">
            <span className="flex items-center gap-2">
              <img src="/logos/navy-badge.png" alt="" className="h-7 w-7 object-contain" /> Naval heritage
            </span>
            <span className="hidden h-4 w-px bg-navy-600 sm:block" />
            <span className="hidden sm:block">Est. on approved record</span>
          </div>
        </Reveal>
      </div>

      <div className="absolute bottom-8 left-1/2 z-10 -translate-x-1/2">
        <div className="scroll-cue flex flex-col items-center gap-2 text-navy-300">
          <span className="text-[10px] font-bold uppercase tracking-[0.3em]">Scroll</span>
          <span className="block h-8 w-px bg-gradient-to-b from-gold-400 to-transparent" />
        </div>
      </div>
    </section>
  )
}

/* ================= MARQUEE ================= */

function Marquee() {
  const items = ['Learn', 'Lead', 'Serve', 'Integrity', 'Discipline', 'Excellence']
  const row = [...items, ...items]
  return (
    <div className="overflow-hidden border-y border-gold-500/25 bg-navy-950 py-4">
      <div className="marquee-track">
        {[0, 1].map((half) => (
          <div className="marquee-item" key={half} aria-hidden={half === 1}>
            {row.map((it, i) => (
              <span key={`${half}-${i}`} className="flex items-center gap-8">
                <span className="h-display text-lg font-semibold uppercase tracking-[0.2em] text-navy-200">{it}</span>
                <span className="text-gold-500">✦</span>
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

/* ================= QUICK ROUTES ================= */

function QuickRoutes() {
  const cards = [
    
    { icon: 'book', kicker: 'Academics', text: 'Learn with purpose', to: '/academics' },
    { icon: 'flag', kicker: 'Campus Life', text: 'Grow with confidence', to: '/events' },
    { icon: 'grad', kicker: 'Admissions', text: 'Start your journey', to: '/admissions' },
  ]
  
  return (
    <section className="section-pad bg-white">
      <div className="container-x">
        <RevealGroup className="grid gap-6 md:grid-cols-3">
          {cards.map((c) => (
            <Link key={c.kicker} to={c.to} data-stagger>
              <TiltCard>
                <div className="group relative overflow-hidden rounded-lg border border-navy-100 bg-navy-50/40 p-8 transition-all duration-300 hover:border-gold-500/50 hover:shadow-[0_24px_50px_-24px_rgba(11,36,64,0.35)]">
                  <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-gold-500/10 transition-transform duration-500 group-hover:scale-150" />
                  <Icon name={c.icon} size={30} className="text-gold-600" />
                  <div className="kicker mt-6">{c.kicker}</div>
                  <div className="h-display mt-2 text-2xl font-bold text-navy-900">{c.text}</div>
                  <div className="mt-6 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-navy-500 transition-colors group-hover:text-gold-600">
                    Explore <Icon name="arrowRight" size={14} />
                  </div>
                </div>
              </TiltCard>
            </Link>
          ))}
        </RevealGroup>
      </div>
    </section>
  )
}

/* ================= WELCOME ================= */

function Welcome() {
  const { get } = useSettings()
  return (
    <section className="section-pad bg-cream/60">
      <div className="container-x grid items-center gap-14 lg:grid-cols-2">
        <div>
          <Reveal>
            <div className="kicker">Welcome to our school</div>
            <h2 className="h-display mt-3 text-3xl font-bold leading-tight text-navy-900 md:text-[2.7rem]">
              {get('home.welcome_title')}
            </h2>
            <div className="gold-line mt-6" />
            <p className="mt-6 leading-relaxed text-slate-600">{get('home.welcome_text')}</p>
          </Reveal>
          <Reveal delay={0.15}>
            <figure className="navy-card mt-8 p-7">
              <span className="h-display text-5xl leading-none text-gold-400">“</span>
              <blockquote className="mt-2 leading-relaxed text-navy-100">{get('home.principal_message')}</blockquote>
              <figcaption className="mt-5 flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gold-500/15 text-gold-300">
                  <Icon name="users" size={18} />
                </span>
                <span>
                  <span className="block text-sm font-bold text-white">{get('home.principal_name')}</span>
                  <span className="block text-xs uppercase tracking-[0.18em] text-gold-400">{get('home.principal_title')}</span>
                </span>
              </figcaption>
            </figure>
          </Reveal>
        </div>

        <Reveal delay={0.1} className="relative">
          <div className="relative grid grid-cols-2 gap-4">
            <img
              src="/images/result boys.jpg"
              alt="Campus building (placeholder)"
              className="floaty col-span-2 h-56 w-full rounded-lg object-cover shadow-xl md:h-72"
              loading="lazy"
            />
            <img
              src="/placeholders/campus-3.jpg"
              alt="Classroom (placeholder)"
              className="h-44 w-full rounded-lg object-cover shadow-lg md:h-52"
              loading="lazy"
            />
            <img
              src="/images/reult girls.jpg"
              alt="Students (placeholder)"
              className="floaty h-44 w-full rounded-lg object-cover shadow-lg md:h-52"
              style={{ animationDelay: '1.2s' }}
              loading="lazy"
            />
            <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 rounded-md border border-gold-500/40 bg-navy-950 px-6 py-4 text-center shadow-2xl">
              <div className="h-display text-2xl font-bold text-gold-400">Learn • Lead • Serve</div>
              <div className="text-[10px] font-bold uppercase tracking-[0.3em] text-navy-300">Our motto</div>
            </div>
          </div>
          <p className="mt-10 text-center text-[11px] uppercase tracking-[0.2em] text-slate-400">
            Placeholder images — replace with approved campus photos
          </p>
        </Reveal>
      </div>
    </section>
  )
}

/* ================= MISSION / VISION / VALUES ================= */

function MissionVision() {
  const { get } = useSettings()
  const values = parseKv(get('home.values'))
  return (
    <section className="bg-navy-section section-pad">
      <div className="container-x">
        <SectionHeading dark kicker="Our compass" title="Mission, vision & values" />
        <div className="grid gap-6 lg:grid-cols-2">
          <RevealGroup className="grid gap-6 sm:grid-cols-2 lg:col-span-1">
            {[
              { t: 'Mission', d: get('home.mission'), icon: 'flag' },
              { t: 'Vision', d: get('home.vision'), icon: 'globe' },
            ].map((c) => (
              <div key={c.t} data-stagger className="navy-card p-8">
                <span className="flex h-12 w-12 items-center justify-center rounded-full border border-gold-500/30 bg-gold-500/10 text-gold-300">
                  <Icon name={c.icon} size={22} />
                </span>
                <div className="h-display mt-5 text-2xl font-bold text-white">{c.t}</div>
                <p className="mt-3 text-sm leading-relaxed text-navy-200">{c.d}</p>
              </div>
            ))}
          </RevealGroup>
          <Reveal className="navy-card p-8">
            <div className="mb-6 text-xs font-black uppercase tracking-[0.24em] text-gold-400">Core values</div>
            <ol className="space-y-5">
              {values.map((v, i) => (
                <li key={v.t} className="flex gap-5">
                  <span className="h-display text-3xl font-bold text-gold-500/70">{String(i + 1).padStart(2, '0')}</span>
                  <span>
                    <span className="block font-bold text-white">{v.t}</span>
                    <span className="mt-1 block text-sm leading-relaxed text-navy-300">{v.d}</span>
                  </span>
                </li>
              ))}
            </ol>
          </Reveal>
        </div>
      </div>
    </section>
  )
}

/* ================= PROGRAMS & FACILITIES ================= */

function Programs() {
  const { get } = useSettings()
  const classes = useAsync(() => contentApi.classes(), [])
  const facilities = parseKv(get('home.facilities'))
  return (
    <section className="section-pad bg-white">
      <div className="container-x">
        <SectionHeading
          kicker="Academic pathways"
          title="Programs & campus facilities"
          text="Structured classes, well-equipped facilities and activities that build confidence alongside knowledge."
        />
        <RevealGroup className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <AsyncBlock
            {...classes}
            empty={<span className="col-span-full"><AsyncEmpty text="Classes will appear here once added in Admin → Classes." /></span>}
          >
            {classes.data?.map((c) => (
              <div key={c.id} data-stagger className="group rounded-lg border border-navy-100 bg-navy-50/50 p-5 text-center transition-all hover:-translate-y-1 hover:border-gold-500/50 hover:shadow-lg">
                <Icon name="grad" size={22} className="mx-auto text-gold-600" />
                <div className="mt-3 font-bold text-navy-900">{c.name}</div>
                <div className="mt-1 text-xs text-slate-500 clamp-2">{c.description || 'Enrollment open'}</div>
              </div>
            ))}
          </AsyncBlock>
        </RevealGroup>

        <RevealGroup className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {facilities.map((f) => (
            <div key={f.t} data-stagger className="rounded-lg border border-navy-100 p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl">
              <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-navy-900 text-gold-400">
                <Icon name="flask" size={20} />
              </span>
              <div className="mt-4 font-bold text-navy-900">{f.t}</div>
              <p className="mt-2 text-sm leading-relaxed text-slate-500">{f.d}</p>
            </div>
          ))}
        </RevealGroup>
      </div>
    </section>
  )
}

function AsyncEmpty({ text }) {
  return (
    <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-6 py-8 text-center text-sm text-slate-400">
      {text}
    </div>
  )
}

/* ================= STATS ================= */

function Stats() {
  const { get } = useSettings()
  const stats = parseKv(get('home.stats'))
  return (
    <section className="border-y border-gold-500/20 bg-navy-950 py-16">
      <div className="container-x">
        <RevealGroup className="grid grid-cols-2 gap-8 lg:grid-cols-4">
          {stats.map((s, i) => (
            <div key={s.t} data-stagger className="text-center">
              <StatCounter value={s.d} suffix={i === stats.length - 1 ? '%' : '+'} label={s.t} />
            </div>
          ))}
        </RevealGroup>
      </div>
    </section>
  )
}

/* ================= FACULTY HIGHLIGHTS ================= */

function FacultyHighlights() {
  const faculty = useAsync(() => contentApi.faculty(), [])
  return (
    <section className="section-pad bg-cream/60">
      <div className="container-x">
        <SectionHeading
          kicker="Our people"
          title="Faculty highlights"
          text="Qualified teachers and leadership dedicated to every student's growth."
        />
        <AsyncBlock
          {...faculty}
          empty={<AsyncEmpty text="Faculty profiles will appear here once added in Admin → Faculty." />}
        >
          <RevealGroup className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {faculty.data?.slice(0, 4).map((f) => (
              <div key={f.id} data-stagger className="card overflow-hidden transition-all hover:-translate-y-1 hover:shadow-xl">
                <div className="h-48 overflow-hidden bg-navy-900">
                  {f.photo_url ? (
                    <img src={f.photo_url} alt={f.name} className="h-full w-full object-cover" loading="lazy" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-navy-500">
                      <Icon name="users" size={40} />
                    </div>
                  )}
                </div>
                <div className="p-5">
                  <span className="badge badge-gold">{f.category.replace('_', ' ')}</span>
                  <div className="mt-2.5 font-bold text-navy-900">{f.name}</div>
                  <div className="text-xs font-semibold uppercase tracking-wider text-gold-600">{f.designation}</div>
                  <p className="clamp-2 mt-2 text-xs leading-relaxed text-slate-500">{f.bio}</p>
                </div>
              </div>
            ))}
          </RevealGroup>
        </AsyncBlock>
        <Reveal className="mt-10 text-center">
          <Link to="/faculty" className="btn btn-navy">
            View all faculty <Icon name="arrowRight" size={15} />
          </Link>
        </Reveal>
      </div>
    </section>
  )
}

/* ================= NOTICES PREVIEW ================= */

function NoticesPreview() {
  const notices = useAsync(() => contentApi.notices(), [])
  const list = (notices.data || []).slice(0, 3)
  return (
    <section className="section-pad bg-white">
      <div className="container-x grid gap-12 lg:grid-cols-[1fr_1.4fr]">
        <div>
          <Reveal>
            <div className="kicker">Stay informed</div>
            <h2 className="h-display mt-3 text-3xl font-bold leading-tight text-navy-900 md:text-4xl">Latest notices & urgent updates</h2>
            <div className="gold-line mt-6" />
            <p className="mt-5 leading-relaxed text-slate-500">
              Holidays, early closures, admission announcements and general updates — published directly by the school administration.
            </p>
            <Link to="/notices" className="btn btn-navy mt-7">
              All notices <Icon name="arrowRight" size={15} />
            </Link>
          </Reveal>
        </div>
        <AsyncBlock {...notices} empty={<AsyncEmpty text="No notices published yet. Admins can publish notices from the dashboard." />}>
          <RevealGroup className="space-y-4">
            {list.map((n) => (
              <Link key={n.id} to="/notices" data-stagger>
                <article className="group flex items-start gap-4 rounded-lg border border-navy-100 p-5 transition-all hover:-translate-y-0.5 hover:border-gold-500/50 hover:shadow-lg">
                  <span className={`mt-0.5 shrink-0 rounded px-2.5 py-1 text-[10px] font-black uppercase tracking-wider ${n.is_emergency ? 'bg-red-100 text-red-700' : 'bg-navy-50 text-navy-600'}`}>
                    {n.category}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="clamp-1 block font-bold text-navy-900 group-hover:text-gold-600">{n.title}</span>
                    <span className="clamp-2 mt-1 block text-sm text-slate-500">{n.body}</span>
                    <span className="mt-2 block text-[11px] font-semibold uppercase tracking-wider text-slate-400">{fmtDate(n.publish_at || n.created_at)}</span>
                  </span>
                  {n.pinned ? <span className="badge badge-gold shrink-0">Pinned</span> : null}
                </article>
              </Link>
            ))}
          </RevealGroup>
        </AsyncBlock>
      </div>
    </section>
  )
}

/* ================= EVENTS & GALLERY PREVIEW ================= */

function EventsPreview() {
  const events = useAsync(() => contentApi.events(), [])
  const gallery = useAsync(() => contentApi.gallery(), [])
  const [lightbox, setLightbox] = useState(null)
  const upcoming = (events.data || []).filter((e) => new Date(e.event_date) >= new Date(new Date().toDateString())).slice(0, 1)
  const feature = upcoming[0] || (events.data || [])[0]
  const thumbs = (gallery.data || []).slice(0, 4)

  return (
    <section className="bg-navy-section section-pad">
      <div className="container-x">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div>
            <SectionHeading dark align="left" kicker="Campus life" title="Events & gallery" />
            <AsyncBlock {...events} dark empty={<AsyncEmpty text="Events will appear here once published from the admin dashboard." />}>
              {feature ? (
                <Reveal className="navy-card overflow-hidden">
                  {feature.cover_url ? (
                    <img src={feature.cover_url} alt={feature.title} className="h-52 w-full object-cover" loading="lazy" />
                  ) : (
                    <div className="flex h-40 items-center justify-center bg-navy-800 text-navy-500">
                      <Icon name="calendar" size={36} />
                    </div>
                  )}
                  <div className="p-6">
                    <div className="flex items-center gap-3 text-xs font-bold uppercase tracking-[0.18em] text-gold-400">
                      <Icon name="calendar" size={14} /> {fmtDate(feature.event_date)}
                      {feature.location ? <><span className="text-navy-500">•</span> {feature.location}</> : null}
                    </div>
                    <div className="h-display mt-3 text-2xl font-bold text-white">{feature.title}</div>
                    <p className="clamp-2 mt-2 text-sm text-navy-300">{feature.description}</p>
                    <Link to="/events" className="btn btn-outline btn-sm mt-5">
                      Explore events <Icon name="arrowRight" size={14} />
                    </Link>
                  </div>
                </Reveal>
              ) : null}
            </AsyncBlock>
          </div>

          <div>
            <AsyncBlock {...gallery} dark empty={<AsyncEmpty text="Gallery photos will appear here." />}>
              <RevealGroup className="grid grid-cols-2 gap-4">
                {thumbs.map((g) => (
                  <button key={g.id} data-stagger className="gal-item h-44 md:h-52" onClick={() => setLightbox(g)}>
                    {g.type === 'video' ? (
                      <span className="flex h-full w-full items-center justify-center bg-navy-800 text-gold-400"><Icon name="video" size={34} /></span>
                    ) : (
                      <img src={g.url} alt={g.title || 'Gallery image'} loading="lazy" />
                    )}
                    <span className="absolute bottom-3 left-3 z-10 text-left text-xs font-bold text-white opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                      {g.title}
                    </span>
                  </button>
                ))}
              </RevealGroup>
            </AsyncBlock>
            <Reveal className="mt-6 text-right">
              <Link to="/events" className="text-xs font-bold uppercase tracking-[0.2em] text-gold-300 hover:text-gold-200">
                Open full gallery →
              </Link>
            </Reveal>
          </div>
        </div>
      </div>

      <Modal open={!!lightbox} onClose={() => setLightbox(null)} title={lightbox?.title || 'Gallery'} wide>
        {lightbox ? (
          lightbox.type === 'video' ? (
            <video src={lightbox.url} controls className="w-full rounded" />
          ) : (
            <img src={lightbox.url} alt={lightbox.title} className="w-full rounded" />
          )
        ) : null}
        {lightbox?.caption ? <p className="mt-3 text-sm text-slate-500">{lightbox.caption}</p> : null}
      </Modal>
    </section>
  )
}

/* ================= CTA ================= */

function CtaBanner() {
  return (
    <section className="relative overflow-hidden bg-white py-20">
      <div className="container-x">
        <Reveal>
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-navy-900 via-navy-800 to-navy-950 px-8 py-14 text-center md:py-20">
            <div className="pointer-events-none absolute -left-16 -top-16 h-56 w-56 rounded-full bg-gold-500/15 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-20 -right-10 h-64 w-64 rounded-full bg-navy-500/25 blur-3xl" />
            <div className="relative">
              <div className="kicker">Admissions open</div>
              <h2 className="h-display mx-auto mt-4 max-w-2xl text-3xl font-bold text-white md:text-5xl">
                Your child's journey starts with one application.
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-navy-300 md:text-base">
                Complete the guided online form, upload documents and receive an instant reference number to track your application.
              </p>
              <div className="mt-9 flex flex-wrap justify-center gap-4">
                <Link to="/admissions/apply" className="btn btn-gold px-8 py-4">
                  Apply Online
                </Link>
                <Link to="/admissions/status" className="btn btn-outline px-8 py-4">
                  Track Application
                </Link>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
