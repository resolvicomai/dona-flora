'use client'

import { Eye, EyeOff } from 'lucide-react'
import { useId, useState } from 'react'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'

type PasswordInputProps = React.ComponentProps<'input'>

export function PasswordInput({ className, id, ...props }: PasswordInputProps) {
  const generatedId = useId()
  const [isVisible, setIsVisible] = useState(false)

  return (
    <div className="relative">
      <Input
        {...props}
        id={id ?? generatedId}
        type={isVisible ? 'text' : 'password'}
        className={cn('pr-11', className)}
      />
      <button
        aria-label={isVisible ? 'Ocultar senha' : 'Mostrar senha'}
        className="surface-transition absolute top-1/2 right-2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground hover:bg-foreground/[0.05] hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        onClick={() => setIsVisible((current) => !current)}
        type="button"
      >
        {isVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  )
}
