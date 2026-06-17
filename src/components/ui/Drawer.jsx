import { Dialog, DialogPanel, Transition, TransitionChild } from '@headlessui/react'
import { Fragment } from 'react'
import { X } from 'lucide-react'
import { cn } from '../../lib/utils'

const SIDES = {
  right: {
    panel: 'right-0 top-0 h-full w-full max-w-md',
    enterFrom: 'translate-x-full',
    leaveTo: 'translate-x-full',
  },
  left: {
    panel: 'left-0 top-0 h-full w-full max-w-md',
    enterFrom: '-translate-x-full',
    leaveTo: '-translate-x-full',
  },
  bottom: {
    panel: 'bottom-0 left-0 right-0 max-h-[90vh] rounded-t-lg',
    enterFrom: 'translate-y-full',
    leaveTo: 'translate-y-full',
  },
}

export function Drawer({ open, onClose, title, children, footer, side = 'right' }) {
  const s = SIDES[side]
  return (
    <Transition show={open} as={Fragment}>
      <Dialog onClose={onClose} className="relative z-50">
        <TransitionChild
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-ink/40 backdrop-blur-[2px]" />
        </TransitionChild>

        <TransitionChild
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom={s.enterFrom}
          enterTo="translate-x-0 translate-y-0"
          leave="ease-in duration-200"
          leaveFrom="translate-x-0 translate-y-0"
          leaveTo={s.leaveTo}
        >
          <DialogPanel className={cn('fixed bg-paper shadow-hover flex flex-col', s.panel)}>
            {title && (
              <div className="flex items-center justify-between px-5 py-4 border-b border-line flex-shrink-0">
                <h2 className="text-base font-semibold text-ink">{title}</h2>
                <button
                  type="button"
                  onClick={onClose}
                  className="text-ink-faint hover:text-ink transition"
                  aria-label="Close"
                >
                  <X size={20} />
                </button>
              </div>
            )}
            <div className="flex-1 overflow-y-auto">{children}</div>
            {footer && <div className="px-5 py-4 border-t border-line bg-paper-warm flex-shrink-0">{footer}</div>}
          </DialogPanel>
        </TransitionChild>
      </Dialog>
    </Transition>
  )
}
