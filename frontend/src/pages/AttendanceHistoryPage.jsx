import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  CalendarCheck, ChevronLeft, ChevronRight, Clock,
  Download, Eye, LogOut, MapPin, Pencil, RefreshCw,
  Search, UserMinus, Users, X,
} from 'lucide-react'
import clsx from 'clsx'
import { api } from '../services/api'
import { EmptyState } from '../components/shared/UI'
import { attendanceLocationMapUrl, employeeFullName, initials } from '../utils/format'

const todayStr = () => new Date().toISOString().split('T')[0]

const STATUS_STYLE = {
  present:  { label: 'Present',     dot: 'bg-emerald-500', cls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400' },
  late:     { label: 'Late',        dot: 'bg-amber-400',   cls: 'bg-amber-100  text-amber-700  dark:bg-amber-950/60  dark:text-amber-400'  },
  absent:   { label: 'Absent',      dot: 'bg-rose-500',    cls: 'bg-rose-100   text-rose-700   dark:bg-rose-950/60   dark:text-rose-400'   },
  half_day: { label: 'Half Day',    dot: 'bg-sky-400',     cls: 'bg-sky-100    text-sky-700    dark:bg-sky-950/60    dark:text-sky-400'    },
  on_leave: { label: 'On Leave',    dot: 'bg-sky-400',     cls: 'bg-sky-100    text-sky-700    dark:bg-sky-950/60    dark:text-sky-400'    },
}

const TYPE_STYLE = {
  office:  { label: 'Office',  cls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400' },
  outdoor: { label: 'Outdoor', cls: 'bg-sky-100     text-sky-600     dark:bg-sky-950/60     dark:text-sky-400'     },
}

function formatWorkHours(minutes) {
  if (minutes == null || minutes === '') return '–'
  const h = Math.floor(Number(minutes) / 60)
  const m = Number(minutes) % 60
  return `${h}h ${String(m).padStart(2, '0')}m`
}

export default function AttendanceHistoryPage({ appData }) {
  const [rows, setRows]         = useState([])
  const [loading, setLoading]   = useState(true)
  const [date, setDate]         = useState(todayStr())
  const [department, setDept]   = useState('')
  const [branch, setBranch]     = useState('')
  const [empSearch, setEmpSearch] = useState('')
  const [status, setStatus]     = useState('')
  const [type, setType]         = useState('')
  const [page, setPage]         = useState(1)
  const [perPage, setPerPage]   = useState(10)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = { per_page: 500 }
      if (date)   params.date   = date
      if (status) params.status = status
      const res = await api.get('/attendance', { params })
      setRows(res.data.data || res.data || [])
      setPage(1)
    } catch {
      setRows([])
    } finally {
      setLoading(false)
    }
  }, [date, status])

  useEffect(() => { load() }, [load])

  /* ── Derived filter options ───────────────────────────────────── */
  const employees    = appData?.employees || []
  const departments  = useMemo(() => [...new Set(employees.map((e) => e.department?.name).filter(Boolean))].sort(), [employees])
  const branches     = useMemo(() => [...new Set(employees.map((e) => e.branch?.name).filter(Boolean))].sort(),     [employees])

  /* ── Client-side filtering ────────────────────────────────────── */
  const filtered = useMemo(() => {
    const q = empSearch.trim().toLowerCase()
    return rows.filter((item) => {
      if (q) {
        const name = employeeFullName(item.employee).toLowerCase()
        const code = (item.employee?.employee_code || '').toLowerCase()
        if (!name.includes(q) && !code.includes(q)) return false
      }
      if (department && item.employee?.department?.name !== department) return false
      if (branch     && item.employee?.branch?.name     !== branch)     return false
      if (type       && item.type !== type)                              return false
      return true
    })
  }, [rows, empSearch, department, branch, type])

  /* ── Stats (from all API rows, not client-filtered) ──────────── */
  const stats = useMemo(() => {
    const total = rows.length || 1
    const count = (fn) => rows.filter(fn).length
    const pct   = (n)  => total ? ((n / total) * 100).toFixed(2) + '% of total' : '0%'
    const present     = count((r) => r.status === 'present')
    const late        = count((r) => r.status === 'late')
    const absent      = count((r) => r.status === 'absent')
    const onLeave     = count((r) => r.status === 'on_leave' || r.status === 'half_day')
    const missingOut  = count((r) => r.check_in_at && !r.check_out_at && r.status !== 'absent')
    return [
      { label: 'Present Today',      value: present,    pct: pct(present),   icon: Users,        tone: 'emerald' },
      { label: 'Late Today',         value: late,       pct: pct(late),      icon: Clock,        tone: 'amber'   },
      { label: 'Absent Today',       value: absent,     pct: pct(absent),    icon: UserMinus,    tone: 'rose'    },
      { label: 'On Leave',           value: onLeave,    pct: pct(onLeave),   icon: CalendarCheck,tone: 'sky'     },
      { label: 'Missing Check Out',  value: missingOut, pct: pct(missingOut),icon: LogOut,       tone: 'violet'  },
    ]
  }, [rows])

  /* ── Pagination ───────────────────────────────────────────────── */
  const totalPages  = Math.max(1, Math.ceil(filtered.length / perPage))
  const safePage    = Math.min(page, totalPages)
  const paginated   = filtered.slice((safePage - 1) * perPage, safePage * perPage)

  const reset = () => {
    setDate(todayStr())
    setDept('')
    setBranch('')
    setEmpSearch('')
    setStatus('')
    setType('')
    setPage(1)
  }

  /* ── CSV export ───────────────────────────────────────────────── */
  const exportCsv = () => {
    const headers = ['#', 'Code', 'Employee', 'Department', 'Check In', 'Check Out', 'Work Hours', 'Status', 'Type', 'Check In Location', 'Check Out Location']
    const csvData = filtered.map((item, i) => [
      i + 1,
      item.employee?.employee_code || '',
      employeeFullName(item.employee),
      item.employee?.department?.name || '',
      item.check_in_at  ? new Date(item.check_in_at).toLocaleString()  : '',
      item.check_out_at ? new Date(item.check_out_at).toLocaleString() : '',
      formatWorkHours(item.work_minutes),
      item.status || '',
      item.type   || '',
      item.check_in_address  || '',
      item.check_out_address || '',
    ])
    const csv  = [headers, ...csvData].map((r) => r.map((v) => `"${v}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url  = URL.createObjectURL(blob)
    const a    = Object.assign(document.createElement('a'), { href: url, download: `attendance-${date || 'all'}.csv` })
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-5">
      {/* ── Page header ─────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-950 dark:text-white">Attendance</h2>
          <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">View All Attendance</p>
        </div>
        <button
          onClick={load}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
        >
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* ── Stats row ───────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-5">
        {stats.map((stat) => <StatCard key={stat.label} {...stat} />)}
      </div>

      {/* ── Filters ─────────────────────────────────────────────── */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        {/* Row 1 */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {/* Date */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-500 dark:text-slate-400">Date</label>
            <input
              type="date"
              className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
          {/* Department */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-500 dark:text-slate-400">Department</label>
            <select
              className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              value={department}
              onChange={(e) => { setDept(e.target.value); setPage(1) }}
            >
              <option value="">All Departments</option>
              {departments.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          {/* Branch */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-500 dark:text-slate-400">Branch</label>
            <select
              className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              value={branch}
              onChange={(e) => { setBranch(e.target.value); setPage(1) }}
            >
              <option value="">All Branches</option>
              {branches.map((b) => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>
          {/* Employee search */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-500 dark:text-slate-400">Employee</label>
            <div className="relative">
              <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                className="h-11 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                placeholder="Search employee..."
                value={empSearch}
                onChange={(e) => { setEmpSearch(e.target.value); setPage(1) }}
              />
            </div>
          </div>
          {/* Status */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-500 dark:text-slate-400">Status</label>
            <select
              className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="">All Status</option>
              <option value="present">Present</option>
              <option value="late">Late</option>
              <option value="absent">Absent</option>
              <option value="half_day">Half Day</option>
              <option value="on_leave">On Leave</option>
            </select>
          </div>
        </div>

        {/* Row 2 */}
        <div className="mt-3 flex flex-wrap items-end justify-between gap-3">
          <div className="flex flex-wrap items-end gap-3">
            {/* Type */}
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-500 dark:text-slate-400">Attendance Type</label>
              <select
                className="h-11 rounded-lg border border-slate-200 bg-white px-3 pr-8 text-sm outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                value={type}
                onChange={(e) => { setType(e.target.value); setPage(1) }}
              >
                <option value="">All Types</option>
                <option value="office">Office</option>
                <option value="outdoor">Outdoor</option>
              </select>
            </div>
            <button
              onClick={load}
              className="h-11 rounded-lg bg-emerald-600 px-6 text-sm font-semibold text-white shadow-lg shadow-emerald-600/25 transition hover:bg-emerald-700"
            >
              Filter
            </button>
            <button
              onClick={reset}
              className="h-11 rounded-lg border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"
            >
              Reset
            </button>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={exportCsv}
              className="inline-flex h-11 items-center gap-2 rounded-lg border border-emerald-200 bg-white px-4 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-50 dark:border-emerald-900 dark:bg-slate-950 dark:text-emerald-400"
            >
              <Download size={15} />
              Export CSV
            </button>
          </div>
        </div>
      </div>

      {/* ── Table ───────────────────────────────────────────────── */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        {loading ? (
          <div className="flex items-center justify-center py-20 text-sm text-slate-400">
            <RefreshCw size={18} className="mr-2 animate-spin" /> Loading...
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState text="No attendance records found." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1380px] text-left text-sm">
              <thead className="border-b border-slate-100 bg-slate-50/80 text-xs font-bold uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400">
                <tr>
                  {['#', 'Employee', 'Department', 'Check In', 'Check Out', 'Working Hours', 'Status', 'Type', 'Check In Location', 'Check Out Location', 'Action'].map((col) => (
                    <th key={col} className="px-4 py-4">{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {paginated.map((item, idx) => {
                  const fullName   = employeeFullName(item.employee)
                  const photo      = item.employee?.photo_url
                  const statusInfo = STATUS_STYLE[item.status] || { label: item.status, dot: 'bg-slate-400', cls: 'bg-slate-100 text-slate-600' }
                  const typeInfo   = TYPE_STYLE[item.type]     || { label: item.type,   cls: 'bg-slate-100 text-slate-600' }
                  const rowNum     = (safePage - 1) * perPage + idx + 1
                  const isLate     = item.status === 'late'
                  const hasCheckIn = Boolean(item.check_in_at)
                  const mapUrl     = attendanceLocationMapUrl(item, 'check_in')

                  return (
                    <tr key={item.id} className="transition hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                      {/* # */}
                      <td className="px-4 py-4 text-slate-400">{rowNum}</td>

                      {/* Employee */}
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-full bg-slate-100 text-xs font-bold text-slate-500 dark:bg-slate-800 dark:text-slate-300">
                            {photo ? <img src={photo} alt={fullName} className="h-full w-full object-cover" /> : initials(fullName)}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900 dark:text-slate-100">{fullName || '–'}</p>
                            <p className="text-[11px] text-slate-400">{item.employee?.employee_code || '–'}</p>
                          </div>
                        </div>
                      </td>

                      {/* Department */}
                      <td className="px-4 py-4 text-slate-600 dark:text-slate-300">{item.employee?.department?.name || '–'}</td>

                      {/* Check In */}
                      <td className="px-4 py-4">
                        <TimeCell datetime={item.check_in_at} isLate={isLate} />
                      </td>

                      {/* Check Out */}
                      <td className="px-4 py-4">
                        {item.check_out_at
                          ? <TimeCell datetime={item.check_out_at} isLate={false} />
                          : (
                            <div>
                              <span className="text-slate-400">–</span>
                              {hasCheckIn && <p className="text-[11px] text-amber-500">Not yet</p>}
                            </div>
                          )
                        }
                      </td>

                      {/* Working Hours */}
                      <td className="px-4 py-4 font-semibold text-slate-700 dark:text-slate-200">
                        {item.work_minutes ? formatWorkHours(item.work_minutes) : '–'}
                      </td>

                      {/* Status */}
                      <td className="px-4 py-4">
                        <span className={clsx('inline-flex items-center rounded-full px-3 py-1 text-xs font-bold', statusInfo.cls)}>
                          {statusInfo.label}
                        </span>
                      </td>

                      {/* Type */}
                      <td className="px-4 py-4">
                        {item.type ? (
                          <span className={clsx('inline-flex items-center rounded-full px-3 py-1 text-xs font-bold', typeInfo.cls)}>
                            {typeInfo.label}
                          </span>
                        ) : '–'}
                      </td>

                      {/* Check In Location */}
                      <td className="max-w-[160px] px-4 py-4">
                        <LocationCell item={item} type="check_in" />
                      </td>

                      {/* Check Out Location */}
                      <td className="max-w-[160px] px-4 py-4">
                        <LocationCell item={item} type="check_out" />
                      </td>

                      {/* Action */}
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-1.5">
                          <ActionBtn icon={Eye} label="View" tone="slate" onClick={() => {}} />
                          <ActionBtn icon={Pencil} label="Edit" tone="sky" onClick={() => {}} />
                          {mapUrl && (
                            <a
                              href={mapUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="grid h-8 w-8 place-items-center rounded-lg border border-emerald-200 text-emerald-600 transition hover:bg-emerald-50 dark:border-emerald-900/60 dark:hover:bg-emerald-950/30"
                              title="View on map"
                            >
                              <MapPin size={14} />
                            </a>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* ── Footer / Pagination ───────────────────────────────── */}
        {!loading && filtered.length > 0 && (
          <div className="flex flex-col gap-3 border-t border-slate-100 px-5 py-4 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Showing {(safePage - 1) * perPage + 1} to {Math.min(safePage * perPage, filtered.length)} of {filtered.length} entries
            </p>
            <div className="flex items-center gap-2">
              <Pagination page={safePage} totalPages={totalPages} onChange={setPage} />
              {/* Per page */}
              <select
                className="h-9 rounded-lg border border-slate-200 bg-white px-2 text-sm text-slate-700 outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"
                value={perPage}
                onChange={(e) => { setPerPage(Number(e.target.value)); setPage(1) }}
              >
                {[5, 10, 25, 50].map((n) => <option key={n} value={n}>{n} / page</option>)}
              </select>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

/* ── Sub-components ──────────────────────────────────────────────── */

function StatCard({ label, value, pct, icon: Icon, tone }) {
  const tones = {
    emerald: { card: 'border-emerald-200 bg-emerald-50/40 dark:border-emerald-900/50 dark:bg-emerald-950/20', icon: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/50 dark:text-emerald-400' },
    amber:   { card: 'border-amber-200   bg-amber-50/40   dark:border-amber-900/50   dark:bg-amber-950/20',   icon: 'bg-amber-100   text-amber-600   dark:bg-amber-900/50   dark:text-amber-400'   },
    rose:    { card: 'border-rose-200    bg-rose-50/40    dark:border-rose-900/50    dark:bg-rose-950/20',    icon: 'bg-rose-100    text-rose-600    dark:bg-rose-900/50    dark:text-rose-400'    },
    sky:     { card: 'border-sky-200     bg-sky-50/40     dark:border-sky-900/50     dark:bg-sky-950/20',     icon: 'bg-sky-100     text-sky-600     dark:bg-sky-900/50     dark:text-sky-400'     },
    violet:  { card: 'border-violet-200  bg-violet-50/40  dark:border-violet-900/50  dark:bg-violet-950/20',  icon: 'bg-violet-100  text-violet-600  dark:bg-violet-900/50  dark:text-violet-400'  },
  }
  const t = tones[tone]
  return (
    <div className={clsx('flex items-center gap-4 rounded-xl border p-5 shadow-sm', t.card)}>
      <div className={clsx('grid h-14 w-14 shrink-0 place-items-center rounded-2xl', t.icon)}>
        <Icon size={26} />
      </div>
      <div className="min-w-0">
        <p className="text-3xl font-bold text-slate-950 dark:text-white">{value}</p>
        <p className="mt-0.5 truncate text-sm font-semibold text-slate-600 dark:text-slate-300">{label}</p>
        <p className="mt-0.5 truncate text-xs text-slate-400">{pct}</p>
      </div>
    </div>
  )
}

function TimeCell({ datetime, isLate }) {
  if (!datetime) return <span className="text-slate-400">–</span>
  const d    = new Date(datetime)
  const time = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
  const date = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  return (
    <div className="flex items-start gap-2">
      <span className={clsx('mt-[5px] h-2 w-2 shrink-0 rounded-full', isLate ? 'bg-amber-400' : 'bg-emerald-500')} />
      <div>
        <p className="font-semibold text-slate-900 dark:text-slate-100">{time}</p>
        <p className="text-[11px] text-slate-400">{date}</p>
      </div>
    </div>
  )
}

function LocationCell({ item, type = 'check_in' }) {
  const address = type === 'check_in' ? item.check_in_address  : item.check_out_address
  const lat     = type === 'check_in' ? item.check_in_latitude : item.check_out_latitude
  const mapUrl  = attendanceLocationMapUrl(item, type)

  if (!address && !lat) return <span className="text-slate-400">–</span>

  const lng   = type === 'check_in' ? item.check_in_longitude : item.check_out_longitude
  const label = address || `${parseFloat(lat).toFixed(4)}, ${parseFloat(lng).toFixed(4)}`
  const Inner = (
    <>
      <MapPin size={13} className="mt-0.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-slate-700 dark:text-slate-200">{label}</p>
        {lat && <p className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">GPS Verified</p>}
      </div>
    </>
  )

  if (mapUrl) {
    return (
      <a href={mapUrl} target="_blank" rel="noreferrer" className="flex items-start gap-1.5 hover:opacity-80">
        {Inner}
      </a>
    )
  }
  return <div className="flex items-start gap-1.5">{Inner}</div>
}

function ActionBtn({ icon: Icon, label, tone, onClick }) {
  const tones = {
    slate: 'border-slate-200 text-slate-500 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800',
    sky:   'border-sky-200   text-sky-600   hover:bg-sky-50   dark:border-sky-900/60 dark:hover:bg-sky-950/30',
  }
  return (
    <button
      onClick={onClick}
      title={label}
      className={clsx('grid h-8 w-8 place-items-center rounded-lg border transition', tones[tone])}
    >
      <Icon size={14} />
    </button>
  )
}

function Pagination({ page, totalPages, onChange }) {
  const pages = []
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i)
  } else {
    pages.push(1)
    if (page > 3)              pages.push('…')
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) pages.push(i)
    if (page < totalPages - 2) pages.push('…')
    pages.push(totalPages)
  }

  return (
    <div className="flex items-center gap-1">
      <PageBtn disabled={page <= 1} onClick={() => onChange(page - 1)}>
        <ChevronLeft size={15} />
      </PageBtn>
      {pages.map((p, i) =>
        p === '…'
          ? <span key={`ellipsis-${i}`} className="px-1 text-slate-400">...</span>
          : (
            <PageBtn key={p} active={p === page} onClick={() => onChange(p)}>
              {p}
            </PageBtn>
          )
      )}
      <PageBtn disabled={page >= totalPages} onClick={() => onChange(page + 1)}>
        <ChevronRight size={15} />
      </PageBtn>
    </div>
  )
}

function PageBtn({ children, active, disabled, onClick }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={clsx(
        'grid h-9 min-w-[2.25rem] place-items-center rounded-lg border px-2 text-sm font-semibold transition',
        active
          ? 'border-emerald-600 bg-emerald-600 text-white'
          : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300',
      )}
    >
      {children}
    </button>
  )
}
