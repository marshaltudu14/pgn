/**
 * Unit tests for Regions Service using Jest
 */

import {
  CreateRegionRequest,
  PaginationParams,
  Region,
  RegionFilter,
  StateOption,
  UpdateRegionRequest,
} from '@pgn/shared';
import {
  createRegion,
  deleteRegion,
  getRegionById,
  getRegions,
  getStates,
  searchRegions,
  updateRegion,
} from '../regions.service';

// Create a comprehensive Supabase mock
const createMockSupabaseClient = () => {
  const mockClient = {
    from: jest.fn(),
  };

  // Setup chainable methods
  const createQueryChain = () => {
    const queryChain: Record<string, jest.Mock> = {
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      ilike: jest.fn().mockReturnThis(),
      or: jest.fn().mockReturnThis(),
      range: jest.fn().mockReturnThis(),
      single: jest.fn(),
    };

    // Make order() chainable - it returns the same query chain
    queryChain.order = jest.fn().mockReturnValue(queryChain);

    return queryChain;
  };

  mockClient.from.mockReturnValue(createQueryChain());

  return mockClient;
};

// Mock the createClient function
jest.mock('@/utils/supabase/server', () => ({
  createClient: jest.fn(),
}));

// Mock fs module for getStates function
jest.mock('fs', () => ({
  readFileSync: jest.fn(),
}));

import { createClient } from '@/utils/supabase/server';
import * as fs from 'fs';

describe('Regions Service', () => {
  let mockSupabaseClient: ReturnType<typeof createMockSupabaseClient>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockSupabaseClient = createMockSupabaseClient();
    (
      createClient as jest.MockedFunction<typeof createClient>
    ).mockResolvedValue(
      mockSupabaseClient as unknown as ReturnType<typeof createClient>
    );
  });

  describe('createRegion', () => {
    const validCreateRequest: CreateRegionRequest = {
      state: 'California',
      city: 'Los Angeles',
    };

    const mockRegion: Region = {
      id: 'region-123',
      state: 'California',
      city: 'Los Angeles',
      state_slug: 'california',
      city_slug: 'los-angeles',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    it('should create a new region successfully', async () => {
      const mockInsert = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: mockRegion,
            error: null,
          }),
        }),
      });

      mockSupabaseClient.from.mockReturnValue({
        insert: mockInsert,
      });

      const result = await createRegion(validCreateRequest);

      expect(result).toEqual(mockRegion);
      expect(mockInsert).toHaveBeenCalledWith({
        state: 'California',
        city: 'Los Angeles',
      });
    });

    it('should throw error for duplicate state and city combination', async () => {
      const mockInsert = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: null,
            error: {
              code: '23505',
              message:
                'duplicate key value violates unique constraint "unique_state_city"',
            },
          }),
        }),
      });

      mockSupabaseClient.from.mockReturnValue({
        insert: mockInsert,
      });

      await expect(createRegion(validCreateRequest)).rejects.toThrow(
        'A region with this state and city combination already exists'
      );
    });

    it('should throw error for general database errors', async () => {
      const mockInsert = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: null,
            error: {
              code: '500',
              message: 'Database connection failed',
            },
          }),
        }),
      });

      mockSupabaseClient.from.mockReturnValue({
        insert: mockInsert,
      });

      await expect(createRegion(validCreateRequest)).rejects.toThrow(
        'Failed to create region'
      );
    });

    it('should handle database exceptions', async () => {
      mockSupabaseClient.from.mockImplementation(() => {
        throw new Error('Database connection lost');
      });

      await expect(createRegion(validCreateRequest)).rejects.toThrow(
        'Database connection lost'
      );
    });
  });

  describe('getRegions', () => {
    const mockRegions: Region[] = [
      {
        id: 'region-1',
        state: 'California',
        city: 'Los Angeles',
        state_slug: 'california',
        city_slug: 'los-angeles',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'region-2',
        state: 'California',
        city: 'San Francisco',
        state_slug: 'california',
        city_slug: 'san-francisco',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ];

    it('should return paginated regions with default parameters and sorting', async () => {
      const mockQueryChain = {
        select: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockResolvedValue({
          data: mockRegions,
          error: null,
          count: 25,
        }),
      };

      mockSupabaseClient.from.mockReturnValue(mockQueryChain);

      const filters: RegionFilter = {};
      const pagination: PaginationParams = {};
      const result = await getRegions(filters, pagination);

      expect(result).toEqual({
        data: mockRegions,
        total: 25,
        page: 1,
        limit: 20,
        hasMore: true, // (1-1)*20 + 2 = 2 < 25
      });
      expect(mockQueryChain.order).toHaveBeenCalledWith('city', { ascending: true });
    });

    it('should return paginated regions with custom parameters', async () => {
      const mockQueryChain = {
        select: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockResolvedValue({
          data: mockRegions,
          error: null,
          count: 150,
        }),
      };

      mockSupabaseClient.from.mockReturnValue(mockQueryChain);

      const filters: RegionFilter = {};
      const pagination: PaginationParams = {
        page: 2,
        limit: 25,
        offset: 25,
      };
      const result = await getRegions(filters, pagination);

      expect(result).toEqual({
        data: mockRegions,
        total: 150,
        page: 2,
        limit: 25,
        hasMore: true, // 25 + 25 = 50 < 150
      });
    });

    it('should apply state filter', async () => {
      const mockQueryChain = {
        select: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        range: jest.fn().mockResolvedValue({
          data: [mockRegions[0]], // Only California regions
          error: null,
          count: 1,
        }),
      };

      mockSupabaseClient.from.mockReturnValue(mockQueryChain);

      const filters: RegionFilter = { state: 'California' };
      const result = await getRegions(filters);

      expect(result.data).toHaveLength(1);
      expect(mockQueryChain.eq).toHaveBeenCalledWith('state', 'California');
    });

    it('should apply city filter with case-insensitive search', async () => {
      const mockQueryChain = {
        select: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        ilike: jest.fn().mockReturnThis(),
        range: jest.fn().mockResolvedValue({
          data: [mockRegions[0]], // Only Los Angeles
          error: null,
          count: 1,
        }),
      };

      mockSupabaseClient.from.mockReturnValue(mockQueryChain);

      const filters: RegionFilter = { city: 'angeles' };
      const result = await getRegions(filters);

      expect(result.data).toHaveLength(1);
      expect(mockQueryChain.ilike).toHaveBeenCalledWith('city', '%angeles%');
    });

    it('should apply both state and city filters', async () => {
      const mockQueryChain = {
        select: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        ilike: jest.fn().mockReturnThis(),
        range: jest.fn().mockResolvedValue({
          data: [mockRegions[0]], // Only Los Angeles, California
          error: null,
          count: 1,
        }),
      };

      mockSupabaseClient.from.mockReturnValue(mockQueryChain);

      const filters: RegionFilter = {
        state: 'California',
        city: 'Los',
      };
      const result = await getRegions(filters);

      expect(result.data).toHaveLength(1);
      expect(mockQueryChain.eq).toHaveBeenCalledWith('state', 'California');
      expect(mockQueryChain.ilike).toHaveBeenCalledWith('city', '%Los%');
    });

    it('should handle null data response', async () => {
      const mockQueryChain = {
        select: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockResolvedValue({
          data: null,
          error: null,
          count: 0,
        }),
      };

      mockSupabaseClient.from.mockReturnValue(mockQueryChain);

      const result = await getRegions();

      expect(result).toEqual({
        data: [],
        total: 0,
        page: 1,
        limit: 20,
        hasMore: false,
      });
    });

    it('should handle undefined count', async () => {
      const mockQueryChain = {
        select: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockResolvedValue({
          data: mockRegions,
          error: null,
          count: undefined,
        }),
      };

      mockSupabaseClient.from.mockReturnValue(mockQueryChain);

      const result = await getRegions();

      expect(result.total).toBe(0);
      expect(result.hasMore).toBe(false);
    });

    it('should handle database errors', async () => {
      const mockQueryChain = {
        select: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockResolvedValue({
          data: null,
          error: { message: 'Query timeout' },
        }),
      };

      mockSupabaseClient.from.mockReturnValue(mockQueryChain);

      await expect(getRegions()).rejects.toThrow('Failed to fetch regions');
    });

    it('should limit maximum results per page to 100', async () => {
      const mockQueryChain = {
        select: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockResolvedValue({
          data: mockRegions,
          error: null,
          count: 150,
        }),
      };

      mockSupabaseClient.from.mockReturnValue(mockQueryChain);

      const pagination: PaginationParams = { limit: 200 };
      await getRegions({}, pagination);

      expect(mockQueryChain.select).toHaveBeenCalledWith('*', { count: 'exact' });
      // The range should be called with limit=100 (max allowed)
      expect(mockQueryChain.range).toHaveBeenCalled();
    });

    it('should apply state sorting ascending', async () => {
      const mockQueryChain = {
        select: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockResolvedValue({
          data: mockRegions,
          error: null,
          count: 25,
        }),
      };

      mockSupabaseClient.from.mockReturnValue(mockQueryChain);

      const filters: RegionFilter = { sort_by: 'state', sort_order: 'asc' };
      const result = await getRegions(filters);

      expect(result.data).toEqual(mockRegions);
      expect(mockQueryChain.order).toHaveBeenCalledWith('state', { ascending: true });
    });

    it('should apply state sorting descending', async () => {
      const mockQueryChain = {
        select: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockResolvedValue({
          data: mockRegions,
          error: null,
          count: 25,
        }),
      };

      mockSupabaseClient.from.mockReturnValue(mockQueryChain);

      const filters: RegionFilter = { sort_by: 'state', sort_order: 'desc' };
      const result = await getRegions(filters);

      expect(result.data).toEqual(mockRegions);
      expect(mockQueryChain.order).toHaveBeenCalledWith('state', { ascending: false });
    });

    it('should apply city sorting descending', async () => {
      const mockQueryChain = {
        select: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockResolvedValue({
          data: mockRegions,
          error: null,
          count: 25,
        }),
      };

      mockSupabaseClient.from.mockReturnValue(mockQueryChain);

      const filters: RegionFilter = { sort_by: 'city', sort_order: 'desc' };
      const result = await getRegions(filters);

      expect(result.data).toEqual(mockRegions);
      expect(mockQueryChain.order).toHaveBeenCalledWith('city', { ascending: false });
    });
  });

  describe('getRegionById', () => {
    const mockRegion: Region = {
      id: 'region-123',
      state: 'California',
      city: 'Los Angeles',
      state_slug: 'california',
      city_slug: 'los-angeles',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    it('should return region when found', async () => {
      const mockQueryChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: mockRegion,
          error: null,
        }),
      };

      mockSupabaseClient.from.mockReturnValue(mockQueryChain);

      const result = await getRegionById('region-123');

      expect(result).toEqual(mockRegion);
      expect(mockQueryChain.select).toHaveBeenCalledWith('*');
      expect(mockQueryChain.eq).toHaveBeenCalledWith('id', 'region-123');
    });

    it('should return null when region not found (PGRST116 error)', async () => {
      const mockQueryChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: { code: 'PGRST116', message: 'No rows returned' },
        }),
      };

      mockSupabaseClient.from.mockReturnValue(mockQueryChain);

      const result = await getRegionById('non-existent');

      expect(result).toBeNull();
    });

    it('should return null when data is null with no error', async () => {
      const mockQueryChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      };

      mockSupabaseClient.from.mockReturnValue(mockQueryChain);

      const result = await getRegionById('non-existent');

      expect(result).toBeNull();
    });

    it('should throw error for database connection errors', async () => {
      const mockQueryChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: { message: 'Connection timeout' },
        }),
      };

      mockSupabaseClient.from.mockReturnValue(mockQueryChain);

      await expect(getRegionById('region-123')).rejects.toThrow(
        'Failed to fetch region'
      );
    });

    it('should handle empty region ID', async () => {
      await expect(getRegionById('')).rejects.toThrow();
    });

    it('should handle null region ID', async () => {
      await expect(getRegionById(null as unknown as string)).rejects.toThrow();
    });

    it('should handle database exceptions', async () => {
      mockSupabaseClient.from.mockImplementation(() => {
        throw new Error('Database connection failed');
      });

      await expect(getRegionById('region-123')).rejects.toThrow(
        'Database connection failed'
      );
    });
  });

  describe('updateRegion', () => {
    const updateData: UpdateRegionRequest = {
      city: 'San Diego',
    };

    const existingRegion: Region = {
      id: 'region-123',
      state: 'California',
      city: 'Los Angeles',
      state_slug: 'california',
      city_slug: 'los-angeles',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const updatedRegion: Region = {
      ...existingRegion,
      city: 'San Diego',
      city_slug: 'san-diego',
      updated_at: new Date().toISOString(),
    };

    it('should update region with provided fields', async () => {
      // Mock the getRegionById call by setting up the mock to return the existing region
      const mockGetRegionQueryChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: existingRegion,
          error: null,
        }),
      };

      const mockUpdateQueryChain = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: updatedRegion,
          error: null,
        }),
      };

      // First call (for getRegionById), second call (for update)
      mockSupabaseClient.from.mockReturnValueOnce(mockGetRegionQueryChain);
      mockSupabaseClient.from.mockReturnValueOnce(mockUpdateQueryChain);

      const result = await updateRegion('region-123', updateData);

      expect(result).toEqual(updatedRegion);
      expect(mockUpdateQueryChain.update).toHaveBeenCalledWith({
        city: 'San Diego',
      });
      expect(mockUpdateQueryChain.eq).toHaveBeenCalledWith('id', 'region-123');
    });

    it('should throw error when region not found', async () => {
      // Mock the getRegionById call by setting up the mock to return null
      const mockGetRegionQueryChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: { code: 'PGRST116', message: 'No rows returned' },
        }),
      };

      // First call (for getRegionById)
      mockSupabaseClient.from.mockReturnValueOnce(mockGetRegionQueryChain);

      await expect(updateRegion('non-existent', updateData)).rejects.toThrow(
        'Region not found'
      );
    });

    it('should throw error for duplicate state and city combination', async () => {
      // Mock the getRegionById call by setting up the mock to return the existing region
      const mockGetRegionQueryChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: existingRegion,
          error: null,
        }),
      };

      const mockUpdateQueryChain = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: {
            code: '23505',
            message:
              'duplicate key value violates unique constraint "unique_state_city"',
          },
        }),
      };

      // First call (for getRegionById), second call (for update)
      mockSupabaseClient.from.mockReturnValueOnce(mockGetRegionQueryChain);
      mockSupabaseClient.from.mockReturnValueOnce(mockUpdateQueryChain);

      await expect(updateRegion('region-123', updateData)).rejects.toThrow(
        'A region with this state and city combination already exists'
      );
    });

    it('should throw error for general database errors', async () => {
      // Mock the getRegionById call by setting up the mock to return the existing region
      const mockGetRegionQueryChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: existingRegion,
          error: null,
        }),
      };

      const mockUpdateQueryChain = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: {
            code: '500',
            message: 'Database connection failed',
          },
        }),
      };

      // First call (for getRegionById), second call (for update)
      mockSupabaseClient.from.mockReturnValueOnce(mockGetRegionQueryChain);
      mockSupabaseClient.from.mockReturnValueOnce(mockUpdateQueryChain);

      await expect(updateRegion('region-123', updateData)).rejects.toThrow(
        'Failed to update region'
      );
    });

    it('should handle empty region ID', async () => {
      await expect(updateRegion('', updateData)).rejects.toThrow();
    });

    it('should handle null region ID', async () => {
      await expect(
        updateRegion(null as unknown as string, updateData)
      ).rejects.toThrow();
    });

    it('should handle database exceptions', async () => {
      mockSupabaseClient.from.mockImplementation(() => {
        throw new Error('Database connection lost');
      });

      await expect(updateRegion('region-123', updateData)).rejects.toThrow(
        'Database connection lost'
      );
    });
  });

  describe('deleteRegion', () => {
    const existingRegion: Region = {
      id: 'region-123',
      state: 'California',
      city: 'Los Angeles',
      state_slug: 'california',
      city_slug: 'los-angeles',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    it('should delete region successfully', async () => {
      // Mock the getRegionById call by setting up the mock to return the existing region
      const mockGetRegionQueryChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: existingRegion,
          error: null,
        }),
      };

      const mockDeleteQueryChain = {
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      };

      // First call (for getRegionById), second call (for delete)
      mockSupabaseClient.from.mockReturnValueOnce(mockGetRegionQueryChain);
      mockSupabaseClient.from.mockReturnValueOnce(mockDeleteQueryChain);

      await expect(deleteRegion('region-123')).resolves.toBeUndefined();
      expect(mockDeleteQueryChain.delete).toHaveBeenCalled();
      expect(mockDeleteQueryChain.eq).toHaveBeenCalledWith('id', 'region-123');
    });

    it('should throw error when region not found', async () => {
      // Mock the getRegionById call by setting up the mock to return null
      const mockGetRegionQueryChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: { code: 'PGRST116', message: 'No rows returned' },
        }),
      };

      // First call (for getRegionById)
      mockSupabaseClient.from.mockReturnValueOnce(mockGetRegionQueryChain);

      await expect(deleteRegion('non-existent')).rejects.toThrow(
        'Region not found'
      );
    });

    it('should throw error for database errors', async () => {
      // Mock the getRegionById call by setting up the mock to return the existing region
      const mockGetRegionQueryChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: existingRegion,
          error: null,
        }),
      };

      const mockDeleteQueryChain = {
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({
          data: null,
          error: { message: 'Foreign key constraint violation' },
        }),
      };

      // First call (for getRegionById), second call (for delete)
      mockSupabaseClient.from.mockReturnValueOnce(mockGetRegionQueryChain);
      mockSupabaseClient.from.mockReturnValueOnce(mockDeleteQueryChain);

      await expect(deleteRegion('region-123')).rejects.toThrow(
        'Failed to delete region'
      );
    });

    it('should handle empty region ID', async () => {
      await expect(deleteRegion('')).rejects.toThrow();
    });

    it('should handle null region ID', async () => {
      await expect(deleteRegion(null as unknown as string)).rejects.toThrow();
    });

    it('should handle database exceptions', async () => {
      mockSupabaseClient.from.mockImplementation(() => {
        throw new Error('Database connection lost');
      });

      await expect(deleteRegion('region-123')).rejects.toThrow(
        'Database connection lost'
      );
    });
  });

  describe('getStates', () => {
    const mockStates = ['California', 'Texas', 'New York'];
    const mockStatesData: StateOption[] = [
      { state: 'California', state_slug: 'california' },
      { state: 'Texas', state_slug: 'texas' },
      { state: 'New York', state_slug: 'new-york' },
    ];

    beforeEach(() => {
      // Reset process.cwd mock
      jest.spyOn(process, 'cwd').mockReturnValue('/app');
    });

    it('should return states with slugs', async () => {
      (fs.readFileSync as jest.Mock).mockReturnValue(
        JSON.stringify(mockStates)
      );

      const result = await getStates();

      expect(result).toEqual(mockStatesData);
      expect(fs.readFileSync).toHaveBeenCalledWith(
        '/app/public/states.json',
        'utf8'
      );
    });

    it('should handle file read errors', async () => {
      (fs.readFileSync as jest.Mock).mockImplementation(() => {
        throw new Error('File not found');
      });

      await expect(getStates()).rejects.toThrow('Failed to fetch states');
    });

    it('should handle invalid JSON data', async () => {
      (fs.readFileSync as jest.Mock).mockReturnValue('invalid json');

      await expect(getStates()).rejects.toThrow('Failed to fetch states');
    });

    it('should handle empty states array', async () => {
      (fs.readFileSync as jest.Mock).mockReturnValue(JSON.stringify([]));

      const result = await getStates();

      expect(result).toEqual([]);
    });
  });

  describe('searchRegions', () => {
    const mockRegions: Region[] = [
      {
        id: 'region-1',
        state: 'California',
        city: 'Los Angeles',
        state_slug: 'california',
        city_slug: 'los-angeles',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'region-2',
        state: 'Texas',
        city: 'Austin',
        state_slug: 'texas',
        city_slug: 'austin',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ];

    it('should return paginated search results with default parameters', async () => {
      const mockQueryChain = {
        select: jest.fn().mockReturnThis(),
        ilike: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockResolvedValue({
          data: mockRegions,
          error: null,
          count: 25,
        }),
      };

      mockSupabaseClient.from.mockReturnValue(mockQueryChain);

      const searchTerm = 'Los Angeles';
      const pagination: PaginationParams = {};
      const filters = { sort_by: 'city', sort_order: 'asc' };
      const result = await searchRegions(searchTerm, pagination, filters);

      expect(result).toEqual({
        data: mockRegions,
        total: 25,
        page: 1,
        limit: 20,
        hasMore: true, // (1-1)*20 + 2 = 2 < 25
      });

      expect(mockQueryChain.select).toHaveBeenCalledWith('*', { count: 'exact' });
      expect(mockQueryChain.ilike).toHaveBeenCalledWith('city', `%${searchTerm}%`);
      expect(mockQueryChain.order).toHaveBeenCalledWith('city', { ascending: true });
      expect(mockQueryChain.range).toHaveBeenCalled();
    });

    it('should search by city field only', async () => {
      const mockQueryChain = {
        select: jest.fn().mockReturnThis(),
        ilike: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockResolvedValue({
          data: [mockRegions[0]], // Only Los Angeles matches
          error: null,
          count: 1,
        }),
      };

      mockSupabaseClient.from.mockReturnValue(mockQueryChain);

      const searchTerm = 'Los Angeles';
      const filters = { sort_by: 'city', sort_order: 'asc' };
      const result = await searchRegions(searchTerm, {}, filters);

      expect(result.data).toHaveLength(1);
      expect(mockQueryChain.ilike).toHaveBeenCalledWith('city', `%${searchTerm}%`);
    });

    it('should return paginated search results with custom parameters', async () => {
      const mockQueryChain = {
        select: jest.fn().mockReturnThis(),
        ilike: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockResolvedValue({
          data: mockRegions,
          error: null,
          count: 150,
        }),
      };

      mockSupabaseClient.from.mockReturnValue(mockQueryChain);

      const searchTerm = 'test';
      const pagination: PaginationParams = {
        page: 2,
        limit: 25,
        offset: 25,
      };
      const filters = { sort_by: 'city', sort_order: 'asc' };
      const result = await searchRegions(searchTerm, pagination, filters);

      expect(result).toEqual({
        data: mockRegions,
        total: 150,
        page: 2,
        limit: 25,
        hasMore: true, // 25 + 25 = 50 < 150
      });
    });

    it('should handle null data response', async () => {
      const mockQueryChain = {
        select: jest.fn().mockReturnThis(),
        ilike: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockResolvedValue({
          data: null,
          error: null,
          count: 0,
        }),
      };

      mockSupabaseClient.from.mockReturnValue(mockQueryChain);

      const searchTerm = 'test';
      const filters = { sort_by: 'city', sort_order: 'asc' };
      const result = await searchRegions(searchTerm, {}, filters);

      expect(result).toEqual({
        data: [],
        total: 0,
        page: 1,
        limit: 20,
        hasMore: false,
      });
    });

    it('should handle undefined count', async () => {
      const mockQueryChain = {
        select: jest.fn().mockReturnThis(),
        ilike: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockResolvedValue({
          data: mockRegions,
          error: null,
          count: undefined,
        }),
      };

      mockSupabaseClient.from.mockReturnValue(mockQueryChain);

      const searchTerm = 'test';
      const filters = { sort_by: 'city', sort_order: 'asc' };
      const result = await searchRegions(searchTerm, {}, filters);

      expect(result.total).toBe(0);
      expect(result.hasMore).toBe(false);
    });

    it('should handle database errors', async () => {
      const mockQueryChain = {
        select: jest.fn().mockReturnThis(),
        ilike: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockResolvedValue({
          data: null,
          error: { message: 'Query timeout' },
        }),
      };

      mockSupabaseClient.from.mockReturnValue(mockQueryChain);

      const searchTerm = 'test';
      const filters = { sort_by: 'city', sort_order: 'asc' };
      await expect(searchRegions(searchTerm, {}, filters)).rejects.toThrow(
        'Failed to search regions'
      );
    });

    it('should handle empty search term', async () => {
      const mockQueryChain = {
        select: jest.fn().mockReturnThis(),
        ilike: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockResolvedValue({
          data: [],
          error: null,
          count: 0,
        }),
      };

      mockSupabaseClient.from.mockReturnValue(mockQueryChain);

      const result = await searchRegions('');

      expect(result.data).toEqual([]);
      expect(result.total).toBe(0);
    });

    it('should limit maximum results per page to 100', async () => {
      const mockQueryChain = {
        select: jest.fn().mockReturnThis(),
        ilike: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockResolvedValue({
          data: mockRegions,
          error: null,
          count: 150,
        }),
      };

      mockSupabaseClient.from.mockReturnValue(mockQueryChain);

      const pagination: PaginationParams = { limit: 200 };
      await searchRegions('test', pagination);

      expect(mockQueryChain.select).toHaveBeenCalledWith('*', { count: 'exact' });
      // The range should be called with limit=100 (max allowed)
      expect(mockQueryChain.range).toHaveBeenCalled();
    });
  });
});
