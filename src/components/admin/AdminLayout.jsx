import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useSettings } from '../../hooks/useSiteSettings'
import { admissionsAdminApi } from '../../lib/api'
import { useAsync } from '../../hooks/useAsync'
import { cn } from '../../lib/utils'
import Icon from '../../components/ui/icons'

const NAV = [
  {
    section: 'Overview',
    items: [['/admin', 'Dashboard', 'dashboard']],
  },
  {
    section: 'Admissions',
    items: [
      ['/admin/admissions', 'Applications', 'doc'],
      ['/admin/students', 'Students', 'grad'],
    ],
  },
  {
    section: 'Communication',
    items: [
      ['/admin/notices', 'Notices & Alerts', 'bell'],
      ['/admin/messages', 'Enquiries', 'mail'],
    ],
  },
  {
    section: 'Website Content',
    items: [
      ['/admin/events', 'Events', 'calendar'],
      ['/admin/gallery', 'Gallery', 'image'],
      ['/admin/faculty', 'Faculty', 'users'],
      ['/admin/achievements', 'Achievements', 'star'],
      ['/admin/history', 'History & Visitors', 'clock'],
      ['/admin/content', 'Website Content', 'layers'],
    ],
  },
  {
    section: 'System',
    items: [
      ['/admin/classes', 'Classes & Years', 'book'],
      ['/admin/reports', 'Reports & Audit', 'chart'],
    ],
  },
]

export default function AdminLayout() {
  const { profile, signOut } = useAuth()
  const { get } = useSettings()
  const { pathname } = useLocation()
  const [drawer, setDrawer] = useState(false)
  const pending = useAsync(() => admissionsAdminApi.list({ status: 'pending', per: 1 }), [pathname])

  useEffect(() => setDrawer(false), [pathname])

  const name = profile?.full_name || profile?.id?.slice(0, 8) || 'Admin'
  const initials = name.split(/\s+/).map((w) => w[0]).slice(0, 2).join('').toUpperCase()

  const sidebar = (
    <div className="flex h-full flex-col bg-navy-950">
      <div className="flex items-center gap-3 border-b border-navy-800 px-5 py-4">
        <img src="/logos/bahria-crest.png" alt="" className="h-10 w-10 object-contain" />
        <div>
          <div className="text-sm font-bold text-white">{get('site.name')}</div>
          <div className="text-[9px] font-bold uppercase tracking-[0.24em] text-gold-400">Admin Panel</div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 pb-4" aria-label="Admin">
        {NAV.map((group) => (
          <div key={group.section}>
            <div className="admin-section">{group.section}</div>
            {group.items.map(([to, label, icon]) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/admin'}
                className={({ isActive }) => cn('admin-link', isActive && 'active')}
              >
                <Icon name={icon} size={16} />
                <span className="flex-1">{label}</span>
                {to === '/admin/admissions' && (pending.data?.total || 0) > 0 ? (
                  <span className="rounded-full bg-gold-500 px-2 py-0.5 text-[10px] font-black text-navy-950">{pending.data.total}</span>
                ) : null}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      <div className="border-t border-navy-800 p-4">
        <Link to="/" className="admin-link mb-1">
          <Icon name="external" size={15} /> View website
        </Link>
        <button onClick={signOut} className="admin-link w-full text-left">
          <Icon name="logout" size={15} /> Sign out
        </button>
      </div>
    </div>
  )

  const current = NAV.flatMap((g) => g.items).find(([to]) => (to === '/admin' ? pathname === '/admin' : pathname.startsWith(to)))

  return (
    <div className="min-h-screen bg-[#f2f4f8]">
      {/* desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 lg:block">{sidebar}</aside>

      {/* mobile drawer */}
      {drawer ? (
        <div className="fixed inset-0 z-[130] lg:hidden">
          <div className="absolute inset-0 bg-navy-950/70 backdrop-blur-sm" onClick={() => setDrawer(false)} />
          <div className="absolute inset-y-0 left-0 w-72 shadow-2xl">{sidebar}</div>
        </div>
      ) : null}

      <div className="lg:ml-64">
        {/* topbar */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white/90 px-5 backdrop-blur no-print">
          <div className="flex items-center gap-3">
            <button className="flex h-9 w-9 items-center justify-center rounded border border-slate-200 text-slate-600 lg:hidden" onClick={() => setDrawer(true)} aria-label="Open menu">
              <Icon name="menu" size={18} />
            </button>
            <h1 className="text-sm font-black uppercase tracking-[0.16em] text-navy-900">{current?.[1] || 'Admin'}</h1>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden text-xs font-semibold text-slate-400 sm:block">{profile?.email}</span>
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-navy-900 text-xs font-black text-gold-300">{initials}</span>
          </div>
        </header>

        <main className="p-5 md:p-7">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
