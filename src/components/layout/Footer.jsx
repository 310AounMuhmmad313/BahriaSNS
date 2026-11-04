import { Link } from 'react-router-dom'
import { useSettings } from '../../hooks/useSiteSettings'

export default function Footer() {
  const { get } = useSettings()
  const year = new Date().getFullYear()

  const cols = [
    {
      title: 'Explore',
      links: [
        ['/', 'Home'],
        ['/about', 'About Us'],
        ['/academics', 'Academics'],
        ['/faculty', 'Faculty & Management'],
      ],
    },
    {
      title: 'Campus',
      links: [
        ['/achievements', 'Achievements & Alumni'],
        ['/history', 'History & Visitors'],
        ['/events', 'Events & Gallery'],
        ['/notices', 'Notices & Updates'],
      ],
    },
  ]

  return (
    <footer className="border-t border-gold-500/20 bg-navy-950">
      {/* CTA strip */}
      <div className="border-b border-navy-800">
        <div className="container-x flex flex-col items-center justify-between gap-5 py-10 md:flex-row">
          <div>
            <div className="h-display text-2xl font-bold text-white md:text-3xl">Ready to join our campus?</div>
            <p className="mt-1 text-sm text-navy-300">Start the online admission application in five simple steps.</p>
          </div>
          <Link to="/admissions/apply" className="btn btn-gold">
            Apply Online
          </Link>
        </div>
      </div>

      <div className="container-x grid gap-10 py-14 md:grid-cols-2 lg:grid-cols-4">
        <div>
          <div className="flex items-center gap-3">
            <img src="/logos/bahria-crest.png" alt="School crest" className="h-14 w-14 object-contain" />
            <div>
              <div className="h-display text-xl font-bold text-white">{get('site.name')}</div>
              <div className="text-[10px] font-bold uppercase tracking-[0.28em] text-gold-400">{get('site.tagline')}</div>
            </div>
          </div>
          <p className="mt-4 text-sm leading-relaxed text-navy-300">
            A navy-inspired digital campus for a disciplined, confident learning community.
          </p>
          <div className="mt-5 flex items-center gap-3">
            <img src="/logos/navy-badge.png" alt="Pakistan Navy emblem" className="h-9 w-9 object-contain opacity-80" title="Pakistan Navy" />
            <span className="text-[11px] uppercase tracking-[0.2em] text-navy-400">Naval educational heritage</span>
          </div>
        </div>

        {cols.map((c) => (
          <div key={c.title}>
            <div className="mb-4 text-xs font-black uppercase tracking-[0.24em] text-gold-400">{c.title}</div>
            <ul className="space-y-2.5">
              {c.links.map(([to, label]) => (
                <li key={to}>
                  <Link to={to} className="text-sm text-navy-200 transition hover:text-gold-300">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}

        <div>
          <div className="mb-4 text-xs font-black uppercase tracking-[0.24em] text-gold-400">Contact</div>
          <ul className="space-y-2.5 text-sm text-navy-200">
            <li>{get('contact.address')}</li>
            <li>
              <a className="transition hover:text-gold-300" href={`tel:${get('contact.phone')}`}>
                {get('contact.phone')}
              </a>
            </li>
            <li>
              <a className="transition hover:text-gold-300" href={`mailto:${get('contact.email')}`}>
                {get('contact.email')}
              </a>
            </li>
            <li className="text-navy-300">{get('contact.hours')}</li>
          </ul>
        </div>
      </div>

      <div className="border-t border-navy-800">
        <div className="container-x flex flex-col items-center justify-between gap-2 py-5 text-[12px] text-navy-400 sm:flex-row">
          <span>
          MR.AMB Coder © {year} {get('site.name')}. All rights reserved.
          </span>
          <span className="uppercase tracking-[0.18em]">
            Sample content · replace with approved school information
          </span>
        </div>
      </div>
    </footer>
  )
}
