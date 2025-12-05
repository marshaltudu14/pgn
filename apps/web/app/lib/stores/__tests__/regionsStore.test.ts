/**
 * Unit tests for Regions Store using Jest
 */

import {
  CreateRegionRequest,
  Region,
  RegionFilter,
  StateOption,
  UpdateRegionRequest,
} from '@pgn/shared';
import { act, renderHook } from '@testing-library/react';
import { useAuthStore } from '../authStore';
import { useRegionsStore } from '../regionsStore';
import { getAuthHeaders } from '../utils/errorHandling';

// Mock authStore
jest.mock('../authStore');

// Mock errorHandling utils
jest.mock('../utils/errorHandling');

// Mock fetch
global.fetch = jest.fn();

// Helper function to create mock region data
const createMockRegion = (overrides: Partial<Region> = {}): Region => ({
  id: 'region-123',
  state: 'California',
  city: 'Los Angeles',
  state_slug: 'california',
  city_slug: 'los-angeles',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...overrides,
});

// Helper function to create mock regions data
const createMockRegions = (count: number = 1, overrides: Partial<Region> = {}): Region[] => {
  const regions: Region[] = [];
  for (let i = 0; i < count; i++) {
    regions.push(createMockRegion({ ...overrides, id: `region-${i + 1}` }));
  }
  return regions;
};

// Helper function to create mock state options
const createMockStates = (): StateOption[] => [
  { state: 'California', state_slug: 'california' },
  { state: 'Texas', state_slug: 'texas' },
  { state: 'New York', state_slug: 'new-york' },
];

// Mock useAuthStore with proper structure
const mockUseAuthStore = useAuthStore as jest.MockedFunction<
  typeof useAuthStore
>;

// Mock the authStore getState method and attach it to the mock
const mockAuthStoreGetState = jest.fn().mockReturnValue({ token: 'mock-token' });

// Mock getAuthHeaders function
const mockGetAuthHeaders = getAuthHeaders as jest.MockedFunction<typeof getAuthHeaders>;

describe('Regions Store', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Reset the authStore mock to return token by default
    mockAuthStoreGetState.mockReturnValue({ token: 'mock-token' });

    // Mock the useAuthStore to have a proper getState method
    mockUseAuthStore.mockImplementation(() => ({
      getState: mockAuthStoreGetState,
    } as ReturnType<typeof useAuthStore>));

    // Also mock the direct useAuthStore.getState() call
    (useAuthStore.getState as jest.Mock) = mockAuthStoreGetState;

    // Mock getAuthHeaders to return proper headers
    mockGetAuthHeaders.mockReturnValue({
      'Content-Type': 'application/json',
      'x-client-info': 'pgn-web-client',
      'User-Agent': 'pgn-admin-dashboard/1.0.0',
      Authorization: 'Bearer mock-token',
    });

    // Force complete store reset by recreating the store
    useRegionsStore.setState({
      regions: [],
      states: [],
      isLoading: true,
      isCreating: false,
      isUpdating: false,
      isDeleting: false,
      error: null,
      createError: null,
      filters: {
        sort_by: 'city',
        sort_order: 'asc',
      },
    });

    // Mock fetch responses
    (fetch as jest.MockedFunction<typeof fetch>).mockImplementation((url) => {
      if (typeof url === 'string' && url.includes('/states')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ data: createMockStates() }),
        } as Response);
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(createMockRegions()),
      } as Response);
    });
  });

  afterEach(() => {
    jest.resetAllMocks();
    jest.clearAllMocks();
  });

  describe('Initial State', () => {
    it('should have correct initial state', () => {
      const { result } = renderHook(() => useRegionsStore());

      expect(result.current.regions).toEqual([]);
      expect(result.current.states).toEqual([]);
      expect(result.current.isLoading).toBe(true);
      expect(result.current.isCreating).toBe(false);
      expect(result.current.isUpdating).toBe(false);
      expect(result.current.isDeleting).toBe(false);
      expect(result.current.error).toBe(null);
      expect(result.current.createError).toBe(null);
      expect(result.current.filters).toEqual({
        sort_by: 'city',
        sort_order: 'asc',
      });
    });
  });

  
  describe('fetchRegions', () => {
    it('should fetch regions successfully with default parameters', async () => {
      const mockRegionsResponse = createMockRegions();
      const mockResponse = {
        regions: mockRegionsResponse,
        pagination: {
          currentPage: 1,
          totalPages: 1,
          totalItems: 1,
          itemsPerPage: 10,
        },
      };

      (fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      } as Response);

      const { result } = renderHook(() => useRegionsStore());

      await act(async () => {
        await result.current.fetchRegions();
      });

      expect(result.current.isLoading).toBe(false);
      expect(result.current.regions).toEqual(mockRegionsResponse);
      expect(result.current.filters).toEqual({
        page: 1,
        limit: 10,
        sort_by: 'city',
        sort_order: 'asc',
      });
      expect(result.current.error).toBe(null);

      expect(fetch).toHaveBeenCalledWith('/api/regions?page=1&limit=10&sort_by=city&sort_order=asc', {
        method: 'GET',
        headers: mockGetAuthHeaders(),
      });
    });

    it('should fetch regions with filters', async () => {
      const mockRegionsResponse = createMockRegions();
      const mockResponse = {
        regions: mockRegionsResponse,
        pagination: {
          currentPage: 1,
          totalPages: 1,
          totalItems: 1,
          itemsPerPage: 10,
        },
      };
      (fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      } as Response);

      const { result } = renderHook(() => useRegionsStore());

      const filters: RegionFilter = {
        state: 'California',
        city: 'Los Angeles',
      };

      await act(async () => {
        await result.current.fetchRegions(filters);
      });

      expect(fetch).toHaveBeenCalledWith(
        '/api/regions?page=1&limit=10&state=California&city=Los+Angeles&sort_by=city&sort_order=asc',
        {
          method: 'GET',
          headers: mockGetAuthHeaders(),
        }
      );
    });

    it('should handle fetch regions error', async () => {
      (fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
        ok: false,
        statusText: 'Not Found',
      } as Response);

      const { result } = renderHook(() => useRegionsStore());

      await act(async () => {
        await result.current.fetchRegions();
      });

      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBe('Failed to fetch regions');
    });

    it('should handle network error during fetch', async () => {
      (fetch as jest.MockedFunction<typeof fetch>).mockRejectedValueOnce(
        new Error('Network error')
      );

      const { result } = renderHook(() => useRegionsStore());

      await act(async () => {
        await result.current.fetchRegions();
      });

      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBe('Network error');
    });
  });

  describe('createRegion', () => {
    const mockCreateRequest: CreateRegionRequest = {
      state: 'California',
      city: 'Los Angeles',
    };

    const mockNewRegion = createMockRegion();

    it('should create region successfully', async () => {
      const mockRegionsResponse = createMockRegions();
      const mockFetchRegionsResponse = {
        regions: mockRegionsResponse,
        pagination: {
          currentPage: 1,
          totalPages: 1,
          totalItems: 1,
          itemsPerPage: 10,
        },
      };
      // Mock create API call
      (fetch as jest.MockedFunction<typeof fetch>)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockNewRegion),
        } as Response)
        // Mock fetchRegions call that happens after creation
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockFetchRegionsResponse),
        } as Response);

      const { result } = renderHook(() => useRegionsStore());

      let createdRegion;
      await act(async () => {
        createdRegion = await result.current.createRegion(mockCreateRequest);
      });

      expect(result.current.isCreating).toBe(false);
      expect(result.current.createError).toBe(null);
      expect(result.current.regions).toEqual(mockRegionsResponse);
      expect(createdRegion).toEqual(mockNewRegion);

      expect(fetch).toHaveBeenCalledWith('/api/regions', {
        method: 'POST',
        headers: mockGetAuthHeaders(),
        body: JSON.stringify(mockCreateRequest),
      });
    });

    it('should handle create region error', async () => {
      (fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ error: 'Region already exists' }),
      } as Response);

      const { result } = renderHook(() => useRegionsStore());

      await act(async () => {
        try {
          await result.current.createRegion(mockCreateRequest);
        } catch {
          // Expected to throw
        }
      });

      expect(result.current.isCreating).toBe(false);
      expect(result.current.createError).toBe('Region already exists');
      expect(result.current.error).toBe('Region already exists');
    });

    it('should handle network error during create', async () => {
      (fetch as jest.MockedFunction<typeof fetch>).mockRejectedValueOnce(
        new Error('Network error')
      );

      const { result } = renderHook(() => useRegionsStore());

      await act(async () => {
        try {
          await result.current.createRegion(mockCreateRequest);
        } catch {
          // Expected to throw
        }
      });

      expect(result.current.isCreating).toBe(false);
      expect(result.current.createError).toBe('Network error');
      expect(result.current.error).toBe('Network error');
    });
  });

  describe('updateRegion', () => {
    const mockUpdateRequest: UpdateRegionRequest = {
      city: 'San Diego',
    };

    const mockUpdatedRegion = createMockRegion({
      city: 'San Diego',
      city_slug: 'san-diego',
    });

    it('should update region successfully', async () => {
      const mockRegionsResponse = createMockRegions();
      const mockFetchRegionsResponse = {
        regions: mockRegionsResponse,
        pagination: {
          currentPage: 1,
          totalPages: 1,
          totalItems: 1,
          itemsPerPage: 10,
        },
      };
      // Mock update API call
      (fetch as jest.MockedFunction<typeof fetch>)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockUpdatedRegion),
        } as Response)
        // Mock fetchRegions call that happens after update
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockFetchRegionsResponse),
        } as Response);

      const { result } = renderHook(() => useRegionsStore());

      let updatedRegion;
      await act(async () => {
        updatedRegion = await result.current.updateRegion(
          'region-123',
          mockUpdateRequest
        );
      });

      expect(result.current.isUpdating).toBe(false);
      expect(result.current.error).toBe(null);
      expect(result.current.regions).toEqual(mockRegionsResponse);
      expect(updatedRegion).toEqual(mockUpdatedRegion);

      expect(fetch).toHaveBeenCalledWith('/api/regions/region-123', {
        method: 'PUT',
        headers: mockGetAuthHeaders(),
        body: JSON.stringify(mockUpdateRequest),
      });
    });

    it('should handle update region error', async () => {
      (fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ error: 'Region not found' }),
      } as Response);

      const { result } = renderHook(() => useRegionsStore());

      await act(async () => {
        try {
          await result.current.updateRegion('non-existent', mockUpdateRequest);
        } catch {
          // Expected to throw
        }
      });

      expect(result.current.isUpdating).toBe(false);
      expect(result.current.error).toBe('Region not found');
    });

    it('should handle network error during update', async () => {
      (fetch as jest.MockedFunction<typeof fetch>).mockRejectedValueOnce(
        new Error('Network error')
      );

      const { result } = renderHook(() => useRegionsStore());

      await act(async () => {
        try {
          await result.current.updateRegion('region-123', mockUpdateRequest);
        } catch {
          // Expected to throw
        }
      });

      expect(result.current.isUpdating).toBe(false);
      expect(result.current.error).toBe('Network error');
    });
  });

  describe('deleteRegion', () => {
    it('should delete region successfully', async () => {
      const mockRegionsResponse = createMockRegions();
      const mockFetchRegionsResponse = {
        regions: mockRegionsResponse,
        pagination: {
          currentPage: 1,
          totalPages: 1,
          totalItems: 1,
          itemsPerPage: 10,
        },
      };
      // Mock delete API call
      (fetch as jest.MockedFunction<typeof fetch>)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({}),
        } as Response)
        // Mock fetchRegions call that happens after deletion
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockFetchRegionsResponse),
        } as Response);

      const { result } = renderHook(() => useRegionsStore());

      await act(async () => {
        await result.current.deleteRegion('region-123');
      });

      expect(result.current.isDeleting).toBe(false);
      expect(result.current.error).toBe(null);
      expect(result.current.regions).toEqual(mockRegionsResponse);

      expect(fetch).toHaveBeenCalledWith('/api/regions/region-123', {
        method: 'DELETE',
        headers: mockGetAuthHeaders(),
      });
    });

    it('should handle delete region error', async () => {
      (fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ error: 'Region not found' }),
      } as Response);

      const { result } = renderHook(() => useRegionsStore());

      await act(async () => {
        try {
          await result.current.deleteRegion('non-existent');
        } catch {
          // Expected to throw
        }
      });

      expect(result.current.isDeleting).toBe(false);
      expect(result.current.error).toBe('Region not found');
    });

    it('should handle network error during delete', async () => {
      (fetch as jest.MockedFunction<typeof fetch>).mockRejectedValueOnce(
        new Error('Network error')
      );

      const { result } = renderHook(() => useRegionsStore());

      await act(async () => {
        try {
          await result.current.deleteRegion('region-123');
        } catch {
          // Expected to throw
        }
      });

      expect(result.current.isDeleting).toBe(false);
      expect(result.current.error).toBe('Network error');
    });
  });

  describe('fetchStates', () => {
    it('should fetch states successfully', async () => {
      const mockStates = createMockStates();
      (fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: mockStates }),
      } as Response);

      const { result } = renderHook(() => useRegionsStore());

      await act(async () => {
        await result.current.fetchStates();
      });

      expect(result.current.states).toEqual(mockStates);

      expect(fetch).toHaveBeenCalledWith('/api/regions/states', {
        headers: mockGetAuthHeaders(),
      });
    });

    it('should handle fetch states error', async () => {
      (fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
        ok: false,
        statusText: 'Not Found',
      } as Response);

      const { result } = renderHook(() => useRegionsStore());

      await act(async () => {
        await result.current.fetchStates();
      });

      expect(result.current.error).toBe('Failed to fetch states');
    });

    it('should handle network error during fetch states', async () => {
      (fetch as jest.MockedFunction<typeof fetch>).mockRejectedValueOnce(
        new Error('Network error')
      );

      const { result } = renderHook(() => useRegionsStore());

      await act(async () => {
        await result.current.fetchStates();
      });

      expect(result.current.error).toBe('Network error');
    });
  });

  describe('searchRegions', () => {
    it('should search regions successfully with default parameters', async () => {
      const mockResponse = createMockRegions();
      (fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      } as Response);

      const { result } = renderHook(() => useRegionsStore());

      await act(async () => {
        await result.current.searchRegions('California');
      });

      expect(result.current.isLoading).toBe(false);
      expect(result.current.regions).toEqual(mockResponse);
      expect(result.current.error).toBe(null);

      expect(fetch).toHaveBeenCalledWith('/api/regions/search?q=California&sort_by=city&sort_order=asc', {
        headers: mockGetAuthHeaders(),
      });
    });

    it('should handle search regions error', async () => {
      (fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
        ok: false,
        statusText: 'Not Found',
      } as Response);

      const { result } = renderHook(() => useRegionsStore());

      await act(async () => {
        await result.current.searchRegions('test');
      });

      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBe('Failed to search regions');
    });

    it('should handle network error during search', async () => {
      (fetch as jest.MockedFunction<typeof fetch>).mockRejectedValueOnce(
        new Error('Network error')
      );

      const { result } = renderHook(() => useRegionsStore());

      await act(async () => {
        await result.current.searchRegions('test');
      });

      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBe('Network error');
    });
  });

  describe('setFilters', () => {
    it('should update filter state', () => {
      const { result } = renderHook(() => useRegionsStore());

      act(() => {
        result.current.setFilters({ state: 'California' });
      });

      expect(result.current.filters).toEqual({
        sort_by: 'city',
        sort_order: 'asc',
        state: 'California',
      });

      act(() => {
        result.current.setFilters({ city: 'Los Angeles' });
      });

      expect(result.current.filters).toEqual({
        sort_by: 'city',
        sort_order: 'asc',
        state: 'California',
        city: 'Los Angeles',
      });
    });
  });

  
  describe('clearError', () => {
    it('should clear error state', () => {
      const { result } = renderHook(() => useRegionsStore());

      // Manually trigger the error by setting it directly in the store
      act(() => {
        useRegionsStore.setState({ error: 'Failed to fetch regions' });
      });

      expect(result.current.error).toBe('Failed to fetch regions');

      // Clear error
      act(() => {
        result.current.clearError();
      });

      expect(result.current.error).toBe(null);
    });
  });

  describe('clearCreateError', () => {
    it('should clear createError state', () => {
      const { result } = renderHook(() => useRegionsStore());

      // Manually set createError in the store
      act(() => {
        useRegionsStore.setState({ createError: 'Test create error' });
      });

      expect(result.current.createError).toBe('Test create error');

      // Clear error
      act(() => {
        result.current.clearCreateError();
      });

      expect(result.current.createError).toBe(null);
    });
  });

  describe('reset', () => {
    it('should reset store to initial state', () => {
      const { result } = renderHook(() => useRegionsStore());

      // Change some state
      act(() => {
        result.current.setFilters({ state: 'California' });
      });

      expect(result.current.filters).toEqual({
        sort_by: 'city',
        sort_order: 'asc',
        state: 'California',
      });

      // Reset store
      act(() => {
        result.current.reset();
      });

      expect(result.current.regions).toEqual([]);
      expect(result.current.states).toEqual([]);
      expect(result.current.isLoading).toBe(true);
      expect(result.current.isCreating).toBe(false);
      expect(result.current.isUpdating).toBe(false);
      expect(result.current.isDeleting).toBe(false);
      expect(result.current.error).toBe(null);
      expect(result.current.createError).toBe(null);
      expect(result.current.filters).toEqual({
        sort_by: 'city',
        sort_order: 'asc',
      });
    });
  });
});
