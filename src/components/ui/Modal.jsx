import { Dialog, DialogPanel, DialogTitle, Transition, TransitionChild } from '@headlessui/react'
import { Fragment } from 'react'
import { X } from 'lucide-react'
import { cn } from '../../lib/utils'

const SIZES = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-2xl',
  full: 'max-w-3xl',
}

export function Modal({ open, onClose, title, children, footer, size = 'md', closable = true }) {
  return (
    <Transition show={open} as={Fragment}>
      <Dialog onClose={closable ? onClose : () => {}} className="relative z-50">
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

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <TransitionChild
              as={Fragment}
              enter="ease-out duration-200"
              enterFrom="opacity-0 scale-95 translate-y-2"
              enterTo="opacity-100 scale-100 translate-y-0"
              leave="ease-in duration-150"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <DialogPanel className={cn('w-full bg-paper rounded-lg shadow-hover overflow-hidden', SIZES[size])}>
                {title && (
                  <div className="flex items-center justify-between px-6 py-4 border-b border-line">
                    <DialogTitle className="text-base font-semibold text-ink">{title}</DialogTitle>
                    {closable && (
                      <button
                        type="button"
                        onClick={onClose}
                        className="text-ink-faint hover:text-ink transition"
                        aria-label="Close"
                      >
                        <X size={18} />
                      </button>
                    )}
                  </div>
                )}
                <div className="px-6 py-5">{children}</div>
                {footer && <div className="px-6 py-4 bg-paper-warm border-t border-line">{footer}</div>}
              </DialogPanel>
            </TransitionChild>
          </div>
        </div>
      </Dialog>
    </Transition>
  )
}
