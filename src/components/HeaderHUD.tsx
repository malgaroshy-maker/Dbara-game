import React from 'react';
import { useGameStore } from '../store/useGameStore';
import { useMapStore } from '../store/useMapStore';
import { Volume2, VolumeX, Settings, Star, Coins, Flame, Download, WifiOff } from 'lucide-react';

interface HeaderHUDProps {
  onOpenSettings: () => void;
  onOpenMenu: () => void;
  onOpenInstall?: () => void;
  isInstalled?: boolean;
  isOnline?: boolean;
}

export const HeaderHUD: React.FC<HeaderHUDProps> = ({ 
  onOpenSettings, 
  onOpenMenu,
  onOpenInstall,
  isInstalled = false,
  isOnline = true,
}) => {
  const { profile, audio, toggleSound } = useGameStore();
  const { getTotalStars } = useMapStore();

  const totalStars = getTotalStars();

  return (
    <header className="sticky top-0 z-40 w-full max-w-lg mx-auto px-3 pt-3 pb-2 bg-night-900/90 backdrop-blur-md border-b border-white/5">
      <div className="flex items-center justify-between gap-2">
        {/* User Info & Avatar — the avatar doubles as the way back to the menu.
            `min-w-0` matters: without it this block refuses to shrink and the
            header overflowed the viewport on a 360px phone. */}
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <button
            type="button"
            onClick={onOpenMenu}
            aria-label="القائمة الرئيسية"
            title="القائمة الرئيسية"
            className="w-10 h-10 rounded-2xl bg-gradient-to-br from-gold-400/20 to-sea-500/20 border border-gold-400/40 flex items-center justify-center text-lg shadow-sm hover:border-gold-400 transition-colors"
          >
            {profile.avatar}
          </button>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 min-w-0">
              <h1 className="text-sm font-black text-white truncate">{profile.name}</h1>
              {/* The rank is always on the الرتب tab, so on the narrowest phones
                  it yields rather than pushing the HUD off-screen. */}
              <span className="hidden min-[400px]:inline text-[10px] px-1.5 py-0.5 rounded-full bg-gold-400/15 text-gold-300 font-bold border border-gold-400/30 whitespace-nowrap">
                {profile.title}
              </span>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-ink-400 font-bold">
              <span className="flex items-center gap-0.5 text-flame">
                <Flame className="w-3 h-3 text-flame" />
                {profile.streakDays} أيام
              </span>
              {!isOnline && (
                <span className="flex items-center gap-1 px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[9px] font-bold">
                  <WifiOff className="w-2.5 h-2.5" />
                  أوفلاين
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Currency & Stars HUD Badges */}
        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
          {/* Stars and dinars read as bare numbers otherwise — the icon carries
              the meaning visually, and a screen reader cannot see the icon. */}
          <div
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-2xl bg-night-800 border border-gold-400/30 text-xs font-black text-gold-300 shadow-sm"
            role="status"
            aria-label={`${totalStars} نجمة`}
          >
            <Star className="w-3.5 h-3.5 text-gold-400 fill-gold-400" />
            <span aria-hidden="true">{totalStars}</span>
          </div>

          <div
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-2xl bg-night-800 border border-gold-400/30 text-xs font-black text-gold-300 shadow-sm"
            role="status"
            aria-label={`${profile.dinars} ديناراً`}
          >
            <Coins className="w-3.5 h-3.5 text-gold-400" />
            <span aria-hidden="true">{profile.dinars}</span>
          </div>

          {/* Quick PWA Install Button (if in browser) */}
          {!isInstalled && onOpenInstall && (
            <button
              onClick={onOpenInstall}
              title="تثبيت اللعبة على هاتفك للعب دون إنترنت"
              className="p-2 rounded-2xl bg-gradient-to-r from-gold-400/20 to-amber-500/20 hover:from-gold-400 hover:to-amber-500 text-gold-300 hover:text-night-900 border border-gold-400/40 transition-all active:scale-95 flex items-center gap-1 shadow-sm"
            >
              <Download className="w-4 h-4" />
            </button>
          )}

          {/* Sound Toggle — the label states what the button does next, not what
              the icon currently shows, so a screen reader announces the action. */}
          <button
            onClick={toggleSound}
            aria-label={audio.soundEnabled ? 'إسكات الأصوات' : 'تشغيل الأصوات'}
            aria-pressed={!audio.soundEnabled}
            className="p-2 rounded-2xl bg-night-800 hover:bg-night-700 border border-white/10 text-ink-400 hover:text-white transition-colors"
          >
            {audio.soundEnabled ? (
              <Volume2 className="w-4 h-4 text-sea-300" />
            ) : (
              <VolumeX className="w-4 h-4 text-ink-500" />
            )}
          </button>

          {/* Settings Trigger */}
          <button
            onClick={onOpenSettings}
            aria-label="الإعدادات"
            className="p-2 rounded-2xl bg-night-800 hover:bg-night-700 border border-white/10 text-ink-400 hover:text-white transition-colors"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
