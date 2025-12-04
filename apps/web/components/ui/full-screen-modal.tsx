/**
 * Custom Full-Screen Modal Component
 * A full-screen modal overlay with padding for displaying detailed information
 */

'use client';

import { ReactNode, useEffect } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface FullScreenModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: ReactNode;
  actions?: ReactNode;
}

export function FullScreenModal({
  open,
  onOpenChange,
  title,
  description,
  children,
  actions,
}: FullScreenModalProps) {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onOpenChange(false);
      }
    };

    if (open) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [open, onOpenChange]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={() => onOpenChange(false)}
      />

      {/* Modal Content */}
      <div className="relative z-10 flex h-[95vh] w-[95vw] max-w-7xl flex-col overflow-hidden rounded-2xl bg-white dark:bg-black shadow-2xl border border-gray-200 dark:border-gray-800">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-black px-6 py-4">
          <div className="flex flex-col gap-1">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">{title}</h2>
            {description && (
              <p className="text-sm text-gray-600 dark:text-gray-400">{description}</p>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onOpenChange(false)}
            className="h-10 w-10 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <X className="h-4 w-4 text-gray-500 dark:text-gray-400" />
          </Button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-white dark:bg-black">
          {children}
        </div>

        {/* Actions Footer */}
        {actions && (
          <div className="border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-black px-6 py-4">
            <div className="flex items-center justify-end gap-3">
              {actions}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}