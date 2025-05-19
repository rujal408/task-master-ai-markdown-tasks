import { cn } from "@/lib/utils"

interface FormErrorProps {
  message?: string
  className?: string
}

export function FormError({ 
  message, 
  className,
  ...props 
}: FormErrorProps) {
  if (!message) return null

  return (
    <p 
      className={cn("text-sm font-medium text-destructive", className)}
      {...props}
    >
      {message}
    </p>
  )
}
