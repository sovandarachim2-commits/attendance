import { useCallback, useEffect, useRef, useState } from 'react'
import { GoogleMap, MarkerF, PolylineF, useJsApiLoader } from '@react-google-maps/api'
import { motion } from 'framer-motion'
import {
  Activity,
  Bell,
  BriefcaseBusiness,
  Building2,
  CalendarCheck,
  Camera,
  CheckCircle2,
  ChevronDown,
  Clock,
  Download,
  Eye,
  EyeOff,
  FileText,
  Fingerprint,
  Folder,
  Home,
  KeyRound,
  List,
  LocateFixed,
  LogOut,
  Mail,
  MapPinned,
  Menu,
  Moon,
  Phone,
  ShieldCheck,
  ShoppingBag,
  Sun,
  Users,
  UserRound,
  X,
} from 'lucide-react'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import clsx from 'clsx'
import { api, attendanceService, authService, dashboardService } from './services/api'

const navItems = [
  { label: 'Dashboard', icon: Home, permissions: ['dashboard_access', 'employee_dashboard_access'] },
  { label: 'Check In / Out', icon: CalendarCheck, permissions: ['attendance_check_in', 'office_check_in', 'attendance_check_out', 'office_check_out'] },
  { label: 'My Attendance', icon: Clock, permissions: ['view_own_attendance', 'view_all_attendance'] },
  { label: 'Customer Visits', icon: ShoppingBag, permissions: ['create_customer_visit', 'view_customer_visits', 'manage_customer_visits'] },
  { label: 'Daily Reports', icon: FileText, permissions: ['submit_daily_report', 'view_own_reports', 'view_reports', 'view_sales_reports'] },
  { label: 'Route Map', icon: MapPinned, permissions: ['gps_tracking_access', 'route_tracking_access', 'view_gps_tracking', 'monitor_route_history'] },
  { label: 'Profile', icon: Users, permissions: ['update_profile', 'employee_dashboard_access', 'dashboard_access'] },
  { label: 'Notifications', icon: Bell, permissions: ['receive_notifications', 'manage_notifications'] },
]

const adminItems = [
  { label: 'Employees', icon: Users, permissions: ['manage_employees', 'create_employee', 'edit_employee', 'view_employee_profiles'] },
  { label: 'Departments', icon: Building2, permissions: ['manage_departments'] },
  { label: 'Positions', icon: BriefcaseBusiness, permissions: ['manage_positions'] },
  { label: 'Users & Roles', icon: ShieldCheck, permissions: ['manage_roles', 'manage_permissions'] },
  { label: 'Outdoor Sales', icon: MapPinned, permissions: ['manage_customer_visits', 'view_sales_team', 'view_customer_visits'] },
  { label: 'Reports', icon: FileText, permissions: ['view_reports', 'export_reports', 'view_attendance_reports', 'view_sales_reports'] },
  { label: 'Security', icon: ShieldCheck, permissions: ['manage_security_settings', 'manage_api_keys', 'system_settings_access'] },
]

const emptyCards = {
  total_employees: 0,
  present: 0,
  late: 0,
  outdoor_visits: 0,
}

function App() {
  const [active, setActive] = useState('Dashboard')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [dark, setDark] = useState(false)
  const [user, setUser] = useState(null)
  const [authLoading, setAuthLoading] = useState(Boolean(localStorage.getItem('attendance_token')))
  const [attendanceAction, setAttendanceAction] = useState(null)
  const [modal, setModal] = useState(null)
  const [editingEmployee, setEditingEmployee] = useState(null)
  const [data, setData] = useState({
    dashboard: null,
    todayAttendance: null,
    attendance: [],
    employees: [],
    visits: [],
    reports: [],
    notifications: [],
    loading: false,
  })

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
  })

  const loadRealData = useCallback(async () => {
    setData((current) => ({ ...current, loading: true }))

    const [dashboard, todayAttendance, attendance, employees, visits, reports, notifications] = await Promise.all([
      dashboardService.overview().catch(() => null),
      attendanceService.today().catch(() => null),
      api.get('/attendance').then((response) => response.data.data || []).catch(() => []),
      api.get('/employees').then((response) => response.data.data || []).catch(() => []),
      api.get('/customer-visits').then((response) => response.data.data || []).catch(() => []),
      api.get('/reports').then((response) => response.data.data || []).catch(() => []),
      api.get('/notifications').then((response) => response.data.data || []).catch(() => []),
    ])

    setData({ dashboard, todayAttendance, attendance, employees, visits, reports, notifications, loading: false })
  }, [])

  useEffect(() => {
    if (!localStorage.getItem('attendance_token')) return

    let mounted = true

    authService
      .me()
      .then((account) => {
        if (!mounted) return
        setUser(account)
        loadRealData()
      })
      .catch(() => localStorage.removeItem('attendance_token'))
      .finally(() => {
        if (mounted) setAuthLoading(false)
      })

    return () => {
      mounted = false
    }
  }, [loadRealData])

  const handleLogin = (account) => {
    setUser(account)
    loadRealData()
  }

  const handleLogout = async () => {
    await authService.logout()
    setUser(null)
    setActive('Dashboard')
  }

  const openAttendanceAction = (type) => {
    setAttendanceAction(type)
  }

  const pageTitle = active === 'Outdoor Sales' ? 'Outdoor Sales Tracking' : active
  const unreadCount = data.notifications.filter((item) => !item.read_at).length

  const props = { appData: data, isLoaded, refresh: loadRealData, user, onAttendanceAction: openAttendanceAction, setActive, setModal, setEditingEmployee }
  const pages = {
    Dashboard: <DashboardPage {...props} />,
    'Check In / Out': <AttendancePage {...props} />,
    'My Attendance': <AttendancePage {...props} />,
    'Customer Visits': <OutdoorSalesPage {...props} />,
    'Daily Reports': <ReportsPage {...props} />,
    'My Reports': <ReportsPage {...props} />,
    'Route Map': <OutdoorSalesPage {...props} />,
    Notifications: <NotificationsPage {...props} />,
    Profile: <ProfilePage {...props} />,
    Settings: <SecurityPage />,
    'Help & Support': <SecurityPage />,
    Employees: <EmployeesPage {...props} />,
    Departments: <DepartmentsPage />,
    Positions: <PositionsPage />,
    'Users & Roles': <UsersRolesPage />,
    'Outdoor Sales': <OutdoorSalesPage {...props} />,
    Reports: <ReportsPage {...props} />,
    Security: <SecurityPage />,
  }
  const page = pages[active]

  if (authLoading) return <LoadingScreen />
  if (!user) return <LoginPage dark={dark} onToggleDark={() => setDark((value) => !value)} onLogin={handleLogin} />

  const employee = user.employee
  const displayName = employee ? `${employee.first_name} ${employee.last_name}` : user.name
  const roleName = user.role?.name || 'Employee'
  const today = data.todayAttendance
  const visibleItems = [...navItems, ...adminItems].filter((item) => canAccess(user, item.permissions))
  const canSeeNotifications = canAccess(user, ['receive_notifications', 'manage_notifications'])

  return (
    <div className={clsx(dark && 'dark')}>
      <div className="min-h-screen bg-[#f5f8fb] text-slate-900 transition-colors dark:bg-slate-950 dark:text-slate-100">
        <aside className={clsx(
          'fixed inset-y-0 left-0 z-40 w-72 overflow-y-auto bg-[#071927] p-5 text-white shadow-xl transition-transform lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full',
        )}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-lg bg-emerald-500 text-white">
                <Activity size={22} />
              </div>
              <div>
                <h1 className="text-lg font-bold">SalesTrack</h1>
                <p className="text-xs text-slate-300">Employee Panel</p>
              </div>
            </div>
            <button className="rounded-lg p-2 lg:hidden" onClick={() => setSidebarOpen(false)}>
              <X size={20} />
            </button>
          </div>

          <div className="mt-8 flex items-center gap-3">
            <Avatar name={displayName} photo={employee?.photo_url} />
            <div>
              <p className="font-semibold">{displayName}</p>
              <p className="text-xs text-slate-300">{employee?.position?.name || roleName}</p>
              <p className="mt-1 flex items-center gap-1 text-xs text-emerald-300"><span className="h-2 w-2 rounded-full bg-emerald-400" /> Online</p>
            </div>
          </div>

          <nav className="mt-8 space-y-1">
            {visibleItems.map((item) => (
              <button
                key={item.label}
                onClick={() => {
                  setActive(item.label)
                  setSidebarOpen(false)
                }}
                className={clsx(
                  'flex w-full items-center justify-between rounded-lg px-3 py-3 text-left text-sm font-medium transition',
                  active === item.label ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-950/20' : 'text-slate-300 hover:bg-white/10 hover:text-white',
                )}
              >
                <span className="flex items-center gap-3">
                  <item.icon size={18} />
                  {item.label}
                </span>
                {item.label === 'Notifications' && unreadCount > 0 && (
                  <span className="grid h-5 min-w-5 place-items-center rounded-full bg-red-500 px-1 text-[11px]">{unreadCount}</span>
                )}
              </button>
            ))}
          </nav>

          <div className="mt-8 rounded-lg bg-white/8 p-4 text-sm">
            <p className="font-semibold">Today's Summary</p>
            <div className="mt-4 space-y-3 text-xs text-slate-300">
              <SummaryRow label="Check In" value={formatTime(today?.check_in_at)} />
              <SummaryRow label="Check Out" value={formatTime(today?.check_out_at)} />
              <SummaryRow label="Total Visits" value={String(data.visits.length)} />
              <SummaryRow label="Working Minutes" value={today?.work_minutes ? `${today.work_minutes} min` : '-'} />
            </div>
          </div>
        </aside>

        {sidebarOpen && <div className="fixed inset-0 z-30 bg-slate-950/40 lg:hidden" onClick={() => setSidebarOpen(false)} />}

        <main className="lg:pl-72">
          <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 px-4 py-3 backdrop-blur dark:border-slate-800 dark:bg-slate-950/85 sm:px-6">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <button className="rounded-lg border border-slate-200 p-2 dark:border-slate-700 lg:hidden" onClick={() => setSidebarOpen(true)}>
                  <Menu size={20} />
                </button>
                <div>
                  <h2 className="text-xl font-bold sm:text-2xl">{active === 'Dashboard' ? `Good Morning, ${firstName(displayName)}` : pageTitle}</h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400">{active === 'Dashboard' ? 'Live data from your attendance system' : 'Wholesale cosmetics workforce'}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button className="rounded-lg border border-slate-200 p-2 dark:border-slate-700" onClick={() => setDark((value) => !value)}>
                  {dark ? <Sun size={18} /> : <Moon size={18} />}
                </button>
                {canSeeNotifications && <button className="rounded-lg border border-slate-200 p-2 dark:border-slate-700" onClick={() => setActive('Notifications')}>
                  <Bell size={18} />
                </button>}
                <button className="hidden rounded-lg bg-slate-950 px-4 py-2 text-sm font-semibold text-white dark:bg-white dark:text-slate-950 sm:flex sm:items-center sm:gap-2" onClick={handleLogout}>
                  <LogOut size={16} />
                  Logout
                </button>
              </div>
            </div>
          </header>

          <section className="space-y-6 p-4 pb-24 sm:p-6 lg:pb-6">
            {data.loading && <p className="rounded-lg border border-slate-200 bg-white p-3 text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-900">Refreshing live data...</p>}
            {page}
          </section>
          <MobileNav active={active} setActive={setActive} user={user} onAttendanceAction={openAttendanceAction} todayAttendance={data.todayAttendance} />
        </main>
      </div>
      {modal === 'employee' && (
        <EmployeeModal
          employee={editingEmployee}
          onClose={() => {
            setModal(null)
            setEditingEmployee(null)
          }}
          onSaved={() => {
            setModal(null)
            setEditingEmployee(null)
            loadRealData()
          }}
        />
      )}
      {modal === 'visit' && <VisitModal onClose={() => setModal(null)} onSaved={() => { setModal(null); loadRealData() }} />}
      {modal === 'report' && <ReportModal onClose={() => setModal(null)} onSaved={() => { setModal(null); loadRealData() }} />}
      {attendanceAction && (
        <AttendanceActionModal
          action={attendanceAction}
          onClose={() => setAttendanceAction(null)}
          onSaved={() => {
            setAttendanceAction(null)
            loadRealData()
          }}
        />
      )}
    </div>
  )
}

function DashboardPage({ appData, isLoaded, onAttendanceAction }) {
  return (
    <>
      <EmployeeStats appData={appData} />
      <div className="grid gap-6 xl:grid-cols-[0.65fr_1fr_0.8fr]">
        <AttendanceCard attendance={appData.todayAttendance} onAttendanceAction={onAttendanceAction} />
        <VisitList title="Today's Visits" visits={appData.visits} />
        <RouteCard isLoaded={isLoaded} locations={appData.dashboard?.live_locations || []} />
      </div>
      <div className="grid gap-6 xl:grid-cols-[1fr_0.85fr]">
        <RecentVisitsPanel visits={appData.visits} />
        <TodayReportPanel reports={appData.reports} />
      </div>
    </>
  )
}

function EmployeeStats({ appData }) {
  const cards = appData.dashboard?.cards || emptyCards
  const today = appData.todayAttendance
  const status = today ? titleCase(today.status) : 'Not Checked In'

  const stats = [
    { label: "Today's Status", value: status, help: today?.check_in_at ? `Since ${formatTime(today.check_in_at)}` : 'No attendance yet', icon: CheckCircle2, tone: 'bg-emerald-100 text-emerald-700' },
    { label: 'Total Employees', value: cards.total_employees, help: 'Active employees', icon: Users, tone: 'bg-blue-100 text-blue-700' },
    { label: 'Present Today', value: cards.present, help: `${cards.late || 0} late`, icon: CalendarCheck, tone: 'bg-orange-100 text-orange-700' },
    { label: 'Outdoor Visits', value: cards.outdoor_visits, help: 'Customer visits today', icon: MapPinned, tone: 'bg-violet-100 text-violet-700' },
  ]

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {stats.map((stat) => (
        <div key={stat.label} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-4">
            <div className={clsx('grid h-12 w-12 place-items-center rounded-full', stat.tone)}>
              <stat.icon size={22} />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">{stat.label}</p>
              <p className="mt-1 text-xl font-bold text-slate-950 dark:text-white">{stat.value ?? 0}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">{stat.help}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

function AttendancePage({ appData, onAttendanceAction, setModal, user }) {
  const [now, setNow] = useState(new Date())
  const [gpsReady, setGpsReady] = useState(false)

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    if (!navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(() => setGpsReady(true), () => {})
  }, [])

  const today = appData.todayAttendance
  const checkedIn = Boolean(today?.check_in_at)
  const completed = Boolean(today?.check_out_at)

  const fmtTime = (dt) => new Date(dt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
  const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
  const dateStr = now.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })
  const dayInTime = today?.check_in_at ? fmtTime(today.check_in_at) : '--:--'
  const dayOutTime = today?.check_out_at ? fmtTime(today.check_out_at) : '--:--'

  const canCheckIn = canAccess(user, ['attendance_check_in', 'office_check_in'])
  const canCheckOut = canAccess(user, ['attendance_check_out', 'office_check_out'])

  const bigBtnTone = completed
    ? 'bg-slate-300 shadow-slate-300/40 dark:bg-slate-600'
    : checkedIn
    ? 'bg-rose-400 shadow-rose-400/40'
    : 'bg-emerald-500 shadow-emerald-500/50'

  const handleBigBtn = () => {
    if (completed) return
    if (!checkedIn && canCheckIn) onAttendanceAction('check-in')
    else if (checkedIn && canCheckOut) onAttendanceAction('check-out')
  }

  return (
    <>
      {/* Clock hero card */}
      <div className="flex flex-col items-center rounded-2xl border border-slate-200 bg-white pb-8 pt-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <p className="text-5xl font-bold tabular-nums tracking-tight text-slate-900 dark:text-white">{timeStr}</p>
        <p className="mt-1.5 text-sm text-slate-400">{dateStr}</p>

        {/* Big circular action button */}
        <div className="relative my-8 flex items-center justify-center">
          {checkedIn && !completed && (
            <div className="absolute h-[176px] w-[176px] animate-spin rounded-full border-[5px] border-rose-300 border-t-transparent border-l-transparent" />
          )}
          <button
            onClick={handleBigBtn}
            disabled={completed}
            className={clsx('flex h-40 w-40 flex-col items-center justify-center rounded-full shadow-2xl transition-transform active:scale-95 disabled:cursor-default', bigBtnTone)}
          >
            <svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 11V6a2 2 0 0 1 4 0v5" />
              <path d="M13 9.5a2 2 0 0 1 4 0V12" />
              <path d="M17 12a2 2 0 0 1 4 0v2a7 7 0 0 1-7 7h-2a7 7 0 0 1-4.95-2.05L5 17" />
              <path d="M5 14v-3a2 2 0 0 1 4 0v3" />
            </svg>
            <span className="mt-2 text-[15px] font-bold text-white">
              {completed ? 'Done' : checkedIn ? 'Day Out' : 'Day In'}
            </span>
          </button>
        </div>

        {/* GPS status */}
        <div className="flex items-center gap-1.5 text-sm text-slate-400">
          <MapPinned size={14} className={gpsReady ? 'text-emerald-500' : 'text-slate-300'} />
          <span>{gpsReady ? 'GPS Ready' : 'Detecting location…'}</span>
        </div>
      </div>

      {/* Day In / Day Out time cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-slate-400">
            <CheckCircle2 size={13} className="text-emerald-500" />
            Day In
          </div>
          <p className="text-2xl font-bold tabular-nums text-slate-900 dark:text-white">{dayInTime}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-slate-400">
            <Clock size={13} className="text-rose-400" />
            Day Out
          </div>
          <p className="text-2xl font-bold tabular-nums text-slate-900 dark:text-white">{dayOutTime}</p>
        </div>
      </div>

      {/* Check In / Check Out action buttons */}
      <div className="grid grid-cols-2 gap-3">
        <button
          disabled={!canCheckIn || checkedIn}
          onClick={() => onAttendanceAction('check-in')}
          className={clsx(
            'flex items-center justify-center gap-2 rounded-xl py-4 text-sm font-bold transition',
            !canCheckIn || checkedIn
              ? 'cursor-not-allowed bg-slate-100 text-slate-300 dark:bg-slate-800 dark:text-slate-600'
              : 'bg-amber-50 text-amber-600 hover:bg-amber-100 dark:bg-amber-950/30 dark:text-amber-400',
          )}
        >
          <LocateFixed size={18} />
          Check In
        </button>
        <button
          disabled={!canCheckOut || !checkedIn || completed}
          onClick={() => onAttendanceAction('check-out')}
          className={clsx(
            'flex items-center justify-center gap-2 rounded-xl py-4 text-sm font-bold transition',
            !canCheckOut || !checkedIn || completed
              ? 'cursor-not-allowed bg-slate-100 text-slate-300 dark:bg-slate-800 dark:text-slate-600'
              : 'bg-amber-50 text-amber-600 hover:bg-amber-100 dark:bg-amber-950/30 dark:text-amber-400',
          )}
        >
          <Clock size={18} />
          Check Out
        </button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <InfoCard label="Today's Status" value={today ? titleCase(today.status) : 'No Check In'} help="From attendance table" />
        <InfoCard label="Late Minutes" value={today?.late_minutes || 0} help="Calculated by backend" />
        <InfoCard label="Work Minutes" value={today?.work_minutes || 0} help="Check-in to check-out" />
      </div>
      <AttendanceTable rows={appData.attendance} />
    </>
  )
}

function EmployeesPage({ appData, refresh, setModal, setEditingEmployee }) {
  const deleteEmployee = async (employee) => {
    if (!confirm(`Delete ${employee.first_name} ${employee.last_name}?`)) return
    await api.delete(`/employees/${employee.id}`)
    refresh()
  }

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-3">
        <InfoCard label="Employees" value={appData.employees.length} help="Loaded from employees API" />
        <InfoCard label="Active Staff" value={appData.employees.filter((item) => item.status === 'active').length} help="Current active employees" />
        <InfoCard label="Photo Profiles" value={appData.employees.filter((item) => item.photo_path).length} help="Uploaded employee photos" />
      </div>
      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <PanelHeader
          title="Employee Directory"
          subtitle="Real employee records from MySQL."
          actionLabel="Add Employee"
          onAction={() => {
            setEditingEmployee(null)
            setModal('employee')
          }}
        />
        {appData.employees.length === 0 ? <EmptyState text="No employees found yet." /> : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500 dark:bg-slate-950 dark:text-slate-400">
                <tr>{['Code', 'Employee', 'Department', 'Position', 'Status', 'Actions'].map((head) => <th key={head} className="px-5 py-3">{head}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {appData.employees.map((employee) => (
                  <tr key={employee.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/60">
                    <td className="px-5 py-4">{employee.employee_code}</td>
                    <td className="px-5 py-4">{employee.first_name} {employee.last_name}</td>
                    <td className="px-5 py-4">{employee.department?.name || '-'}</td>
                    <td className="px-5 py-4">{employee.position?.name || '-'}</td>
                    <td className="px-5 py-4"><StatusPill status={titleCase(employee.status)} /></td>
                    <td className="px-5 py-4">
                      <button
                        className="mr-2 rounded-lg bg-sky-50 px-3 py-1.5 text-xs font-semibold text-sky-700"
                        onClick={() => {
                          setEditingEmployee(employee)
                          setModal('employee')
                        }}
                      >
                        Edit
                      </button>
                      <button className="rounded-lg bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700" onClick={() => deleteEmployee(employee)}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  )
}

function DepartmentsPage() {
  const [departments, setDepartments] = useState([])
  const [editing, setEditing] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', code: '', description: '', status: 'active' })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const loadDepartments = useCallback(async () => {
    const response = await api.get('/departments')
    setDepartments(response.data || [])
    setLoading(false)
  }, [])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      loadDepartments().catch(() => {
        setError('Cannot load departments. Please check API server.')
        setLoading(false)
      })
    }, 0)

    return () => window.clearTimeout(timer)
  }, [loadDepartments])

  const resetForm = () => {
    setEditing(null)
    setShowForm(false)
    setForm({ name: '', code: '', description: '', status: 'active' })
  }

  const submit = async (event) => {
    event.preventDefault()
    setSaving(true)
    setError('')

    try {
      if (editing) {
        await api.put(`/departments/${editing.id}`, form)
      } else {
        await api.post('/departments', form)
      }
      resetForm()
      await loadDepartments()
    } catch (exception) {
      setError(apiError(exception))
    } finally {
      setSaving(false)
    }
  }

  const editDepartment = (department) => {
    setEditing(department)
    setShowForm(true)
    setForm({
      name: department.name || '',
      code: department.code || '',
      description: department.description || '',
      status: department.status || 'active',
    })
  }

  const deleteDepartment = async (department) => {
    if (!confirm(`Delete department ${department.name}?`)) return
    await api.delete(`/departments/${department.id}`)
    await loadDepartments()
  }

  return (
    <>
      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <PanelHeader
          title="Department List"
          subtitle="Real departments from MySQL."
          actionLabel="Add Department"
          onAction={() => {
            setEditing(null)
            setForm({ name: '', code: '', description: '', status: 'active' })
            setShowForm(true)
          }}
        />
        {loading ? <EmptyState text="Loading departments..." /> : departments.length === 0 ? <EmptyState text="No departments found yet." /> : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500 dark:bg-slate-950 dark:text-slate-400">
                <tr>{['Code', 'Department', 'Description', 'Status', 'Actions'].map((head) => <th key={head} className="px-5 py-3">{head}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {departments.map((department) => (
                  <tr key={department.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/60">
                    <td className="px-5 py-4">{department.code}</td>
                    <td className="px-5 py-4 font-semibold">{department.name}</td>
                    <td className="max-w-xs truncate px-5 py-4 text-slate-500 dark:text-slate-400">{department.description || '-'}</td>
                    <td className="px-5 py-4"><StatusPill status={titleCase(department.status)} /></td>
                    <td className="px-5 py-4">
                      <button className="mr-2 rounded-lg bg-sky-50 px-3 py-1.5 text-xs font-semibold text-sky-700" onClick={() => editDepartment(department)}>Edit</button>
                      <button className="rounded-lg bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700" onClick={() => deleteDepartment(department)}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showForm && (
        <SimpleModal
          title={editing ? 'Edit Department' : 'Add Department'}
          subtitle="Departments organize employees and positions."
          onClose={resetForm}
        >
          <form className="grid gap-3" onSubmit={submit}>
            <FormInput label="Department Name" value={form.name} onChange={(value) => setForm({ ...form, name: value })} required />
            <FormInput label="Department Code" value={form.code} onChange={(value) => setForm({ ...form, code: value })} required />
            <FormTextarea label="Description" value={form.description} onChange={(value) => setForm({ ...form, description: value })} />
            <FormSelect label="Status" value={form.status} onChange={(value) => setForm({ ...form, status: value })} required>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </FormSelect>
            {error && <ErrorText text={error} />}
            <SubmitButton saving={saving} label={editing ? 'Update Department' : 'Save Department'} />
          </form>
        </SimpleModal>
      )}
    </>
  )
}

function PositionsPage() {
  const [positions, setPositions] = useState([])
  const [departments, setDepartments] = useState([])
  const [editing, setEditing] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ department_id: '', name: '', code: '', status: 'active' })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const loadPositions = useCallback(async () => {
    const [positionResponse, optionResponse] = await Promise.all([
      api.get('/positions'),
      api.get('/employee-options'),
    ])
    setPositions(positionResponse.data || [])
    setDepartments(optionResponse.data.departments || [])
    setLoading(false)
  }, [])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      loadPositions().catch(() => {
        setError('Cannot load positions. Please check API server.')
        setLoading(false)
      })
    }, 0)

    return () => window.clearTimeout(timer)
  }, [loadPositions])

  const resetForm = () => {
    setEditing(null)
    setShowForm(false)
    setForm({ department_id: '', name: '', code: '', status: 'active' })
  }

  const submit = async (event) => {
    event.preventDefault()
    setSaving(true)
    setError('')

    try {
      if (editing) {
        await api.put(`/positions/${editing.id}`, form)
      } else {
        await api.post('/positions', form)
      }
      resetForm()
      await loadPositions()
    } catch (exception) {
      setError(apiError(exception))
    } finally {
      setSaving(false)
    }
  }

  const editPosition = (position) => {
    setEditing(position)
    setShowForm(true)
    setForm({
      department_id: position.department_id || '',
      name: position.name || '',
      code: position.code || '',
      status: position.status || 'active',
    })
  }

  const deletePosition = async (position) => {
    if (!confirm(`Delete position ${position.name}?`)) return
    await api.delete(`/positions/${position.id}`)
    await loadPositions()
  }

  return (
    <>
      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <PanelHeader
          title="Position List"
          subtitle="Real positions from MySQL."
          actionLabel="Add Position"
          onAction={() => {
            setEditing(null)
            setForm({ department_id: '', name: '', code: '', status: 'active' })
            setShowForm(true)
          }}
        />
        {loading ? <EmptyState text="Loading positions..." /> : positions.length === 0 ? <EmptyState text="No positions found yet." /> : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500 dark:bg-slate-950 dark:text-slate-400">
                <tr>{['Code', 'Position', 'Department', 'Status', 'Actions'].map((head) => <th key={head} className="px-5 py-3">{head}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {positions.map((position) => (
                  <tr key={position.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/60">
                    <td className="px-5 py-4">{position.code}</td>
                    <td className="px-5 py-4 font-semibold">{position.name}</td>
                    <td className="px-5 py-4">{position.department?.name || '-'}</td>
                    <td className="px-5 py-4"><StatusPill status={titleCase(position.status)} /></td>
                    <td className="px-5 py-4">
                      <button className="mr-2 rounded-lg bg-sky-50 px-3 py-1.5 text-xs font-semibold text-sky-700" onClick={() => editPosition(position)}>Edit</button>
                      <button className="rounded-lg bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700" onClick={() => deletePosition(position)}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showForm && (
        <SimpleModal
          title={editing ? 'Edit Position' : 'Add Position'}
          subtitle="Positions are used when admin creates employees."
          onClose={resetForm}
        >
          <form className="grid gap-3" onSubmit={submit}>
            <FormSelect label="Department" value={form.department_id} onChange={(value) => setForm({ ...form, department_id: value })} required>
              <option value="">Select department</option>
              {departments.map((department) => <option key={department.id} value={department.id}>{department.name}</option>)}
            </FormSelect>
            <FormInput label="Position Name" value={form.name} onChange={(value) => setForm({ ...form, name: value })} required />
            <FormInput label="Position Code" value={form.code} onChange={(value) => setForm({ ...form, code: value })} required />
            <FormSelect label="Status" value={form.status} onChange={(value) => setForm({ ...form, status: value })} required>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </FormSelect>
            {error && <ErrorText text={error} />}
            <SubmitButton saving={saving} label={editing ? 'Update Position' : 'Save Position'} />
          </form>
        </SimpleModal>
      )}
    </>
  )
}

function IpRestrictionsTab({ roles }) {
  const [ipData, setIpData] = useState([])
  const [selectedRoleId, setSelectedRoleId] = useState('')
  const [newIp, setNewIp] = useState('')
  const [newLabel, setNewLabel] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const loadIpData = useCallback(async () => {
    const res = await api.get('/ip-restrictions')
    setIpData(res.data || [])
  }, [])

  useEffect(() => {
    loadIpData().catch(() => {})
  }, [loadIpData])

  useEffect(() => {
    if (!selectedRoleId && roles.length) setSelectedRoleId(String(roles[0].id))
  }, [roles, selectedRoleId])

  const selectedRole = roles.find((r) => String(r.id) === selectedRoleId)
  const ipRole = ipData.find((r) => String(r.id) === selectedRoleId)
  const ipList = ipRole?.ip_addresses || []

  const addIp = async () => {
    if (!newIp.trim() || !selectedRoleId) return
    setSaving(true)
    setError('')
    try {
      await api.post('/ip-restrictions', { role_id: selectedRoleId, ip_address: newIp.trim(), label: newLabel.trim() || null })
      setNewIp('')
      setNewLabel('')
      await loadIpData()
    } catch (e) {
      setError(apiError(e))
    } finally {
      setSaving(false)
    }
  }

  const removeIp = async (ipId) => {
    try {
      await api.delete(`/ip-restrictions/${ipId}`)
      await loadIpData()
    } catch (e) {
      setError(apiError(e))
    }
  }

  return (
    <div className="space-y-4">
      {/* Header info */}
      <div className="rounded-lg border border-sky-200 bg-sky-50 p-4 text-sm text-sky-800 dark:border-sky-900/40 dark:bg-sky-950/30 dark:text-sky-300">
        <p className="font-semibold">IP Address Restrictions for Attendance</p>
        <p className="mt-1 text-sky-700 dark:text-sky-400">
          If a role has no IP addresses assigned, employees can check in/out from <strong>any IP</strong>. Add IPs to restrict that role to specific offices or networks only.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {/* Role selector */}
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <label className="mb-2 block text-sm font-bold text-slate-700 dark:text-slate-200">Select Role</label>
          <select
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            value={selectedRoleId}
            onChange={(e) => setSelectedRoleId(e.target.value)}
          >
            {roles.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
          </select>

          {/* Role summary cards */}
          <div className="mt-4 space-y-2">
            {roles.map((r) => {
              const count = ipData.find((d) => String(d.id) === String(r.id))?.ip_addresses?.length ?? 0
              return (
                <button
                  key={r.id}
                  onClick={() => setSelectedRoleId(String(r.id))}
                  className={clsx(
                    'flex w-full items-center justify-between rounded-lg border px-3 py-2 text-sm transition',
                    String(r.id) === selectedRoleId
                      ? 'border-emerald-400 bg-emerald-50 dark:border-emerald-700 dark:bg-emerald-950/30'
                      : 'border-slate-100 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/60',
                  )}
                >
                  <span className="font-medium">{r.name}</span>
                  <span className={clsx(
                    'rounded-full px-2 py-0.5 text-xs font-bold',
                    count > 0 ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400' : 'bg-slate-100 text-slate-400 dark:bg-slate-800',
                  )}>
                    {count > 0 ? `${count} IP${count > 1 ? 's' : ''}` : 'Any IP'}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        {/* IP management panel */}
        {selectedRole && (
          <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="border-b border-slate-200 px-5 py-4 dark:border-slate-800">
              <h3 className="font-bold text-slate-900 dark:text-slate-100">{selectedRole.name}</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {ipList.length === 0
                  ? 'No IP restrictions — any IP address can check in/out.'
                  : `Restricted to ${ipList.length} allowed IP address${ipList.length > 1 ? 'es' : ''}.`}
              </p>
            </div>

            {/* Existing IPs */}
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {ipList.length === 0 ? (
                <div className="flex flex-col items-center py-8 text-center">
                  <MapPinned size={28} className="mb-2 text-slate-300 dark:text-slate-600" />
                  <p className="text-sm text-slate-400">No IPs added — this role can check in from anywhere.</p>
                </div>
              ) : (
                ipList.map((entry) => (
                  <div key={entry.id} className="flex items-center justify-between gap-3 px-5 py-3">
                    <div>
                      <p className="font-mono text-sm font-semibold text-slate-800 dark:text-slate-200">{entry.ip_address}</p>
                      {entry.label && <p className="text-xs text-slate-400">{entry.label}</p>}
                    </div>
                    <button
                      onClick={() => removeIp(entry.id)}
                      className="rounded-lg bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-100 dark:bg-rose-950/30 dark:text-rose-400"
                    >
                      Remove
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Add new IP */}
            {selectedRole.slug !== 'super_admin' && (
              <div className="border-t border-slate-200 p-4 dark:border-slate-800">
                <p className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-500">Add Allowed IP</p>
                <div className="grid gap-2">
                  <input
                    type="text"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                    placeholder="e.g. 192.168.1.100"
                    value={newIp}
                    onChange={(e) => setNewIp(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addIp()}
                  />
                  <input
                    type="text"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                    placeholder="Label (e.g. Head Office, Branch A)"
                    value={newLabel}
                    onChange={(e) => setNewLabel(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addIp()}
                  />
                  <button
                    disabled={!newIp.trim() || saving}
                    onClick={addIp}
                    className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                  >
                    {saving ? 'Adding…' : '+ Add IP Address'}
                  </button>
                </div>
                {error && <p className="mt-2 text-xs text-rose-600">{error}</p>}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

const PERMISSION_MODULES = [
  {
    key: 'dashboard', label: 'DASHBOARD', desc: 'Access dashboard and overview statistics',
    Icon: Activity, color: 'text-sky-600', iconBg: 'bg-sky-100 dark:bg-sky-950/50',
    rows: [
      { label: 'Dashboard Access', desc: 'Allow access to main dashboard', view: 'dashboard_access' },
      { label: 'Employee Dashboard', desc: 'Access employee self-service dashboard', view: 'employee_dashboard_access' },
    ],
  },
  {
    key: 'employees', label: 'EMPLOYEES', desc: 'View and manage employee information',
    Icon: Users, color: 'text-violet-600', iconBg: 'bg-violet-100 dark:bg-violet-950/50',
    rows: [
      { label: 'View Employees', desc: 'View employee list and profiles', view: 'view_employees' },
      { label: 'Create Employee', desc: 'Add new employee records', create: 'create_employees' },
      { label: 'Update Employee', desc: 'Edit employee information', update: 'update_employees' },
      { label: 'Delete Employee', desc: 'Remove employee records', delete: 'delete_employees' },
    ],
  },
  {
    key: 'attendance', label: 'ATTENDANCE', desc: 'Manage attendance and approvals',
    Icon: CalendarCheck, color: 'text-emerald-600', iconBg: 'bg-emerald-100 dark:bg-emerald-950/50',
    rows: [
      { label: 'View All Attendance', desc: 'View all attendance records', view: 'view_all_attendance' },
      { label: 'View Own Attendance', desc: 'View own attendance records', view: 'view_own_attendance' },
      { label: 'Office Check In', desc: 'Check in from office location', create: 'office_check_in' },
      { label: 'Office Check Out', desc: 'Check out from office location', update: 'office_check_out' },
      { label: 'Outdoor Check In', desc: 'Check in from field/outdoor', create: 'attendance_check_in' },
      { label: 'Outdoor Check Out', desc: 'Check out from field/outdoor', update: 'attendance_check_out' },
      { label: 'Edit Attendance', desc: 'Edit existing attendance records', update: 'edit_attendance' },
    ],
  },
  {
    key: 'gps', label: 'GPS TRACKING', desc: 'View live location and route history',
    Icon: MapPinned, color: 'text-amber-600', iconBg: 'bg-amber-100 dark:bg-amber-950/50',
    rows: [
      { label: 'View GPS Locations', desc: 'View live employee locations', view: 'view_gps_locations' },
      { label: 'Track Location', desc: 'Send GPS location from device', create: 'track_location' },
    ],
  },
  {
    key: 'visits', label: 'CUSTOMER VISITS', desc: 'Manage customer visits and upload photos',
    Icon: ShoppingBag, color: 'text-rose-600', iconBg: 'bg-rose-100 dark:bg-rose-950/50',
    rows: [
      { label: 'View Customer Visits', desc: 'View all customer visit records', view: 'view_customer_visits' },
      { label: 'Manage Customer Visits', desc: 'Create and manage customer visits', create: 'manage_customer_visits' },
    ],
  },
  {
    key: 'reports', label: 'REPORTS', desc: 'View and export reports',
    Icon: FileText, color: 'text-blue-600', iconBg: 'bg-blue-100 dark:bg-blue-950/50',
    rows: [
      { label: 'View All Reports', desc: 'View all submitted reports', view: 'view_reports' },
      { label: 'View Sales Reports', desc: 'View sales-specific reports', view: 'view_sales_reports' },
      { label: 'View Attendance Reports', desc: 'View attendance reports', view: 'view_attendance_reports' },
      { label: 'View Own Reports', desc: 'View own submitted reports', view: 'view_own_reports' },
      { label: 'Submit Daily Report', desc: 'Submit daily activity report', create: 'submit_daily_report' },
    ],
  },
  {
    key: 'system', label: 'SYSTEM MANAGEMENT', desc: 'Manage system settings and configurations',
    Icon: ShieldCheck, color: 'text-slate-600', iconBg: 'bg-slate-100 dark:bg-slate-800',
    rows: [
      { label: 'Manage Roles', desc: 'Create and update roles', update: 'manage_roles' },
      { label: 'Manage Permissions', desc: 'Manage role permissions', update: 'manage_permissions' },
      { label: 'Manage Schedules', desc: 'Configure work schedules', update: 'manage_schedules' },
      { label: 'Manage Settings', desc: 'Update system settings', update: 'manage_settings' },
    ],
  },
]

function UsersRolesPage() {
  const [activeTab, setActiveTab] = useState('roles')
  const [roles, setRoles] = useState([])
  const [permissions, setPermissions] = useState({})
  const [permissionRows, setPermissionRows] = useState([])
  const [editing, setEditing] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', slug: '', description: '', permission_ids: [] })
  const [editingPermission, setEditingPermission] = useState(null)
  const [showPermissionForm, setShowPermissionForm] = useState(false)
  const [permissionForm, setPermissionForm] = useState({ name: '', slug: '', group: 'system' })
  const [assignRoleId, setAssignRoleId] = useState('')
  const [assignPermissionIds, setAssignPermissionIds] = useState([])
  const [rolePermMap, setRolePermMap] = useState({})
  const [collapsedGroups, setCollapsedGroups] = useState(new Set())
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const loadRoles = useCallback(async () => {
    const [roleResponse, permissionResponse, permissionListResponse] = await Promise.all([
      api.get('/roles'),
      api.get('/roles/permissions'),
      api.get('/permissions'),
    ])
    const nextRoles = roleResponse.data || []
    setRoles(nextRoles)
    setPermissions(permissionResponse.data || {})
    setPermissionRows(permissionListResponse.data || [])
    const map = {}
    nextRoles.forEach((role) => { map[role.id] = new Set((role.permissions || []).map((p) => p.id)) })
    setRolePermMap(map)
    setAssignRoleId((current) => current || nextRoles[0]?.id || '')
    if (!assignRoleId && nextRoles[0]) {
      setAssignPermissionIds((nextRoles[0].permissions || []).map((permission) => permission.id))
    }
    setLoading(false)
  }, [assignRoleId])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      loadRoles().catch(() => {
        setError('Cannot load roles. Login as Super Admin and check API server.')
        setLoading(false)
      })
    }, 0)

    return () => window.clearTimeout(timer)
  }, [loadRoles])

  const resetForm = () => {
    setEditing(null)
    setShowForm(false)
    setForm({ name: '', slug: '', description: '', permission_ids: [] })
  }

  const openCreate = () => {
    setEditing(null)
    setForm({ name: '', slug: '', description: '', permission_ids: [] })
    setShowForm(true)
  }

  const openPermissionCreate = () => {
    setEditingPermission(null)
    setPermissionForm({ name: '', slug: '', group: 'system' })
    setShowPermissionForm(true)
  }

  const editRole = (role) => {
    setEditing(role)
    setForm({
      name: role.name || '',
      slug: role.slug || '',
      description: role.description || '',
      permission_ids: (role.permissions || []).map((permission) => permission.id),
    })
    setShowForm(true)
  }

  const togglePermission = (permissionId) => {
    setForm((current) => ({
      ...current,
      permission_ids: current.permission_ids.includes(permissionId)
        ? current.permission_ids.filter((id) => id !== permissionId)
        : [...current.permission_ids, permissionId],
    }))
  }

  const submit = async (event) => {
    event.preventDefault()
    setSaving(true)
    setError('')

    try {
      if (editing) {
        await api.put(`/roles/${editing.id}`, form)
      } else {
        await api.post('/roles', form)
      }
      resetForm()
      await loadRoles()
    } catch (exception) {
      setError(apiError(exception))
    } finally {
      setSaving(false)
    }
  }

  const deleteRole = async (role) => {
    if (!confirm(`Delete role ${role.name}?`)) return
    await api.delete(`/roles/${role.id}`)
    await loadRoles()
  }

  const editPermission = (permission) => {
    setEditingPermission(permission)
    setPermissionForm({
      name: permission.name || '',
      slug: permission.slug || '',
      group: permission.group || 'system',
    })
    setShowPermissionForm(true)
  }

  const submitPermission = async (event) => {
    event.preventDefault()
    setSaving(true)
    setError('')

    try {
      if (editingPermission) {
        await api.put(`/permissions/${editingPermission.id}`, permissionForm)
      } else {
        await api.post('/permissions', permissionForm)
      }
      setShowPermissionForm(false)
      setEditingPermission(null)
      setPermissionForm({ name: '', slug: '', group: 'system' })
      await loadRoles()
    } catch (exception) {
      setError(apiError(exception))
    } finally {
      setSaving(false)
    }
  }

  const deletePermission = async (permission) => {
    if (!confirm(`Delete permission ${permission.name}?`)) return
    await api.delete(`/permissions/${permission.id}`)
    await loadRoles()
  }

  const selectAssignRole = (roleId) => {
    const role = roles.find((item) => String(item.id) === String(roleId))
    setAssignRoleId(roleId)
    setAssignPermissionIds((role?.permissions || []).map((permission) => permission.id))
  }

  const toggleAssignPermission = (permissionId) => {
    setAssignPermissionIds((current) => current.includes(permissionId)
      ? current.filter((id) => id !== permissionId)
      : [...current, permissionId])
  }

  const saveAssignedPermissions = async () => {
    const role = roles.find((item) => String(item.id) === String(assignRoleId))
    if (!role) return
    setSaving(true)
    setError('')

    try {
      await api.put(`/roles/${role.id}`, {
        name: role.name,
        slug: role.slug,
        description: role.description || '',
        permission_ids: assignPermissionIds,
      })
      await loadRoles()
    } catch (exception) {
      setError(apiError(exception))
    } finally {
      setSaving(false)
    }
  }

  const toggleRolePermission = (roleId, permissionId) => {
    setRolePermMap((prev) => {
      const current = new Set(prev[roleId] || [])
      if (current.has(permissionId)) current.delete(permissionId)
      else current.add(permissionId)
      return { ...prev, [roleId]: current }
    })
  }

  const saveAllRolePermissions = async () => {
    setSaving(true)
    setError('')
    try {
      await Promise.all(
        roles.filter((role) => role.slug !== 'super_admin').map((role) =>
          api.put(`/roles/${role.id}`, {
            name: role.name,
            slug: role.slug,
            description: role.description || '',
            permission_ids: [...(rolePermMap[role.id] || [])],
          })
        )
      )
      await loadRoles()
    } catch (exception) {
      setError(apiError(exception))
    } finally {
      setSaving(false)
    }
  }

  const toggleGroup = (group) => {
    setCollapsedGroups((prev) => {
      const next = new Set(prev)
      if (next.has(group)) next.delete(group)
      else next.add(group)
      return next
    })
  }

  return (
    <>
      <div className="rounded-lg border border-slate-200 bg-white p-2 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="grid gap-2 sm:grid-cols-4">
          {[
            ['roles', 'Roles', ShieldCheck],
            ['permissions', 'Permissions', KeyRound],
            ['assign', 'Assign Permission', CheckCircle2],
            ['ip', 'IP Access', MapPinned],
          ].map(([key, label, Icon]) => (
            <button
              key={key}
              className={clsx('flex items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-semibold transition', activeTab === key ? 'bg-emerald-600 text-white' : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800')}
              onClick={() => setActiveTab(key)}
            >
              <Icon size={17} />
              {label}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'roles' && <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <PanelHeader title="Role List" subtitle="Create roles and assign permissions." actionLabel="Add Role" onAction={openCreate} />
        {loading ? <EmptyState text="Loading roles..." /> : roles.length === 0 ? <EmptyState text="No roles found yet." /> : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500 dark:bg-slate-950 dark:text-slate-400">
                <tr>{['Role', 'Slug', 'Permissions', 'Description', 'Actions'].map((head) => <th key={head} className="px-5 py-3">{head}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {roles.map((role) => (
                  <tr key={role.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/60">
                    <td className="px-5 py-4 font-semibold">{role.name}</td>
                    <td className="px-5 py-4">{role.slug}</td>
                    <td className="px-5 py-4">{role.permissions_count ?? role.permissions?.length ?? 0}</td>
                    <td className="max-w-xs truncate px-5 py-4 text-slate-500 dark:text-slate-400">{role.description || '-'}</td>
                    <td className="px-5 py-4">
                      <button className="mr-2 rounded-lg bg-sky-50 px-3 py-1.5 text-xs font-semibold text-sky-700" onClick={() => editRole(role)}>Edit</button>
                      <button className="rounded-lg bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 disabled:cursor-not-allowed disabled:opacity-50" disabled={['super_admin', 'admin'].includes(role.slug)} onClick={() => deleteRole(role)}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>}

      {activeTab === 'permissions' && <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <PanelHeader title="Permission List" subtitle="Create, edit, and delete permissions." actionLabel="Add Permission" onAction={openPermissionCreate} />
        {permissionRows.length === 0 ? <EmptyState text="No permissions found." /> : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500 dark:bg-slate-950 dark:text-slate-400">
                <tr>{['Permission', 'Slug', 'Group', 'Actions'].map((head) => <th key={head} className="px-5 py-3">{head}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {permissionRows.map((permission) => (
                  <tr key={permission.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/60">
                    <td className="px-5 py-4 font-semibold">{permission.name}</td>
                    <td className="px-5 py-4">{permission.slug}</td>
                    <td className="px-5 py-4">{permission.group}</td>
                    <td className="px-5 py-4">
                      <button className="mr-2 rounded-lg bg-sky-50 px-3 py-1.5 text-xs font-semibold text-sky-700" onClick={() => editPermission(permission)}>Edit</button>
                      <button className="rounded-lg bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700" onClick={() => deletePermission(permission)}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>}

      {activeTab === 'assign' && (() => {
        const CRUD_COLS = ['view', 'create', 'update', 'delete']
        const selectedRole = roles.find((r) => String(r.id) === String(assignRoleId))
        const selectedPerms = rolePermMap[assignRoleId] || new Set()

        const slugToId = (slug) => permissionRows.find((p) => p.slug === slug)?.id
        const isOn = (slug) => { const id = slugToId(slug); return id != null && selectedPerms.has(id) }
        const toggleSlug = (slug) => { const id = slugToId(slug); if (id != null) toggleRolePermission(assignRoleId, id) }

        const modSlugs = (mod, col) => mod.rows.map((r) => r[col]).filter(Boolean)

        const expandAll = () => setCollapsedGroups(new Set())
        const collapseAll = () => setCollapsedGroups(new Set(PERMISSION_MODULES.map((m) => m.key)))
        const resetPermissions = () => {
          const original = roles.find((r) => String(r.id) === String(assignRoleId))
          if (!original) return
          setRolePermMap((prev) => ({ ...prev, [assignRoleId]: new Set((original.permissions || []).map((p) => p.id)) }))
        }

        const saveSelectedRole = async () => {
          if (!selectedRole || selectedRole.slug === 'super_admin') return
          setSaving(true)
          setError('')
          try {
            await api.put(`/roles/${selectedRole.id}`, {
              name: selectedRole.name,
              slug: selectedRole.slug,
              description: selectedRole.description || '',
              permission_ids: [...selectedPerms],
            })
            await loadRoles()
          } catch (exception) {
            setError(apiError(exception))
          } finally {
            setSaving(false)
          }
        }

        const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'

        return (
          <div className="space-y-4">
            {/* Step 1 + Step 2 side-by-side panel */}
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:grid sm:grid-cols-[280px,1fr]">
              {/* Left: Select Role */}
              <div className="border-b border-slate-200 p-6 dark:border-slate-800 sm:border-b-0 sm:border-r">
                <div className="mb-5 flex items-start gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-emerald-500 text-sm font-bold text-emerald-600">1</span>
                  <div>
                    <p className="font-bold text-slate-900 dark:text-slate-100">Select Role</p>
                    <p className="text-xs text-slate-400">Choose a role to assign permissions</p>
                  </div>
                </div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-600 dark:text-slate-300">
                  Select Role <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <select
                    className="w-full appearance-none rounded-lg border border-slate-300 bg-white py-2.5 pl-3 pr-8 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                    value={assignRoleId}
                    onChange={(e) => setAssignRoleId(e.target.value)}
                  >
                    {roles.map((role) => <option key={role.id} value={role.id}>{role.name}</option>)}
                  </select>
                  <ChevronDown size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                </div>
              </div>

              {/* Right: Role Information */}
              <div className="p-6">
                <div className="mb-5 flex items-start gap-3">
                  <span className={clsx('flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 text-sm font-bold', selectedRole ? 'border-emerald-500 text-emerald-600' : 'border-slate-300 text-slate-400')}>2</span>
                  <div>
                    <p className="font-bold text-slate-900 dark:text-slate-100">Role Information</p>
                    <p className="text-xs text-slate-400">Set permissions for the selected role</p>
                  </div>
                </div>
                {selectedRole ? (
                  <div className="flex items-start gap-4">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-sky-100 dark:bg-sky-950/50">
                      <Users size={26} className="text-sky-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-lg font-bold text-slate-900 dark:text-slate-100">{selectedRole.name}</p>
                        <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                          {selectedRole.users_count ?? 0} Users
                        </span>
                      </div>
                      <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">{selectedRole.description || 'No description'}</p>
                      <div className="mt-3 flex flex-wrap gap-6 text-xs">
                        <div>
                          <p className="font-semibold text-slate-500 dark:text-slate-400">Created At</p>
                          <p className="mt-0.5 text-slate-600 dark:text-slate-300">{fmtDate(selectedRole.created_at)}</p>
                        </div>
                        <div>
                          <p className="font-semibold text-slate-500 dark:text-slate-400">Last Updated</p>
                          <p className="mt-0.5 text-slate-600 dark:text-slate-300">{fmtDate(selectedRole.updated_at)}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-slate-400">Select a role on the left to view its details.</p>
                )}
              </div>
            </div>

            {/* CRUD matrix */}
            {selectedRole && (
              <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
                {/* Toolbar */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-5 py-4 dark:border-slate-800">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Set Permissions for</p>
                    <h3 className="mt-0.5 text-base font-bold text-slate-900 dark:text-slate-100">{selectedRole.name}</h3>
                  </div>
                  {selectedRole.slug !== 'super_admin' && (
                    <div className="flex flex-wrap items-center gap-2">
                      <button className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800" onClick={expandAll}>
                        <List size={12} /> Expand All
                      </button>
                      <button className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800" onClick={collapseAll}>
                        <List size={12} /> Collapse All
                      </button>
                      <button className="flex items-center gap-1.5 rounded-lg border border-rose-200 px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:border-rose-900/40 dark:hover:bg-rose-950/20" onClick={resetPermissions}>
                        <X size={12} /> Reset All
                      </button>
                    </div>
                  )}
                </div>

                {selectedRole.slug === 'super_admin' ? (
                  <div className="p-10 text-center">
                    <ShieldCheck className="mx-auto mb-3 text-emerald-500" size={40} />
                    <p className="font-semibold text-slate-700 dark:text-slate-200">Super Admin — Unrestricted Access</p>
                    <p className="mt-1 text-sm text-slate-400">Super Admin has all permissions automatically.</p>
                  </div>
                ) : (
                  <>
                    <div className="max-h-[60vh] overflow-y-auto">
                      <table className="w-full text-sm">
                        <thead className="sticky top-0 z-10 border-b border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-950">
                          <tr>
                            <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-400">Module / Permission</th>
                            {['View', 'Create', 'Update', 'Delete'].map((col) => (
                              <th key={col} className="w-28 px-3 py-3 text-center text-xs font-bold uppercase tracking-wider text-slate-400">{col}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                          {PERMISSION_MODULES.map((mod) => {
                            const isCollapsed = collapsedGroups.has(mod.key)
                            return [
                              /* Module header row */
                              <tr key={`h-${mod.key}`} className="bg-slate-50/80 dark:bg-slate-900/60">
                                <td className="px-4 py-3">
                                  <button className="flex items-center gap-3" onClick={() => toggleGroup(mod.key)}>
                                    <ChevronDown size={15} className={clsx('shrink-0 text-slate-400 transition-transform duration-150', isCollapsed && '-rotate-90')} />
                                    <span className={clsx('flex h-8 w-8 shrink-0 items-center justify-center rounded-lg', mod.iconBg)}>
                                      <mod.Icon size={15} className={mod.color} />
                                    </span>
                                    <div className="text-left">
                                      <p className={clsx('text-xs font-bold uppercase tracking-wide', mod.color)}>{mod.label}</p>
                                      <p className="text-[11px] text-slate-400 dark:text-slate-500">{mod.desc}</p>
                                    </div>
                                  </button>
                                </td>
                                {CRUD_COLS.map((col) => {
                                  const slugs = modSlugs(mod, col)
                                  if (slugs.length === 0) return <td key={col} className="py-3 text-center text-slate-300 dark:text-slate-700">—</td>
                                  const onCount = slugs.filter(isOn).length
                                  return (
                                    <td key={col} className="py-3 text-center">
                                      <span className={clsx(
                                        'inline-flex items-center justify-center rounded-full px-2.5 py-0.5 text-xs font-bold',
                                        onCount > 0
                                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400'
                                          : 'bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500',
                                      )}>
                                        {onCount}/{slugs.length}
                                      </span>
                                    </td>
                                  )
                                })}
                              </tr>,
                              /* Sub-permission rows */
                              ...(isCollapsed ? [] : mod.rows.map((row, ri) => (
                                <tr key={`r-${mod.key}-${ri}`} className="bg-white hover:bg-slate-50/70 dark:bg-slate-900 dark:hover:bg-slate-800/40">
                                  <td className="py-3 pl-[68px] pr-5">
                                    <p className="font-medium text-slate-700 dark:text-slate-200">{row.label}</p>
                                    {row.desc && <p className="text-[11px] text-slate-400 dark:text-slate-500">{row.desc}</p>}
                                  </td>
                                  {CRUD_COLS.map((col) => {
                                    const slug = row[col]
                                    if (!slug) return <td key={col} className="py-3 text-center text-slate-200 dark:text-slate-700">—</td>
                                    return (
                                      <td key={col} className="py-3 text-center">
                                        <Toggle checked={isOn(slug)} onChange={() => toggleSlug(slug)} />
                                      </td>
                                    )
                                  })}
                                </tr>
                              ))),
                            ]
                          })}
                        </tbody>
                      </table>
                    </div>

                    {/* Footer */}
                    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 bg-slate-50 px-5 py-3 dark:border-slate-800 dark:bg-slate-950">
                      <div className="flex items-center gap-4 text-xs text-slate-500">
                        <Toggle checked onChange={() => {}} />
                        <span>= Allowed</span>
                        <Toggle checked={false} onChange={() => {}} />
                        <span>= Denied</span>
                      </div>
                      <div className="flex gap-2">
                        <button
                          className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                          onClick={resetPermissions}
                        >
                          Cancel
                        </button>
                        <button
                          className="flex items-center gap-2 rounded-lg bg-emerald-600 px-5 py-2 text-sm font-semibold text-white disabled:opacity-60"
                          disabled={saving}
                          onClick={saveSelectedRole}
                        >
                          <CheckCircle2 size={15} />
                          {saving ? 'Saving…' : 'Save Changes'}
                        </button>
                      </div>
                    </div>
                    {error && <div className="border-t border-slate-200 p-4 dark:border-slate-800"><ErrorText text={error} /></div>}
                  </>
                )}
              </div>
            )}
          </div>
        )
      })()}

      {activeTab === 'ip' && <IpRestrictionsTab roles={roles} />}

      {showForm && (
        <SimpleModal title={editing ? 'Edit Role' : 'Add Role'} subtitle="Select permissions for this role." onClose={resetForm}>
          <form className="grid gap-3" onSubmit={submit}>
            <div className="grid gap-3 sm:grid-cols-2">
              <FormInput label="Role Name" value={form.name} onChange={(value) => setForm({ ...form, name: value })} required />
              <FormInput label="Role Slug" value={form.slug} onChange={(value) => setForm({ ...form, slug: value })} required={Boolean(editing)} />
            </div>
            <FormTextarea label="Description" value={form.description} onChange={(value) => setForm({ ...form, description: value })} />

            <div className="rounded-lg border border-slate-200 p-3 dark:border-slate-700">
              <p className="mb-3 text-sm font-bold">Permissions</p>
              <div className="max-h-80 space-y-4 overflow-y-auto pr-1">
                {Object.entries(permissions).map(([group, items]) => (
                  <div key={group}>
                    <p className="mb-2 text-xs font-bold uppercase text-slate-500">{group}</p>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {items.map((permission) => (
                        <label key={permission.id} className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700">
                          <input
                            type="checkbox"
                            checked={form.permission_ids.includes(permission.id)}
                            onChange={() => togglePermission(permission.id)}
                          />
                          <span>{permission.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {error && <ErrorText text={error} />}
            <SubmitButton saving={saving} label={editing ? 'Update Role' : 'Save Role'} />
          </form>
        </SimpleModal>
      )}

      {showPermissionForm && (
        <SimpleModal title={editingPermission ? 'Edit Permission' : 'Add Permission'} subtitle="Permissions control what each role can access." onClose={() => setShowPermissionForm(false)}>
          <form className="grid gap-3" onSubmit={submitPermission}>
            <FormInput label="Permission Name" value={permissionForm.name} onChange={(value) => setPermissionForm({ ...permissionForm, name: value })} required />
            <FormInput label="Permission Slug" value={permissionForm.slug} onChange={(value) => setPermissionForm({ ...permissionForm, slug: value })} required={Boolean(editingPermission)} />
            <FormInput label="Group" value={permissionForm.group} onChange={(value) => setPermissionForm({ ...permissionForm, group: value })} required />
            {error && <ErrorText text={error} />}
            <SubmitButton saving={saving} label={editingPermission ? 'Update Permission' : 'Save Permission'} />
          </form>
        </SimpleModal>
      )}
    </>
  )
}

function OutdoorSalesPage({ appData, isLoaded, setModal }) {
  const rows = appData.visits.map((visit) => [
    visit.employee ? `${visit.employee.first_name} ${visit.employee.last_name}` : '-',
    visit.customer_name,
    visit.store_name || '-',
    titleCase(visit.status),
    visit.duration_minutes ? `${visit.duration_minutes} min` : '-',
  ])

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-3">
        <InfoCard label="Visits" value={appData.visits.length} help="Loaded from customer_visits" />
        <InfoCard label="Open Visits" value={appData.visits.filter((item) => item.status === 'open').length} help="Currently in progress" />
        <InfoCard label="Closed Visits" value={appData.visits.filter((item) => item.status === 'closed').length} help="Checked out visits" />
      </div>
      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <DataPanel title="Customer Visit History" subtitle="Real outdoor sales records." columns={['Sales', 'Customer', 'Store', 'Status', 'Duration']} rows={rows} actionLabel="Add Visit" onAction={() => setModal('visit')} />
        <RouteCard isLoaded={isLoaded} locations={appData.dashboard?.live_locations || []} />
      </div>
    </>
  )
}

function ReportsPage({ appData, setModal }) {
  const rows = appData.reports.map((report) => [
    formatDate(report.report_date),
    report.employee ? `${report.employee.first_name} ${report.employee.last_name}` : '-',
    titleCase(report.type),
    titleCase(report.status),
  ])

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-3">
        <InfoCard label="Reports" value={appData.reports.length} help="Loaded from reports API" />
        <InfoCard label="Submitted" value={appData.reports.filter((item) => item.status === 'submitted').length} help="Waiting for review" />
        <InfoCard label="Orders Collected" value={appData.reports.reduce((total, report) => total + Number(report.metrics?.orders_collected || 0), 0)} help="From submitted daily report metrics" />
      </div>
      <div className="grid gap-6 xl:grid-cols-[1fr_0.85fr]">
        <ReportsPanel chartData={appData.dashboard?.attendance_chart || []} notifications={appData.notifications} />
        <DataPanel title="Recent Submissions" subtitle="Real report submissions." columns={['Date', 'Employee', 'Type', 'Status']} rows={rows} actionLabel="Add Report" onAction={() => setModal('report')} />
      </div>
    </>
  )
}

function NotificationsPage({ appData, refresh }) {
  const markRead = async (notification) => {
    await api.patch(`/notifications/${notification.id}/read`)
    refresh()
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <PanelHeader title="Notifications" subtitle="Admin and employee notifications." actionLabel="Refresh" onAction={refresh} />
      {appData.notifications.length === 0 ? <EmptyState text="No notifications found." /> : (
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {appData.notifications.map((item) => (
            <div key={item.id} className="flex flex-wrap items-center justify-between gap-3 p-5">
              <div>
                <p className="font-semibold">{item.title}</p>
                <p className="text-sm text-slate-500">{item.message}</p>
              </div>
              <div className="flex items-center gap-2">
                <StatusPill status={item.read_at ? 'Read' : 'Unread'} />
                {!item.read_at && <button className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white" onClick={() => markRead(item)}>Mark read</button>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function ProfilePage({ user, appData, setActive }) {
  const employee = user.employee
  const fullName = employee ? [employee.first_name, employee.last_name].filter(Boolean).join(' ') : user.name
  const roleName = user.role?.name || '-'
  const attendanceRows = appData.attendance.slice(0, 5)
  const ownVisits = appData.visits.filter((visit) => !employee || visit.employee_id === employee.id).slice(0, 4)
  const ownReports = appData.reports.filter((report) => !employee || report.employee_id === employee.id).slice(0, 4)
  const presentCount = appData.attendance.filter((item) => item.status === 'present').length
  const lateCount = appData.attendance.filter((item) => item.status === 'late').length
  const absentCount = appData.attendance.filter((item) => item.status === 'absent').length
  const today = appData.todayAttendance
  const latestLocation = appData.dashboard?.live_locations?.[0]
  const profileStats = [
    { label: 'Present', value: presentCount, tone: 'emerald', icon: CalendarCheck },
    { label: 'Late', value: lateCount, tone: 'amber', icon: Clock },
    { label: 'Absent', value: absentCount, tone: 'rose', icon: Users },
    { label: 'Visits', value: ownVisits.length, tone: 'blue', icon: MapPinned },
  ]

  return (
    <>
      <div className="space-y-4 sm:hidden">
        <div className="flex items-center justify-between px-1">
          <button className="rounded-lg p-2 text-slate-700 dark:text-slate-200" onClick={() => setActive('Dashboard')}>
            <X className="rotate-45" size={24} />
          </button>
          <h3 className="text-xl font-bold">Profile</h3>
          <button className="rounded-lg p-2 text-slate-700 dark:text-slate-200">
            <Menu size={24} />
          </button>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="grid grid-cols-[96px_1fr] gap-4">
            <div className="relative">
              <div className="grid h-24 w-24 place-items-center rounded-full bg-slate-100 text-2xl font-bold text-emerald-700 dark:bg-slate-800">
                {employee?.photo_url ? <img className="h-full w-full rounded-full object-cover" src={employee.photo_url} alt={fullName} /> : initials(fullName)}
              </div>
              <button className="absolute bottom-0 right-0 grid h-10 w-10 place-items-center rounded-full bg-emerald-600 text-white shadow-lg">
                <Camera size={18} />
              </button>
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h4 className="min-w-0 truncate text-2xl font-bold">{fullName}</h4>
                <StatusPill status={titleCase(employee?.status || user.status || 'active')} />
              </div>
              <p className="mt-1 truncate text-sm text-slate-500 dark:text-slate-400">{employee?.position?.name || roleName}</p>
              <p className="mt-3 truncate text-sm font-medium">{employee?.employee_code || '-'}</p>
              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-sm text-slate-700 dark:text-slate-300">
                <span className="flex items-center gap-1"><Phone size={14} />{employee?.phone || '-'}</span>
                <span className="flex min-w-0 items-center gap-1"><Mail size={14} /><span className="truncate">{user.email}</span></span>
              </div>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-4 divide-x divide-slate-200 rounded-2xl border border-slate-200 py-3 dark:divide-slate-800 dark:border-slate-800">
            {profileStats.map((stat) => (
              <div key={stat.label} className="px-2 text-center">
                <div className="mx-auto mb-1 grid h-8 w-8 place-items-center rounded-full bg-emerald-50 text-emerald-600">
                  <stat.icon size={17} />
                </div>
                <p className={clsx('text-xl font-bold', stat.tone === 'emerald' && 'text-emerald-600', stat.tone === 'amber' && 'text-amber-600', stat.tone === 'rose' && 'text-rose-600', stat.tone === 'blue' && 'text-blue-600')}>{stat.value}</p>
                <p className="text-xs text-slate-500">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>

        <MobileProfileCard title="Today's Status" action={<StatusPill status={today ? titleCase(today.status) : 'Not Checked In'} />}>
          <ProfileTimelineRow icon={LocateFixed} label="Check In" value={formatTime(today?.check_in_at)} />
          <ProfileTimelineRow icon={MapPinned} label="Check Out" value={formatTime(today?.check_out_at)} />
          <ProfileTimelineRow icon={Clock} label="Work Duration" value={today?.work_minutes ? `${today.work_minutes} min` : '-'} />
        </MobileProfileCard>

        <div className="grid grid-cols-4 gap-3">
          {[
            ['Attendance History', CalendarCheck, 'My Attendance'],
            ['Customer Visits', ShoppingBag, 'Customer Visits'],
            ['Daily Reports', FileText, 'Daily Reports'],
            ['Route Map', MapPinned, 'Route Map'],
            ['Documents', Folder, 'Daily Reports'],
            ['Activity Logs', List, 'Profile'],
            ['Profile Edit', Users, 'Employees'],
            ['More', Menu, 'Settings'],
          ].map(([label, Icon, target]) => (
            <button key={label} className="rounded-2xl border border-slate-200 bg-white p-3 text-center text-xs font-medium shadow-sm dark:border-slate-800 dark:bg-slate-900" onClick={() => setActive(target)}>
              <span className="mx-auto mb-2 grid h-10 w-10 place-items-center rounded-full bg-emerald-50 text-emerald-600">
                <Icon size={19} />
              </span>
              <span>{label}</span>
            </button>
          ))}
        </div>

        <MobileProfileCard title="Attendance Summary" action={<span className="text-sm font-semibold text-emerald-600">This Month</span>}>
          <div className="grid grid-cols-4 divide-x divide-slate-200 rounded-xl border border-slate-200 py-3 dark:divide-slate-800 dark:border-slate-800">
            {profileStats.map((stat) => (
              <div key={stat.label} className="text-center">
                <p className={clsx('text-xl font-bold', stat.tone === 'emerald' && 'text-emerald-600', stat.tone === 'amber' && 'text-amber-600', stat.tone === 'rose' && 'text-rose-600', stat.tone === 'blue' && 'text-blue-600')}>{stat.value}</p>
                <p className="text-xs text-slate-500">{stat.label}</p>
              </div>
            ))}
          </div>
        </MobileProfileCard>

        <MobileProfileCard title="Latest Location" action={<span className="text-xs font-semibold text-emerald-600">{latestLocation ? 'Live' : 'No data'}</span>}>
          <div className="grid h-36 place-items-center rounded-xl bg-[linear-gradient(135deg,#dbeafe,#dcfce7)] text-center text-slate-700">
            <div>
              <MapPinned className="mx-auto mb-2 text-emerald-600" size={30} />
              <p className="text-sm font-semibold">{latestLocation ? `${Number(latestLocation.latitude).toFixed(5)}, ${Number(latestLocation.longitude).toFixed(5)}` : 'GPS location not recorded yet'}</p>
            </div>
          </div>
        </MobileProfileCard>
      </div>

      <div className="hidden flex-wrap items-center justify-between gap-3 sm:flex">
        <div>
          <h3 className="text-2xl font-bold">Employee Profile</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">View and manage employee information.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold shadow-sm dark:border-slate-800 dark:bg-slate-900" onClick={() => window.print()}>
            <Download size={16} />
            Print Profile
          </button>
          <button className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white" onClick={() => setActive('Employees')}>Edit Profile</button>
        </div>
      </div>

      <div className="hidden gap-6 sm:grid xl:grid-cols-[1.35fr_0.8fr]">
        <div className="grid gap-6 lg:grid-cols-[0.55fr_1fr]">
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
              <ProfileContact icon={FileText} label="Employee ID" value={employee?.employee_code} />
              <ProfileContact icon={Phone} label="Phone Number" value={employee?.phone} />
              <ProfileContact icon={Mail} label="Email Address" value={user.email} />
            </div>
            <button className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg border border-emerald-200 px-4 py-3 text-sm font-semibold text-emerald-700">
              <Download size={16} />
              Download ID Card
            </button>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <ProfileSection title="Personal Information" icon={Users}>
              <ProfileDetail label="Full Name" value={fullName} />
              <ProfileDetail label="Phone Number" value={employee?.phone} />
              <ProfileDetail label="Email Address" value={user.email} />
              <ProfileDetail label="Address" value={employee?.address} />
              <ProfileDetail label="Join Date" value={formatDate(employee?.hire_date)} />
            </ProfileSection>

            <div className="mt-8">
              <ProfileSection title="Work Information" icon={BriefcaseBusiness}>
                <ProfileDetail label="Department" value={employee?.department?.name} />
                <ProfileDetail label="Position" value={employee?.position?.name} />
                <ProfileDetail label="Role" value={roleName} />
                <ProfileDetail label="Branch" value={employee?.branch?.name} />
                <ProfileDetail label="Employment Type" value={titleCase(employee?.employment_type)} />
              </ProfileSection>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h4 className="font-bold">Attendance Summary</h4>
            <div className="mt-5 grid grid-cols-2 gap-3">
              {profileStats.map((stat) => <MiniStat key={stat.label} {...stat} />)}
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-4 flex items-center justify-between">
              <h4 className="font-bold">Today's Status</h4>
              <StatusPill status={today ? titleCase(today.status) : 'Not Checked In'} />
            </div>
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              <ProfileTimelineRow icon={LocateFixed} label="Check In" value={formatTime(today?.check_in_at)} />
              <ProfileTimelineRow icon={MapPinned} label="Check Out" value={formatTime(today?.check_out_at)} />
              <ProfileTimelineRow icon={Clock} label="Work Duration" value={today?.work_minutes ? `${today.work_minutes} min` : '-'} />
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between">
              <h4 className="font-bold">Latest Location</h4>
              <span className="text-xs font-semibold text-emerald-600">{latestLocation ? 'Live' : 'No data'}</span>
            </div>
            <div className="mt-4 grid h-32 place-items-center rounded-lg bg-[linear-gradient(135deg,#dbeafe,#dcfce7)] text-center text-slate-700">
              <div>
                <MapPinned className="mx-auto mb-2 text-emerald-600" size={30} />
                <p className="text-sm font-semibold">{latestLocation ? `${Number(latestLocation.latitude).toFixed(5)}, ${Number(latestLocation.longitude).toFixed(5)}` : 'GPS location not recorded yet'}</p>
              </div>
            </div>
            <button className="mt-3 text-sm font-semibold text-emerald-700" onClick={() => setActive('Route Map')}>View on Map</button>
          </div>
        </div>
      </div>

      <div className="hidden gap-6 sm:grid xl:grid-cols-[1.35fr_0.8fr]">
        <div className="rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <PanelHeader title="Attendance History" subtitle="Recent attendance records." actionLabel="View All" onAction={() => setActive('My Attendance')} />
          {attendanceRows.length === 0 ? <EmptyState text="No attendance history found." /> : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[680px] text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase text-slate-500 dark:bg-slate-950 dark:text-slate-400">
                  <tr>{['Date', 'Check In', 'Check Out', 'Duration', 'Status', 'Location'].map((head) => <th key={head} className="px-5 py-3">{head}</th>)}</tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {attendanceRows.map((row) => (
                    <tr key={row.id}>
                      <td className="px-5 py-4">{formatDate(row.attendance_date)}</td>
                      <td className="px-5 py-4">{formatTime(row.check_in_at)}</td>
                      <td className="px-5 py-4">{formatTime(row.check_out_at)}</td>
                      <td className="px-5 py-4">{row.work_minutes ? `${row.work_minutes} min` : '-'}</td>
                      <td className="px-5 py-4"><StatusPill status={titleCase(row.status)} /></td>
                      <td className="px-5 py-4">{row.branch?.name || employee?.branch?.name || '-'}</td>
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

      <div className="hidden rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:block">
        <h4 className="font-bold">Activity Timeline</h4>
        <div className="mt-5 space-y-4">
          {today?.check_in_at && <ActivityLine title="Checked In" detail={`Check in at ${formatTime(today.check_in_at)}`} time="Today" />}
          {ownVisits.map((visit) => <ActivityLine key={visit.id} title="Customer visit submitted" detail={visit.customer_name} time={formatTime(visit.check_in_at)} />)}
          {ownReports.map((report) => <ActivityLine key={report.id} title="Report submitted" detail={report.title} time={formatDate(report.report_date)} />)}
          {today?.check_out_at && <ActivityLine title="Checked Out" detail={`Check out at ${formatTime(today.check_out_at)}`} time="Today" />}
          {!today?.check_in_at && ownVisits.length === 0 && ownReports.length === 0 && <p className="text-sm text-slate-500">No activity yet.</p>}
        </div>
      </div>
    </>
  )
}

function ProfileContact({ icon: Icon, label, value }) {
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

function MobileProfileCard({ title, action, children }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-3 dark:border-slate-800">
        <h4 className="font-bold">{title}</h4>
        {action}
      </div>
      <div className="p-4">{children}</div>
    </div>
  )
}

function ProfileSection({ title, icon: Icon, children }) {
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

function ProfileDetail({ label, value }) {
  return (
    <div className="grid gap-2 text-sm sm:grid-cols-[150px_12px_1fr]">
      <p className="text-slate-500 dark:text-slate-400">{label}</p>
      <span className="hidden text-slate-400 sm:block">:</span>
      <p className="font-semibold">{value || '-'}</p>
    </div>
  )
}

function MiniStat({ label, value, icon: Icon, tone }) {
  const styles = {
    emerald: 'bg-emerald-50 text-emerald-600',
    amber: 'bg-amber-50 text-amber-600',
    rose: 'bg-rose-50 text-rose-600',
    blue: 'bg-blue-50 text-blue-600',
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

function ProfileTimelineRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-4 py-4">
      <div className="grid h-10 w-10 place-items-center rounded-lg bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
        <Icon size={17} />
      </div>
      <p className="flex-1 font-semibold">{label}</p>
      <p className="font-bold">{value || '-'}</p>
    </div>
  )
}

function ActivityLine({ title, detail, time }) {
  return (
    <div className="grid grid-cols-[18px_1fr_auto] gap-3 text-sm">
      <div className="mt-1 flex flex-col items-center">
        <span className="h-3 w-3 rounded-full border-2 border-white bg-emerald-500 ring-2 ring-emerald-100" />
        <span className="mt-1 h-full w-px bg-slate-200 dark:bg-slate-800" />
      </div>
      <div>
        <p className="font-semibold">{title}</p>
        <p className="text-slate-500 dark:text-slate-400">{detail}</p>
      </div>
      <p className="text-slate-500 dark:text-slate-400">{time}</p>
    </div>
  )
}

function SecurityPage() {
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-3">
        <InfoCard label="API Protection" value="Sanctum" help="Bearer token secured routes" />
        <InfoCard label="Roles" value="Live" help="Loaded from user role" />
        <InfoCard label="Face Verify" value="Ready" help="Structure prepared for enrollment" />
      </div>
      <DataPanel
        title="Security Controls"
        subtitle="Controls that prevent fake attendance and preserve audit history."
        columns={['Control', 'Status', 'Purpose']}
        rows={[
          ['GPS radius validation', 'Active', 'Blocks fake office check-in'],
          ['Attendance edit reason', 'Active', 'Stores previous and new values'],
          ['R2 image uploads', 'Ready', 'Secures selfie and store proof'],
          ['Telegram alerts', 'Ready', 'Late and missing checkout notifications'],
        ]}
      />
    </>
  )
}

function LoginPage({ dark, onToggleDark, onLogin }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (event) => {
    event.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await authService.login({ email, password })
      onLogin(response.user)
    } catch (exception) {
      setError(exception.response?.data?.message || 'Login failed. Check email and password.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={clsx(dark && 'dark')}>
      <div className="grid min-h-screen overflow-hidden bg-slate-50 text-slate-950 dark:bg-slate-950 dark:text-slate-100 lg:grid-cols-[0.92fr_1.08fr]">
        <section className="relative hidden min-h-screen overflow-hidden bg-[#061827] px-12 py-10 text-white lg:flex lg:flex-col lg:justify-between xl:px-16">
          <div className="absolute inset-0 opacity-30 [background-image:radial-gradient(#22c55e_1.2px,transparent_1.2px)] [background-size:22px_22px]" />
          <div className="absolute -right-24 -top-36 h-80 w-80 rounded-full border-[54px] border-emerald-500/15" />
          <div className="absolute -bottom-28 right-6 h-72 w-72 rounded-full bg-emerald-500/10" />

          <div className="relative z-10">
            <div className="flex items-center gap-4">
              <div className="grid h-14 w-14 place-items-center rounded-2xl bg-emerald-500 text-white shadow-xl shadow-emerald-950/30">
                <Activity size={28} />
              </div>
              <div>
                <h1 className="text-3xl font-extrabold tracking-tight">
                  Sales<span className="text-emerald-400">Track</span>
                </h1>
                <p className="text-sm text-slate-300">Attendance & Sales Tracking System</p>
              </div>
            </div>

            <div className="mt-20 max-w-xl">
              <h2 className="text-5xl font-extrabold leading-tight tracking-normal xl:text-6xl">
                Track Attendance.
                <br />
                Boost <span className="text-emerald-400">Performance.</span>
              </h2>
              <p className="mt-7 max-w-lg text-xl leading-8 text-slate-300">
                Smart attendance management and outdoor sales tracking for modern teams.
              </p>
            </div>
          </div>

          <div className="relative z-10 mt-12">
            <div className="relative h-[330px] max-w-2xl">
              <div className="absolute left-0 top-7 h-72 w-44 rounded-[2rem] border-4 border-slate-700 bg-slate-950 p-3 shadow-2xl">
                <div className="h-full rounded-[1.45rem] bg-white p-3 text-slate-900">
                  <div className="mx-auto mb-3 h-4 w-16 rounded-full bg-slate-200" />
                  <div className="h-36 rounded-2xl bg-[linear-gradient(135deg,#e0f2fe,#dcfce7)] p-4">
                    <MapPinned className="mt-12 text-emerald-600" size={30} />
                  </div>
                  <div className="mt-3 rounded-xl border border-slate-100 p-3 shadow-sm">
                    <p className="text-xs font-bold">Check In</p>
                    <p className="mt-2 text-lg font-extrabold">09:12 AM</p>
                  </div>
                </div>
              </div>

              <div className="absolute left-36 top-0 w-[430px] rounded-2xl border border-white/50 bg-white p-6 text-slate-950 shadow-2xl">
                <p className="text-sm font-extrabold">Dashboard</p>
                <div className="mt-6 grid grid-cols-4 gap-4 text-center">
                  {[
                    ['128', 'Employees', 'text-blue-600'],
                    ['96', 'Present', 'text-emerald-600'],
                    ['20', 'Absent', 'text-rose-600'],
                    ['12', 'Late', 'text-amber-500'],
                  ].map(([value, label, color]) => (
                    <div key={label}>
                      <p className={clsx('text-2xl font-extrabold', color)}>{value}</p>
                      <p className="mt-1 text-[11px] font-semibold text-slate-500">{label}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-8 h-28 rounded-xl border border-slate-100 bg-[linear-gradient(180deg,#ecfdf5,#ffffff)]">
                  <svg viewBox="0 0 420 112" className="h-full w-full" aria-hidden="true">
                    <polyline fill="none" stroke="#10b981" strokeWidth="4" points="15,82 80,54 145,74 210,44 275,60 340,30 405,18" />
                    <line x1="15" y1="92" x2="405" y2="92" stroke="#e2e8f0" />
                  </svg>
                </div>
              </div>

              <div className="absolute bottom-3 left-28 flex items-center gap-4 rounded-2xl bg-white px-6 py-4 text-slate-950 shadow-2xl">
                <div className="grid h-11 w-11 place-items-center rounded-xl bg-emerald-500 text-white">
                  <ShieldCheck size={23} />
                </div>
                <div>
                  <p className="font-bold">Secure • Accurate • Reliable</p>
                  <p className="text-sm text-slate-500">Real-time tracking and reporting</p>
                </div>
              </div>
            </div>
          </div>

          <div className="relative z-10 grid grid-cols-3 gap-8 border-t border-white/10 pt-8">
            {[
              [LocateFixed, 'GPS Tracking', 'Real-time location tracking'],
              [ShieldCheck, 'Secure & Safe', 'Your data is protected'],
              [Activity, 'Smart Reports', 'Detailed insights and analytics'],
            ].map(([Icon, title, text]) => (
              <div key={title}>
                <div className="mb-4 grid h-11 w-11 place-items-center rounded-xl bg-emerald-500/20 text-emerald-300">
                  <Icon size={22} />
                </div>
                <p className="font-bold text-emerald-300">{title}</p>
                <p className="mt-2 leading-7 text-slate-300">{text}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="relative flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,#ffffff,#f1f5f9_62%,#e2e8f0)] p-5 dark:bg-[radial-gradient(circle_at_top,#111827,#020617_70%)] sm:p-8">
          <button
            type="button"
            className="absolute right-5 top-5 rounded-2xl border border-slate-200 bg-white/80 p-3 text-slate-700 shadow-sm backdrop-blur transition hover:bg-white dark:border-slate-800 dark:bg-slate-900/80 dark:text-slate-200"
            onClick={onToggleDark}
            aria-label="Toggle dark mode"
          >
            {dark ? <Sun size={20} /> : <Moon size={20} />}
          </button>

          <form onSubmit={handleSubmit} className="w-full max-w-[580px] rounded-[1.75rem] border border-white bg-white/95 p-6 shadow-2xl shadow-slate-300/50 backdrop-blur dark:border-slate-800 dark:bg-slate-900/95 dark:shadow-black/30 sm:p-10 lg:p-14">
            <div className="mb-9 text-center">
              <div className="mx-auto mb-6 grid h-14 w-14 place-items-center rounded-2xl bg-emerald-500 text-white shadow-lg shadow-emerald-200 dark:shadow-emerald-950/40 lg:hidden">
                <Activity size={26} />
              </div>
              <h2 className="text-3xl font-extrabold tracking-normal text-slate-950 dark:text-white sm:text-4xl">Welcome Back!</h2>
              <p className="mt-3 text-lg text-slate-600 dark:text-slate-300">Sign in to continue to your account</p>
            </div>

            <div className="space-y-6">
              <label className="block">
                <span className="text-sm font-extrabold text-slate-950 dark:text-slate-100">Email or Phone Number</span>
                <span className="mt-3 flex items-center gap-4 rounded-lg border border-slate-200 bg-white px-4 py-4 text-slate-500 shadow-sm transition focus-within:border-emerald-500 focus-within:ring-4 focus-within:ring-emerald-500/10 dark:border-slate-700 dark:bg-slate-950">
                  <UserRound className="shrink-0 text-emerald-600" size={21} />
                  <input
                    className="min-w-0 flex-1 bg-transparent text-base font-medium text-slate-900 outline-none placeholder:text-slate-500 dark:text-white"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    type="text"
                    autoComplete="username"
                    placeholder="Enter email or phone number"
                    required
                  />
                </span>
              </label>

              <label className="block">
                <span className="text-sm font-extrabold text-slate-950 dark:text-slate-100">Password</span>
                <span className="mt-3 flex items-center gap-4 rounded-lg border border-slate-200 bg-white px-4 py-4 text-slate-500 shadow-sm transition focus-within:border-emerald-500 focus-within:ring-4 focus-within:ring-emerald-500/10 dark:border-slate-700 dark:bg-slate-950">
                  <Fingerprint className="shrink-0 text-emerald-600" size={21} />
                  <input
                    className="min-w-0 flex-1 bg-transparent text-base font-medium text-slate-900 outline-none placeholder:text-slate-500 dark:text-white"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    placeholder="Enter your password"
                    required
                  />
                  <button
                    type="button"
                    className="shrink-0 rounded-lg p-1 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-white"
                    onClick={() => setShowPassword((value) => !value)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </span>
              </label>
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-between gap-4 text-sm">
              <label className="flex items-center gap-3 font-medium text-slate-600 dark:text-slate-300">
                <input type="checkbox" className="h-5 w-5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500" defaultChecked />
                Remember me
              </label>
              <button type="button" className="font-semibold text-emerald-700 hover:text-emerald-800 dark:text-emerald-400">
                Forgot Password?
              </button>
            </div>

            {error && <p className="mt-5 rounded-lg bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700 dark:bg-rose-950/40 dark:text-rose-200">{error}</p>}

            <button className="mt-8 flex w-full items-center justify-center gap-3 rounded-lg bg-emerald-700 px-5 py-4 text-lg font-extrabold text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-70" disabled={loading} type="submit">
              {loading ? 'Signing in...' : 'Login'}
              <LogOut className="rotate-180" size={21} />
            </button>

            <p className="mt-8 text-center text-sm text-slate-500 dark:text-slate-400">
              Use the username and password created by admin.
            </p>
          </form>
        </section>
      </div>
    </div>
  )
}

function AttendanceCard({ attendance, onAttendanceAction }) {
  const checkedIn = Boolean(attendance?.check_in_at)
  const completed = Boolean(attendance?.check_out_at)
  const nextAction = checkedIn ? 'check-out' : 'check-in'

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-bold">Attendance</h3>
        <StatusPill status={checkedIn ? titleCase(attendance.status) : 'Not Checked In'} />
      </div>
      <div className="space-y-5 text-sm">
        <InfoLine label="Check In Time" value={formatTime(attendance?.check_in_at)} />
        <InfoLine label="Check Out Time" value={formatTime(attendance?.check_out_at)} />
        <InfoLine label="Late Minutes" value={attendance?.late_minutes ?? 0} />
      </div>
      <button
        className="mt-6 w-full rounded-lg bg-emerald-600 px-4 py-3 font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
        disabled={completed}
        onClick={() => onAttendanceAction(nextAction)}
      >
        {completed ? 'Completed' : checkedIn ? 'Check Out' : 'Check In'}
      </button>
      <button
        className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-emerald-200 px-4 py-3 font-semibold text-emerald-700"
        onClick={() => onAttendanceAction(nextAction)}
      >
        <Camera size={17} />
        Take Selfie
      </button>
    </div>
  )
}

function VisitList({ title, visits }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <h3 className="text-lg font-bold">{title}</h3>
      <div className="mt-5 space-y-4">
        {visits.length === 0 && <EmptyState text="No customer visits yet." />}
        {visits.map((visit, index) => (
          <div key={visit.id} className="grid grid-cols-[18px_1fr_auto] gap-3">
            <div className="flex flex-col items-center">
              <span className={clsx('mt-3 h-2.5 w-2.5 rounded-full', index === 0 ? 'bg-emerald-500' : 'bg-slate-300')} />
              {index !== visits.length - 1 && <span className="h-full w-px bg-slate-200 dark:bg-slate-700" />}
            </div>
            <div className="flex gap-3">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-slate-100 dark:bg-slate-800">
                <ShoppingBag size={18} />
              </div>
              <div>
                <p className="font-semibold">{visit.customer_name}</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">{visit.address || visit.store_name || '-'}</p>
              </div>
            </div>
            <div className="text-right">
              <StatusPill status={titleCase(visit.status)} />
              <p className="mt-1 text-xs text-slate-500">{formatTime(visit.check_in_at)}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function RouteCard({ isLoaded, locations }) {
  const points = locations
    .filter((item) => item.latitude && item.longitude)
    .map((item) => ({ lat: Number(item.latitude), lng: Number(item.longitude) }))
  const center = points[0] || { lat: 13.7563, lng: 100.5018 }

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold">Live GPS Route</h3>
        <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">{points.length} points</span>
      </div>
      <div className="mt-5 h-64 overflow-hidden rounded-lg border border-slate-200 dark:border-slate-800">
        {isLoaded && import.meta.env.VITE_GOOGLE_MAPS_API_KEY ? (
          <GoogleMap mapContainerClassName="h-full w-full" center={center} zoom={12}>
            {points.map((point) => <MarkerF key={`${point.lat}-${point.lng}`} position={point} />)}
            {points.length > 1 && <PolylineF path={points} options={{ strokeColor: '#16a34a', strokeWeight: 4 }} />}
          </GoogleMap>
        ) : (
          <div className="grid h-full place-items-center bg-[linear-gradient(135deg,#dcfce7,#dbeafe)] p-6 text-center text-slate-700">
            <div>
              <MapPinned className="mx-auto mb-3" size={34} />
              <p className="font-semibold">Google Maps ready</p>
              <p className="mt-1 text-sm">Set VITE_GOOGLE_MAPS_API_KEY to show live GPS points.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function RecentVisitsPanel({ visits }) {
  const rows = visits.map((visit) => [visit.customer_name, visit.address || visit.store_name || '-', formatTime(visit.check_in_at), titleCase(visit.status)])
  return <DataPanel title="Recent Visits" subtitle="Customer visits from MySQL." columns={['Customer', 'Area', 'Time', 'Status']} rows={rows} actionLabel="View All" />
}

function TodayReportPanel({ reports }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <h3 className="text-lg font-bold">Reports</h3>
      <div className="mt-5 space-y-3">
        {reports.length === 0 && <EmptyState text="No reports submitted yet." />}
        {reports.slice(0, 4).map((report) => (
          <div key={report.id} className="flex items-center justify-between rounded-lg bg-slate-50 p-3 dark:bg-slate-950">
            <div>
              <p className="text-sm font-semibold">{report.title}</p>
              <p className="text-xs text-slate-500">{formatDate(report.report_date)}</p>
            </div>
            <StatusPill status={titleCase(report.status)} />
          </div>
        ))}
      </div>
    </div>
  )
}

function ReportsPanel({ chartData, notifications }) {
  const grouped = normaliseChart(chartData)
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <h3 className="text-lg font-bold">Reports & Alerts</h3>
      <div className="mt-5 h-52">
        {grouped.length === 0 ? <EmptyState text="No attendance chart data yet." /> : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={grouped}>
              <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="present" fill="#10b981" radius={[6, 6, 0, 0]} />
              <Bar dataKey="late" fill="#f59e0b" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
      <div className="mt-5 space-y-3">
        {notifications.slice(0, 3).map((item) => (
          <div key={item.id} className="flex items-center gap-3 rounded-lg bg-slate-50 p-3 text-sm dark:bg-slate-950">
            <Bell size={16} className="text-slate-500" />
            <span>{item.title}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function AttendanceTable({ rows }) {
  const tableRows = rows.map((item) => [
    item.employee?.employee_code || '-',
    item.employee ? `${item.employee.first_name} ${item.employee.last_name}` : '-',
    item.employee?.department?.name || '-',
    titleCase(item.status),
    formatTime(item.check_in_at),
    item.branch?.name || '-',
  ])
  return <DataPanel title="Attendance History" subtitle="Real attendance records." columns={['Code', 'Employee', 'Department', 'Status', 'Time', 'Location']} rows={tableRows} actionLabel="Filter" />
}

function QuickActions({ onAttendanceAction, setModal, user }) {
  const actions = [
    ['Check In', LocateFixed, 'GPS + selfie verification', () => onAttendanceAction('check-in'), ['attendance_check_in', 'office_check_in']],
    ['Check Out', Clock, 'Work duration is calculated', () => onAttendanceAction('check-out'), ['attendance_check_out', 'office_check_out']],
    ['Outdoor Visit', Camera, 'Shop photo + visit notes', () => setModal('visit'), ['create_customer_visit', 'manage_customer_visits']],
    ['Export', Download, 'CSV reports', downloadReports, ['export_reports', 'export_excel_reports', 'export_attendance_reports']],
  ].filter(([, , , , permissions]) => canAccess(user, permissions))

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
      {actions.map(([label, Icon, help, onClick]) => (
        <motion.button whileHover={{ y: -2 }} key={label} onClick={onClick} className="rounded-lg border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
          <Icon className="mb-3 text-slate-700 dark:text-slate-200" size={22} />
          <p className="font-semibold">{label}</p>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{help}</p>
        </motion.button>
      ))}
    </div>
  )
}

async function downloadReports() {
  const response = await api.get('/reports/export', { responseType: 'blob' })
  const url = URL.createObjectURL(response.data)
  const link = document.createElement('a')
  link.href = url
  link.download = 'attendance-reports.csv'
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

function PanelHeader({ title, subtitle, actionLabel = 'Add New', onAction }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 p-5 dark:border-slate-800">
      <div>
        <h3 className="text-lg font-bold">{title}</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>
      </div>
      <button className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white" onClick={onAction || (() => {})}>{actionLabel}</button>
    </div>
  )
}

function DataPanel({ title, subtitle, columns, rows, actionLabel = 'Add New', onAction }) {
  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <PanelHeader title={title} subtitle={subtitle} actionLabel={actionLabel} onAction={onAction} />
      {rows.length === 0 ? <EmptyState text="No real records found yet." /> : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[680px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500 dark:bg-slate-950 dark:text-slate-400">
              <tr>{columns.map((column) => <th key={column} className="px-5 py-3">{column}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {rows.map((row) => (
                <tr key={row.join('-')} className="hover:bg-slate-50 dark:hover:bg-slate-800/60">
                  {row.map((cell, index) => <td key={`${cell}-${index}`} className="px-5 py-4">{index === row.length - 1 ? <StatusPill status={String(cell)} /> : cell}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function MobileNav({ active, setActive, user, onAttendanceAction, todayAttendance }) {
  const checkedIn = Boolean(todayAttendance?.check_in_at)
  const completed = Boolean(todayAttendance?.check_out_at)
  const nextAction = checkedIn && !completed ? 'check-out' : 'check-in'
  const centerLabel = completed ? 'Done' : checkedIn ? 'Check Out' : 'Check In'
  const CenterIcon = completed ? CheckCircle2 : checkedIn ? Clock : LocateFixed
  const centerTone = completed
    ? 'bg-slate-400 shadow-slate-400/20'
    : checkedIn
    ? 'bg-amber-500 shadow-amber-900/20'
    : 'bg-emerald-500 shadow-emerald-900/20'

  const canCheckInOut = canAccess(user, ['attendance_check_in', 'office_check_in', 'attendance_check_out', 'office_check_out'])
  const isAttendanceActive = active === 'My Attendance' || active === 'Check In / Out'
  const isReportsActive = active === 'Daily Reports' || active === 'Reports' || active === 'My Reports'

  const leftItems = [
    { label: 'Home', target: 'Dashboard', icon: Home, isActive: active === 'Dashboard', permissions: ['dashboard_access', 'employee_dashboard_access'] },
    { label: 'Attendance', target: 'My Attendance', icon: CalendarCheck, isActive: isAttendanceActive, permissions: ['view_own_attendance', 'view_all_attendance', 'attendance_check_in', 'office_check_in'] },
  ].filter((item) => canAccess(user, item.permissions))

  const rightItems = [
    { label: 'Reports', target: 'Daily Reports', icon: FileText, isActive: isReportsActive, permissions: ['submit_daily_report', 'view_own_reports', 'view_reports', 'view_sales_reports'] },
    { label: 'Profile', target: 'Profile', icon: UserRound, isActive: active === 'Profile', permissions: ['update_profile', 'employee_dashboard_access', 'dashboard_access'] },
  ].filter((item) => canAccess(user, item.permissions))

  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white px-3 py-2 shadow-[0_-8px_30px_rgba(15,23,42,0.08)] dark:border-slate-800 dark:bg-slate-900 lg:hidden">
      <div className="grid grid-cols-5 items-end gap-1">
        {leftItems.map((item) => (
          <button
            key={item.label}
            onClick={() => setActive(item.target)}
            className={clsx('flex flex-col items-center gap-1 rounded-lg px-1 py-1 text-[11px] font-semibold', item.isActive ? 'text-emerald-600' : 'text-slate-500')}
          >
            <span className="grid h-7 w-7 place-items-center">
              <item.icon size={18} />
            </span>
            <span>{item.label}</span>
          </button>
        ))}

        {canCheckInOut ? (
          <button
            disabled={completed}
            onClick={() => !completed && onAttendanceAction(nextAction)}
            className="flex flex-col items-center gap-1 rounded-lg px-1 py-1 text-[11px] font-semibold text-slate-500 disabled:opacity-50"
          >
            <span className={clsx('grid h-14 w-14 -translate-y-4 place-items-center rounded-full text-white shadow-lg', centerTone)}>
              <CenterIcon size={24} />
            </span>
            <span className="-mt-4">{centerLabel}</span>
          </button>
        ) : (
          <span />
        )}

        {rightItems.map((item) => (
          <button
            key={item.label}
            onClick={() => setActive(item.target)}
            className={clsx('flex flex-col items-center gap-1 rounded-lg px-1 py-1 text-[11px] font-semibold', item.isActive ? 'text-emerald-600' : 'text-slate-500')}
          >
            <span className="grid h-7 w-7 place-items-center">
              <item.icon size={18} />
            </span>
            <span>{item.label}</span>
          </button>
        ))}
      </div>
    </nav>
  )
}

function AttendanceActionModal({ action, onClose, onSaved }) {
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const streamRef = useRef(null)
  const [photoBlob, setPhotoBlob] = useState(null)
  const [photoPreview, setPhotoPreview] = useState('')
  const [coords, setCoords] = useState(null)
  const [status, setStatus] = useState('Opening camera and reading GPS...')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const isCheckIn = action === 'check-in'

  useEffect(() => {
    let active = true

    const start = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user' },
          audio: false,
        })

        if (!active) {
          stream.getTracks().forEach((track) => track.stop())
          return
        }

        streamRef.current = stream
        if (videoRef.current) {
          videoRef.current.srcObject = stream
        }
      } catch {
        setError('Camera permission is required to take attendance photo.')
      }

      if (!navigator.geolocation) {
        setError('GPS is not available in this browser.')
        return
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          if (!active) return
          setCoords({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            speed: position.coords.speed || 0,
          })
          setStatus('GPS ready. Take a selfie to continue.')
        },
        () => {
          if (!active) return
          setError('GPS permission is required for attendance.')
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
      )
    }

    start()

    return () => {
      active = false
      streamRef.current?.getTracks().forEach((track) => track.stop())
    }
  }, [])

  useEffect(() => {
    return () => {
      if (photoPreview) URL.revokeObjectURL(photoPreview)
    }
  }, [photoPreview])

  const capturePhoto = () => {
    const video = videoRef.current
    const canvas = canvasRef.current

    if (!video || !canvas) return

    canvas.width = video.videoWidth || 720
    canvas.height = video.videoHeight || 720
    canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height)
    canvas.toBlob((blob) => {
      if (!blob) return
      if (photoPreview) URL.revokeObjectURL(photoPreview)
      setPhotoBlob(blob)
      setPhotoPreview(URL.createObjectURL(blob))
      setStatus('Photo captured. Submit attendance when ready.')
    }, 'image/jpeg', 0.9)
  }

  const submitAttendance = async () => {
    if (!coords || !photoBlob) {
      setError('Please allow GPS and take a selfie first.')
      return
    }

    setSubmitting(true)
    setError('')

    const formData = new FormData()
    formData.append('latitude', coords.latitude)
    formData.append('longitude', coords.longitude)
    formData.append('accuracy', coords.accuracy || '')
    formData.append('speed', coords.speed || 0)
    formData.append('photo', photoBlob, `${action}-${Date.now()}.jpg`)

    if (isCheckIn) {
      formData.append('type', 'office')
      formData.append('notes', 'Submitted from web camera attendance.')
    }

    try {
      if (isCheckIn) {
        await attendanceService.checkIn(formData)
      } else {
        await attendanceService.checkOut(formData)
      }
      onSaved()
    } catch (exception) {
      const message = exception.response?.data?.message
      const errors = exception.response?.data?.errors
      setError(errors ? Object.values(errors).flat().join(' ') : message || 'Attendance submission failed.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/70 p-4">
      <div className="w-full max-w-lg overflow-hidden rounded-lg bg-white shadow-2xl dark:bg-slate-900">
        <div className="flex items-center justify-between border-b border-slate-200 p-4 dark:border-slate-800">
          <div>
            <h3 className="text-lg font-bold">{isCheckIn ? 'Check In' : 'Check Out'}</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">Camera photo and GPS are required.</p>
          </div>
          <button className="rounded-lg border border-slate-200 p-2 dark:border-slate-700" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="space-y-4 p-4">
          <div className="overflow-hidden rounded-lg bg-slate-950">
            {photoPreview ? (
              <img className="h-72 w-full object-cover" src={photoPreview} alt="Captured selfie" />
            ) : (
              <video ref={videoRef} className="h-72 w-full object-cover" autoPlay playsInline muted />
            )}
            <canvas ref={canvasRef} className="hidden" />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <button className="rounded-lg border border-emerald-200 px-4 py-3 font-semibold text-emerald-700" onClick={capturePhoto} type="button">
              {photoPreview ? 'Retake Photo' : 'Take Photo'}
            </button>
            <button
              className="rounded-lg bg-emerald-600 px-4 py-3 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
              disabled={!coords || !photoBlob || submitting}
              onClick={submitAttendance}
              type="button"
            >
              {submitting ? 'Submitting...' : isCheckIn ? 'Submit Check In' : 'Submit Check Out'}
            </button>
          </div>

          <div className="rounded-lg bg-slate-50 p-3 text-sm text-slate-600 dark:bg-slate-950 dark:text-slate-300">
            <p>{status}</p>
            <p className="mt-1">GPS: {coords ? `${coords.latitude.toFixed(6)}, ${coords.longitude.toFixed(6)} (${Math.round(coords.accuracy || 0)}m)` : 'Waiting...'}</p>
          </div>

          {error && <p className="rounded-lg bg-rose-50 p-3 text-sm font-medium text-rose-700">{error}</p>}
        </div>
      </div>
    </div>
  )
}

function EmployeeModal({ employee, onClose, onSaved }) {
  const isEdit = Boolean(employee)
  const loginRoleId = employee?.user?.role_id || employee?.user?.role?.id || ''
  const [form, setForm] = useState({
    employee_code: employee?.employee_code || '',
    full_name: [employee?.first_name, employee?.last_name].filter(Boolean).join(' '),
    phone: employee?.phone || '',
    address: employee?.address || '',
    department_id: employee?.department_id || '',
    position_id: employee?.position_id || '',
    branch_id: employee?.branch_id || '',
    hire_date: employee?.hire_date || '',
    employment_type: employee?.employment_type || 'full_time',
    status: employee?.status || 'active',
    create_login: !employee,
    login_email: employee?.user?.email || '',
    login_password: '',
    role_id: loginRoleId,
  })
  const [options, setOptions] = useState({ departments: [], positions: [], branches: [], roles: [] })
  const [photo, setPhoto] = useState(null)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    api.get('/employee-options')
      .then((response) => {
        const nextOptions = response.data
        setOptions(nextOptions)
        const employeeRole = nextOptions.roles?.find((role) => role.slug === 'office_staff')
        setForm((current) => ({
          ...current,
          role_id: current.role_id || employeeRole?.id || '',
        }))
      })
      .catch(() => setError('Cannot load departments, positions, branches, and roles.'))
  }, [])

  const submit = async (event) => {
    event.preventDefault()
    setSaving(true)
    setError('')
    const body = new FormData()
    const [firstName, ...lastNameParts] = form.full_name.trim().split(/\s+/).filter(Boolean)
    const payload = {
      ...form,
      first_name: firstName || '',
      last_name: lastNameParts.join(' '),
    }
    delete payload.full_name
    Object.entries(payload).forEach(([key, value]) => body.append(key, typeof value === 'boolean' ? (value ? '1' : '0') : value))
    if (photo) body.append('photo', photo)
    if (isEdit) body.append('_method', 'PUT')

    try {
      await api.post(isEdit ? `/employees/${employee.id}` : '/employees', body)
      onSaved()
    } catch (exception) {
      setError(apiError(exception))
    } finally {
      setSaving(false)
    }
  }

  return (
    <SimpleModal
      title={isEdit ? 'Edit Employee' : 'Add Employee'}
      subtitle={isEdit ? 'Update employee profile and login information.' : 'Fill employee details and create their login account.'}
      onClose={onClose}
    >
      <form className="grid gap-4" onSubmit={submit}>
        <div>
          <label className="text-sm font-semibold">Employee Photo</label>
          <input className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 dark:border-slate-700 dark:bg-slate-950" type="file" accept="image/*" onChange={(event) => setPhoto(event.target.files?.[0] || null)} />
          {photo && <p className="mt-1 text-xs text-slate-500">{photo.name}</p>}
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <FormInput label="Full Name" value={form.full_name} onChange={(value) => setForm({ ...form, full_name: value })} required />
          <FormInput label="Phone Number" value={form.phone} onChange={(value) => setForm({ ...form, phone: value })} />
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <FormInput label="Email / Username" type="email" value={form.login_email} onChange={(value) => setForm({ ...form, login_email: value })} required={!isEdit || Boolean(form.login_password)} />
          <FormInput label={isEdit ? 'New Password' : 'Password'} type="password" value={form.login_password} onChange={(value) => setForm({ ...form, login_password: value })} required={!isEdit} />
        </div>
        <p className="-mt-2 text-xs text-slate-500 dark:text-slate-400">
          Employee uses this email/username and password on the login screen. Password must be at least 8 characters.
        </p>

        <div className="grid gap-3 sm:grid-cols-2">
          <FormInput label="Employee ID" value={form.employee_code} onChange={(value) => setForm({ ...form, employee_code: value })} required />
          <FormSelect label="Role" value={form.role_id} onChange={(value) => setForm({ ...form, role_id: value })} required>
            <option value="">Select role</option>
            {options.roles.map((role) => <option key={role.id} value={role.id}>{role.name}</option>)}
          </FormSelect>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <FormSelect label="Department" value={form.department_id} onChange={(value) => setForm({ ...form, department_id: value })}>
            <option value="">Select department</option>
            {options.departments.map((department) => <option key={department.id} value={department.id}>{department.name}</option>)}
          </FormSelect>
          <FormSelect label="Position" value={form.position_id} onChange={(value) => setForm({ ...form, position_id: value })}>
            <option value="">Select position</option>
            {options.positions.map((position) => <option key={position.id} value={position.id}>{position.name}</option>)}
          </FormSelect>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <FormSelect label="Branch" value={form.branch_id} onChange={(value) => setForm({ ...form, branch_id: value })}>
            <option value="">Select branch</option>
            {options.branches.map((branch) => <option key={branch.id} value={branch.id}>{branch.name}</option>)}
          </FormSelect>
          <FormInput label="Join Date" type="date" value={form.hire_date} onChange={(value) => setForm({ ...form, hire_date: value })} />
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <FormSelect label="Employment Type" value={form.employment_type} onChange={(value) => setForm({ ...form, employment_type: value })} required>
            <option value="full_time">Full Time</option>
            <option value="part_time">Part Time</option>
            <option value="contract">Contract</option>
            <option value="outdoor_sales">Outdoor Sales</option>
          </FormSelect>
          <FormSelect label="Status" value={form.status} onChange={(value) => setForm({ ...form, status: value })} required>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="suspended">Suspended</option>
          </FormSelect>
        </div>

        <FormTextarea label="Address" value={form.address} onChange={(value) => setForm({ ...form, address: value })} />

        {error && <ErrorText text={error} />}
        <SubmitButton saving={saving} label={isEdit ? 'Update Employee' : 'Save Employee'} />
      </form>
    </SimpleModal>
  )
}

function VisitModal({ onClose, onSaved }) {
  const [form, setForm] = useState({
    customer_name: '',
    store_name: '',
    contact_person: '',
    phone: '',
    address: '',
    latitude: '',
    longitude: '',
    notes: '',
  })
  const [selfie, setSelfie] = useState(null)
  const [storePhoto, setStorePhoto] = useState(null)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const useGps = () => {
    navigator.geolocation?.getCurrentPosition(
      (position) => setForm({
        ...form,
        latitude: String(position.coords.latitude),
        longitude: String(position.coords.longitude),
      }),
      () => setError('Cannot read GPS. Please allow location permission.'),
      { enableHighAccuracy: true },
    )
  }

  const submit = async (event) => {
    event.preventDefault()
    setSaving(true)
    setError('')
    const body = new FormData()
    Object.entries(form).forEach(([key, value]) => body.append(key, value))
    if (selfie) body.append('selfie', selfie)
    if (storePhoto) body.append('store_photo', storePhoto)

    try {
      await api.post('/customer-visits', body)
      onSaved()
    } catch (exception) {
      setError(apiError(exception))
    } finally {
      setSaving(false)
    }
  }

  return (
    <SimpleModal title="Add Customer Visit" subtitle="Create a real outdoor sales visit." onClose={onClose}>
      <form className="grid gap-3" onSubmit={submit}>
        <FormInput label="Customer Name" value={form.customer_name} onChange={(value) => setForm({ ...form, customer_name: value })} required />
        <FormInput label="Store Name" value={form.store_name} onChange={(value) => setForm({ ...form, store_name: value })} />
        <FormInput label="Address" value={form.address} onChange={(value) => setForm({ ...form, address: value })} />
        <button className="rounded-lg border border-emerald-200 px-3 py-2 text-sm font-semibold text-emerald-700" type="button" onClick={useGps}>Use Current GPS</button>
        <div className="grid gap-3 sm:grid-cols-2">
          <FormInput label="Latitude" value={form.latitude} onChange={(value) => setForm({ ...form, latitude: value })} required />
          <FormInput label="Longitude" value={form.longitude} onChange={(value) => setForm({ ...form, longitude: value })} required />
        </div>
        <label className="text-sm font-semibold">Selfie</label>
        <input className="rounded-lg border border-slate-200 px-3 py-2 dark:border-slate-700 dark:bg-slate-950" type="file" accept="image/*" capture="user" onChange={(event) => setSelfie(event.target.files?.[0] || null)} required />
        <label className="text-sm font-semibold">Store Photo</label>
        <input className="rounded-lg border border-slate-200 px-3 py-2 dark:border-slate-700 dark:bg-slate-950" type="file" accept="image/*" capture="environment" onChange={(event) => setStorePhoto(event.target.files?.[0] || null)} required />
        {error && <ErrorText text={error} />}
        <SubmitButton saving={saving} label="Save Visit" />
      </form>
    </SimpleModal>
  )
}

function ReportModal({ onClose, onSaved }) {
  const [form, setForm] = useState({
    report_date: new Date().toISOString().slice(0, 10),
    type: 'daily',
    title: '',
    content: '',
    orders_collected: '',
  })
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const submit = async (event) => {
    event.preventDefault()
    setSaving(true)
    setError('')
    try {
      await api.post('/reports', {
        report_date: form.report_date,
        type: form.type,
        title: form.title,
        content: form.content,
        metrics: {
          orders_collected: Number(form.orders_collected || 0),
        },
      })
      onSaved()
    } catch (exception) {
      setError(apiError(exception))
    } finally {
      setSaving(false)
    }
  }

  return (
    <SimpleModal title="Add Report" subtitle="Submit a real report." onClose={onClose}>
      <form className="grid gap-3" onSubmit={submit}>
        <FormInput label="Report Date" type="date" value={form.report_date} onChange={(value) => setForm({ ...form, report_date: value })} required />
        <label className="text-sm font-semibold">Type</label>
        <select className="rounded-lg border border-slate-200 px-3 py-2 dark:border-slate-700 dark:bg-slate-950" value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value })}>
          <option value="daily">Daily</option>
          <option value="weekly">Weekly</option>
          <option value="monthly">Monthly</option>
          <option value="visit">Visit</option>
        </select>
        <FormInput label="Title" value={form.title} onChange={(value) => setForm({ ...form, title: value })} required />
        <FormInput label="Orders Collected" type="number" value={form.orders_collected} onChange={(value) => setForm({ ...form, orders_collected: value })} />
        <label className="text-sm font-semibold">Content</label>
        <textarea className="min-h-32 rounded-lg border border-slate-200 px-3 py-2 dark:border-slate-700 dark:bg-slate-950" value={form.content} onChange={(event) => setForm({ ...form, content: event.target.value })} required />
        {error && <ErrorText text={error} />}
        <SubmitButton saving={saving} label="Submit Report" />
      </form>
    </SimpleModal>
  )
}

function SimpleModal({ title, subtitle, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/70 p-4">
      <div className="max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-lg bg-white shadow-2xl dark:bg-slate-900">
        <div className="flex items-center justify-between border-b border-slate-200 p-4 dark:border-slate-800">
          <div>
            <h3 className="text-lg font-bold">{title}</h3>
            <p className="text-sm text-slate-500">{subtitle}</p>
          </div>
          <button className="rounded-lg border border-slate-200 p-2 dark:border-slate-700" onClick={onClose}>
            <X size={18} />
          </button>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  )
}

function FormInput({ label, value, onChange, type = 'text', required = false }) {
  return (
    <>
      <label className="text-sm font-semibold">{label}</label>
      <input className="rounded-lg border border-slate-200 px-3 py-2 dark:border-slate-700 dark:bg-slate-950" type={type} value={value} onChange={(event) => onChange(event.target.value)} required={required} />
    </>
  )
}

function FormSelect({ label, value, onChange, required = false, children }) {
  return (
    <>
      <label className="text-sm font-semibold">{label}</label>
      <select className="rounded-lg border border-slate-200 px-3 py-2 dark:border-slate-700 dark:bg-slate-950" value={value} onChange={(event) => onChange(event.target.value)} required={required}>
        {children}
      </select>
    </>
  )
}

function FormTextarea({ label, value, onChange, required = false }) {
  return (
    <>
      <label className="text-sm font-semibold">{label}</label>
      <textarea className="min-h-24 rounded-lg border border-slate-200 px-3 py-2 dark:border-slate-700 dark:bg-slate-950" value={value} onChange={(event) => onChange(event.target.value)} required={required} />
    </>
  )
}

function SubmitButton({ saving, label }) {
  return <button className="rounded-lg bg-emerald-600 px-4 py-3 font-semibold text-white disabled:opacity-60" disabled={saving} type="submit">{saving ? 'Saving...' : label}</button>
}

function ErrorText({ text }) {
  return <p className="rounded-lg bg-rose-50 p-3 text-sm font-medium text-rose-700">{text}</p>
}

function Toggle({ checked, onChange }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={onChange}
      className={clsx(
        'relative inline-flex h-6 w-14 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200 focus:outline-none',
        checked ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600',
      )}
    >
      <span className={clsx(
        'inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform duration-200',
        checked ? 'translate-x-[33px]' : 'translate-x-0.5',
      )} />
      <span className={clsx(
        'absolute text-[9px] font-bold',
        checked ? 'left-1.5 text-white' : 'right-1.5 text-slate-500 dark:text-slate-300',
      )}>
        {checked ? 'ON' : 'OFF'}
      </span>
    </button>
  )
}

function StatusPill({ status }) {
  const styles = {
    Present: 'bg-emerald-100 text-emerald-700',
    Late: 'bg-amber-100 text-amber-700',
    Active: 'bg-emerald-100 text-emerald-700',
    Open: 'bg-blue-100 text-blue-700',
    Closed: 'bg-slate-100 text-slate-600',
    Submitted: 'bg-emerald-100 text-emerald-700',
    Reviewed: 'bg-violet-100 text-violet-700',
    Unread: 'bg-red-100 text-red-700',
    Read: 'bg-slate-100 text-slate-600',
    'Not Checked In': 'bg-slate-100 text-slate-600',
  }
  return <span className={clsx('rounded-full px-3 py-1 text-xs font-semibold', styles[status] || 'bg-slate-100 text-slate-600')}>{status}</span>
}

function InfoCard({ label, value, help }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <p className="text-sm text-slate-500 dark:text-slate-400">{label}</p>
      <p className="mt-2 text-3xl font-bold">{value}</p>
      <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">{help}</p>
    </div>
  )
}

function InfoLine({ label, value }) {
  return (
    <div>
      <p className="text-slate-500 dark:text-slate-400">{label}</p>
      <p className="mt-1 text-xl font-bold">{value ?? '-'}</p>
    </div>
  )
}

function SummaryRow({ label, value }) {
  return <div className="flex justify-between"><span>{label}</span><span>{value || '-'}</span></div>
}

function EmptyState({ text }) {
  return <div className="p-6 text-center text-sm text-slate-500 dark:text-slate-400">{text}</div>
}

function Avatar({ name }) {
  return <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-emerald-500 font-bold text-white ring-2 ring-white/15">{initials(name)}</div>
}

function LoadingScreen() {
  return (
    <div className="grid min-h-screen place-items-center bg-slate-100 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <Activity className="mx-auto mb-3 animate-pulse" size={28} />
        <p className="text-sm font-semibold">Loading secure session</p>
      </div>
    </div>
  )
}

function formatTime(value) {
  if (!value) return '-'
  return new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

function formatDate(value) {
  if (!value) return '-'
  return new Date(value).toLocaleDateString()
}

function titleCase(value) {
  if (!value) return '-'
  return String(value).replaceAll('_', ' ').replace(/\b\w/g, (char) => char.toUpperCase())
}

function firstName(value) {
  return String(value || '').split(' ')[0] || 'User'
}

function initials(value) {
  return String(value || 'U').split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase()
}

function userPermissions(user) {
  return new Set((user?.role?.permissions || []).map((permission) => permission.slug))
}

function canAccess(user, permissions = []) {
  if (!permissions.length) return true
  if (user?.role?.slug === 'super_admin') return true

  const allowed = userPermissions(user)
  return permissions.some((permission) => allowed.has(permission))
}

function normaliseChart(rows) {
  const grouped = {}
  rows.forEach((row) => {
    const date = formatDate(row.attendance_date)
    grouped[date] = grouped[date] || { date, present: 0, late: 0 }
    grouped[date][row.status] = Number(row.total)
  })
  return Object.values(grouped)
}

function apiError(exception) {
  const errors = exception.response?.data?.errors
  if (errors) return Object.values(errors).flat().join(' ')
  return exception.response?.data?.message || 'Request failed.'
}

export default App
