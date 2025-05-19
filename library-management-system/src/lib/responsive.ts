import { useEffect, useState } from 'react';

// Custom breakpoints that extend Tailwind's default breakpoints
export const breakpoints = {
  xs: '320px',
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
  '3xl': '1920px',
} as const;

// Custom hook for responsive breakpoints
export function useBreakpoint(breakpoint: keyof typeof breakpoints) {
  const [isMatch, setIsMatch] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia(`(min-width: ${breakpoints[breakpoint]})`);
    setIsMatch(mediaQuery.matches);

    const handler = (e: MediaQueryListEvent) => setIsMatch(e.matches);
    mediaQuery.addEventListener('change', handler);

    return () => mediaQuery.removeEventListener('change', handler);
  }, [breakpoint]);

  return isMatch;
}

// Hook for device orientation
export function useOrientation() {
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>(
    typeof window !== 'undefined' && window.innerHeight > window.innerWidth
      ? 'portrait'
      : 'landscape'
  );

  useEffect(() => {
    const handleResize = () => {
      setOrientation(
        window.innerHeight > window.innerWidth ? 'portrait' : 'landscape'
      );
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return orientation;
}

// Hook for touch device detection
export function useTouchDevice() {
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  useEffect(() => {
    setIsTouchDevice(
      'ontouchstart' in window ||
        navigator.maxTouchPoints > 0 ||
        // @ts-ignore - msMaxTouchPoints is a legacy IE property
        (navigator.msMaxTouchPoints && navigator.msMaxTouchPoints > 0)
    );
  }, []);

  return isTouchDevice;
}

// Utility for responsive class names
export function responsiveClass(
  baseClass: string,
  variants: Partial<Record<keyof typeof breakpoints, string>>
) {
  return Object.entries(variants)
    .reduce((acc, [breakpoint, className]) => {
      return `${acc} ${breakpoint}:${className}`;
    }, baseClass)
    .trim();
}

// Utility for responsive styles
export function responsiveStyle(
  baseStyle: React.CSSProperties,
  variants: Partial<Record<keyof typeof breakpoints, React.CSSProperties>>
) {
  return Object.entries(variants).reduce((acc, [breakpoint, style]) => {
    return {
      ...acc,
      [`@media (min-width: ${breakpoints[breakpoint as keyof typeof breakpoints]})`]: style,
    };
  }, baseStyle);
}

// Utility for responsive container
export const containerClass = responsiveClass('mx-auto w-full px-4', {
  sm: 'max-w-[640px]',
  md: 'max-w-[768px]',
  lg: 'max-w-[1024px]',
  xl: 'max-w-[1280px]',
  '2xl': 'max-w-[1536px]',
});

// Utility for responsive typography
export const typography = {
  h1: responsiveClass('text-3xl font-bold', {
    sm: 'text-4xl',
    md: 'text-5xl',
    lg: 'text-6xl',
  }),
  h2: responsiveClass('text-2xl font-bold', {
    sm: 'text-3xl',
    md: 'text-4xl',
    lg: 'text-5xl',
  }),
  h3: responsiveClass('text-xl font-bold', {
    sm: 'text-2xl',
    md: 'text-3xl',
    lg: 'text-4xl',
  }),
  body: responsiveClass('text-base', {
    sm: 'text-lg',
    md: 'text-xl',
  }),
  small: responsiveClass('text-sm', {
    sm: 'text-base',
    md: 'text-lg',
  }),
} as const;

// Utility for responsive spacing
export const spacing = {
  container: responsiveClass('p-4', {
    sm: 'p-6',
    md: 'p-8',
    lg: 'p-12',
  }),
  section: responsiveClass('py-8', {
    sm: 'py-12',
    md: 'py-16',
    lg: 'py-24',
  }),
  card: responsiveClass('p-4', {
    sm: 'p-6',
    md: 'p-8',
  }),
} as const; 