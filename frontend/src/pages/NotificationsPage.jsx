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

export default function NotificationsPage({ appData, refresh }) {
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

