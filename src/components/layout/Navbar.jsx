import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { useSettings } from '../../hooks/useSiteSettings'
import { cn } from '../../lib/utils'
import Icon from '../ui/icons'

const LINKS = [
  ['/', 'Home'],
  ['/about', 'About'],
  ['/academics', 'Academics'],
  ['/faculty', 'Faculty'],
  ['/achievements', 'Achievements'],
  ['/history', 'History'],
  ['/events', 'Events & Gallery'],
  ['/notices', 'Notices'],
  ['/contact', 'Contact'],
]

export default function Navbar({ pushed = false }) {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)
  const [hidden, setHidden] = useState(false)
  const lastY = useRef(0)
  const { pathname } = useLocation()
  const menuRef = useRef(null)
  const { get } = useSettings()

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY
      setScrolled(y > 24)
      setHidden(y > 140 && y > lastY.current && !open)
      lastY.current = y
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [open])

  useEffect(() => setOpen(false), [pathname])

  // staggered mobile menu animation
  useEffect(() => {
    if (!open || !menuRef.current) return
    const items = menuRef.current.querySelectorAll('[data-mi]')
    items.forEach((el, i) => {
      el.style.transition = 'none'
      el.style.opacity = '0'
      el.style.transform = 'translateY(18px)'
      requestAnimationFrame(() => {
        el.style.transition = `all .45s cubic-bezier(.2,.7,.2,1) ${i * 55 + 80}ms`
        el.style.opacity = '1'
        el.style.transform = 'translateY(0)'
      })
    })
  }, [open])

  return (
    <>
      <header
        className={cn(
          'fixed inset-x-0 z-[90] transition-all duration-300',
          pushed ? 'top-[52px]' : 'top-0',
          hidden ? '-translate-y-full' : 'translate-y-0',
          scrolled ? 'border-b border-gold-500/20 bg-navy-950/90 shadow-lg backdrop-blur-md' : 'bg-transparent'
        )}
      >
        <div className="container-x flex h-[72px] items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-3" aria-label="Home">
            <img src="/logos/bahria-crest.png" alt="School crest" className="h-11 w-11 object-contain" />
            <span className="leading-tight">
              <span className="h-display block text-lg font-bold text-white">{get('site.name')}</span>
              <span className="block text-[10px] font-bold uppercase tracking-[0.28em] text-gold-400">{get('site.tagline')}</span>
            </span>
          </Link>

          <nav className="hidden items-center gap-5 xl:flex" aria-label="Main">
            {LINKS.map(([to, label]) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                className={({ isActive }) =>
                  cn(
                    'relative py-1 text-[12.5px] font-semibold tracking-wide transition-colors',
                    isActive ? 'text-gold-300' : 'text-navy-200 hover:text-white'
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    {label}
                    <span className={cn('absolute -bottom-0.5 left-0 h-px bg-gold-400 transition-all', isActive ? 'w-full' : 'w-0')} />
                  </>
                )}
              </NavLink>
            ))}
            <Link to="/admissions" className="btn btn-gold btn-sm">
              Admissions
            </Link>
          </nav>

          <div className="flex items-center gap-2 xl:hidden">
            <Link to="/admissions" className="btn btn-gold btn-sm hidden sm:inline-flex">
              Admissions
            </Link>
            <button
              onClick={() => setOpen(!open)}
              className="flex h-10 w-10 items-center justify-center rounded border border-navy-700 text-navy-100"
              aria-label="Toggle menu"
              aria-expanded={open}
            >
              <Icon name={open ? 'x' : 'menu'} size={20} />
            </button>
          </div>
        </div>
      </header>

      {/* full-screen mobile menu */}
      <div
        ref={menuRef}
        className={cn(
          'fixed inset-0 z-[85] flex flex-col bg-navy-950/97 pt-28 backdrop-blur-xl transition-all duration-300 xl:hidden',
          open ? 'visible opacity-100' : 'invisible opacity-0'
        )}
      >
        <nav className="container-x flex flex-col gap-1" aria-label="Mobile">
          {LINKS.map(([to, label]) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              data-mi
              className={({ isActive }) =>
                cn(
                  'h-display border-b border-navy-800 py-3.5 text-2xl font-semibold transition-colors',
                  isActive ? 'text-gold-300' : 'text-navy-100'
                )
              }
            >
              {label}
            </NavLink>
          ))}
          <Link to="/admissions" data-mi className="btn btn-gold mt-6 self-start">
            Online Admissions
          </Link>
        </nav>
      </div>
    </>
  )
}
