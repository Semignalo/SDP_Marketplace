import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { SlidersHorizontal, X, Search } from 'lucide-react'
import ProductCard from '../components/ProductCard'
import { useProducts, useCategories } from '../hooks/useProducts'
import { Select, SkeletonProductCard, EmptyState, Pagination, Drawer, Button } from '../components/ui'
import { cn } from '../lib/utils'

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest' },
  { value: 'oldest', label: 'Oldest' },
  { value: 'price_asc', label: 'Lowest price' },
  { value: 'price_desc', label: 'Highest price' },
  { value: 'name_asc', label: 'Name A→Z' },
]

export default function ProductsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [filterOpen, setFilterOpen] = useState(false)

  const category = searchParams.get('category') || ''
  const search = searchParams.get('search') || ''
  const sort = searchParams.get('sort') || 'newest'
  const page = parseInt(searchParams.get('page') || '1', 10)

  const setParam = (updates) => {
    const p = new URLSearchParams(searchParams)
    Object.entries(updates).forEach(([k, v]) => {
      if (v === '' || v === null || v === undefined) p.delete(k)
      else p.set(k, v)
    })
    if (!('page' in updates)) p.delete('page')
    setSearchParams(p, { replace: false })
  }

  const { data: categories = [] } = useCategories()
  const { data, isLoading, isFetching } = useProducts({
    category: category || undefined,
    search: search || undefined,
    sort,
    page,
    per_page: 20,
  })

  const products = data?.data || []
  const meta = data?.meta || { total: 0, current_page: 1, last_page: 1 }
  const activeCategory = findCategory(categories, category)

  const pageTitle = search
    ? `Results for "${search}"`
    : activeCategory
      ? activeCategory.name
      : 'All Products'

  return (
    <div className="container-page py-8 lg:py-12">
      <header className="mb-8">
        <p className="eyebrow mb-2">Catalog</p>
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-ink">{pageTitle}</h1>
        <p className="text-sm text-ink-muted mt-2">
          {isFetching ? 'Loading…' : `${meta.total} products found`}
        </p>
      </header>

      <div className="flex items-center justify-between gap-4 mb-6 pb-4 border-b border-line">
        <button
          type="button"
          onClick={() => setFilterOpen(true)}
          className="lg:hidden inline-flex items-center gap-2 h-10 px-4 border border-line rounded text-sm text-ink"
        >
          <SlidersHorizontal size={16} /> Filter
        </button>
        <div className="hidden lg:block eyebrow">Filter</div>
        <div className="flex-1 lg:flex-none">
          <Select
            options={SORT_OPTIONS}
            value={sort}
            placeholder={null}
            onChange={(e) => setParam({ sort: e.target.value })}
            className="h-10"
          />
        </div>
      </div>

      <div className="grid lg:grid-cols-[220px_1fr] gap-10">
        <aside className="hidden lg:block">
          <FilterPanel
            categories={categories}
            activeCategory={category}
            search={search}
            onCategoryChange={(slug) => setParam({ category: slug })}
            onSearchChange={(s) => setParam({ search: s })}
          />
        </aside>

        <div>
          {isLoading ? (
            <ProductGrid>
              {Array.from({ length: 12 }).map((_, i) => <SkeletonProductCard key={i} />)}
            </ProductGrid>
          ) : products.length === 0 ? (
            <EmptyState
              icon={<Search size={48} strokeWidth={1.2} />}
              title="Nothing here yet."
              description="Try a different filter or search term."
              action={
                <Button variant="outline" onClick={() => setSearchParams({})}>
                  Reset filters
                </Button>
              }
            />
          ) : (
            <>
              <ProductGrid isFetching={isFetching}>
                {products.map((p) => <ProductCard key={p.id} product={p} />)}
              </ProductGrid>
              {meta.last_page > 1 && (
                <div className="mt-12">
                  <Pagination
                    currentPage={meta.current_page}
                    lastPage={meta.last_page}
                    onChange={(p) => setParam({ page: p })}
                  />
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <Drawer open={filterOpen} onClose={() => setFilterOpen(false)} title="Filters" side="left">
        <div className="p-5">
          <FilterPanel
            categories={categories}
            activeCategory={category}
            search={search}
            onCategoryChange={(slug) => {
              setParam({ category: slug })
              setFilterOpen(false)
            }}
            onSearchChange={(s) => setParam({ search: s })}
          />
        </div>
      </Drawer>
    </div>
  )
}

function FilterPanel({ categories, activeCategory, search, onCategoryChange, onSearchChange }) {
  return (
    <div className="space-y-8">
      {search && (
        <div className="bg-paper-soft rounded-lg shadow-card p-3 flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="eyebrow">Search</p>
            <p className="text-sm text-ink mt-0.5 truncate">{search}</p>
          </div>
          <button
            onClick={() => onSearchChange('')}
            className="text-ink-muted hover:text-ink"
            aria-label="Clear search"
          >
            <X size={16} />
          </button>
        </div>
      )}

      <div>
        <h3 className="eyebrow mb-3">Category</h3>
        <ul className="space-y-0.5 max-h-[60vh] overflow-y-auto pr-1">
          <li>
            <button
              type="button"
              onClick={() => onCategoryChange('')}
              className={cn(
                'w-full text-left text-sm py-1.5',
                !activeCategory ? 'text-ink font-semibold' : 'text-ink-muted hover:text-ink',
              )}
            >
              All Categories
            </button>
          </li>
          {categories.map((parent) => (
            <li key={parent.id}>
              <button
                type="button"
                onClick={() => onCategoryChange(parent.slug)}
                className={cn(
                  'w-full text-left text-sm py-1.5',
                  activeCategory === parent.slug ? 'text-ink font-semibold' : 'text-ink-muted hover:text-ink',
                )}
              >
                {parent.name}
              </button>
              {parent.children && parent.children.length > 0 && (
                <ul className="pl-3 mt-0.5 space-y-0.5">
                  {parent.children.map((child) => (
                    <li key={child.id}>
                      <button
                        type="button"
                        onClick={() => onCategoryChange(child.slug)}
                        className={cn(
                          'w-full text-left text-xs py-1',
                          activeCategory === child.slug ? 'text-ink font-semibold' : 'text-ink-muted hover:text-ink',
                        )}
                      >
                        {child.name}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

function ProductGrid({ children, isFetching = false }) {
  return (
    <div
      className={cn(
        'grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-8 transition-opacity duration-200',
        isFetching && 'opacity-60',
      )}
    >
      {children}
    </div>
  )
}

function findCategory(categories, slug) {
  if (!slug) return null
  for (const c of categories) {
    if (c.slug === slug) return c
    if (c.children) {
      const child = c.children.find((ch) => ch.slug === slug)
      if (child) return child
    }
  }
  return null
}
