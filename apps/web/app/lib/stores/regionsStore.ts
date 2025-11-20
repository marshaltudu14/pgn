import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import {
  Region,
  CreateRegionRequest,
  UpdateRegionRequest,
  RegionFilter,
  PaginationParams,
  RegionsResponse,
  StateOption,
} from '@pgn/shared';

interface RegionsStore {
  // State
  regions: RegionsResponse;
  states: StateOption[];
  isLoading: boolean;
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
  error: string | null;
  createError: string | null;
  filter: RegionFilter;
  pagination: PaginationParams;

  // Actions
  fetchRegions: (filters?: RegionFilter, pagination?: PaginationParams) => Promise<void>;
  createRegion: (data: CreateRegionRequest) => Promise<Region>;
  updateRegion: (id: string, data: UpdateRegionRequest) => Promise<Region>;
  deleteRegion: (id: string) => Promise<void>;
  fetchStates: () => Promise<void>;
  searchRegions: (searchTerm: string, pagination?: PaginationParams) => Promise<void>;
  setFilter: (filter: Partial<RegionFilter>) => void;
  setPagination: (pagination: Partial<PaginationParams>) => void;
  clearError: () => void;
  clearCreateError: () => void;
  reset: () => void;
}

const initialState: RegionsResponse = {
  data: [],
  total: 0,
  page: 1,
  limit: 20,
  hasMore: false,
};

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
      filter: {},
      pagination: {
        page: 1,
        limit: 20,
      },

      // Fetch regions with filtering and pagination
      fetchRegions: async (filters: RegionFilter = {}, pagination: PaginationParams = {}) => {
        try {
          set({ isLoading: true, error: null });

          const queryParams = new URLSearchParams();
          if (filters.state) queryParams.append('state', filters.state);
          if (filters.city) queryParams.append('city', filters.city);
          if (pagination.page) queryParams.append('page', pagination.page.toString());
          if (pagination.limit) queryParams.append('limit', pagination.limit.toString());

          const response = await fetch(`/api/regions?${queryParams.toString()}`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
          });

          if (!response.ok) {
            throw new Error('Failed to fetch regions');
          }

          const data = await response.json();

          set({
            regions: data,
            isLoading: false,
            filter: filters,
            pagination: {
              page: data.page,
              limit: data.limit,
            },
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
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to create region');
          }

          const newRegion = await response.json();

          // Refresh the regions list
          const { filter, pagination } = get();
          await get().fetchRegions(filter, pagination);

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
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to update region');
          }

          const updatedRegion = await response.json();

          // Refresh the regions list
          const { filter, pagination } = get();
          await get().fetchRegions(filter, pagination);

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
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to delete region');
          }

          // Refresh the regions list
          const { filter, pagination } = get();
          await get().fetchRegions(filter, pagination);

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
          const response = await fetch('/api/regions/states');
          if (!response.ok) {
            throw new Error('Failed to fetch states');
          }
          const states = await response.json();
          set({ states });
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Failed to fetch states' });
        }
      },

  
      // Search regions
      searchRegions: async (searchTerm: string, pagination: PaginationParams = {}) => {
        try {
          set({ isLoading: true, error: null });

          const queryParams = new URLSearchParams();
          queryParams.append('q', searchTerm);
          if (pagination.page) queryParams.append('page', pagination.page.toString());
          if (pagination.limit) queryParams.append('limit', pagination.limit.toString());

          const response = await fetch(`/api/regions/search?${queryParams.toString()}`);
          if (!response.ok) {
            throw new Error('Failed to search regions');
          }
          const data = await response.json();

          set({
            regions: data,
            isLoading: false,
            pagination: {
              page: data.page,
              limit: data.limit,
            },
          });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to search regions',
            isLoading: false,
          });
        }
      },

      // Set filter
      setFilter: (filter: Partial<RegionFilter>) => {
        const currentFilter = get().filter;
        set({ filter: { ...currentFilter, ...filter } });
      },

      // Set pagination
      setPagination: (pagination: Partial<PaginationParams>) => {
        const currentPagination = get().pagination;
        set({ pagination: { ...currentPagination, ...pagination } });
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
          filter: {},
          pagination: {
            page: 1,
            limit: 20,
          },
        });
      },
    }),
    {
      name: 'regions-store',
    }
  )
);