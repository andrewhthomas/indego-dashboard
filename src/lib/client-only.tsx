import {
  lazy,
  Suspense,
  useEffect,
  useState,
  type ComponentType,
  type ReactNode,
} from "react";

// Leaflet touches `window` at import time, so map components can only be
// loaded in the browser. Renders `fallback` during prerender and hydration.
export function clientOnly<P extends object>(
  loader: () => Promise<ComponentType<P>>,
  fallback: ReactNode = null,
): ComponentType<P> {
  const Lazy = lazy(async () => ({ default: await loader() }));

  return function ClientOnly(props: P) {
    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);

    if (!mounted) return <>{fallback}</>;
    return (
      <Suspense fallback={fallback}>
        <Lazy {...props} />
      </Suspense>
    );
  };
}
