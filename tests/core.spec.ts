
import { test, expect } from '@playwright/test';

test.describe('Core Application Flow', () => {
    test('landing page loads and has correct metadata', async ({ page }) => {
        await page.goto('/');

        // Check title (Update based on your actual metadata)
        await expect(page).toHaveTitle(/DayOS|Sign In/);
    });

    test('protected route redirects to sign-in', async ({ page }) => {
        await page.goto('/inbox');

        // Should redirect to Clerk sign-in
        await expect(page).toHaveURL(/.*sign-in.*/);
    });
});
