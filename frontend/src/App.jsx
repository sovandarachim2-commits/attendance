import { useCallback, useEffect, useState } from 'react'
import { useJsApiLoader } from '@react-google-maps/api'
import {
  Activity,
  Bell,
  BriefcaseBusiness,
  Building2,
  ChevronDown,
  Clock,
  FileCheck2,
  FileText,
  Home,
  LogOut,
  MapPinned,
  Menu,
  Moon,
  User,
  Search,
  Settings as SettingsIcon,
  ShoppingBag,
  Sun,
  Users,
  UserRound,
  X,
} from 'lucide-react'
import clsx from 'clsx'
import { api, attendanceService, authService, dashboardService } from './services/api'
import DashboardPage from './pages/DashboardPage'
import AttendancePage from './pages/AttendancePage'
import EmployeesPage from './pages/EmployeesPage'
import DepartmentsPage from './pages/DepartmentsPage'
import PositionsPage from './pages/PositionsPage'
import UsersRolesPage from './pages/UsersRolesPage'
import OutdoorSalesPage from './pages/OutdoorSalesPage'
import ReportsPage from './pages/ReportsPage'
import NotificationsPage from './pages/NotificationsPage'
import ProfilePage from './pages/ProfilePage'
import SecurityPage from './pages/SecurityPage'
import PermissionRequestsPage from './pages/PermissionRequestsPage'
import AttendanceHistoryPage from './pages/AttendanceHistoryPage'
import LoginPage from './pages/LoginPage'
import MobileNav from './components/layout/MobileNav'
import AttendanceActionModal from './components/attendance/AttendanceActionModal'
import EmployeeModal from './components/employees/EmployeeModal'
import VisitModal from './components/visits/VisitModal'
import ReportModal from './components/reports/ReportModal'
import { LoadingScreen, SummaryRow } from './components/shared/UI'
import { canAccess, formatTime, userDisplayName } from './utils/format'

const sidebarMainItems = [
  { label: 'Dashboard', target: 'Dashboard', icon: Home, permissions: ['dashboard_access', 'employee_dashboard_access'] },
  { label: 'My Attendance', target: 'My Attendance', icon: Clock, permissions: ['view_own_attendance', 'view_all_attendance'] },
  { label: 'Customer Visits', target: 'Customer Visits', icon: ShoppingBag, permissions: ['create_customer_visit', 'view_customer_visits', 'manage_customer_visits'] },
  { label: 'Daily Reports', target: 'Daily Reports', icon: FileText, permissions: ['submit_daily_report', 'view_own_reports', 'view_reports', 'view_sales_reports'] },
  { label: 'Permission Requests', target: 'Permission Requests', icon: FileCheck2, permissions: ['view_all_permission_requests', 'view_own_permission_requests', 'submit_permission_request'] },
  { label: 'Route Map', target: 'Route Map', icon: MapPinned, permissions: ['gps_tracking_access', 'route_tracking_access', 'view_gps_tracking', 'monitor_route_history'] },
  { label: 'Profile', target: 'Profile', icon: UserRound, permissions: ['update_own_profile', 'update_profile', 'employee_dashboard_access', 'dashboard_access'] },
  { label: 'Notifications', target: 'Notifications', icon: Bell, permissions: ['receive_notifications', 'manage_notifications'] },
]

const sidebarManageItems = [
  { label: 'Attendance History', target: 'Attendance History', icon: Clock, permissions: ['view_all_attendance'] },
  { label: 'Employees', target: 'Employees', icon: Users, permissions: ['manage_employees', 'create_employee', 'edit_employee', 'view_employee_profiles'] },
  { label: 'Departments', target: 'Departments', icon: Building2, permissions: ['manage_departments'] },
  { label: 'Positions', target: 'Positions', icon: BriefcaseBusiness, permissions: ['manage_positions'] },
  { label: 'Outdoor Sales', target: 'Outdoor Sales', icon: MapPinned, permissions: ['manage_customer_visits', 'view_sales_team', 'view_customer_visits'] },
  { label: 'Reports', target: 'Reports', icon: FileText, permissions: ['view_reports', 'export_reports', 'view_attendance_reports', 'view_sales_reports'] },
  { label: 'Roles & Permissions', target: 'Roles & Permissions', icon: Users, permissions: ['manage_roles', 'manage_permissions'] },
  { label: 'Settings', target: 'Settings', icon: SettingsIcon, permissions: ['manage_security_settings', 'manage_api_keys', 'system_settings_access', 'manage_roles'] },
]

function GoogleMapsApp({ apiKey }) {
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: apiKey,
  })

  return <AppShell isLoaded={isLoaded} />
}

function AppShell({ isLoaded }) {
  const [active, setActive] = useState('Dashboard')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [dark, setDark] = useState(() => localStorage.getItem('attendance_theme') === 'dark')
  const [user, setUser] = useState(null)
  const [authLoading, setAuthLoading] = useState(Boolean(localStorage.getItem('attendance_token')))
  const [attendanceAction, setAttendanceAction] = useState(null)
  const [modal, setModal] = useState(null)
  const [editingEmployee, setEditingEmployee] = useState(null)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [data, setData] = useState({
    dashboard: null,
    todayAttendance: null,
    attendance: [],
    employees: [],
    visits: [],
    reports: [],
    notifications: [],
    appSettings: {},
    loading: false,
  })

  const loadRealData = useCallback(async () => {
    setData((current) => ({ ...current, loading: true }))

    const [dashboard, todayAttendance, attendance, employees, visits, reports, notifications, appSettings] = await Promise.all([
      dashboardService.overview().catch(() => null),
      attendanceService.today().catch(() => null),
      api.get('/attendance').then((response) => response.data.data || []).catch(() => []),
      api.get('/employees').then((response) => response.data.data || []).catch(() => []),
      api.get('/customer-visits').then((response) => response.data.data || []).catch(() => []),
      api.get('/reports').then((response) => response.data.data || []).catch(() => []),
      api.get('/notifications').then((response) => response.data.data || []).catch(() => []),
      api.get('/settings').then((response) => response.data || {}).catch(() => ({})),
    ])

    setData({ dashboard, todayAttendance, attendance, employees, visits, reports, notifications, appSettings, loading: false })
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

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
    document.body.classList.toggle('dark', dark)
    localStorage.setItem('attendance_theme', dark ? 'dark' : 'light')
  }, [dark])

  useEffect(() => {
    if (!userMenuOpen) return

    const close = () => setUserMenuOpen(false)
    window.addEventListener('click', close)
    return () => window.removeEventListener('click', close)
  }, [userMenuOpen])

  const handleLogin = (account) => {
    setUser(account)
    loadRealData()
  }

  const refreshUser = useCallback(async () => {
    const account = await authService.me()
    setUser(account)
  }, [])

  const handleLogout = async () => {
    await authService.logout()
    setUser(null)
    setActive('Dashboard')
  }

  const toggleTheme = () => {
    setDark((value) => !value)
  }

  const openAttendanceAction = (type) => {
    setAttendanceAction(type)
  }

  const props = { appData: data, isLoaded, refresh: loadRealData, user, onAttendanceAction: openAttendanceAction, setActive, setModal, setEditingEmployee, onLogout: handleLogout, onProfileUpdated: refreshUser }
  const pages = {
    Dashboard: <DashboardPage {...props} />,
    'Check In / Out': <AttendancePage {...props} />,
    'My Attendance': <AttendancePage {...props} />,
    'Customer Visits': <OutdoorSalesPage {...props} />,
    'Daily Reports': <ReportsPage {...props} />,
    'My Reports': <ReportsPage {...props} />,
    'Permission Requests': <PermissionRequestsPage {...props} />,
    'Route Map': <OutdoorSalesPage {...props} />,
    Notifications: <NotificationsPage {...props} />,
    Profile: <ProfilePage {...props} />,
    Settings: <SecurityPage refresh={loadRealData} />,
    'Help & Support': <SecurityPage refresh={loadRealData} />,
    'Attendance History': <AttendanceHistoryPage {...props} />,
    Employees: <EmployeesPage {...props} />,
    Departments: <DepartmentsPage />,
    Positions: <PositionsPage />,
    'Users & Roles': <UsersRolesPage />,
    'Roles & Permissions': <UsersRolesPage />,
    'Outdoor Sales': <OutdoorSalesPage {...props} />,
    Reports: <ReportsPage {...props} />,
    Security: <SecurityPage refresh={loadRealData} />,
  }

  if (authLoading) return <LoadingScreen />
  if (!user) return <LoginPage dark={dark} onToggleDark={toggleTheme} onLogin={handleLogin} />

  const employee = user.employee
  const displayName = userDisplayName(user)
  const username = user.name || displayName
  const roleName = employee?.position?.name || user.role?.name || 'Employee'
  const pageTitle = active === 'Outdoor Sales' ? 'Outdoor Sales Tracking' : active
  const unreadCount = data.notifications.filter((item) => !item.read_at).length
  const mainSidebarItems = sidebarMainItems.filter((item) => canAccess(user, item.permissions))
  const manageSidebarItems = sidebarManageItems.filter((item) => canAccess(user, item.permissions))
  const canSeeNotifications = canAccess(user, ['receive_notifications', 'manage_notifications'])
  const today = data.todayAttendance
  const companyName = data.appSettings?.company_name || 'SalesTrack'
  const companyLogoUrl = data.appSettings?.company_logo_url || ''

  return (
    <div className={clsx(dark && 'dark')}>
      <div className="min-h-screen bg-[#f7f9fc] text-slate-900 transition-colors dark:bg-slate-950 dark:text-slate-100">
        <aside className={clsx(
          'fixed inset-y-0 left-0 z-40 flex w-72 flex-col overflow-y-auto bg-[#071927] text-white shadow-xl transition-transform lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full',
        )}>
          <div className="flex items-center justify-between border-b border-white/10 p-5">
            <div className="flex items-center gap-3">
              {companyLogoUrl ? (
                <img src={companyLogoUrl} alt={companyName} className="h-12 w-12 rounded-lg object-cover shadow-lg" />
              ) : (
                <div className="grid h-12 w-12 place-items-center rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-600 text-white shadow-lg shadow-emerald-950/25">
                  <Activity size={22} />
                </div>
              )}
              <div>
                <h1 className="text-xl font-bold tracking-tight">{companyName}</h1>
                <p className="text-xs text-slate-300">Employee Panel</p>
              </div>
            </div>
            <button className="rounded-lg p-2 text-slate-300 lg:hidden" onClick={() => setSidebarOpen(false)}>
              <X size={20} />
            </button>
          </div>

          <div className="px-5 pb-5 pt-6">
            <div className="flex items-center gap-4">
              <UserAvatar name={displayName} photo={employee?.photo_url} size="lg" />
              <div>
                <p className="font-bold">{displayName}</p>
                <p className="mt-1 text-sm text-slate-300">{roleName}</p>
                <p className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-emerald-300"><span className="h-2 w-2 rounded-full bg-emerald-400" /> Online</p>
              </div>
            </div>
          </div>

          <nav className="flex-1 space-y-2 px-4 pb-5">
            {mainSidebarItems.map((item) => (
              <SidebarButton
                key={item.target}
                item={item}
                active={active}
                unreadCount={unreadCount}
                onClick={() => {
                  setActive(item.target)
                  setSidebarOpen(false)
                }}
              />
            ))}

            {manageSidebarItems.length > 0 && <div className="my-4 border-t border-white/10" />}

            {manageSidebarItems.map((item) => (
              <SidebarButton
                key={item.target}
                item={item}
                active={active}
                withChevron
                onClick={() => {
                  setActive(item.target)
                  setSidebarOpen(false)
                }}
              />
            ))}
          </nav>

          <div className="px-4 pb-5">
            <div className="rounded-lg bg-white/8 p-4 text-sm shadow-inner shadow-white/5">
              <p className="font-bold">Today's Summary</p>
              <div className="mt-4 space-y-3 text-xs text-slate-300">
                <SummaryRow label="Check In" value={formatTime(today?.check_in_at)} />
                <SummaryRow label="Check Out" value={formatTime(today?.check_out_at)} />
                <SummaryRow label="Total Visits" value={String(data.visits.length)} />
                <SummaryRow label="Working Minutes" value={today?.work_minutes ? `${today.work_minutes} min` : '-'} />
              </div>
            </div>
          </div>
        </aside>

        {sidebarOpen && <div className="fixed inset-0 z-30 bg-slate-950/40 lg:hidden" onClick={() => setSidebarOpen(false)} />}

        <main className="lg:pl-72">
          <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 px-4 py-4 shadow-sm shadow-slate-200/30 backdrop-blur dark:border-slate-800 dark:bg-slate-950/90 sm:px-6">
            <div className="flex items-center justify-between gap-4">
              <div className="flex min-w-0 items-center gap-4">
                <button className="rounded-lg p-2 text-slate-800 hover:bg-slate-100 dark:text-slate-100 dark:hover:bg-slate-900 lg:hidden" onClick={() => setSidebarOpen(true)}>
                  <Menu size={22} />
                </button>
                <button className="hidden rounded-lg p-2 text-slate-800 hover:bg-slate-100 dark:text-slate-100 dark:hover:bg-slate-900 lg:block">
                  <Menu size={22} />
                </button>
                <div className="min-w-0">
                  <h2 className="truncate text-xl font-bold text-slate-950 dark:text-white">{pageTitle}</h2>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    Dashboard <span className="mx-2 text-slate-300">›</span> {pageTitle}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <label className="relative hidden md:block">
                  <span className="sr-only">Search employees</span>
                  <input
                    className="h-12 w-[360px] rounded-lg border border-slate-200 bg-white px-5 pr-12 text-sm outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 dark:border-slate-700 dark:bg-slate-900"
                    placeholder="Search employees..."
                  />
                  <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-900 dark:text-slate-300" size={20} />
                </label>
                {canSeeNotifications && (
                  <button className="relative grid h-12 w-12 place-items-center rounded-full border border-slate-200 bg-white text-slate-800 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200" onClick={() => setActive('Notifications')}>
                    <Bell size={20} />
                    {unreadCount > 0 && <span className="absolute -right-0.5 -top-0.5 grid h-5 min-w-5 place-items-center rounded-full bg-red-500 px-1 text-[11px] font-bold text-white">{unreadCount}</span>}
                  </button>
                )}
                <button
                  className="grid h-12 w-12 place-items-center rounded-full border border-slate-200 bg-white text-slate-800 shadow-sm transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                  onClick={toggleTheme}
                  type="button"
                  title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
                  aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
                >
                  {dark ? <Sun size={20} /> : <Moon size={20} />}
                </button>
                <div className="relative hidden sm:block">
                  <button
                    className="flex items-center gap-3 rounded-lg px-2 py-1.5 transition hover:bg-slate-50 dark:hover:bg-slate-900"
                    onClick={(event) => {
                      event.stopPropagation()
                      setUserMenuOpen((value) => !value)
                    }}
                    type="button"
                    aria-expanded={userMenuOpen}
                    aria-haspopup="menu"
                  >
                    <UserAvatar name={displayName} photo={employee?.photo_url} />
                    <div className="text-left">
                      <p className="text-sm font-bold text-slate-950 dark:text-white">{displayName}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{roleName}</p>
                    </div>
                    <ChevronDown size={18} className={clsx('text-slate-500 transition-transform', userMenuOpen && 'rotate-180')} />
                  </button>

                  {userMenuOpen && (
                    <div
                      className="absolute right-0 top-[calc(100%+0.75rem)] z-50 w-72 overflow-hidden rounded-lg border border-slate-200 bg-white py-2 shadow-2xl shadow-slate-950/15 dark:border-slate-800 dark:bg-slate-900"
                      onClick={(event) => event.stopPropagation()}
                      role="menu"
                    >
                      <div className="px-5 py-4">
                        <p className="text-lg font-semibold text-slate-600 dark:text-slate-200">{displayName}</p>
                        <p className="mt-3 text-lg text-slate-600 dark:text-slate-300">{username}</p>
                        <p className="mt-3 text-sm font-semibold text-slate-400 dark:text-slate-500">{roleName}</p>
                      </div>
                      <div className="border-t border-slate-200 py-2 dark:border-slate-800">
                        <button
                          className="flex w-full items-center gap-4 px-5 py-3 text-left text-lg text-slate-800 transition hover:bg-slate-50 dark:text-slate-100 dark:hover:bg-slate-800"
                          onClick={() => {
                            setActive('Profile')
                            setUserMenuOpen(false)
                          }}
                          type="button"
                          role="menuitem"
                        >
                          <User size={22} />
                          Profile
                        </button>
                        <button
                          className="flex w-full items-center gap-4 px-5 py-3 text-left text-lg text-slate-800 transition hover:bg-slate-50 dark:text-slate-100 dark:hover:bg-slate-800"
                          onClick={handleLogout}
                          type="button"
                          role="menuitem"
                        >
                          <LogOut size={22} />
                          Logout
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </header>

          <section className="space-y-6 p-4 pb-24 sm:p-8 lg:pb-8">
            {data.loading && <p className="rounded-lg border border-slate-200 bg-white p-3 text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-900">Refreshing live data...</p>}
            {pages[active]}
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
          onSaved={(options = {}) => {
            if (!options.keepOpen) {
              setModal(null)
              setEditingEmployee(null)
            }
            loadRealData()
          }}
        />
      )}
      {modal === 'visit' && <VisitModal onClose={() => setModal(null)} onSaved={() => { setModal(null); loadRealData() }} />}
      {modal === 'report' && <ReportModal onClose={() => setModal(null)} onSaved={() => { setModal(null); loadRealData() }} />}
      {attendanceAction && (
        <AttendanceActionModal
          action={attendanceAction}
          user={user}
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

function App() {
  const googleMapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY?.trim()

  if (!googleMapsApiKey) {
    return <AppShell isLoaded={false} />
  }

  return <GoogleMapsApp apiKey={googleMapsApiKey} />
}

function SidebarButton({ item, active, unreadCount = 0, withChevron = false, onClick }) {
  const isActive = active === item.target || (item.target === 'My Attendance' && active === 'Check In / Out')

  return (
    <button
      onClick={onClick}
      className={clsx(
        'flex w-full items-center justify-between rounded-lg px-3 py-3 text-left text-sm font-semibold transition',
        isActive ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-950/25' : 'text-slate-200 hover:bg-white/10 hover:text-white',
      )}
    >
      <span className="flex items-center gap-3">
        <item.icon size={18} />
        {item.label}
      </span>
      {item.label === 'Notifications' && unreadCount > 0 ? (
        <span className="grid h-5 min-w-5 place-items-center rounded-full bg-emerald-500 px-1 text-[11px] font-bold text-white">{unreadCount}</span>
      ) : withChevron ? (
        <ChevronDown size={15} className="text-slate-400" />
      ) : null}
    </button>
  )
}

function UserAvatar({ name, photo, size = 'md' }) {
  const initialsText = String(name || 'U').split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase()
  const sizeClass = size === 'lg' ? 'h-14 w-14 text-base' : 'h-11 w-11 text-sm'

  return (
    <div className={clsx('relative grid shrink-0 place-items-center overflow-hidden rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 font-bold text-white ring-2 ring-white/10', sizeClass)}>
      {photo ? <img className="h-full w-full object-cover" src={photo} alt={name} /> : initialsText}
      <span className="absolute bottom-1 right-1 h-2.5 w-2.5 rounded-full border border-white bg-emerald-400" />
    </div>
  )
}

export default App
