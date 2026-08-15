import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { LetterScramblePuzzle } from '../../types/puzzle';
import type { Stage } from '../../types/map';
import { useGameStore } from '../../store/useGameStore';
import { useMapStore } from '../../store/useMapStore';
import { sfx } from '../../audio/soundEffects';
import { useModalA11y } from '../../hooks/useModalA11y';
import { ShareResultModal } from '../../components/ShareResultModal';
import { RewardCelebration } from '../../components/RewardCelebration';
import confetti from 'canvas-confetti';
import { Sparkles, ArrowRight, RotateCcw, Lightbulb, Trophy, Star, Delete, Share2 } from 'lucide-react';

import { wordScramblePuzzles } from '../../data/puzzles/wordScramble';

const scramblesById = new Map(wordScramblePuzzles.map((p) => [p.id, p]));

interface LetterScrambleProps {
  stage: Stage;
  cityId: string;
  puzzle?: LetterScramblePuzzle;
  onFinish: () => void;
  /** Fired once when the puzzle is solved, so hosts can record completion. */
  onSolved?: () => void;
}

export const LetterScramble: React.FC<LetterScrambleProps> = ({
  stage,
  cityId,
  puzzle: propPuzzle,
  onFinish,
  onSolved,
}) => {
  const puzzle = useMemo(() => {
    if (propPuzzle) return propPuzzle;
    return (stage.puzzleId && scramblesById.get(stage.puzzleId)) || wordScramblePuzzles[0];
  }, [propPuzzle, stage.puzzleId]);

  const { addDinars, profile } = useGameStore();
  const { completeStage } = useMapStore();

  const [selectedLetters, setSelectedLetters] = useState<{ id: number; char: string }[]>([]);
  const [usedTileIds, setUsedTileIds] = useState<number[]>([]);
  const [showHint, setShowHint] = useState<boolean>(false);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [isWrongShake, setIsWrongShake] = useState<boolean>(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState<boolean>(false);

  // The victory card is a modal in every respect except that it never said so.
  const victoryRef = useModalA11y(isCompleted);

  // Target answer without spaces for comparison
  const targetAnswer = puzzle.answer.replace(/\s+/g, '');

  // Shuffled tiles generated randomly on puzzle load
  const tiles = useMemo(() => {
    const chars = [...puzzle.scrambledLetters];
    for (let i = chars.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [chars[i], chars[j]] = [chars[j], chars[i]];
    }
    return chars.map((char, id) => ({ id, char }));
  }, [puzzle]);

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
        addDinars(stage.rewardDinars);
        completeStage(cityId, stage.id, 3);
        onSolved?.();
        confetti({
          particleCount: 60,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#E5A93B', '#FCD34D', '#10B981', '#38BDF8'],
        });
      } else {
        // Wrong assembly: shake, then hand the tiles back. Previously the
        // filled row just sat there and the player had to backspace it clear.
        sfx.playWrong();
        setIsWrongShake(true);
        setTimeout(() => {
          setIsWrongShake(false);
          setSelectedLetters([]);
          setUsedTileIds([]);
        }, 500);
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
    <div className="flex flex-col gap-4 pb-20 max-w-lg mx-auto w-full px-3 pt-2 select-none">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={onFinish}
          className="flex items-center gap-1 text-xs font-bold text-ink-400 hover:text-white bg-night-800 px-3 py-1.5 rounded-xl border border-white/10"
        >
          <ArrowRight className="w-4 h-4" />
          <span>رجوع للخريطة</span>
        </button>

        <div className="text-center">
          <span className="text-xs font-semibold text-oasis-500">المرحلة {stage.stageNumber} • لغز حروف</span>
          <h3 className="text-sm font-extrabold text-white">{stage.title}</h3>
        </div>

        <button
          onClick={() => setShowHint(true)}
          className="p-2 rounded-xl bg-night-700 border border-gold-400/30 text-gold-300 hover:bg-gold-400/20"
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
        <div className="flex items-center gap-1.5 text-xs text-oasis-500 font-bold mb-2">
          <Sparkles className="w-3.5 h-3.5" />
          <span>رتب الحروف لتكوين الإجابة:</span>
        </div>

        <h2 className="text-lg font-extrabold text-ink-100 leading-relaxed text-right">
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
                    ? 'bg-oasis-500/30 border-oasis-500 text-oasis-200 shadow-oasis-glow'
                    : 'bg-gold-400/20 border-gold-400 text-gold-300'
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
          className="flex items-center gap-1 px-4 py-2 rounded-xl bg-night-700 border border-white/10 text-ink-400 hover:text-white disabled:opacity-30 text-xs font-bold"
        >
          <Delete className="w-4 h-4" />
          <span>مسح حرف</span>
        </button>

        <button
          onClick={handleReset}
          disabled={selectedLetters.length === 0 || isCompleted}
          className="flex items-center gap-1 px-4 py-2 rounded-xl bg-night-700 border border-white/10 text-ink-400 hover:text-white disabled:opacity-30 text-xs font-bold"
        >
          <RotateCcw className="w-4 h-4" />
          <span>إعادة ترتيب</span>
        </button>
      </div>

      {/* Scrambled Letter Tiles Grid */}
      <div className="glass-card p-4 rounded-3xl">
        <p className="text-xs text-ink-400 font-bold text-center mb-3">
          اضغط على الحروف بالترتيب لتكوين الكلمة:
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
                    : 'bg-gradient-to-b from-night-700 to-night-800 border-2 border-gold-400/40 hover:border-gold-400 text-ink-100 shadow-lift active:scale-95'
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
              className="w-full max-w-sm bg-gradient-to-b from-night-700 to-night-900 border border-gold-400/40 rounded-3xl p-5 shadow-2xl text-center"
            >
              <Lightbulb className="w-8 h-8 text-gold-300 mx-auto mb-2" />
              <h4 className="text-base font-bold text-white mb-2">تلميح اللغز 💡</h4>
              <p className="text-xs text-ink-300 bg-night-850 p-3 rounded-xl border border-white/5 mb-4">
                {puzzle.hint}
              </p>
              <button
                onClick={() => setShowHint(false)}
                className="w-full py-2.5 rounded-xl bg-gold-400 text-night-900 font-black text-xs"
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
              ref={victoryRef}
              role="dialog"
              aria-modal="true"
              aria-label="حللت اللغز"
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="w-full max-w-sm bg-gradient-to-b from-night-800 to-night-900 border border-oasis-500/50 rounded-3xl p-6 shadow-2xl text-center"
            >
              <div className="w-16 h-16 rounded-full bg-oasis-500/20 border-2 border-oasis-500 flex items-center justify-center mx-auto mb-3 text-oasis-500">
                <Trophy className="w-8 h-8" />
              </div>

              <h3 className="text-xl font-black text-white">دبارتك في مكانها! 🎉</h3>
              <p className="text-xs text-ink-400 mt-1">حللت اللغز ورتبت الكلمة ببراعة</p>

              <div className="flex items-center justify-center gap-1.5 my-3">
                {[1, 2, 3].map((s) => (
                  <Star key={s} className="w-6 h-6 text-gold-400 fill-gold-400" />
                ))}
              </div>

              <p className="text-xs text-ink-300 bg-night-850 p-3 rounded-2xl border border-white/5 mb-4 text-right">
                <strong className="text-gold-300">معلومة تراثية: </strong>
                {puzzle.funFact}
              </p>

              <div className="p-2.5 rounded-2xl bg-gold-400/10 border border-gold-400/20 text-gold-300 font-extrabold text-xs mb-4">
                +{stage.rewardDinars} دينار ليبي مكافأة 💰
              </div>

              <button
                onClick={onFinish}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-oasis-500 to-oasis-600 text-white font-black text-sm shadow-oasis-glow"
              >
                متابعة الرحلة 🗺️
              </button>

              {/* A solved word puzzle is the most shareable thing in the game —
                  short, self-contained, and it gives nothing away to whoever
                  sees it, since the card carries the result and not the answer. */}
              <button
                onClick={() => {
                  sfx.playTap();
                  setIsShareModalOpen(true);
                }}
                className="w-full mt-2 py-2.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-ink-200 font-bold text-xs flex items-center justify-center gap-1.5"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>شارك إنجازك</span>
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <ShareResultModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        title="حللت لغز الحروف"
        subtitle={stage.title}
        playerName={profile.name}
        playerAvatar={profile.avatar}
        playerTitle={profile.title}
        scoreOrStars={{ stars: 3, dinarsEarned: stage.rewardDinars }}
        contextType="daily"
      />

      <RewardCelebration
        show={isCompleted}
        stars={3}
        dinars={stage.rewardDinars}
      />
    </div>
  );
};
