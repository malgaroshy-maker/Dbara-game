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
          className="relative w-full max-w-lg bg-gradient-to-b from-[#131C2E] to-[#0B0F19] border-t sm:border border-[#E5A93B]/30 rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl z-10 max-h-[85vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="flex items-start justify-between gap-3 pb-3 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-[#E5A93B]/15 border border-[#E5A93B]/40 flex items-center justify-center text-2xl shadow-[0_0_15px_rgba(229,169,59,0.2)]">
                {city.icon}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-extrabold text-[#F8FAFC]">{city.arabicName}</h3>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[#0EA5E9]/20 text-[#38BDF8] border border-[#0EA5E9]/30">
                    {city.titleBadge}
                  </span>
                </div>
                <p className="text-xs text-[#94A3B8] mt-0.5">{city.description}</p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-[#94A3B8] hover:text-[#F8FAFC] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Historical Lore Accordion */}
          <div className="my-3.5 p-3 rounded-2xl bg-[#0F172A]/80 border border-[#E5A93B]/15 flex items-start gap-2.5">
            <BookOpen className="w-4 h-4 text-[#E5A93B] shrink-0 mt-0.5" />
            <p className="text-xs text-[#CBD5E1] leading-relaxed">
              <strong className="text-[#FCD34D]">إضاءة تاريخية: </strong>
              {city.historicalLore}
            </p>
          </div>

          {/* Locked Notice if City is Locked */}
          {!isCityUnlocked && (
            <div className="p-4 rounded-2xl bg-[#F43F5E]/10 border border-[#F43F5E]/30 text-center my-3">
              <Lock className="w-6 h-6 text-[#F43F5E] mx-auto mb-1.5" />
              <h4 className="text-sm font-bold text-[#F8FAFC]">هذه المدينة مقفلة حالياً</h4>
              <p className="text-xs text-[#FDA4AF] mt-1">
                تحتاج إلى جمع <span className="font-extrabold text-white">{starsNeeded}</span> نجمة إضافية من المدن السابقة لفتح هذه المحطة!
              </p>
            </div>
          )}

          {/* Stages List */}
          <div className="space-y-2.5 my-3">
            <h4 className="text-xs font-bold text-[#94A3B8] flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5 text-[#E5A93B]" />
              مراحل الاستكشاف والتحدي ({city.stages.length} مراحل):
            </h4>

            {city.stages.map((stage) => {
              const isStagePlayable = isCityUnlocked && stage.isUnlocked;

              return (
                <div
                  key={stage.id}
                  className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                    isStagePlayable
                      ? 'bg-[#1E293B]/80 border-[#E5A93B]/25 hover:border-[#E5A93B] hover:bg-[#1E293B]'
                      : 'bg-[#0B0F19]/60 border-white/5 opacity-60'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-8 h-8 rounded-xl font-bold flex items-center justify-center text-xs ${
                        isStagePlayable
                          ? 'bg-[#E5A93B] text-[#0B0F19]'
                          : 'bg-white/10 text-[#64748B]'
                      }`}
                    >
                      {stage.stageNumber}
                    </div>

                    <div>
                      <h5 className="text-sm font-bold text-[#F8FAFC] flex items-center gap-1.5">
                        {stage.title}
                        {stage.starsEarned === 3 && (
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981]" />
                        )}
                      </h5>

                      {/* Stage Type & Reward Badge */}
                      <div className="flex items-center gap-2 mt-0.5 text-[11px] text-[#94A3B8]">
                        <span className="text-[#38BDF8]">
                          {stage.type === 'multiple_choice' && 'سؤال ثقافي'}
                          {stage.type === 'letter_scramble' && 'ترتيب حروف'}
                          {stage.type === 'crossword' && 'كلمات متقاطعة'}
                          {stage.type === 'speed_blitz' && 'سباق سرعة'}
                        </span>
                        <span>•</span>
                        <span className="text-[#FCD34D] font-medium">+{stage.rewardDinars} د.ل</span>
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
                              ? 'text-[#E5A93B] fill-[#E5A93B]'
                              : 'text-white/20'
                          }`}
                        />
                      ))}
                    </div>

                    {isStagePlayable ? (
                      <button
                        onClick={() => onStartStage(city.id, stage)}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#E5A93B] to-[#F59E0B] hover:from-[#FCD34D] hover:to-[#E5A93B] text-[#0B0F19] font-extrabold text-xs shadow-md transition-transform active:scale-95"
                      >
                        <Play className="w-3 h-3 fill-current" />
                        <span>العب</span>
                      </button>
                    ) : (
                      <div className="p-1.5 rounded-lg bg-white/5 text-[#64748B]">
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
