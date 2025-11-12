import React, { useEffect, useRef, useState } from "react";

/**
 * Reusable Modal with:
 * - Focus trap (Tab / Shift+Tab)
 * - Escape to close
 * - Enter/exit micro-animations (scale + fade)
 *
 * Usage:
 * <Modal onClose={closeFn} ariaLabel="Add item">
 *   ... modal content ...
 * </Modal>
 */
const FOCUSABLE_SELECTORS = [
  'a[href]',
  'button:not([disabled])',
  'textarea:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  '[tabindex]:not([tabindex="-1"])'
].join(',');

const Modal = ({ onClose, children, ariaLabel = "Dialog", initialFocusSelector = null }) => {
  const overlayRef = useRef(null);
  const panelRef = useRef(null);
  const previouslyFocused = useRef(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    // Save previously focused element to restore on unmount
    previouslyFocused.current = document.activeElement;

    // Show with enter animation
    requestAnimationFrame(() => setIsVisible(true));

    const onKeyDown = (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        triggerClose();
      } else if (e.key === "Tab") {
        // Focus trap
        const container = panelRef.current;
        if (!container) return;
        const focusable = Array.from(container.querySelectorAll(FOCUSABLE_SELECTORS))
          .filter((el) => !el.hasAttribute("disabled") && el.offsetParent !== null);
        if (focusable.length === 0) {
          e.preventDefault();
          return;
        }
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    };

    document.addEventListener("keydown", onKeyDown);

    // initial focus
    requestAnimationFrame(() => {
      try {
        if (initialFocusSelector && panelRef.current) {
          const el = panelRef.current.querySelector(initialFocusSelector);
          if (el) {
            el.focus();
            return;
          }
        }
        const focusable = panelRef.current?.querySelectorAll(FOCUSABLE_SELECTORS);
        if (focusable && focusable.length) {
          focusable[0].focus();
        } else if (panelRef.current) {
          panelRef.current.focus();
        }
      } catch (err) {
        // ignore
      }
    });

    // prevent background scroll
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = prevOverflow;
      // restore previous focus
      try {
        previouslyFocused.current?.focus?.();
      } catch (err) {}
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const triggerClose = () => {
    // run exit animation then call onClose
    setIsClosing(true);
    setIsVisible(false);
    // match duration to CSS below (200ms)
    setTimeout(() => {
      onClose && onClose();
    }, 220);
  };

  const onBackdropClick = (e) => {
    if (e.target === overlayRef.current) {
      triggerClose();
    }
  };

  return (
    <div
      ref={overlayRef}
      onMouseDown={onBackdropClick}
      aria-label={ariaLabel}
      role="dialog"
      aria-modal="true"
      className={`fixed inset-0 z-50 flex items-center justify-center bg-black/40 transition-opacity ${isVisible ? 'opacity-100' : 'opacity-0'}`}
    >
      <div
        ref={panelRef}
        role="document"
        tabIndex={-1}
        className={`bg-white rounded-lg shadow-xl max-h-[90vh] overflow-y-auto w-full max-w-3xl transform transition-all duration-200 ease-out
          ${isVisible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-2 scale-95'}
          ${isClosing ? 'pointer-events-none' : ''}
        `}
        style={{ outline: "none" }}
      >
        {children}
      </div>
    </div>
  );
};

export default Modal;