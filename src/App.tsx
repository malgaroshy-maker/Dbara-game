import React, { Suspense, lazy, useMemo, useState, useEffect } from 'react';
import { useGameStore } from './store/useGameStore';
import { useMapStore } from './store/useMapStore';
import { HeaderHUD } from './components/HeaderHUD';
import { BottomNav } from './components/BottomNav';
import { SettingsModal } from './components/SettingsModal';
import { MapScreen } from './features/map/MapScreen';
import { usePWAInstall } from './features/pwa/usePWAInstall';
import { PWAInstallModal } from './features/pwa/PWAInstallModal';

// Question & Puzzle Banks
import { allQuestions, questionById } from './data/questions';
import { wordScramblePuzzles } from './data/puzzles/wordScramble';
import { miniCrosswords } from './data/puzzles/crosswords';

// The map is the landing screen and stays in the entry chunk. Everything else
// is split out so first paint doesn't pay for the crossword keyboard, the
// duel screen, or the share-card canvas.
import { CategoryHub } from './features/quickplay/CategoryHub';
import { DailyChallengeScreen } from './features/daily/DailyChallengeScreen';
import { BadgesScreen } from './features/badges/BadgesScreen';
import { QuizScreen } from './features/quiz/QuizScreen';
import { LetterScramble } from './features/puzzles/LetterScramble';
import { MiniCrossword } from './features/puzzles/MiniCrossword';
import { SpeedBlitz } from './features/quiz/SpeedBlitz';
import { MainMenuScreen } from './features/menu/MainMenuScreen';
import { OnboardingScreen } from './features/menu/OnboardingScreen';

const scramblesById = new Map(wordScramblePuzzles.map((p) => [p.id, p]));
const crosswordsById = new Map(miniCrosswords.map((p) => [p.id, p]));

const ScreenFallback: React.FC = () => (
  <div className="flex items-center justify-center py-24" role="status" aria-live="polite">
    <div className="w-10 h-10 rounded-full border-2 border-gold-400/30 border-t-gold-400 animate-spin" />
    <span className="sr-only">جارٍ التحميل…</span>
  </div>
);

export const App: React.FC = () => {
  const { currentMode, setMode, checkBadgeUnlocks, refreshRank, hasOnboarded, completeOnboarding } =
    useGameStore();
  const { cities, activeStage, startStage, clearActiveStage, getTotalStars } = useMapStore();
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isInstallModalOpen, setIsInstallModalOpen] = useState<boolean>(false);
  // Returning players land directly in the game instead of the title menu on reload.
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);

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
      case 'multiple_choice': {
        const question =
          (stage.questionId && questionById(stage.questionId)) || allQuestions[0];
        return (
          <QuizScreen stage={stage} cityId={cityId} question={question} onFinish={clearActiveStage} />
        );
      }
      case 'letter_scramble': {
        const puzzle =
          (stage.puzzleId && scramblesById.get(stage.puzzleId)) || wordScramblePuzzles[0];
        return (
          <LetterScramble stage={stage} cityId={cityId} puzzle={puzzle} onFinish={clearActiveStage} />
        );
      }
      case 'crossword': {
        const puzzle = (stage.puzzleId && crosswordsById.get(stage.puzzleId)) || miniCrosswords[0];
        return (
          <MiniCrossword stage={stage} cityId={cityId} puzzle={puzzle} onFinish={clearActiveStage} />
        );
      }
      case 'speed_blitz':
        return <SpeedBlitz stage={stage} cityId={cityId} onFinish={clearActiveStage} />;
      default:
        return null;
    }
  }, [activeStage, clearActiveStage]);

  const renderMainContent = () => {
    if (activeStageView) return activeStageView;

    switch (currentMode) {
      case 'quickplay':
        return <CategoryHub />;
      case 'daily':
        return <DailyChallengeScreen />;
      case 'badges':
        return <BadgesScreen />;
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
      <div className="min-h-screen bg-night-900 text-ink-100 font-sans bg-libyan-pattern selection:bg-gold-400/30">
        <OnboardingScreen
          onStart={(identity) => {
            completeOnboarding(identity);
            setIsMenuOpen(false);
            if (openingStage) startStage(cities[0].id, openingStage);
          }}
          onSkip={(identity) => completeOnboarding(identity)}
        />
      </div>
    );
  }

  if (isMenuOpen) {
    return (
      <div className="min-h-screen bg-night-900 text-ink-100 font-sans bg-libyan-pattern selection:bg-gold-400/30">
        <MainMenuScreen
          onPlay={(mode) => {
            setMode(mode);
            setIsMenuOpen(false);
          }}
          onOpenSettings={() => setIsSettingsOpen(true)}
        />
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
      </div>
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
