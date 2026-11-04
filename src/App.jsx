import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ToastProvider } from './context/ToastContext'
import { isSupabaseConfigured } from './lib/supabase'
import { SettingsProvider } from './hooks/useSiteSettings'
import { ConfigNotice, Spinner } from './components/ui/Bits'
import PublicLayout from './components/layout/PublicLayout'
import AdminLayout from './components/admin/AdminLayout'

/* ---------- public pages ---------- */
import Home from './pages/public/Home'
import About from './pages/public/About'
import Academics from './pages/public/Academics'
import Faculty from './pages/public/Faculty'
import Achievements from './pages/public/Achievements'
import History from './pages/public/History'
import Events from './pages/public/Events'
import Notices from './pages/public/Notices'
import Contact from './pages/public/Contact'

/* ---------- admission portal ---------- */
import AdmissionsHome from './pages/admission/AdmissionsHome'
import Apply from './pages/admission/Apply'
import TrackStatus from './pages/admission/TrackStatus'

/* ---------- admin ---------- */
import AdminLogin from './pages/auth/AdminLogin'
import Dashboard from './pages/admin/Dashboard'
import AdmissionsAdmin from './pages/admin/Admissions'
import AdmissionDetail from './pages/admin/AdmissionDetail'
import StudentsAdmin from './pages/admin/Students'
import NoticesAdmin from './pages/admin/Notices'
import EventsAdmin from './pages/admin/Events'
import GalleryAdmin from './pages/admin/Gallery'
import FacultyAdmin from './pages/admin/Faculty'
import AchievementsAdmin from './pages/admin/Achievements'
import HistoryAdmin from './pages/admin/History'
import ContentAdmin from './pages/admin/Content'
import ClassesAdmin from './pages/admin/Classes'
import MessagesAdmin from './pages/admin/Messages'
import ReportsAdmin from './pages/admin/Reports'

/* ---------- guards ---------- */

function RequireAdmin() {
  const { session, profile, loading, isAdmin, signOut } = useAuth()
  const location = useLocation()

  if (!isSupabaseConfigured) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-navy-950 p-6">
        <ConfigNotice />
      </div>
    )
  }
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-navy-950">
        <Spinner light label="Checking access" />
      </div>
    )
  }
  if (!session) return <Navigate to="/admin/login" state={{ from: location.pathname }} replace />
  if (!isAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-navy-950 p-6">
        <div className="navy-card max-w-md p-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-red-500/40 bg-red-500/10 text-2xl text-red-400">
            !
          </div>
          <h2 className="h-display text-2xl font-bold text-white">Access restricted</h2>
          <p className="mt-2 text-sm leading-relaxed text-navy-300">
            This account does not have the <b>admin</b> role in the database. Authorization is enforced by
            Supabase Row Level Security — it cannot be granted from the browser.
          </p>
          <p className="mt-3 text-xs text-navy-400">
            See README → “Create the first admin” for the secure setup steps.
          </p>
          <button className="btn btn-outline mt-6" onClick={signOut}>
            Sign out
          </button>
        </div>
      </div>
    )
  }
  return <AdminLayout />
}

function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-navy-950 px-6 text-center">
      <div className="h-display text-7xl font-bold text-gold-400 md:text-8xl">404</div>
      <div className="gold-line mx-auto my-6" />
      <p className="max-w-md text-navy-300">This page has drifted beyond the horizon. Use the navigation to return to safe waters.</p>
      <a href="/" className="btn btn-gold mt-8">
        Back to home
      </a>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <SettingsProvider>
            <Routes>
            {/* ------- public website ------- */}
            <Route element={<PublicLayout />}>
              <Route index element={<Home />} />
              <Route path="about" element={<About />} />
              <Route path="academics" element={<Academics />} />
              <Route path="faculty" element={<Faculty />} />
              <Route path="achievements" element={<Achievements />} />
              <Route path="history" element={<History />} />
              <Route path="events" element={<Events />} />
              <Route path="notices" element={<Notices />} />
              <Route path="contact" element={<Contact />} />
              <Route path="admissions" element={<AdmissionsHome />} />
              <Route path="admissions/apply" element={<Apply />} />
              <Route path="admissions/status" element={<TrackStatus />} />
            </Route>

            {/* ------- admin ------- */}
            <Route path="admin/login" element={<AdminLogin />} />
            <Route path="admin" element={<RequireAdmin />}>
              <Route index element={<Dashboard />} />
              <Route path="admissions" element={<AdmissionsAdmin />} />
              <Route path="admissions/:id" element={<AdmissionDetail />} />
              <Route path="students" element={<StudentsAdmin />} />
              <Route path="notices" element={<NoticesAdmin />} />
              <Route path="events" element={<EventsAdmin />} />
              <Route path="gallery" element={<GalleryAdmin />} />
              <Route path="faculty" element={<FacultyAdmin />} />
              <Route path="achievements" element={<AchievementsAdmin />} />
              <Route path="history" element={<HistoryAdmin />} />
              <Route path="content" element={<ContentAdmin />} />
              <Route path="classes" element={<ClassesAdmin />} />
              <Route path="messages" element={<MessagesAdmin />} />
              <Route path="reports" element={<ReportsAdmin />} />
            </Route>

            <Route path="*" element={<NotFound />} />
            </Routes>
          </SettingsProvider>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
