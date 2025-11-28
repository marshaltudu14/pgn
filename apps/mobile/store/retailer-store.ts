import { create } from 'zustand';
import { devtools, persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Retailer, RetailerFilters, RetailerInsert, RetailerUpdate, RetailerListResponse } from '@pgn/shared';
import { api, ApiResponse } from '@/services/api-client';
import { API_ENDPOINTS, buildApiUrl } from '@/constants/api';

interface RetailerStoreState {
  // Data state
  retailers: Retailer[];
  loading: boolean;
  error: string | null;
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
  filters: RetailerFilters;

  // UI state
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
  selectedRetailer: Retailer | null;
  showFilters: boolean;

  // Actions
  fetchRetailers: (params?: {
    page?: number;
    itemsPerPage?: number;
    filters?: RetailerFilters;
    refresh?: boolean;
  }) => Promise<RetailerListResponse>;
  createRetailer: (retailerData: RetailerInsert) => Promise<ApiResponse<Retailer>>;
  updateRetailer: (id: string, retailerData: RetailerUpdate) => Promise<ApiResponse<Retailer>>;
  deleteRetailer: (id: string) => Promise<ApiResponse<void>>;
  getRetailerById: (id: string) => Promise<ApiResponse<Retailer>>;
  searchRetailers: (query: string, limit?: number) => Promise<ApiResponse<Retailer[]>>;

  // UI actions
  setSelectedRetailer: (retailer: Retailer | null) => void;
  setFilters: (filters: Partial<RetailerFilters>) => void;
  setPagination: (page: number, itemsPerPage?: number) => void;
  clearError: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

export const useRetailerStore = create<RetailerStoreState>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        retailers: [],
        loading: false,
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
        isCreating: false,
        isUpdating: false,
        isDeleting: false,
        selectedRetailer: null,
        showFilters: false,

        // Fetch retailers with pagination and filtering
        fetchRetailers: async (params = {}) => {
          const {
            page = 1,
            itemsPerPage = 20,
            filters,
            refresh = false
          } = params;

          const currentFilters = { ...get().filters, ...filters };
          const currentPage = refresh ? 1 : page;

          set({ loading: true, error: null });

          try {
            const queryParams = new URLSearchParams({
              page: currentPage.toString(),
              limit: itemsPerPage.toString(),
              ...(currentFilters.search && { search: currentFilters.search }),
              ...(currentFilters.shop_name && { shop_name: currentFilters.shop_name }),
              ...(currentFilters.email && { email: currentFilters.email }),
              ...(currentFilters.phone && { phone: currentFilters.phone }),
            });

            const response = await api.get<RetailerListResponse>(
              `${buildApiUrl(API_ENDPOINTS.RETAILERS)}?${queryParams}`
            );

            if (response.success && response.data) {
              set({
                retailers: response.data.retailers,
                pagination: {
                  currentPage: response.data.pagination.currentPage,
                  totalPages: response.data.pagination.totalPages,
                  totalItems: response.data.pagination.totalItems,
                  itemsPerPage: response.data.pagination.itemsPerPage,
                  hasNextPage: currentPage < response.data.pagination.totalPages,
                  hasPreviousPage: currentPage > 1,
                },
                loading: false,
              });
            } else {
              set({
                error: response.error || 'Failed to fetch retailers',
                loading: false,
              });
            }
            return response.data || {
              retailers: [],
              pagination: {
                currentPage: 1,
                totalPages: 1,
                totalItems: 0,
                itemsPerPage: 20,
                hasNextPage: false,
                hasPreviousPage: false,
              },
            };
          } catch (error) {
            set({
              error: 'Network error occurred while fetching retailers',
              loading: false,
            });
            throw error;
          }
        },

        // Create new retailer
        createRetailer: async (retailerData: RetailerInsert) => {
          set({ isCreating: true, error: null });

          try {
            const response = await api.post<Retailer>(buildApiUrl(API_ENDPOINTS.RETAILERS), retailerData);

            if (response.success && response.data) {
              // Refresh the list to get the updated data
              await get().fetchRetailers({ refresh: true });
              set({ isCreating: false });
              return response;
            } else {
              set({ error: response.error || 'Failed to create retailer', isCreating: false });
              return response;
            }
          } catch (error) {
            set({ error: 'Network error occurred while creating retailer', isCreating: false });
            throw error;
          }
        },

        // Update existing retailer
        updateRetailer: async (id: string, retailerData: RetailerUpdate) => {
          set({ isUpdating: true, error: null });

          try {
            const response = await api.put<Retailer>(buildApiUrl(`${API_ENDPOINTS.RETAILER_BY_ID}/${id}`), retailerData);

            if (response.success && response.data) {
              // Refresh the list to get the updated data
              await get().fetchRetailers({ refresh: true });
              set({ isUpdating: false });
              return response;
            } else {
              set({ error: response.error || 'Failed to update retailer', isUpdating: false });
              return response;
            }
          } catch (error) {
            set({ error: 'Network error occurred while updating retailer', isUpdating: false });
            throw error;
          }
        },

        // Delete retailer
        deleteRetailer: async (id: string) => {
          set({ isDeleting: true, error: null });

          try {
            const response = await api.delete<void>(buildApiUrl(`${API_ENDPOINTS.RETAILER_BY_ID}/${id}`));

            if (response.success) {
              // Refresh the list to get the updated data
              await get().fetchRetailers({ refresh: true });
              set({ isDeleting: false });
              return response;
            } else {
              set({ error: response.error || 'Failed to delete retailer', isDeleting: false });
              return response;
            }
          } catch (error) {
            set({ error: 'Network error occurred while deleting retailer', isDeleting: false });
            throw error;
          }
        },

        // Get retailer by ID
        getRetailerById: async (id: string) => {
          set({ loading: true, error: null });

          try {
            const response = await api.get<Retailer>(buildApiUrl(`${API_ENDPOINTS.RETAILER_BY_ID}/${id}`));

            if (response.success && response.data) {
              set({ loading: false });
              return response;
            } else {
              set({ error: response.error || 'Failed to fetch retailer', loading: false });
              return response;
            }
          } catch (error) {
            set({ error: 'Network error occurred while fetching retailer', loading: false });
            throw error;
          }
        },

        // Search retailers
        searchRetailers: async (query: string, limit = 10) => {
          try {
            const queryParams = new URLSearchParams({
              search: query,
              limit: limit.toString(),
            });

            const response = await api.get<Retailer[]>(`${buildApiUrl(API_ENDPOINTS.RETAILERS)}?${queryParams}`);

            if (response.success && response.data) {
              return response;
            } else {
              return response;
            }
          } catch (error) {
            console.error('Error searching retailers:', error);
            throw error;
          }
        },

        // UI Actions
        setSelectedRetailer: (retailer) => set({ selectedRetailer: retailer }),
        setFilters: (filters) => set((state) => ({ filters: { ...state.filters, ...filters } })),
        setPagination: (page, itemsPerPage) => set((state) => ({
          pagination: {
            ...state.pagination,
            currentPage: page,
            itemsPerPage: itemsPerPage || state.pagination.itemsPerPage,
          },
        })),
        clearError: () => set({ error: null }),
        setLoading: (loading) => set({ loading }),
        setError: (error) => set({ error }),
        reset: () => {
          set({
            retailers: [],
            loading: false,
            error: null,
            pagination: {
              currentPage: 1,
              totalPages: 1,
              totalItems: 0,
              itemsPerPage: 20,
              hasNextPage: false,
              hasPreviousPage: false,
            },
            filters: { search: '' },
            isCreating: false,
            isUpdating: false,
            isDeleting: false,
            selectedRetailer: null,
            showFilters: false,
          });
        },
      }),
      {
        name: 'retailer-store',
        storage: createJSONStorage(() => AsyncStorage),
      }
    )
  )
);