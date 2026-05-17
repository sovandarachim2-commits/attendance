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

export default function DepartmentsPage() {
  const [departments, setDepartments] = useState([])
  const [editing, setEditing] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', code: '', description: '', status: 'active' })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const loadDepartments = useCallback(async () => {
    const response = await api.get('/departments')
    setDepartments(response.data || [])
    setLoading(false)
  }, [])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      loadDepartments().catch(() => {
        setError('Cannot load departments. Please check API server.')
        setLoading(false)
      })
    }, 0)

    return () => window.clearTimeout(timer)
  }, [loadDepartments])

  const resetForm = () => {
    setEditing(null)
    setShowForm(false)
    setForm({ name: '', code: '', description: '', status: 'active' })
  }

  const submit = async (event) => {
    event.preventDefault()
    setSaving(true)
    setError('')

    try {
      if (editing) {
        await api.put(`/departments/${editing.id}`, form)
      } else {
        await api.post('/departments', form)
      }
      resetForm()
      await loadDepartments()
    } catch (exception) {
      setError(apiError(exception))
    } finally {
      setSaving(false)
    }
  }

  const editDepartment = (department) => {
    setEditing(department)
    setShowForm(true)
    setForm({
      name: department.name || '',
      code: department.code || '',
      description: department.description || '',
      status: department.status || 'active',
    })
  }

  const deleteDepartment = async (department) => {
    if (!confirm(`Delete department ${department.name}?`)) return
    await api.delete(`/departments/${department.id}`)
    await loadDepartments()
  }

  return (
    <>
      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <PanelHeader
          title="Department List"
          subtitle="Manage your company departments."
          actionLabel="Add Department"
          onAction={() => {
            setEditing(null)
            setForm({ name: '', code: '', description: '', status: 'active' })
            setShowForm(true)
          }}
        />
        {loading ? <EmptyState text="Loading departments..." /> : departments.length === 0 ? <EmptyState text="No departments found yet." /> : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500 dark:bg-slate-950 dark:text-slate-400">
                <tr>{['Code', 'Department', 'Description', 'Status', 'Actions'].map((head) => <th key={head} className="px-5 py-3">{head}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {departments.map((department) => (
                  <tr key={department.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/60">
                    <td className="px-5 py-4">{department.code}</td>
                    <td className="px-5 py-4 font-semibold">{department.name}</td>
                    <td className="max-w-xs truncate px-5 py-4 text-slate-500 dark:text-slate-400">{department.description || '-'}</td>
                    <td className="px-5 py-4"><StatusPill status={titleCase(department.status)} /></td>
                    <td className="px-5 py-4">
                      <button className="mr-2 rounded-lg bg-sky-50 px-3 py-1.5 text-xs font-semibold text-sky-700" onClick={() => editDepartment(department)}>Edit</button>
                      <button className="rounded-lg bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700" onClick={() => deleteDepartment(department)}>Delete</button>
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
          title={editing ? 'Edit Department' : 'Add Department'}
          subtitle="Departments organize employees and positions."
          onClose={resetForm}
        >
          <form className="grid gap-3" onSubmit={submit}>
            <FormInput label="Department Name" value={form.name} onChange={(value) => setForm({ ...form, name: value })} required />
            <FormInput label="Department Code" value={form.code} onChange={(value) => setForm({ ...form, code: value })} required />
            <FormTextarea label="Description" value={form.description} onChange={(value) => setForm({ ...form, description: value })} />
            <FormSelect label="Status" value={form.status} onChange={(value) => setForm({ ...form, status: value })} required>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </FormSelect>
            {error && <ErrorText text={error} />}
            <SubmitButton saving={saving} label={editing ? 'Update Department' : 'Save Department'} />
          </form>
        </SimpleModal>
      )}
    </>
  )
}

