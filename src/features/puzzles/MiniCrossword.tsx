import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { MiniCrosswordPuzzle, CrosswordClue } from '../../types/puzzle';
import type { Stage } from '../../types/map';
import { useGameStore } from '../../store/useGameStore';
import { useMapStore } from '../../store/useMapStore';
import { sfx } from '../../audio/soundEffects';
import confetti from 'canvas-confetti';
import { ArrowRight, Sparkles, Trophy, Star, Lightbulb, Delete, CheckCircle2 } from 'lucide-react';

interface MiniCrosswordProps {
  stage: Stage;
  cityId: string;
  puzzle: MiniCrosswordPuzzle;
  onFinish: () => void;
}

export const MiniCrossword: React.FC<MiniCrosswordProps> = ({ stage, cityId, puzzle, onFinish }) => {
  const { addDinars, useLifeline, spendDinars, profile } = useGameStore();
  const { completeStage } = useMapStore();

  const [gridState, setGridState] = useState<string[][]>(() =>
    puzzle.grid.map((row) => row.map((cell) => (cell === null ? '#' : '')))
  );

  const [selectedCell, setSelectedCell] = useState<{ r: number; c: number }>({ r: 0, c: 0 });
  const [activeDirection, setActiveDirection] = useState<'across' | 'down'>('across');
  const [isCompleted, setIsCompleted] = useState<boolean>(false);

  // Map of cell to starting clue number
  const cellClueNumbers = useMemo(() => {
    const map = new Map<string, number>();
    puzzle.clues.forEach((clue) => {
      const key = `${clue.row}-${clue.col}`;
      if (!map.has(key)) {
        map.set(key, clue.number);
      }
    });
    return map;
  }, [puzzle.clues]);

  // Determine current active clue based on selectedCell and activeDirection
  const activeClue: CrosswordClue | undefined = useMemo(() => {
    const { r, c } = selectedCell;

    // Find clue matching direction that covers (r, c)
    const match = puzzle.clues.find((clue) => {
      if (clue.direction !== activeDirection) return false;
      if (clue.direction === 'across') {
        return clue.row === r && c >= clue.col && c < clue.col + clue.answer.length;
      } else {
        return clue.col === c && r >= clue.row && r < clue.row + clue.answer.length;
      }
    });

    if (match) return match;

    // Fallback to other direction if exists at this cell
    const otherMatch = puzzle.clues.find((clue) => {
      if (clue.direction === 'across') {
        return clue.row === r && c >= clue.col && c < clue.col + clue.answer.length;
      } else {
        return clue.col === c && r >= clue.row && r < clue.row + clue.answer.length;
      }
    });

    return otherMatch || puzzle.clues[0];
  }, [selectedCell, activeDirection, puzzle.clues]);

  // Is cell part of active clue
  const isCellInActiveClue = (r: number, c: number) => {
    if (!activeClue) return false;
    if (activeClue.direction === 'across') {
      return activeClue.row === r && c >= activeClue.col && c < activeClue.col + activeClue.answer.length;
    } else {
      return activeClue.col === c && r >= activeClue.row && r < activeClue.row + activeClue.answer.length;
    }
  };

  const handleCellClick = (r: number, c: number) => {
    if (puzzle.grid[r][c] === null) return;
    sfx.playTap();

    if (selectedCell.r === r && selectedCell.c === c) {
      // Toggle direction if double clicked on same cell
      setActiveDirection((prev) => (prev === 'across' ? 'down' : 'across'));
    } else {
      setSelectedCell({ r, c });
    }
  };

  const handleSelectClue = (clue: CrosswordClue) => {
    sfx.playTap();
    setActiveDirection(clue.direction);
    setSelectedCell({ r: clue.row, c: clue.col });
  };

  const handleKeyPress = (char: string) => {
    if (isCompleted) return;
    const { r, c } = selectedCell;
    if (puzzle.grid[r][c] === null) return;

    sfx.playTap();
    const newGrid = gridState.map((row) => [...row]);
    newGrid[r][c] = char;
    setGridState(newGrid);

    // Advance along active direction
    if (activeDirection === 'across') {
      if (c + 1 < puzzle.gridSize.cols && puzzle.grid[r][c + 1] !== null) {
        setSelectedCell({ r, c: c + 1 });
      }
    } else {
      if (r + 1 < puzzle.gridSize.rows && puzzle.grid[r + 1][c] !== null) {
        setSelectedCell({ r: r + 1, c });
      }
    }

    checkCompletion(newGrid);
  };

  const handleBackspace = () => {
    if (isCompleted) return;
    const { r, c } = selectedCell;
    sfx.playTap();

    const newGrid = gridState.map((row) => [...row]);
    if (newGrid[r][c]) {
      newGrid[r][c] = '';
      setGridState(newGrid);
    } else {
      // Move backwards
      if (activeDirection === 'across' && c > 0 && puzzle.grid[r][c - 1] !== null) {
        newGrid[r][c - 1] = '';
        setSelectedCell({ r, c: c - 1 });
        setGridState(newGrid);
      } else if (activeDirection === 'down' && r > 0 && puzzle.grid[r - 1][c] !== null) {
        newGrid[r - 1][c] = '';
        setSelectedCell({ r: r - 1, c });
        setGridState(newGrid);
      }
    }
  };

  const handleRevealLetter = () => {
    if (isCompleted) return;
    const { r, c } = selectedCell;
    const correctChar = puzzle.grid[r][c];
    if (!correctChar) return;

    if (profile.lifelines.revealLetter > 0) {
      useLifeline('revealLetter');
    } else {
      if (!spendDinars(15)) return;
    }

    sfx.playTap();
    const newGrid = gridState.map((row) => [...row]);
    newGrid[r][c] = correctChar;
    setGridState(newGrid);
    checkCompletion(newGrid);
  };

  const checkCompletion = (currentGrid: string[][]) => {
    for (let r = 0; r < puzzle.gridSize.rows; r++) {
      for (let c = 0; c < puzzle.gridSize.cols; c++) {
        const target = puzzle.grid[r][c];
        if (target !== null && currentGrid[r][c] !== target) {
          return;
        }
      }
    }

    // Solved completely!
    sfx.playVictory();
    setIsCompleted(true);
    addDinars(puzzle.rewardDinars);
    completeStage(cityId, stage.id, 3);
    confetti({
      particleCount: 70,
      spread: 75,
      origin: { y: 0.6 },
      colors: ['#E5A93B', '#FCD34D', '#10B981', '#38BDF8'],
    });
  };

  const arabicKeyboard = [
    ['ض', 'ص', 'ث', 'ق', 'ف', 'غ', 'ع', 'ه', 'خ', 'ح', 'ج'],
    ['ش', 'س', 'ي', 'ب', 'ل', 'ا', 'ت', 'ن', 'م', 'ك', 'ط'],
    ['ئ', 'ء', 'ؤ', 'ر', 'لا', 'ى', 'ة', 'و', 'ز', 'ظ', 'د', 'ذ'],
  ];

  return (
    <div className="flex flex-col gap-3 pb-24 max-w-lg mx-auto w-full px-3 pt-2 select-none">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={onFinish}
          className="flex items-center gap-1 text-xs font-bold text-[#94A3B8] hover:text-white bg-[#131C2E] px-3 py-1.5 rounded-xl border border-white/10"
        >
          <ArrowRight className="w-4 h-4" />
          <span>رجوع للخريطة</span>
        </button>

        <div className="text-center">
          <span className="text-xs font-semibold text-[#0EA5E9]">المرحلة {stage.stageNumber} • كلمات متقاطعة</span>
          <h3 className="text-sm font-extrabold text-white">{puzzle.title}</h3>
        </div>

        <button
          onClick={handleRevealLetter}
          className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#1E293B] border border-[#E5A93B]/40 text-[#FCD34D] text-xs font-bold shadow-sm"
        >
          <Lightbulb className="w-3.5 h-3.5 text-[#E5A93B]" />
          <span>كشف حرف</span>
        </button>
      </div>

      {/* Active Clue Highlight Banner */}
      {activeClue && (
        <div className="glass-panel p-3 rounded-2xl border-[#E5A93B]/40 flex items-center justify-between gap-2 shadow-lg">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-lg bg-[#E5A93B] text-[#0B0F19] font-black text-xs">
              {activeClue.direction === 'across' ? 'أفقياً' : 'رأسياً'} ({activeClue.number})
            </span>
            <span className="text-xs sm:text-sm font-bold text-[#F8FAFC]">
              {activeClue.clue}
            </span>
          </div>
          <span className="text-[11px] font-extrabold text-[#38BDF8] shrink-0 bg-[#0EA5E9]/15 px-2 py-0.5 rounded-md">
            {activeClue.answer.length} حروف
          </span>
        </div>
      )}

      {/* 4x4 Crossword Grid Container */}
      <div className="glass-panel p-4 rounded-3xl mx-auto flex flex-col items-center justify-center shadow-xl">
        <div
          className="grid gap-2"
          style={{
            gridTemplateColumns: `repeat(${puzzle.gridSize.cols}, minmax(0, 1fr))`,
          }}
        >
          {gridState.map((row, r) =>
            row.map((cellValue, c) => {
              const isBlock = puzzle.grid[r][c] === null;
              const isSelected = selectedCell.r === r && selectedCell.c === c;
              const isInActiveWord = isCellInActiveClue(r, c);
              const clueNumber = cellClueNumbers.get(`${r}-${c}`);

              if (isBlock) {
                return (
                  <div
                    key={`${r}-${c}`}
                    className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-[#080D18] border border-white/5 opacity-40"
                  />
                );
              }

              return (
                <button
                  key={`${r}-${c}`}
                  onClick={() => handleCellClick(r, c)}
                  className={`relative w-12 h-12 sm:w-14 sm:h-14 rounded-2xl font-black text-xl sm:text-2xl flex items-center justify-center transition-all ${
                    isSelected
                      ? 'bg-[#E5A93B] text-[#0B0F19] ring-4 ring-[#E5A93B]/50 scale-105 shadow-[0_0_20px_#E5A93B] z-10'
                      : isInActiveWord
                      ? 'bg-[#0EA5E9]/20 border-2 border-[#0EA5E9] text-white shadow-[0_0_10px_rgba(14,165,233,0.3)]'
                      : cellValue
                      ? 'bg-[#1E293B] border border-[#E5A93B]/30 text-white'
                      : 'bg-[#131C2E] border border-white/10 text-transparent hover:border-white/30'
                  }`}
                >
                  {/* Clue Number Indicator at Top-Right Corner */}
                  {clueNumber && (
                    <span
                      className={`absolute top-1 right-1.5 text-[9px] font-black leading-none ${
                        isSelected ? 'text-[#0B0F19]/80' : 'text-[#FCD34D]'
                      }`}
                    >
                      {clueNumber}
                    </span>
                  )}

                  {cellValue || ''}
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Clues Selection Quick List */}
      <div className="glass-card p-2.5 rounded-2xl space-y-1.5 text-xs">
        <div className="flex items-center gap-1.5 text-[#E5A93B] font-bold pb-1 border-b border-white/5">
          <Sparkles className="w-3.5 h-3.5" />
          <span>قائمة التلميحات (اضغط على أي تلميح للتحديد):</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
          {puzzle.clues.map((clue, idx) => {
            const isActive =
              activeClue?.number === clue.number && activeClue?.direction === clue.direction;

            return (
              <button
                key={idx}
                onClick={() => handleSelectClue(clue)}
                className={`p-2 rounded-xl text-right transition-all flex items-center justify-between text-xs font-bold border ${
                  isActive
                    ? 'bg-[#E5A93B]/20 border-[#E5A93B] text-[#FCD34D]'
                    : 'bg-[#0B0F19]/50 border-white/5 text-[#CBD5E1] hover:bg-white/5'
                }`}
              >
                <span>
                  <strong className="text-[#38BDF8]">
                    {clue.direction === 'across' ? 'أفقياً' : 'رأسياً'} ({clue.number}):
                  </strong>{' '}
                  {clue.clue}
                </span>
                {isActive && <CheckCircle2 className="w-3.5 h-3.5 text-[#E5A93B] shrink-0" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Mini Arabic Keyboard with Backspace Button */}
      <div className="glass-card p-2 rounded-2xl space-y-1 text-center">
        {arabicKeyboard.map((row, rIdx) => (
          <div key={rIdx} className="flex justify-center gap-1">
            {row.map((k) => (
              <button
                key={k}
                onClick={() => handleKeyPress(k)}
                className="w-7 h-8 sm:w-9 sm:h-9 rounded-lg bg-[#1E293B] hover:bg-[#E5A93B] hover:text-[#0B0F19] active:scale-90 text-xs sm:text-sm font-bold transition-all border border-white/5 text-white"
              >
                {k}
              </button>
            ))}

            {/* Add Backspace to last row */}
            {rIdx === arabicKeyboard.length - 1 && (
              <button
                onClick={handleBackspace}
                className="px-2.5 h-8 sm:h-9 rounded-lg bg-[#F43F5E]/20 border border-[#F43F5E]/40 text-[#F43F5E] hover:bg-[#F43F5E] hover:text-white active:scale-90 text-xs font-bold transition-all flex items-center justify-center"
              >
                <Delete className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Victory Celebration Modal */}
      <AnimatePresence>
        {isCompleted && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="w-full max-w-sm bg-gradient-to-b from-[#131C2E] to-[#0B0F19] border border-[#10B981]/50 rounded-3xl p-6 shadow-2xl text-center"
            >
              <div className="w-16 h-16 rounded-full bg-[#10B981]/20 border-2 border-[#10B981] flex items-center justify-center mx-auto mb-3 text-[#10B981]">
                <Trophy className="w-8 h-8" />
              </div>

              <h3 className="text-xl font-black text-white">عبقري الكلمات المتقاطعة! 🎉</h3>
              <p className="text-xs text-[#94A3B8] mt-1">أتممت شبكة الكلمات المتقاطعة بنجاح</p>

              <div className="flex items-center justify-center gap-1.5 my-3">
                {[1, 2, 3].map((s) => (
                  <Star key={s} className="w-6 h-6 text-[#E5A93B] fill-[#E5A93B]" />
                ))}
              </div>

              <p className="text-xs text-[#CBD5E1] bg-[#0F172A] p-3 rounded-2xl border border-white/5 mb-4 text-right">
                <strong className="text-[#FCD34D]">معلومة تراثية: </strong>
                {puzzle.funFact}
              </p>

              <div className="p-2.5 rounded-2xl bg-[#E5A93B]/10 border border-[#E5A93B]/20 text-[#FCD34D] font-extrabold text-xs mb-4">
                +{puzzle.rewardDinars} دينار ليبي مكافأة 💰
              </div>

              <button
                onClick={onFinish}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#10B981] to-[#059669] text-white font-black text-sm shadow-[0_0_20px_rgba(16,185,129,0.35)]"
              >
                متابعة الرحلة 🗺️
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
