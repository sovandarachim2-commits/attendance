import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  CalendarDays,
  Check,
  ChevronRight,
  Clock,
  Eye,
  FileText,
  Filter,
  Heart,
  ListChecks,
  MapPin,
  Pencil,
  Plus,
  Trash2,
  X,
  XCircle,
} from 'lucide-react'
import clsx from 'clsx'
import { permissionRequestService } from '../services/api'
import { apiError, canAccess, employeeFullName, titleCase, userDisplayName } from '../utils/format'

const requestTypes = [
  'Leave Request',
  'Sick Leave',
  'Late Arrival',
  'Attendance Edit',
  'Outdoor Work',
  'Early Leave',
  'Overtime Request',
  'GPS Override Request',
]

const typeConfig = {
  'Leave Request':        { icon: CalendarDays, bg: 'bg-violet-100 dark:bg-violet-950/40', text: 'text-violet-600 dark:text-violet-400' },
  'Sick Leave':           { icon: Heart,        bg: 'bg-rose-100 dark:bg-rose-950/40',     text: 'text-rose-600 dark:text-rose-400' },
  'Late Arrival':         { icon: Clock,        bg: 'bg-orange-100 dark:bg-orange-950/40', text: 'text-orange-600 dark:text-orange-400' },
  'Attendance Edit':      { icon: Pencil,       bg: 'bg-orange-100 dark:bg-orange-950/40', text: 'text-orange-600 dark:text-orange-400' },
  'Outdoor Work':         { icon: MapPin,       bg: 'bg-violet-100 dark:bg-violet-950/40', text: 'text-violet-600 dark:text-violet-400' },
  'Early Leave':          { icon: FileText,     bg: 'bg-blue-100 dark:bg-blue-950/40',     text: 'text-blue-600 dark:text-blue-400' },
  'Overtime Request':     { icon: Clock,        bg: 'bg-emerald-100 dark:bg-emerald-950/40', text: 'text-emerald-600 dark:text-emerald-400' },
  'GPS Override Request': { icon: MapPin,       bg: 'bg-blue-100 dark:bg-blue-950/40',     text: 'text-blue-600 dark:text-blue-400' },
}

function fmtDate(iso) {
  if (!iso || iso === '-') return '-'
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

function fmtSubmittedAt(iso) {
  if (!iso) return { date: '-', time: '-' }
  const dt = new Date(iso)
  return {
    date: dt.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
    time: dt.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
  }
}

function mapApiRequest(row) {
  const submitted = fmtSubmittedAt(row.created_at)
  const employeeName = employeeFullName(row.employee)

  return {
    dbId: row.id,
    id: row.request_code,
    employeeId: row.employee_id,
    employeeName,
    type: row.type,
    date: row.request_date,
    time: row.request_time || '-',
    reason: row.reason,
    status: titleCase(row.status),
    submittedAt: submitted.date,
    submittedTime: submitted.time,
    approvedBy: row.reviewer?.name || (row.status === 'pending' ? '-' : 'Admin'),
    notes: row.admin_notes || '-',
    gps: row.gps_location || '-',
    emergency: Boolean(row.is_emergency),
  }
}

export default function PermissionRequestsPage({ user }) {
  const employeeName = userDisplayName(user, 'User')
  const employeeId = user?.employee?.id ?? null

  const canViewAll = canAccess(user, ['view_all_permission_requests'])
  const canApprove = canAccess(user, ['approve_permission_requests'])
  const canSubmit = canAccess(user, ['submit_permission_request', 'view_own_permission_requests'])

  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [selected, setSelected] = useState(null)
  const [notice, setNotice] = useState('')
  const [form, setForm] = useState({ type: 'Leave Request', date: new Date().toISOString().slice(0, 10), time: '08:30', reason: '', attachment: '', gps: '', emergency: false })

  const loadRequests = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const rows = await permissionRequestService.list()
      setRequests(rows.map(mapApiRequest))
    } catch (err) {
      setError(apiError(err))
      setRequests([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadRequests()
  }, [loadRequests])

  const visibleRequests = requests

  const stats = useMemo(() => ({
    Pending:  visibleRequests.filter((r) => r.status === 'Pending').length,
    Approved: visibleRequests.filter((r) => r.status === 'Approved').length,
    Rejected: visibleRequests.filter((r) => r.status === 'Rejected').length,
    Total:    visibleRequests.length,
  }), [visibleRequests])

  const notify = (msg) => { setNotice(msg); window.setTimeout(() => setNotice(''), 2800) }

  const resetForm = () => setForm({ type: 'Leave Request', date: new Date().toISOString().slice(0, 10), time: '08:30', reason: '', attachment: '', gps: '', emergency: false })

  const submitRequest = async (event) => {
    event.preventDefault()
    const payload = {
      type: form.type,
      request_date: form.date,
      request_time: form.time || null,
      reason: form.reason || 'No reason provided.',
      is_emergency: form.emergency,
      gps_location: form.gps || null,
    }

    try {
      if (editingId) {
        await permissionRequestService.update(editingId, payload)
        notify('Request updated successfully.')
      } else {
        await permissionRequestService.create(payload)
        notify(`New ${form.type} submitted successfully.`)
      }
      setShowForm(false)
      setEditingId(null)
      resetForm()
      await loadRequests()
    } catch (err) {
      notify(apiError(err))
    }
  }

  const deleteRequest = async (request) => {
    try {
      await permissionRequestService.remove(request.dbId)
      if (selected?.dbId === request.dbId) setSelected(null)
      notify('Request cancelled.')
      await loadRequests()
    } catch (err) {
      notify(apiError(err))
    }
  }

  const updateStatus = async (request, status) => {
    try {
      const updated = await permissionRequestService.updateStatus(request.dbId, {
        status: status.toLowerCase(),
      })
      const mapped = mapApiRequest(updated)
      setSelected(mapped)
      notify(`Request ${request.id} marked ${status}.`)
      await loadRequests()
    } catch (err) {
      notify(apiError(err))
    }
  }

  const openEdit = (req) => {
    setForm({
      type: req.type,
      date: req.date?.slice?.(0, 10) || req.date,
      time: req.time === '-' ? '' : req.time?.slice?.(0, 5) || req.time,
      reason: req.reason,
      attachment: '',
      gps: req.gps === '-' ? '' : req.gps,
      emergency: req.emergency,
    })
    setEditingId(req.dbId)
    setShowForm(true)
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-950 dark:text-white">Permission Requests</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {canViewAll ? 'Review all employee requests' : 'Submit and track your own permission requests'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {canViewAll && (
            <button className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200" type="button">
              <Filter size={15} />
              Filter
            </button>
          )}
          {canSubmit && (
            <button className="inline-flex h-10 items-center gap-2 rounded-lg bg-emerald-600 px-4 text-sm font-semibold text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-700" onClick={() => { setEditingId(null); resetForm(); setShowForm(true) }} type="button">
              <Plus size={16} />
              New Permission Request
            </button>
          )}
        </div>
      </div>

      {notice && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-200">
          {notice}
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-800 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-200">
          {error}
        </div>
      )}

      {loading && (
        <p className="text-sm text-slate-500 dark:text-slate-400">Loading permission requests…</p>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Pending"  value={stats.Pending}  icon={Clock}      iconBg="bg-amber-100 dark:bg-amber-950/40"   iconText="text-amber-500"   badge="bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300" />
        <StatCard label="Approved" value={stats.Approved} icon={Check}      iconBg="bg-emerald-100 dark:bg-emerald-950/40" iconText="text-emerald-600" badge="bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300" />
        <StatCard label="Rejected" value={stats.Rejected} icon={XCircle}    iconBg="bg-rose-100 dark:bg-rose-950/40"     iconText="text-rose-600"    badge="bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300" />
        <StatCard label="Total"    value={stats.Total}    icon={ListChecks} iconBg="bg-blue-100 dark:bg-blue-950/40"     iconText="text-blue-600"    badge="bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300" />
      </div>

      {/* Table card */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="border-b border-slate-100 px-5 py-4 dark:border-slate-800">
          <h3 className="font-bold text-slate-950 dark:text-white">{canViewAll ? 'All Permission Requests' : 'My Permission Requests'}</h3>
        </div>

        {/* Desktop table */}
        <div className="hidden overflow-x-auto lg:block">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-400 dark:bg-slate-950 dark:text-slate-500">
              <tr>
                {(canViewAll
                  ? ['Request ID', 'Employee', 'Type', 'Date', 'Time', 'Reason', 'Status', 'Submitted At', 'Actions']
                  : ['Request ID', 'Type', 'Date', 'Time', 'Reason', 'Status', 'Submitted At', 'Actions']
                ).map((h) => (
                  <th key={h} className="px-5 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {!loading && visibleRequests.length === 0 && (
                <tr>
                  <td colSpan={canViewAll ? 9 : 8} className="px-5 py-10 text-center text-sm text-slate-500 dark:text-slate-400">
                    No permission requests yet. Submit your first request using the button above.
                  </td>
                </tr>
              )}
              {visibleRequests.map((req) => {
                const tc = typeConfig[req.type] || typeConfig['Leave Request']
                const TypeIcon = tc.icon
                const isOwnRequest = req.employeeId === employeeId
                const canEditOwn = canSubmit && isOwnRequest && req.status === 'Pending'
                return (
                  <tr key={req.id} className="transition hover:bg-slate-50 dark:hover:bg-slate-950/60">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className={clsx('grid h-9 w-9 shrink-0 place-items-center rounded-lg', tc.bg, tc.text)}>
                          <TypeIcon size={16} />
                        </div>
                        <span className="font-semibold text-slate-900 dark:text-white">{req.id}</span>
                      </div>
                    </td>
                    {canViewAll && (
                      <td className="px-5 py-4 text-slate-700 dark:text-slate-200">{req.employeeName || '-'}</td>
                    )}
                    <td className="px-5 py-4 text-slate-700 dark:text-slate-200">{req.type}</td>
                    <td className="px-5 py-4 text-slate-700 dark:text-slate-200">{fmtDate(req.date)}</td>
                    <td className="px-5 py-4 text-slate-700 dark:text-slate-200">{req.time}</td>
                    <td className="max-w-[160px] px-5 py-4">
                      <span className="line-clamp-1 text-slate-600 dark:text-slate-300">{req.reason}</span>
                    </td>
                    <td className="px-5 py-4">
                      <StatusBadge status={req.status} />
                    </td>
                    <td className="px-5 py-4">
                      <p className="text-slate-700 dark:text-slate-200">{req.submittedAt}</p>
                      <p className="mt-0.5 text-xs text-slate-400">{req.submittedTime}</p>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1.5">
                        <ActionBtn icon={Eye} label="View" onClick={() => setSelected(req)} />
                        {canEditOwn && (
                          <>
                            <ActionBtn icon={Pencil} label="Edit" onClick={() => openEdit(req)} />
                            <ActionBtn icon={Trash2} label="Cancel" danger onClick={() => deleteRequest(req)} />
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Mobile list */}
        <div className="divide-y divide-slate-100 lg:hidden dark:divide-slate-800">
          <div className="px-4 py-3">
            <p className="text-sm font-bold text-slate-700 dark:text-slate-200">My Requests</p>
          </div>
          {visibleRequests.map((req) => {
            const tc = typeConfig[req.type] || typeConfig['Leave Request']
            const TypeIcon = tc.icon
            return (
              <button
                key={req.id}
                className="flex w-full items-center gap-4 px-4 py-4 text-left transition hover:bg-slate-50 dark:hover:bg-slate-950"
                onClick={() => setSelected(req)}
                type="button"
              >
                <div className={clsx('grid h-11 w-11 shrink-0 place-items-center rounded-xl', tc.bg, tc.text)}>
                  <TypeIcon size={20} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate font-bold text-slate-900 dark:text-white">{req.type}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{req.id}</p>
                    </div>
                    <StatusBadge status={req.status} />
                  </div>
                  <div className="mt-2 flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                    <span className="flex items-center gap-1">
                      <CalendarDays size={11} />
                      {fmtDate(req.date)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock size={11} />
                      {req.time}
                    </span>
                  </div>
                </div>
                <ChevronRight size={16} className="shrink-0 text-slate-300" />
              </button>
            )
          })}
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between border-t border-slate-100 px-5 py-4 text-sm dark:border-slate-800">
          <p className="text-slate-500 dark:text-slate-400">
            Showing 1 to {visibleRequests.length} of {visibleRequests.length} requests
          </p>
          <div className="flex items-center gap-1">
            <PageBtn label="‹" disabled />
            <PageBtn label="1" active />
            <PageBtn label="›" disabled />
          </div>
        </div>
      </div>

      {canSubmit && (
        <button
          className="fixed bottom-24 right-5 z-30 grid h-14 w-14 place-items-center rounded-full bg-emerald-600 text-white shadow-xl shadow-emerald-900/25 transition hover:bg-emerald-700 lg:hidden"
          onClick={() => { setEditingId(null); resetForm(); setShowForm(true) }}
          type="button"
          aria-label="New permission request"
        >
          <Plus size={26} />
        </button>
      )}

      {showForm && (
        <RequestFormModal
          form={form}
          setForm={setForm}
          isEdit={Boolean(editingId)}
          onClose={() => { setShowForm(false); setEditingId(null); resetForm() }}
          onSubmit={submitRequest}
        />
      )}

      {selected && (
        <RequestDetailModal
          request={selected}
          canApprove={canApprove}
          onClose={() => setSelected(null)}
          onStatus={updateStatus}
        />
      )}
    </div>
  )
}

function StatCard({ label, value, icon: Icon, iconBg, iconText, badge }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center gap-3">
        <div className={clsx('grid h-11 w-11 place-items-center rounded-full', iconBg, iconText)}>
          <Icon size={20} />
        </div>
        <div>
          <p className="text-sm text-slate-500 dark:text-slate-400">{label}</p>
          <p className="text-2xl font-bold text-slate-950 dark:text-white">{value}</p>
        </div>
      </div>
      <div className="mt-4 flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
        Requests
        <span className={clsx('rounded-full px-2.5 py-0.5 text-xs font-bold', badge)}>{label}</span>
      </div>
    </div>
  )
}

function StatusBadge({ status }) {
  const styles = {
    Pending:  'bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-950/30 dark:text-amber-300 dark:ring-amber-900/60',
    Approved: 'bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-300 dark:ring-emerald-900/60',
    Rejected: 'bg-rose-50 text-rose-700 ring-rose-200 dark:bg-rose-950/30 dark:text-rose-300 dark:ring-rose-900/60',
  }
  return (
    <span className={clsx('inline-flex shrink-0 items-center rounded-full px-2.5 py-1 text-xs font-bold ring-1', styles[status] || styles.Pending)}>
      {status}
    </span>
  )
}

function ActionBtn({ icon: Icon, label, onClick, danger = false }) {
  return (
    <button
      className={clsx(
        'grid h-8 w-8 place-items-center rounded-lg border transition',
        danger
          ? 'border-rose-200 text-rose-500 hover:bg-rose-50 dark:border-rose-900/60 dark:hover:bg-rose-950/30'
          : 'border-slate-200 text-slate-500 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800',
      )}
      onClick={onClick}
      type="button"
      aria-label={label}
      title={label}
    >
      <Icon size={15} />
    </button>
  )
}

function PageBtn({ label, active = false, disabled = false }) {
  return (
    <button
      className={clsx(
        'grid h-8 w-8 place-items-center rounded-lg text-sm font-semibold transition',
        active ? 'bg-emerald-600 text-white' : 'border border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300',
        disabled && 'cursor-default opacity-40',
      )}
      type="button"
      disabled={disabled}
    >
      {label}
    </button>
  )
}

function RequestFormModal({ form, setForm, isEdit = false, onClose, onSubmit }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-end bg-slate-950/50 backdrop-blur-sm sm:place-items-center sm:p-4">
      <form
        className="max-h-[92vh] w-full overflow-y-auto rounded-t-2xl bg-white shadow-2xl dark:bg-slate-900 sm:max-w-2xl sm:rounded-xl"
        onSubmit={onSubmit}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white px-5 py-4 dark:border-slate-800 dark:bg-slate-900">
          <div>
            <h3 className="text-lg font-bold text-slate-950 dark:text-white">{isEdit ? 'Edit Permission Request' : 'New Permission Request'}</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">Submit a request for HR or admin approval.</p>
          </div>
          <button className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 dark:hover:bg-slate-800" onClick={onClose} type="button" aria-label="Close">
            <X size={20} />
          </button>
        </div>

        <div className="grid gap-4 p-5 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-200">Request Type</label>
            <select className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 dark:border-slate-700 dark:bg-slate-950 dark:text-white" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
              {requestTypes.map((t) => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-200">Date</label>
            <input className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 dark:border-slate-700 dark:bg-slate-950 dark:text-white" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-200">Time (optional)</label>
            <input className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 dark:border-slate-700 dark:bg-slate-950 dark:text-white" type="time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-200">Current Location (optional)</label>
            <input className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 dark:border-slate-700 dark:bg-slate-950 dark:text-white" placeholder="Lat, Lng" value={form.gps} onChange={(e) => setForm({ ...form, gps: e.target.value })} />
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-200">Reason</label>
            <textarea className="min-h-28 w-full rounded-lg border border-slate-200 bg-white px-3 py-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 dark:border-slate-700 dark:bg-slate-950 dark:text-white" value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} placeholder="Explain why you need this permission..." required />
          </div>
          <label className="flex cursor-pointer items-center justify-between rounded-xl border border-slate-200 p-4 dark:border-slate-800 sm:col-span-2">
            <div>
              <p className="font-semibold text-slate-900 dark:text-white">Emergency Request</p>
              <p className="text-sm text-slate-500 dark:text-slate-400">Highlight for faster approval.</p>
            </div>
            <input className="h-5 w-5 accent-emerald-600" type="checkbox" checked={form.emergency} onChange={(e) => setForm({ ...form, emergency: e.target.checked })} />
          </label>
        </div>

        <div className="sticky bottom-0 flex flex-col-reverse gap-3 border-t border-slate-100 bg-white/95 px-5 py-4 backdrop-blur dark:border-slate-800 dark:bg-slate-900/95 sm:flex-row sm:justify-end">
          <button className="h-11 rounded-lg border border-slate-200 px-5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200" onClick={onClose} type="button">Cancel</button>
          <button className="h-11 rounded-lg bg-emerald-600 px-5 text-sm font-semibold text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-700" type="submit">{isEdit ? 'Save Changes' : 'Submit Request'}</button>
        </div>
      </form>
    </div>
  )
}

function RequestDetailModal({ request, canApprove, onClose, onStatus }) {
  const tc = typeConfig[request.type] || typeConfig['Leave Request']
  const TypeIcon = tc.icon

  return (
    <div className="fixed inset-0 z-50 grid place-items-end bg-slate-950/50 backdrop-blur-sm sm:place-items-center sm:p-4">
      <div className="max-h-[92vh] w-full overflow-y-auto rounded-t-2xl bg-white shadow-2xl dark:bg-slate-900 sm:max-w-lg sm:rounded-xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white px-5 py-4 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-3">
            <div className={clsx('grid h-11 w-11 place-items-center rounded-xl', tc.bg, tc.text)}>
              <TypeIcon size={22} />
            </div>
            <div>
              <h3 className="font-bold text-slate-950 dark:text-white">{request.type}</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">{request.id}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <StatusBadge status={request.status} />
            <button className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800" onClick={onClose} type="button">
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="space-y-4 p-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Date</p>
              <p className="mt-1 font-semibold text-slate-900 dark:text-white">{fmtDate(request.date)}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Time</p>
              <p className="mt-1 font-semibold text-slate-900 dark:text-white">{request.time}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Submitted At</p>
              <p className="mt-1 font-semibold text-slate-900 dark:text-white">{request.submittedAt}, {request.submittedTime}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Approved By</p>
              <p className="mt-1 font-semibold text-slate-900 dark:text-white">{request.approvedBy}</p>
            </div>
          </div>

          <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950">
            <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">Reason</p>
            <p className="text-sm leading-6 text-slate-700 dark:text-slate-200">{request.reason}</p>
          </div>

          <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950">
            <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">Notes</p>
            <p className="text-sm text-slate-700 dark:text-slate-200">{request.notes}</p>
          </div>

          {canApprove && request.status === 'Pending' && (
            <div className="grid grid-cols-2 gap-3">
              <button className="flex h-11 items-center justify-center gap-2 rounded-lg bg-emerald-600 text-sm font-semibold text-white transition hover:bg-emerald-700" onClick={() => onStatus(request, 'Approved')} type="button">
                <Check size={16} />
                Approve
              </button>
              <button className="flex h-11 items-center justify-center gap-2 rounded-lg bg-rose-600 text-sm font-semibold text-white transition hover:bg-rose-700" onClick={() => onStatus(request, 'Rejected')} type="button">
                <XCircle size={16} />
                Reject
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
