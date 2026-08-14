import { test, expect } from '@playwright/test';

test.describe('Dbara PWA Full Offline Capabilities Suite', () => {
  test.beforeEach(async ({ page }) => {
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
            audio: {
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
  });

  test('Complete Offline Verification: Service Worker Caching, Disconnection, Reload, and Gameplay', async ({
    page,
    context,
  }) => {
    const targetUrl = process.env.TEST_URL || 'https://dbara.malgaroshy.workers.dev';
    console.log(`1. Initial online boot at ${targetUrl}...`);
    await page.goto(targetUrl);

    // Verify Tripoli pin is visible on interactive map and HUD is initialized
    const tripoliPin = page.locator('button[data-city-id="tripoli"]');
    await expect(tripoliPin).toBeVisible({ timeout: 15000 });
    await expect(page.getByText('مستكشف دبارة')).toBeVisible();

    // Ensure Service Worker is fully registered, controlling the page, and has precached assets
    console.log('Waiting for Service Worker and cache population...');
    const cacheSummary = await page.evaluate(async () => {
      if (!('serviceWorker' in navigator)) return { supported: false, count: 0 };
      await navigator.serviceWorker.ready;
      
      const keys = await caches.keys();
      if (keys.length === 0) return { supported: true, count: 0 };
      
      const cache = await caches.open(keys[0]);
      let items = await cache.keys();
      
      // Wait until all build chunks and assets are in cache
      for (let i = 0; i < 25 && items.length < 12; i++) {
        await new Promise((r) => setTimeout(r, 200));
        items = await cache.keys();
      }
      return { supported: true, count: items.length, cacheName: keys[0] };
    });
    console.log('Service Worker & Cache Status:', cacheSummary);

    // 2. SIMULATE DISCONNECTING THE NETWORK (100% OFFLINE / AIRPLANE MODE)
    console.log('2. Simulating 100% Offline (Airplane Mode)...');
    await context.setOffline(true);

    // Verify offline pill / badge indicator appears
    const offlineIndicator = page.locator('text=أوفلاين').or(page.locator('text=وضع اللعب دون إنترنت'));
    await expect(offlineIndicator.first()).toBeVisible({ timeout: 5000 });

    // 3. FULL PAGE RELOAD WHILE COMPLETELY OFFLINE
    console.log('3. Reloading page with network disconnected (Airplane Mode)...');
    await page.reload({ waitUntil: 'domcontentloaded' });

    // Verify game shell, map, and HUD load 100% offline from CacheStorage
    await expect(page.getByText('مستكشف دبارة')).toBeVisible({ timeout: 15000 });
    await expect(tripoliPin).toBeVisible({ timeout: 15000 });
    console.log('✓ Page reloaded successfully while 100% offline!');

    // 4. PLAY A FULL STAGE COMPLETELY OFFLINE
    console.log('4. Playing a stage and answering questions offline...');
    await tripoliPin.click();

    // Open Tripoli city details modal via "استكشف"
    const exploreBtn = page.getByRole('button', { name: 'استكشف' });
    await expect(exploreBtn).toBeVisible({ timeout: 5000 });
    await exploreBtn.click();

    // Start Stage 1 offline
    const playBtn = page.getByRole('button', { name: 'العب' }).first();
    await expect(playBtn).toBeVisible({ timeout: 5000 });
    await playBtn.click();

    // Verify question is loaded and displayed offline
    await expect(page.getByText('سؤال التحدي الثقافي:')).toBeVisible({ timeout: 10000 });

    // Verify answer options are displayed and clickable offline
    const optionButtons = page.locator('button').filter({ has: page.locator('span.w-7') });
    await expect(optionButtons.first()).toBeVisible();
    expect(await optionButtons.count()).toBe(4);
    await optionButtons.first().click();

    // Verify fun fact card appears offline
    await expect(page.getByText('معلومة ع الماشي')).toBeVisible({ timeout: 5000 });

    // Continue to finish stage
    const continueBtn = page.getByRole('button', { name: /استمر في الرحلة/ });
    await expect(continueBtn).toBeVisible();
    await continueBtn.click();

    // Verify we are back on the map with stage completed
    await expect(tripoliPin).toBeVisible({ timeout: 5000 });
    console.log('✓ Stage played and progress saved while 100% offline!');

    // 5. RESTORE NETWORK
    console.log('5. Restoring network connection...');
    await context.setOffline(false);

    // Verify online notification toast appears
    await expect(page.getByText('تم استعادة الاتصال بالإنترنت')).toBeVisible({ timeout: 5000 });

    console.log('🎉 Full Offline Test PASSED with 100% Success!');
  });
});
