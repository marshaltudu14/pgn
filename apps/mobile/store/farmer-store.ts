import { create } from 'zustand';
import { devtools, persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Farmer, FarmerFilters, FarmerInsert, FarmerUpdate, FarmerListResponse } from '@pgn/shared';
import { api, ApiResponse } from '@/services/api-client';
import { API_ENDPOINTS } from '@/constants/api';
import { handleMobileApiResponse, transformApiErrorMessage } from './utils/errorHandling';
import { useRegionStore } from './region-store';

interface FarmerStoreState {
  // Data state
  farmers: Farmer[];
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
  filters: FarmerFilters;

  // UI state
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
  selectedFarmer: Farmer | null;
  showFilters: boolean;

  // Actions
  fetchFarmers: (params?: {
    page?: number;
    itemsPerPage?: number;
    filters?: FarmerFilters;
    refresh?: boolean;
  }) => Promise<FarmerListResponse>;
  createFarmer: (farmerData: FarmerInsert) => Promise<ApiResponse<Farmer>>;
  updateFarmer: (id: string, farmerData: FarmerUpdate) => Promise<ApiResponse<Farmer>>;
  deleteFarmer: (id: string) => Promise<ApiResponse<void>>;
  getFarmerById: (id: string) => Promise<ApiResponse<Farmer>>;
  searchFarmers: (query: string, limit?: number) => Promise<ApiResponse<Farmer[]>>;

  // UI actions
  setSelectedFarmer: (farmer: Farmer | null) => void;
  setFilters: (filters: Partial<FarmerFilters>) => void;
  setPagination: (page: number, itemsPerPage?: number) => void;
  clearError: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

export const useFarmerStore = create<FarmerStoreState>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        farmers: [],
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
        selectedFarmer: null,
        showFilters: false,

        // Fetch farmers with pagination and filtering
        fetchFarmers: async (params = {}) => {
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
              ...(currentFilters.farm_name && { farm_name: currentFilters.farm_name }),
              ...(currentFilters.email && { email: currentFilters.email }),
              ...(currentFilters.phone && { phone: currentFilters.phone }),
              ...(currentFilters.region_id && { region_id: currentFilters.region_id }),
              ...(currentFilters.retailer_id && { retailer_id: currentFilters.retailer_id }),
              ...(currentFilters.dealer_id && { dealer_id: currentFilters.dealer_id }),
            });

            const response = await api.get<FarmerListResponse>(
              `${API_ENDPOINTS.FARMERS}?${queryParams}`
            );

            // Handle API response with validation error support
            const handledResponse = handleMobileApiResponse(response.data || response, 'Failed to fetch farmers');

            const farmerData = handledResponse.data as any;
            if (handledResponse.success && farmerData) {
              set({
                farmers: farmerData.farmers,
                pagination: {
                  currentPage: farmerData.pagination.currentPage,
                  totalPages: farmerData.pagination.totalPages,
                  totalItems: farmerData.pagination.totalItems,
                  itemsPerPage: farmerData.pagination.itemsPerPage,
                  hasNextPage: currentPage < farmerData.pagination.totalPages,
                  hasPreviousPage: currentPage > 1,
                },
                loading: false,
              });
            } else {
              set({
                error: handledResponse.error || 'Failed to fetch farmers',
                loading: false,
              });
            }
            return (handledResponse.data as FarmerListResponse) || {
              farmers: [],
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
              error: 'Network error occurred while fetching farmers',
              loading: false,
            });
            throw error;
          }
        },

        // Create new farmer
        createFarmer: async (farmerData: FarmerInsert) => {
          set({ isCreating: true, error: null });

          try {
            const response = await api.post<Farmer>(API_ENDPOINTS.FARMERS, farmerData);

            // Handle API response with validation error support
            const handledResponse = handleMobileApiResponse(response.data || response, 'Failed to create farmer');

            if (handledResponse.success && handledResponse.data) {
              // Refresh the list to get the updated data
              await get().fetchFarmers({ refresh: true });
              set({ isCreating: false });
              return handledResponse as ApiResponse<Farmer>;
            } else {
              set({ error: handledResponse.error || 'Failed to create farmer', isCreating: false });
              return {
                success: false,
                error: handledResponse.error || 'Failed to create farmer'
              };
            }
          } catch (error) {
            const errorMessage = transformApiErrorMessage(error);
            set({ error: errorMessage, isCreating: false });
            throw error;
          }
        },

        // Update existing farmer
        updateFarmer: async (id: string, farmerData: FarmerUpdate) => {
          set({ isUpdating: true, error: null });

          try {
            const response = await api.put<Farmer>(`${API_ENDPOINTS.FARMER_BY_ID}/${id}`, farmerData);

            if (response.success && response.data) {
              // Refresh the list to get the updated data
              await get().fetchFarmers({ refresh: true });
              set({ isUpdating: false });
              return response;
            } else {
              set({ error: response.error || 'Failed to update farmer', isUpdating: false });
              return response;
            }
          } catch (error) {
            set({ error: 'Network error occurred while updating farmer', isUpdating: false });
            throw error;
          }
        },

        // Delete farmer
        deleteFarmer: async (id: string) => {
          set({ isDeleting: true, error: null });

          try {
            const response = await api.delete<void>(`${API_ENDPOINTS.FARMER_BY_ID}/${id}`);

            if (response.success) {
              // Refresh the list to get the updated data
              await get().fetchFarmers({ refresh: true });
              set({ isDeleting: false });
              return response;
            } else {
              set({ error: response.error || 'Failed to delete farmer', isDeleting: false });
              return response;
            }
          } catch (error) {
            set({ error: 'Network error occurred while deleting farmer', isDeleting: false });
            throw error;
          }
        },

        // Get farmer by ID
        getFarmerById: async (id: string) => {
          set({ loading: true, error: null });

          try {
            const response = await api.get<Farmer>(`${API_ENDPOINTS.FARMER_BY_ID}/${id}`);

            if (response.success && response.data) {
              set({ loading: false });
              return response;
            } else {
              set({ error: response.error || 'Failed to fetch farmer', loading: false });
              return response;
            }
          } catch (error) {
            set({ error: 'Network error occurred while fetching farmer', loading: false });
            throw error;
          }
        },

        // Search farmers
        searchFarmers: async (query: string, limit = 10) => {
          try {
            const queryParams = new URLSearchParams({
              search: query,
              limit: limit.toString(),
            });

            const response = await api.get<Farmer[]>(`${API_ENDPOINTS.FARMERS}?${queryParams}`);

            if (response.success && response.data) {
              return response;
            } else {
              return response;
            }
          } catch (error) {
            console.error('Error searching farmers:', error);
            throw error;
          }
        },

        // UI Actions
        setSelectedFarmer: (farmer) => set({ selectedFarmer: farmer }),
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
            farmers: [],
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
            selectedFarmer: null,
            showFilters: false,
          });
        },
      }),
      {
        name: 'farmer-store',
        storage: createJSONStorage(() => AsyncStorage),
      }
    )
  )
);