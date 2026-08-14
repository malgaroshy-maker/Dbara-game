import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { CityNode, Stage } from '../../types/map';
import { Star, Lock, Play, X, BookOpen, Compass, CheckCircle2 } from 'lucide-react';
import { useMapStore } from '../../store/useMapStore';

interface CityDetailModalProps {
  city: CityNode | null;
  onClose: () => void;
  onStartStage: (cityId: string, stage: Stage) => void;
}

export const CityDetailModal: React.FC<CityDetailModalProps> = ({ city, onClose, onStartStage }) => {
  const { getTotalStars } = useMapStore();
  if (!city) return null;

  const totalStars = getTotalStars();
  const isCityUnlocked = city.unlockedByDefault || city.stages.some((s) => s.isUnlocked);
  const starsNeeded = Math.max(0, city.requiredStarsToUnlock - totalStars);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/70 backdrop-blur-sm">
        {/* Backdrop Tap */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0"
        />

        {/* Modal Card */}
        <motion.div
          initial={{ y: '100%', opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: '100%', opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 280 }}
          className="relative w-full max-w-lg bg-gradient-to-b from-night-800 to-night-900 border-t sm:border border-gold-400/30 rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl z-10 max-h-[85vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="flex items-start justify-between gap-3 pb-3 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gold-400/15 border border-gold-400/40 flex items-center justify-center text-2xl shadow-gold-glow-sm">
                {city.icon}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-extrabold text-ink-100">{city.arabicName}</h3>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-sea-500/20 text-sea-300 border border-sea-500/30">
                    {city.titleBadge}
                  </span>
                </div>
                <p className="text-xs text-ink-400 mt-0.5">{city.description}</p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-ink-400 hover:text-ink-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Historical Lore Accordion */}
          <div className="my-3.5 p-3 rounded-2xl bg-night-850/80 border border-gold-400/15 flex items-start gap-2.5">
            <BookOpen className="w-4 h-4 text-gold-400 shrink-0 mt-0.5" />
            <p className="text-xs text-ink-300 leading-relaxed">
              <strong className="text-gold-300">إضاءة تاريخية: </strong>
              {city.historicalLore}
            </p>
          </div>

          {/* Locked Notice if City is Locked */}
          {!isCityUnlocked && (
            <div className="p-4 rounded-2xl bg-crimson-500/10 border border-crimson-500/30 text-center my-3">
              <Lock className="w-6 h-6 text-crimson-500 mx-auto mb-1.5" />
              <h4 className="text-sm font-bold text-ink-100">هذه المدينة مقفلة حالياً</h4>
              <p className="text-xs text-crimson-200 mt-1">
                تحتاج إلى جمع <span className="font-extrabold text-white">{starsNeeded}</span> نجمة إضافية من المدن السابقة لفتح هذه المحطة!
              </p>
            </div>
          )}

          {/* Stages List */}
          <div className="space-y-2.5 my-3">
            <h4 className="text-xs font-bold text-ink-400 flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5 text-gold-400" />
              مراحل الاستكشاف والتحدي ({city.stages.length} مراحل):
            </h4>

            {city.stages.map((stage) => {
              const isStagePlayable = isCityUnlocked && stage.isUnlocked;

              return (
                <div
                  key={stage.id}
                  className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                    isStagePlayable
                      ? 'bg-night-700/80 border-gold-400/25 hover:border-gold-400 hover:bg-night-700'
                      : 'bg-night-900/60 border-white/5 opacity-60'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-8 h-8 rounded-xl font-bold flex items-center justify-center text-xs ${
                        isStagePlayable
                          ? 'bg-gold-400 text-night-900'
                          : 'bg-white/10 text-ink-500'
                      }`}
                    >
                      {stage.stageNumber}
                    </div>

                    <div>
                      <h5 className="text-sm font-bold text-ink-100 flex items-center gap-1.5">
                        {stage.title}
                        {stage.starsEarned === 3 && (
                          <CheckCircle2 className="w-3.5 h-3.5 text-oasis-500" />
                        )}
                      </h5>

                      {/* Stage Type & Reward Badge */}
                      <div className="flex items-center gap-2 mt-0.5 text-[11px] text-ink-400">
                        <span className="text-sea-300">
                          {stage.type === 'multiple_choice' && 'سؤال ثقافي'}
                          {stage.type === 'letter_scramble' && 'ترتيب حروف'}
                          {stage.type === 'crossword' && 'كلمات متقاطعة'}
                          {stage.type === 'speed_blitz' && 'سباق سرعة'}
                        </span>
                        <span>•</span>
                        <span className="text-gold-300 font-medium">+{stage.rewardDinars} د.ل</span>
                      </div>
                    </div>
                  </div>

                  {/* Stars & Play CTA */}
                  <div className="flex items-center gap-2">
                    {/* 3 Stars Visual */}
                    <div className="flex items-center gap-0.5">
                      {[1, 2, 3].map((starNum) => (
                        <Star
                          key={starNum}
                          className={`w-3.5 h-3.5 ${
                            (stage.starsEarned || 0) >= starNum
                              ? 'text-gold-400 fill-gold-400'
                              : 'text-white/20'
                          }`}
                        />
                      ))}
                    </div>

                    {isStagePlayable ? (
                      <button
                        onClick={() => onStartStage(city.id, stage)}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-gradient-to-r from-gold-400 to-flame hover:from-gold-300 hover:to-gold-400 text-night-900 font-extrabold text-xs shadow-md transition-transform active:scale-95"
                      >
                        <Play className="w-3 h-3 fill-current" />
                        <span>العب</span>
                      </button>
                    ) : (
                      <div className="p-1.5 rounded-lg bg-white/5 text-ink-500">
                        <Lock className="w-3.5 h-3.5" />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
