import { test, expect } from '@playwright/test';

test.describe('ApexFlow - Claim Pipeline Flow', () => {
  test('submits a clean claim and reaches approved status in telemetry pipe', async ({ page }) => {
    // Navigate to local dev server
    await page.goto('http://localhost:5173');

    // Switch to Claim Pipeline screen
    await page.getByRole('button', { name: /CLAIM PIPELINE/i }).click();

    // Verify hero horizontal pipeline headers
    await expect(page.getByText('EVENT-DRIVEN CLAIM PIPELINE')).toBeVisible();
    await expect(page.getByText('1. SUBMITTED')).toBeVisible();
    await expect(page.getByText('2. KAFKA TOPIC')).toBeVisible();
    await expect(page.getByText('3. VALIDATING')).toBeVisible();

    // Click Clean F-150 test preset
    await page.getByRole('button', { name: /1\. CLEAN F-150/i }).click();

    // Submit claim into Kafka pipeline
    const submitBtn = page.getByRole('button', { name: /SUBMIT CLAIM INTO KAFKA PIPE/i });
    await expect(submitBtn).toBeEnabled();
    await submitBtn.click();

    // Verify dispatch message appears
    await expect(page.getByText(/DISPATCHING TO KAFKA PIPE/i)).toBeVisible();

    // Wait for resolution
    await expect(page.getByText(/CLAIM APPROVAL DISBURSED/i)).toBeVisible({ timeout: 10000 });
  });

  test('submits duplicate VIN and triggers reject receipt and shake feedback', async ({ page }) => {
    await page.goto('http://localhost:5173');

    await page.getByRole('button', { name: /CLAIM PIPELINE/i }).click();

    // Click Duplicate VIN preset
    await page.getByRole('button', { name: /2\. DUPLICATE VIN/i }).click();

    // Submit claim
    await page.getByRole('button', { name: /SUBMIT CLAIM INTO KAFKA PIPE/i }).click();

    // Verify rejection receipt appears
    await expect(page.getByText(/VALIDATION ENGINE REJECT RECEIPT/i)).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(/REJECT_VIN_CONFLICT/i)).toBeVisible();
    await expect(page.getByText(/Duplicate VIN Protection/i)).toBeVisible();
  });
});
