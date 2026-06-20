import { useRef, useState } from 'react'
import { Upload, Link as LinkIcon, Loader2, Image as ImageIcon, X, GripVertical, Star } from 'lucide-react'
import { toast } from 'sonner'
import { api, extractErrorMessage } from '../lib/api'
import { Button, Input } from './ui'
import { cn } from '../lib/utils'

export default function ImagesEditor({ images, onChange, error }) {
  const [draft, setDraft]         = useState('')
  const [uploading, setUploading] = useState(false)
  const [tab, setTab]             = useState('upload')
  const [dragIdx, setDragIdx]     = useState(null)
  const [overIdx, setOverIdx]     = useState(null)
  const fileRef                   = useRef(null)
  const isFull                    = images.length >= 8

  /* ── Upload ── */
  const handleFiles = async (files) => {
    const remaining = 8 - images.length
    const batch = Array.from(files).slice(0, remaining)
    if (batch.length === 0) { toast.error('Maksimal 8 gambar'); return }
    if (files.length > remaining) toast.warning(`Hanya ${remaining} gambar pertama yang diupload`)
    setUploading(true)
    const results = []
    for (const file of batch) {
      const fd = new FormData()
      fd.append('image', file)
      try {
        const res = await api.post('/upload/image', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
        results.push(res.data.url)
      } catch (err) {
        toast.error(`Gagal upload ${file.name}: ${extractErrorMessage(err)}`)
      }
    }
    setUploading(false)
    if (results.length) onChange([...images, ...results])
  }

  /* ── URL ── */
  const addUrl = () => {
    const url = draft.trim()
    if (!url) return
    if (isFull) { toast.error('Maksimal 8 gambar'); return }
    onChange([...images, url])
    setDraft('')
  }

  /* ── Hapus ── */
  const remove = (i) => onChange(images.filter((_, idx) => idx !== i))

  /* ── Set Utama ── */
  const setPrimary = (i) => {
    if (i === 0) return
    const next = [...images]
    const [item] = next.splice(i, 1)
    next.unshift(item)
    onChange(next)
  }

  /* ── Drag reorder ── */
  const onDragStart = (i) => setDragIdx(i)
  const onDragOver  = (e, i) => { e.preventDefault(); setOverIdx(i) }
  const onDrop      = (i) => {
    if (dragIdx === null || dragIdx === i) { setDragIdx(null); setOverIdx(null); return }
    const next = [...images]
    const [item] = next.splice(dragIdx, 1)
    next.splice(i, 0, item)
    onChange(next)
    setDragIdx(null)
    setOverIdx(null)
  }
  const onDragEnd   = () => { setDragIdx(null); setOverIdx(null) }

  return (
    <div>
      <label className="block text-2xs font-bold uppercase tracking-widest text-ink-muted mb-2">
        Gambar Produk
      </label>

      {/* Tab */}
      <div className="flex gap-1 mb-3">
        <button type="button" onClick={() => setTab('upload')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium border transition-colors ${tab === 'upload' ? 'bg-ink text-white border-ink' : 'bg-paper border-line text-ink-muted hover:border-ink-muted'}`}>
          <Upload size={12} /> Upload File
        </button>
        <button type="button" onClick={() => setTab('url')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium border transition-colors ${tab === 'url' ? 'bg-ink text-white border-ink' : 'bg-paper border-line text-ink-muted hover:border-ink-muted'}`}>
          <LinkIcon size={12} /> Paste URL
        </button>
      </div>

      {tab === 'upload' ? (
        <>
          <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" multiple className="sr-only"
            onChange={(e) => handleFiles(e.target.files)} />
          <button type="button" disabled={isFull || uploading} onClick={() => fileRef.current?.click()}
            className="w-full border-2 border-dashed border-line rounded-lg p-5 text-center hover:border-ink-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
            {uploading
              ? <><Loader2 size={22} className="mx-auto text-ink-muted mb-1.5 animate-spin" /><p className="text-xs text-ink-muted">Mengupload...</p></>
              : <><Upload size={22} className="mx-auto text-ink-faint mb-1.5" strokeWidth={1.2} /><p className="text-xs text-ink-muted">Klik untuk pilih gambar<br /><span className="text-ink-muted">JPG, PNG, WebP · Maks 5 MB · {8 - images.length} slot tersisa</span></p></>
            }
          </button>
        </>
      ) : (
        <div className="flex gap-2">
          <Input placeholder="https://..." value={draft} onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addUrl() } }} disabled={isFull} />
          <Button type="button" variant="outline" onClick={addUrl} disabled={isFull}>Tambah</Button>
        </div>
      )}

      {error && <p className="text-xs text-state-danger mt-1">{error}</p>}

      {images.length > 0 ? (
        <>
          <p className="text-2xs text-ink-muted mt-3 mb-2">Drag untuk urutkan · Klik ★ untuk jadikan gambar utama</p>
          <ul className="grid grid-cols-4 gap-2">
            {images.map((url, i) => (
              <li
                key={`${url}-${i}`}
                draggable
                onDragStart={() => onDragStart(i)}
                onDragOver={(e) => onDragOver(e, i)}
                onDrop={() => onDrop(i)}
                onDragEnd={onDragEnd}
                className={cn(
                  'relative group rounded overflow-hidden border transition-all cursor-grab active:cursor-grabbing',
                  overIdx === i && dragIdx !== i ? 'border-ink scale-105 shadow-md' : 'border-line',
                  dragIdx === i && 'opacity-40',
                )}
              >
                <div className="aspect-square bg-paper-warm">
                  <img src={url} alt="" className="h-full w-full object-cover" onError={(e) => { e.currentTarget.style.opacity = 0.2 }} />
                </div>

                {/* Drag handle */}
                <div className="absolute top-1 left-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="h-5 w-5 bg-paper/80 rounded flex items-center justify-center">
                    <GripVertical size={11} className="text-ink-muted" />
                  </div>
                </div>

                {/* Badge utama / tombol set utama */}
                {i === 0 ? (
                  <span className="absolute bottom-1 left-1 text-2xs bg-ink text-white px-1.5 py-0.5 rounded">Utama</span>
                ) : (
                  <button
                    type="button"
                    onClick={() => setPrimary(i)}
                    title="Jadikan gambar utama"
                    className="absolute bottom-1 left-1 h-6 w-6 bg-paper/80 border border-line rounded text-ink-muted hover:text-amber-500 inline-flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Star size={11} />
                  </button>
                )}

                {/* Hapus */}
                <button
                  type="button"
                  onClick={() => remove(i)}
                  className="absolute top-1 right-1 h-6 w-6 bg-paper/80 border border-line rounded text-ink-muted hover:text-state-danger inline-flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  aria-label="Hapus"
                >
                  <X size={11} />
                </button>
              </li>
            ))}
          </ul>
        </>
      ) : (
        <div className="mt-4 border border-dashed border-line rounded p-6 text-center">
          <ImageIcon size={28} className="mx-auto text-ink-faint mb-2" strokeWidth={1.2} />
          <p className="text-xs text-ink-muted">Belum ada gambar</p>
        </div>
      )}
    </div>
  )
}
