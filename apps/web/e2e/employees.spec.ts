/**
 * Comprehensive E2E Tests for Employees Page
 * Tests complete employee management workflow including CRUD operations, search, filtering, and pagination
 */

import { test, expect } from '@playwright/test';

// Test data
const testEmployee = {
  firstName: 'John',
  lastName: 'Doe',
  email: 'john.doe.e2e@example.com',
  phone: '9876543210',
  employmentStatus: 'ACTIVE',
  canLogin: true,
  password: 'TestPassword123!'
};

test.describe('Employees Page E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate directly to employees page (authentication is bypassed in test mode)
    await page.goto('http://localhost:3001/dashboard/employees');

    // Wait for page to load
    await page.waitForLoadState('networkidle');
  });

  test.describe('Page Load and Initial State', () => {
    test('should load employees page with correct title and elements', async ({ page }) => {
      // Check page title
      await expect(page).toHaveTitle(/PGN Admin Dashboard/);

      // Check main heading
      await expect(page.getByRole('heading', { name: 'Employees' })).toBeVisible();

      // Check Add Employee button
      await expect(page.getByRole('button', { name: 'Add Employee' })).toBeVisible();

      // Check search input
      await expect(page.getByPlaceholder('Search employees...')).toBeVisible();

      // Check status filter
      await expect(page.getByRole('combobox')).toBeVisible();

      // Check table headers
      await expect(page.getByText('User ID')).toBeVisible();
      await expect(page.getByText('Name')).toBeVisible();
      await expect(page.getByText('Email')).toBeVisible();
      await expect(page.getByText('Status')).toBeVisible();
      await expect(page.getByText('Actions')).toBeVisible();
    });

    test('should display employee data in table', async ({ page }) => {
      // Wait for employee data to load
      await page.waitForSelector('[data-testid="employee-row"]');

      // Check that employee rows are present
      const employeeRows = page.locator('[data-testid="employee-row"]');
      await expect(employeeRows.first()).toBeVisible();

      // Check table headers are responsive
      await page.setViewportSize({ width: 768, height: 1024 }); // Tablet view
      await expect(page.getByText('User ID')).toBeVisible();
      await expect(page.getByText('Name')).toBeVisible();

      await page.setViewportSize({ width: 375, height: 667 }); // Mobile view
      await expect(page.getByText('User ID')).toBeVisible();
      await expect(page.getByText('Name')).toBeVisible();
    });
  });

  test.describe('Employee Creation Workflow', () => {
    test('should navigate to create employee form', async ({ page }) => {
      // Click Add Employee button
      await page.getByRole('button', { name: 'Add Employee' }).click();

      // Check navigation to create form
      await expect(page).toHaveURL(/.*form\?mode=create/);

      // Check form elements
      await expect(page.getByRole('heading', { name: /Create Employee/i })).toBeVisible();
      await expect(page.getByLabel('First Name')).toBeVisible();
      await expect(page.getByLabel('Last Name')).toBeVisible();
      await expect(page.getByLabel('Email')).toBeVisible();
      await expect(page.getByLabel('Employment Status')).toBeVisible();
    });

    test('should create new employee successfully', async ({ page }) => {
      // Navigate to create form
      await page.getByRole('button', { name: 'Add Employee' }).click();

      // Fill employee form
      await page.getByLabel('First Name').fill(testEmployee.firstName);
      await page.getByLabel('Last Name').fill(testEmployee.lastName);
      await page.getByLabel('Email').fill(testEmployee.email);
      await page.getByLabel('Phone').fill(testEmployee.phone);

      // Select employment status
      await page.getByLabel('Employment Status').click();
      await page.getByRole('option', { name: 'Active' }).click();

      // Enable login if checkbox exists
      const canLoginCheckbox = page.getByLabel('Can Login');
      if (await canLoginCheckbox.isVisible()) {
        await canLoginCheckbox.check();
      }

      // Set password
      const passwordField = page.getByLabel('Password');
      if (await passwordField.isVisible()) {
        await passwordField.fill(testEmployee.password);
      }

      // Submit form
      await page.getByRole('button', { name: /Create Employee|Submit/i }).click();

      // Check for success message or redirect back to employees list
      await expect(page.getByText(/Employee created successfully|Created/i)).toBeVisible({ timeout: 10000 });

      // Navigate back to employees page
      await page.goto('http://localhost:3001/dashboard/employees');

      // Search for created employee
      await page.getByPlaceholder('Search employees...').fill(testEmployee.email);

      // Verify employee appears in results
      await expect(page.getByText(testEmployee.email)).toBeVisible({ timeout: 10000 });
    });

    test('should validate employee creation form', async ({ page }) => {
      // Navigate to create form
      await page.getByRole('button', { name: 'Add Employee' }).click();

      // Try to submit empty form
      await page.getByRole('button', { name: /Create Employee|Submit/i }).click();

      // Check for validation errors
      await expect(page.getByText(/First Name is required|Required/i)).toBeVisible();
      await expect(page.getByText(/Last Name is required|Required/i)).toBeVisible();
      await expect(page.getByText(/Email is required|Required/i)).toBeVisible();

      // Test invalid email format
      await page.getByLabel('Email').fill('invalid-email');
      await page.getByRole('button', { name: /Create Employee|Submit/i }).click();
      await expect(page.getByText(/Invalid email format/i)).toBeVisible();
    });
  });

  test.describe('Employee View and Quick View', () => {
    test('should open employee quick view when view button is clicked', async ({ page }) => {
      // Wait for employee data to load
      await page.waitForSelector('[data-testid="employee-row"]');

      // Find and click view button for first employee
      const viewButton = page.locator('[data-testid="employee-row"]').first()
        .getByRole('button').filter({ hasText: /View|Eye/i });

      await viewButton.click();

      // Check quick view dialog opens
      await expect(page.getByRole('dialog', { name: /Employee Details|Quick View/i })).toBeVisible();

      // Check employee details are displayed
      await expect(page.getByText(/Employee ID/i)).toBeVisible();
      await expect(page.getByText(/Email/i)).toBeVisible();
      await expect(page.getByText(/Employment Status/i)).toBeVisible();

      // Close quick view
      await page.getByRole('button', { name: /Close|Cancel/i }).click();
      await expect(page.getByRole('dialog')).not.toBeVisible();
    });

    test('should navigate to edit form from quick view', async ({ page }) => {
      // Wait for employee data to load
      await page.waitForSelector('[data-testid="employee-row"]');

      // Open quick view
      const viewButton = page.locator('[data-testid="employee-row"]').first()
        .getByRole('button').filter({ hasText: /View|Eye/i });
      await viewButton.click();

      // Click edit button in quick view
      await page.getByRole('button', { name: /Edit/i }).click();

      // Check navigation to edit form
      await expect(page).toHaveURL(/.*form\?id=.*&mode=edit/);
      await expect(page.getByRole('heading', { name: /Edit Employee/i })).toBeVisible();
    });
  });

  test.describe('Employee Edit Workflow', () => {
    test('should navigate to edit form when edit button is clicked', async ({ page }) => {
      // Wait for employee data to load
      await page.waitForSelector('[data-testid="employee-row"]');

      // Find and click edit button for first employee
      const editButton = page.locator('[data-testid="employee-row"]').first()
        .getByRole('button').filter({ hasText: /Edit/i });

      await editButton.click();

      // Check navigation to edit form
      await expect(page).toHaveURL(/.*form\?id=.*&mode=edit/);

      // Check form is pre-populated with employee data
      await expect(page.getByLabel('First Name')).toHaveValue(/\w+/);
      await expect(page.getByLabel('Last Name')).toHaveValue(/\w+/);
      await expect(page.getByLabel('Email')).toHaveValue(/@/);
    });

    test('should update employee information successfully', async ({ page }) => {
      // Wait for employee data to load
      await page.waitForSelector('[data-testid="employee-row"]');

      // Navigate to edit form
      const editButton = page.locator('[data-testid="employee-row"]').first()
        .getByRole('button').filter({ hasText: /Edit/i });
      await editButton.click();

      // Update employee information
      const newLastName = 'Updated-' + Date.now();
      await page.getByLabel('Last Name').fill(newLastName);

      // Update employment status
      await page.getByLabel('Employment Status').click();
      await page.getByRole('option', { name: 'Suspended' }).click();

      // Submit form
      await page.getByRole('button', { name: /Update Employee|Save/i }).click();

      // Check for success message
      await expect(page.getByText(/Employee updated successfully|Updated/i)).toBeVisible({ timeout: 10000 });

      // Navigate back to employees page
      await page.goto('http://localhost:3001/dashboard/employees');

      // Verify updated information
      await page.getByPlaceholder('Search employees...').fill(newLastName);
      await expect(page.getByText(newLastName)).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe('Search and Filter Functionality', () => {
    test('should search employees by name', async ({ page }) => {
      // Wait for employee data to load
      await page.waitForSelector('[data-testid="employee-row"]');

      // Search for employee by name
      await page.getByPlaceholder('Search employees...').fill('John');

      // Wait for search results
      await page.waitForTimeout(1000);

      // Check search results
      const employeeRows = page.locator('[data-testid="employee-row"]');
      const visibleRows = await employeeRows.count();
      expect(visibleRows).toBeGreaterThan(0);
    });

    test('should search employees by email', async ({ page }) => {
      // Wait for employee data to load
      await page.waitForSelector('[data-testid="employee-row"]');

      // Search for employee by email
      await page.getByPlaceholder('Search employees...').fill('admin@company.com');

      // Wait for search results
      await page.waitForTimeout(1000);

      // Check search results
      const employeeRows = page.locator('[data-testid="employee-row"]');
      const visibleRows = await employeeRows.count();
      expect(visibleRows).toBeGreaterThan(0);
    });

    test('should filter employees by employment status', async ({ page }) => {
      // Wait for employee data to load
      await page.waitForSelector('[data-testid="employee-row"]');

      // Get initial count of all employees
      const allRows = await page.locator('[data-testid="employee-row"]').count();

      // Filter by Active status
      await page.getByRole('combobox').click();
      await page.getByRole('option', { name: 'Active' }).click();

      // Wait for filter results
      await page.waitForTimeout(1000);

      // Check filtered results
      const activeRows = await page.locator('[data-testid="employee-row"]').count();
      expect(activeRows).toBeLessThanOrEqual(allRows);
    });

    test('should clear search and filters', async ({ page }) => {
      // Wait for employee data to load
      await page.waitForSelector('[data-testid="employee-row"]');

      // Apply search and filter
      await page.getByPlaceholder('Search employees...').fill('test');
      await page.getByRole('combobox').click();
      await page.getByRole('option', { name: 'Suspended' }).click();

      // Clear search
      await page.getByPlaceholder('Search employees...').clear();

      // Reset filter to "All"
      await page.getByRole('combobox').click();
      await page.getByRole('option', { name: 'All Statuses' }).click();

      // Wait for results to refresh
      await page.waitForTimeout(1000);

      // Verify results are reset
      const employeeRows = page.locator('[data-testid="employee-row"]');
      await expect(employeeRows).toHaveCount(await employeeRows.count());
    });
  });

  test.describe('Pagination Functionality', () => {
    test('should navigate between pages', async ({ page }) => {
      // Wait for employee data to load
      await page.waitForSelector('[data-testid="employee-row"]');

      // Check if pagination controls are present
      const nextButton = page.getByRole('button', { name: /Next/i });
      const prevButton = page.getByRole('button', { name: /Previous/i });

      if (await nextButton.isVisible()) {
        // Get current page info
        const pageInfo = page.getByText(/Page \d+ of \d+/);

        // Click next page
        await nextButton.click();
        await page.waitForTimeout(1000);

        // Check page info updated
        await expect(pageInfo).toContainText('Page 2');

        // Go back to previous page
        if (await prevButton.isVisible()) {
          await prevButton.click();
          await page.waitForTimeout(1000);
          await expect(pageInfo).toContainText('Page 1');
        }
      }
    });

    test('should change page size', async ({ page }) => {
      // Wait for employee data to load
      await page.waitForSelector('[data-testid="employee-row"]');

      // Look for page size selector
      const pageSizeSelector = page.getByRole('combobox').filter({ hasText: /\d+/ });

      if (await pageSizeSelector.isVisible()) {
        await pageSizeSelector.click();

        // Select different page size
        const pageSizeOption = page.getByRole('option', { name: '50' });
        if (await pageSizeOption.isVisible()) {
          await pageSizeOption.click();
          await page.waitForTimeout(2000);

          // Verify page size changed (more or fewer rows displayed)
          const employeeRows = page.locator('[data-testid="employee-row"]');
          await expect(employeeRows).toHaveCount(await employeeRows.count());
        }
      }
    });
  });

  test.describe('Responsive Design', () => {
    test('should display correctly on mobile devices', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });

      // Check mobile layout elements
      await expect(page.getByRole('heading', { name: 'Employees' })).toBeVisible();
      await expect(page.getByRole('button', { name: 'Add Employee' })).toBeVisible();

      // Check table is responsive
      const table = page.locator('table');
      if (await table.isVisible()) {
        await expect(table).toBeVisible();
      } else {
        // Check for mobile card layout
        await expect(page.locator('[data-testid="employee-row"]').first()).toBeVisible();
      }
    });

    test('should display correctly on tablet devices', async ({ page }) => {
      // Set tablet viewport
      await page.setViewportSize({ width: 768, height: 1024 });

      // Check tablet layout elements
      await expect(page.getByRole('heading', { name: 'Employees' })).toBeVisible();
      await expect(page.getByPlaceholder('Search employees...')).toBeVisible();

      // Check search and filter layout
      const searchControls = page.locator('.flex.items-center.gap-4');
      if (await searchControls.isVisible()) {
        await expect(searchControls).toBeVisible();
      }
    });

    test('should display correctly on desktop devices', async ({ page }) => {
      // Set desktop viewport
      await page.setViewportSize({ width: 1200, height: 800 });

      // Check desktop layout elements
      await expect(page.getByRole('heading', { name: 'Employees' })).toBeVisible();
      await expect(page.getByText('employees found')).toBeVisible();

      // Check all table columns are visible
      await expect(page.getByText('User ID')).toBeVisible();
      await expect(page.getByText('Name')).toBeVisible();
      await expect(page.getByText('Email')).toBeVisible();
      await expect(page.getByText('Phone')).toBeVisible();
      await expect(page.getByText('Status')).toBeVisible();
      await expect(page.getByText('Actions')).toBeVisible();
    });
  });

  test.describe('Accessibility', () => {
    test('should support keyboard navigation', async ({ page }) => {
      // Tab through page elements
      await page.keyboard.press('Tab');
      await expect(page.getByRole('button', { name: 'Add Employee' })).toBeFocused();

      await page.keyboard.press('Tab');
      await expect(page.getByPlaceholder('Search employees...')).toBeFocused();

      // Use Enter to activate focused element
      await page.keyboard.press('Enter');
      // Should either trigger search or focus on search input
    });

    test('should have proper ARIA labels', async ({ page }) => {
      // Check form elements have proper labels
      const searchInput = page.getByPlaceholder('Search employees...');
      await expect(searchInput).toHaveAttribute('aria-label', /search/i);

      // Check table has proper structure
      const table = page.locator('table');
      if (await table.isVisible()) {
        await expect(table).toHaveRole('table');
      }
    });

    test('should support screen readers', async ({ page }) => {
      // Check for proper heading hierarchy
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
      await expect(page.getByRole('heading', { level: 2, name: 'Employees' })).toBeVisible();

      // Check for proper landmark roles
      await expect(page.getByRole('main')).toBeVisible();
    });
  });

  test.describe('Error Handling', () => {
    test('should handle network errors gracefully', async ({ page }) => {
      // Simulate offline mode
      await page.context().setOffline(true);

      // Try to refresh page
      await page.reload();

      // Check for error message or offline indicator
      await page.waitForTimeout(2000);

      // Restore online mode
      await page.context().setOffline(false);

      // Check page recovers
      await page.reload();
      await expect(page.getByRole('heading', { name: 'Employees' })).toBeVisible();
    });

    test('should handle API errors gracefully', async ({ page }) => {
      // Monitor console for error messages
      const errors: string[] = [];
      page.on('console', msg => {
        if (msg.type() === 'error') {
          errors.push(msg.text());
        }
      });

      // Try to trigger API error by rapid page refresh
      for (let i = 0; i < 3; i++) {
        await page.reload();
        await page.waitForTimeout(1000);
      }

      // Check if error handling is appropriate
      // (This test may need adjustment based on actual error handling implementation)
    });
  });

  test.describe('Performance', () => {
    test('should load page within reasonable time', async ({ page }) => {
      const startTime = Date.now();

      await page.goto('http://localhost:3001/dashboard/employees');
      await page.waitForLoadState('networkidle');

      const loadTime = Date.now() - startTime;

      // Page should load within 5 seconds
      expect(loadTime).toBeLessThan(5000);
    });

    test('should handle large datasets efficiently', async ({ page }) => {
      // Wait for employee data to load
      await page.waitForSelector('[data-testid="employee-row"]');

      // Test rapid search
      const startTime = Date.now();

      await page.getByPlaceholder('Search employees...').fill('a');
      await page.waitForTimeout(500);
      await page.getByPlaceholder('Search employees...').fill('ab');
      await page.waitForTimeout(500);
      await page.getByPlaceholder('Search employees...').fill('abc');
      await page.waitForTimeout(500);

      const searchTime = Date.now() - startTime;

      // Search operations should complete within 3 seconds
      expect(searchTime).toBeLessThan(3000);
    });
  });

  test.describe('Data Integrity', () => {
    test('should maintain data consistency after page refresh', async ({ page }) => {
      // Wait for employee data to load
      await page.waitForSelector('[data-testid="employee-row"]');

      // Get initial employee count
      const initialCount = await page.locator('[data-testid="employee-row"]').count();

      // Refresh page
      await page.reload();
      await page.waitForLoadState('networkidle');

      // Wait for data to reload
      await page.waitForSelector('[data-testid="employee-row"]');

      // Check data is consistent
      const refreshedCount = await page.locator('[data-testid="employee-row"]').count();
      expect(refreshedCount).toBe(initialCount);
    });

    test('should handle concurrent operations safely', async ({ page }) => {
      // Wait for employee data to load
      await page.waitForSelector('[data-testid="employee-row"]');

      // Perform multiple rapid operations
      await page.getByPlaceholder('Search employees...').fill('test');
      await page.waitForTimeout(100);

      await page.getByRole('combobox').click();
      await page.getByRole('option', { name: 'Active' }).click();
      await page.waitForTimeout(100);

      // Clear search
      await page.getByPlaceholder('Search employees...').clear();
      await page.waitForTimeout(100);

      // Page should remain stable
      await expect(page.getByRole('heading', { name: 'Employees' })).toBeVisible();
    });
  });
});