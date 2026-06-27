import { useEffect, useRef, useState } from 'react'
import { Upload, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useVendorProfile, useUpdateVendorProfile } from '../../hooks/useVendor'
import { Button, Input, Textarea, Skeleton } from '../../components/ui'
import { api, extractErrorMessage } from '../../lib/api'

const EMPTY = { name: '', logo: '', description: '', email: '', phone: '' }

export default function VendorProfilePage() {
  const { data: profile, isLoading } = useVendorProfile()
  const update = useUpdateVendorProfile()

  const [form, setForm] = useState(EMPTY)
  const [errors, setErrors] = useState({})
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const logoRef = useRef(null)

  useEffect(() => {
    if (profile) {
      setForm({
        name: profile.name || '',
        logo: profile.logo || '',
        description: profile.description || '',
        email: profile.email || '',
        phone: profile.phone || '',
      })
    }
  }, [profile])

  const handleLogoUpload = async (file) => {
    if (!file) return
    setUploadingLogo(true)
    try {
      const fd = new FormData()
      fd.append('image', file)
      const res = await api.post('/upload/image', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      setForm((f) => ({ ...f, logo: res.data.url }))
    } catch (err) {
      toast.error(`Failed to upload logo: ${extractErrorMessage(err)}`)
    } finally {
      setUploadingLogo(false)
    }
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setErrors({})
    try {
      await update.mutateAsync(form)
      toast.success('Vendor profile updated')
    } catch (err) {
      const apiErrors = err.response?.data?.errors
      if (apiErrors) {
        const map = {}
        Object.entries(apiErrors).forEach(([k, v]) => (map[k] = Array.isArray(v) ? v[0] : v))
        setErrors(map)
      } else {
        toast.error(extractErrorMessage(err))
      }
    }
  }

  if (isLoading) {
    return <div className="space-y-3"><Skeleton className="h-8 w-1/3" /><Skeleton className="h-40 w-full" /></div>
  }

  return (
    <div className="space-y-8">
      <section className="bg-paper border border-line rounded-lg p-5 lg:p-6">
        <header className="mb-5">
          <h2 className="text-base font-semibold text-ink">Shop Profile</h2>
          <p className="text-sm text-ink-muted mt-1">This info is shown to customers on the public vendor page.</p>
        </header>

        <form onSubmit={handleSave} className="grid sm:grid-cols-2 gap-5">
          <div className="sm:col-span-2 flex items-center gap-5">
            <button
              type="button"
              onClick={() => logoRef.current?.click()}
              disabled={uploadingLogo}
              className="h-20 w-20 rounded-full bg-paper-warm border-2 border-dashed border-line overflow-hidden shrink-0 flex items-center justify-center hover:border-ink-muted transition-colors group relative disabled:opacity-60"
              title="Click to change logo"
              aria-label="Click to change logo"
            >
              {form.logo ? (
                <img src={form.logo} alt="logo" className="h-full w-full object-cover" onError={(e) => { e.currentTarget.style.opacity = 0.2 }} />
              ) : (
                <span className="eyebrow">Logo</span>
              )}
              <div className="absolute inset-0 bg-ink/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                {uploadingLogo
                  ? <Loader2 size={18} className="text-white animate-spin" />
                  : <Upload size={18} className="text-white" />
                }
              </div>
            </button>
            <input
              ref={logoRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="sr-only"
              onChange={(e) => handleLogoUpload(e.target.files?.[0])}
            />
            <div className="flex-1">
              <Input
                label="Logo URL"
                value={form.logo}
                onChange={(e) => setForm({ ...form, logo: e.target.value })}
                placeholder="https://... or click the circle to upload"
                error={errors.logo}
              />
            </div>
          </div>

          <div className="sm:col-span-2">
            <Input label="Shop Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} error={errors.name} />
          </div>

          <Input label="Contact Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} error={errors.email} />
          <Input label="Phone Number" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} error={errors.phone} />

          <div className="sm:col-span-2">
            <Textarea
              label="Shop Description"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={5}
              error={errors.description}
              placeholder="Brand story, values, featured collections, etc."
            />
          </div>

          <div className="sm:col-span-2 flex justify-end gap-2 pt-2">
            <Button type="submit" loading={update.isPending}>Save Profile</Button>
          </div>
        </form>
      </section>

      <section className="bg-paper-soft border border-line rounded-lg p-5">
        <h3 className="eyebrow mb-3">Account Info</h3>
        <dl className="grid sm:grid-cols-2 gap-3 text-sm">
          <Row label="Vendor Slug" value={<code className="tabular-nums">{profile?.slug}</code>} />
          <Row label="Status" value={profile?.status} />
        </dl>
        <p className="mt-4 text-2xs text-ink-muted">
          Slug and commission rate can only be changed by an admin.
        </p>
      </section>
    </div>
  )
}

function Row({ label, value }) {
  return (
    <div>
      <dt className="eyebrow">{label}</dt>
      <dd className="text-sm text-ink mt-1">{value}</dd>
    </div>
  )
}
