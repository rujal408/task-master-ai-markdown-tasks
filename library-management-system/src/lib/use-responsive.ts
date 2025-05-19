"use client"

import { useEffect, useState } from "react"
import { breakpoints } from "./responsive"

type Breakpoint = keyof typeof breakpoints

interface ResponsiveInfo {
  breakpoint: Breakpoint
  isMobile: boolean
  isTablet: boolean
  isDesktop: boolean
  isLandscape: boolean
  isPortrait: boolean
  isTouchDevice: boolean
}

export function useResponsive(): ResponsiveInfo {
  const [breakpoint, setBreakpoint] = useState<Breakpoint>("xs")
  const [isLandscape, setIsLandscape] = useState(false)
  const [isTouchDevice, setIsTouchDevice] = useState(false)

  useEffect(() => {
    const updateBreakpoint = () => {
      const width = window.innerWidth
      const entries = Object.entries(breakpoints) as [Breakpoint, string][]
      const newBreakpoint = entries.reduce<Breakpoint>((acc, [key, value]) => {
        const breakpointWidth = parseInt(value)
        return width >= breakpointWidth ? key : acc
      }, "xs")
      setBreakpoint(newBreakpoint)
    }

    const updateOrientation = () => {
      setIsLandscape(window.innerHeight < window.innerWidth)
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

  const isMobile = breakpoint === "xs" || breakpoint === "sm"
  const isTablet = breakpoint === "md"
  const isDesktop = breakpoint === "lg" || breakpoint === "xl" || breakpoint === "2xl"
  const isPortrait = !isLandscape

  return {
    breakpoint,
    isMobile,
    isTablet,
    isDesktop,
    isLandscape,
    isPortrait,
    isTouchDevice,
  }
} 