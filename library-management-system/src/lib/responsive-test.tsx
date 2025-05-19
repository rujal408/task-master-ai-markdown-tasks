"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { breakpoints } from "./responsive"

interface ResponsiveTestProps extends React.HTMLAttributes<HTMLDivElement> {
  showBreakpoints?: boolean
  showOrientation?: boolean
  showTouch?: boolean
}

export function ResponsiveTest({
  className,
  showBreakpoints = true,
  showOrientation = true,
  showTouch = true,
  ...props
}: ResponsiveTestProps) {
  const [currentBreakpoint, setCurrentBreakpoint] = React.useState<keyof typeof breakpoints>("xs")
  const [orientation, setOrientation] = React.useState<"portrait" | "landscape">("portrait")
  const [isTouchDevice, setIsTouchDevice] = React.useState(false)

  React.useEffect(() => {
    const updateBreakpoint = () => {
      const width = window.innerWidth
      const breakpoint = Object.entries(breakpoints).reduce(
        (acc, [key, value]) => {
          const breakpointWidth = parseInt(value)
          return width >= breakpointWidth ? key : acc
        },
        "xs" as keyof typeof breakpoints
      )
      setCurrentBreakpoint(breakpoint)
    }

    const updateOrientation = () => {
      setOrientation(window.innerHeight > window.innerWidth ? "portrait" : "landscape")
    }

    const updateTouchDevice = () => {
      setIsTouchDevice(
        "ontouchstart" in window ||
          navigator.maxTouchPoints > 0 ||
          // @ts-ignore - msMaxTouchPoints is a legacy IE property
          (navigator.msMaxTouchPoints && navigator.msMaxTouchPoints > 0)
      )
    }

    updateBreakpoint()
    updateOrientation()
    updateTouchDevice()

    window.addEventListener("resize", updateBreakpoint)
    window.addEventListener("resize", updateOrientation)
    window.addEventListener("resize", updateTouchDevice)

    return () => {
      window.removeEventListener("resize", updateBreakpoint)
      window.removeEventListener("resize", updateOrientation)
      window.removeEventListener("resize", updateTouchDevice)
    }
  }, [])

  if (process.env.NODE_ENV === "production") {
    return null
  }

  return (
    <div
      className={cn(
        "fixed bottom-4 right-4 z-50 rounded-lg bg-background p-4 shadow-lg",
        className
      )}
      {...props}
    >
      <div className="space-y-2 text-sm">
        {showBreakpoints && (
          <div>
            <span className="font-medium">Breakpoint: </span>
            <span className="text-primary">{currentBreakpoint}</span>
            <span className="text-muted-foreground">
              {" "}
              ({breakpoints[currentBreakpoint]})
            </span>
          </div>
        )}
        {showOrientation && (
          <div>
            <span className="font-medium">Orientation: </span>
            <span className="text-primary">{orientation}</span>
          </div>
        )}
        {showTouch && (
          <div>
            <span className="font-medium">Touch Device: </span>
            <span className="text-primary">{isTouchDevice ? "Yes" : "No"}</span>
          </div>
        )}
      </div>
    </div>
  )
} 