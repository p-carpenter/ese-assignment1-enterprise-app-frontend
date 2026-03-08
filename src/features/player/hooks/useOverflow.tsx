import { useState, useLayoutEffect, type RefObject, type DependencyList } from "react";

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

    return () => resizeObserver.disconnect();
  }, [ref, ...dependencies]);

  return isOverflowing;
};