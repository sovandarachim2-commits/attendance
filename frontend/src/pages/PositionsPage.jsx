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

export default function PositionsPage() {
  const [positions, setPositions] = useState([])
  const [departments, setDepartments] = useState([])
  const [editing, setEditing] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ department_id: '', name: '', code: '', status: 'active' })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const loadPositions = useCallback(async () => {
    const [positionResponse, optionResponse] = await Promise.all([
      api.get('/positions'),
      api.get('/employee-options'),
    ])
    setPositions(positionResponse.data || [])
    setDepartments(optionResponse.data.departments || [])
    setLoading(false)
  }, [])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      loadPositions().catch(() => {
        setError('Cannot load positions. Please check API server.')
        setLoading(false)
      })
    }, 0)

    return () => window.clearTimeout(timer)
  }, [loadPositions])

  const resetForm = () => {
    setEditing(null)
    setShowForm(false)
    setForm({ department_id: '', name: '', code: '', status: 'active' })
  }

  const submit = async (event) => {
    event.preventDefault()
    setSaving(true)
    setError('')

    try {
      if (editing) {
        await api.put(`/positions/${editing.id}`, form)
      } else {
        await api.post('/positions', form)
      }
      resetForm()
      await loadPositions()
    } catch (exception) {
      setError(apiError(exception))
    } finally {
      setSaving(false)
    }
  }

  const editPosition = (position) => {
    setEditing(position)
    setShowForm(true)
    setForm({
      department_id: position.department_id || '',
      name: position.name || '',
      code: position.code || '',
      status: position.status || 'active',
    })
  }

  const deletePosition = async (position) => {
    if (!confirm(`Delete position ${position.name}?`)) return
    await api.delete(`/positions/${position.id}`)
    await loadPositions()
  }

  return (
    <>
      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <PanelHeader
          title="Position List"
          subtitle="Manage your company positions."
          actionLabel="Add Position"
          onAction={() => {
            setEditing(null)
            setForm({ department_id: '', name: '', code: '', status: 'active' })
            setShowForm(true)
          }}
        />
        {loading ? <EmptyState text="Loading positions..." /> : positions.length === 0 ? <EmptyState text="No positions found yet." /> : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500 dark:bg-slate-950 dark:text-slate-400">
                <tr>{['Code', 'Position', 'Department', 'Status', 'Actions'].map((head) => <th key={head} className="px-5 py-3">{head}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {positions.map((position) => (
                  <tr key={position.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/60">
                    <td className="px-5 py-4">{position.code}</td>
                    <td className="px-5 py-4 font-semibold">{position.name}</td>
                    <td className="px-5 py-4">{position.department?.name || '-'}</td>
                    <td className="px-5 py-4"><StatusPill status={titleCase(position.status)} /></td>
                    <td className="px-5 py-4">
                      <button className="mr-2 rounded-lg bg-sky-50 px-3 py-1.5 text-xs font-semibold text-sky-700" onClick={() => editPosition(position)}>Edit</button>
                      <button className="rounded-lg bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700" onClick={() => deletePosition(position)}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showForm && (
        <SimpleModal
          title={editing ? 'Edit Position' : 'Add Position'}
          subtitle="Positions are used when admin creates employees."
          onClose={resetForm}
        >
          <form className="grid gap-3" onSubmit={submit}>
            <FormSelect label="Department" value={form.department_id} onChange={(value) => setForm({ ...form, department_id: value })} required>
              <option value="">Select department</option>
              {departments.map((department) => <option key={department.id} value={department.id}>{department.name}</option>)}
            </FormSelect>
            <FormInput label="Position Name" value={form.name} onChange={(value) => setForm({ ...form, name: value })} required />
            <FormInput label="Position Code" value={form.code} onChange={(value) => setForm({ ...form, code: value })} required />
            <FormSelect label="Status" value={form.status} onChange={(value) => setForm({ ...form, status: value })} required>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </FormSelect>
            {error && <ErrorText text={error} />}
            <SubmitButton saving={saving} label={editing ? 'Update Position' : 'Save Position'} />
          </form>
        </SimpleModal>
      )}
    </>
  )
}

