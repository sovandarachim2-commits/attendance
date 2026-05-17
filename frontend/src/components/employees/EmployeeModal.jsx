/* eslint-disable no-unused-vars */
import { useEffect, useState } from 'react'
import {
  Activity, Bell, BriefcaseBusiness, Building2, CalendarCheck, Camera, CheckCircle2, ChevronDown, Clock, Download, Eye, EyeOff, FileText, Fingerprint, Folder, Home, KeyRound, List, LocateFixed, LogOut, Mail, MapPinned, Menu, Moon, Phone, ShieldCheck, ShoppingBag, Sun, UserPlus, Users, UserRound, X,
} from 'lucide-react'
import clsx from 'clsx'
import { api } from '../../services/api'
import { ErrorText } from '../shared/UI'
import { apiError } from '../../utils/format'

export default function EmployeeModal({ employee, onClose, onSaved }) {
  const isEdit = Boolean(employee)
  const loginRoleId = employee?.user?.role_id || employee?.user?.role?.id || ''
  const initialForm = {
    employee_code: employee?.employee_code || '',
    full_name: [employee?.first_name, employee?.last_name].filter(Boolean).join(' '),
    phone: employee?.phone || '',
    address: employee?.address || '',
    department_id: employee?.department_id || '',
    position_id: employee?.position_id || '',
    branch_id: employee?.branch_id || '',
    hire_date: employee?.hire_date || '',
    employment_type: employee?.employment_type || 'full_time',
    status: employee?.status || 'active',
    create_login: !employee,
    login_email: employee?.user?.email || '',
    login_username: employee?.user?.name || '',
    login_password: '',
    role_id: loginRoleId,
  }
  const [form, setForm] = useState({
    ...initialForm,
  })
  const [options, setOptions] = useState({ departments: [], positions: [], branches: [], roles: [] })
  const [photo, setPhoto] = useState(null)
  const [photoPreview, setPhotoPreview] = useState(employee?.photo_url || '')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [access, setAccess] = useState({
    gpsRestriction: Boolean(employee?.require_gps),
    faceVerification: Boolean(employee?.require_face_verification),
  })
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveMode, setSaveMode] = useState('close')

  useEffect(() => {
    api.get('/employee-options')
      .then((response) => {
        const nextOptions = response.data
        setOptions(nextOptions)
        const employeeRole = nextOptions.roles?.find((role) => role.slug === 'office_staff')
        setForm((current) => ({
          ...current,
          role_id: current.role_id || employeeRole?.id || '',
        }))
      })
      .catch(() => setError('Cannot load departments, positions, branches, and roles.'))
  }, [])

  useEffect(() => {
    return () => {
      if (photoPreview?.startsWith('blob:')) URL.revokeObjectURL(photoPreview)
    }
  }, [photoPreview])

  const updateField = (key, value) => setForm((current) => ({ ...current, [key]: value }))

  const handlePhoto = (file) => {
    setPhoto(file || null)
    if (photoPreview?.startsWith('blob:')) URL.revokeObjectURL(photoPreview)
    setPhotoPreview(file ? URL.createObjectURL(file) : employee?.photo_url || '')
  }

  const submit = async (event) => {
    event.preventDefault()
    setSaving(true)
    setError('')

    if (form.login_password && confirmPassword && form.login_password !== confirmPassword) {
      setError('Password and confirm password do not match.')
      setSaving(false)
      return
    }

    const body = new FormData()
    const [firstName, ...lastNameParts] = form.full_name.trim().split(/\s+/).filter(Boolean)
    const payload = {
      ...form,
      first_name: firstName || '',
      last_name: lastNameParts.join(' '),
    }
    delete payload.full_name
    Object.entries(payload).forEach(([key, value]) => body.append(key, typeof value === 'boolean' ? (value ? '1' : '0') : value))
    body.append('require_face_verification', access.faceVerification ? '1' : '0')
    body.append('require_gps', access.gpsRestriction ? '1' : '0')
    if (photo) body.append('photo', photo)
    if (isEdit) body.append('_method', 'PUT')

    try {
      await api.post(isEdit ? `/employees/${employee.id}` : '/employees', body)
      if (saveMode === 'another' && !isEdit) {
        setForm({
          ...initialForm,
          employee_code: '',
          full_name: '',
          phone: '',
          address: '',
          department_id: '',
          position_id: '',
          branch_id: '',
          hire_date: '',
          login_email: '',
          login_username: '',
          login_password: '',
        })
        setConfirmPassword('')
        handlePhoto(null)
        onSaved({ keepOpen: true })
      } else {
        onSaved()
      }
    } catch (exception) {
      setError(apiError(exception))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/65 p-3 backdrop-blur-[1px] sm:p-5">
      <form className="mx-auto flex min-h-[calc(100vh-1.5rem)] w-full max-w-6xl items-center sm:min-h-[calc(100vh-2.5rem)]" onSubmit={submit}>
        <div className="w-full overflow-hidden rounded-lg border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-950">
          <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-5 dark:border-slate-800 sm:px-7">
            <div className="flex items-start gap-4">
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-emerald-600 text-white shadow-lg shadow-emerald-600/20">
                <UserPlus size={21} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-950 dark:text-white">{isEdit ? 'Edit Employee' : 'Add New Employee'}</h3>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  {isEdit ? 'Update employee profile and login information.' : 'Fill in the employee details to create their profile and login account.'}
                </p>
              </div>
            </div>
            <button className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-900 dark:hover:text-white" onClick={onClose} type="button" aria-label="Close employee form">
              <X size={20} />
            </button>
          </div>

          <div className="max-h-[calc(100vh-9rem)] space-y-4 overflow-y-auto px-5 py-5 dark:bg-slate-950 sm:px-7">
            <EmployeeModalSection icon={UserRound} title="Personal Information" tone="emerald">
              <div className="grid gap-5 lg:grid-cols-[220px_1fr]">
                <div>
                  <EmployeeLabel required={false}>Employee Photo</EmployeeLabel>
                  <label className="mt-2 flex min-h-44 cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50/70 p-4 text-center transition hover:border-emerald-400 hover:bg-emerald-50/50 dark:border-slate-700 dark:bg-slate-900/70 dark:hover:border-emerald-500">
                    <input className="sr-only" type="file" accept="image/*" onChange={(event) => handlePhoto(event.target.files?.[0] || null)} />
                    <div className="grid h-20 w-20 place-items-center overflow-hidden rounded-full bg-slate-200 text-slate-500 dark:bg-slate-800">
                      {photoPreview ? <img className="h-full w-full object-cover" src={photoPreview} alt="Employee preview" /> : <UserRound size={38} />}
                    </div>
                    <span className="mt-3 text-sm font-semibold text-slate-800 dark:text-slate-100">Click to upload</span>
                    <span className="mt-1 max-w-32 text-xs leading-5 text-slate-500 dark:text-slate-400">JPG, PNG or WebP (Max. 4MB)</span>
                    {photo && <span className="mt-2 max-w-full truncate text-xs text-emerald-700 dark:text-emerald-400">{photo.name}</span>}
                  </label>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <EmployeeTextField icon={UserRound} label="Full Name" value={form.full_name} onChange={(value) => updateField('full_name', value)} placeholder="Enter full name" required />
                  <EmployeeTextField icon={Phone} label="Phone Number" value={form.phone} onChange={(value) => updateField('phone', value)} placeholder="Enter phone number" />
                  <EmployeeTextField icon={Mail} label="Email Address" type="email" value={form.login_email} onChange={(value) => updateField('login_email', value)} placeholder="Enter email address" required={!isEdit || Boolean(form.login_password)} />
                  <EmployeeTextareaField icon={MapPinned} label="Address" value={form.address} onChange={(value) => updateField('address', value)} placeholder="Enter present address" />
                </div>
              </div>
            </EmployeeModalSection>

            <EmployeeModalSection icon={BriefcaseBusiness} title="Work Information" tone="emerald">
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <EmployeeTextField icon={Fingerprint} label="Employee ID" value={form.employee_code} onChange={(value) => updateField('employee_code', value)} placeholder="Enter employee ID" required />
                <EmployeeSelectField icon={Building2} label="Department" value={form.department_id} onChange={(value) => updateField('department_id', value)}>
                  <option value="">Select department</option>
                  {options.departments.map((department) => <option key={department.id} value={department.id}>{department.name}</option>)}
                </EmployeeSelectField>
                <EmployeeSelectField icon={BriefcaseBusiness} label="Designation / Position" value={form.position_id} onChange={(value) => updateField('position_id', value)}>
                  <option value="">Select designation</option>
                  {options.positions.map((position) => <option key={position.id} value={position.id}>{position.name}</option>)}
                </EmployeeSelectField>
                <EmployeeSelectField icon={MapPinned} label="Branch" value={form.branch_id} onChange={(value) => updateField('branch_id', value)}>
                  <option value="">Select branch</option>
                  {options.branches.map((branch) => <option key={branch.id} value={branch.id}>{branch.name}</option>)}
                </EmployeeSelectField>
                <EmployeeTextField icon={CalendarCheck} label="Join Date" type="date" value={form.hire_date} onChange={(value) => updateField('hire_date', value)} />
                <EmployeeSelectField icon={BriefcaseBusiness} label="Employment Type" value={form.employment_type} onChange={(value) => updateField('employment_type', value)} required>
                  <option value="full_time">Full Time</option>
                  <option value="part_time">Part Time</option>
                  <option value="contract">Contract</option>
                  <option value="outdoor_sales">Outdoor Sales</option>
                </EmployeeSelectField>
                <EmployeeSelectField icon={UserRound} label="Reporting To" value="" onChange={() => {}}>
                  <option value="">Select reporting manager</option>
                </EmployeeSelectField>
              </div>
            </EmployeeModalSection>

            <EmployeeModalSection icon={KeyRound} title="Account Information" tone="violet">
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                <EmployeeTextField icon={UserRound} label="Username" type="text" value={form.login_username} onChange={(value) => updateField('login_username', value)} placeholder="Enter username" required={!isEdit || Boolean(form.login_password)} />
                <EmployeeTextField icon={EyeOff} label={isEdit ? 'New Password' : 'Password'} type="password" value={form.login_password} onChange={(value) => updateField('login_password', value)} placeholder="Enter password" required={!isEdit} help="Password must be at least 8 characters." />
                <EmployeeTextField icon={EyeOff} label="Confirm Password" type="password" value={confirmPassword} onChange={setConfirmPassword} placeholder="Confirm password" required={!isEdit} />
                <div className="xl:col-span-2">
                  <EmployeeSelectField icon={ShieldCheck} label="Role" value={form.role_id} onChange={(value) => updateField('role_id', value)} required>
                    <option value="">Select role</option>
                    {options.roles.map((role) => <option key={role.id} value={role.id}>{role.name}</option>)}
                  </EmployeeSelectField>
                </div>
                <EmployeeSelectField icon={CheckCircle2} label="Status" value={form.status} onChange={(value) => updateField('status', value)} required>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="suspended">Suspended</option>
                </EmployeeSelectField>
              </div>
            </EmployeeModalSection>

            <EmployeeModalSection icon={CalendarCheck} title="Attendance & Access Settings" tone="sky">
              <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                <div>
                  <EmployeeLabel required>Attendance Type</EmployeeLabel>
                  <div className="mt-3 space-y-3 text-sm font-medium text-slate-700 dark:text-slate-200">
                    <label className="flex items-center gap-2">
                      <input className="h-4 w-4 accent-emerald-600" type="radio" checked={form.employment_type !== 'outdoor_sales'} onChange={() => updateField('employment_type', 'full_time')} />
                      Office Staff
                    </label>
                    <label className="flex items-center gap-2">
                      <input className="h-4 w-4 accent-emerald-600" type="radio" checked={form.employment_type === 'outdoor_sales'} onChange={() => updateField('employment_type', 'outdoor_sales')} />
                      Outdoor Sales
                    </label>
                  </div>
                </div>
                <EmployeeCheck
                  title="GPS Restriction"
                  description="Employee must enable device location (GPS) to check in or out."
                  checked={access.gpsRestriction}
                  onChange={() => setAccess((current) => ({ ...current, gpsRestriction: !current.gpsRestriction }))}
                />
                <EmployeeCheck
                  title="Face Verification"
                  description="Employee must take a selfie photo during check-in and check-out."
                  checked={access.faceVerification}
                  onChange={() => setAccess((current) => ({ ...current, faceVerification: !current.faceVerification }))}
                />
              </div>
            </EmployeeModalSection>

            {error && <ErrorText text={error} />}
          </div>

          <div className="flex flex-col-reverse gap-3 border-t border-slate-100 bg-white px-5 py-4 dark:border-slate-800 dark:bg-slate-950 sm:flex-row sm:justify-end sm:px-7">
            <button className="rounded-lg border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-900" type="button" onClick={onClose}>
              Cancel
            </button>
            {!isEdit && (
              <button className="rounded-lg border border-emerald-500 px-5 py-2.5 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-50 disabled:opacity-60 dark:text-emerald-400 dark:hover:bg-emerald-950/30" type="submit" disabled={saving} onClick={() => setSaveMode('another')}>
                Save & Add Another
              </button>
            )}
            <button className="rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-700 disabled:opacity-60" disabled={saving} type="submit" onClick={() => setSaveMode('close')}>
              {saving ? 'Saving...' : isEdit ? 'Update Employee' : 'Save Employee'}
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}


function EmployeeModalSection({ icon: Icon, title, tone = 'emerald', children }) {
  const tones = {
    emerald: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400',
    violet: 'bg-violet-50 text-violet-600 dark:bg-violet-950/40 dark:text-violet-400',
    sky: 'bg-sky-50 text-sky-600 dark:bg-sky-950/40 dark:text-sky-400',
  }

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/60 sm:p-5">
      <div className="mb-4 flex items-center gap-3">
        <span className={clsx('grid h-7 w-7 place-items-center rounded-lg', tones[tone])}>
          <Icon size={16} />
        </span>
        <h4 className="font-bold text-slate-950 dark:text-white">{title}</h4>
      </div>
      {children}
    </section>
  )
}


function EmployeeLabel({ children, required = false }) {
  return (
    <label className="text-xs font-bold text-slate-900 dark:text-slate-100">
      {children}{required && <span className="ml-1 text-rose-500">*</span>}
    </label>
  )
}


function EmployeeInputShell({ icon: Icon, label, required, help, children }) {
  return (
    <div>
      {label && <EmployeeLabel required={required}>{label}</EmployeeLabel>}
      <div className="relative mt-2">
        {Icon && <Icon className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={17} />}
        {children}
      </div>
      {help && <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">{help}</p>}
    </div>
  )
}


function EmployeeTextField({ icon, label, value, onChange, type = 'text', placeholder = '', required = false, help }) {
  return (
    <EmployeeInputShell icon={icon} label={label} required={required} help={help}>
      <input
        className={clsx('h-12 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 dark:border-slate-700 dark:bg-slate-950 dark:text-white', icon && 'pl-10')}
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        required={required}
      />
    </EmployeeInputShell>
  )
}


function EmployeeTextareaField({ icon, label, value, onChange, placeholder = '', required = false }) {
  return (
    <EmployeeInputShell icon={icon} label={label} required={required}>
      <textarea
        className={clsx('min-h-24 w-full rounded-lg border border-slate-200 bg-white px-3 py-3 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 dark:border-slate-700 dark:bg-slate-950 dark:text-white', icon && 'pl-10')}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        required={required}
      />
    </EmployeeInputShell>
  )
}


function EmployeeSelectField({ icon, label, value, onChange, required = false, children }) {
  return (
    <EmployeeInputShell icon={icon} label={label} required={required}>
      <select
        className={clsx('h-12 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 dark:border-slate-700 dark:bg-slate-950 dark:text-white', icon && 'pl-10')}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        required={required}
      >
        {children}
      </select>
    </EmployeeInputShell>
  )
}


function EmployeeCheck({ title, description, checked, onChange }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/40">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{title}</p>
          {description && <p className="mt-1 text-xs leading-relaxed text-slate-500 dark:text-slate-400">{description}</p>}
        </div>
        <button
          type="button"
          onClick={onChange}
          aria-pressed={checked}
          className={clsx(
            'relative mt-0.5 flex h-7 w-14 shrink-0 items-center rounded-full transition-colors duration-200',
            checked ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600',
          )}
        >
          <span className={clsx(
            'absolute flex h-5 w-5 items-center justify-center rounded-full bg-white text-[9px] font-bold shadow transition-all duration-200',
            checked ? 'left-[calc(100%-1.375rem)] text-emerald-600' : 'left-1 text-slate-400',
          )}>
            {checked ? 'ON' : 'OFF'}
          </span>
        </button>
      </div>
    </div>
  )
}
