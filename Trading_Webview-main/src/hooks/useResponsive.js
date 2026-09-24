// src/hooks/useResponsive.js

/**
 * Custom hook to detect responsive breakpoints.
 * Returns booleans for mobile, tablet, laptop, and desktop based on window.innerWidth.
 * Breakpoints:
 *   mobile:   0   - 480px
 *   tablet:  481  -1024px
 *   laptop: 1025  -1440px
 *   desktop:1441  and above
 */
import { useState, useEffect } from 'react';

export default function useResponsive() {
  const getBreakpoint = () => {
    const width = window.innerWidth;
    return {
      isMobile: width <= 480,
      isTablet: width > 480 && width <= 1024,
      isLaptop: width > 1024 && width <= 1440,
      isDesktop: width > 1440,
    };
  };

  const [breakpoint, setBreakpoint] = useState(getBreakpoint());

  useEffect(() => {
    const handleResize = () => setBreakpoint(getBreakpoint());
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return breakpoint;
}
