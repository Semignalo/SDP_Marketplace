import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '../../lib/utils'

export function Pagination({ currentPage, lastPage, onChange, className = '' }) {
  if (!lastPage || lastPage <= 1) return null

  const pages = buildPageList(currentPage, lastPage)

  return (
    <nav className={cn('flex items-center justify-center gap-1', className)} aria-label="Pagination">
      <button
        type="button"
        onClick={() => onChange(currentPage - 1)}
        disabled={currentPage <= 1}
        className="h-9 w-9 inline-flex items-center justify-center rounded border border-line text-ink-soft hover:bg-paper-warm disabled:opacity-40 disabled:cursor-not-allowed transition"
        aria-label="Previous page"
      >
        <ChevronLeft size={16} />
      </button>

      {pages.map((p, idx) =>
        p === '...' ? (
          <span key={`gap-${idx}`} className="h-9 w-9 inline-flex items-center justify-center text-ink-faint text-sm">
            …
          </span>
        ) : (
          <button
            key={p}
            type="button"
            onClick={() => onChange(p)}
            aria-current={p === currentPage ? 'page' : undefined}
            className={cn(
              'h-9 min-w-9 px-2 inline-flex items-center justify-center rounded text-sm transition',
              p === currentPage
                ? 'bg-ink text-white border border-ink'
                : 'border border-line text-ink-soft hover:bg-paper-warm',
            )}
          >
            {p}
          </button>
        ),
      )}

      <button
        type="button"
        onClick={() => onChange(currentPage + 1)}
        disabled={currentPage >= lastPage}
        className="h-9 w-9 inline-flex items-center justify-center rounded border border-line text-ink-soft hover:bg-paper-warm disabled:opacity-40 disabled:cursor-not-allowed transition"
        aria-label="Next page"
      >
        <ChevronRight size={16} />
      </button>
    </nav>
  )
}

function buildPageList(current, last) {
  const delta = 1
  const range = []
  for (let i = Math.max(2, current - delta); i <= Math.min(last - 1, current + delta); i++) {
    range.push(i)
  }
  const result = [1]
  if (range[0] > 2) result.push('...')
  result.push(...range)
  if (range[range.length - 1] < last - 1) result.push('...')
  if (last > 1) result.push(last)
  return result
}
