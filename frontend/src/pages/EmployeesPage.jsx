import { useMemo, useState } from 'react'
import {
  AlertTriangle,
  Download,
  Grid3X3,
  Loader2,
  Pencil,
  Search,
  Trash2,
  UploadCloud,
  UserCheck,
  Users,
  X,
} from 'lucide-react'
import { EmptyState, StatusPill } from '../components/shared/UI'
import { api } from '../services/api'
import { canAccess, employeeFullName, initials, titleCase } from '../utils/format'

export default function EmployeesPage({ appData, refresh, setModal, setEditingEmployee, user }) {
  const [search, setSearch] = useState('')
  const [department, setDepartment] = useState('all')
  const [status, setStatus] = useState('all')
  const [branch, setBranch] = useState('all')
  const [deletingId, setDeletingId] = useState(null)
  const [confirmEmployee, setConfirmEmployee] = useState(null)

  const employees = useMemo(() => appData.employees || [], [appData.employees])
  const activeCount = employees.filter((item) => item.status === 'active').length
  const photoCount = employees.filter((item) => item.photo_path || item.photo_url).length
  const activePercent = employees.length ? Math.round((activeCount / employees.length) * 100) : 0
  const photoPercent = employees.length ? Math.round((photoCount / employees.length) * 100) : 0

  const departments = useMemo(() => {
    return [...new Set(employees.map((item) => item.department?.name).filter(Boolean))].sort()
  }, [employees])

  const branches = useMemo(() => {
    return [...new Set(employees.map((item) => item.branch?.name).filter(Boolean))].sort()
  }, [employees])

  const filteredEmployees = useMemo(() => {
    const keyword = search.trim().toLowerCase()

    return employees.filter((employee) => {
      const fullName = employeeFullName(employee, '')
      const email = employee.user?.email || ''
      const matchesSearch = !keyword || [
        employee.employee_code,
        fullName,
        email,
        employee.phone,
      ].some((value) => String(value || '').toLowerCase().includes(keyword))

      const matchesDepartment = department === 'all' || employee.department?.name === department
      const matchesStatus = status === 'all' || employee.status === status
      const matchesBranch = branch === 'all' || employee.branch?.name === branch

      return matchesSearch && matchesDepartment && matchesStatus && matchesBranch
    })
  }, [branch, department, employees, search, status])

  const openCreate = () => {
    setEditingEmployee(null)
    setModal('employee')
  }

  const openEdit = (employee) => {
    setEditingEmployee(employee)
    setModal('employee')
  }

  const clearFilters = () => {
    setSearch('')
    setDepartment('all')
    setStatus('all')
    setBranch('all')
  }

  const canCreate = canAccess(user, ['manage_employees', 'create_employee'])
  const canEdit = canAccess(user, ['manage_employees', 'edit_employee'])
  const canDelete = canAccess(user, ['manage_employees', 'delete_employee'])

  const deleteEmployee = (employee) => setConfirmEmployee(employee)

  const confirmDelete = async () => {
    if (!confirmEmployee) return
    setDeletingId(confirmEmployee.id)
    setConfirmEmployee(null)
    try {
      await api.delete(`/employees/${confirmEmployee.id}`)
      refresh()
    } catch (ex) {
      const msg = ex.response?.data?.message || 'Could not delete employee.'
      window.alert(msg)
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-950 dark:text-white">Employees</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Manage and organize your workforce</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button className="inline-flex h-11 items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200">
            <UploadCloud size={17} />
            Import Employees
          </button>
          <button className="inline-flex h-11 items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200">
            <Download size={17} className="text-emerald-600" />
            Export
          </button>
          {canCreate && (
            <button className="inline-flex h-11 items-center gap-2 rounded-lg bg-emerald-600 px-4 text-sm font-semibold text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-700" onClick={openCreate}>
              <span className="text-xl leading-none">+</span>
              Add Employee
            </button>
          )}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <EmployeeStatCard
          icon={Users}
          label="Total Employees"
          value={employees.length}
          help="Loaded from employees API"
          tone="emerald"
        />
        <EmployeeStatCard
          icon={UserCheck}
          label="Active Staff"
          value={activeCount}
          help="Currently active employees"
          badge={`${activePercent}%`}
          tone="blue"
        />
        <EmployeeStatCard
          icon={Grid3X3}
          label="Photo Profiles"
          value={photoCount}
          help="Uploaded employee photos"
          badge={`${photoPercent}%`}
          tone="violet"
        />
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="grid gap-4 lg:grid-cols-[1.1fr_1fr_1fr_1fr_auto]">
          <label className="relative">
            <span className="sr-only">Search employees</span>
            <Search className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              className="h-12 w-full rounded-lg border border-slate-200 bg-white px-4 pr-11 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by name, email, code..."
            />
          </label>

          <FilterSelect label="Department" value={department} onChange={setDepartment}>
            <option value="all">All Departments</option>
            {departments.map((name) => <option key={name} value={name}>{name}</option>)}
          </FilterSelect>

          <FilterSelect label="Status" value={status} onChange={setStatus}>
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="suspended">Suspended</option>
          </FilterSelect>

          <FilterSelect label="Branch" value={branch} onChange={setBranch}>
            <option value="all">All Branches</option>
            {branches.map((name) => <option key={name} value={name}>{name}</option>)}
          </FilterSelect>

          <button className="inline-flex h-12 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200" onClick={clearFilters}>
            <X size={17} />
            Clear Filters
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-5 dark:border-slate-800">
          <div>
            <h3 className="text-lg font-bold text-slate-950 dark:text-white">Employee Directory</h3>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Manage and view all employee records.</p>
          </div>
          <button className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200">
            <Grid3X3 size={16} />
            Columns
          </button>
        </div>

        {filteredEmployees.length === 0 ? <EmptyState text="No employees match these filters." /> : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1180px] text-left text-sm">
              <thead className="bg-slate-50/80 text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-950 dark:text-slate-400">
                <tr>
                  {['Code', 'Employee', 'Department', 'Position', 'Branch', 'Email', 'Phone', 'Status', 'Actions'].map((head) => (
                    <th key={head} className="px-5 py-4 font-bold">{head}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredEmployees.map((employee) => {
                  const fullName = employeeFullName(employee)
                  const email = employee.user?.email || '-'
                  const roleSlug = employee.user?.role?.slug
                  const isProtected = roleSlug === 'super_admin' || roleSlug === 'admin'
                  const isDeleting = deletingId === employee.id

                  return (
                    <tr key={employee.id} className="transition hover:bg-slate-50 dark:hover:bg-slate-800/60">
                      <td className="px-5 py-5 font-semibold text-slate-800 dark:text-slate-100">{employee.employee_code}</td>
                      <td className="px-5 py-5">
                        <div className="flex items-center gap-3">
                          <div className="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-full bg-slate-100 text-sm font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                            {employee.photo_url ? <img className="h-full w-full object-cover" src={employee.photo_url} alt={fullName} /> : initials(fullName)}
                          </div>
                          <div>
                            <p className="font-bold text-slate-950 dark:text-white">{fullName || '-'}</p>
                            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-5 text-slate-700 dark:text-slate-200">{employee.department?.name || '-'}</td>
                      <td className="px-5 py-5 text-slate-700 dark:text-slate-200">{employee.position?.name || '-'}</td>
                      <td className="px-5 py-5 text-slate-700 dark:text-slate-200">{employee.branch?.name || '-'}</td>
                      <td className="px-5 py-5 text-slate-700 dark:text-slate-200">{email}</td>
                      <td className="px-5 py-5 text-slate-700 dark:text-slate-200">{employee.phone || '-'}</td>
                      <td className="px-5 py-5"><StatusPill status={titleCase(employee.status)} /></td>
                      <td className="px-5 py-5">
                        <div className="flex items-center gap-2">
                          {canEdit && (
                            <button className="grid h-10 w-10 place-items-center rounded-lg border border-sky-200 text-sky-600 transition hover:bg-sky-50 dark:border-sky-900/60 dark:hover:bg-sky-950/40" onClick={() => openEdit(employee)} aria-label={`Edit ${fullName}`}>
                              <Pencil size={17} />
                            </button>
                          )}
                          {canDelete && !isProtected && (
                            <button
                              className="grid h-10 w-10 place-items-center rounded-lg border border-rose-200 text-rose-500 transition hover:bg-rose-50 disabled:opacity-50 dark:border-rose-900/60 dark:hover:bg-rose-950/30"
                              onClick={() => deleteEmployee(employee)}
                              disabled={isDeleting}
                              aria-label={`Delete ${fullName}`}
                            >
                              {isDeleting ? <Loader2 size={17} className="animate-spin" /> : <Trash2 size={17} />}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex flex-col gap-3 border-t border-slate-100 px-5 py-4 text-sm text-slate-500 dark:border-slate-800 dark:text-slate-400 sm:flex-row sm:items-center sm:justify-between">
          <p>Showing 1 to {filteredEmployees.length} of {employees.length} employees</p>
          <div className="flex items-center gap-2">
            <button className="grid h-9 w-9 place-items-center rounded-lg border border-slate-200 text-slate-400 dark:border-slate-700" disabled>{'<'}</button>
            <button className="grid h-9 min-w-9 place-items-center rounded-lg bg-emerald-600 px-3 font-bold text-white">1</button>
            <button className="grid h-9 w-9 place-items-center rounded-lg border border-slate-200 text-slate-400 dark:border-slate-700" disabled>{'>'}</button>
          </div>
        </div>
      </div>
      {confirmEmployee && (
        <DeleteConfirmModal
          employee={confirmEmployee}
          onConfirm={confirmDelete}
          onCancel={() => setConfirmEmployee(null)}
        />
      )}
    </div>
  )
}

function EmployeeStatCard({ icon: Icon, label, value, help, badge, tone }) {
  const tones = {
    emerald: {
      card: 'border-emerald-200 bg-emerald-50/35 dark:border-emerald-900/50 dark:bg-emerald-950/20',
      icon: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/50 dark:text-emerald-300',
      badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300',
    },
    blue: {
      card: 'border-sky-200 bg-sky-50/35 dark:border-sky-900/50 dark:bg-sky-950/20',
      icon: 'bg-sky-100 text-sky-600 dark:bg-sky-900/50 dark:text-sky-300',
      badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300',
    },
    violet: {
      card: 'border-violet-200 bg-violet-50/35 dark:border-violet-900/50 dark:bg-violet-950/20',
      icon: 'bg-violet-100 text-violet-600 dark:bg-violet-900/50 dark:text-violet-300',
      badge: 'bg-violet-100 text-violet-700 dark:bg-violet-900/50 dark:text-violet-300',
    },
  }
  const selected = tones[tone]

  return (
    <div className={`relative overflow-hidden rounded-lg border p-6 shadow-sm ${selected.card}`}>
      {badge && <span className={`absolute right-5 top-5 rounded-full px-2.5 py-1 text-xs font-bold ${selected.badge}`}>{badge}</span>}
      <div className="flex items-center gap-5">
        <div className={`grid h-16 w-16 shrink-0 place-items-center rounded-2xl ${selected.icon}`}>
          <Icon size={28} />
        </div>
        <div>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{label}</p>
          <p className="mt-2 text-3xl font-bold text-slate-950 dark:text-white">{value}</p>
          <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">{help}</p>
        </div>
      </div>
    </div>
  )
}

function FilterSelect({ label, value, onChange, children }) {
  return (
    <label>
      <span className="mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-200">{label}</span>
      <select
        className="h-12 w-full rounded-lg border border-slate-200 bg-white px-4 text-sm text-slate-900 shadow-sm outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        {children}
      </select>
    </label>
  )
}

function DeleteConfirmModal({ employee, onConfirm, onCancel }) {
  const fullName = employeeFullName(employee)
  const photoUrl = employee.photo_url
  const role = employee.user?.role?.name || 'No login account'
  const dept = employee.department?.name || '-'

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-sm overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-slate-900">

        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-rose-100 dark:bg-rose-950/50">
              <AlertTriangle size={20} className="text-rose-600 dark:text-rose-400" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-slate-100">Delete Employee</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">This action cannot be undone</p>
            </div>
          </div>
          <button
            onClick={onCancel}
            className="grid h-9 w-9 place-items-center rounded-lg border border-slate-200 text-slate-400 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
          >
            <X size={16} />
          </button>
        </div>

        <div className="space-y-4 p-5">
          {/* Employee card */}
          <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/50">
            <div className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-full bg-slate-200 text-sm font-bold text-slate-600 dark:bg-slate-700 dark:text-slate-300">
              {photoUrl
                ? <img src={photoUrl} alt={fullName} className="h-full w-full object-cover" />
                : initials(fullName)}
            </div>
            <div className="min-w-0">
              <p className="font-bold text-slate-900 dark:text-slate-100 truncate">{fullName}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">{dept} · {role}</p>
              <p className="text-xs font-mono text-slate-400 dark:text-slate-500">{employee.employee_code}</p>
            </div>
          </div>

          {/* Warning */}
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Deleting this employee will also remove their login account and all associated data. Are you sure?
          </p>

          {/* Buttons */}
          <div className="flex gap-3 pt-1">
            <button
              onClick={onCancel}
              className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-rose-600 py-2.5 text-sm font-semibold text-white shadow-lg shadow-rose-600/25 transition hover:bg-rose-700"
            >
              <Trash2 size={15} />
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
