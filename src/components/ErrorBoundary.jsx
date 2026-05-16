import { Component } from 'react'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'
import { Button } from './ui'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, info) {
    // Log untuk debugging
    if (typeof console !== 'undefined') {
      console.error('ErrorBoundary caught:', error, info)
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (!this.state.hasError) return this.props.children

    return (
      <div className="min-h-[60vh] flex items-center justify-center px-5 py-16">
        <div className="text-center max-w-md">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-pill bg-state-danger/10 text-state-danger mb-6">
            <AlertTriangle size={28} strokeWidth={1.5} />
          </div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-ink">
            Terjadi kesalahan
          </h1>
          <p className="mt-2 text-sm text-ink-muted">
            Ada yang salah saat menampilkan halaman ini. Coba refresh atau kembali ke beranda.
          </p>
          {import.meta.env.DEV && this.state.error && (
            <pre className="mt-4 text-2xs text-state-danger bg-state-danger/5 border border-state-danger/20 rounded p-3 text-left overflow-x-auto">
              {this.state.error.message}
            </pre>
          )}
          <div className="mt-6 flex justify-center gap-2">
            <Button onClick={() => window.location.reload()} leadingIcon={<RefreshCw size={14} />}>
              Refresh
            </Button>
            <Button variant="outline" onClick={() => { window.location.href = '/' }} leadingIcon={<Home size={14} />}>
              Beranda
            </Button>
          </div>
        </div>
      </div>
    )
  }
}
