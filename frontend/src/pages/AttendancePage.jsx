/* eslint-disable no-unused-vars */
import { useCallback, useEffect, useRef, useState } from 'react'
import { GoogleMap, MarkerF, PolylineF } from '@react-google-maps/api'
import { motion } from 'framer-motion'
import {
  Activity, AlertTriangle, Bell, BriefcaseBusiness, Building2, CalendarCheck, Camera, CheckCircle2, ChevronDown, Clock, Download, Eye, EyeOff, FileText, Fingerprint, Folder, Hand, Home, KeyRound, List, LocateFixed, LogOut, Mail, MapPinned, Menu, Moon, Phone, ShieldCheck, ShoppingBag, Sun, UserPlus, Users, UserRound, X,
} from 'lucide-react'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import clsx from 'clsx'
import { api } from '../services/api'
import { DataPanel, EmptyState, ErrorText, FormInput, FormSelect, FormTextarea, InfoCard, InfoLine, PanelHeader, SimpleModal, StatusPill, SubmitButton, Toggle } from '../components/shared/UI'
import { apiError, attendanceLocationMapUrl, canAccess, employeeFullName, formatAttendanceLocation, formatDate, formatTime, initials, normaliseChart, titleCase } from '../utils/format'

export default function AttendancePage({ appData, onAttendanceAction, setModal, user }) {
  const locationAlertShownRef = useRef(false)
  const [now, setNow] = useState(new Date())
  const [gpsReady, setGpsReady] = useState(false)
  const [gpsError, setGpsError] = useState('')
  const [actionNotice, setActionNotice] = useState('')

  const showNotice = (msg) => {
    setActionNotice(msg)
    window.setTimeout(() => setActionNotice(''), 4000)
  }

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    if (!navigator.geolocation) {
      const message = 'This browser does not support current location. Please use Chrome or Edge.'
      setGpsError(message)
      window.alert(message)
      return
    }

    navigator.geolocation.getCurrentPosition(
      () => {
        setGpsReady(true)
        setGpsError('')
      },
      (err) => {
        let message = 'Turn on device Location Services and allow location for this site before check in/out.'
        if (err.code === 1) {
          message = 'Location is blocked. Click the lock icon beside the address, set Location to Allow, then refresh.'
        } else if (err.code === 3) {
          message = 'Location timed out. Turn on device location, move near a window, then try again.'
        }
        setGpsReady(false)
        setGpsError(message)
        if (!locationAlertShownRef.current) {
          locationAlertShownRef.current = true
          window.alert(message)
        }
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 },
    )
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
    if (!checkedIn) {
      if (canCheckIn) onAttendanceAction('check-in')
      else showNotice("You don't have permission to check in. Contact your administrator.")
    } else {
      if (canCheckOut) onAttendanceAction('check-out')
      else showNotice("You don't have permission to check out. Contact your administrator.")
    }
  }

  const handleCheckOutBtn = () => {
    if (!checkedIn) { showNotice("You haven't checked in yet today."); return }
    if (completed) return
    if (!canCheckOut) { showNotice("You don't have permission to check out. Contact your administrator."); return }
    onAttendanceAction('check-out')
  }

  const handleCheckInBtn = () => {
    if (checkedIn) { showNotice('You have already checked in today.'); return }
    if (!canCheckIn) { showNotice("You don't have permission to check in. Contact your administrator."); return }
    onAttendanceAction('check-in')
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
            <Hand size={46} stroke="white" strokeWidth={1.6} />
            <span className="mt-2 text-[15px] font-bold text-white">
              {completed ? 'Done' : checkedIn ? 'Check Out' : 'Check In'}
            </span>
          </button>
        </div>

        {/* GPS status */}
        <div className="flex items-center gap-1.5 text-sm text-slate-400">
          <MapPinned size={14} className={gpsReady ? 'text-emerald-500' : 'text-slate-300'} />
          <span>{gpsReady ? 'Current Location Ready' : 'Detecting location...'}</span>
        </div>
      </div>

      {gpsError && (
        <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/25 dark:text-amber-200">
          <AlertTriangle size={18} className="mt-0.5 shrink-0" />
          <span>{gpsError}</span>
        </div>
      )}

      {actionNotice && (
        <div className="flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3.5 text-sm text-rose-800 shadow-sm dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-300">
          <AlertTriangle size={18} className="mt-0.5 shrink-0 text-rose-500" />
          <span className="font-medium">{actionNotice}</span>
        </div>
      )}

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

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <InfoCard label="Today's Status" value={today ? titleCase(today.status) : 'No Check In'} help="From attendance table" />
        <InfoCard label="Late Minutes" value={today?.late_minutes || 0} help="Calculated by backend" />
        <InfoCard label="Work Minutes" value={today?.work_minutes || 0} help="Check-in to check-out" />
      </div>
      <AttendanceTable rows={appData.attendance.filter((item) => item.employee_id === user?.employee_id)} />
    </>
  )
}


function AttendanceTable({ rows }) {
  const columns = ['Code', 'Employee', 'Department', 'Status', 'Check In', 'Check Out', 'Check In Location', 'Check Out Location']

  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <PanelHeader title="Attendance History" subtitle="Real attendance records." actionLabel="Filter" />
      {rows.length === 0 ? <EmptyState text="No real records found yet." /> : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500 dark:bg-slate-950 dark:text-slate-400">
              <tr>{columns.map((column) => <th key={column} className="px-5 py-3">{column}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {rows.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/60">
                  <td className="px-5 py-4">{item.employee?.employee_code || '-'}</td>
                  <td className="px-5 py-4">{employeeFullName(item.employee)}</td>
                  <td className="px-5 py-4">{item.employee?.department?.name || '-'}</td>
                  <td className="px-5 py-4"><StatusPill status={titleCase(item.status)} /></td>
                  <td className="px-5 py-4">{formatTime(item.check_in_at)}</td>
                  <td className="px-5 py-4">{formatTime(item.check_out_at)}</td>
                  <td className="max-w-[240px] px-5 py-4 text-slate-600 dark:text-slate-300">
                    <LocationLink attendance={item} type="check_in" />
                  </td>
                  <td className="max-w-[240px] px-5 py-4 text-slate-600 dark:text-slate-300">
                    <LocationLink attendance={item} type="check_out" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
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
