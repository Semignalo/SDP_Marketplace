import { ShoppingBag } from 'lucide-react'
import { Button, EmptyState } from './ui'
import { INDIA_STORE_URL } from '../hooks/useRegion'

export default function IndiaStoreNotice() {
  return (
    <div className="container-page py-20">
      <EmptyState
        icon={<ShoppingBag size={48} strokeWidth={1.2} />}
        title="Checkout isn't available here for India"
        description="We sell to India through our dedicated store instead — head there to browse and buy."
        action={
          <Button href={INDIA_STORE_URL} target="_blank" rel="noopener noreferrer" variant="accent">
            Shop on our India store
          </Button>
        }
      />
    </div>
  )
}
