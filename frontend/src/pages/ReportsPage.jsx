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
import { apiError, canAccess, employeeFullName, formatDate, formatTime, initials, normaliseChart, titleCase } from '../utils/format'
import { ReportsPanel } from './DashboardPage'

export default function ReportsPage({ appData, setModal }) {
  const rows = appData.reports.map((report) => [
    formatDate(report.report_date),
    employeeFullName(report.employee),
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
