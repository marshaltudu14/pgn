import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import {
  Region,
  CreateRegionRequest,
  UpdateRegionRequest,
  RegionListParams,
  StateOption,
} from '@pgn/shared';
import { getAuthHeaders } from './utils/errorHandling';

interface PaginationState {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
}

interface RegionsStore {
  // State
  regions: Region[];
  states: StateOption[];
  isLoading: boolean;
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
  error: string | null;
  createError: string | null;
  pagination: PaginationState;
  filters: RegionListParams;

  // Actions
  fetchRegions: (params?: RegionListParams) => Promise<void>;
  createRegion: (data: CreateRegionRequest) => Promise<Region>;
  updateRegion: (id: string, data: UpdateRegionRequest) => Promise<Region>;
  deleteRegion: (id: string) => Promise<void>;
  fetchStates: () => Promise<void>;
  searchRegions: (searchTerm: string, params?: Omit<RegionListParams, 'search'>) => Promise<void>;
  setFilters: (filters: Partial<RegionListParams>) => void;
  setPagination: (page?: number, itemsPerPage?: number) => void;
  clearError: () => void;
  clearCreateError: () => void;
  reset: () => void;
}

const initialState: Region[] = [];

export const useRegionsStore = create<RegionsStore>()(
  devtools(
    (set, get) => ({
      // Initial state
      regions: initialState,
      states: [],
      isLoading: true, // Start with loading true since we fetch data immediately
      isCreating: false,
      isUpdating: false,
      isDeleting: false,
      error: null,
      createError: null,
      pagination: {
        currentPage: 1,
        totalPages: 1,
        totalItems: 0,
        itemsPerPage: 10,
      },
      filters: {
        page: 1,
        limit: 10,
        sort_by: 'city',
        sort_order: 'asc',
      },

      // Fetch regions with pagination and filtering
      fetchRegions: async (params: RegionListParams = {}) => {
        try {
          set({ isLoading: true, error: null });

          const store = get();
          const requestParams = {
            page: params.page || store.filters.page,
            limit: params.limit || store.filters.limit,
            search: params.search || store.filters.search,
            state: params.state || store.filters.state,
            city: params.city || store.filters.city,
            sort_by: params.sort_by || store.filters.sort_by,
            sort_order: params.sort_order || store.filters.sort_order,
          };

          const queryParams = new URLSearchParams();
          Object.entries(requestParams).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
              queryParams.append(key, value.toString());
            }
          });

          const response = await fetch(`/api/regions?${queryParams.toString()}`, {
            method: 'GET',
            headers: getAuthHeaders(),
          });

          if (!response.ok) {
            throw new Error('Failed to fetch regions');
          }

          const data = await response.json();

          set({
            regions: data.regions,
            pagination: data.pagination,
            filters: requestParams,
            isLoading: false,
          });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to fetch regions',
            isLoading: false,
          });
        }
      },

      // Create a new region
      createRegion: async (data: CreateRegionRequest) => {
        try {
          set({ isCreating: true, error: null, createError: null });

          const response = await fetch('/api/regions', {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(data),
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to create region');
          }

          const newRegion = await response.json();

          // Refresh the regions list
          const { filters } = get();
          await get().fetchRegions(filters);

          set({ isCreating: false, createError: null });
          return newRegion;
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to create region',
            createError: error instanceof Error ? error.message : 'Failed to create region',
            isCreating: false,
          });
          throw error;
        }
      },

      // Update an existing region
      updateRegion: async (id: string, data: UpdateRegionRequest) => {
        try {
          set({ isUpdating: true, error: null });

          const response = await fetch(`/api/regions/${id}`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify(data),
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to update region');
          }

          const updatedRegion = await response.json();

          // Refresh the regions list
          const { filters } = get();
          await get().fetchRegions(filters);

          set({ isUpdating: false });
          return updatedRegion;
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to update region',
            isUpdating: false,
          });
          throw error;
        }
      },

      // Delete a region
      deleteRegion: async (id: string) => {
        try {
          set({ isDeleting: true, error: null });

          const response = await fetch(`/api/regions/${id}`, {
            method: 'DELETE',
            headers: getAuthHeaders(),
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to delete region');
          }

          // Refresh the regions list
          const { filters } = get();
          await get().fetchRegions(filters);

          set({ isDeleting: false });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to delete region',
            isDeleting: false,
          });
          throw error;
        }
      },

      // Fetch all states
      fetchStates: async () => {
        try {
          const response = await fetch('/api/regions/states', {
            headers: getAuthHeaders(),
          });
          if (!response.ok) {
            throw new Error('Failed to fetch states');
          }
          const statesResponse = await response.json();
          set({ states: statesResponse.data });
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Failed to fetch states' });
        }
      },

  
      // Search regions with pagination
      searchRegions: async (searchTerm: string, params: Omit<RegionListParams, 'search'> = {}) => {
        try {
          set({ isLoading: true, error: null });

          const store = get();
          const searchParams = {
            page: params.page || 1,
            limit: params.limit || store.filters.limit,
            sort_by: params.sort_by || store.filters.sort_by,
            sort_order: params.sort_order || store.filters.sort_order,
          };

          const queryParams = new URLSearchParams();
          queryParams.append('q', searchTerm);
          queryParams.append('page', searchParams.page?.toString() || '1');
          queryParams.append('limit', searchParams.limit?.toString() || '10');
          queryParams.append('sort_by', searchParams.sort_by || 'city');
          queryParams.append('sort_order', searchParams.sort_order || 'asc');

          const response = await fetch(`/api/regions/search?${queryParams.toString()}`, {
            headers: getAuthHeaders(),
          });
          if (!response.ok) {
            throw new Error('Failed to search regions');
          }
          const data = await response.json();

          set({
            regions: data.regions,
            pagination: data.pagination,
            filters: {
              ...store.filters,
              search: searchTerm,
              ...searchParams,
            },
            isLoading: false,
          });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to search regions',
            isLoading: false,
          });
        }
      },

      // Set filters
      setFilters: (filters: Partial<RegionListParams>) => {
        const currentFilters = get().filters;
        const newFilters = { ...currentFilters, ...filters };
        set({
          filters: newFilters,
        });
      },

      // Set pagination
      setPagination: (page?: number, itemsPerPage?: number) => {
        const currentFilters = get().filters;
        const newFilters = { ...currentFilters };

        if (page !== undefined) {
          newFilters.page = page;
        }
        if (itemsPerPage !== undefined) {
          newFilters.limit = itemsPerPage;
        }

        set({
          filters: newFilters,
        });
      },

      // Clear error
      clearError: () => {
        set({ error: null });
      },

      // Clear create error
      clearCreateError: () => {
        set({ createError: null });
      },

      // Reset store
      reset: () => {
        set({
          regions: initialState,
          states: [],
          isLoading: true, // Start with loading true since we fetch data immediately
          isCreating: false,
          isUpdating: false,
          isDeleting: false,
          error: null,
          createError: null,
          pagination: {
            currentPage: 1,
            totalPages: 1,
            totalItems: 0,
            itemsPerPage: 10,
          },
          filters: {
            page: 1,
            limit: 10,
            sort_by: 'city',
            sort_order: 'asc',
          },
        });
      },
    }),
    {
      name: 'regions-store',
    }
  )
);