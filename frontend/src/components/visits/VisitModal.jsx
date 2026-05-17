 
import { useState } from 'react'
import { api } from '../../services/api'
import { ErrorText, FormInput, SimpleModal, SubmitButton } from '../shared/UI'
import { apiError } from '../../utils/format'

export default function VisitModal({ onClose, onSaved }) {
  const [form, setForm] = useState({
    customer_name: '',
    store_name: '',
    contact_person: '',
    phone: '',
    address: '',
    latitude: '',
    longitude: '',
    notes: '',
  })
  const [selfie, setSelfie] = useState(null)
  const [storePhoto, setStorePhoto] = useState(null)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const useGps = () => {
    navigator.geolocation?.getCurrentPosition(
      (position) => setForm({
        ...form,
        latitude: String(position.coords.latitude),
        longitude: String(position.coords.longitude),
      }),
      () => setError('Cannot read GPS. Please allow location permission.'),
      { enableHighAccuracy: true },
    )
  }

  const submit = async (event) => {
    event.preventDefault()
    setSaving(true)
    setError('')
    const body = new FormData()
    Object.entries(form).forEach(([key, value]) => body.append(key, value))
    if (selfie) body.append('selfie', selfie)
    if (storePhoto) body.append('store_photo', storePhoto)

    try {
      await api.post('/customer-visits', body)
      onSaved()
    } catch (exception) {
      setError(apiError(exception))
    } finally {
      setSaving(false)
    }
  }

  return (
    <SimpleModal title="Add Customer Visit" subtitle="Create a real outdoor sales visit." onClose={onClose}>
      <form className="grid gap-3" onSubmit={submit}>
        <FormInput label="Customer Name" value={form.customer_name} onChange={(value) => setForm({ ...form, customer_name: value })} required />
        <FormInput label="Store Name" value={form.store_name} onChange={(value) => setForm({ ...form, store_name: value })} />
        <FormInput label="Address" value={form.address} onChange={(value) => setForm({ ...form, address: value })} />
        <button className="rounded-lg border border-emerald-200 px-3 py-2 text-sm font-semibold text-emerald-700" type="button" onClick={useGps}>Use Current GPS</button>
        <div className="grid gap-3 sm:grid-cols-2">
          <FormInput label="Latitude" value={form.latitude} onChange={(value) => setForm({ ...form, latitude: value })} required />
          <FormInput label="Longitude" value={form.longitude} onChange={(value) => setForm({ ...form, longitude: value })} required />
        </div>
        <label className="text-sm font-semibold">Selfie</label>
        <input className="rounded-lg border border-slate-200 px-3 py-2 dark:border-slate-700 dark:bg-slate-950" type="file" accept="image/*" capture="user" onChange={(event) => setSelfie(event.target.files?.[0] || null)} required />
        <label className="text-sm font-semibold">Store Photo</label>
        <input className="rounded-lg border border-slate-200 px-3 py-2 dark:border-slate-700 dark:bg-slate-950" type="file" accept="image/*" capture="environment" onChange={(event) => setStorePhoto(event.target.files?.[0] || null)} required />
        {error && <ErrorText text={error} />}
        <SubmitButton saving={saving} label="Save Visit" />
      </form>
    </SimpleModal>
  )
}

