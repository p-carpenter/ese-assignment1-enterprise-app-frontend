import { useCallback, useSyncExternalStore } from "react";

/**
 * Hook wrapping `window.matchMedia` with a `useSyncExternalStore` subscription.
 * @param query Media query string (e.g. "(max-width: 600px)").
 * @returns Boolean indicating whether the query currently matches.
 */
export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (callback: () => void) => {
      const media = window.matchMedia(query);
      media.addEventListener("change", callback);
      return () => media.removeEventListener("change", callback);
    },
    [query],
  );

  const getSnapshot = useCallback(() => {
    return window.matchMedia(query).matches;
  }, [query]);

  return useSyncExternalStore(subscribe, getSnapshot);
}
