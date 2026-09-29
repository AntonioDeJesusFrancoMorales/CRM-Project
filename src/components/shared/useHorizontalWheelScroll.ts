import { useEffect, type RefObject } from 'react';

export function useHorizontalWheelScroll(ref: RefObject<HTMLElement | null>): void {
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const scrollElement: HTMLElement = element;

    function handleWheel(event: WheelEvent) {
      const maxScrollLeft = scrollElement.scrollWidth - scrollElement.clientWidth;
      if (maxScrollLeft <= 0) return;

      const delta = Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY;
      if (delta === 0) return;

      const currentScrollLeft = scrollElement.scrollLeft;
      const canScrollLeft = delta < 0 && currentScrollLeft > 0;
      const canScrollRight = delta > 0 && currentScrollLeft < maxScrollLeft;
      if (!canScrollLeft && !canScrollRight) return;

      const nextScrollLeft = Math.min(
        maxScrollLeft,
        Math.max(0, currentScrollLeft + delta),
      );
      if (nextScrollLeft === currentScrollLeft) return;

      event.preventDefault();
      scrollElement.scrollLeft = nextScrollLeft;
    }

    scrollElement.addEventListener('wheel', handleWheel, { passive: false });
    return () => scrollElement.removeEventListener('wheel', handleWheel);
  }, [ref]);
}
