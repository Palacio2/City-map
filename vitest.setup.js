import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Заглушка для ScrollTo (його немає в jsdom)
window.scrollTo = vi.fn();

// Заглушка для ResizeObserver
class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}
window.ResizeObserver = ResizeObserver;

// Заглушка для matchMedia
window.matchMedia = window.matchMedia || function() {
  return {
    matches: false,
    addListener: function() {},
    removeListener: function() {}
  };
};