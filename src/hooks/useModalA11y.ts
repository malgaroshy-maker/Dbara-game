import { useEffect, useRef } from 'react';

const FOCUSABLE = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

/**
 * Makes a dialog behave the way `aria-modal="true"` promises.
 *
 * Declaring `aria-modal` does not itself confine anything: without this, Tab
 * walks straight out of the sheet and into the map behind it, and a keyboard
 * player ends up operating controls they cannot see. This closes the loop —
 *
 *   • focus moves into the dialog when it opens,
 *   • Tab and Shift+Tab cycle within it,
 *   • Escape closes it,
 *   • focus returns to whatever opened it.
 *
 * Returns the ref to spread onto the dialog element.
 */
export const useModalA11y = (isOpen: boolean, onClose?: () => void) => {
  const ref = useRef<HTMLDivElement>(null);
  // Captured on open rather than on every render, so a re-render while the
  // dialog is up does not overwrite the element we owe focus back to.
  const returnTo = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    const node = ref.current;
    if (!node) return;

    returnTo.current = document.activeElement as HTMLElement | null;

    const focusable = () =>
      [...node.querySelectorAll<HTMLElement>(FOCUSABLE)].filter(
        (el) => el.offsetParent !== null || el === document.activeElement
      );

    // Prefer the first real control; fall back to the dialog itself so the
    // screen reader still lands inside and reads the label.
    const first = focusable()[0];
    if (first) first.focus();
    else {
      node.setAttribute('tabindex', '-1');
      node.focus();
    }

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && onClose) {
        e.stopPropagation();
        onClose();
        return;
      }
      if (e.key !== 'Tab') return;

      const items = focusable();
      if (items.length === 0) {
        e.preventDefault();
        return;
      }
      const firstItem = items[0];
      const lastItem = items[items.length - 1];
      const active = document.activeElement;

      // Wrap at both ends, and also catch focus that has already escaped the
      // dialog — pulling it back is better than letting the cycle drift.
      if (!node.contains(active)) {
        e.preventDefault();
        firstItem.focus();
      } else if (e.shiftKey && active === firstItem) {
        e.preventDefault();
        lastItem.focus();
      } else if (!e.shiftKey && active === lastItem) {
        e.preventDefault();
        firstItem.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown, true);
    return () => {
      document.removeEventListener('keydown', onKeyDown, true);
      returnTo.current?.focus?.();
    };
  }, [isOpen, onClose]);

  return ref;
};
