import { useEffect, useRef, useState } from 'react'
import { Camera, CheckCircle2, Clock, Loader2, LogOut, MapPin, Navigation, ShieldCheck, X, XCircle } from 'lucide-react'
import clsx from 'clsx'
import { attendanceService } from '../../services/api'
import { reverseGeocode } from '../../utils/geocode'

export default function AttendanceActionModal({ action, user, onClose, onSaved }) {
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const streamRef = useRef(null)
  const locationAlertShownRef = useRef(false)

  const [gpsStatus, setGpsStatus]       = useState('idle') // idle | requesting | granted | denied
  const [cameraStatus, setCameraStatus] = useState('requesting')
  const [coords, setCoords]             = useState(null)
  const [address, setAddress]           = useState('')
  const [addressLoading, setAddressLoading] = useState(false)
  const [photoBlob, setPhotoBlob]       = useState(null)
  const [photoPreview, setPhotoPreview] = useState('')
  const [submitting, setSubmitting]     = useState(false)
  const [error, setError]               = useState('')

  const isCheckIn = action === 'check-in'
  const faceVerificationEnabled = Boolean(user?.employee?.require_face_verification)
    || import.meta.env.VITE_FACE_VERIFICATION_ENABLED === 'true'
  const canSubmit = gpsStatus === 'granted'
    && (!faceVerificationEnabled || (cameraStatus === 'granted' && Boolean(photoBlob)))
    && !submitting

  /* ── Request camera ──────────────────────────────────────────── */
  useEffect(() => {
    if (!faceVerificationEnabled) {
      setCameraStatus('granted')
      return undefined
    }

    let active = true
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: 'user' }, audio: false })
      .then((stream) => {
        if (!active) { stream.getTracks().forEach((t) => t.stop()); return }
        streamRef.current = stream
        if (videoRef.current) videoRef.current.srcObject = stream
        setCameraStatus('granted')
      })
      .catch(() => { if (active) setCameraStatus('denied') })

    return () => {
      active = false
      streamRef.current?.getTracks().forEach((t) => t.stop())
    }
  }, [faceVerificationEnabled])

  /* ── Request GPS ─────────────────────────────────────────────── */
  const requestGps = () => {
    if (!navigator.geolocation) {
      setGpsStatus('denied')
      setError('This browser does not support GPS. Try Chrome or Edge on a phone or laptop with location enabled.')
      return
    }
    if (gpsStatus === 'requesting') return

    setGpsStatus('requesting')
    setError('')

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const nextCoords = {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          speed: pos.coords.speed || 0,
        }
        setCoords(nextCoords)
        setGpsStatus('granted')
        setAddressLoading(true)
        setAddress('')
        try {
          const label = await reverseGeocode(nextCoords.latitude, nextCoords.longitude)
          setAddress(label)
        } catch {
          setAddress(`${nextCoords.latitude.toFixed(6)}, ${nextCoords.longitude.toFixed(6)}`)
        } finally {
          setAddressLoading(false)
        }
      },
      (err) => {
        setGpsStatus('denied')
        let message = 'Could not get your location. Turn on Location Services and tap Current Location again.'
        if (err.code === 1) {
          message = 'Location blocked. Allow location for this site in your browser, then tap Current Location again.'
        } else if (err.code === 3) {
          message = 'Location timed out. Turn on device location, move near a window, and tap Current Location again.'
        }
        setError(message)
        if (!locationAlertShownRef.current) {
          locationAlertShownRef.current = true
          window.alert(message)
        }
      },
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 },
    )
  }

  useEffect(() => {
    requestGps()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => () => { if (photoPreview) URL.revokeObjectURL(photoPreview) }, [photoPreview])

  /* ── Capture photo ───────────────────────────────────────────── */
  const capturePhoto = () => {
    const video  = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas) return

    canvas.width  = video.videoWidth  || 720
    canvas.height = video.videoHeight || 720
    canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height)

    canvas.toBlob((blob) => {
      if (!blob) return
      if (photoPreview) URL.revokeObjectURL(photoPreview)
      setPhotoBlob(blob)
      setPhotoPreview(URL.createObjectURL(blob))
    }, 'image/jpeg', 0.9)
  }

  /* ── Submit ──────────────────────────────────────────────────── */
  const submitAttendance = async () => {
    if (!coords) { setError('Location is required.'); return }
    if (faceVerificationEnabled && !photoBlob) { setError('Photo is required.'); return }

    setSubmitting(true)
    setError('')

    const fd = new FormData()
    fd.append('latitude',  coords.latitude)
    fd.append('longitude', coords.longitude)
    fd.append('accuracy',  coords.accuracy || '')
    fd.append('speed',     coords.speed    || 0)
    if (address) fd.append('address', address)
    if (faceVerificationEnabled && photoBlob) fd.append('photo', photoBlob, `${action}-${Date.now()}.jpg`)

    if (isCheckIn) {
      fd.append('type',  'office')
      fd.append('notes', 'Submitted from web attendance.')
    }

    try {
      if (isCheckIn) await attendanceService.checkIn(fd)
      else           await attendanceService.checkOut(fd)
      onSaved()
    } catch (ex) {
      const errs = ex.response?.data?.errors
      const msg  = ex.response?.data?.message
      setError(errs ? Object.values(errs).flat().join(' ') : msg || 'Attendance submission failed.')
    } finally {
      setSubmitting(false)
    }
  }

  const accentClass = isCheckIn
    ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/25'
    : 'bg-amber-500  hover:bg-amber-600  shadow-amber-500/25'

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/70 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-slate-900">

        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className={clsx('grid h-10 w-10 place-items-center rounded-xl',
              isCheckIn ? 'bg-emerald-100 dark:bg-emerald-950/50' : 'bg-amber-100 dark:bg-amber-950/50')}>
              {isCheckIn ? <Clock size={20} className="text-emerald-600" /> : <LogOut size={20} className="text-amber-600" />}
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-slate-100">{isCheckIn ? 'Check In' : 'Check Out'}</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {faceVerificationEnabled ? 'Your live location + selfie required' : 'Your live location is required'}
              </p>
            </div>
          </div>
          <button
            className="grid h-9 w-9 place-items-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
            onClick={onClose}
          >
            <X size={17} />
          </button>
        </div>

        <div className="space-y-4 p-5">

          {/* Permission status cards */}
          <div className={clsx('grid gap-3', faceVerificationEnabled ? 'grid-cols-2' : 'grid-cols-1')}>
            <PermissionCard
              icon={MapPin}
              label="Current Location"
              status={gpsStatus}
              desc={
                gpsStatus === 'granted' && addressLoading ? 'Getting address…'
                  : gpsStatus === 'granted' && address ? 'Address ready'
                  : gpsStatus === 'granted'      ? 'Location captured'
                  : gpsStatus === 'denied'     ? 'Tap to try again'
                  : gpsStatus === 'requesting' ? 'Allow location when asked…'
                  : 'Starting current location…'
              }
              onTap={gpsStatus !== 'granted' && gpsStatus !== 'requesting' ? requestGps : undefined}
            />
            {faceVerificationEnabled && (
              <PermissionCard
                icon={Camera}
                label="Camera"
                status={cameraStatus}
                desc={
                  cameraStatus === 'granted'  ? 'Camera ready'
                    : cameraStatus === 'denied' ? 'Permission denied'
                    : 'Opening camera…'
                }
              />
            )}
          </div>

          {gpsStatus === 'denied' && (
            <LocationHelpCard error={error} onRetry={requestGps} />
          )}

          {/* Current address from GPS */}
          {coords && (
            <div className="rounded-lg bg-emerald-50 px-3 py-3 text-xs dark:bg-emerald-950/20">
              <div className="flex items-start gap-2">
                <MapPin size={14} className="mt-0.5 shrink-0 text-emerald-600" />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-emerald-800 dark:text-emerald-300">Current location</p>
                  {addressLoading ? (
                    <p className="mt-1 text-emerald-700 dark:text-emerald-400">Looking up your address…</p>
                  ) : (
                    <p className="mt-1 leading-relaxed text-emerald-700 dark:text-emerald-400">{address || 'Address unavailable'}</p>
                  )}
                  <p className="mt-2 font-mono text-[10px] text-emerald-600/80 dark:text-emerald-500">
                    {coords.latitude.toFixed(6)}, {coords.longitude.toFixed(6)} · ±{Math.round(coords.accuracy || 0)} m
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* IP restriction notice */}
          <div className="flex items-start gap-2.5 rounded-xl border border-sky-200 bg-sky-50 px-3.5 py-3 text-xs text-sky-700 dark:border-sky-900/40 dark:bg-sky-950/20 dark:text-sky-400">
            <ShieldCheck size={14} className="mt-0.5 shrink-0 text-sky-500" />
            <span>
              Your role must be connected to the <strong>office Wi-Fi or an approved network</strong>.
              If your role has no IP configured, check-in/out will be blocked — contact your administrator.
            </span>
          </div>

          {faceVerificationEnabled && (
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-950 dark:border-slate-700">
              {photoPreview
                ? <img className="h-64 w-full object-cover" src={photoPreview} alt="Attendance selfie" />
                : <video ref={videoRef} className="h-64 w-full object-cover" autoPlay playsInline muted />
              }
              <canvas ref={canvasRef} className="hidden" />
            </div>
          )}

          {/* Action buttons */}
          <div className={clsx('grid gap-2', faceVerificationEnabled && 'sm:grid-cols-2')}>
            {faceVerificationEnabled && (
              <button
                onClick={capturePhoto}
                disabled={cameraStatus !== 'granted'}
                className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                <Camera size={16} />
                {photoPreview ? 'Retake Photo' : 'Take Selfie'}
              </button>
            )}

            <button
              onClick={submitAttendance}
              disabled={!canSubmit}
              className={clsx(
                'flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-white shadow-lg transition disabled:cursor-not-allowed disabled:opacity-50',
                accentClass,
              )}
            >
              {submitting
                ? <><Loader2 size={16} className="animate-spin" /> Submitting…</>
                : <><CheckCircle2 size={16} /> {isCheckIn ? 'Submit Check In' : 'Submit Check Out'}</>
              }
            </button>
          </div>

          {/* Server error */}
          {error && gpsStatus !== 'denied' && (
            <div className="flex items-start gap-2.5 rounded-xl bg-rose-50 p-3.5 text-sm text-rose-700 dark:bg-rose-950/30 dark:text-rose-400">
              <XCircle size={16} className="mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Browser denied hint */}
          {faceVerificationEnabled && cameraStatus === 'denied' && (
            <p className="text-center text-xs text-slate-400 dark:text-slate-500">
              Permission denied? Click the lock icon in your browser address bar and allow access, then reload.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

/* ── Small permission status card ────────────────────────────── */
function LocationHelpCard({ error, onRetry }) {
  const openLocationSettings = () => {
    const userAgent = navigator.userAgent.toLowerCase()
    const isEdge = userAgent.includes('edg/')
    const isChrome = userAgent.includes('chrome') || userAgent.includes('crios')
    const settingsUrl = isEdge ? 'edge://settings/content/location' : isChrome ? 'chrome://settings/content/location' : null

    if (settingsUrl) {
      window.open(settingsUrl, '_blank')
      return
    }

    alert('Open your browser settings and allow Location permission for this site.')
  }

  const steps = [
    'Chrome / Edge: tap the lock icon beside the address, set Location to Allow, then refresh.',
    'Android: Settings > Location on, then App permissions > browser > Allow location.',
    'iPhone: Settings > Privacy & Security > Location Services on, then Safari/Chrome > Allow.',
  ]

  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-900 shadow-sm dark:border-amber-900/50 dark:bg-amber-950/25 dark:text-amber-200">
      <div className="flex items-start gap-3">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
          <Navigation size={18} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-bold">Turn on location to continue</p>
          <p className="mt-1 text-sm leading-5 text-amber-800 dark:text-amber-200/90">
            {error || 'Location permission is blocked for this site.'}
          </p>
          <div className="mt-3 space-y-2 text-xs leading-5 text-amber-800 dark:text-amber-100/90">
            {steps.map((step) => (
              <p key={step} className="rounded-lg bg-white/60 px-3 py-2 dark:bg-slate-950/25">{step}</p>
            ))}
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={openLocationSettings}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-amber-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-amber-700"
            >
              <Navigation size={15} />
              Open Location Settings
            </button>
            <button
              type="button"
              onClick={onRetry}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-amber-300 bg-white/70 px-4 text-sm font-semibold text-amber-800 shadow-sm transition hover:bg-white dark:bg-slate-950/20 dark:text-amber-100"
            >
              <MapPin size={15} />
              Try Again
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function PermissionCard({ icon: Icon, label, desc, status, onTap }) {
  const style = {
    idle: {
      wrap: 'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/20 cursor-pointer active:scale-95',
      icon: 'text-blue-500',
      dot:  'bg-blue-400 animate-pulse',
      text: 'text-blue-600 dark:text-blue-400 font-semibold',
    },
    requesting: {
      wrap: 'border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800',
      icon: 'text-slate-400',
      dot:  'bg-amber-400 animate-pulse',
      text: 'text-slate-500 dark:text-slate-400',
    },
    granted: {
      wrap: 'border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/20',
      icon: 'text-emerald-600',
      dot:  'bg-emerald-500',
      text: 'text-emerald-700 dark:text-emerald-400',
    },
    denied: {
      wrap: 'border-rose-200 bg-rose-50 dark:border-rose-800 dark:bg-rose-950/20',
      icon: 'text-rose-500',
      dot:  'bg-rose-500',
      text: 'text-rose-600 dark:text-rose-400',
    },
  }[status] || {}

  return (
    <div className={clsx('rounded-xl border p-3 transition', style.wrap)} onClick={onTap}>
      <div className="flex items-center justify-between">
        <Icon size={16} className={style.icon} />
        <span className={clsx('h-2 w-2 rounded-full', style.dot)} />
      </div>
      <p className="mt-2 text-xs font-bold text-slate-700 dark:text-slate-200">{label}</p>
      <p className={clsx('mt-0.5 truncate text-[10px]', style.text)}>{desc}</p>
    </div>
  )
}
