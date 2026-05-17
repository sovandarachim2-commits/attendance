import { useState } from 'react'
import {
  Activity, BarChart2, CheckCircle2, Eye, EyeOff,
  Lock, LogIn, MapPin, Moon, ShieldCheck, Sun, UserRound, Users,
} from 'lucide-react'
import clsx from 'clsx'
import { authService } from '../services/api'

const FEATURES = [
  [ShieldCheck, 'Secure & Safe',          'Your data is protected'],
  [Lock,        'Private & Confidential', 'We respect your privacy'],
  [BarChart2,   'Smart Reports',          'Detailed analytics'],
]

export default function LoginPage({ dark, onToggleDark, onLogin }) {
  const [username, setUsername]           = useState('')
  const [password, setPassword]           = useState('')
  const [showPassword, setShowPassword]   = useState(false)
  const [loading, setLoading]             = useState(false)
  const [error, setError]                 = useState('')

  const handleSubmit = async (event) => {
    event.preventDefault()
    setLoading(true)
    setError('')
    try {
      const response = await authService.login({ username, password })
      onLogin(response.user)
    } catch (exception) {
      setError(exception.response?.data?.message || 'Login failed. Check your username and password.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={clsx(dark && 'dark')}>
      <div className="grid min-h-screen lg:grid-cols-2">

        {/* ── Left branding panel — always dark ── */}
        <section className="relative hidden overflow-hidden bg-[#071827] lg:flex lg:flex-col lg:p-10 xl:p-14">

          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-xl bg-emerald-500 shadow-lg shadow-emerald-950/60">
              <Activity size={22} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-white">Sales<span className="text-emerald-400">Track</span></h1>
              <p className="text-[11px] text-slate-400">Attendance &amp; Sales System</p>
            </div>
          </div>

          {/* Hero */}
          <div className="mt-14">
            <h2 className="text-4xl font-extrabold leading-snug text-white xl:text-5xl">Track Attendance.</h2>
            <h2 className="text-4xl font-extrabold leading-snug text-emerald-400 xl:text-5xl">Boost Performance.</h2>
            <p className="mt-4 max-w-xs text-sm leading-7 text-slate-400">
              Smart attendance management and outdoor sales tracking for modern teams.
            </p>
          </div>

          {/* Stat pills */}
          <div className="mt-8 flex flex-wrap gap-3">
            {[
              [Users,       'Team',   'Attendance'],
              [ShieldCheck, 'Secure', 'Access'],
              [MapPin,      'Live',   'GPS Tracking'],
            ].map(([Icon, value, label]) => (
              <div key={label} className="flex items-center gap-2.5 rounded-xl border border-white/10 bg-white/5 px-4 py-3">
                <Icon className="text-emerald-400" size={14} />
                <div>
                  <p className="text-sm font-extrabold text-emerald-400">{value}</p>
                  <p className="text-[11px] text-slate-400">{label}</p>
                </div>
              </div>
            ))}
          </div>

          {/* GPS Phone Mockup — fixed-size container so cards never shift */}
          <div className="relative mt-10 h-64 w-full">

            {/* City / tree silhouette */}
            <svg
              className="absolute bottom-0 left-0 w-full"
              viewBox="0 0 500 180"
              preserveAspectRatio="xMidYMax slice"
              aria-hidden="true"
            >
              <path
                d="M0,180 L0,120 L18,120 L18,95 L28,70 L38,45 L48,70 L58,95 L58,120
                   L80,120 L80,100 L92,75 L100,50 L108,75 L120,100 L120,120
                   L145,120 L145,105 L158,80 L168,55 L178,80 L188,105 L188,120
                   L210,120 L210,130 L225,105 L233,80 L238,55 L243,80 L253,105 L258,130 L258,120
                   L280,120 L280,100 L292,75 L300,50 L308,75 L320,100 L320,120
                   L345,120 L345,105 L358,78 L368,50 L378,78 L390,105 L390,120
                   L415,120 L415,130 L430,105 L438,80 L445,55 L452,80 L462,105 L470,130
                   L500,130 L500,180 Z"
                fill="#083d28"
                opacity="0.9"
              />
              <path
                d="M0,180 L0,145 L25,145 L25,128 L35,108 L45,85 L55,108 L65,128 L65,145
                   L95,145 L95,130 L110,108 L120,85 L130,108 L142,130 L142,145
                   L170,145 L170,132 L185,110 L200,180 L220,145
                   L240,145 L240,130 L255,108 L265,85 L275,108 L287,130 L287,145
                   L315,145 L315,130 L330,108 L350,145
                   L375,145 L375,130 L390,110 L400,88 L410,110 L425,130 L425,145
                   L455,145 L455,132 L470,110 L480,132 L500,145 L500,180 Z"
                fill="#051e14"
                opacity="0.95"
              />
            </svg>

            {/* Phone */}
            <div className="absolute left-4 top-0 h-52 w-[108px] overflow-hidden rounded-[1.6rem] border-2 border-slate-700 bg-[#061020] shadow-2xl shadow-black/60">
              <div className="flex h-full flex-col items-center justify-center gap-2">
                <div className="grid h-9 w-9 place-items-center rounded-full bg-emerald-500/20">
                  <MapPin className="text-emerald-400" size={20} />
                </div>
                <svg className="h-24 w-16" viewBox="0 0 64 96" aria-hidden="true">
                  <path
                    d="M32 0 C32 20, 16 36, 16 55 C16 74, 32 80, 32 96"
                    stroke="#10b981"
                    strokeWidth="2"
                    strokeDasharray="6 4"
                    fill="none"
                    opacity="0.65"
                  />
                </svg>
              </div>
            </div>

            {/* Check In card — fixed at top-right */}
            <div className="absolute right-4 top-8 flex items-center gap-3 rounded-2xl border border-white/10 bg-slate-800/90 px-4 py-3 shadow-xl backdrop-blur">
              <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-slate-600 text-xs font-bold text-white">A</div>
              <div>
                <p className="text-[11px] text-slate-400">Check In</p>
                <p className="text-sm font-extrabold text-white">08:01 AM</p>
              </div>
              <CheckCircle2 className="text-emerald-400" size={18} />
            </div>

            {/* Phnom Penh card — fixed at bottom-right */}
            <div className="absolute bottom-14 right-4 rounded-2xl border border-white/10 bg-slate-800/90 px-4 py-3 shadow-xl backdrop-blur">
              <p className="font-bold text-white">Phnom Penh</p>
              <div className="mt-1 flex items-center gap-1 text-[11px] text-emerald-400">
                <CheckCircle2 size={11} />
                Location Verified
              </div>
            </div>
          </div>

          {/* Features footer */}
          <div className="mt-auto grid grid-cols-3 gap-3 border-t border-white/10 pt-6">
            {FEATURES.map(([Icon, title, text]) => (
              <div key={title} className="flex items-start gap-2">
                <Icon className="mt-0.5 shrink-0 text-emerald-500" size={14} />
                <div>
                  <p className="text-xs font-bold text-emerald-400">{title}</p>
                  <p className="mt-0.5 text-[11px] text-slate-500">{text}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Right form panel — switches with dark/light ── */}
        <section className="relative flex min-h-screen flex-col items-center justify-center bg-slate-100 p-6 dark:bg-[#071827] sm:p-10">

          {/* Theme toggle */}
          <button
            type="button"
            className="absolute right-5 top-5 grid h-9 w-9 place-items-center rounded-lg border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10"
            onClick={onToggleDark}
            aria-label="Toggle theme"
          >
            {dark ? <Sun size={16} /> : <Moon size={16} />}
          </button>

          {/* Login card */}
          <div className="w-full max-w-[420px] rounded-2xl border border-slate-200 bg-white p-8 shadow-xl shadow-slate-200/60 dark:border-white/10 dark:bg-[#0d2235] dark:shadow-black/40">

            {/* Card header */}
            <div className="mb-7 flex flex-col items-center text-center">
              <div className="mb-5 grid h-14 w-14 place-items-center rounded-2xl bg-emerald-500 shadow-lg shadow-emerald-500/30 dark:shadow-emerald-950/60">
                <Activity size={28} className="text-white" />
              </div>
              <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">Welcome back</h2>
              <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">Sign in to your account to continue</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">

              {/* Username */}
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">
                  Username
                </label>
                <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 transition focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/10 dark:border-white/10 dark:bg-white/5 dark:focus-within:border-emerald-500/50">
                  <UserRound className="shrink-0 text-slate-400 dark:text-slate-500" size={17} />
                  <input
                    className="h-12 min-w-0 flex-1 bg-transparent text-sm font-medium text-slate-900 outline-none placeholder:font-normal placeholder:text-slate-400 dark:text-white dark:placeholder:text-slate-500"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    type="text"
                    autoComplete="username"
                    placeholder="Enter your username"
                    required
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">
                  Password
                </label>
                <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 transition focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/10 dark:border-white/10 dark:bg-white/5 dark:focus-within:border-emerald-500/50">
                  <Lock className="shrink-0 text-slate-400 dark:text-slate-500" size={17} />
                  <input
                    className="h-12 min-w-0 flex-1 bg-transparent text-sm font-medium text-slate-900 outline-none placeholder:font-normal placeholder:text-slate-400 dark:text-white dark:placeholder:text-slate-500"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    placeholder="Enter your password"
                    required
                  />
                  <button
                    type="button"
                    className="shrink-0 text-slate-400 transition hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
              </div>

              {/* Remember + Forgot */}
              <div className="flex items-center justify-between text-sm">
                <label className="flex cursor-pointer items-center gap-2 font-medium text-slate-600 dark:text-slate-300">
                  <input type="checkbox" className="h-4 w-4 rounded accent-emerald-500" defaultChecked />
                  Remember me
                </label>
                <button type="button" className="font-semibold text-emerald-600 transition hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300">
                  Forgot password?
                </button>
              </div>

              {/* Error */}
              {error && (
                <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700 dark:border-rose-500/30 dark:bg-rose-950/30 dark:text-rose-300">
                  {error}
                </div>
              )}

              {/* Submit */}
              <button
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 py-3.5 text-base font-bold text-white shadow-lg shadow-emerald-500/25 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60 dark:shadow-emerald-900/50"
                disabled={loading}
                type="submit"
              >
                <LogIn size={18} />
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>

            {/* Divider */}
            <div className="my-5 flex items-center gap-3">
              <div className="flex-1 border-t border-slate-200 dark:border-white/10" />
              <span className="text-xs text-slate-400 dark:text-slate-500">or</span>
              <div className="flex-1 border-t border-slate-200 dark:border-white/10" />
            </div>

            <p className="text-center text-sm text-slate-400 dark:text-slate-500">
              Use the credentials created by your administrator.
            </p>
          </div>

          {/* Mobile features — shown below card, hidden on desktop */}
          <div className="mt-8 grid grid-cols-3 gap-4 lg:hidden">
            {FEATURES.map(([Icon, title, text]) => (
              <div key={title} className="flex flex-col items-center text-center">
                <Icon className="mb-1.5 text-emerald-500" size={18} />
                <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400">{title}</p>
                <p className="mt-0.5 text-[11px] text-slate-500">{text}</p>
              </div>
            ))}
          </div>
        </section>

      </div>
    </div>
  )
}
