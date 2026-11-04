import { useContext, useEffect, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { useSmoothScroll } from '../../hooks/useSmoothScroll'
import Navbar from './Navbar'
import Footer from './Footer'
import UrgentBanner from './UrgentBanner'
import { PushedContext } from './PushedContext'
import { PageTransition } from './PageTransition'

const TITLES = {
  '/': 'Home',
  '/about': 'About Us',
  '/academics': 'Academics',
  '/faculty': 'Faculty & Management',
  '/achievements': 'Achievements & Alumni',
  '/history': 'School History & Visitors',
  '/events': 'Events & Gallery',
  '/notices': 'Notices & Updates',
  '/contact': 'Contact Us',
  '/admissions': 'Online Admissions',
  '/admissions/apply': 'Apply Online',
  '/admissions/status': 'Application Status',
}

export default function PublicLayout() {
  useSmoothScroll(true)
  const { pathname } = useLocation()
  const [pushed, setPushed] = useState(false)

  useEffect(() => {
    const page = TITLES[pathname]
    document.title = page ? `${page} — Bahria College` : 'Bahria College — Learn • Lead • Serve'
  }, [pathname])

  return (
    <PushedContext.Provider value={{ pushed, setPushed }}>
      <div className="flex min-h-screen flex-col">
        <UrgentBanner onActive={setPushed} />
        <Navbar pushed={pushed} />
        <main className="flex-1">
          <PageTransition>
            <Outlet />
          </PageTransition>
        </main>
        <Footer />
      </div>
    </PushedContext.Provider>
  )
}
