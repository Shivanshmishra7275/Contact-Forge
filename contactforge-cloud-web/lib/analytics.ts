'use client';

/**
 * Shared Plausible Analytics Helper
 * Gracefully degrades if Plausible is blocked or not loaded.
 */
export const trackEvent = (eventName: string, props?: Record<string, string | number | boolean>) => {
  try {
    if (typeof window !== 'undefined' && (window as any).plausible) {
      (window as any).plausible(eventName, { props });
    } else {
      // Fallback for local testing or when analytics is blocked
      if (process.env.NODE_ENV !== 'production') {
        console.log(`[Analytics Event]: ${eventName}`, props);
      }
    }
  } catch (error) {
    console.warn('Analytics tracking failed gracefully:', error);
  }
};
