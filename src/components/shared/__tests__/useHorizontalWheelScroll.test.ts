import { afterEach, describe, expect, it } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useHorizontalWheelScroll } from '../useHorizontalWheelScroll';

const mountedElements: HTMLElement[] = [];

function renderScrollableElement({ scrollWidth, clientWidth, scrollLeft = 0 }: {
  scrollWidth: number;
  clientWidth: number;
  scrollLeft?: number;
}) {
  const element = document.createElement('div');
  Object.defineProperty(element, 'scrollWidth', { configurable: true, value: scrollWidth });
  Object.defineProperty(element, 'clientWidth', { configurable: true, value: clientWidth });
  element.scrollLeft = scrollLeft;
  document.body.appendChild(element);
  mountedElements.push(element);

  const ref = { current: element };
  const hook = renderHook(() => useHorizontalWheelScroll(ref));
  return { element, hook };
}

afterEach(() => {
  for (const element of mountedElements.splice(0)) element.remove();
});

describe('useHorizontalWheelScroll', () => {
  it('converts vertical wheel movement while horizontal overflow can advance', () => {
    const { element } = renderScrollableElement({ scrollWidth: 300, clientWidth: 100 });
    const event = new WheelEvent('wheel', { deltaY: 40, cancelable: true });

    element.dispatchEvent(event);

    expect(event.defaultPrevented).toBe(true);
    expect(element.scrollLeft).toBe(40);
  });

  it('does not block the page when there is no horizontal overflow', () => {
    const { element } = renderScrollableElement({ scrollWidth: 100, clientWidth: 100 });
    const event = new WheelEvent('wheel', { deltaY: 40, cancelable: true });

    element.dispatchEvent(event);

    expect(event.defaultPrevented).toBe(false);
    expect(element.scrollLeft).toBe(0);
  });

  it('does not block the page when the pointer is already at the requested edge', () => {
    const { element } = renderScrollableElement({ scrollWidth: 300, clientWidth: 100, scrollLeft: 200 });
    const event = new WheelEvent('wheel', { deltaY: 40, cancelable: true });

    element.dispatchEvent(event);

    expect(event.defaultPrevented).toBe(false);
    expect(element.scrollLeft).toBe(200);
  });

  it('removes the wheel listener on unmount', () => {
    const { element, hook } = renderScrollableElement({ scrollWidth: 300, clientWidth: 100 });
    hook.unmount();
    const event = new WheelEvent('wheel', { deltaY: 40, cancelable: true });

    element.dispatchEvent(event);

    expect(event.defaultPrevented).toBe(false);
    expect(element.scrollLeft).toBe(0);
  });
});
