import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { LetterScramblePuzzle } from '../../types/puzzle';
import type { Stage } from '../../types/map';
import { useGameStore } from '../../store/useGameStore';
import { useMapStore } from '../../store/useMapStore';
import { sfx } from '../../audio/soundEffects';
import confetti from 'canvas-confetti';
import { Sparkles, ArrowRight, RotateCcw, Lightbulb, Trophy, Star, Delete } from 'lucide-react';

interface LetterScrambleProps {
  stage: Stage;
  cityId: string;
  puzzle: LetterScramblePuzzle;
  onFinish: () => void;
}

export const LetterScramble: React.FC<LetterScrambleProps> = ({ stage, cityId, puzzle, onFinish }) => {
  const { addDinars } = useGameStore();
  const { completeStage } = useMapStore();

  const [selectedLetters, setSelectedLetters] = useState<{ id: number; char: string }[]>([]);
  const [usedTileIds, setUsedTileIds] = useState<number[]>([]);
  const [showHint, setShowHint] = useState<boolean>(false);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [isWrongShake, setIsWrongShake] = useState<boolean>(false);

  const tiles = puzzle.scrambledLetters.map((char, id) => ({ id, char }));
  const targetAnswer = puzzle.answer.replace(/\s+/g, '');

  const handleTapTile = (tile: { id: number; char: string }) => {
    if (usedTileIds.includes(tile.id) || isCompleted) return;
    sfx.playTap();

    const nextSelected = [...selectedLetters, tile];
    const nextUsedIds = [...usedTileIds, tile.id];
    setSelectedLetters(nextSelected);
    setUsedTileIds(nextUsedIds);

    // Check if full length reached
    if (nextSelected.length === targetAnswer.length) {
      const assembledWord = nextSelected.map((t) => t.char).join('');
      if (assembledWord === targetAnswer) {
        // Victory!
        sfx.playVictory();
        setIsCompleted(true);
        addDinars(puzzle.rewardDinars);
        completeStage(cityId, stage.id, 3);
        confetti({
          particleCount: 60,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#E5A93B', '#FCD34D', '#10B981', '#38BDF8'],
        });
      } else {
        // Wrong assembly
        sfx.playWrong();
        setIsWrongShake(true);
        setTimeout(() => setIsWrongShake(false), 500);
      }
    }
  };

  const handleRemoveLast = () => {
    if (selectedLetters.length === 0 || isCompleted) return;
    sfx.playTap();
    const lastTile = selectedLetters[selectedLetters.length - 1];
    setSelectedLetters((prev) => prev.slice(0, -1));
    setUsedTileIds((prev) => prev.filter((id) => id !== lastTile.id));
  };

  const handleReset = () => {
    if (isCompleted) return;
    sfx.playTap();
    setSelectedLetters([]);
    setUsedTileIds([]);
  };

  return (
    <div className="flex flex-col gap-4 pb-20 max-w-lg mx-auto w-full px-3 pt-2">
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
          <span className="text-xs font-semibold text-[#10B981]">المرحلة {stage.stageNumber} • لغز حروف</span>
          <h3 className="text-sm font-extrabold text-white">{stage.title}</h3>
        </div>

        <button
          onClick={() => setShowHint(true)}
          className="p-2 rounded-xl bg-[#1E293B] border border-[#E5A93B]/30 text-[#FCD34D] hover:bg-[#E5A93B]/20"
        >
          <Lightbulb className="w-4 h-4" />
        </button>
      </div>

      {/* Prompt Card */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-panel p-5 rounded-3xl relative"
      >
        <div className="flex items-center gap-1.5 text-xs text-[#10B981] font-bold mb-2">
          <Sparkles className="w-3.5 h-3.5" />
          <span>رتب الحروف لتكوين الإجابة:</span>
        </div>

        <h2 className="text-lg font-extrabold text-[#F8FAFC] leading-relaxed text-right">
          {puzzle.prompt}
        </h2>
      </motion.div>

      {/* Answer Slots Area */}
      <motion.div
        animate={isWrongShake ? { x: [-10, 10, -10, 10, 0] } : {}}
        className="glass-card p-4 rounded-3xl min-h-[90px] flex items-center justify-center gap-2 flex-wrap"
      >
        {Array.from({ length: targetAnswer.length }).map((_, idx) => {
          const filled = selectedLetters[idx];
          return (
            <div
              key={idx}
              className={`w-11 h-12 rounded-xl border-2 flex items-center justify-center font-black text-lg transition-all ${
                filled
                  ? isCompleted
                    ? 'bg-[#10B981]/30 border-[#10B981] text-[#A7F3D0] shadow-[0_0_15px_rgba(16,185,129,0.4)]'
                    : 'bg-[#E5A93B]/20 border-[#E5A93B] text-[#FCD34D]'
                  : 'bg-black/30 border-dashed border-white/20 text-transparent'
              }`}
            >
              {filled?.char || '•'}
            </div>
          );
        })}
      </motion.div>

      {/* Controls (Backspace & Reset) */}
      <div className="flex items-center justify-center gap-3">
        <button
          onClick={handleRemoveLast}
          disabled={selectedLetters.length === 0 || isCompleted}
          className="flex items-center gap-1 px-4 py-2 rounded-xl bg-[#1E293B] border border-white/10 text-[#94A3B8] hover:text-white disabled:opacity-30 text-xs font-bold"
        >
          <Delete className="w-4 h-4" />
          <span>مسح حرف</span>
        </button>

        <button
          onClick={handleReset}
          disabled={selectedLetters.length === 0 || isCompleted}
          className="flex items-center gap-1 px-4 py-2 rounded-xl bg-[#1E293B] border border-white/10 text-[#94A3B8] hover:text-white disabled:opacity-30 text-xs font-bold"
        >
          <RotateCcw className="w-4 h-4" />
          <span>إعادة ترتيب</span>
        </button>
      </div>

      {/* Scrambled Letter Tiles Grid */}
      <div className="glass-card p-4 rounded-3xl">
        <p className="text-xs text-[#94A3B8] font-bold text-center mb-3">
          اضغط على الحروف بالترتيب الصحيح:
        </p>

        <div className="flex flex-wrap items-center justify-center gap-2.5">
          {tiles.map((tile) => {
            const isUsed = usedTileIds.includes(tile.id);
            return (
              <motion.button
                key={tile.id}
                whileTap={!isUsed && !isCompleted ? { scale: 0.9 } : {}}
                disabled={isUsed || isCompleted}
                onClick={() => handleTapTile(tile)}
                className={`w-12 h-12 rounded-2xl font-black text-xl flex items-center justify-center transition-all shadow-md ${
                  isUsed
                    ? 'opacity-20 bg-white/5 border border-white/5 text-transparent cursor-not-allowed scale-90'
                    : 'bg-gradient-to-b from-[#1E293B] to-[#131C2E] border-2 border-[#E5A93B]/40 hover:border-[#E5A93B] text-[#F8FAFC] shadow-[0_4px_10px_rgba(0,0,0,0.3)] active:scale-95'
                }`}
              >
                {tile.char}
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Hint Modal */}
      <AnimatePresence>
        {showHint && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-sm bg-gradient-to-b from-[#1E293B] to-[#0B0F19] border border-[#E5A93B]/40 rounded-3xl p-5 shadow-2xl text-center"
            >
              <Lightbulb className="w-8 h-8 text-[#FCD34D] mx-auto mb-2" />
              <h4 className="text-base font-bold text-white mb-2">تلميح اللغز 💡</h4>
              <p className="text-xs text-[#CBD5E1] bg-[#0F172A] p-3 rounded-xl border border-white/5 mb-4">
                {puzzle.hint}
              </p>
              <button
                onClick={() => setShowHint(false)}
                className="w-full py-2.5 rounded-xl bg-[#E5A93B] text-[#0B0F19] font-black text-xs"
              >
                فهمت، شكراً!
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

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

              <h3 className="text-xl font-black text-white">دبارتك في مكانها! 🎉</h3>
              <p className="text-xs text-[#94A3B8] mt-1">حللت اللغز ورتبت الكلمة ببراعة</p>

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
