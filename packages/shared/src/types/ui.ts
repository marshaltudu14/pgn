// UI-related types shared between web and app

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  duration?: number;
}

export interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

// Generic error handling types (React-agnostic)
export interface ErrorInfo {
  componentStack: string;
  error: Error;
}

export interface ErrorState {
  hasError: boolean;
  error: Error | null;
}