import { Link, useLocation } from 'react-router-dom'
import { Home, Search, ArrowLeft } from 'lucide-react'
import { Button } from '../components/ui'

export default function NotFoundPage() {
  const { pathname } = useLocation()
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-5 py-16">
      <div className="text-center max-w-md">
        <p className="text-7xl md:text-8xl font-bold tracking-tight text-ink/10 tabular-nums leading-none">404</p>
        <h1 className="mt-4 text-2xl md:text-3xl font-bold tracking-tight text-ink">
          Page not found
        </h1>
        <p className="mt-2 text-sm text-ink-muted">
          The path <code className="text-ink-soft px-1.5 py-0.5 bg-paper-warm rounded text-xs">{pathname}</code> doesn't exist.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row gap-2 justify-center">
          <Link to="/">
            <Button leadingIcon={<Home size={14} />}>Go Home</Button>
          </Link>
          <Link to="/products">
            <Button variant="outline" leadingIcon={<Search size={14} />}>Browse Products</Button>
          </Link>
          <button
            type="button"
            onClick={() => window.history.back()}
            className="text-xs text-ink-muted hover:text-ink inline-flex items-center gap-1 mt-2 sm:mt-0 sm:ml-2"
          >
            <ArrowLeft size={12} /> Back
          </button>
        </div>
      </div>
    </div>
  )
}
