"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { containerClass } from "@/lib/responsive"

interface ContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  as?: React.ElementType
  size?: "default" | "sm" | "lg" | "fluid"
}

const Container = React.forwardRef<HTMLDivElement, ContainerProps>(
  ({ className, as: Component = "div", size = "default", ...props }, ref) => {
    const sizeClasses = {
      default: containerClass,
      sm: "mx-auto w-full max-w-[640px] px-4",
      lg: "mx-auto w-full max-w-[1280px] px-4",
      fluid: "mx-auto w-full px-4",
    }

    return (
      <Component
        ref={ref}
        className={cn(sizeClasses[size], className)}
        {...props}
      />
    )
  }
)
Container.displayName = "Container"

export { Container } 