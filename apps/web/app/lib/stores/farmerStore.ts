import { create } from 'zustand';
import { Farmer, FarmerFilters, FarmerListResponse, Retailer, FarmerInsert, FarmerUpdate } from '@pgn/shared';
import { useAuthStore } from './authStore';

interface FarmerState {
  farmers: Farmer[];
  retailers: Retailer[];
  loading: boolean;
  loadingRetailers: boolean;
  error: string | null;
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
  filters: FarmerFilters;

  fetchFarmers: (params?: Partial<{ page: number; itemsPerPage: number; filters: FarmerFilters }>) => Promise<void>;
  fetchRetailers: () => Promise<void>;
  createFarmer: (farmerData: FarmerInsert) => Promise<{ success: boolean; error?: string; data?: Farmer }>;
  updateFarmer: (id: string, farmerData: FarmerUpdate) => Promise<{ success: boolean; error?: string; data?: Farmer }>;
  deleteFarmer: (id: string) => Promise<{ success: boolean; error?: string }>;
  setFilters: (filters: Partial<FarmerFilters>) => void;
  setPagination: (page: number, itemsPerPage?: number) => void;
  clearError: () => void;
  setError: (error: string | null) => void;
  refetch: () => Promise<void>;
}

// Helper function to get authentication headers
const getAuthHeaders = () => {
  const token = useAuthStore.getState().token;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'x-client-info': 'pgn-web-client',
    'User-Agent': 'pgn-admin-dashboard/1.0.0',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return headers;
};

/**
 * Transform technical error messages into user-friendly ones
 */
function getUserFriendlyErrorMessage(error: string): string {
  const cleanError = error.replace(/AuthApiError:\s*/, '').replace(/DatabaseError:\s*/, '').trim();

  if (cleanError.includes('new row violates row-level security policy')) {
    return 'You do not have permission to perform this action. Please contact your administrator.';
  }

  if (cleanError.includes('duplicate key')) {
    return 'A farmer with these details already exists.';
  }

  if (cleanError.includes('Network connection failed')) {
    return 'Network connection failed. Please check your internet connection and try again.';
  }

  if (cleanError.includes('Daily edit limit exceeded')) {
    return 'You have reached your daily edit limit. Please try again tomorrow.';
  }

  return cleanError || 'An unexpected error occurred. Please try again.';
}

export const useFarmerStore = create<FarmerState>((set, get) => ({
  farmers: [],
  retailers: [],
  loading: false,
  loadingRetailers: false,
  error: null,
  pagination: {
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 20,
    hasNextPage: false,
    hasPreviousPage: false,
  },
  filters: {
    search: '',
  },

  fetchFarmers: async (params) => {
    const state = get();
    const page = params?.page || state.pagination.currentPage;
    const itemsPerPage = params?.itemsPerPage || state.pagination.itemsPerPage;
    const filters = { ...state.filters, ...params?.filters };

    set({ loading: true, error: null });

    try {
      const searchParams = new URLSearchParams({
        page: page.toString(),
        itemsPerPage: itemsPerPage.toString(),
        ...(filters.search && { search: filters.search }),
        ...(filters.farm_name && { farm_name: filters.farm_name }),
        ...(filters.email && { email: filters.email }),
        ...(filters.phone && { phone: filters.phone }),
        ...(filters.retailer_id && { retailer_id: filters.retailer_id }),
        ...(filters.dealer_id && { dealer_id: filters.dealer_id }),
      });

      const response = await fetch(`/api/farmers?${searchParams}`, {
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Failed to fetch farmers');
      }

      const data: FarmerListResponse = await response.json();

      set({
        farmers: data.farmers,
        pagination: {
          currentPage: page,
          totalPages: data.pagination.totalPages,
          totalItems: data.pagination.totalItems,
          itemsPerPage: itemsPerPage,
          hasNextPage: page < data.pagination.totalPages,
          hasPreviousPage: page > 1,
        },
        filters,
        loading: false,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch farmers';
      set({
        error: getUserFriendlyErrorMessage(errorMessage),
        loading: false,
      });
    }
  },

  fetchRetailers: async () => {
    set({ loadingRetailers: true });

    try {
      const response = await fetch('/api/retailers?limit=1000', {
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch retailers');
      }

      const data = await response.json();
      set({ retailers: data.retailers || [], loadingRetailers: false });
    } catch (error) {
      console.error('Error fetching retailers:', error);
      set({ loadingRetailers: false });
    }
  },

  createFarmer: async (farmerData) => {
    set({ loading: true, error: null });

    try {
      const response = await fetch('/api/farmers', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(farmerData),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Failed to create farmer');
      }

      const data = await response.json();

      // Refetch the list to get updated data
      await get().fetchFarmers();

      return { success: true, data };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create farmer';
      set({ error: getUserFriendlyErrorMessage(errorMessage), loading: false });
      return { success: false, error: getUserFriendlyErrorMessage(errorMessage) };
    }
  },

  updateFarmer: async (id, farmerData) => {
    set({ loading: true, error: null });

    try {
      const response = await fetch(`/api/farmers/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(farmerData),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Failed to update farmer');
      }

      const data = await response.json();

      // Refetch the list to get updated data
      await get().fetchFarmers();

      return { success: true, data };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update farmer';
      set({ error: getUserFriendlyErrorMessage(errorMessage), loading: false });
      return { success: false, error: getUserFriendlyErrorMessage(errorMessage) };
    }
  },

  deleteFarmer: async (id) => {
    set({ loading: true, error: null });

    try {
      const response = await fetch(`/api/farmers/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Failed to delete farmer');
      }

      // Refetch the list to get updated data
      await get().fetchFarmers();

      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete farmer';
      set({ error: getUserFriendlyErrorMessage(errorMessage), loading: false });
      return { success: false, error: getUserFriendlyErrorMessage(errorMessage) };
    }
  },

  setFilters: (filters) => {
    set((state) => ({ filters: { ...state.filters, ...filters } }));
  },

  setPagination: (page, itemsPerPage) => {
    set((state) => ({
      pagination: {
        ...state.pagination,
        currentPage: page,
        itemsPerPage: itemsPerPage || state.pagination.itemsPerPage,
      },
    }));
  },

  clearError: () => set({ error: null }),

  setError: (error) => set({ error }),

  refetch: async () => {
    await get().fetchFarmers();
  },
}));