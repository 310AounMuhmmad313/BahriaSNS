import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { isSupabaseConfigured } from '../../lib/supabase'
import { ConfigNotice } from '../../components/ui/Bits'
import Icon from '../../components/ui/icons'

export default function AdminLogin() {
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [showPw, setShowPw] = useState(false)

  const from = location.state?.from || '/admin'

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      await signIn(email, password)
      navigate(from, { replace: true })
    } catch (err) {
      const m = /invalid login credentials/i.test(err.message)
        ? 'Invalid email or password.'
        : /not configured/i.test(err.message)
          ? err.message
          : err.message || 'Sign-in failed. Please try again.'
      setError(m)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="bg-hero flex min-h-screen items-center justify-center px-5 py-14">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Link to="/" className="inline-block">
            <img src="/logos/bahria-crest.png" alt="School crest" className="mx-auto h-20 w-20 object-contain" />
          </Link>
          <h1 className="h-display mt-4 text-3xl font-bold text-white">School Admin</h1>
          <div className="gold-line mx-auto mt-4" />
          <p className="mt-3 text-xs uppercase tracking-[0.24em] text-navy-300">Secure control room</p>
        </div>

        <div className="navy-card p-8">
          {!isSupabaseConfigured ? (
            <div className="mb-5">
              <ConfigNotice />
            </div>
          ) : null}

          <form onSubmit={submit} className="space-y-5">
            <div>
              <label className="label label-dark" htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                required
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input input-dark"
                placeholder="admin@school.example"
              />
            </div>
            <div>
              <label className="label label-dark" htmlFor="password">Password</label>
              <div className="relative">
                <input
                  id="password"
                  type={showPw ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input input-dark pr-11"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPw((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-navy-300 hover:text-white"
                  aria-label={showPw ? 'Hide password' : 'Show password'}
                >
                  <Icon name="eye" size={17} />
                </button>
              </div>
            </div>

            {error ? (
              <div className="rounded border border-red-500/40 bg-red-500/10 px-4 py-2.5 text-xs font-semibold text-red-300">{error}</div>
            ) : null}

            <button type="submit" className="btn btn-gold w-full py-3.5" disabled={busy}>
              {busy ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <div className="mt-6 rounded border border-navy-700 bg-navy-900/60 px-4 py-3 text-[11px] leading-relaxed text-navy-300">
            <b className="text-gold-300">First time setup:</b> admin accounts are created in Supabase (Authentication →
            Add user), then promoted with one SQL command. No public sign-up exists — this is intentional security.
            See README → “Create the first admin”.
          </div>
        </div>

        <div className="mt-6 text-center">
          <Link to="/" className="text-xs font-semibold uppercase tracking-[0.2em] text-navy-400 transition hover:text-gold-300">
            ← Back to website
          </Link>
        </div>
      </div>
    </div>
  )
}
