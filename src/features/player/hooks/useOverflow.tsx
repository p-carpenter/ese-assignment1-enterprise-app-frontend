import {
  useState,
  useLayoutEffect,
  type RefObject,
  type DependencyList,
} from "react";

/**
 * Hook that detects whether an element's content overflows its parent horizontally.
 * Useful for conditionally enabling marquee/scrolling behavior for long text.
 * @param ref Ref to the element to observe.
 * @param dependencies Optional dependency list to re-run the effect when values change.
 * @returns Boolean indicating whether the element is overflowing.
 */
export const useIsOverflowing = (
  ref: RefObject<HTMLElement | null>,
  dependencies: DependencyList = [],
) => {
  const [isOverflowing, setIsOverflowing] = useState(false);

  useLayoutEffect(() => {
    const el = ref.current;
    const parent = el?.parentElement;
    if (!el || !parent) return;

    const checkOverflow = () => {
      setIsOverflowing(el.scrollWidth > parent.clientWidth);
    };

    checkOverflow();

    const resizeObserver = new ResizeObserver(checkOverflow);
    resizeObserver.observe(parent);
    resizeObserver.observe(el);

    return () => resizeObserver.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ref, JSON.stringify(dependencies)]);

  return isOverflowing;
};
