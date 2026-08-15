import React, { Suspense, lazy, useMemo, useRef, useState, useEffect } from 'react';
import { useGameStore } from './store/useGameStore';
import { useMapStore } from './store/useMapStore';
import { HeaderHUD } from './components/HeaderHUD';
import { BottomNav } from './components/BottomNav';
import { SettingsModal } from './components/SettingsModal';
import { MapScreen } from './features/map/MapScreen';
import { usePWAInstall } from './features/pwa/usePWAInstall';
import { PWAInstallModal } from './features/pwa/PWAInstallModal';

// The map is the landing screen and stays in the entry chunk. Everything else
// is lazy-loaded so first paint doesn't pay for question banks, puzzle banks,
// crosswords, duels, or canvas rendering.
const CategoryHub = lazy(() =>
  import('./features/quickplay/CategoryHub').then((m) => ({ default: m.CategoryHub }))
);
const DailyChallengeScreen = lazy(() =>
  import('./features/daily/DailyChallengeScreen').then((m) => ({ default: m.DailyChallengeScreen }))
);
const BadgesScreen = lazy(() =>
  import('./features/badges/BadgesScreen').then((m) => ({ default: m.BadgesScreen }))
);
const QuizScreen = lazy(() =>
  import('./features/quiz/QuizScreen').then((m) => ({ default: m.QuizScreen }))
);
const LetterScramble = lazy(() =>
  import('./features/puzzles/LetterScramble').then((m) => ({ default: m.LetterScramble }))
);
const MiniCrossword = lazy(() =>
  import('./features/puzzles/MiniCrossword').then((m) => ({ default: m.MiniCrossword }))
);
const SpeedBlitz = lazy(() =>
  import('./features/quiz/SpeedBlitz').then((m) => ({ default: m.SpeedBlitz }))
);
const MainMenuScreen = lazy(() =>
  import('./features/menu/MainMenuScreen').then((m) => ({ default: m.MainMenuScreen }))
);
const OnboardingScreen = lazy(() =>
  import('./features/menu/OnboardingScreen').then((m) => ({ default: m.OnboardingScreen }))
);

export const HeritageLoadingFallback: React.FC<{ label?: string }> = ({ label = 'جارٍ التحضير…' }) => (
  <div
    className="flex flex-col items-center justify-center py-20 px-4 text-center animate-fade-in"
    role="status"
    aria-live="polite"
  >
    <div className="relative w-16 h-16 mb-3 flex items-center justify-center">
      <div className="absolute inset-0 rounded-full border-2 border-gold-400/20 border-t-gold-400 animate-spin" />
      <div className="absolute inset-2 rounded-full bg-gold-400/10 blur-sm animate-pulse" />
      <span className="text-xl select-none" aria-hidden="true">
        ✨
      </span>
    </div>
    <p className="text-xs font-bold text-gold-300 font-serif tracking-wide">{label}</p>
    <span className="sr-only">{label}</span>
  </div>
);

export const App: React.FC = () => {
  const {
    currentMode,
    setMode,
    checkBadgeUnlocks,
    refreshRank,
    hasOnboarded,
    completeOnboarding,
    seenQuestionIds,
  } = useGameStore();
  const { cities, activeStage, startStage, clearActiveStage, getTotalStars } = useMapStore();
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isInstallModalOpen, setIsInstallModalOpen] = useState<boolean>(false);
  // Returning players land directly in the game instead of the title menu on reload.
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);

  /**
   * The seen list as it stood when the current stage opened.
   *
   * Read through a ref on purpose: answering a question adds its id to the
   * store's seen list, and picking the stage's question from the live list
   * would then re-run the moment the player answers and swap the question out
   * from under them. The effect commits after render, so a stage always sees
   * the list from before it started.
   */
  const seenAtStageStart = useRef<string[]>(seenQuestionIds);
  useEffect(() => {
    seenAtStageStart.current = seenQuestionIds;
  }, [seenQuestionIds]);

  const { isInstallable, isInstalled, isIOS, isOnline, showOfflineToast, triggerInstall } =
    usePWAInstall();

  const totalStars = getTotalStars();

  useEffect(() => {
    checkBadgeUnlocks(totalStars);
    refreshRank(totalStars);
  }, [totalStars, checkBadgeUnlocks, refreshRank]);

  const activeStageView = useMemo(() => {
    if (!activeStage) return null;
    const { cityId, stage } = activeStage;

    switch (stage.type) {
      case 'multiple_choice':
        return (
          <Suspense fallback={<HeritageLoadingFallback label="جارٍ تجهيز السؤال…" />}>
            <QuizScreen
              stage={stage}
              cityId={cityId}
              seenIds={seenAtStageStart.current}
              onFinish={clearActiveStage}
            />
          </Suspense>
        );
      case 'letter_scramble':
        return (
          <Suspense fallback={<HeritageLoadingFallback label="جارٍ ترتيب الحروف…" />}>
            <LetterScramble stage={stage} cityId={cityId} onFinish={clearActiveStage} />
          </Suspense>
        );
      case 'crossword':
        return (
          <Suspense fallback={<HeritageLoadingFallback label="جارٍ بناء الشبكة…" />}>
            <MiniCrossword stage={stage} cityId={cityId} onFinish={clearActiveStage} />
          </Suspense>
        );
      case 'speed_blitz':
        return (
          <Suspense fallback={<HeritageLoadingFallback label="جارٍ إعداد السباق…" />}>
            <SpeedBlitz stage={stage} cityId={cityId} onFinish={clearActiveStage} />;
          </Suspense>
        );
      default:
        return null;
    }
  }, [activeStage, clearActiveStage]);

  const renderMainContent = () => {
    if (activeStageView) return activeStageView;

    switch (currentMode) {
      case 'quickplay':
        return (
          <Suspense fallback={<HeritageLoadingFallback label="جارٍ تجهيز الفئات…" />}>
            <CategoryHub />
          </Suspense>
        );
      case 'daily':
        return (
          <Suspense fallback={<HeritageLoadingFallback label="جارٍ تحميل التحدي اليومي…" />}>
            <DailyChallengeScreen />
          </Suspense>
        );
      case 'badges':
        return (
          <Suspense fallback={<HeritageLoadingFallback label="جارٍ فتح سجل الأوسمة والمعارف…" />}>
            <BadgesScreen />
          </Suspense>
        );
      case 'map':
      default:
        return <MapScreen onStartStage={startStage} />;
    }
  };

  /**
   * First run: short setup, then straight into the opening stage. Landing on a
   * real question is the point — a tour of the map would delay the moment that
   * actually shows what this game is.
   */
  if (!hasOnboarded) {
    const openingStage = cities[0]?.stages[0];
    return (
      <main className="min-h-screen bg-night-900 text-ink-100 font-sans bg-libyan-pattern selection:bg-gold-400/30">
        <Suspense fallback={<HeritageLoadingFallback label="أهلاً بك في دبارة…" />}>
          <OnboardingScreen
            onStart={(identity) => {
              completeOnboarding(identity);
              setIsMenuOpen(false);
              if (openingStage) startStage(cities[0].id, openingStage);
            }}
            onSkip={(identity) => completeOnboarding(identity)}
          />
        </Suspense>
      </main>
    );
  }

  if (isMenuOpen) {
    return (
      <main className="min-h-screen bg-night-900 text-ink-100 font-sans bg-libyan-pattern selection:bg-gold-400/30">
        <Suspense fallback={<HeritageLoadingFallback label="القائمة الرئيسية…" />}>
          <MainMenuScreen
            onPlay={(mode) => {
              setMode(mode);
              setIsMenuOpen(false);
            }}
            onOpenSettings={() => setIsSettingsOpen(true)}
          />
        </Suspense>
        <SettingsModal
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          onOpenInstall={() => setIsInstallModalOpen(true)}
        />
        <PWAInstallModal
          isOpen={isInstallModalOpen}
          onClose={() => setIsInstallModalOpen(false)}
          isIOS={isIOS}
          isInstallable={isInstallable}
          isInstalled={isInstalled}
          onInstall={triggerInstall}
        />
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-night-900 text-ink-100 flex flex-col font-sans bg-libyan-pattern selection:bg-gold-400/30">
      {/* Offline / Online Status Pill Toast */}
      {showOfflineToast && (
        <div className="fixed top-14 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-2xl bg-night-850/95 border border-gold-400/35 text-xs font-bold shadow-2xl flex items-center gap-2 backdrop-blur-md text-white transition-all">
          {!isOnline ? (
            <>
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
              <span>⚡ وضع اللعب دون إنترنت: كافة المراحل والأسئلة متاحة</span>
            </>
          ) : (
            <>
              <span className="w-2 h-2 rounded-full bg-oasis-400" />
              <span>✓ تم استعادة الاتصال بالإنترنت</span>
            </>
          )}
        </div>
      )}

      {/* Top HUD */}
      {!activeStage && (
        <HeaderHUD
          onOpenSettings={() => setIsSettingsOpen(true)}
          onOpenMenu={() => setIsMenuOpen(true)}
          onOpenInstall={() => setIsInstallModalOpen(true)}
          isInstalled={isInstalled}
          isOnline={isOnline}
        />
      )}

      {/* Main View Area */}
      <main className="flex-1 w-full max-w-lg mx-auto py-2">
        {renderMainContent()}
      </main>

      {/* Floating Bottom Navigation */}
      {!activeStage && <BottomNav />}

      {/* Settings & Backup Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onOpenInstall={() => setIsInstallModalOpen(true)}
      />

      {/* PWA Install Modal */}
      <PWAInstallModal
        isOpen={isInstallModalOpen}
        onClose={() => setIsInstallModalOpen(false)}
        isIOS={isIOS}
        isInstallable={isInstallable}
        isInstalled={isInstalled}
        onInstall={triggerInstall}
      />
    </div>
  );
};

export default App;
