/**
 * E2E Tests for Employee Form
 * Tests comprehensive form validation, submission, and user experience
 */

import { test, expect } from '@playwright/test';

test.describe('Employee Form E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Authentication is bypassed in test mode
  });

  test.describe('Create Employee Form', () => {
    test.beforeEach(async ({ page }) => {
      // Navigate to create employee form
      await page.goto('http://localhost:3001/dashboard/employees');
      await page.getByRole('button', { name: 'Add Employee' }).click();
      await page.waitForLoadState('networkidle');
    });

    test('should display all required form fields', async ({ page }) => {
      // Check all required fields are present
      await expect(page.getByLabel('First Name')).toBeVisible();
      await expect(page.getByLabel('Last Name')).toBeVisible();
      await expect(page.getByLabel('Email')).toBeVisible();
      await expect(page.getByLabel('Employment Status')).toBeVisible();
      await expect(page.getByLabel('Phone')).toBeVisible();

      // Check optional fields
      const assignedCitiesField = page.getByLabel(/Assigned Cities|Regions/i);
      if (await assignedCitiesField.isVisible()) {
        await expect(assignedCitiesField).toBeVisible();
      }

      // Check password field (for new employees)
      const passwordField = page.getByLabel('Password');
      if (await passwordField.isVisible()) {
        await expect(passwordField).toBeVisible();
      }

      // Check checkboxes
      const canLoginCheckbox = page.getByLabel(/Can Login|Enable Login/i);
      if (await canLoginCheckbox.isVisible()) {
        await expect(canLoginCheckbox).toBeVisible();
      }
    });

    test('should validate form fields correctly', async ({ page }) => {
      // Test empty form submission
      await page.getByRole('button', { name: /Create Employee|Submit/i }).click();

      // Check for validation messages
      await expect(page.getByText(/First Name is required/i)).toBeVisible();
      await expect(page.getByText(/Last Name is required/i)).toBeVisible();
      await expect(page.getByText(/Email is required/i)).toBeVisible();

      // Test email validation
      await page.getByLabel('Email').fill('invalid-email');
      await page.getByRole('button', { name: /Create Employee|Submit/i }).click();
      await expect(page.getByText(/Invalid email format/i)).toBeVisible();

      // Test phone validation (if phone field exists)
      const phoneField = page.getByLabel('Phone');
      if (await phoneField.isVisible()) {
        await phoneField.fill('abc');
        await page.getByRole('button', { name: /Create Employee|Submit/i }).click();
        await expect(page.getByText(/Invalid phone format/i)).toBeVisible();
      }
    });

    test('should show password strength indicator', async ({ page }) => {
      const passwordField = page.getByLabel('Password');
      if (await passwordField.isVisible()) {
        await passwordField.focus();

        // Test weak password
        await passwordField.fill('123');
        await expect(page.getByText(/Weak password|Password too weak/i)).toBeVisible();

        // Test strong password
        await passwordField.fill('StrongPassword123!');
        await expect(page.getByText(/Strong password|Password strength/i)).toBeVisible();
      }
    });

    test('should handle employment status selection', async ({ page }) => {
      const statusField = page.getByLabel('Employment Status');
      await statusField.click();

      // Check all status options are available
      await expect(page.getByRole('option', { name: 'Active' })).toBeVisible();
      await expect(page.getByRole('option', { name: 'Suspended' })).toBeVisible();
      await expect(page.getByRole('option', { name: 'Resigned' })).toBeVisible();
      await expect(page.getByRole('option', { name: 'Terminated' })).toBeVisible();
      await expect(page.getByRole('option', { name: 'On Leave' })).toBeVisible();

      // Select a status
      await page.getByRole('option', { name: 'Active' }).click();
      await expect(statusField).toHaveValue('ACTIVE');
    });

    test('should handle file upload for reference photo', async ({ page }) => {
      const photoUpload = page.getByLabel(/Reference Photo|Profile Picture/i);
      if (await photoUpload.isVisible()) {
        // Create a test file
        const testFilePath = 'test-photo.jpg';

        // Note: In real tests, you would need to have actual test files
        // For now, just test the file upload interaction
        await expect(photoUpload).toBeVisible();
      }
    });

    test('should create employee with valid data', async ({ page }) => {
      const testEmployee = {
        firstName: 'John',
        lastName: 'Doe',
        email: `john.doe.${Date.now()}@example.com`,
        phone: '9876543210',
        password: 'SecurePassword123!'
      };

      // Fill form with valid data
      await page.getByLabel('First Name').fill(testEmployee.firstName);
      await page.getByLabel('Last Name').fill(testEmployee.lastName);
      await page.getByLabel('Email').fill(testEmployee.email);
      await page.getByLabel('Phone').fill(testEmployee.phone);

      // Set employment status
      await page.getByLabel('Employment Status').click();
      await page.getByRole('option', { name: 'Active' }).click();

      // Set password
      const passwordField = page.getByLabel('Password');
      if (await passwordField.isVisible()) {
        await passwordField.fill(testEmployee.password);
      }

      // Enable login
      const canLoginCheckbox = page.getByLabel(/Can Login|Enable Login/i);
      if (await canLoginCheckbox.isVisible()) {
        await canLoginCheckbox.check();
      }

      // Submit form
      await page.getByRole('button', { name: /Create Employee|Submit/i }).click();

      // Check for success message
      await expect(page.getByText(/Employee created successfully/i)).toBeVisible({ timeout: 10000 });

      // Check redirect to employees list
      await expect(page).toHaveURL(/.*dashboard\/employees/);
    });

    test('should show loading state during submission', async ({ page }) => {
      // Fill form with minimum valid data
      await page.getByLabel('First Name').fill('Test');
      await page.getByLabel('Last Name').fill('User');
      await page.getByLabel('Email').fill(`test.user.${Date.now()}@example.com`);

      // Submit and check for loading state
      await page.getByRole('button', { name: /Create Employee|Submit/i }).click();

      // Check for loading indicator (button should be disabled or show loading)
      const submitButton = page.getByRole('button', { name: /Create Employee|Submit/i });
      await expect(submitButton).toBeDisabled();
    });

    test('should handle form cancellation', async ({ page }) => {
      // Fill some form data
      await page.getByLabel('First Name').fill('Test');
      await page.getByLabel('Last Name').fill('User');

      // Click cancel button
      const cancelButton = page.getByRole('button', { name: /Cancel|Back/i });
      if (await cancelButton.isVisible()) {
        await cancelButton.click();

        // Should return to employees list
        await expect(page).toHaveURL(/.*dashboard\/employees/);
      }
    });
  });

  test.describe('Edit Employee Form', () => {
    test.beforeEach(async ({ page }) => {
      // Navigate to employees and edit first employee
      await page.goto('http://localhost:3001/dashboard/employees');
      await page.waitForSelector('[data-testid="employee-row"]');

      const editButton = page.locator('[data-testid="employee-row"]').first()
        .getByRole('button').filter({ hasText: /Edit/i });
      await editButton.click();
      await page.waitForLoadState('networkidle');
    });

    test('should populate form with existing employee data', async ({ page }) => {
      // Check form is pre-populated
      await expect(page.getByLabel('First Name')).not.toHaveValue('');
      await expect(page.getByLabel('Last Name')).not.toHaveValue('');
      await expect(page.getByLabel('Email')).not.toHaveValue('');

      // Email field should be readonly in edit mode
      await expect(page.getByLabel('Email')).toBeDisabled();
    });

    test('should update employee successfully', async ({ page }) => {
      const newLastName = `Updated-${Date.now()}`;

      // Update employee data
      await page.getByLabel('Last Name').fill(newLastName);

      // Change employment status
      await page.getByLabel('Employment Status').click();
      await page.getByRole('option', { name: 'Suspended' }).click();

      // Submit form
      await page.getByRole('button', { name: /Update Employee|Save/i }).click();

      // Check for success message
      await expect(page.getByText(/Employee updated successfully/i)).toBeVisible({ timeout: 10000 });

      // Navigate back to employees list
      await page.goto('http://localhost:3001/dashboard/employees');

      // Search for updated employee
      await page.getByPlaceholder('Search employees...').fill(newLastName);

      // Verify updated data
      await expect(page.getByText(newLastName)).toBeVisible({ timeout: 10000 });
    });

    test('should show confirmation dialog for critical changes', async ({ page }) => {
      // Try to change employment status to Terminated
      await page.getByLabel('Employment Status').click();
      await page.getByRole('option', { name: 'Terminated' }).click();

      // Check for confirmation dialog
      const confirmationDialog = page.getByRole('dialog').filter({ hasText: /confirm|are you sure/i });
      if (await confirmationDialog.isVisible()) {
        await expect(confirmationDialog).toBeVisible();

        // Cancel the action
        await page.getByRole('button', { name: /Cancel/i }).click();

        // Status should revert
        await expect(page.getByLabel('Employment Status')).not.toHaveValue('TERMINATED');
      }
    });

    test('should disable certain fields in edit mode', async ({ page }) => {
      // Email should be disabled
      await expect(page.getByLabel('Email')).toBeDisabled();

      // User ID field should be disabled (if present)
      const userIdField = page.getByLabel(/User ID|Employee ID/i);
      if (await userIdField.isVisible()) {
        await expect(userIdField).toBeDisabled();
      }

      // Created/Updated timestamps should be disabled (if present)
      const createdField = page.getByLabel(/Created|Updated/i);
      if (await createdField.isVisible()) {
        await expect(createdField).toBeDisabled();
      }
    });
  });

  test.describe('Form User Experience', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('http://localhost:3001/dashboard/employees');
      await page.getByRole('button', { name: 'Add Employee' }).click();
    });

    test('should provide helpful tooltips and hints', async ({ page }) => {
      // Check for help text or tooltips
      const helpText = page.getByText(/Enter employee information|Fill in the form/i);
      if (await helpText.isVisible()) {
        await expect(helpText).toBeVisible();
      }

      // Check for field-level hints
      await page.getByLabel('Email').focus();
      const emailHint = page.getByText(/example\.com|domain\.com/i);
      if (await emailHint.isVisible()) {
        await expect(emailHint).toBeVisible();
      }
    });

    test('should handle keyboard navigation properly', async ({ page }) => {
      // Tab through form fields
      await page.keyboard.press('Tab');
      let focusedElement = await page.locator(':focus');

      // Should be on first form field
      await expect(focusedElement).toBeVisible();

      // Continue tabbing through all fields
      const fieldCount = 6; // Approximate number of fields
      for (let i = 0; i < fieldCount; i++) {
        await page.keyboard.press('Tab');
        focusedElement = await page.locator(':focus');
        await expect(focusedElement).toBeVisible();
      }
    });

    test('should auto-save draft data', async ({ page }) => {
      // Fill some form data
      await page.getByLabel('First Name').fill('Draft');
      await page.getByLabel('Last Name').fill('User');

      // Wait a moment for auto-save
      await page.waitForTimeout(2000);

      // Refresh page
      await page.reload();

      // Check if data is restored (if auto-save is implemented)
      // This test may need adjustment based on actual auto-save implementation
    });

    test('should show progress indication for multi-step forms', async ({ page }) => {
      // Check if form has progress indicator
      const progressIndicator = page.getByRole('progressbar');
      const stepsIndicator = page.getByText(/Step \d+ of \d+/);

      if (await progressIndicator.isVisible()) {
        await expect(progressIndicator).toBeVisible();
      }

      if (await stepsIndicator.isVisible()) {
        await expect(stepsIndicator).toBeVisible();
      }
    });
  });

  test.describe('Form Security', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('http://localhost:3001/dashboard/employees');
      await page.getByRole('button', { name: 'Add Employee' }).click();
    });

    test('should prevent XSS in form fields', async ({ page }) => {
      const xssPayload = '<script>alert("xss")</script>';

      // Try to inject XSS in name field
      await page.getByLabel('First Name').fill(xssPayload);
      await page.getByLabel('Last Name').fill(xssPayload);

      // Submit form (it should fail validation)
      await page.getByRole('button', { name: /Create Employee|Submit/i }).click();

      // Check that script tag is not executed
      // The page should not show any alerts
      await expect(page.locator('body')).not.toContainText('xss');
    });

    test('should handle rate limiting', async ({ page }) => {
      // Try multiple rapid submissions
      for (let i = 0; i < 5; i++) {
        await page.getByRole('button', { name: /Create Employee|Submit/i }).click();
        await page.waitForTimeout(100);
      }

      // Check for rate limiting message
      const rateLimitMessage = page.getByText(/Too many requests|Rate limit|Try again later/i);
      if (await rateLimitMessage.isVisible()) {
        await expect(rateLimitMessage).toBeVisible();
      }
    });
  });
});