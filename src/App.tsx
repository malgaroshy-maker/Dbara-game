import React, { Suspense, lazy, useMemo, useState, useEffect } from 'react';
import { useGameStore } from './store/useGameStore';
import { useMapStore } from './store/useMapStore';
import { HeaderHUD } from './components/HeaderHUD';
import { BottomNav } from './components/BottomNav';
import { SettingsModal } from './components/SettingsModal';
import { MapScreen } from './features/map/MapScreen';

// Question & Puzzle Banks
import { allQuestions, questionById } from './data/questions';
import { wordScramblePuzzles } from './data/puzzles/wordScramble';
import { miniCrosswords } from './data/puzzles/crosswords';

// The map is the landing screen and stays in the entry chunk. Everything else
// is split out so first paint doesn't pay for the crossword keyboard, the
// duel screen, or the share-card canvas.
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

// Stage lookups go through the shared index in `data/questions`, which is built
// once at module load. This used to concatenate every bank into a fresh array
// on each render and then scan it linearly.
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
  // The menu opens each launch rather than being persisted: it is the title
  // screen, not a saved location.
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(true);

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
        <Suspense fallback={<ScreenFallback />}>
          <OnboardingScreen
            onStart={(identity) => {
              completeOnboarding(identity);
              setIsMenuOpen(false);
              if (openingStage) startStage(cities[0].id, openingStage);
            }}
            onSkip={(identity) => completeOnboarding(identity)}
          />
        </Suspense>
      </div>
    );
  }

  if (isMenuOpen) {
    return (
      <div className="min-h-screen bg-night-900 text-ink-100 font-sans bg-libyan-pattern selection:bg-gold-400/30">
        <Suspense fallback={<ScreenFallback />}>
          <MainMenuScreen
            onPlay={(mode) => {
              setMode(mode);
              setIsMenuOpen(false);
            }}
            onOpenSettings={() => setIsSettingsOpen(true)}
          />
        </Suspense>
        <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-night-900 text-ink-100 flex flex-col font-sans bg-libyan-pattern selection:bg-gold-400/30">
      {/* Top HUD */}
      {!activeStage && (
        <HeaderHUD
          onOpenSettings={() => setIsSettingsOpen(true)}
          onOpenMenu={() => setIsMenuOpen(true)}
        />
      )}

      {/* Main View Area */}
      <main className="flex-1 w-full max-w-lg mx-auto py-2">
        <Suspense fallback={<ScreenFallback />}>{renderMainContent()}</Suspense>
      </main>

      {/* Floating Bottom Navigation */}
      {!activeStage && <BottomNav />}

      {/* Settings & Backup Modal */}
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </div>
  );
};

export default App;
