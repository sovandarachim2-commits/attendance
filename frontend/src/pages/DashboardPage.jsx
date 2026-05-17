/* eslint-disable no-unused-vars */
import { useCallback, useEffect, useState } from 'react'
import { GoogleMap, MarkerF, PolylineF } from '@react-google-maps/api'
import { motion } from 'framer-motion'
import {
  Activity, Bell, BriefcaseBusiness, Building2, CalendarCheck, Camera, CheckCircle2, ChevronDown, Clock, Download, Eye, EyeOff, FileText, Fingerprint, Folder, Home, KeyRound, List, LocateFixed, LogOut, Mail, MapPinned, Menu, Moon, Phone, ShieldCheck, ShoppingBag, Sun, UserPlus, Users, UserRound, X,
} from 'lucide-react'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import clsx from 'clsx'
import { api } from '../services/api'
import { DataPanel, EmptyState, ErrorText, FormInput, FormSelect, FormTextarea, InfoCard, InfoLine, PanelHeader, SimpleModal, StatusPill, SubmitButton, Toggle } from '../components/shared/UI'
import { apiError, canAccess, formatDate, formatTime, initials, normaliseChart, titleCase } from '../utils/format'

const emptyCards = {
  total_employees: 0,
  present: 0,
  late: 0,
  outdoor_visits: 0,
}

export default function DashboardPage({ appData, isLoaded, onAttendanceAction }) {
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


export function RouteCard({ isLoaded, locations }) {
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
  return <DataPanel title="Recent Visits" subtitle="Latest customer visits by the sales team." columns={['Customer', 'Area', 'Time', 'Status']} rows={rows} actionLabel="View All" />
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


export function ReportsPanel({ chartData, notifications }) {
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
