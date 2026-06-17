// Curated category imagery — replaces random picsum.photos placeholders.
// Matched by keyword against the category slug/name so it degrades gracefully
// for categories not in the explicit map below.
const CATEGORY_IMAGES = [
  { keywords: ['wanita', 'women', 'fashion-wanita'], url: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=600&q=80' },
  { keywords: ['pria', 'men'], url: 'https://images.unsplash.com/photo-1490578474895-699cd4e2cf59?w=600&q=80' },
  { keywords: ['beauty', 'kosmetik', 'skincare'], url: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=600&q=80' },
  { keywords: ['anak', 'kids', 'bayi'], url: 'https://images.unsplash.com/photo-1522771930-78848d9293e8?w=600&q=80' },
  { keywords: ['aksesoris', 'accessor', 'tas', 'bag'], url: 'https://images.unsplash.com/photo-1591561954557-26941169b49e?w=600&q=80' },
  { keywords: ['sport', 'olahraga'], url: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=600&q=80' },
  { keywords: ['rumah', 'home', 'living'], url: 'https://images.unsplash.com/photo-1484101403633-562f891dc89a?w=600&q=80' },
  { keywords: ['gadget', 'elektronik', 'electronic'], url: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=600&q=80' },
]

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=600&q=80'

export function getCategoryImage(category) {
  const haystack = `${category?.slug || ''} ${category?.name || ''}`.toLowerCase()
  const match = CATEGORY_IMAGES.find((entry) => entry.keywords.some((kw) => haystack.includes(kw)))
  return match ? match.url : FALLBACK_IMAGE
}
