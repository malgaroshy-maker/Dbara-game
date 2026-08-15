import React, { useState } from 'react';
import { badgesList } from '../../data/badges';
import { useGameStore } from '../../store/useGameStore';
import { LeaderboardTab } from './LeaderboardTab';
import { KnowledgeNotebookTab } from './KnowledgeNotebookTab';
import { useMapStore } from '../../store/useMapStore';
import { AVATARS, TITLES, cityUnlockCost } from '../../data/cosmetics';
import { Trophy, ShoppingBag, CheckCircle2, Coins, HelpCircle, PlusCircle, FastForward, Lightbulb, Shield, Lock, MapPin, BookOpen } from 'lucide-react';

export const BadgesScreen: React.FC = () => {
  const {
    profile,
    unlockedBadges,
    buyLifeline,
    ownedAvatars,
    ownedTitles,
    customTitle,
    buyAvatar,
    equipAvatar,
    buyTitle,
    equipTitle,
  } = useGameStore();
  const { cities, purchaseCityUnlock } = useMapStore();
  const [tab, setTab] = useState<'badges' | 'notebook' | 'shop' | 'leaderboard'>('badges');

  /** Cities still shut, cheapest first, so the next step is the obvious one. */
  const lockedCities = cities
    .filter((c) => !c.unlockedByDefault && !c.stages.some((s) => s.isUnlocked))
    .sort((a, b) => a.requiredStarsToUnlock - b.requiredStarsToUnlock);

  const shopItems = [
    {
      id: 'fiftyFifty',
      title: 'حذف إجابتين (50:50)',
      description: 'استبعاد خيارين خاطئين في أسئلة الاختيار من متعدد',
      cost: 60,
      icon: <HelpCircle className="w-6 h-6 text-gold-300" />,
      current: profile.lifelines?.fiftyFifty ?? 0,
    },
    {
      id: 'revealLetter',
      title: 'كشف حرف',
      description: 'كشف حرف في شبكة الكلمات المتقاطعة أو ألغاز الحروف',
      cost: 45,
      icon: <Lightbulb className="w-6 h-6 text-sea-300" />,
      current: profile.lifelines?.revealLetter ?? 0,
    },
    {
      id: 'skip',
      title: 'تخطي السؤال',
      description: 'تجاوز السؤال الصعب واجتياز المرحلة بنجمة واحدة',
      cost: 120,
      icon: <FastForward className="w-6 h-6 text-oasis-500" />,
      current: profile.lifelines?.skip ?? 0,
    },
    {
      id: 'extraTime',
      title: 'وقت إضافي (+15 ثانية)',
      description: 'إضافة 15 ثانية لعداد الوقت في الجولات الصعبة',
      cost: 80,
      icon: <PlusCircle className="w-6 h-6 text-rose" />,
      current: profile.lifelines?.extraTime ?? 0,
    },
  ];

  return (
    <div className="flex flex-col gap-4 pb-28 max-w-lg mx-auto w-full px-3 pt-1">
      {/* Header Tabs */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
            <Trophy className="w-5 h-5 text-gold-400" />
            الأوسمة والرتب
          </h2>
          <p className="text-xs text-ink-400 mt-0.5">
            استعرض إنجازاتك ورتبتك وأرقامك القياسية والمساعدات
          </p>
        </div>

        {/* Dinars Counter */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-night-700 border border-gold-400/40 text-xs font-black text-gold-300">
          <Coins className="w-4 h-4 text-gold-400" />
          <span>{profile.dinars} د.ل</span>
        </div>
      </div>

      {/* Switcher 4 Tabs */}
      <div className="grid grid-cols-4 p-1 rounded-2xl bg-night-800 border border-white/10 text-xs font-bold gap-1">
        <button
          onClick={() => setTab('badges')}
          className={`py-2 rounded-xl transition-all flex items-center justify-center gap-1 text-[10px] sm:text-[11px] font-black ${
            tab === 'badges'
              ? 'bg-gold-400 text-night-900 shadow-md'
              : 'text-ink-400 hover:text-white'
          }`}
        >
          <Trophy className="w-3.5 h-3.5" />
          <span>الأوسمة ({unlockedBadges.length})</span>
        </button>

        <button
          onClick={() => setTab('notebook')}
          className={`py-2 rounded-xl transition-all flex items-center justify-center gap-1 text-[10px] sm:text-[11px] font-black ${
            tab === 'notebook'
              ? 'bg-gold-400 text-night-900 shadow-md'
              : 'text-ink-400 hover:text-white'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>دفتر المعارف</span>
        </button>

        <button
          onClick={() => setTab('leaderboard')}
          className={`py-2 rounded-xl transition-all flex items-center justify-center gap-1 text-[10px] sm:text-[11px] font-black ${
            tab === 'leaderboard'
              ? 'bg-gold-400 text-night-900 shadow-md'
              : 'text-ink-400 hover:text-white'
          }`}
        >
          <Shield className="w-3.5 h-3.5" />
          <span>رتبتي</span>
        </button>

        <button
          onClick={() => setTab('shop')}
          className={`py-2 rounded-xl transition-all flex items-center justify-center gap-1 text-[10px] sm:text-[11px] font-black ${
            tab === 'shop'
              ? 'bg-gold-400 text-night-900 shadow-md'
              : 'text-ink-400 hover:text-white'
          }`}
        >
          <ShoppingBag className="w-3.5 h-3.5" />
          <span>المتجر</span>
        </button>
      </div>

      {/* Notebook Tab Content */}
      {tab === 'notebook' && <KnowledgeNotebookTab />}

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
                    ? 'glass-card border-gold-400/30'
                    : 'bg-night-900/50 border-white/5 opacity-50'
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <div
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shrink-0 ${
                      isUnlocked
                        ? 'bg-gold-400/20 border border-gold-400/40 shadow-gold-glow-sm'
                        : 'bg-white/5 border border-white/10 grayscale'
                    }`}
                  >
                    {badge.icon}
                  </div>

                  <div>
                    <h4 className="text-sm font-extrabold text-white flex items-center gap-1.5">
                      {badge.title}
                      {isUnlocked && <CheckCircle2 className="w-3.5 h-3.5 text-oasis-500" />}
                    </h4>
                    <p className="text-xs text-ink-400 mt-0.5">{badge.description}</p>
                    <span className="text-[10px] text-ink-300 mt-1 inline-block bg-white/5 px-2 py-0.5 rounded-full">
                      الشرط: {badge.requirementText}
                    </span>
                  </div>
                </div>

                <div className="text-left shrink-0">
                  <span className="text-xs font-black text-gold-300">+{badge.rewardDinars} د.ل</span>
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
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-night-700 text-ink-400 font-bold">
                      لديك: {item.current}
                    </span>
                  </div>
                  <p className="text-xs text-ink-400 mt-0.5">{item.description}</p>
                </div>
              </div>

              <button
                onClick={() => buyLifeline(item.id as keyof typeof profile.lifelines, item.cost)}
                disabled={profile.dinars < item.cost}
                className="flex items-center gap-1 px-3.5 py-2 rounded-2xl bg-gradient-to-r from-gold-400 to-flame text-night-900 font-black text-xs shadow-md transition-transform active:scale-95 disabled:opacity-40"
              >
                <span>شراء</span>
                <span>({item.cost} د.ل)</span>
              </button>
            </div>
          ))}

          {/* Avatars: pure decoration, so they can cost what they like without
              touching the difficulty of anything. */}
          <h3 className="text-sm font-extrabold text-white pt-3 flex items-center gap-1.5">
            <ShoppingBag className="w-4 h-4 text-gold-400" />
            رموز اللاعب
          </h3>
          <div className="grid grid-cols-4 gap-2">
            {AVATARS.map((item) => {
              const owned = ownedAvatars.includes(item.value);
              const worn = profile.avatar === item.value;
              return (
                <button
                  key={item.id}
                  onClick={() => (owned ? equipAvatar(item.value) : buyAvatar(item.value, item.cost))}
                  disabled={!owned && profile.dinars < item.cost}
                  title={item.label}
                  className={`p-2 rounded-2xl border flex flex-col items-center gap-1 transition-all active:scale-95 disabled:opacity-35 ${
                    worn
                      ? 'bg-gold-400/20 border-gold-400 shadow-gold-glow-sm'
                      : 'bg-night-800 border-white/10 hover:border-gold-400/50'
                  }`}
                >
                  <span className="text-2xl">{item.value}</span>
                  <span className="text-[9px] font-bold text-ink-400 truncate w-full">
                    {worn ? 'مُرتدى' : owned ? 'ارتدِ' : `${item.cost} د.ل`}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Titles override the earned rank, so the player can always go back. */}
          <h3 className="text-sm font-extrabold text-white pt-3 flex items-center gap-1.5">
            <Shield className="w-4 h-4 text-sea-300" />
            الألقاب
          </h3>
          <div className="space-y-2">
            {customTitle && (
              <button
                onClick={() => equipTitle(null)}
                className="w-full py-2 rounded-xl bg-night-800 border border-white/10 text-[11px] font-bold text-ink-400 hover:text-white"
              >
                العودة إلى لقب رتبتك المكتسبة
              </button>
            )}
            {TITLES.map((item) => {
              const owned = ownedTitles.includes(item.value);
              const worn = customTitle === item.value;
              return (
                <div
                  key={item.id}
                  className="glass-card-interactive p-3 rounded-2xl flex items-center justify-between gap-3"
                >
                  <span className="text-sm font-extrabold text-white">{item.label}</span>
                  <button
                    onClick={() => (owned ? equipTitle(item.value) : buyTitle(item.value, item.cost))}
                    disabled={worn || (!owned && profile.dinars < item.cost)}
                    className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-sea-500 to-sea-300 text-night-900 font-black text-[11px] disabled:opacity-40 active:scale-95 transition-transform"
                  >
                    {worn ? 'مُرتدى' : owned ? 'ارتدِ' : `${item.cost} د.ل`}
                  </button>
                </div>
              );
            })}
          </div>

          {/* Buying a city opens its first stage only, exactly as the stars would. */}
          {lockedCities.length > 0 && (
            <>
              <h3 className="text-sm font-extrabold text-white pt-3 flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-oasis-500" />
                افتح مدينة قبل أوانها
              </h3>
              <div className="space-y-2">
                {lockedCities.slice(0, 4).map((city) => {
                  const cost = cityUnlockCost(city.requiredStarsToUnlock);
                  return (
                    <div
                      key={city.id}
                      className="glass-card-interactive p-3 rounded-2xl flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="text-xl shrink-0">{city.icon}</span>
                        <div className="min-w-0">
                          <h4 className="text-sm font-extrabold text-white truncate">
                            {city.arabicName}
                          </h4>
                          <p className="text-[10px] text-ink-400 flex items-center gap-1">
                            <Lock className="w-2.5 h-2.5" />
                            تحتاج {city.requiredStarsToUnlock} نجمة
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          if (profile.dinars < cost) return;
                          if (purchaseCityUnlock(city.id)) useGameStore.getState().spendDinars(cost);
                        }}
                        disabled={profile.dinars < cost}
                        className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-oasis-500 to-oasis-600 text-white font-black text-[11px] shrink-0 disabled:opacity-40 active:scale-95 transition-transform"
                      >
                        {cost} د.ل
                      </button>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};
