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
import { RouteCard } from './DashboardPage'

export default function OutdoorSalesPage({ appData, isLoaded, setModal }) {
  const rows = appData.visits.map((visit) => [
    employeeFullName(visit.employee),
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
