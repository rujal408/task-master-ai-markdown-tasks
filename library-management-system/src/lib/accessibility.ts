import { useEffect, useRef, useState } from 'react';
import { cn } from './utils';

// Focus trap hook for modals and dialogs
export function useFocusTrap(isActive: boolean) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isActive) return;

    const container = containerRef.current;
    if (!container) return;

    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstFocusable = focusableElements[0] as HTMLElement;
    const lastFocusable = focusableElements[focusableElements.length - 1] as HTMLElement;

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstFocusable) {
          e.preventDefault();
          lastFocusable.focus();
        }
      } else {
        if (document.activeElement === lastFocusable) {
          e.preventDefault();
          firstFocusable.focus();
        }
      }
    };

    container.addEventListener('keydown', handleTabKey);
    firstFocusable?.focus();

    return () => {
      container.removeEventListener('keydown', handleTabKey);
    };
  }, [isActive]);

  return containerRef;
}

// Skip link hook for keyboard navigation
export function useSkipLink() {
  const skipLinkRef = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab' && !e.shiftKey) {
        skipLinkRef.current?.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  return skipLinkRef;
}

// Screen reader only class
export const srOnly = 'sr-only';

// ARIA live region hook
export function useAriaLive(politeness: 'polite' | 'assertive' = 'polite') {
  const [announcement, setAnnouncement] = useState('');

  useEffect(() => {
    if (announcement) {
      const timer = setTimeout(() => {
        setAnnouncement('');
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [announcement]);

  return {
    announce: (message: string) => setAnnouncement(message),
    ariaLiveProps: {
      'aria-live': politeness,
      'aria-atomic': 'true',
      'aria-relevant': 'text',
      className: srOnly,
    },
  };
}

// Keyboard navigation hook
export function useKeyboardNavigation<T>(
  items: T[],
  onSelect: (item: T) => void,
  getItemId: (item: T) => string
) {
  const handleKeyDown = (event: React.KeyboardEvent, currentItem: T) => {
    const currentIndex = items.indexOf(currentItem);
    let nextIndex = currentIndex;

    switch (event.key) {
      case 'ArrowDown':
        nextIndex = Math.min(currentIndex + 1, items.length - 1);
        break;
      case 'ArrowUp':
        nextIndex = Math.max(currentIndex - 1, 0);
        break;
      case 'Home':
        nextIndex = 0;
        break;
      case 'End':
        nextIndex = items.length - 1;
        break;
      case 'Enter':
      case ' ':
        event.preventDefault();
        onSelect(currentItem);
        return;
      default:
        return;
    }

    if (nextIndex !== currentIndex) {
      event.preventDefault();
      const nextItem = items[nextIndex];
      const nextId = getItemId(nextItem);
      const nextElement = document.getElementById(nextId);
      if (nextElement) {
        nextElement.focus();
      }
    }
  };

  return handleKeyDown;
}

// ARIA labels
export const ariaLabels = {
  search: 'Search books',
  filter: 'Filter books',
  sort: 'Sort books',
  view: 'View book details',
  edit: 'Edit book',
  delete: 'Delete book',
  close: 'Close',
  clear: 'Clear filters',
  loading: 'Loading books',
  noResults: 'No books found',
};

// Role-based ARIA attributes
export const roleAttributes = {
  listbox: {
    role: 'listbox',
    'aria-multiselectable': 'true',
  },
  option: {
    role: 'option',
    'aria-selected': 'false',
  },
  radiogroup: {
    role: 'radiogroup',
  },
  radio: {
    role: 'radio',
    'aria-checked': 'false',
  },
  tablist: {
    role: 'tablist',
  },
  tab: {
    role: 'tab',
    'aria-selected': 'false',
  },
  tabpanel: {
    role: 'tabpanel',
  },
}; 