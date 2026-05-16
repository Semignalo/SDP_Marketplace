import { useNavigate } from 'react-router-dom'
import { Heart } from 'lucide-react'
import { toast } from 'sonner'
import { useAuthStore } from '../stores/useAuthStore'
import { useWishlistIds, useToggleWishlist } from '../hooks/useAccount'
import { cn } from '../lib/utils'

export default function WishlistButton({ productId, className = '', size = 14, variant = 'floating' }) {
  const user = useAuthStore((s) => s.user)
  const navigate = useNavigate()
  const { data: ids = [] } = useWishlistIds()
  const toggle = useToggleWishlist()
  const isActive = ids.includes(productId)

  const handleClick = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (!user) {
      toast.message('Masuk untuk menyimpan wishlist')
      navigate('/login')
      return
    }
    toggle.mutate(productId, {
      onSuccess: (inWishlist) => {
        toast.success(inWishlist ? 'Disimpan ke wishlist' : 'Dihapus dari wishlist')
      },
      onError: () => toast.error('Gagal mengubah wishlist'),
    })
  }

  if (variant === 'inline') {
    return (
      <button
        type="button"
        onClick={handleClick}
        disabled={toggle.isPending}
        className={cn(
          'inline-flex items-center gap-1.5 text-xs transition',
          isActive ? 'text-state-danger' : 'text-ink-muted hover:text-ink',
          className,
        )}
      >
        <Heart size={size} className={isActive ? 'fill-current' : ''} />
        {isActive ? 'Tersimpan' : 'Wishlist'}
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={toggle.isPending}
      aria-label={isActive ? 'Hapus dari wishlist' : 'Tambah ke wishlist'}
      className={cn(
        'h-8 w-8 rounded-pill bg-white shadow-card flex items-center justify-center transition',
        isActive ? 'text-state-danger' : 'text-ink-muted hover:text-ink',
        className,
      )}
    >
      <Heart size={size} className={isActive ? 'fill-current' : ''} />
    </button>
  )
}
