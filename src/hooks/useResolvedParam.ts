'use client';

import { usePathname } from 'next/navigation';

/**
 * Resolves a route parameter that may be 'placeholder' from static export.
 * CloudFront rewrites /auctions/7/ to /auctions/placeholder/ so S3 finds the
 * pre-generated HTML. This hook reads the real ID from the browser URL.
 *
 * @param paramValue The param value from the page component (may be 'placeholder')
 * @param segmentIndex Which path segment contains the ID (default 1: /{resource}/{id})
 */
export function useResolvedParam(paramValue: string, segmentIndex: number = 1): string {
  const pathname = usePathname();
  if (paramValue !== 'placeholder') return paramValue;
  const segments = pathname.split('/').filter(Boolean);
  return segments[segmentIndex] || paramValue;
}
