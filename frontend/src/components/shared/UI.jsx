/* eslint-disable no-unused-vars */
import clsx from 'clsx'
import {
  Activity, Bell, BriefcaseBusiness, Building2, CalendarCheck, Camera, CheckCircle2, ChevronDown, Clock, Download, Eye, EyeOff, FileText, Fingerprint, Folder, Home, KeyRound, List, LocateFixed, LogOut, Mail, MapPinned, Menu, Moon, Phone, ShieldCheck, ShoppingBag, Sun, UserPlus, Users, UserRound, X,
} from 'lucide-react'
import { initials } from '../../utils/format'

export function SimpleModal({ title, subtitle, onClose, children }) {
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


export function FormInput({ label, value, onChange, type = 'text', required = false }) {
  return (
    <>
      <label className="text-sm font-semibold">{label}</label>
      <input className="rounded-lg border border-slate-200 px-3 py-2 dark:border-slate-700 dark:bg-slate-950" type={type} value={value} onChange={(event) => onChange(event.target.value)} required={required} />
    </>
  )
}


export function FormSelect({ label, value, onChange, required = false, children }) {
  return (
    <>
      <label className="text-sm font-semibold">{label}</label>
      <select className="rounded-lg border border-slate-200 px-3 py-2 dark:border-slate-700 dark:bg-slate-950" value={value} onChange={(event) => onChange(event.target.value)} required={required}>
        {children}
      </select>
    </>
  )
}


export function FormTextarea({ label, value, onChange, required = false }) {
  return (
    <>
      <label className="text-sm font-semibold">{label}</label>
      <textarea className="min-h-24 rounded-lg border border-slate-200 px-3 py-2 dark:border-slate-700 dark:bg-slate-950" value={value} onChange={(event) => onChange(event.target.value)} required={required} />
    </>
  )
}


export function SubmitButton({ saving, label }) {
  return <button className="rounded-lg bg-emerald-600 px-4 py-3 font-semibold text-white disabled:opacity-60" disabled={saving} type="submit">{saving ? 'Saving...' : label}</button>
}


export function ErrorText({ text }) {
  return <p className="rounded-lg bg-rose-50 p-3 text-sm font-medium text-rose-700">{text}</p>
}


export function Toggle({ checked, onChange }) {
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


export function StatusPill({ status }) {
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


export function InfoCard({ label, value, help }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <p className="text-sm text-slate-500 dark:text-slate-400">{label}</p>
      <p className="mt-2 text-3xl font-bold">{value}</p>
      <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">{help}</p>
    </div>
  )
}


export function InfoLine({ label, value }) {
  return (
    <div>
      <p className="text-slate-500 dark:text-slate-400">{label}</p>
      <p className="mt-1 text-xl font-bold">{value ?? '-'}</p>
    </div>
  )
}


export function SummaryRow({ label, value }) {
  return <div className="flex justify-between"><span>{label}</span><span>{value || '-'}</span></div>
}


export function EmptyState({ text }) {
  return <div className="p-6 text-center text-sm text-slate-500 dark:text-slate-400">{text}</div>
}


export function Avatar({ name }) {
  return <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-emerald-500 font-bold text-white ring-2 ring-white/15">{initials(name)}</div>
}


export function LoadingScreen() {
  return (
    <div className="grid min-h-screen place-items-center bg-slate-100 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <Activity className="mx-auto mb-3 animate-pulse" size={28} />
        <p className="text-sm font-semibold">Loading secure session</p>
      </div>
    </div>
  )
}


export function PanelHeader({ title, subtitle, actionLabel = 'Add New', onAction }) {
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


export function DataPanel({ title, subtitle, columns, rows, actionLabel = 'Add New', onAction }) {
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
