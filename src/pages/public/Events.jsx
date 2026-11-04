import { useMemo, useState } from 'react'
import { useAsync } from '../../hooks/useAsync'
import { contentApi } from '../../lib/api'
import { fmtDate, videoEmbed } from '../../lib/utils'
import { Reveal, RevealGroup } from '../../components/ui/motion'
import { PageHero, SectionHeading, AsyncBlock } from '../../components/ui/Bits'
import { Modal } from '../../components/ui/Modal'
import Icon from '../../components/ui/icons'

export default function Events() {
  const events = useAsync(() => contentApi.events(), [])
  const gallery = useAsync(() => contentApi.gallery(), [])
  const [eventModal, setEventModal] = useState(null)
  const [lightbox, setLightbox] = useState(null)
  const [galCat, setGalCat] = useState('all')

  const now = new Date(new Date().toDateString())
  const { upcoming, past } = useMemo(() => {
    const rows = events.data || []
    return {
      upcoming: rows.filter((e) => new Date(e.event_date) >= now).sort((a, b) => new Date(a.event_date) - new Date(b.event_date)),
      past: rows.filter((e) => new Date(e.event_date) < now),
    }
  }, [events.data])

  const galCats = useMemo(() => ['all', ...new Set((gallery.data || []).map((g) => g.category).filter(Boolean))], [gallery.data])
  const galItems = useMemo(() => {
    const rows = gallery.data || []
    return galCat === 'all' ? rows : rows.filter((g) => g.category === galCat)
  }, [gallery.data, galCat])

  return (
    <>
      <PageHero
        kicker="Campus life"
        title="Events & Gallery"
        text="School events, ceremonies, image and video galleries — all published and managed from the admin dashboard."
      />

      {/* EVENTS */}
      <section className="section-pad bg-white">
        <div className="container-x">
          <SectionHeading kicker="Mark your calendar" title="Upcoming events" />
          <AsyncBlock {...events} empty={<div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-6 py-12 text-center text-sm text-slate-400">No upcoming events published yet.</div>}>
            <RevealGroup className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {upcoming.map((e) => (
                <article key={e.id} data-stagger className="card group overflow-hidden transition-all hover:-translate-y-1 hover:shadow-xl">
                  <div className="relative h-48 overflow-hidden bg-navy-900">
                    {e.cover_url ? (
                      <img src={e.cover_url} alt={e.title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />
                    ) : (
                      <div className="flex h-full items-center justify-center text-navy-500"><Icon name="calendar" size={36} /></div>
                    )}
                    <span className="absolute left-3 top-3 rounded bg-navy-950/85 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-gold-300">
                      {new Date(e.event_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                    </span>
                  </div>
                  <div className="p-6">
                    <span className="badge badge-navy">{e.category || 'event'}</span>
                    <h3 className="mt-3 text-lg font-bold text-navy-900 group-hover:text-gold-600">{e.title}</h3>
                    {e.location ? (
                      <div className="mt-1.5 flex items-center gap-1.5 text-xs text-slate-500"><Icon name="pin" size={13} /> {e.location}</div>
                    ) : null}
                    <p className="clamp-3 mt-3 text-sm leading-relaxed text-slate-500">{e.description}</p>
                    <button className="btn btn-ghost btn-sm mt-4" onClick={() => setEventModal(e)}>
                      View details
                    </button>
                  </div>
                </article>
              ))}
            </RevealGroup>

            {past.length ? (
              <div className="mt-16">
                <Reveal>
                  <h3 className="h-display mb-6 text-2xl font-bold text-navy-900">Past events</h3>
                </Reveal>
                <RevealGroup className="grid gap-4 md:grid-cols-2">
                  {past.slice(0, 6).map((e) => (
                    <button key={e.id} data-stagger onClick={() => setEventModal(e)} className="flex items-center gap-4 rounded-lg border border-navy-100 p-4 text-left transition-all hover:border-gold-400 hover:shadow-md">
                      {e.cover_url ? (
                        <img src={e.cover_url} alt="" className="h-16 w-16 shrink-0 rounded object-cover" loading="lazy" />
                      ) : (
                        <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded bg-navy-50 text-navy-300"><Icon name="calendar" size={22} /></span>
                      )}
                      <span className="min-w-0">
                        <span className="block truncate font-bold text-navy-900">{e.title}</span>
                        <span className="text-xs text-slate-500">{fmtDate(e.event_date)}{e.location ? ` • ${e.location}` : ''}</span>
                      </span>
                    </button>
                  ))}
                </RevealGroup>
              </div>
            ) : null}
          </AsyncBlock>
        </div>
      </section>

      {/* GALLERY */}
      <section className="bg-navy-section section-pad">
        <div className="container-x">
          <SectionHeading dark kicker="Moments" title="Photo & video gallery" text="Approved photographs only. Click any item to view it larger." />
          <Reveal className="mb-8 flex flex-wrap justify-center gap-2">
            {galCats.map((c) => (
              <button
                key={c}
                onClick={() => setGalCat(c)}
                className={`rounded-full border px-4 py-1.5 text-xs font-bold uppercase tracking-wider transition-all ${
                  galCat === c ? 'border-gold-500 bg-gold-500 text-navy-950' : 'border-navy-600 text-navy-300 hover:border-gold-400 hover:text-gold-300'
                }`}
              >
                {c}
              </button>
            ))}
          </Reveal>
          <AsyncBlock {...gallery} dark empty={<div className="rounded-lg border border-dashed border-navy-700 px-6 py-12 text-center text-sm text-navy-400">Gallery items will appear here once uploaded in Admin → Gallery.</div>}>
            <RevealGroup className="columns-2 gap-4 md:columns-3 lg:columns-4 [&>*]:mb-4">
              {galItems.map((g) => (
                <button key={g.id} data-stagger onClick={() => setLightbox(g)} className="gal-item block w-full" style={{ breakInside: 'avoid' }}>
                  {g.type === 'video' ? (
                    <span className="flex h-44 w-full items-center justify-center bg-navy-800 text-gold-400"><Icon name="video" size={32} /></span>
                  ) : (
                    <img src={g.url} alt={g.title || 'Gallery image'} loading="lazy" />
                  )}
                  {g.title ? (
                    <span className="absolute bottom-3 left-3 z-10 max-w-[85%] truncate rounded bg-navy-950/70 px-2 py-1 text-left text-[11px] font-bold text-white">
                      {g.title}
                    </span>
                  ) : null}
                </button>
              ))}
            </RevealGroup>
          </AsyncBlock>
        </div>
      </section>

      {/* event detail modal */}
      <Modal open={!!eventModal} onClose={() => setEventModal(null)} title={eventModal?.title || ''} wide>
        {eventModal ? (
          <div>
            {eventModal.cover_url ? <img src={eventModal.cover_url} alt="" className="mb-4 max-h-72 w-full rounded object-cover" /> : null}
            <div className="flex flex-wrap gap-4 text-xs font-bold uppercase tracking-wider text-slate-500">
              <span className="flex items-center gap-1.5"><Icon name="calendar" size={14} className="text-gold-600" /> {fmtDate(eventModal.event_date)}</span>
              {eventModal.location ? <span className="flex items-center gap-1.5"><Icon name="pin" size={14} className="text-gold-600" /> {eventModal.location}</span> : null}
            </div>
            <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-slate-600">{eventModal.description}</p>
            {eventModal.video_url ? (
              <div className="mt-5 aspect-video overflow-hidden rounded-lg">
                <iframe src={videoEmbed(eventModal.video_url)} title="Event video" className="h-full w-full" allowFullScreen />
              </div>
            ) : null}
          </div>
        ) : null}
      </Modal>

      {/* gallery lightbox */}
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
    </>
  )
}
