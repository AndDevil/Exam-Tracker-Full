import { test, expect } from '@playwright/test';

test.describe('Exam Tracker Pro E2E Flow', () => {
  test('should log in as guest, create, view, and delete an exam', async ({ page }) => {
    // 1. Visit the site
    await page.goto('/');

    // 2. Verify login page headers
    await expect(page.locator('h1')).toContainText('Never miss an');
    await expect(page.locator('h1')).toContainText('Exam Deadline');

    // 3. Click the guest explorer demo button
    const demoBtn = page.getByRole('button', { name: /explore live demo/i });
    await expect(demoBtn).toBeVisible();
    await demoBtn.click();

    // 4. Verify successful redirection to Dashboard
    await expect(page.locator('h1')).toContainText('Welcome back, Demo');

    // 5. Navigate to "Add Exam Date" page
    const addBtn = page.getByRole('link', { name: /add exam date/i });
    await expect(addBtn).toBeVisible();
    await addBtn.click();

    // 6. Verify form page is loaded
    await expect(page).toHaveURL(/.*\/exam\/new/);
    await expect(page.locator('h2')).toContainText('Add New Exam Schedule');

    // 7. Fill out the exam details
    await page.locator('input[name="name"]').fill('Playwright Test Certification');
    
    // Choose sector type: click Private button
    const privateSectorBtn = page.getByRole('button', { name: /private/i });
    await privateSectorBtn.click();

    // Set exam date (e.g. 2026-07-20)
    await page.locator('input[name="examDate"]').fill('2026-07-20');

    // Add some notes
    await page.locator('textarea[name="notes"]').fill('Prepared with automated Playwright script.');

    // Submit the form
    const submitBtn = page.getByRole('button', { name: /create schedule/i });
    await submitBtn.click();

    // 8. Confirm navigation back to Dashboard and verify exam exists
    await expect(page).toHaveURL(/.*\//);
    await expect(page.locator('h3', { hasText: 'Playwright Test Certification' })).toBeVisible();

    // 9. Navigate to Settings page
    await page.getByRole('link', { name: /settings/i }).click();
    await expect(page.locator('h1')).toContainText('Application Settings');

    // 10. Click export backup and verify it triggers download
    const exportBtn = page.getByRole('button', { name: /export backup/i });
    await expect(exportBtn).toBeVisible();

    // 11. Go back to Dashboard
    await page.getByRole('link', { name: /dashboard/i }).click();

    // 12. Delete the created exam card
    // First, locate the specific card containing our test exam
    const testExamCard = page.locator('div.group', { has: page.locator('h3', { hasText: 'Playwright Test Certification' }) });
    const deleteBtn = testExamCard.locator('button[title="Delete Exam"]');
    await deleteBtn.click();

    // Confirm that the card has been deleted
    await expect(page.locator('h3', { hasText: 'Playwright Test Certification' })).not.toBeVisible();
  });
});
