/* eslint-disable no-unused-vars */
import clsx from 'clsx'
import {
  Activity, Bell, BriefcaseBusiness, Building2, CalendarCheck, Camera, CheckCircle2, ChevronDown, Clock, Download, Eye, EyeOff, FileCheck2, FileText, Fingerprint, Folder, Home, KeyRound, List, LocateFixed, LogOut, Mail, MapPinned, Menu, Moon, Phone, ShieldCheck, ShoppingBag, Sun, UserPlus, Users, UserRound, X,
} from 'lucide-react'
import { canAccess } from '../../utils/format'

export default function MobileNav({ active, setActive, user, onAttendanceAction, todayAttendance }) {
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
  const isRequestsActive = active === 'Permission Requests'

  const leftItems = [
    { label: 'Home', target: 'Dashboard', icon: Home, isActive: active === 'Dashboard', permissions: ['dashboard_access', 'employee_dashboard_access'] },
    { label: 'Attendance', target: 'My Attendance', icon: CalendarCheck, isActive: isAttendanceActive, permissions: ['view_own_attendance', 'view_all_attendance', 'attendance_check_in', 'office_check_in'] },
  ].filter((item) => canAccess(user, item.permissions))

  const rightItems = [
    { label: 'Requests', target: 'Permission Requests', icon: FileCheck2, isActive: isRequestsActive, permissions: ['view_all_permission_requests', 'view_own_permission_requests', 'submit_permission_request'] },
    { label: 'Profile', target: 'Profile', icon: UserRound, isActive: active === 'Profile', permissions: ['update_own_profile', 'update_profile', 'employee_dashboard_access', 'dashboard_access'] },
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
