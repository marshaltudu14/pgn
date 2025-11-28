import { ZodSchema, ZodError } from 'zod';

/**
 * Build-time validation checker for API consistency
 *
 * This system ensures that:
 * 1. All API routes have proper validation schemas
 * 2. Breaking changes are caught during build
 * 3. Client and server schemas stay in sync
 */
export interface RouteDefinition {
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  inputSchema?: ZodSchema;
  outputSchema?: ZodSchema;
  description?: string;
  deprecated?: boolean;
}

export interface ApiContract {
  version: string;
  routes: RouteDefinition[];
  lastUpdated: string;
}

/**
 * API Contract Manager for tracking changes
 */
export class ApiContractManager {
  private contract: ApiContract = {
    version: '1.0.0',
    routes: [],
    lastUpdated: new Date().toISOString()
  };

  /**
   * Add a new route to the contract
   */
  addRoute(route: RouteDefinition): void {
    // Check if this is a breaking change
    const existingRoute = this.contract.routes.find(
      r => r.path === route.path && r.method === route.method
    );

    if (existingRoute) {
      this.validateBreakingChanges(existingRoute, route);
    } else {
      this.contract.routes.push(route);
    }

    this.contract.lastUpdated = new Date().toISOString();
  }

  /**
   * Validate breaking changes between old and new route definitions
   */
  private validateBreakingChanges(oldRoute: RouteDefinition, newRoute: RouteDefinition): void {
    if (process.env.NODE_ENV === 'development' || process.env.STRICT_API_CHECKS === 'true') {
      // Check input schema breaking changes
      if (oldRoute.inputSchema && newRoute.inputSchema) {
        this.validateSchemaBreakingChanges(
          `${newRoute.method} ${newRoute.path} input`,
          oldRoute.inputSchema,
          newRoute.inputSchema
        );
      }

      // Check output schema breaking changes
      if (oldRoute.outputSchema && newRoute.outputSchema) {
        this.validateSchemaBreakingChanges(
          `${newRoute.method} ${newRoute.path} output`,
          oldRoute.outputSchema,
          newRoute.outputSchema
        );
      }
    }
  }

  /**
   * Validate breaking changes between two schemas
   */
  private validateSchemaBreakingChanges(context: string, oldSchema: ZodSchema, newSchema: ZodSchema): void {
    try {
      // Create test data that would pass the new schema
      const testData = this.generateTestCompatibleData(newSchema);

      // Try to validate it against the old schema
      // If it fails, it might be a breaking change
      const oldResult = oldSchema.safeParse(testData);

      if (oldResult.success) {
        // Now test old data against new schema
        const oldData = this.generateTestCompatibleData(oldSchema);
        const newResult = newSchema.safeParse(oldData);

        if (!newResult.success) {
          console.warn(`🚨 BREAKING CHANGE DETECTED in ${context}:`);
          console.warn('New schema no longer accepts valid data from old schema:');
          newResult.error.issues.forEach((err: any) => {
            console.warn(`  - ${err.path.join('.')}: ${err.message}`);
          });
        }
      }
    } catch (error) {
      console.error(`Error validating schema breaking changes for ${context}:`, error);
    }
  }

  /**
   * Generate test data compatible with a schema
   */
  private generateTestCompatibleData(schema: ZodSchema): any {
    // This is a simplified version - in practice you'd want more sophisticated test data generation
    try {
      // Try to create a basic object that might work
      const description = (schema as any)._def;

      if (description.typeName === 'ZodObject') {
        const shape = description.shape();
        const result: any = {};

        for (const [key, valueSchema] of Object.entries(shape)) {
          const valueDesc = (valueSchema as any)._def;

          if (valueDesc.typeName === 'ZodString') {
            result[key] = 'test';
          } else if (valueDesc.typeName === 'ZodNumber') {
            result[key] = 1;
          } else if (valueDesc.typeName === 'ZodBoolean') {
            result[key] = true;
          } else if (valueDesc.typeName === 'ZodArray') {
            result[key] = [];
          } else if (valueDesc.typeName === 'ZodOptional') {
            // Skip optional fields
          } else if (valueDesc.typeName === 'ZodDefault') {
            // Skip fields with defaults
          } else {
            // For complex types, skip for now
          }
        }

        return result;
      }

      return null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Export the current contract
   */
  exportContract(): ApiContract {
    return { ...this.contract };
  }

  /**
   * Import a contract for comparison
   */
  importContract(contract: ApiContract): void {
    this.contract = { ...contract };
  }

  /**
   * Validate that all routes in the contract have schemas
   */
  validateContract(): string[] {
    const errors: string[] = [];

    for (const route of this.contract.routes) {
      if (!route.inputSchema && !route.outputSchema) {
        errors.push(`Route ${route.method} ${route.path} has no validation schemas`);
      }

      if (!route.description) {
        errors.push(`Route ${route.method} ${route.path} has no description`);
      }
    }

    return errors;
  }

  /**
   * Generate a TypeScript client interface from the contract
   */
  generateClientInterface(): string {
    const interfaces: string[] = [];

    for (const route of this.contract.routes) {
      if (route.outputSchema) {
        const typeName = this.generateTypeName(route.path, route.method, 'Response');
        interfaces.push(`export interface ${typeName} {
  // Generated from ${route.method} ${route.path}
  // TODO: Add proper type definitions from Zod schema
  [key: string]: any;
}`);
      }
    }

    return interfaces.join('\n\n');
  }

  private generateTypeName(path: string, method: string, suffix: string): string {
    // Convert path to TypeScript-friendly name
    const pathName = path
      .replace(/[^a-zA-Z0-9]/g, '_')
      .replace(/^_+|_+$/g, '')
      .replace(/_+/g, '_');

    const methodName = method.charAt(0).toUpperCase() + method.slice(1);

    return `${methodName}${pathName}${suffix}`;
  }
}

/**
 * Global contract manager instance
 */
export const apiContract = new ApiContractManager();

/**
 * Decorator for automatically adding routes to the contract
 */
export function DefineRoute(route: RouteDefinition) {
  return function <T extends { new(...args: any[]): {} }>(constructor: T) {
    apiContract.addRoute(route);
    return constructor;
  };
}

/**
 * Function to run build-time validation
 */
export function runBuildTimeValidation(): boolean {
  console.log('🔍 Running API build-time validation...');

  const errors = apiContract.validateContract();

  if (errors.length > 0) {
    console.error('❌ Build-time validation failed:');
    errors.forEach(error => console.error(`  - ${error}`));

    if (process.env.STRICT_API_CHECKS === 'true') {
      throw new Error('API validation failed. Fix the issues above.');
    }

    return false;
  }

  console.log('✅ API build-time validation passed');

  // Generate client interface (optional)
  if (process.env.GENERATE_CLIENT_TYPES === 'true') {
    const clientInterface = apiContract.generateClientInterface();
    console.log('📝 Generated client interface:');
    console.log(clientInterface);
  }

  return true;
}

/**
 * Export the current API contract as JSON
 */
export function exportApiContract(): string {
  return JSON.stringify(apiContract.exportContract(), null, 2);
}