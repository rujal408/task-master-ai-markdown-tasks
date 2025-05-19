"use client"

import * as React from "react"
import { Menu, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { useBreakpoint, useTouchDevice } from "@/lib/responsive"
import { MainNav } from "@/components/main-nav"

interface ResponsiveNavProps extends React.HTMLAttributes<HTMLElement> {
  items: {
    title: string
    href: string
    roles?: string[]
  }[]
}

export function ResponsiveNav({ className, items, ...props }: ResponsiveNavProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const isMobile = !useBreakpoint("md")
  const isTouchDevice = useTouchDevice()

  // Close menu when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const nav = document.getElementById("responsive-nav")
      if (nav && !nav.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside)
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [isOpen])

  // Close menu when pressing escape
  React.useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener("keydown", handleEscape)
    }

    return () => {
      document.removeEventListener("keydown", handleEscape)
    }
  }, [isOpen])

  return (
    <nav
      id="responsive-nav"
      className={cn("relative", className)}
      {...props}
    >
      {/* Mobile menu button */}
      {isMobile && (
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={() => setIsOpen(!isOpen)}
          aria-expanded={isOpen}
          aria-controls="mobile-menu"
          aria-label={isOpen ? "Close menu" : "Open menu"}
        >
          {isOpen ? (
            <X className="h-6 w-6" aria-hidden="true" />
          ) : (
            <Menu className="h-6 w-6" aria-hidden="true" />
          )}
        </Button>
      )}

      {/* Desktop navigation */}
      {!isMobile && <MainNav items={items} />}

      {/* Mobile navigation */}
      {isMobile && (
        <div
          id="mobile-menu"
          className={cn(
            "fixed inset-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60",
            isOpen ? "block" : "hidden"
          )}
          role="dialog"
          aria-modal="true"
          aria-label="Mobile menu"
        >
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="w-full max-w-lg p-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Navigation</h2>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsOpen(false)}
                  aria-label="Close menu"
                >
                  <X className="h-6 w-6" aria-hidden="true" />
                </Button>
              </div>
              <div className="mt-6">
                <MainNav
                  items={items}
                  className="flex flex-col space-y-4"
                  onItemClick={() => setIsOpen(false)}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </nav>
  )
} 