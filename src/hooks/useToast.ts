import { useCallback } from 'react';

interface ToastOptions {
  title: string;
  description: string;
  variant?: 'default' | 'destructive';
}

export function useToast() {
  const toast = useCallback((options: ToastOptions) => {
    const toastEvent = new CustomEvent('show-toast', {
      detail: {
        type: options.variant === 'destructive' ? 'error' : 'success',
        title: options.title,
        message: options.description,
      }
    });
    window.dispatchEvent(toastEvent);
  }, []);

  return { toast };
} 