/**
 * Custom Two-Column Dialog Component
 * Replaces shadcn Dialog with a custom two-column layout for attendance details
 */

'use client';

import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface TwoColumnDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  maxWidth?: string;
}

export function TwoColumnDialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  maxWidth = 'max-w-7xl',
}: TwoColumnDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onOpenChange(false);
      }
    };

    if (open) {
      document.addEventListener('keydown', handleEscape);
      // Prevent body scroll when dialog is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [open, onOpenChange]);

  // Handle click outside
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onOpenChange(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleBackdropClick}
      />

      {/* Dialog Container */}
      <div
        ref={dialogRef}
        className={`relative ${maxWidth} w-full mx-4 max-h-[90vh] bg-white dark:bg-black rounded-lg shadow-2xl overflow-hidden flex flex-col`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-black">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {title}
            </h2>
            {description && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {description}
              </p>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onOpenChange(false)}
            className="h-8 w-8 p-0 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content - Two Column Layout */}
        <div className="flex-1 overflow-hidden">
          {children}
        </div>
      </div>
    </div>
  );
}

interface TwoColumnDialogContentProps {
  children: React.ReactNode;
  className?: string;
}

export function TwoColumnDialogContent({ children, className = '' }: TwoColumnDialogContentProps) {
  return (
    <div className={`flex flex-col md:flex-row h-[calc(90vh-80px)] bg-white dark:bg-black ${className}`}>
      {children}
    </div>
  );
}

interface TwoColumnDialogLeftProps {
  children: React.ReactNode;
  className?: string;
}

export function TwoColumnDialogLeft({ children, className = '' }: TwoColumnDialogLeftProps) {
  return (
    <div className={`w-full md:w-1/2 h-full md:h-auto md:flex-shrink-0 border-b md:border-b-0 md:border-r border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-black ${className}`}>
      {children}
    </div>
  );
}

interface TwoColumnDialogRightProps {
  children: React.ReactNode;
  className?: string;
}

export function TwoColumnDialogRight({ children, className = '' }: TwoColumnDialogRightProps) {
  return (
    <div className={`w-full md:w-1/2 h-full md:h-auto overflow-y-auto bg-white dark:bg-black ${className}`}>
      {children}
    </div>
  );
}