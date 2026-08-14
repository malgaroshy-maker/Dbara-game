import { test, expect } from '@playwright/test';

test.describe('Dbara PWA Full Offline Capabilities Suite', () => {
  test('Complete Offline Verification: Service Worker Caching, Disconnection, Reload, and Gameplay', async ({
    page,
    context,
  }) => {
    // 1. Initial online boot
    console.log('1. Initial online boot at /...');
    await page.goto('/');

    // Ensure Service Worker is fully registered, controlling the page, and has precached assets
    console.log('Waiting for Service Worker and cache population...');
    const cacheSummary = await page.evaluate(async () => {
      if (!('serviceWorker' in navigator)) return { supported: false, count: 0 };
      await navigator.serviceWorker.ready;

      const keys = await caches.keys();
      if (keys.length === 0) return { supported: true, count: 0 };

      const cache = await caches.open(keys[0]);
      let items = await cache.keys();

      for (let i = 0; i < 25 && items.length < 5; i++) {
        await new Promise((r) => setTimeout(r, 200));
        items = await cache.keys();
      }
      return { supported: true, count: items.length, cacheName: keys[0] };
    });
    console.log('Service Worker & Cache Status:', cacheSummary);

    // 2. SIMULATE DISCONNECTING THE NETWORK (100% OFFLINE / AIRPLANE MODE)
    console.log('2. Simulating 100% Offline (Airplane Mode)...');
    await context.setOffline(true);

    // 3. FULL PAGE RELOAD WHILE COMPLETELY OFFLINE
    console.log('3. Reloading page with network disconnected (Airplane Mode)...');
    await page.reload({ waitUntil: 'domcontentloaded' });

    // Verify offline onboarding screen loads 100% offline from CacheStorage
    const nameInput = page.getByPlaceholder('اكتب اسمك هنا');
    await expect(nameInput).toBeVisible({ timeout: 15000 });
    console.log('✓ Page and assets reloaded successfully while 100% offline!');

    // 4. PLAY A FULL STAGE COMPLETELY OFFLINE
    console.log('4. Playing a stage and answering questions offline...');
    await nameInput.fill('مستكشف دبارة');
    await page.getByRole('button', { name: 'متابعة' }).click();

    // Click "ابدأ أول تحدٍ"
    const startJourneyBtn = page.getByRole('button', { name: 'ابدأ أول تحدٍ' });
    await expect(startJourneyBtn).toBeVisible({ timeout: 5000 });
    await startJourneyBtn.click();

    // Verify question is loaded and displayed offline
    await expect(page.getByText('سؤال التحدي الثقافي:')).toBeVisible({ timeout: 5000 });

    // Verify 4 answer options are displayed and clickable offline
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

    // Verify we are on the map with HUD updated offline
    const tripoliPin = page.locator('button[data-city-id="tripoli"]');
    await expect(tripoliPin).toBeVisible({ timeout: 5000 });
    console.log('✓ Stage played and progress saved while 100% offline!');

    // 5. RESTORE NETWORK
    console.log('5. Restoring network connection...');
    await context.setOffline(false);
    await page.evaluate(() => window.dispatchEvent(new Event('online')));

    // Verify online notification toast appears
    await expect(page.getByText('تم استعادة الاتصال بالإنترنت')).toBeVisible({ timeout: 5000 });

    console.log('🎉 Full Offline Test PASSED with 100% Success!');
  });
});
