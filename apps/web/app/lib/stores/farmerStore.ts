import { create } from 'zustand';
import { Farmer, FarmerWithRetailer, FarmerFilters, FarmerListResponse, Retailer, FarmerFormData } from '@pgn/shared';
import { useAuthStore } from './authStore';
import { handleApiResponse, getAuthHeaders, transformApiErrorMessage } from './utils/errorHandling';

interface FarmerState {
  farmers: FarmerWithRetailer[];
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
  fetchRetailers: (params?: { search?: string; limit?: number }) => Promise<void>;
  createFarmer: (farmerData: FarmerFormData) => Promise<{ success: boolean; error?: string; data?: Farmer }>;
  updateFarmer: (id: string, farmerData: FarmerFormData) => Promise<{ success: boolean; error?: string; data?: Farmer }>;
  deleteFarmer: (id: string) => Promise<{ success: boolean; error?: string }>;
  setFilters: (filters: Partial<FarmerFilters>) => void;
  setPagination: (page: number, itemsPerPage?: number) => void;
  clearError: () => void;
  setError: (error: string | null) => void;
  refetch: () => Promise<void>;
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
    sort_by: 'updated_at',
    sort_order: 'desc',
  },

  fetchFarmers: async (params = {}) => {
    const state = get();
    const page = params?.page || state.pagination.currentPage;
    const itemsPerPage = params?.itemsPerPage || state.pagination.itemsPerPage;
    const filters = { ...state.filters, ...params?.filters };

    set({ loading: true, error: null });

    try {
      const searchParams = new URLSearchParams({
        page: page.toString(),
        limit: itemsPerPage.toString(),
        ...(filters.search && { search: filters.search }),
        ...(filters.farm_name && { farm_name: filters.farm_name }),
        ...(filters.email && { email: filters.email }),
        ...(filters.phone && { phone: filters.phone }),
        ...(filters.retailer_id && { retailer_id: filters.retailer_id }),
        ...(filters.dealer_id && { dealer_id: filters.dealer_id }),
        sort_by: filters.sort_by || 'updated_at',
        sort_order: filters.sort_order || 'desc',
      });

      const token = useAuthStore.getState().token;
      const response = await fetch(`/api/farmers?${searchParams}`, {
        headers: getAuthHeaders(token),
      });

      const result = await handleApiResponse(response, 'Failed to fetch farmers');

      if (!result.success) {
        set({
          error: result.error || 'Failed to fetch farmers',
          loading: false,
        });
        return;
      }

      const data: FarmerListResponse = result.data as FarmerListResponse;

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
      const errorMessage = transformApiErrorMessage(error);
      set({
        error: errorMessage,
        loading: false,
      });
    }
  },

  fetchRetailers: async (params) => {
    set({ loadingRetailers: true });

    try {
      const searchParams = new URLSearchParams();
      if (params?.search) searchParams.set('search', params.search);
      if (params?.limit) searchParams.set('limit', params.limit.toString());
      if (!params?.limit) searchParams.set('limit', '10'); // Default limit for dropdown

      const token = useAuthStore.getState().token;
      const response = await fetch(`/api/retailers?${searchParams}`, {
        headers: getAuthHeaders(token),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch retailers');
      }

      const data = await response.json();
      // Handle different response formats
      const retailers = data.data?.retailers || data.retailers || [];
      set({ retailers, loadingRetailers: false });
    } catch (error) {
      console.error('Error fetching retailers:', error);
      set({ loadingRetailers: false });
    }
  },

  createFarmer: async (farmerData: FarmerFormData) => {
    set({ loading: true, error: null });

    try {
      const token = useAuthStore.getState().token;
      const response = await fetch('/api/farmers', {
        method: 'POST',
        headers: getAuthHeaders(token),
        body: JSON.stringify(farmerData),
      });

      const result = await handleApiResponse(response, 'Failed to create farmer');

      if (!result.success) {
        set({ error: result.error || 'Failed to create farmer', loading: false });
        return { success: false, error: result.error };
      }

      const data: Farmer = result.data as Farmer;

      // Refetch the list to get updated data
      await get().fetchFarmers();

      return { success: true, data };
    } catch (error) {
      const errorMessage = transformApiErrorMessage(error);
      set({ error: errorMessage, loading: false });
      return { success: false, error: errorMessage };
    }
  },

  updateFarmer: async (id: string, farmerData: FarmerFormData) => {
    set({ loading: true, error: null });

    try {
      const token = useAuthStore.getState().token;
      const response = await fetch(`/api/farmers/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(token),
        body: JSON.stringify(farmerData),
      });

      const result = await handleApiResponse(response, 'Failed to update farmer');

      if (!result.success) {
        set({ error: result.error || 'Failed to update farmer', loading: false });
        return { success: false, error: result.error };
      }

      const data: Farmer = result.data as Farmer;

      // Refetch the list to get updated data
      await get().fetchFarmers();

      return { success: true, data };
    } catch (error) {
      const errorMessage = transformApiErrorMessage(error);
      set({ error: errorMessage, loading: false });
      return { success: false, error: errorMessage };
    }
  },

  deleteFarmer: async (id: string) => {
    set({ loading: true, error: null });

    try {
      const token = useAuthStore.getState().token;
      const response = await fetch(`/api/farmers/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(token),
      });

      const result = await handleApiResponse(response, 'Failed to delete farmer');

      if (!result.success) {
        set({ error: result.error || 'Failed to delete farmer', loading: false });
        return { success: false, error: result.error };
      }

      // Refetch the list to get updated data
      await get().fetchFarmers();

      return { success: true };
    } catch (error) {
      const errorMessage = transformApiErrorMessage(error);
      set({ error: errorMessage, loading: false });
      return { success: false, error: errorMessage };
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