export function formatTime(value) {
  if (!value) return '-'
  return new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}


export function formatDate(value) {
  if (!value) return '-'
  return new Date(value).toLocaleDateString()
}


export function formatRelativeTime(value) {
  if (!value) return '-'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '-'

  const seconds = Math.floor((Date.now() - date.getTime()) / 1000)
  if (seconds < 60) return 'Just now'
  if (seconds < 3600) return `${Math.floor(seconds / 60)} min ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hr ago`
  return formatDate(value)
}


export function titleCase(value) {
  if (!value) return '-'
  return String(value).replaceAll('_', ' ').replace(/\b\w/g, (char) => char.toUpperCase())
}


export function firstName(value) {
  return String(value || '').split(' ')[0] || 'User'
}


/** Build display name from employee parts without "null" or extra spaces. */
export function employeeFullName(employee, fallback = '-') {
  if (!employee) return fallback

  const name = [employee.first_name, employee.last_name]
    .filter((part) => part != null && String(part).trim() !== '')
    .join(' ')
    .trim()

  return name || fallback
}


export function formatAttendanceLocation(attendance, type = 'check_in') {
  if (!attendance) return '-'

  const address = attendance[`${type}_address`]
  if (address) return address

  const latitude = attendance[`${type}_latitude`]
  const longitude = attendance[`${type}_longitude`]
  if (latitude != null && longitude != null) {
    return `${Number(latitude).toFixed(5)}, ${Number(longitude).toFixed(5)}`
  }

  return '-'
}


export function attendanceLocationMapUrl(attendance, type = 'check_in') {
  if (!attendance) return ''

  const latitude = attendance[`${type}_latitude`]
  const longitude = attendance[`${type}_longitude`]
  if (latitude == null || longitude == null) return ''

  return `https://www.google.com/maps?q=${encodeURIComponent(`${latitude},${longitude}`)}`
}


export function userDisplayName(user, fallback = 'User') {
  if (!user) return fallback
  if (user.employee) return employeeFullName(user.employee, user.name || fallback)
  return user.name || fallback
}


export function initials(value) {
  return String(value || 'U').split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase()
}


export function userPermissions(user) {
  return new Set((user?.role?.permissions || []).map((permission) => permission.slug))
}


export function canAccess(user, permissions = []) {
  if (!permissions.length) return true
  if (user?.role?.slug === 'super_admin') return true

  const allowed = userPermissions(user)
  return permissions.some((permission) => allowed.has(permission))
}


export function canUpdateOwnProfile(user) {
  return canAccess(user, ['update_own_profile', 'update_profile'])
}


export function canUpdateAllProfiles(user) {
  return canAccess(user, ['update_all_profiles', 'edit_employee', 'manage_employees'])
}


export function normaliseChart(rows) {
  const grouped = {}
  rows.forEach((row) => {
    const date = formatDate(row.attendance_date)
    grouped[date] = grouped[date] || { date, present: 0, late: 0 }
    grouped[date][row.status] = Number(row.total)
  })
  return Object.values(grouped)
}


export function apiError(exception) {
  const errors = exception.response?.data?.errors
  if (errors) return Object.values(errors).flat().join(' ')
  return exception.response?.data?.message || 'Request failed.'
}
