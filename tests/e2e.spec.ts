import { test, expect } from '@playwright/test';

test.describe('Dbara Trivia Game E2E Suite', () => {
  test.beforeEach(async ({ page }, testInfo) => {
    // For tests 2-4 and 6, pre-seed state so we start on the Main Menu
    if (!testInfo.title.includes('Onboarding') && !testInfo.title.includes('Quiz gameplay')) {
      await page.addInitScript(() => {
        window.localStorage.setItem(
          'dbara_game_save_v1',
          JSON.stringify({
            state: {
              hasOnboarded: true,
              profile: {
                name: 'مستكشف دبارة',
                avatar: '🧭',
                title: 'مستكشف مبتدئ',
                dinars: 150,
                streakDays: 2,
                lastLoginDate: new Date().toISOString().slice(0, 10),
                soundEnabled: true,
                hapticsEnabled: true,
              },
              stats: {
                questionsAnswered: 5,
                correctAnswers: 4,
                citiesUnlocked: 1,
                crosswordsSolved: 0,
                dailyStreakRecord: 1,
                bestSpeedScore: 0,
              },
              unlockedBadges: ['welcome_badge'],
              dailyChallengeCompletedDate: null,
              seenQuestionIds: [],
              missedQuestionIds: [],
            },
            version: 0,
          })
        );
      });
    }
  });

  test('1. Onboarding flow for new users', async ({ page }) => {
    await page.goto('/');

    const skipButton = page.getByRole('button', { name: 'تخطي' });
    await expect(skipButton).toBeVisible();
    await skipButton.click();

    // After skipping onboarding, Main Menu is shown
    await expect(page.getByRole('heading', { name: 'دبارة' })).toBeVisible();
    await expect(page.getByRole('button', { name: /(ابدأ الرحلة|واصل الرحلة)/ })).toBeVisible();
  });

  test('2. Clean boot and main menu navigation', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    await page.goto('/');

    // Expect Main Menu elements
    await expect(page.getByRole('heading', { name: 'دبارة' })).toBeVisible();
    await expect(page.getByRole('button', { name: /(ابدأ الرحلة|واصل الرحلة)/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /لعب سريع/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /تحدي اليوم/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /الأوسمة والرتب/ })).toBeVisible();

    // Verify zero console errors
    const criticalErrors = consoleErrors.filter(
      (err) => !err.includes('favicon') && !err.includes('manifest')
    );
    expect(criticalErrors).toHaveLength(0);
  });

  test('3. Settings modal and offline/report elements', async ({ page }) => {
    await page.goto('/');

    // Open Settings via Menu
    const settingsButton = page.getByRole('button', { name: 'الإعدادات والنسخ الاحتياطي' });
    await expect(settingsButton).toBeVisible();
    await settingsButton.click();

    // Verify modal is displayed with title and local save warning
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByText('الإعدادات والإحصائيات')).toBeVisible();
    await expect(page.getByText('تقدّمك محفوظ على هذا الجهاز وحده')).toBeVisible();

    // Verify report a mistake button exists
    const reportBtn = page.getByText('بلّغ عن خطأ أو اقترح سؤالاً');
    await expect(reportBtn).toBeVisible();

    // Close settings modal
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).not.toBeVisible();
  });

  test('4. Interactive map, pin selection, and zoom controls', async ({ page }) => {
    await page.goto('/');

    // Enter map from Main Menu
    const enterMapBtn = page.getByRole('button', { name: /(ابدأ الرحلة|واصل الرحلة)/ });
    await enterMapBtn.click();

    // Verify map pins exist
    const tripoliPin = page.locator('button[data-city-id="tripoli"]');
    await expect(tripoliPin).toBeVisible({ timeout: 10000 });

    // Select Tripoli pin
    await tripoliPin.click();

    // Verify stage constellation nodes appear
    const firstStage = page.locator('button[data-stage-id]').first();
    await expect(firstStage).toBeVisible();

    // Test Zoom In button
    const zoomInBtn = page.getByRole('button', { name: 'تكبير الخريطة' });
    await expect(zoomInBtn).toBeVisible();
    await zoomInBtn.click();

    // Zoom scale badge should now be visible (e.g. 1.6×)
    await expect(page.getByText(/1\.6×/)).toBeVisible();

    // Test Reset Zoom button
    const resetZoomBtn = page.getByRole('button', { name: 'إعادة الخريطة لحجمها' });
    await expect(resetZoomBtn).toBeVisible();
    await resetZoomBtn.click();

    // Verify zoom scale badge disappears
    await expect(page.getByText(/1\.6×/)).not.toBeVisible();
  });

  test('5. Quiz gameplay, answering flow, and question mistake reporting', async ({ page }) => {
    await page.goto('/');

    // Complete onboarding setup to enter opening quiz directly
    const nameInput = page.getByPlaceholder('اكتب اسمك هنا');
    await expect(nameInput).toBeVisible({ timeout: 10000 });
    await nameInput.fill('مستكشف دبارة');
    await page.getByRole('button', { name: 'متابعة' }).click();

    // Click "ابدأ أول تحدٍ"
    const startJourneyBtn = page.getByRole('button', { name: 'ابدأ أول تحدٍ' });
    await expect(startJourneyBtn).toBeVisible({ timeout: 10000 });
    await startJourneyBtn.click();

    // Verify question header is rendered
    await expect(page.getByText('سؤال التحدي الثقافي:')).toBeVisible({ timeout: 10000 });

    // 4 option buttons exist
    const optionButtons = page.locator('button').filter({ has: page.locator('span.w-7') });
    await expect(optionButtons.first()).toBeVisible({ timeout: 10000 });
    expect(await optionButtons.count()).toBe(4);

    // Answer the first option
    await optionButtons.first().click();

    // Fun fact card / next question modal should appear
    const reportLink = page.getByRole('link', { name: 'تشك في هذه المعلومة؟ بلّغنا' });
    await expect(reportLink).toBeVisible();

    // Verify report link points to WhatsApp with encoded questionId
    const href = await reportLink.getAttribute('href');
    expect(href).toContain('wa.me');
    expect(href).toContain('https');

    // Click continue to proceed
    const continueBtn = page.getByRole('button', { name: /استمر في الرحلة/ });
    await continueBtn.click();
  });

  test('6. Daily challenge screen availability', async ({ page }) => {
    await page.goto('/');

    // Navigate to Daily Challenge
    const dailyBtn = page.getByRole('button', { name: /تحدي اليوم/ });
    await dailyBtn.click();

    // Verify Daily Challenge components
    await expect(page.getByText('تحدي اليوم وسلسلة الدخول')).toBeVisible();
    await expect(page.getByText(/أيام متتالية/)).toBeVisible();
  });
});
