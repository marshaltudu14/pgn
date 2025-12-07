import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { withSecurity, addSecurityHeaders } from '@/lib/security-middleware';
import { withApiValidation } from '@/lib/api-validation';
import { apiContract } from '@pgn/shared';
import { createClient } from '@/utils/supabase/server';

// Schema for assigning regions to employees
const AssignRegionsSchema = z.object({
  employee_ids: z.array(z.string().uuid()).min(1, 'At least one employee ID is required'),
  region_ids: z.array(z.string().uuid()).min(1, 'At least one region ID is required'),
});

// Schema for getting regions with employee counts
const RegionStatsSchema = z.object({
  region_ids: z.array(z.string().uuid()).optional(),
});

const assignRegionsHandler = withApiValidation(
  async (req: NextRequest): Promise<NextResponse> => {
    try {
      const body = (req as any).validatedBody;
      const { employee_ids, region_ids } = body;

      const supabase = await createClient();

      // Start a transaction-like operation
      // First, remove existing assignments for these employees (if any)
      const { error: deleteError } = await supabase
        .from('employee_regions')
        .delete()
        .in('employee_id', employee_ids);

      if (deleteError) {
        console.error('Error removing existing assignments:', deleteError);
        const response = NextResponse.json(
          { error: 'Failed to remove existing region assignments' },
          { status: 500 }
        );
        return addSecurityHeaders(response);
      }

      // Then, insert new assignments
      const newAssignments = [];
      for (const employee_id of employee_ids) {
        for (const region_id of region_ids) {
          newAssignments.push({
            employee_id,
            region_id,
            assigned_at: new Date().toISOString(),
            assigned_by: 'system', // This could be updated to use actual user ID
          });
        }
      }

      const { error: insertError } = await supabase
        .from('employee_regions')
        .insert(newAssignments);

      if (insertError) {
        console.error('Error creating new assignments:', insertError);
        const response = NextResponse.json(
          { error: 'Failed to create new region assignments' },
          { status: 500 }
        );
        return addSecurityHeaders(response);
      }

      const response = NextResponse.json({
        success: true,
        message: `Successfully assigned ${employee_ids.length} employee(s) to ${region_ids.length} region(s)`,
        assignments_count: newAssignments.length,
      });
      return addSecurityHeaders(response);

    } catch (error) {
      console.error('Error in assignRegionsHandler:', error);
      const response = NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
      return addSecurityHeaders(response);
    }
  },
  {
    body: AssignRegionsSchema,
    response: z.object({
      success: z.boolean(),
      message: z.string(),
      assignments_count: z.number(),
    }),
    validateResponse: false,
  }
);

const getRegionStatsHandler = withApiValidation(
  async (req: NextRequest): Promise<NextResponse> => {
    try {
      const url = new URL(req.url);
      const region_ids = url.searchParams.get('region_ids');

      let regionIds: string[] | undefined;
      if (region_ids) {
        try {
          regionIds = JSON.parse(region_ids);
        } catch (e) {
          const response = NextResponse.json(
            { error: 'Invalid region_ids format' },
            { status: 400 }
          );
          return addSecurityHeaders(response);
        }
      }

      const supabase = await createClient();

      let query = supabase
        .from('regions')
        .select(`
          id,
          city,
          state,
          employee_count:employee_regions(count)
        `);

      if (regionIds && regionIds.length > 0) {
        query = query.in('id', regionIds);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching region stats:', error);
        const response = NextResponse.json(
          { error: 'Failed to fetch region statistics' },
          { status: 500 }
        );
        return addSecurityHeaders(response);
      }

      // Transform the data
      const regionStats = (data || []).map(region => ({
        id: region.id,
        city: region.city,
        state: region.state,
        employee_count: region.employee_count ? Number(region.employee_count) : 0,
      }));

      const response = NextResponse.json({
        success: true,
        data: regionStats,
        total_regions: regionStats.length,
      });
      return addSecurityHeaders(response);

    } catch (error) {
      console.error('Error in getRegionStatsHandler:', error);
      const response = NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
      return addSecurityHeaders(response);
    }
  },
  {
    query: z.object({
      region_ids: z.string().optional(),
    }),
    response: z.object({
      success: z.boolean(),
      data: z.array(z.object({
        id: z.string(),
        city: z.string(),
        state: z.string(),
        employee_count: z.number(),
      })),
      total_regions: z.number(),
    }),
    validateResponse: false,
  }
);

// Add route definitions to API contract
apiContract.addRoute({
  path: '/api/regions/assign',
  method: 'POST',
  inputSchema: AssignRegionsSchema,
  outputSchema: z.object({
    success: z.boolean(),
    message: z.string(),
    assignments_count: z.number(),
  }),
  description: 'Assign regions to employees'
});

apiContract.addRoute({
  path: '/api/regions/stats',
  method: 'GET',
  inputSchema: z.object({
    region_ids: z.string().optional(),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    data: z.array(z.object({
      id: z.string(),
      city: z.string(),
      state: z.string(),
      employee_count: z.number(),
    })),
    total_regions: z.number(),
  }),
  description: 'Get region statistics including employee counts'
});

export const POST = withSecurity(assignRegionsHandler);
export const GET = withSecurity(getRegionStatsHandler);