import { cn } from '../../lib/utils'

const PADDING = {
  none: '',
  md: 'p-5',
  lg: 'p-6 md:p-8',
}

export function Card({ children, as: Tag = 'div', padding = 'md', interactive = false, className = '', ...rest }) {
  return (
    <Tag
      className={cn(
        'bg-paper rounded-lg shadow-card',
        interactive && 'transition-shadow duration-200 ease-soft hover:shadow-hover',
        PADDING[padding],
        className,
      )}
      {...rest}
    >
      {children}
    </Tag>
  )
}
