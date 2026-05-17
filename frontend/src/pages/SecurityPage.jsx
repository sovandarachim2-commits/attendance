import { useEffect, useState } from 'react'
import {
  Bot,
  CalendarDays,
  Check,
  ChevronRight,
  ClipboardList,
  Cloud,
  DatabaseBackup,
  Download,
  Eye,
  EyeOff,
  FileClock,
  Info,
  Mail,
  Map,
  MapPin,
  QrCode,
  RefreshCcw,
  Save,
  Search,
  Send,
  Settings,
  ShieldCheck,
  Upload,
  Users,
  Wifi,
} from 'lucide-react'
import clsx from 'clsx'
import { api } from '../services/api'
import { EmptyState } from '../components/shared/UI'

const telegramEvents = [
  { value: 'daily_attendance', label: 'Daily Attendance' },
  { value: 'permission_request', label: 'Permission Requests' },
  { value: 'late_attendance', label: 'Late Attendance' },
  { value: 'missing_checkout', label: 'Missing Check Out' },
  { value: 'outdoor_visit', label: 'Outdoor Visits' },
  { value: 'system_alert', label: 'System Alerts' },
  { value: 'other', label: 'Other' },
]

const settingsSections = [
  { id: 'general', label: 'General Settings', icon: Settings },
  { id: 'attendance', label: 'Attendance Rules', icon: FileClock },
  { id: 'schedule', label: 'Work Schedule', icon: CalendarDays },
  { id: 'locations', label: 'Office Locations', icon: MapPin },
  { id: 'gps', label: 'GPS & Tracking', icon: Wifi },
  { id: 'qr', label: 'QR Attendance', icon: QrCode },
  { id: 'telegram', label: 'Telegram Notifications', icon: Send },
  { id: 'email', label: 'Email Notifications', icon: Mail },
  { id: 'maps', label: 'Google Maps API', icon: Map },
  { id: 'r2', label: 'Cloudflare R2 Storage', icon: Cloud },
  { id: 'security', label: 'Security Settings', icon: ShieldCheck },
  { id: 'roles', label: 'Roles & Permissions', icon: Users },
  { id: 'backup', label: 'Backup & Restore', icon: DatabaseBackup },
  { id: 'logs', label: 'System Logs', icon: ClipboardList },
  { id: 'about', label: 'About System', icon: Info },
]

const SAVEABLE_SECTIONS = new Set(['general', 'attendance', 'schedule', 'gps', 'security'])

export default function SecurityPage({ refresh }) {
  const [activeSection, setActiveSection] = useState('general')
  const [search, setSearch] = useState('')
  const [notice, setNotice] = useState({ text: '', ok: true })
  const [settings, setSettings] = useState({})
  const [loadingSettings, setLoadingSettings] = useState(true)
  const [saving, setSaving] = useState(false)

  const active = settingsSections.find((section) => section.id === activeSection) || settingsSections[0]
  const filteredSections = settingsSections.filter((section) => section.label.toLowerCase().includes(search.toLowerCase()))

  const showNotice = (text, ok = true) => {
    setNotice({ text, ok })
    window.setTimeout(() => setNotice({ text: '', ok: true }), 2800)
  }

  useEffect(() => {
    api.get('/settings')
      .then((res) => setSettings(res.data || {}))
      .catch(() => showNotice('Could not load settings from server.', false))
      .finally(() => setLoadingSettings(false))
  }, [])

  const updateSetting = (key, value) => setSettings((prev) => ({ ...prev, [key]: value }))

  const saveSettings = async () => {
    if (!SAVEABLE_SECTIONS.has(activeSection)) {
      showNotice('This section saves automatically via its own controls.', true)
      return
    }
    setSaving(true)
    try {
      const res = await api.put('/settings', { settings })
      setSettings(res.data || settings)
      showNotice('Settings saved successfully.', true)
      refresh?.()
    } catch {
      showNotice('Failed to save settings. Check your connection.', false)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-950 dark:text-white">Settings</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Configure attendance, tracking, integrations, permissions, and system security.</p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <label className="relative">
            <span className="sr-only">Search settings</span>
            <Search className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              className="h-11 w-full rounded-lg border border-slate-200 bg-white px-4 pr-11 text-sm outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 dark:border-slate-700 dark:bg-slate-900 sm:w-80"
              placeholder="Search settings..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </label>
          <button
            className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-emerald-600 px-5 text-sm font-semibold text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-700 disabled:opacity-60"
            onClick={saveSettings}
            disabled={saving || loadingSettings}
            type="button"
          >
            <Save size={17} />
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      {notice.text && (
        <div className={clsx('rounded-lg border px-4 py-3 text-sm font-semibold',
          notice.ok
            ? 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-200'
            : 'border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-200',
        )}>
          {notice.text}
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[300px_1fr]">
        <aside className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="border-b border-slate-100 px-5 py-4 dark:border-slate-800">
            <p className="text-sm font-bold uppercase tracking-wide text-slate-400">Settings Menu</p>
          </div>
          <nav className="max-h-[calc(100vh-15rem)] overflow-y-auto p-2">
            {filteredSections.map((section) => (
              <button
                key={section.id}
                className={clsx(
                  'flex w-full items-center justify-between rounded-lg px-3 py-3 text-left text-sm font-semibold transition',
                  activeSection === section.id
                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white',
                )}
                onClick={() => setActiveSection(section.id)}
                type="button"
              >
                <span className="flex items-center gap-3">
                  <section.icon size={18} />
                  {section.label}
                </span>
                <ChevronRight size={16} className={activeSection === section.id ? 'text-emerald-500' : 'text-slate-300'} />
              </button>
            ))}
            {filteredSections.length === 0 && (
              <p className="px-3 py-6 text-center text-sm font-medium text-slate-500 dark:text-slate-400">No settings found.</p>
            )}
          </nav>
        </aside>

        <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-5 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-300">
                <active.icon size={21} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-950 dark:text-white">{active.label}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">Manage {active.label.toLowerCase()} for the attendance platform.</p>
              </div>
            </div>
          </div>

          <div className="space-y-5 p-5">
            {loadingSettings
              ? <p className="text-sm text-slate-500 dark:text-slate-400">Loading settings...</p>
              : renderSettingsContent(activeSection, showNotice, settings, updateSetting, refresh)}
          </div>
        </section>
      </div>
    </div>
  )
}

function renderSettingsContent(section, notify, settings, updateSetting, refresh) {
  const sp = { settings, onUpdate: updateSetting }
  switch (section) {
    case 'general':    return <GeneralSettings {...sp} onSettingsSaved={refresh} />
    case 'attendance': return <AttendanceRules {...sp} />
    case 'schedule':   return <WorkSchedule {...sp} />
    case 'locations':  return <OfficeLocations notify={notify} />
    case 'gps':        return <GpsTracking {...sp} />
    case 'qr':         return <QrAttendance notify={notify} />
    case 'telegram':   return <TelegramNotifications notify={notify} />
    case 'email':      return <EmailNotifications />
    case 'maps':       return <GoogleMapsSettings />
    case 'r2':         return <CloudflareR2Settings />
    case 'security':   return <SecuritySettings {...sp} />
    case 'roles':      return <RolesPermissions />
    case 'backup':     return <BackupRestore notify={notify} />
    case 'logs':       return <SystemLogs />
    case 'about':      return <AboutSystem />
    default:           return <GeneralSettings {...sp} />
  }
}

function GeneralSettings({ settings, onUpdate, onSettingsSaved }) {
  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <SettingsCard title="Company Profile" description="Basic company identity and localization.">
        <Field label="Company Name" placeholder="Company name" settingKey="company_name" settings={settings} onUpdate={onUpdate} />
        <UploadField
          label="Company Logo"
          currentUrl={settings.company_logo_url || ''}
          onUploaded={(url) => {
            onUpdate('company_logo_url', url)
            onSettingsSaved?.()
          }}
        />
        <SelectField label="Timezone" options={['Asia/Bangkok', 'UTC', 'Asia/Phnom_Penh']} settingKey="timezone" settings={settings} onUpdate={onUpdate} />
        <SelectField label="Language" options={['English', 'Khmer', 'Thai']} settingKey="language" settings={settings} onUpdate={onUpdate} />
      </SettingsCard>
      <SettingsCard title="Display Preferences" description="Regional display and default interface behavior.">
        <SelectField label="Currency" options={['USD', 'KHR', 'THB']} settingKey="currency" settings={settings} onUpdate={onUpdate} />
        <SelectField label="Date Format" options={['DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD']} settingKey="date_format" settings={settings} onUpdate={onUpdate} />
        <SelectField label="Theme Mode" options={['System', 'Light', 'Dark']} settingKey="theme_mode" settings={settings} onUpdate={onUpdate} />
      </SettingsCard>
    </div>
  )
}

function AttendanceRules({ settings, onUpdate }) {
  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <SettingsCard title="Check In Rules" description="Office attendance time and radius validation.">
        <Field label="Check In Time" type="time" settingKey="check_in_time" settings={settings} onUpdate={onUpdate} />
        <Field label="Check Out Time" type="time" settingKey="check_out_time" settings={settings} onUpdate={onUpdate} />
        <Field label="Late Minutes" type="number" placeholder="15" settingKey="late_minutes" settings={settings} onUpdate={onUpdate} />
        <Field label="Attendance Radius" suffix="meters" type="number" placeholder="100" settingKey="attendance_radius" settings={settings} onUpdate={onUpdate} />
      </SettingsCard>
      <SettingsCard title="Advanced Rules" description="Overtime and weekend attendance behavior.">
        <SelectField label="Overtime Rules" options={['After checkout time', 'Manual approval', 'Disabled']} settingKey="overtime_rules" settings={settings} onUpdate={onUpdate} />
        <SelectField label="Weekend Rules" options={['Allow with approval', 'Block weekend', 'Always allow']} settingKey="weekend_rules" settings={settings} onUpdate={onUpdate} />
      </SettingsCard>
    </div>
  )
}

function WorkSchedule({ settings, onUpdate }) {
  return (
    <SettingsCard title="Work Schedule" description="Set standard office schedule and working days.">
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Office Start Time" type="time" settingKey="work_start_time" settings={settings} onUpdate={onUpdate} />
        <Field label="Office End Time" type="time" settingKey="work_end_time" settings={settings} onUpdate={onUpdate} />
        <Field label="Break Time" placeholder="e.g. 12:00 - 13:00" settingKey="break_time" settings={settings} onUpdate={onUpdate} />
        <SelectField label="Working Days" options={['Monday - Friday', 'Monday - Saturday', 'Every day']} settingKey="working_days" settings={settings} onUpdate={onUpdate} />
      </div>
      <ToggleRow title="Flexible Schedule" description="Allow selected roles to check in with flexible working hours." settingKey="flexible_schedule" settings={settings} onUpdate={onUpdate} />
    </SettingsCard>
  )
}

function OfficeLocations({ notify }) {
  return (
    <SettingsCard title="Office Locations" description="Office branches used for GPS attendance validation.">
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Branch Name" placeholder="Branch name" />
        <Field label="Radius" suffix="meters" type="number" placeholder="100" />
        <Field label="Latitude" placeholder="Latitude" />
        <Field label="Longitude" placeholder="Longitude" />
      </div>
      <button className="inline-flex h-10 items-center gap-2 rounded-lg border border-emerald-200 px-4 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-50 dark:border-emerald-900 dark:text-emerald-300 dark:hover:bg-emerald-950/30" onClick={() => notify('Office location row is ready. Connect backend endpoint to create more branches.')} type="button">
        <MapPin size={16} />
        Add Office Location
      </button>
    </SettingsCard>
  )
}

function GpsTracking({ settings, onUpdate }) {
  return (
    <SettingsCard title="GPS & Tracking" description="Control location tracking and fake GPS protection.">
      <div className="grid gap-3 md:grid-cols-2">
        <ToggleRow title="Enable Current Location Tracking" description="Capture current location during attendance events." settingKey="gps_location_tracking" settings={settings} onUpdate={onUpdate} />
        <ToggleRow title="Fake GPS Detection" description="Flag suspicious GPS accuracy and movement." settingKey="gps_fake_detection" settings={settings} onUpdate={onUpdate} />
        <ToggleRow title="Background Tracking" description="Allow route points during outdoor sales visits." settingKey="gps_background_tracking" settings={settings} onUpdate={onUpdate} />
        <ToggleRow title="Live Location Tracking" description="Show latest employee location on dashboard map." settingKey="gps_live_tracking" settings={settings} onUpdate={onUpdate} />
      </div>
    </SettingsCard>
  )
}

function QrAttendance({ notify }) {
  const [qrSeed, setQrSeed] = useState(() => Date.now())

  const generateQr = () => {
    setQrSeed(Date.now())
    notify('New QR preview generated locally.')
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_280px]">
      <SettingsCard title="QR Attendance" description="Configure rotating QR codes for office attendance.">
        <ToggleRow title="Enable QR Attendance" description="Require QR scan before office check-in." enabled />
        <Field label="QR Refresh Time" suffix="seconds" type="number" placeholder="60" />
        <button className="inline-flex h-10 items-center gap-2 rounded-lg bg-emerald-600 px-4 text-sm font-semibold text-white transition hover:bg-emerald-700" onClick={generateQr} type="button">
          <RefreshCcw size={16} />
          Generate QR
        </button>
      </SettingsCard>
      <div className="grid place-items-center rounded-lg border border-dashed border-slate-300 bg-slate-50 p-6 text-center dark:border-slate-700 dark:bg-slate-950">
        <div className="grid h-36 w-36 place-items-center rounded-lg bg-white shadow-sm dark:bg-slate-900">
          <QrCode className="text-slate-800 dark:text-slate-100" size={92} key={qrSeed} />
        </div>
        <p className="mt-4 text-sm font-semibold text-slate-600 dark:text-slate-300">QR Preview</p>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Code #{String(qrSeed).slice(-6)}</p>
      </div>
    </div>
  )
}

function TelegramNotifications({ notify }) {
  const emptyForm = {
    name: '',
    event_key: 'daily_attendance',
    chat_id: '',
    message_thread_id: '',
    enabled: true,
  }
  const [rows, setRows] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [editingRow, setEditingRow] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [tokenInput, setTokenInput] = useState('')
  const [showToken, setShowToken] = useState(false)
  const [tokenSaving, setTokenSaving] = useState(false)
  const [botStatus, setBotStatus] = useState(null)

  const loadRows = async () => {
    setLoading(true)
    try {
      const response = await api.get('/telegram-destinations')
      setRows(response.data || [])
    } catch {
      notify('Cannot load Telegram destinations. Login as admin and check API server.', false)
    } finally {
      setLoading(false)
    }
  }

  const loadTokenStatus = async () => {
    try {
      const res = await api.get('/telegram-destinations/token-status')
      setBotStatus(res.data)
    } catch {
      setBotStatus({ verified: false, error: 'Could not check bot status.' })
    }
  }

  useEffect(() => {
    loadRows()
    loadTokenStatus()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const saveToken = async () => {
    if (!tokenInput.trim()) { notify('Enter a bot token first.', false); return }
    setTokenSaving(true)
    try {
      const res = await api.post('/telegram-destinations/save-token', { bot_token: tokenInput.trim() })
      setBotStatus({ verified: true, source: 'database', bot: res.data.bot })
      setTokenInput('')
      notify('Bot token saved and verified: ' + res.data.bot.username)
    } catch (ex) {
      const msg = ex.response?.data?.message || 'Failed to save token.'
      notify(msg, false)
      setBotStatus((prev) => ({ ...prev, verified: false, error: msg }))
    } finally {
      setTokenSaving(false)
    }
  }

  const updateField = (key, value) => setForm((current) => ({ ...current, [key]: value }))

  const startEdit = (row) => {
    setEditingRow(row)
    setForm({
      name: row.name,
      event_key: row.event_key,
      chat_id: row.chat_id || '',
      message_thread_id: row.message_thread_id || '',
      enabled: row.enabled,
    })
  }

  const cancelEdit = () => {
    setEditingRow(null)
    setForm(emptyForm)
  }

  const saveDestination = async () => {
    if (!form.name.trim() || !form.chat_id.trim()) {
      notify('Name and Chat ID are required.', false)
      return
    }

    setSaving(true)
    try {
      const payload = {
        ...form,
        name: form.name.trim(),
        chat_id: form.chat_id.trim(),
        message_thread_id: form.message_thread_id ? Number(form.message_thread_id) : null,
      }

      if (editingRow) {
        await api.put(`/telegram-destinations/${editingRow.id}`, payload)
        notify('Telegram destination updated.')
      } else {
        await api.post('/telegram-destinations', payload)
        notify('Telegram destination saved.')
      }

      setForm(emptyForm)
      setEditingRow(null)
      await loadRows()
    } catch {
      notify(`Could not ${editingRow ? 'update' : 'save'} Telegram destination.`, false)
    } finally {
      setSaving(false)
    }
  }

  const toggleDestination = async (row) => {
    try {
      await api.put(`/telegram-destinations/${row.id}`, {
        name: row.name,
        event_key: row.event_key,
        chat_id: row.chat_id,
        message_thread_id: row.message_thread_id,
        enabled: !row.enabled,
      })
      await loadRows()
    } catch {
      notify('Could not update Telegram destination.', false)
    }
  }

  const removeDestination = async (row) => {
    if (!confirm(`Remove ${row.name}?`)) return
    try {
      await api.delete(`/telegram-destinations/${row.id}`)
      if (editingRow?.id === row.id) cancelEdit()
      await loadRows()
      notify('Telegram destination removed.')
    } catch {
      notify('Could not remove Telegram destination.', false)
    }
  }

  const testDestination = async (row) => {
    try {
      const res = await api.post(`/telegram-destinations/${row.id}/test`)
      notify(res.data?.message || 'Telegram test message sent.')
    } catch (ex) {
      const msg = ex.response?.data?.message || 'Could not send test. Check bot token, chat ID, and topic ID.'
      notify(`Test failed: ${msg}`, false)
    }
  }

  return (
    <div className="grid gap-5">

      {/* Bot Token Configuration */}
      <SettingsCard
        title="Telegram Bot Token"
        description="Configure the bot token used to send all Telegram notifications. Set it here instead of the server .env file."
      >
        {/* Current status */}
        <div className={clsx(
          'flex items-center gap-3 rounded-xl border px-4 py-3',
          botStatus === null
            ? 'border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/60'
            : botStatus.verified
              ? 'border-emerald-200 bg-emerald-50 dark:border-emerald-900/50 dark:bg-emerald-950/20'
              : 'border-rose-200 bg-rose-50 dark:border-rose-900/50 dark:bg-rose-950/20',
        )}>
          <div className={clsx(
            'grid h-10 w-10 shrink-0 place-items-center rounded-xl',
            botStatus?.verified ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/50 dark:text-emerald-400' : 'bg-rose-100 text-rose-500 dark:bg-rose-900/50 dark:text-rose-400',
          )}>
            <Bot size={20} />
          </div>
          <div className="min-w-0 flex-1">
            {botStatus === null && <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">Checking bot status…</p>}
            {botStatus?.verified && (
              <>
                <p className="text-sm font-bold text-emerald-700 dark:text-emerald-400">✅ Bot connected</p>
                <p className="text-xs text-emerald-600 dark:text-emerald-500">
                  {botStatus.bot?.first_name || botStatus.bot?.name} · @{botStatus.bot?.username} · Source: {botStatus.source}
                </p>
              </>
            )}
            {botStatus && !botStatus.verified && (
              <>
                <p className="text-sm font-bold text-rose-700 dark:text-rose-400">❌ Bot not connected</p>
                <p className="text-xs text-rose-500 dark:text-rose-400">{botStatus.error || 'No token configured.'}</p>
              </>
            )}
          </div>
          <button
            onClick={loadTokenStatus}
            className="shrink-0 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
          >
            Re-check
          </button>
        </div>

        {/* Token input */}
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200">
            {botStatus?.source === 'database' ? 'Update Bot Token' : 'Enter Bot Token'}
          </label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                type={showToken ? 'text' : 'password'}
                className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 pr-10 font-mono text-sm outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                placeholder="1234567890:AAHxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowToken((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                {showToken ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <button
              onClick={saveToken}
              disabled={tokenSaving || !tokenInput.trim()}
              className="inline-flex h-11 items-center gap-2 rounded-lg bg-emerald-600 px-5 text-sm font-semibold text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-700 disabled:opacity-50"
            >
              <Bot size={15} />
              {tokenSaving ? 'Saving…' : 'Save & Verify'}
            </button>
          </div>
          <p className="text-xs text-slate-400 dark:text-slate-500">
            Get your bot token from <strong>@BotFather</strong> on Telegram. Format: <code className="rounded bg-slate-100 px-1 dark:bg-slate-800">123456:ABCxxx…</code>
          </p>
        </div>
      </SettingsCard>

      <SettingsCard
        title={editingRow ? `Editing: ${editingRow.name}` : 'Telegram Destinations'}
        description={editingRow ? 'Update the fields below and click Save to apply changes.' : 'Send each notification type to a different Telegram group or forum topic.'}
      >
        <div className="grid gap-4 lg:grid-cols-[1fr_1fr_1fr_1fr_auto]">
          <Field label="Name" value={form.name} onChange={(event) => updateField('name', event.target.value)} placeholder="Daily attendance group" />
          <SelectField label="Purpose" value={form.event_key} onChange={(event) => updateField('event_key', event.target.value)} options={telegramEvents.map((event) => event.label)} values={telegramEvents.map((event) => event.value)} />
          <Field label="Group / Chat ID" value={form.chat_id} onChange={(event) => updateField('chat_id', event.target.value)} placeholder="-1001234567890" />
          <Field label="Topic ID" value={form.message_thread_id} onChange={(event) => updateField('message_thread_id', event.target.value)} placeholder="Optional" type="number" />
          <div className="flex items-end gap-2">
            <button className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60" onClick={saveDestination} disabled={saving} type="button">
              <Save size={16} />
              {saving ? 'Saving...' : editingRow ? 'Update' : 'Add'}
            </button>
            {editingRow && (
              <button className="inline-flex h-11 items-center justify-center rounded-lg border border-slate-300 px-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800" onClick={cancelEdit} type="button">
                Cancel
              </button>
            )}
          </div>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400">Bot token still comes from TELEGRAM_BOT_TOKEN in .env. For Telegram forum topics, use the topic message_thread_id.</p>
      </SettingsCard>

      <SettingsCard title="Saved Groups & Topics" description="Enable, edit, test, or remove Telegram destinations.">
        {loading ? (
          <p className="text-sm text-slate-500 dark:text-slate-400">Loading Telegram destinations...</p>
        ) : rows.length === 0 ? (
          <EmptyState text="No Telegram destinations yet." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500 dark:bg-slate-950 dark:text-slate-400">
                <tr>
                  {['Name', 'Purpose', 'Chat ID', 'Topic ID', 'Status', 'Actions'].map((head) => <th key={head} className="px-4 py-3">{head}</th>)}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {rows.map((row) => (
                  <tr key={row.id} className={clsx(editingRow?.id === row.id && 'bg-amber-50 dark:bg-amber-950/20')}>
                    <td className="px-4 py-3 font-semibold text-slate-900 dark:text-slate-100">{row.name}</td>
                    <td className="px-4 py-3">{telegramEvents.find((event) => event.value === row.event_key)?.label || row.event_key}</td>
                    <td className="px-4 py-3 font-mono text-xs">{row.chat_id || '-'}</td>
                    <td className="px-4 py-3 font-mono text-xs">{row.message_thread_id || '-'}</td>
                    <td className="px-4 py-3">
                      <button className={clsx('rounded-full px-3 py-1 text-xs font-bold', row.enabled ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500')} onClick={() => toggleDestination(row)} type="button">
                        {row.enabled ? 'Enabled' : 'Disabled'}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button className="rounded-lg border border-sky-200 px-3 py-1.5 text-xs font-semibold text-sky-600 hover:bg-sky-50 dark:border-sky-800 dark:text-sky-400 dark:hover:bg-sky-950/30" onClick={() => startEdit(row)} type="button">Edit</button>
                        <button className="rounded-lg border border-emerald-200 px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-50" onClick={() => testDestination(row)} type="button">Test</button>
                        <button className="rounded-lg border border-rose-200 px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50" onClick={() => removeDestination(row)} type="button">Remove</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SettingsCard>
    </div>
  )
}

function EmailNotifications() {
  return (
    <SettingsCard title="Email Notifications" description="Configure email delivery for reports and important alerts.">
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="SMTP Host" placeholder="smtp.your-domain.com" />
        <Field label="SMTP Port" placeholder="587" />
        <Field label="Sender Email" placeholder="noreply@your-domain.com" />
        <Field label="Sender Name" placeholder="Sender name" />
      </div>
      <ToggleRow title="Send Daily Attendance Summary" description="Email managers every evening." enabled />
    </SettingsCard>
  )
}

function GoogleMapsSettings() {
  return (
    <SettingsCard title="Google Maps API" description="Power live maps, route history, and GPS radius preview.">
      <Field label="Google Maps API Key" type="password" placeholder="API key" />
      <ToggleRow title="Route Tracking" description="Draw employee outdoor sales route history." enabled />
      <div className="grid min-h-44 place-items-center rounded-lg border border-slate-200 bg-slate-50 text-sm font-semibold text-slate-500 dark:border-slate-800 dark:bg-slate-950">
        GPS Radius Preview
      </div>
    </SettingsCard>
  )
}

function CloudflareR2Settings() {
  return (
    <SettingsCard title="Cloudflare R2 Storage" description="Store attendance selfies and customer visit photos.">
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Access Key" type="password" placeholder="Access key" />
        <Field label="Secret Key" type="password" placeholder="Secret key" />
        <Field label="Bucket Name" placeholder="Bucket name" />
        <Field label="Public URL" placeholder="https://..." />
        <Field label="Upload Limit" suffix="MB" type="number" placeholder="4" />
      </div>
    </SettingsCard>
  )
}

function SecuritySettings({ settings, onUpdate }) {
  return (
    <SettingsCard title="Security Settings" description="Login protection, sessions, and device security.">
      <div className="grid gap-4 md:grid-cols-3">
        <Field label="JWT Expiration" suffix="minutes" type="number" placeholder="120" settingKey="jwt_expiration" settings={settings} onUpdate={onUpdate} />
        <Field label="Login Attempt Limit" type="number" placeholder="5" settingKey="login_attempt_limit" settings={settings} onUpdate={onUpdate} />
        <Field label="Session Timeout" suffix="minutes" type="number" placeholder="60" settingKey="session_timeout" settings={settings} onUpdate={onUpdate} />
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <ToggleRow title="Device Restriction" description="Limit login to approved devices." settingKey="device_restriction" settings={settings} onUpdate={onUpdate} />
        <ToggleRow title="Two Factor Authentication" description="Require second-factor login for admins." settingKey="two_factor_auth" settings={settings} onUpdate={onUpdate} />
      </div>
    </SettingsCard>
  )
}

function RolesPermissions() {
  return (
    <SettingsCard title="Roles & Permissions" description="Manage roles and permissions for your organization.">
      <EmptyState text="Use the Users & Roles page to manage role permissions." />
    </SettingsCard>
  )
}

function BackupRestore({ notify }) {
  return (
    <div className="grid gap-5 lg:grid-cols-3">
      <ActionCard icon={Download} title="Backup Database" description="Download the latest database backup." action="Backup Now" onAction={() => notify('Backup request is ready. Backend backup endpoint is needed to download a real file.')} />
      <ActionCard icon={Upload} title="Restore Database" description="Upload and restore a database backup." action="Restore" onAction={() => notify('Restore request is ready. Backend restore endpoint is needed before upload can run.')} />
      <SettingsCard title="Auto Backup Schedule" description="Automate recurring database backups.">
        <SelectField label="Schedule" placeholder="Select schedule" options={['Daily at midnight', 'Weekly', 'Monthly', 'Disabled']} />
      </SettingsCard>
    </div>
  )
}

function SystemLogs() {
  return (
    <SettingsCard title="System Logs" description="Monitor system activity, errors, and API usage.">
      <EmptyState text="No log entries yet. Logs will appear when the logging API is connected." />
    </SettingsCard>
  )
}

function AboutSystem() {
  return (
    <SettingsCard title="About System" description="Employee Attendance & Outdoor Sales Tracking System.">
      <div className="grid gap-4 md:grid-cols-3">
        <InfoTile label="Version" value="1.0.0" />
        <InfoTile label="Backend" value="Laravel API" />
        <InfoTile label="Frontend" value="React + Tailwind" />
      </div>
      <div className="rounded-lg bg-emerald-50 p-4 text-sm text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-200">
        <p className="font-semibold">System ready for attendance, GPS tracking, reports, notifications, and storage integrations.</p>
      </div>
    </SettingsCard>
  )
}

function SettingsCard({ title, description, children }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-5">
        <h4 className="text-base font-bold text-slate-950 dark:text-white">{title}</h4>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{description}</p>
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  )
}

function Field({ label, type = 'text', defaultValue = '', value, onChange, placeholder = '', suffix, settingKey, settings, onUpdate }) {
  const isControlledBySetting = settingKey !== undefined && settings !== undefined
  const inputProps = isControlledBySetting
    ? { value: settings[settingKey] ?? defaultValue, onChange: (e) => onUpdate(settingKey, e.target.value) }
    : value !== undefined ? { value, onChange } : { defaultValue }

  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-200">{label}</span>
      <div className="flex overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm focus-within:border-emerald-500 focus-within:ring-4 focus-within:ring-emerald-500/10 dark:border-slate-700 dark:bg-slate-950">
        <input className="h-11 min-w-0 flex-1 bg-transparent px-3 text-sm outline-none dark:text-white" type={type} placeholder={placeholder} {...inputProps} />
        {suffix && <span className="grid place-items-center border-l border-slate-200 bg-slate-50 px-3 text-xs font-bold text-slate-500 dark:border-slate-700 dark:bg-slate-900">{suffix}</span>}
      </div>
    </label>
  )
}

function SelectField({ label, defaultValue = '', value, onChange, placeholder = 'Select…', options, values, settingKey, settings, onUpdate }) {
  const isControlledBySetting = settingKey !== undefined && settings !== undefined
  const selectProps = isControlledBySetting
    ? { value: settings[settingKey] ?? defaultValue, onChange: (e) => onUpdate(settingKey, e.target.value) }
    : value !== undefined ? { value, onChange } : { defaultValue }

  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-200">{label}</span>
      <select className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 dark:border-slate-700 dark:bg-slate-950 dark:text-white" {...selectProps}>
        <option value="">{placeholder}</option>
        {options.map((option, index) => <option key={values?.[index] || option} value={values?.[index] || option}>{option}</option>)}
      </select>
    </label>
  )
}

function UploadField({ label, currentUrl, onUploaded }) {
  const [uploading, setUploading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState(currentUrl || '')
  const [uploadError, setUploadError] = useState('')

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0]
    if (!file) return
    event.target.value = ''
    setUploading(true)
    setUploadError('')
    try {
      const formData = new FormData()
      formData.append('logo', file)
      const res = await api.post('/settings/logo', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      const url = res.data.logo_url
      setPreviewUrl(url)
      onUploaded?.(url)
    } catch (err) {
      setUploadError(err.response?.data?.message || 'Upload failed. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="block">
      <span className="mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-200">{label}</span>
      <label className="block cursor-pointer">
        <input className="sr-only" type="file" accept="image/*" onChange={handleFileChange} disabled={uploading} />
        <div className="flex min-h-24 flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-slate-300 bg-slate-50 text-sm font-semibold text-slate-500 transition hover:border-emerald-400 hover:bg-emerald-50 dark:border-slate-700 dark:bg-slate-950 dark:hover:bg-emerald-950/20">
          {uploading ? (
            <span className="flex items-center gap-2 text-emerald-600"><Upload size={18} className="animate-bounce" />Uploading...</span>
          ) : previewUrl ? (
            <>
              <img src={previewUrl} alt="Logo preview" className="h-14 w-auto max-w-[160px] rounded object-contain" />
              <span className="text-xs text-slate-400">Click to replace</span>
            </>
          ) : (
            <span className="flex items-center gap-2"><Upload size={18} />Upload logo</span>
          )}
        </div>
      </label>
      {uploadError && <p className="mt-1.5 text-xs font-medium text-rose-600 dark:text-rose-400">{uploadError}</p>}
    </div>
  )
}

function ToggleRow({ title, description, enabled = false, settingKey, settings, onUpdate }) {
  const isControlledBySetting = settingKey !== undefined && settings !== undefined
  const [localChecked, setLocalChecked] = useState(enabled)
  const checked = isControlledBySetting ? settings[settingKey] === '1' : localChecked
  const toggle = isControlledBySetting
    ? () => onUpdate(settingKey, checked ? '0' : '1')
    : () => setLocalChecked((v) => !v)

  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border border-slate-200 p-4 dark:border-slate-800">
      <div>
        <p className="font-semibold text-slate-900 dark:text-white">{title}</p>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{description}</p>
      </div>
      <button className={clsx('relative h-7 w-12 shrink-0 rounded-full transition', checked ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700')} onClick={toggle} type="button" aria-pressed={checked}>
        <span className={clsx('absolute top-1 h-5 w-5 rounded-full bg-white shadow transition', checked ? 'left-6' : 'left-1')} />
      </button>
    </div>
  )
}

function ActionCard({ icon: Icon, title, description, action, onAction }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="grid h-11 w-11 place-items-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-300">
        <Icon size={21} />
      </div>
      <h4 className="mt-4 font-bold text-slate-950 dark:text-white">{title}</h4>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{description}</p>
      <button className="mt-5 inline-flex h-10 items-center gap-2 rounded-lg bg-emerald-600 px-4 text-sm font-semibold text-white transition hover:bg-emerald-700" onClick={onAction} type="button">
        <Check size={16} />
        {action}
      </button>
    </div>
  )
}

function InfoTile({ label, value }) {
  return (
    <div className="rounded-lg border border-slate-200 p-4 dark:border-slate-800">
      <p className="text-xs font-bold uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-2 font-bold text-slate-900 dark:text-white">{value}</p>
    </div>
  )
}
