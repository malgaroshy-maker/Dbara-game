import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useGameStore } from '../../store/useGameStore';
import { useMapStore } from '../../store/useMapStore';
import { Trophy, Star, Shield, Clock, Flame, Sparkles, MapPin, Award } from 'lucide-react';

export const LeaderboardTab: React.FC = () => {
  const { profile, stats } = useGameStore();
  const { getTotalStars } = useMapStore();
  const [selectedDivision, setSelectedDivision] = useState<'all' | 'diamond' | 'gold'>('all');

  const userStars = getTotalStars();
  const userScore = userStars * 35 + stats.correctAnswers * 15 + profile.streakDays * 20;

  // Mock Top Libyan Explorers
  const leaderboardData = [
    {
      rank: 1,
      name: 'سراج الطرابلسي',
      avatar: '🏛️',
      city: 'طرابلس',
      title: 'جهبذ التراث الأكبر',
      stars: 36,
      score: 1480,
      streak: 14,
      isUser: false,
    },
    {
      rank: 2,
      name: 'مرام الفيتوري',
      avatar: '🦅',
      city: 'بنغازي',
      title: 'صقر برقة',
      stars: 35,
      score: 1390,
      streak: 11,
      isUser: false,
    },
    {
      rank: 3,
      name: 'إبراهيم الأكوري',
      avatar: '🌲',
      city: 'شحات',
      title: 'حارس قورينا',
      stars: 34,
      score: 1310,
      streak: 9,
      isUser: false,
    },
    {
      rank: 4,
      name: 'طارق الزنتاني',
      avatar: '⚔️',
      city: 'جبل نفوسة',
      title: 'فارس الجبل',
      stars: 32,
      score: 1220,
      streak: 8,
      isUser: false,
    },
    {
      rank: 5,
      name: 'خديجة الغدامسية',
      avatar: '🌴',
      city: 'غدامس',
      title: 'لؤلؤة الصحراء',
      stars: 30,
      score: 1150,
      streak: 7,
      isUser: false,
    },
    {
      rank: 6,
      name: 'الصادق الفزاني',
      avatar: '🏰',
      city: 'سبها',
      title: 'سليل الجرمنت',
      stars: 28,
      score: 1040,
      streak: 6,
      isUser: false,
    },
    {
      rank: 7,
      name: 'نور الهدى الكفراوية',
      avatar: '✨',
      city: 'الكفرة',
      title: 'دليل الواحات',
      stars: 26,
      score: 960,
      streak: 5,
      isUser: false,
    },
  ];

  // Insert user based on their score
  const userEntry = {
    rank: 0,
    name: profile.name,
    avatar: profile.avatar,
    city: 'مستكشف ليبيا',
    title: profile.title,
    stars: userStars,
    score: userScore,
    streak: profile.streakDays,
    isUser: true,
  };

  const combinedList = [...leaderboardData, userEntry].sort((a, b) => b.score - a.score);
  const rankedList = combinedList.map((item, index) => ({ ...item, rank: index + 1 }));
  const currentUserRank = rankedList.find((item) => item.isUser)?.rank || 8;

  return (
    <div className="space-y-3.5 select-none">
      {/* Weekly Season Countdown Card */}
      <div className="glass-panel p-4 rounded-3xl border border-[#E5A93B]/40 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-24 h-24 bg-gradient-to-br from-[#E5A93B]/20 to-transparent pointer-events-none rounded-tl-3xl" />

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-[#E5A93B]" />
            <div>
              <h3 className="text-sm font-black text-white">الموسم الأول: فرسان الميدان ⚔️</h3>
              <p className="text-[11px] text-[#94A3B8]">يتجدد الترتيب وتوزع الجوائز كل يوم أحد</p>
            </div>
          </div>

          <div className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-[#1E293B] border border-[#E5A93B]/30 text-[11px] font-bold text-[#FCD34D]">
            <Clock className="w-3.5 h-3.5" />
            <span>باقي 3 أيام</span>
          </div>
        </div>

        {/* User Rank Snapshot Card */}
        <div className="mt-3 p-3 rounded-2xl bg-gradient-to-r from-[#E5A93B]/15 via-[#0EA5E9]/10 to-transparent border border-[#E5A93B]/30 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-xl bg-[#E5A93B] text-[#0B0F19] font-black text-sm flex items-center justify-center shadow-md">
              #{currentUserRank}
            </span>
            <div>
              <h4 className="text-xs font-black text-white flex items-center gap-1">
                <span>{profile.name}</span>
                <span className="text-[10px] text-[#FCD34D] font-normal">({profile.title})</span>
              </h4>
              <span className="text-[10px] text-[#94A3B8]">
                مجموع نقاطك التنافسية: <strong className="text-[#38BDF8]">{userScore}</strong>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1 text-xs font-black text-[#FCD34D]">
            <Star className="w-3.5 h-3.5 fill-current" />
            <span>{userStars} نجوم</span>
          </div>
        </div>
      </div>

      {/* Leaderboard Table List */}
      <div className="space-y-2">
        {rankedList.map((item) => {
          let rankBadge = `${item.rank}`;
          let rankStyle = 'bg-white/10 text-white';

          if (item.rank === 1) {
            rankBadge = '🥇';
            rankStyle = 'bg-[#E5A93B]/30 text-[#FCD34D] border-[#E5A93B]/50 shadow-[0_0_10px_#E5A93B]';
          } else if (item.rank === 2) {
            rankBadge = '🥈';
            rankStyle = 'bg-[#94A3B8]/30 text-white border-[#94A3B8]/50';
          } else if (item.rank === 3) {
            rankBadge = '🥉';
            rankStyle = 'bg-[#D97706]/30 text-[#FCD34D] border-[#D97706]/50';
          }

          return (
            <motion.div
              key={item.rank + item.name}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-3.5 rounded-2xl flex items-center justify-between gap-3 border transition-all ${
                item.isUser
                  ? 'glass-panel border-2 border-[#E5A93B] shadow-[0_0_20px_rgba(229,169,59,0.25)] bg-[#E5A93B]/10'
                  : 'glass-card border-white/5'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <span
                  className={`w-7 h-7 rounded-xl flex items-center justify-center font-black text-xs shrink-0 border ${rankStyle}`}
                >
                  {rankBadge}
                </span>

                <span className="text-2xl shrink-0">{item.avatar}</span>

                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <h4 className="text-xs font-black text-white truncate">{item.name}</h4>
                    {item.isUser && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-[#E5A93B] text-[#0B0F19] font-black">
                        أنت
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-[#94A3B8] mt-0.5">
                    <span className="flex items-center gap-0.5 text-[#38BDF8]">
                      <MapPin className="w-2.5 h-2.5" />
                      {item.city}
                    </span>
                    <span>•</span>
                    <span className="text-[#FCD34D]">{item.title}</span>
                  </div>
                </div>
              </div>

              <div className="text-left shrink-0">
                <span className="block text-xs font-black text-[#FCD34D]">{item.score} ن</span>
                <span className="text-[10px] text-[#94A3B8] flex items-center justify-end gap-0.5">
                  <Star className="w-2.5 h-2.5 text-[#E5A93B] fill-current" />
                  {item.stars}
                </span>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};
