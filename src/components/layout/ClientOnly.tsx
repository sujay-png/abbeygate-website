'use client';

import { useSyncExternalStore } from 'react';

const subscribe = () => () => {};

/**
 * Renders `children` only in the browser, after hydration.
 *
 * Use it for components that render nothing visible but need client-only hooks such as
 * useSearchParams() (analytics trackers, URL→state sync). Rendering them during static
 * prerendering forces a client-side-rendering bailout, which shows up in the server HTML as
 * `<!--$!--><template data-dgst>` markers. Gating them here keeps the server HTML clean.
 *
 * Do NOT wrap real page content in this: anything inside is invisible to crawlers.
 */
export function ClientOnly({ children }: { children: React.ReactNode }) {
  const isClient = useSyncExternalStore(subscribe, () => true, () => false);
  return isClient ? <>{children}</> : null;
}
