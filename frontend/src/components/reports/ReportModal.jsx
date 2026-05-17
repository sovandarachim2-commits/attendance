 
import { useState } from 'react'
import { api } from '../../services/api'
import { ErrorText, FormInput, SimpleModal, SubmitButton } from '../shared/UI'
import { apiError } from '../../utils/format'

export default function ReportModal({ onClose, onSaved }) {
  const [form, setForm] = useState({
    report_date: new Date().toISOString().slice(0, 10),
    type: 'daily',
    title: '',
    content: '',
    orders_collected: '',
  })
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const submit = async (event) => {
    event.preventDefault()
    setSaving(true)
    setError('')
    try {
      await api.post('/reports', {
        report_date: form.report_date,
        type: form.type,
        title: form.title,
        content: form.content,
        metrics: {
          orders_collected: Number(form.orders_collected || 0),
        },
      })
      onSaved()
    } catch (exception) {
      setError(apiError(exception))
    } finally {
      setSaving(false)
    }
  }

  return (
    <SimpleModal title="Add Report" subtitle="Submit a real report." onClose={onClose}>
      <form className="grid gap-3" onSubmit={submit}>
        <FormInput label="Report Date" type="date" value={form.report_date} onChange={(value) => setForm({ ...form, report_date: value })} required />
        <label className="text-sm font-semibold">Type</label>
        <select className="rounded-lg border border-slate-200 px-3 py-2 dark:border-slate-700 dark:bg-slate-950" value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value })}>
          <option value="daily">Daily</option>
          <option value="weekly">Weekly</option>
          <option value="monthly">Monthly</option>
          <option value="visit">Visit</option>
        </select>
        <FormInput label="Title" value={form.title} onChange={(value) => setForm({ ...form, title: value })} required />
        <FormInput label="Orders Collected" type="number" value={form.orders_collected} onChange={(value) => setForm({ ...form, orders_collected: value })} />
        <label className="text-sm font-semibold">Content</label>
        <textarea className="min-h-32 rounded-lg border border-slate-200 px-3 py-2 dark:border-slate-700 dark:bg-slate-950" value={form.content} onChange={(event) => setForm({ ...form, content: event.target.value })} required />
        {error && <ErrorText text={error} />}
        <SubmitButton saving={saving} label="Submit Report" />
      </form>
    </SimpleModal>
  )
}

