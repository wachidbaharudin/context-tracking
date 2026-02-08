import { useState, useEffect } from 'react';

// Tailwind default breakpoints
const BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
} as const;

export interface BreakpointState {
  isMobile: boolean; // < 768px (below md)
  isTablet: boolean; // >= 768px && < 1024px
  isDesktop: boolean; // >= 1024px
  breakpoint: 'mobile' | 'tablet' | 'desktop';
}

function getBreakpointState(width: number): BreakpointState {
  const isMobile = width < BREAKPOINTS.md;
  const isTablet = width >= BREAKPOINTS.md && width < BREAKPOINTS.lg;
  const isDesktop = width >= BREAKPOINTS.lg;

  return {
    isMobile,
    isTablet,
    isDesktop,
    breakpoint: isMobile ? 'mobile' : isTablet ? 'tablet' : 'desktop',
  };
}

export function useBreakpoint(): BreakpointState {
  const [state, setState] = useState<BreakpointState>(() => {
    // SSR-safe initial state
    if (typeof window === 'undefined') {
      return { isMobile: false, isTablet: false, isDesktop: true, breakpoint: 'desktop' };
    }
    return getBreakpointState(window.innerWidth);
  });

  useEffect(() => {
    const handleResize = () => {
      setState(getBreakpointState(window.innerWidth));
    };

    // Set initial state
    handleResize();

    // Use ResizeObserver for better performance if available
    if (typeof ResizeObserver !== 'undefined') {
      const observer = new ResizeObserver(() => {
        handleResize();
      });
      observer.observe(document.documentElement);
      return () => observer.disconnect();
    }

    // Fallback to window resize event
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return state;
}
