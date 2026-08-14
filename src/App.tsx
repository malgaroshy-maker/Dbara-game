import React, { Suspense, lazy, useMemo, useState, useEffect } from 'react';
import { useGameStore } from './store/useGameStore';
import { useMapStore } from './store/useMapStore';
import { HeaderHUD } from './components/HeaderHUD';
import { BottomNav } from './components/BottomNav';
import { SettingsModal } from './components/SettingsModal';
import { MapScreen } from './features/map/MapScreen';

// Question & Puzzle Banks
import { historyQuestions } from './data/questions/history';
import { dialectQuestions } from './data/questions/dialects';
import { sportsQuestions } from './data/questions/sports';
import { foodTraditionsQuestions } from './data/questions/foodTraditions';
import { generalArabQuestions } from './data/questions/generalArab';
import { geographyQuestions } from './data/questions/geography';
import { islamicQuestions } from './data/questions/islamic';
import { literatureQuestions } from './data/questions/literature';
import { scienceQuestions } from './data/questions/science';
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

// Built once at module load: stage lookups were previously concatenating five
// banks into a fresh array on every render and then scanning it linearly.
const questionsById = new Map(
  [
    ...historyQuestions,
    ...dialectQuestions,
    ...sportsQuestions,
    ...foodTraditionsQuestions,
    ...generalArabQuestions,
    ...geographyQuestions,
    ...islamicQuestions,
    ...literatureQuestions,
    ...scienceQuestions,
  ].map((q) => [q.id, q])
);
const scramblesById = new Map(wordScramblePuzzles.map((p) => [p.id, p]));
const crosswordsById = new Map(miniCrosswords.map((p) => [p.id, p]));

const ScreenFallback: React.FC = () => (
  <div className="flex items-center justify-center py-24" role="status" aria-live="polite">
    <div className="w-10 h-10 rounded-full border-2 border-[#E5A93B]/30 border-t-[#E5A93B] animate-spin" />
    <span className="sr-only">جارٍ التحميل…</span>
  </div>
);

export const App: React.FC = () => {
  const { currentMode, setMode, checkBadgeUnlocks } = useGameStore();
  const { activeStage, startStage, clearActiveStage, getTotalStars } = useMapStore();
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  // The menu opens each launch rather than being persisted: it is the title
  // screen, not a saved location.
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(true);

  const totalStars = getTotalStars();

  useEffect(() => {
    checkBadgeUnlocks(totalStars);
  }, [totalStars, checkBadgeUnlocks]);

  const activeStageView = useMemo(() => {
    if (!activeStage) return null;
    const { cityId, stage } = activeStage;

    switch (stage.type) {
      case 'multiple_choice': {
        const question =
          (stage.questionId && questionsById.get(stage.questionId)) || historyQuestions[0];
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

  if (isMenuOpen) {
    return (
      <div className="min-h-screen bg-[#0B0F19] text-[#F8FAFC] font-sans bg-libyan-pattern selection:bg-[#E5A93B]/30">
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
    <div className="min-h-screen bg-[#0B0F19] text-[#F8FAFC] flex flex-col font-sans bg-libyan-pattern selection:bg-[#E5A93B]/30">
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
