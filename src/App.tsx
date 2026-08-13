import React, { useState, useEffect } from 'react';
import { useGameStore } from './store/useGameStore';
import { useMapStore } from './store/useMapStore';
import { HeaderHUD } from './components/HeaderHUD';
import { BottomNav } from './components/BottomNav';
import { SettingsModal } from './components/SettingsModal';
import { MapScreen } from './features/map/MapScreen';
import { CategoryHub } from './features/quickplay/CategoryHub';
import { DailyChallengeScreen } from './features/daily/DailyChallengeScreen';
import { BadgesScreen } from './features/badges/BadgesScreen';
import { QuizScreen } from './features/quiz/QuizScreen';
import { LetterScramble } from './features/puzzles/LetterScramble';
import { MiniCrossword } from './features/puzzles/MiniCrossword';
import { SpeedBlitz } from './features/quiz/SpeedBlitz';

// Question & Puzzle Banks
import { historyQuestions } from './data/questions/history';
import { dialectQuestions } from './data/questions/dialects';
import { sportsQuestions } from './data/questions/sports';
import { foodTraditionsQuestions } from './data/questions/foodTraditions';
import { generalArabQuestions } from './data/questions/generalArab';
import { wordScramblePuzzles } from './data/puzzles/wordScramble';
import { miniCrosswords } from './data/puzzles/crosswords';

export const App: React.FC = () => {
  const { currentMode, checkDailyStreak } = useGameStore();
  const { activeStage, startStage, clearActiveStage } = useMapStore();
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);

  // Check Daily Streak on Mount
  useEffect(() => {
    checkDailyStreak();
  }, [checkDailyStreak]);

  // Combine all questions for stage lookups
  const allQuestions = [
    ...historyQuestions,
    ...dialectQuestions,
    ...sportsQuestions,
    ...foodTraditionsQuestions,
    ...generalArabQuestions,
  ];

  const renderActiveStage = () => {
    if (!activeStage) return null;
    const { cityId, stage } = activeStage;

    if (stage.type === 'multiple_choice') {
      const q = allQuestions.find((item) => item.id === stage.questionId) || historyQuestions[0];
      return (
        <QuizScreen
          stage={stage}
          cityId={cityId}
          question={q}
          onFinish={clearActiveStage}
        />
      );
    }

    if (stage.type === 'letter_scramble') {
      const puzzle = wordScramblePuzzles.find((p) => p.id === stage.puzzleId) || wordScramblePuzzles[0];
      return (
        <LetterScramble
          stage={stage}
          cityId={cityId}
          puzzle={puzzle}
          onFinish={clearActiveStage}
        />
      );
    }

    if (stage.type === 'crossword') {
      const puzzle = miniCrosswords.find((p) => p.id === stage.puzzleId) || miniCrosswords[0];
      return (
        <MiniCrossword
          stage={stage}
          cityId={cityId}
          puzzle={puzzle}
          onFinish={clearActiveStage}
        />
      );
    }

    if (stage.type === 'speed_blitz') {
      return (
        <SpeedBlitz
          stage={stage}
          cityId={cityId}
          onFinish={clearActiveStage}
        />
      );
    }

    return null;
  };

  const renderMainContent = () => {
    if (activeStage) {
      return renderActiveStage();
    }

    switch (currentMode) {
      case 'map':
        return <MapScreen onStartStage={startStage} />;
      case 'quickplay':
        return <CategoryHub />;
      case 'daily':
        return <DailyChallengeScreen />;
      case 'badges':
        return <BadgesScreen />;
      default:
        return <MapScreen onStartStage={startStage} />;
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0F19] text-[#F8FAFC] flex flex-col font-sans bg-libyan-pattern selection:bg-[#E5A93B]/30">
      {/* Top HUD */}
      {!activeStage && <HeaderHUD onOpenSettings={() => setIsSettingsOpen(true)} />}

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
      />
    </div>
  );
};

export default App;
