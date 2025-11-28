#!/usr/bin/env node

/**
 * Build-time API validation script
 *
 * This script runs during the build process to validate:
 * 1. All API routes have proper validation schemas
 * 2. Breaking changes are detected
 * 3. API contract consistency is maintained
 */

import { runBuildTimeValidation, exportApiContract } from '../packages/shared/src/validation/build-time-checker';

// Set environment variables for validation
process.env.NODE_ENV = 'development';
process.env.STRICT_API_CHECKS = process.env.STRICT_API_CHECKS || 'true';

console.log('🔍 Starting API Contract Validation...\n');

try {
  // Run the build-time validation
  const isValid = runBuildTimeValidation();

  if (!isValid) {
    console.error('\n❌ API Contract Validation Failed!');
    console.error('Please fix the validation errors above before continuing.');

    if (process.env.STRICT_API_CHECKS === 'true') {
      process.exit(1);
    }
  }

  // Export the API contract for documentation
  const contract = exportApiContract();

  // Save contract to file for documentation
  const fs = require('fs');
  const path = require('path');

  const contractPath = path.join(__dirname, '..', 'docs', 'api-contract.json');
  const docsDir = path.dirname(contractPath);

  // Ensure docs directory exists
  if (!fs.existsSync(docsDir)) {
    fs.mkdirSync(docsDir, { recursive: true });
  }

  fs.writeFileSync(contractPath, contract, 'utf8');

  console.log(`\n📋 API Contract saved to: ${contractPath}`);

  // Generate summary
  const contractData = JSON.parse(contract);
  console.log('\n📊 API Contract Summary:');
  console.log(`- Total Routes: ${contractData.routes.length}`);
  console.log(`- Version: ${contractData.version}`);
  console.log(`- Last Updated: ${contractData.lastUpdated}`);

  // Group routes by category
  const routesByPath = contractData.routes.reduce((acc: any, route: any) => {
    const category = route.path.split('/')[2] || 'root';
    acc[category] = (acc[category] || 0) + 1;
    return acc;
  }, {});

  console.log('\n📚 Routes by Category:');
  Object.entries(routesByPath).forEach(([category, count]) => {
    console.log(`- ${category}: ${count} routes`);
  });

  console.log('\n✅ API Contract Validation Complete!');

} catch (error) {
  console.error('\n💥 Critical Error during API validation:');
  console.error(error);

  process.exit(1);
}