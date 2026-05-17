import { useRef, useState } from 'react'
import {
  Activity, BriefcaseBusiness, Building2, CalendarCheck, Camera,
  CheckCircle2, ChevronLeft, Clock, Copy, Download, Eye, EyeOff, FileText, KeyRound,
  LocateFixed, LogOut, Mail, MapPinned, Pencil, Phone,
  ShieldCheck, UserMinus, UserRound, Users, X,
} from 'lucide-react'
import clsx from 'clsx'
import { api } from '../services/api'
import { EmptyState, ErrorText, PanelHeader, StatusPill } from '../components/shared/UI'
import {
  apiError, attendanceLocationMapUrl, canUpdateOwnProfile, employeeFullName, formatAttendanceLocation, formatDate, formatRelativeTime, formatTime,
  initials, titleCase, userDisplayName,
} from '../utils/format'

const formatDuration = (minutes) => {
  if (!minutes) return '-'
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return `${h}h ${String(m).padStart(2, '0')}m`
}

export default function ProfilePage({ user, appData, setActive, onLogout, onProfileUpdated }) {
  const employee     = user.employee
  const fullName = userDisplayName(user)
  const roleName     = user.role?.name || '-'
  const attendanceRows = appData.attendance.slice(0, 5)
  const ownVisits    = appData.visits.filter((v) => !employee || v.employee_id === employee.id).slice(0, 4)
  const ownReports   = appData.reports.filter((r) => !employee || r.employee_id === employee.id).slice(0, 4)
  const presentCount = appData.attendance.filter((a) => a.status === 'present').length
  const lateCount    = appData.attendance.filter((a) => a.status === 'late').length
  const absentCount  = appData.attendance.filter((a) => a.status === 'absent').length
  const halfDayCount = appData.attendance.filter((a) => a.status === 'half_day').length
  const today        = appData.todayAttendance
  const latestLoc    = appData.dashboard?.live_locations?.[0]

  const [showEdit, setShowEdit] = useState(false)
  const protectedProfile = ['super_admin', 'admin'].includes(user.role?.slug)
  const canEdit = canUpdateOwnProfile(user) && Boolean(employee) && !protectedProfile

  const copyCode = () => {
    if (employee?.employee_code) navigator.clipboard?.writeText(employee.employee_code).catch(() => {})
  }

  const summaryStats = [
    { label: 'Present',  value: presentCount,  color: 'text-emerald-600' },
    { label: 'Late',     value: lateCount,     color: 'text-amber-500' },
    { label: 'Absent',   value: absentCount,   color: 'text-rose-500' },
    { label: 'Half Day', value: halfDayCount,  color: 'text-blue-500' },
  ]

  /* ── Mobile view ──────────────────────────────────────────────── */
  return (
    <>
      <div className="mx-auto w-full max-w-md space-y-4 pb-24 sm:hidden">

        {/* ── Profile card ── */}
        <div className="relative rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          {canEdit && (
            <button
              type="button"
              onClick={() => setShowEdit(true)}
              className="absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-xl border border-slate-200 bg-slate-50 text-slate-500 transition hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400"
              aria-label="Edit profile"
            >
              <Pencil size={16} />
            </button>
          )}

          <div className="flex items-start gap-4">
            {/* Avatar */}
            <div className="relative shrink-0">
              <div className="h-[84px] w-[84px] overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                {employee?.photo_url
                  ? <img className="h-full w-full object-cover" src={employee.photo_url} alt={fullName} />
                  : <div className="grid h-full w-full place-items-center text-2xl font-bold text-emerald-700 dark:text-emerald-400">{initials(fullName)}</div>
                }
              </div>
              {canEdit && (
                <button
                  type="button"
                  onClick={() => setShowEdit(true)}
                  className="absolute bottom-0.5 right-0.5 grid h-7 w-7 place-items-center rounded-full bg-emerald-600 text-white shadow-md"
                  aria-label="Change photo"
                >
                  <Camera size={13} />
                </button>
              )}
            </div>

            {/* Info */}
            <div className="min-w-0 flex-1 pt-1">
              <div className="flex flex-wrap items-center gap-2">
                <h4 className="text-xl font-bold text-slate-900 dark:text-slate-100">{fullName}</h4>
                <StatusPill status={titleCase(employee?.status || 'active')} />
              </div>
              <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">{employee?.position?.name || roleName}</p>

              <button
                className="mt-2 flex items-center gap-1.5 text-sm font-semibold text-slate-700 dark:text-slate-300"
                onClick={copyCode}
              >
                {employee?.employee_code || '-'}
                <Copy size={13} className="text-slate-400" />
              </button>

              <div className="mt-2 space-y-1 text-sm text-slate-600 dark:text-slate-400">
                <div className="flex items-center gap-1.5">
                  <Phone size={13} className="shrink-0 text-slate-400" />
                  <span>{employee?.phone || '-'}</span>
                </div>
                <div className="flex min-w-0 items-center gap-1.5">
                  <UserRound size={13} className="shrink-0 text-slate-400" />
                  <span className="truncate">{user.name || '-'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Stats row inside card */}
          <div className="mt-5 grid grid-cols-4 divide-x divide-slate-200 rounded-2xl border border-slate-200 py-3 dark:divide-slate-700 dark:border-slate-700">
            {[
              { label: 'Present',  value: presentCount,  Icon: CalendarCheck, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-950/30' },
              { label: 'Late',     value: lateCount,     Icon: Clock,         color: 'text-amber-500',   bg: 'bg-amber-50 dark:bg-amber-950/30' },
              { label: 'Absent',   value: absentCount,   Icon: UserMinus,     color: 'text-rose-500',    bg: 'bg-rose-50 dark:bg-rose-950/30' },
              { label: 'Half Day', value: halfDayCount,  Icon: Clock,         color: 'text-blue-500',    bg: 'bg-blue-50 dark:bg-blue-950/30' },
            ].map((s) => (
              <div key={s.label} className="px-1 text-center">
                <div className={clsx('mx-auto mb-1.5 grid h-8 w-8 place-items-center rounded-full', s.bg)}>
                  <s.Icon size={15} className={s.color} />
                </div>
                <p className={clsx('text-lg font-bold', s.color)}>{s.value}</p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Today's Status ── */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-2.5">
              <div className="grid h-8 w-8 place-items-center rounded-full bg-blue-50 dark:bg-blue-950/30">
                <Activity size={15} className="text-blue-600" />
              </div>
              <h4 className="font-bold text-slate-900 dark:text-slate-100">Today's Status</h4>
            </div>
            <StatusPill status={today ? titleCase(today.status) : 'Not Checked In'} />
          </div>
          <div className="divide-y divide-slate-100 px-4 dark:divide-slate-800">
            <TodayRow icon={LocateFixed} iconColor="text-emerald-600" iconBg="bg-emerald-50 dark:bg-emerald-950/30"
              label="Check In" time={formatTime(today?.check_in_at)} date={today?.check_in_at ? formatDate(today.check_in_at) : null} />
            <TodayRow icon={MapPinned} iconColor="text-rose-500" iconBg="bg-rose-50 dark:bg-rose-950/30"
              label="Check Out" time={formatTime(today?.check_out_at)} date={today?.check_out_at ? formatDate(today.check_out_at) : null} />
            <TodayRow icon={BriefcaseBusiness} iconColor="text-slate-600 dark:text-slate-300" iconBg="bg-slate-100 dark:bg-slate-800"
              label="Work Duration" time={formatDuration(today?.work_minutes)} />
          </div>
          <div className="h-1" />
        </div>

        {/* ── Attendance Summary ── */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="grid h-8 w-8 place-items-center rounded-full bg-blue-50 dark:bg-blue-950/30">
                <Activity size={15} className="text-blue-600" />
              </div>
              <div>
                <span className="font-bold text-slate-900 dark:text-slate-100">Attendance Summary </span>
                <span className="text-sm text-slate-400">(This Month)</span>
              </div>
            </div>
            <button className="text-sm font-semibold text-emerald-600">This Month</button>
          </div>
          <div className="mt-4 grid grid-cols-4 divide-x divide-slate-200 rounded-xl border border-slate-200 py-3 dark:divide-slate-700 dark:border-slate-700">
            {summaryStats.map((s) => (
              <div key={s.label} className="text-center">
                <p className={clsx('text-xl font-bold', s.color)}>{s.value}</p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Latest Location ── */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <MapPinned size={18} className="text-emerald-600" />
              <h4 className="font-bold text-slate-900 dark:text-slate-100">Latest Location</h4>
            </div>
            <span className="text-xs font-semibold text-emerald-600">
              {latestLoc?.recorded_at ? formatRelativeTime(latestLoc.recorded_at) : 'No data'}
            </span>
          </div>

          {/* Map placeholder */}
          <div className="relative h-32 overflow-hidden rounded-xl">
            {/* Map background gradient */}
            <div className="absolute inset-0 bg-[linear-gradient(160deg,#fef9c3_0%,#dcfce7_45%,#dbeafe_100%)]" />
            {/* Fake road lines */}
            <div className="absolute inset-0 opacity-25">
              <div className="absolute left-0 right-0 top-[45%] h-px bg-amber-500" />
              <div className="absolute left-0 right-0 top-[60%] h-px bg-amber-400" />
              <div className="absolute bottom-0 left-[40%] top-0 w-px bg-amber-500" />
              <div className="absolute bottom-0 left-[65%] top-0 w-px bg-amber-400" />
            </div>
            {/* Pin */}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-full">
              <div className="grid h-9 w-9 place-items-center rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/50 ring-2 ring-white">
                <MapPinned size={17} className="text-white" />
              </div>
              <div className="mx-auto h-2 w-2 rotate-45 bg-emerald-500" />
            </div>
            {/* Coordinates label */}
            {latestLoc && (
              <div className="absolute bottom-2 left-2 rounded-lg bg-white/90 px-2 py-1 text-[10px] font-semibold text-slate-700 shadow-sm">
                {Number(latestLoc.latitude).toFixed(4)}, {Number(latestLoc.longitude).toFixed(4)}
              </div>
            )}
            {!latestLoc && (
              <div className="absolute inset-0 flex items-center justify-center">
                <p className="text-xs font-medium text-slate-500">Current location not recorded yet</p>
              </div>
            )}
          </div>
        </div>

        {/* ── Logout ── */}
        <button
          onClick={onLogout}
          className="flex w-full items-center justify-center gap-3 rounded-2xl border border-rose-200 bg-rose-50 py-4 font-semibold text-rose-600 transition hover:bg-rose-100 dark:border-rose-900/40 dark:bg-rose-950/20 dark:text-rose-400"
        >
          <LogOut size={18} />
          Logout
        </button>
      </div>

      {showEdit && canEdit && (
        <EditProfileModal
          user={user}
          employee={employee}
          onClose={() => setShowEdit(false)}
          onSaved={async () => {
            setShowEdit(false)
            await onProfileUpdated?.()
          }}
        />
      )}

      <div className="hidden flex-wrap items-center justify-between gap-3 sm:flex">
        <div>
          <h3 className="text-2xl font-bold">Employee Profile</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">View and manage employee information.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold shadow-sm dark:border-slate-800 dark:bg-slate-900" onClick={() => window.print()}>
            <Download size={16} /> Print Profile
          </button>
          {canEdit && (
            <button className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white" onClick={() => setActive('Employees')}>Edit Profile</button>
          )}
        </div>
      </div>

      <div className="hidden gap-6 sm:grid xl:grid-cols-[1.35fr_0.8fr]">
        <div className="grid gap-6 lg:grid-cols-[0.55fr_1fr]">
          {/* Left column — avatar + contacts */}
          <div className="rounded-lg border border-slate-200 bg-white p-5 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="mx-auto grid h-32 w-32 place-items-center rounded-full bg-slate-100 text-4xl font-bold text-emerald-700 ring-8 ring-slate-50 dark:bg-slate-800 dark:ring-slate-950">
              {employee?.photo_url ? <img className="h-full w-full rounded-full object-cover" src={employee.photo_url} alt={fullName} /> : initials(fullName)}
            </div>
            <div className="mt-5">
              <div className="flex items-center justify-center gap-2">
                <h4 className="text-2xl font-bold">{fullName}</h4>
                <StatusPill status={titleCase(employee?.status || user.status || 'active')} />
              </div>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{employee?.position?.name || roleName}</p>
            </div>
            <div className="mt-6 space-y-4 text-left text-sm">
              <DesktopContact icon={FileText} label="Employee ID" value={employee?.employee_code} />
              <DesktopContact icon={Phone}    label="Phone Number" value={employee?.phone} />
              <DesktopContact icon={Mail}     label="Email Address" value={user.email} />
            </div>
            <button className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg border border-emerald-200 px-4 py-3 text-sm font-semibold text-emerald-700">
              <Download size={16} /> Download ID Card
            </button>
          </div>

          {/* Right column — details */}
          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <DesktopSection title="Personal Information" icon={Users}>
              <DesktopDetail label="Full Name"      value={fullName} />
              <DesktopDetail label="Phone Number"   value={employee?.phone} />
              <DesktopDetail label="Email Address"  value={user.email} />
              <DesktopDetail label="Address"        value={employee?.address} />
              <DesktopDetail label="Join Date"      value={formatDate(employee?.hire_date)} />
            </DesktopSection>
            <div className="mt-8">
              <DesktopSection title="Work Information" icon={BriefcaseBusiness}>
                <DesktopDetail label="Department"      value={employee?.department?.name} />
                <DesktopDetail label="Position"        value={employee?.position?.name} />
                <DesktopDetail label="Role"            value={roleName} />
                <DesktopDetail label="Branch"          value={employee?.branch?.name} />
                <DesktopDetail label="Employment Type" value={titleCase(employee?.employment_type)} />
              </DesktopSection>
            </div>
            <div className="mt-8">
              <DesktopSection title="Account Information" icon={KeyRound}>
                <DesktopDetail label="Account Name" value={fullName} />
                <DesktopDetail label="Username" value={user.name || '-'} />
                <DesktopDetail label="Role"            value={roleName} />
                <DesktopDetail label="Account Status"  value={titleCase(user.status || employee?.status || 'active')} />
              </DesktopSection>
            </div>
          </div>
        </div>

        {/* Right sidebar */}
        <div className="space-y-6">
          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h4 className="font-bold">Attendance Summary</h4>
            <div className="mt-5 grid grid-cols-2 gap-3">
              {[
                { label: 'Present',  value: presentCount,  tone: 'emerald', Icon: CalendarCheck },
                { label: 'Late',     value: lateCount,     tone: 'amber',   Icon: Clock },
                { label: 'Absent',   value: absentCount,   tone: 'rose',    Icon: UserMinus },
                { label: 'Half Day', value: halfDayCount,  tone: 'blue',    Icon: Clock },
              ].map((s) => <DesktopMiniStat key={s.label} {...s} />)}
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-4 flex items-center justify-between">
              <h4 className="font-bold">Today's Status</h4>
              <StatusPill status={today ? titleCase(today.status) : 'Not Checked In'} />
            </div>
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              <TodayRow icon={LocateFixed} iconColor="text-emerald-600" iconBg="bg-emerald-50" label="Check In" time={formatTime(today?.check_in_at)} />
              <TodayRow icon={MapPinned}   iconColor="text-rose-500"    iconBg="bg-rose-50"    label="Check Out" time={formatTime(today?.check_out_at)} />
              <TodayRow icon={BriefcaseBusiness} iconColor="text-slate-600" iconBg="bg-slate-100" label="Work Duration" time={formatDuration(today?.work_minutes)} />
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between">
              <h4 className="font-bold">Latest Location</h4>
              <span className="text-xs font-semibold text-emerald-600">{latestLoc ? 'Live' : 'No data'}</span>
            </div>
            <div className="mt-4 grid h-32 place-items-center rounded-lg bg-[linear-gradient(135deg,#dbeafe,#dcfce7)] text-center text-slate-700">
              <div>
                <MapPinned className="mx-auto mb-2 text-emerald-600" size={30} />
                <p className="text-sm font-semibold">
                  {latestLoc ? `${Number(latestLoc.latitude).toFixed(5)}, ${Number(latestLoc.longitude).toFixed(5)}` : 'Current location not recorded yet'}
                </p>
              </div>
            </div>
            <button className="mt-3 text-sm font-semibold text-emerald-700" onClick={() => setActive('Route Map')}>View on Map</button>
          </div>
        </div>
      </div>

      {/* Attendance history table */}
      <div className="hidden gap-6 sm:grid xl:grid-cols-[1.35fr_0.8fr]">
        <div className="rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <PanelHeader title="Attendance History" subtitle="Recent attendance records." actionLabel="View All" onAction={() => setActive('My Attendance')} />
          {attendanceRows.length === 0 ? <EmptyState text="No attendance history found." /> : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[920px] text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase text-slate-500 dark:bg-slate-950 dark:text-slate-400">
                  <tr>{['Date', 'Check In', 'Check Out', 'Duration', 'Status', 'Check In Location', 'Check Out Location'].map((h) => <th key={h} className="px-5 py-3">{h}</th>)}</tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {attendanceRows.map((row) => (
                    <tr key={row.id}>
                      <td className="px-5 py-4">{formatDate(row.attendance_date)}</td>
                      <td className="px-5 py-4">{formatTime(row.check_in_at)}</td>
                      <td className="px-5 py-4">{formatTime(row.check_out_at)}</td>
                      <td className="px-5 py-4">{formatDuration(row.work_minutes)}</td>
                      <td className="px-5 py-4"><StatusPill status={titleCase(row.status)} /></td>
                      <td className="max-w-[220px] px-5 py-4"><LocationLink attendance={row} type="check_in" /></td>
                      <td className="max-w-[220px] px-5 py-4"><LocationLink attendance={row} type="check_out" /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <PanelHeader title="Employee Documents" subtitle="Profile documents and reports." actionLabel="Reports" onAction={() => setActive('Daily Reports')} />
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {ownReports.length === 0 ? <EmptyState text="No reports submitted yet." /> : ownReports.map((report) => (
              <div key={report.id} className="flex items-center justify-between gap-3 p-4">
                <div className="flex items-center gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-lg bg-blue-50 text-blue-600">
                    <FileText size={18} />
                  </div>
                  <div>
                    <p className="font-semibold">{report.title}</p>
                    <p className="text-xs text-slate-500">{formatDate(report.report_date)}</p>
                  </div>
                </div>
                <StatusPill status={titleCase(report.status)} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}

function LocationLink({ attendance, type }) {
  const label = formatAttendanceLocation(attendance, type)
  const mapUrl = attendanceLocationMapUrl(attendance, type)

  if (!mapUrl) return label

  return (
    <a
      href={mapUrl}
      target="_blank"
      rel="noreferrer"
      className="inline-flex max-w-full flex-col gap-1 text-emerald-700 hover:text-emerald-800 dark:text-emerald-300 dark:hover:text-emerald-200"
    >
      <span className="truncate">{label}</span>
      <span className="text-xs font-semibold underline">View map</span>
    </a>
  )
}

/* ── Shared sub-components ────────────────────────────────────── */

function TodayRow({ icon: Icon, iconColor, iconBg, label, time, date }) {
  return (
    <div className="flex items-center gap-3 py-3.5">
      <div className={clsx('grid h-9 w-9 shrink-0 place-items-center rounded-full', iconBg)}>
        <Icon size={17} className={iconColor} />
      </div>
      <p className="flex-1 font-semibold text-slate-700 dark:text-slate-200">{label}</p>
      <div className="text-right">
        <p className="font-bold text-slate-900 dark:text-slate-100">{time || '-'}</p>
        {date && <p className="text-xs text-slate-400">{date}</p>}
      </div>
    </div>
  )
}

function DesktopContact({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-3">
      <div className="grid h-10 w-10 place-items-center rounded-lg bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
        <Icon size={17} />
      </div>
      <div>
        <p className="font-semibold">{value || '-'}</p>
        <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>
      </div>
    </div>
  )
}

function DesktopSection({ title, icon: Icon, children }) {
  return (
    <div>
      <div className="mb-4 flex items-center gap-3">
        <div className="grid h-9 w-9 place-items-center rounded-lg bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200">
          <Icon size={17} />
        </div>
        <h4 className="font-bold">{title}</h4>
      </div>
      <div className="space-y-3">{children}</div>
    </div>
  )
}

function DesktopDetail({ label, value }) {
  return (
    <div className="grid gap-2 text-sm sm:grid-cols-[150px_12px_1fr]">
      <p className="text-slate-500 dark:text-slate-400">{label}</p>
      <span className="hidden text-slate-400 sm:block">:</span>
      <p className="font-semibold">{value || '-'}</p>
    </div>
  )
}

function DesktopMiniStat({ label, value, Icon, tone }) {
  const styles = {
    emerald: 'bg-emerald-50 text-emerald-600',
    amber:   'bg-amber-50 text-amber-600',
    rose:    'bg-rose-50 text-rose-600',
    blue:    'bg-blue-50 text-blue-600',
  }
  return (
    <div className="rounded-lg border border-slate-200 p-4 dark:border-slate-800">
      <div className="flex items-center justify-between gap-3">
        <div className={clsx('grid h-10 w-10 place-items-center rounded-lg', styles[tone])}>
          <Icon size={19} />
        </div>
        <p className="text-2xl font-bold">{value}</p>
      </div>
      <p className="mt-2 text-right text-xs font-medium text-slate-500">{label}</p>
    </div>
  )
}

/* ── Edit Profile — full-page native-app overlay ─────────────── */

function EditProfileModal({ user, employee, onClose, onSaved }) {
  const fileRef = useRef(null)
  const [photoPreview, setPhotoPreview] = useState(employee?.photo_url || null)
  const [photoFile, setPhotoFile]       = useState(null)
  const [form, setForm] = useState({
    full_name: employeeFullName(employee, user.name),
    phone:      employee?.phone      || '',
    address:    employee?.address    || '',
    new_password:              '',
    new_password_confirmation: '',
  })
  const [showPw, setShowPw]         = useState(false)
  const [showConfirmPw, setShowConfirmPw] = useState(false)
  const [saving, setSaving]         = useState(false)
  const [error, setError]           = useState(null)

  const set = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }))
  const fullName = form.full_name.trim() || user.name

  const pickPhoto = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setPhotoFile(file)
    setPhotoPreview(URL.createObjectURL(file))
  }

  const handleSave = async () => {
    setError(null)
    setSaving(true)
    try {
      const fd = new FormData()
      if (photoFile) fd.append('photo', photoFile)
      if (form.full_name.trim()) fd.append('full_name', form.full_name.trim())
      if (form.phone) fd.append('phone', form.phone)
      if (form.address) fd.append('address', form.address)
      if (form.new_password) {
        fd.append('new_password', form.new_password)
        fd.append('new_password_confirmation', form.new_password_confirmation)
      }
      await api.post('/profile', fd)
      await onSaved()
    } catch (err) {
      setError(apiError(err))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-center bg-slate-100/95 dark:bg-slate-950/95">
      <div className="flex h-full w-full max-w-md flex-col bg-slate-100 dark:bg-slate-950 sm:my-6 sm:h-[calc(100%-3rem)] sm:rounded-2xl sm:shadow-2xl">

      {/* ── Top bar ── */}
      <div className="flex shrink-0 items-center justify-between bg-white px-4 py-3 shadow-sm dark:bg-slate-900 sm:rounded-t-2xl">
        <button
          type="button"
          onClick={onClose}
          className="grid h-9 w-9 place-items-center rounded-full text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
        >
          <ChevronLeft size={22} />
        </button>
        <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">Edit Profile</h2>
        <button
          onClick={handleSave}
          disabled={saving}
          className="font-semibold text-emerald-600 disabled:opacity-50 dark:text-emerald-400"
        >
          {saving ? 'Saving…' : 'Save'}
        </button>
      </div>

      {/* ── Scrollable body ── */}
      <div className="flex-1 overflow-y-auto px-4 py-5 space-y-5 pb-8">

        {/* Profile card */}
        <div className="rounded-2xl bg-white p-4 shadow-sm dark:bg-slate-900">
          <div className="flex items-center gap-4">
            {/* Avatar with camera */}
            <button type="button" onClick={() => fileRef.current?.click()} className="relative shrink-0">
              <div className="h-[84px] w-[84px] overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                {photoPreview
                  ? <img src={photoPreview} alt="avatar" className="h-full w-full object-cover" />
                  : <div className="grid h-full w-full place-items-center text-2xl font-bold text-emerald-700 dark:text-emerald-400">
                      {initials(fullName)}
                    </div>
                }
              </div>
              <div className="absolute bottom-0.5 right-0.5 grid h-8 w-8 place-items-center rounded-full bg-emerald-600 text-white shadow-md">
                <Camera size={15} />
              </div>
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={pickPhoto} />

            {/* Info */}
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-lg font-bold text-slate-900 dark:text-slate-100">{fullName}</span>
                <StatusPill status={titleCase(employee?.status || 'active')} />
              </div>
              <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
                {employee?.position?.name || user.role?.name || '-'}
              </p>
              <div className="mt-1.5 flex items-center gap-1.5">
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  {employee?.employee_code || '-'}
                </span>
                <Copy size={13} className="text-slate-400" />
              </div>
            </div>
          </div>
        </div>

        {/* ── Personal Information ── */}
        <div>
          <h4 className="mb-3 px-1 text-[15px] font-bold text-slate-900 dark:text-slate-100">Personal Information</h4>
          <div className="overflow-hidden rounded-2xl bg-white shadow-sm dark:bg-slate-900 divide-y divide-slate-100 dark:divide-slate-800">
            <EditRow icon={UserRound}  label="Full Name"     value={form.full_name} onChange={set('full_name')} placeholder="Your full name" />
            <EditRow icon={Phone}      label="Phone Number"  value={form.phone}      onChange={set('phone')}      placeholder="+855 xx xxx xxx" type="tel" />
            <EditRow icon={Mail}       label="Email Address" value={user.email}      readOnly />
            <EditRow icon={MapPinned}  label="Address"       value={form.address}    onChange={set('address')}    placeholder="Your address" multiline />
          </div>
        </div>

        {/* ── Work Information (read-only) ── */}
        <div>
          <h4 className="mb-3 px-1 text-[15px] font-bold text-slate-900 dark:text-slate-100">Work Information</h4>
          <div className="overflow-hidden rounded-2xl bg-white shadow-sm dark:bg-slate-900 divide-y divide-slate-100 dark:divide-slate-800">
            <EditRow icon={BriefcaseBusiness} label="Department"  value={employee?.department?.name} readOnly />
            <EditRow icon={Building2}         label="Position"    value={employee?.position?.name}   readOnly />
            <EditRow icon={FileText}          label="Employee ID" value={employee?.employee_code}    readOnly />
          </div>
        </div>

        {/* ── Change Password ── */}
        <div>
          <h4 className="mb-3 px-1 text-[15px] font-bold text-slate-900 dark:text-slate-100">
            Change Password{' '}
            <span className="text-sm font-normal text-slate-400">(Optional)</span>
          </h4>
          <div className="overflow-hidden rounded-2xl bg-white shadow-sm dark:bg-slate-900 divide-y divide-slate-100 dark:divide-slate-800">
            <EditRow
              icon={KeyRound}
              label="New Password"
              value={form.new_password}
              onChange={set('new_password')}
              placeholder="Enter new password"
              type={showPw ? 'text' : 'password'}
              suffix={
                <button type="button" onClick={() => setShowPw((p) => !p)} className="text-slate-400">
                  {showPw ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              }
            />
            <EditRow
              icon={KeyRound}
              label="Confirm New Password"
              value={form.new_password_confirmation}
              onChange={set('new_password_confirmation')}
              placeholder="Confirm new password"
              type={showConfirmPw ? 'text' : 'password'}
              suffix={
                <button type="button" onClick={() => setShowConfirmPw((p) => !p)} className="text-slate-400">
                  {showConfirmPw ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              }
            />
          </div>
        </div>

        {error && (
          <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm font-medium text-rose-600 dark:bg-rose-950/30 dark:text-rose-400">
            {error}
          </p>
        )}

        {/* ── Save button ── */}
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="flex w-full items-center justify-center gap-2.5 rounded-2xl bg-emerald-600 py-4 text-base font-semibold text-white shadow-lg shadow-emerald-500/20 active:scale-[0.98] disabled:opacity-60"
        >
          <CheckCircle2 size={18} />
          {saving ? 'Saving…' : 'Save Changes'}
        </button>
      </div>
      </div>
    </div>
  )
}

/* ── Row used inside EditProfileModal ────────────────────────── */
function EditRow({ icon: Icon, label, value, onChange, placeholder, type = 'text', readOnly, multiline, suffix }) {
  return (
    <div className="flex items-center gap-3.5 px-4 py-3.5">
      <Icon size={18} className="shrink-0 text-slate-400" />
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-slate-400 dark:text-slate-500">{label}</p>
        {readOnly ? (
          <p className="mt-0.5 text-sm font-medium text-slate-800 dark:text-slate-200">{value || '-'}</p>
        ) : multiline ? (
          <textarea
            rows={2}
            value={value || ''}
            onChange={onChange}
            placeholder={placeholder}
            className="mt-1 w-full resize-none rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          />
        ) : (
          <input
            type={type}
            value={value || ''}
            onChange={onChange}
            placeholder={placeholder}
            className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          />
        )}
      </div>
      {suffix && <div className="shrink-0">{suffix}</div>}
    </div>
  )
}
