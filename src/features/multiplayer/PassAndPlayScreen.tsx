import React, { useState, useCallback, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { historyQuestions } from '../../data/questions/history';
import { dialectQuestions } from '../../data/questions/dialects';
import { sportsQuestions } from '../../data/questions/sports';
import { foodTraditionsQuestions } from '../../data/questions/foodTraditions';
import { generalArabQuestions } from '../../data/questions/generalArab';
import { geographyQuestions } from '../../data/questions/geography';
import { islamicQuestions } from '../../data/questions/islamic';
import { literatureQuestions } from '../../data/questions/literature';
import { scienceQuestions } from '../../data/questions/science';
import type { TriviaQuestion } from '../../types/quiz';
import { useCountdown } from '../../hooks/useCountdown';
import { sfx } from '../../audio/soundEffects';
import confetti from 'canvas-confetti';
import {
  ArrowRight,
  Play, 
  RotateCcw, 
  Trophy, 
  Clock, 
  Sparkles, 
  CheckCircle, 
  XCircle,
  Swords,
  Share2
} from 'lucide-react';
import { ShareResultModal } from '../../components/ShareResultModal';

interface PassAndPlayScreenProps {
  onBack: () => void;
}

export const PassAndPlayScreen: React.FC<PassAndPlayScreenProps> = ({ onBack }) => {
  // Game Setup State
  const [isGameStarted, setIsGameStarted] = useState<boolean>(false);
  const [player1Name, setPlayer1Name] = useState<string>('الفارس 1');
  const [player1Avatar, setPlayer1Avatar] = useState<string>('🧭');
  const [player2Name, setPlayer2Name] = useState<string>('الفارس 2');
  const [player2Avatar, setPlayer2Avatar] = useState<string>('🦅');
  const [totalQuestions, setTotalQuestions] = useState<number>(5);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Match State
  const [questions, setQuestions] = useState<TriviaQuestion[]>([]);
  const [currentQIndex, setCurrentQIndex] = useState<number>(0);
  const [currentTurn, setCurrentTurn] = useState<1 | 2>(1);
  const [player1Score, setPlayer1Score] = useState<number>(0);
  const [player2Score, setPlayer2Score] = useState<number>(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState<boolean>(false);
  const [isPassingDevice, setIsPassingDevice] = useState<boolean>(false);
  const [isMatchFinished, setIsMatchFinished] = useState<boolean>(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState<boolean>(false);

  const avatars = ['🧭', '🦅', '🦁', '⚔️', '🌴', '🏛️', '🛡️', '⚡'];

  // Every bank the duel can draw from, keyed by the selector's value.
  const banksByCategory = useMemo(
    () => ({
      history: historyQuestions,
      dialects: dialectQuestions,
      sports: sportsQuestions,
      food: foodTraditionsQuestions,
      geography: geographyQuestions,
      islamic: islamicQuestions,
      literature: literatureQuestions,
      science: scienceQuestions,
      general: generalArabQuestions,
    }),
    []
  );

  const allQuestions = useMemo(
    () => Object.values(banksByCategory).flat(),
    [banksByCategory]
  );

  const handleStartDuel = () => {
    const sourceBank =
      banksByCategory[selectedCategory as keyof typeof banksByCategory] ?? allQuestions;

    // Always shuffle a copy — shuffling the imported bank in place would
    // permanently reorder the question data for every other screen.
    const pool = [...sourceBank];
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }

    const duelQuestions = pool.slice(0, totalQuestions);
    setQuestions(duelQuestions);
    setCurrentQIndex(0);
    setCurrentTurn(1);
    setPlayer1Score(0);
    setPlayer2Score(0);
    isTurnResolvedRef.current = false;
    resetTimer(20);
    setSelectedOption(null);
    setIsAnswered(false);
    setIsPassingDevice(false);
    setIsMatchFinished(false);
    setIsGameStarted(true);
    sfx.playVictory();
  };

  const currentQ = questions[currentQIndex];

  // Shuffled options for current question
  const shuffledOptions = useMemo(() => {
    if (!currentQ) return [];
    const opts = currentQ.options.map((text, originalIndex) => ({ text, originalIndex }));
    for (let i = opts.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [opts[i], opts[j]] = [opts[j], opts[i]];
    }
    return opts;
  }, [currentQ]);

  // One handoff per turn: both the clock expiring and a tap can schedule the
  // advance, and firing it twice would silently skip a player's turn.
  const isTurnResolvedRef = useRef<boolean>(false);

  const scheduleAdvance = () => {
    if (isTurnResolvedRef.current) return;
    isTurnResolvedRef.current = true;
    setTimeout(() => advanceTurn(), 1800);
  };

  // Deliberately not memoised: useCountdown re-reads its callbacks every
  // render, so this always closes over the current turn's state.
  const handleTimeOut = () => {
    setIsAnswered(true);
    sfx.playWrong();
    scheduleAdvance();
  };

  const handleTick = useCallback((secondsLeft: number) => {
    if (secondsLeft <= 4) sfx.playTick();
  }, []);

  const { timeLeft, reset: resetTimer } = useCountdown({
    initialSeconds: 20,
    running: isGameStarted && !isAnswered && !isPassingDevice && !isMatchFinished,
    onExpire: handleTimeOut,
    onTick: handleTick,
  });

  const handleSelectOption = (visualIdx: number) => {
    if (isAnswered) return;
    setSelectedOption(visualIdx);
    setIsAnswered(true);

    const isCorrect = shuffledOptions[visualIdx].originalIndex === currentQ.correctIndex;
    if (isCorrect) {
      sfx.playCorrect();
      if (currentTurn === 1) setPlayer1Score((s) => s + 1);
      else setPlayer2Score((s) => s + 1);
    } else {
      sfx.playWrong();
    }

    scheduleAdvance();
  };

  const advanceTurn = () => {
    if (currentTurn === 1) {
      // Switch to Player 2 for the same or next question
      setCurrentTurn(2);
      setIsPassingDevice(true);
    } else {
      // End of round for both players
      if (currentQIndex + 1 >= questions.length) {
        // Duel ended!
        setIsMatchFinished(true);
        sfx.playVictory();
        confetti({
          particleCount: 80,
          spread: 80,
          origin: { y: 0.6 },
          colors: ['#E5A93B', '#FCD34D', '#10B981', '#38BDF8'],
        });
      } else {
        setCurrentQIndex((idx) => idx + 1);
        setCurrentTurn(1);
        setIsPassingDevice(true);
      }
    }
  };

  const handleReadyAfterPass = () => {
    setIsPassingDevice(false);
    setIsAnswered(false);
    setSelectedOption(null);
    isTurnResolvedRef.current = false;
    resetTimer(20);
    sfx.playTap();
  };

  const optionLabels = ['أ', 'ب', 'ج', 'د'];

  // Setup Screen
  if (!isGameStarted) {
    return (
      <div className="flex flex-col gap-4 pb-20 max-w-lg mx-auto w-full px-3 pt-1 select-none">
        {/* Header */}
        <div className="flex items-center justify-between">
          <button
            onClick={onBack}
            className="flex items-center gap-1 text-xs font-bold text-ink-400 hover:text-white bg-night-800 px-3 py-1.5 rounded-xl border border-white/10"
          >
            <ArrowRight className="w-4 h-4" />
            <span>رجوع</span>
          </button>
          <div className="text-center">
            <h2 className="text-base font-extrabold text-white flex items-center gap-1.5">
              <Swords className="w-5 h-5 text-gold-400" />
              <span>التحدي الثنائي (Pass & Play)</span>
            </h2>
          </div>
          <div className="w-12" />
        </div>

        {/* Players Card Config */}
        <div className="grid grid-cols-2 gap-3">
          {/* Player 1 */}
          <div className="glass-panel p-4 rounded-3xl border-sea-500/40 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-sea-300">اللاعب الأول</span>
              <span className="text-2xl">{player1Avatar}</span>
            </div>
            <input
              type="text"
              value={player1Name}
              onChange={(e) => setPlayer1Name(e.target.value)}
              placeholder="اسم اللاعب 1"
              className="w-full p-2 rounded-xl bg-black/40 border border-white/10 text-xs text-white font-bold"
            />
            {/* Avatar Select */}
            <div className="flex flex-wrap gap-1 pt-1">
              {avatars.slice(0, 4).map((av) => (
                <button
                  key={av}
                  onClick={() => setPlayer1Avatar(av)}
                  className={`p-1 rounded-lg text-sm border ${
                    player1Avatar === av ? 'bg-sea-500/30 border-sea-500' : 'border-white/5'
                  }`}
                >
                  {av}
                </button>
              ))}
            </div>
          </div>

          {/* Player 2 */}
          <div className="glass-panel p-4 rounded-3xl border-flame/40 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-gold-300">اللاعب الثاني</span>
              <span className="text-2xl">{player2Avatar}</span>
            </div>
            <input
              type="text"
              value={player2Name}
              onChange={(e) => setPlayer2Name(e.target.value)}
              placeholder="اسم اللاعب 2"
              className="w-full p-2 rounded-xl bg-black/40 border border-white/10 text-xs text-white font-bold"
            />
            {/* Avatar Select */}
            <div className="flex flex-wrap gap-1 pt-1">
              {avatars.slice(4, 8).map((av) => (
                <button
                  key={av}
                  onClick={() => setPlayer2Avatar(av)}
                  className={`p-1 rounded-lg text-sm border ${
                    player2Avatar === av ? 'bg-flame/30 border-flame' : 'border-white/5'
                  }`}
                >
                  {av}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Match Settings */}
        <div className="glass-card p-4 rounded-3xl space-y-3">
          <div>
            <label className="block text-xs font-bold text-ink-300 mb-1.5">عدد الأسئلة:</label>
            <div className="grid grid-cols-3 gap-2">
              {[3, 5, 7].map((num) => (
                <button
                  key={num}
                  onClick={() => setTotalQuestions(num)}
                  className={`py-2 rounded-xl text-xs font-black border transition-all ${
                    totalQuestions === num
                      ? 'bg-gold-400 text-night-900 border-gold-400 shadow-md'
                      : 'bg-night-700 text-ink-400 border-white/5'
                  }`}
                >
                  {num} أسئلة
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-ink-300 mb-1.5">مجال الأسئلة:</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full p-2.5 rounded-xl bg-night-700 border border-white/10 text-xs text-white font-bold"
            >
              <option value="all">مزيج من كافة المجالات</option>
              <option value="history">تاريخ وآثار ليبيا</option>
              <option value="dialects">لهجات وأمثال شعبية</option>
              <option value="sports">كورة ورياضة ليبية</option>
              <option value="food">المطبخ والعادات التراثية</option>
              <option value="geography">جغرافيا ليبيا والعالم</option>
              <option value="islamic">دين وحضارة إسلامية</option>
              <option value="literature">لغة وأدب عربي</option>
              <option value="science">علوم وطبيعة</option>
              <option value="general">ثقافة عامة ومنوعات</option>
            </select>
          </div>
        </div>

        {/* Start Button */}
        <button
          onClick={handleStartDuel}
          className="w-full py-4 rounded-2xl bg-gradient-to-r from-gold-400 to-flame text-night-900 font-black text-sm shadow-gold-glow flex items-center justify-center gap-2 transition-transform active:scale-95"
        >
          <Play className="w-5 h-5 fill-current" />
          <span>ابدأ التحدي الثنائي الحماسي! ⚔️</span>
        </button>
      </div>
    );
  }

  // Device Passing Intermission Screen
  if (isPassingDevice) {
    const nextPlayerName = currentTurn === 1 ? player1Name : player2Name;
    const nextPlayerAvatar = currentTurn === 1 ? player1Avatar : player2Avatar;
    const nextPlayerColor = currentTurn === 1 ? 'border-sea-500 text-sea-300' : 'border-flame text-gold-300';

    return (
      <div className="flex flex-col items-center justify-center p-6 max-w-sm mx-auto text-center min-h-[60vh] select-none">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-full glass-panel p-6 rounded-3xl border-2 space-y-4 shadow-2xl"
        >
          <div className="text-4xl animate-bounce">{nextPlayerAvatar}</div>
          <h3 className="text-xl font-black text-white">حان دورك يا {nextPlayerName}!</h3>
          <p className="text-xs text-ink-400">مرّر الجهاز لخصمك دون النظر للإجابات السابقة</p>

          <button
            onClick={handleReadyAfterPass}
            className="w-full py-3.5 rounded-2xl bg-gold-400 text-night-900 font-black text-sm shadow-lg transition-transform active:scale-95"
          >
            أنا جاهز، ابدأ سؤالي! 🎯
          </button>
        </motion.div>
      </div>
    );
  }

  // Victory Celebration Screen
  if (isMatchFinished) {
    const isTie = player1Score === player2Score;
    const winnerName = player1Score > player2Score ? player1Name : player2Name;
    const winnerAvatar = player1Score > player2Score ? player1Avatar : player2Avatar;

    return (
      <div className="flex flex-col items-center justify-center p-4 max-w-sm mx-auto text-center pt-4 select-none">
        <motion.div
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-full bg-gradient-to-b from-night-800 to-night-900 border border-gold-400/50 rounded-3xl p-6 shadow-2xl space-y-4"
        >
          <div className="w-16 h-16 rounded-full bg-gold-400/20 border-2 border-gold-400 flex items-center justify-center mx-auto text-gold-300 shadow-gold-glow">
            <Trophy className="w-8 h-8" />
          </div>

          <div>
            <h3 className="text-2xl font-black text-white">
              {isTie ? 'تعادل الفرسان! 🤝' : `الفائز: ${winnerName}! 👑`}
            </h3>
            <p className="text-xs text-ink-400 mt-1">انتهت المبارزة الثنائية الشيقة</p>
          </div>

          {/* Score Duel Comparison */}
          <div className="grid grid-cols-2 gap-3 p-3 rounded-2xl bg-black/30 border border-white/5">
            <div className="text-center">
              <span className="text-xl">{player1Avatar}</span>
              <h4 className="text-xs font-bold text-sea-300 mt-0.5">{player1Name}</h4>
              <span className="text-xl font-black text-white">{player1Score}</span>
            </div>
            <div className="text-center">
              <span className="text-xl">{player2Avatar}</span>
              <h4 className="text-xs font-bold text-gold-300 mt-0.5">{player2Name}</h4>
              <span className="text-xl font-black text-white">{player2Score}</span>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <button
              onClick={() => setIsShareModalOpen(true)}
              className="w-full py-3 rounded-2xl bg-sea-500 hover:bg-sea-700 text-night-900 font-black text-xs flex items-center justify-center gap-1.5 shadow-md"
            >
              <Share2 className="w-4 h-4" />
              <span>مشاركة نتيجة التحدي 🏅</span>
            </button>

            <button
              onClick={handleStartDuel}
              className="w-full py-3 rounded-2xl bg-night-700 border border-white/10 text-white font-bold text-xs flex items-center justify-center gap-1.5"
            >
              <RotateCcw className="w-4 h-4" />
              <span>جولة ثأر جديدة ⚔️</span>
            </button>

            <button
              onClick={() => setIsGameStarted(false)}
              className="w-full py-3 rounded-2xl bg-white/5 hover:bg-white/10 text-ink-400 text-xs font-bold"
            >
              العودة لإعدادات التحدي
            </button>
          </div>
        </motion.div>

        <ShareResultModal
          isOpen={isShareModalOpen}
          onClose={() => setIsShareModalOpen(false)}
          title={isTie ? 'مبارزة تعادل مثيرة' : `فوز ${winnerName} بالديربي`}
          subtitle={`${player1Name} (${player1Score}) ضد ${player2Name} (${player2Score})`}
          playerName={winnerName}
          playerAvatar={winnerAvatar}
          playerTitle="فارس التحديات الثنائية"
          // A duel is played for bragging rights only — it pays no dinars, so
          // none are advertised on the card.
          scoreOrStars={{ score: Math.max(player1Score, player2Score) }}
          contextType="duel"
        />
      </div>
    );
  }

  // Active Duel Question Round
  const activePlayerName = currentTurn === 1 ? player1Name : player2Name;
  const activePlayerAvatar = currentTurn === 1 ? player1Avatar : player2Avatar;

  return (
    <div className="flex flex-col gap-4 pb-20 max-w-lg mx-auto w-full px-3 pt-2 select-none">
      {/* Live Duel HUD */}
      <div className="grid grid-cols-3 items-center gap-2">
        {/* Player 1 Box */}
        <div
          className={`p-2 rounded-2xl border transition-all text-center ${
            currentTurn === 1
              ? 'bg-sea-500/20 border-sea-500 ring-2 ring-sea-500/40'
              : 'bg-night-800 border-white/5 opacity-60'
          }`}
        >
          <div className="flex items-center justify-center gap-1 text-xs font-black text-sea-300">
            <span>{player1Avatar}</span>
            <span className="truncate">{player1Name}</span>
          </div>
          <span className="text-sm font-black text-white">{player1Score} نقطة</span>
        </div>

        {/* Middle Timer */}
        <div className="flex flex-col items-center">
          <span className="text-[10px] font-bold text-ink-400">
            سؤال {currentQIndex + 1}/{questions.length}
          </span>
          <div
            className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-black border ${
              timeLeft <= 5 ? 'bg-crimson-500/20 text-crimson-500 border-crimson-500' : 'bg-night-700 text-gold-300 border-gold-400/30'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>{timeLeft}ث</span>
          </div>
        </div>

        {/* Player 2 Box */}
        <div
          className={`p-2 rounded-2xl border transition-all text-center ${
            currentTurn === 2
              ? 'bg-flame/20 border-flame ring-2 ring-flame/40'
              : 'bg-night-800 border-white/5 opacity-60'
          }`}
        >
          <div className="flex items-center justify-center gap-1 text-xs font-black text-gold-300">
            <span>{player2Avatar}</span>
            <span className="truncate">{player2Name}</span>
          </div>
          <span className="text-sm font-black text-white">{player2Score} نقطة</span>
        </div>
      </div>

      {/* Active Turn Banner */}
      <div className="text-center py-1 bg-white/5 rounded-2xl border border-white/5">
        <span className="text-xs font-extrabold text-gold-300">
          🎯 دور: {activePlayerName} {activePlayerAvatar}
        </span>
      </div>

      {/* Question Card */}
      <motion.div
        key={currentQ.id + currentTurn}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-panel p-5 rounded-3xl text-right"
      >
        <div className="flex items-center gap-1.5 text-xs text-gold-400 font-bold mb-2">
          <Sparkles className="w-3.5 h-3.5" />
          <span>سؤال المبارزة الثنائية:</span>
        </div>
        <h2 className="text-lg sm:text-xl font-extrabold text-ink-100 leading-relaxed">
          {currentQ.question}
        </h2>
      </motion.div>

      {/* 4 Shuffled Options */}
      <div className="space-y-2.5">
        {shuffledOptions.map((opt, vIdx) => {
          const isSelected = selectedOption === vIdx;
          const isCorrect = opt.originalIndex === currentQ.correctIndex;

          let btnStyle = 'glass-card-interactive border-white/10 text-ink-100';
          if (isAnswered) {
            if (isCorrect) {
              btnStyle = 'bg-oasis-500/25 border-oasis-500 text-oasis-200 shadow-oasis-glow';
            } else if (isSelected && !isCorrect) {
              btnStyle = 'bg-crimson-500/25 border-crimson-500 text-crimson-200';
            } else {
              btnStyle = 'opacity-40 border-white/5';
            }
          }

          return (
            <motion.button
              key={vIdx}
              whileTap={!isAnswered ? { scale: 0.98 } : {}}
              disabled={isAnswered}
              onClick={() => handleSelectOption(vIdx)}
              className={`w-full p-3.5 rounded-2xl flex items-center justify-between text-right transition-all font-bold ${btnStyle}`}
            >
              <div className="flex items-center gap-2.5">
                <span className="w-6 h-6 rounded-full bg-gold-400/15 text-gold-300 border border-gold-400/30 flex items-center justify-center text-xs font-black shrink-0">
                  {optionLabels[vIdx]}
                </span>
                <span className="text-xs sm:text-sm">{opt.text}</span>
              </div>

              {isAnswered && isCorrect && <CheckCircle className="w-4 h-4 text-oasis-500 shrink-0" />}
              {isAnswered && isSelected && !isCorrect && <XCircle className="w-4 h-4 text-crimson-500 shrink-0" />}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};
