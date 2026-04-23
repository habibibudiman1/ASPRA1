// =============================================================================
// components/ui/link-button.tsx
// Wrapper Link yang tampil seperti Button — karena Button v2 tidak punya asChild
// =============================================================================

import Link from 'next/link'
import { buttonVariants } from './button'
import { cn } from '@/lib/utils'
import type { VariantProps } from 'class-variance-authority'

interface LinkButtonProps
  extends React.AnchorHTMLAttributes<HTMLAnchorElement>,
    VariantProps<typeof buttonVariants> {
  href: string
  children: React.ReactNode
  className?: string
}

export function LinkButton({
  href,
  children,
  variant = 'default',
  size = 'default',
  className,
  ...props
}: LinkButtonProps) {
  return (
    <Link
      href={href}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    >
      {children}
    </Link>
  )
}
