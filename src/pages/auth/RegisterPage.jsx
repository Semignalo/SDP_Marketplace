import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'

export default function RegisterPage() {
  const { register } = useAuth()
  const navigate     = useNavigate()
  const [form, setForm] = useState({
    name: '', email: '', password: '', password_confirmation: '', referral_code: '',
  })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)

  function handleChange(e) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setErrors({})
    setLoading(true)
    try {
      await register(
        form.name,
        form.email,
        form.password,
        form.password_confirmation,
        form.referral_code || null,
      )
      navigate('/')
    } catch (err) {
      const laravelErrors = err.response?.data?.errors ?? {}
      const fallback      = err.response?.data?.message ?? 'Pendaftaran gagal.'
      setErrors(Object.keys(laravelErrors).length ? laravelErrors : { general: [fallback] })
    } finally {
      setLoading(false)
    }
  }

  function fieldError(field) {
    return errors[field]?.[0] ?? null
  }

  const fields = [
    { label: 'Nama Lengkap',          name: 'name',                  type: 'text',     required: true },
    { label: 'Email',                  name: 'email',                 type: 'email',    required: true },
    { label: 'Password',               name: 'password',              type: 'password', required: true },
    { label: 'Konfirmasi Password',    name: 'password_confirmation', type: 'password', required: true },
    { label: 'Kode Referral (opsional)', name: 'referral_code',      type: 'text',     required: false },
  ]

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-10">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow p-8">
        <h1 className="text-2xl font-bold mb-6 text-center">Daftar Akun</h1>

        {fieldError('general') && (
          <div className="mb-4 rounded-lg bg-red-50 border border-red-200 text-red-700 px-4 py-2 text-sm">
            {fieldError('general')}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {fields.map(({ label, name, type, required }) => (
            <div key={name}>
              <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
              <input
                type={type}
                name={name}
                value={form[name]}
                onChange={handleChange}
                required={required}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {fieldError(name) && (
                <p className="mt-1 text-xs text-red-600">{fieldError(name)}</p>
              )}
            </div>
          ))}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Memproses...' : 'Daftar'}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-gray-500">
          Sudah punya akun?{' '}
          <Link to="/login" className="text-blue-600 hover:underline">Masuk</Link>
        </p>
      </div>
    </div>
  )
}
