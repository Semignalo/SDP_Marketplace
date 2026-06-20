import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { useAdminSettings, useUpdateAdminSettings } from '../../hooks/useAdmin'
import { Input, Textarea, Button, Skeleton } from '../../components/ui'
import { extractErrorMessage } from '../../lib/api'

export default function AdminSettingsPage() {
  const { data: settings = [], isLoading } = useAdminSettings()
  const update = useUpdateAdminSettings()

  const [values, setValues] = useState({})
  const [dirty, setDirty] = useState(false)

  useEffect(() => {
    if (settings.length > 0) {
      const map = {}
      settings.forEach((s) => { map[s.key] = s.value })
      setValues(map)
      setDirty(false)
    }
  }, [settings])

  const grouped = useMemo(() => {
    const groups = {}
    settings.forEach((s) => {
      if (!groups[s.group]) groups[s.group] = []
      groups[s.group].push(s)
    })
    return groups
  }, [settings])

  const handleChange = (key, value) => {
    setValues((v) => ({ ...v, [key]: value }))
    setDirty(true)
  }

  const handleSave = async () => {
    try {
      await update.mutateAsync(
        settings.map((s) => ({ key: s.key, value: String(values[s.key] ?? '') })),
      )
      toast.success('Pengaturan disimpan')
      setDirty(false)
    } catch (err) {
      toast.error(extractErrorMessage(err))
    }
  }

  if (isLoading) {
    return <div className="space-y-3"><Skeleton className="h-8 w-1/3" /><Skeleton className="h-40 w-full" /></div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-base font-semibold text-ink">Pengaturan</h2>
          <p className="text-sm text-ink-muted mt-1">Konfigurasi situs, komisi, ongkir, dll.</p>
        </div>
        <Button onClick={handleSave} loading={update.isPending} disabled={!dirty}>
          Simpan Perubahan
        </Button>
      </div>

      {Object.entries(grouped).map(([group, items]) => (
        <section key={group} className="bg-paper border border-line rounded-lg p-5">
          <h3 className="text-xs font-bold uppercase tracking-widest text-ink-muted mb-4">{group}</h3>
          <div className="grid sm:grid-cols-2 gap-5">
            {items.map((s) => (
              s.type === 'textarea' ? (
                <div key={s.key} className="sm:col-span-2">
                  <Textarea
                    label={s.label}
                    value={values[s.key] ?? ''}
                    onChange={(e) => handleChange(s.key, e.target.value)}
                    rows={3}
                  />
                  <p className="text-2xs text-ink-muted mt-1 tabular-nums">key: {s.key}</p>
                </div>
              ) : (
                <div key={s.key}>
                  <Input
                    label={s.label}
                    type={s.type === 'number' ? 'number' : 'text'}
                    value={values[s.key] ?? ''}
                    onChange={(e) => handleChange(s.key, e.target.value)}
                  />
                  <p className="text-2xs text-ink-muted mt-1 tabular-nums">key: {s.key}</p>
                </div>
              )
            ))}
          </div>
        </section>
      ))}

      <div className="flex justify-end">
        <Button onClick={handleSave} loading={update.isPending} disabled={!dirty}>
          Simpan Perubahan
        </Button>
      </div>
    </div>
  )
}
