import React, { useState } from 'react';
import { badgesList } from '../../data/badges';
import { useGameStore } from '../../store/useGameStore';
import { LeaderboardTab } from './LeaderboardTab';
import { Trophy, ShoppingBag, CheckCircle2, Coins, HelpCircle, PlusCircle, FastForward, Lightbulb, Shield } from 'lucide-react';

export const BadgesScreen: React.FC = () => {
  const { profile, unlockedBadges, buyLifeline } = useGameStore();
  const [tab, setTab] = useState<'badges' | 'shop' | 'leaderboard'>('badges');

  const shopItems = [
    {
      id: 'fiftyFifty',
      title: 'حذف إجابتين (50:50)',
      description: 'استبعاد خيارين خاطئين في أسئلة الاختيار من متعدد',
      cost: 20,
      icon: <HelpCircle className="w-6 h-6 text-[#FCD34D]" />,
      current: profile.lifelines.fiftyFifty,
    },
    {
      id: 'revealLetter',
      title: 'كشف حرف',
      description: 'كشف حرف في شبكة الكلمات المتقاطعة أو ألغاز الحروف',
      cost: 15,
      icon: <Lightbulb className="w-6 h-6 text-[#38BDF8]" />,
      current: profile.lifelines.revealLetter,
    },
    {
      id: 'skip',
      title: 'تخطي السؤال',
      description: 'تجاوز السؤال الصعب واجتياز المرحلة بنجمة واحدة',
      cost: 40,
      icon: <FastForward className="w-6 h-6 text-[#10B981]" />,
      current: profile.lifelines.skip,
    },
    {
      id: 'extraTime',
      title: 'وقت إضافي (+15 ثانية)',
      description: 'إضافة 15 ثانية لعداد الوقت في الجولات الصعبة',
      cost: 25,
      icon: <PlusCircle className="w-6 h-6 text-[#EC4899]" />,
      current: profile.lifelines.extraTime,
    },
  ];

  return (
    <div className="flex flex-col gap-4 pb-20 max-w-lg mx-auto w-full px-3 pt-1">
      {/* Header Tabs */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
            <Trophy className="w-5 h-5 text-[#E5A93B]" />
            الأوسمة ولوحة الشرف
          </h2>
          <p className="text-xs text-[#94A3B8] mt-0.5">
            استعرض إنجازاتك، تصنيفك الأسبوعي، والمساعدات
          </p>
        </div>

        {/* Dinars Counter */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-[#1E293B] border border-[#E5A93B]/40 text-xs font-black text-[#FCD34D]">
          <Coins className="w-4 h-4 text-[#E5A93B]" />
          <span>{profile.dinars} د.ل</span>
        </div>
      </div>

      {/* Switcher 3 Tabs */}
      <div className="grid grid-cols-3 p-1 rounded-2xl bg-[#131C2E] border border-white/10 text-xs font-bold gap-1">
        <button
          onClick={() => setTab('badges')}
          className={`py-2 rounded-xl transition-all flex items-center justify-center gap-1 text-[11px] font-black ${
            tab === 'badges'
              ? 'bg-[#E5A93B] text-[#0B0F19] shadow-md'
              : 'text-[#94A3B8] hover:text-white'
          }`}
        >
          <Trophy className="w-3.5 h-3.5" />
          <span>الأوسمة ({unlockedBadges.length})</span>
        </button>

        <button
          onClick={() => setTab('leaderboard')}
          className={`py-2 rounded-xl transition-all flex items-center justify-center gap-1 text-[11px] font-black ${
            tab === 'leaderboard'
              ? 'bg-[#E5A93B] text-[#0B0F19] shadow-md'
              : 'text-[#94A3B8] hover:text-white'
          }`}
        >
          <Shield className="w-3.5 h-3.5" />
          <span>لوحة الشرف</span>
        </button>

        <button
          onClick={() => setTab('shop')}
          className={`py-2 rounded-xl transition-all flex items-center justify-center gap-1 text-[11px] font-black ${
            tab === 'shop'
              ? 'bg-[#E5A93B] text-[#0B0F19] shadow-md'
              : 'text-[#94A3B8] hover:text-white'
          }`}
        >
          <ShoppingBag className="w-3.5 h-3.5" />
          <span>المتجر</span>
        </button>
      </div>

      {/* Leaderboard Tab Content */}
      {tab === 'leaderboard' && <LeaderboardTab />}

      {/* Badges Tab Content */}
      {tab === 'badges' && (
        <div className="space-y-3">
          {badgesList.map((badge) => {
            const isUnlocked = unlockedBadges.includes(badge.id);

            return (
              <div
                key={badge.id}
                className={`p-4 rounded-3xl border transition-all flex items-center justify-between gap-3 ${
                  isUnlocked
                    ? 'glass-card border-[#E5A93B]/30'
                    : 'bg-[#0B0F19]/50 border-white/5 opacity-50'
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <div
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shrink-0 ${
                      isUnlocked
                        ? 'bg-[#E5A93B]/20 border border-[#E5A93B]/40 shadow-[0_0_15px_rgba(229,169,59,0.2)]'
                        : 'bg-white/5 border border-white/10 grayscale'
                    }`}
                  >
                    {badge.icon}
                  </div>

                  <div>
                    <h4 className="text-sm font-extrabold text-white flex items-center gap-1.5">
                      {badge.title}
                      {isUnlocked && <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981]" />}
                    </h4>
                    <p className="text-xs text-[#94A3B8] mt-0.5">{badge.description}</p>
                    <span className="text-[10px] text-[#CBD5E1] mt-1 inline-block bg-white/5 px-2 py-0.5 rounded-full">
                      الشرط: {badge.requirementText}
                    </span>
                  </div>
                </div>

                <div className="text-left shrink-0">
                  <span className="text-xs font-black text-[#FCD34D]">+{badge.rewardDinars} د.ل</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Shop Tab Content */}
      {tab === 'shop' && (
        <div className="space-y-3">
          {shopItems.map((item) => (
            <div
              key={item.id}
              className="glass-card-interactive p-4 rounded-3xl flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                  {item.icon}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-extrabold text-white">{item.title}</h4>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#1E293B] text-[#94A3B8] font-bold">
                      لديك: {item.current}
                    </span>
                  </div>
                  <p className="text-xs text-[#94A3B8] mt-0.5">{item.description}</p>
                </div>
              </div>

              <button
                onClick={() => buyLifeline(item.id as keyof typeof profile.lifelines, item.cost)}
                disabled={profile.dinars < item.cost}
                className="flex items-center gap-1 px-3.5 py-2 rounded-2xl bg-gradient-to-r from-[#E5A93B] to-[#F59E0B] text-[#0B0F19] font-black text-xs shadow-md transition-transform active:scale-95 disabled:opacity-40"
              >
                <span>شراء</span>
                <span>({item.cost} د.ل)</span>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
