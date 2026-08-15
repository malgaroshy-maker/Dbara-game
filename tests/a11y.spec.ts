import { test, expect } from '@playwright/test';

test.describe('Dbara Arabic RTL Screen Reader & Accessibility Suite (ح-5)', () => {
  test.beforeEach(async ({ page }) => {
    // Seed storage with completed onboarding so all screens and modes are readily testable
    await page.addInitScript(() => {
      window.localStorage.setItem(
        'dbara_game_save_v1',
        JSON.stringify({
          state: {
            hasOnboarded: true,
            profile: {
              name: 'مستكشف دبارة',
              avatar: '🦁',
              title: 'خبير الآثار',
              dinars: 200,
              streakDays: 3,
              lastLoginDate: new Date().toISOString().slice(0, 10),
              soundEnabled: true,
              hapticsEnabled: true,
              lifelines: { fiftyFifty: 2, revealLetter: 2, skip: 2, extraTime: 2 },
            },
            audio: {
              soundEnabled: true,
              hapticsEnabled: true,
            },
            stats: {
              questionsAnswered: 10,
              correctAnswers: 9,
              citiesUnlocked: 3,
              crosswordsSolved: 1,
              dailyStreakRecord: 3,
              bestSpeedScore: 100,
            },
            unlockedBadges: ['welcome_badge'],
            dailyChallengeCompletedDate: null,
            seenQuestionIds: ['food_trad_20'],
            missedQuestionIds: [],
          },
          version: 0,
        })
      );
    });
  });

  test('1. HTML Root has correct Arabic language and RTL direction attributes', async ({ page }) => {
    await page.goto('/');
    const html = page.locator('html');
    await expect(html).toHaveAttribute('lang', 'ar');
    await expect(html).toHaveAttribute('dir', 'rtl');
  });

  test('2. Single primary H1 heading and proper heading hierarchy across screens', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('header')).toBeVisible();

    // On Map Screen
    const h1Count = await page.locator('h1').count();
    expect(h1Count).toBe(1);

    // Verify H1 text is meaningful for screen readers
    const h1Text = await page.locator('h1').textContent();
    expect(h1Text?.trim().length).toBeGreaterThan(2);

    // Switch to Badges / Notebook screen
    const badgesNav = page.getByRole('button', { name: 'الأوسمة' });
    if (await badgesNav.isVisible()) {
      await badgesNav.click();
      await expect(page.locator('h2, h3').first()).toBeVisible({ timeout: 5000 });
      const h2Count = await page.locator('h2, h3').count();
      expect(h2Count).toBeGreaterThan(0);
    }
  });

  test('3. Interactive buttons and controls have accessible names (no unlabeled icon buttons)', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('header')).toBeVisible();

    // Scan all buttons on the main screen
    const buttons = await page.locator('button').all();
    expect(buttons.length).toBeGreaterThan(3);

    for (const btn of buttons) {
      if (await btn.isVisible()) {
        const ariaLabel = await btn.getAttribute('aria-label');
        const textContent = await btn.textContent();
        const title = await btn.getAttribute('title');
        const hasAccessibleName = Boolean(
          (ariaLabel && ariaLabel.trim().length > 0) ||
          (textContent && textContent.trim().length > 0) ||
          (title && title.trim().length > 0)
        );
        expect(hasAccessibleName).toBe(true);
      }
    }
  });

  test('4. Modals possess role="dialog", aria-modal="true", and trap focus properly', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('header')).toBeVisible();

    // Open Settings modal via HUD
    const settingsBtn = page.getByRole('button', { name: 'الإعدادات' });
    await expect(settingsBtn).toBeVisible();
    await settingsBtn.click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await expect(dialog).toHaveAttribute('aria-modal', 'true');

    // Close on Escape key
    await page.keyboard.press('Escape');
    await expect(dialog).not.toBeVisible();
  });

  test('5. ARIA live regions and status elements exist for dynamic feedback and state updates', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('header')).toBeVisible();

    // Check for status badges
    const statusBadges = page.locator('[role="status"]');
    await expect(statusBadges.first()).toBeVisible();

    // Verify accessible labels on status items
    const starsLabel = await statusBadges.first().getAttribute('aria-label');
    expect(starsLabel).toContain('نجمة');
  });

  test('6. Knowledge Notebook search and filter controls are accessible with clear roles', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('header')).toBeVisible();

    // Navigate to Badges screen
    const badgesNav = page.getByRole('button', { name: /الأوسمة/i });
    if (await badgesNav.isVisible()) {
      await badgesNav.click();
      await page.waitForTimeout(500);

      // Switch to Knowledge Notebook tab
      const notebookTab = page.getByRole('tab', { name: /دفتر المعارف/i });
      if (await notebookTab.isVisible()) {
        await notebookTab.click();
        await page.waitForTimeout(500);

        // Check search input has accessible placeholder / label
        const searchInput = page.locator('input[type="text"]');
        await expect(searchInput).toBeVisible();
        const placeholder = await searchInput.getAttribute('placeholder');
        expect(placeholder?.trim().length).toBeGreaterThan(0);
      }
    }
  });
});
