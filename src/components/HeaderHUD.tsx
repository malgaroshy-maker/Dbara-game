import React from 'react';
import { useGameStore } from '../store/useGameStore';
import { useMapStore } from '../store/useMapStore';
import { Volume2, VolumeX, Settings, Star, Coins, Flame } from 'lucide-react';

interface HeaderHUDProps {
  onOpenSettings: () => void;
  onOpenMenu: () => void;
}

export const HeaderHUD: React.FC<HeaderHUDProps> = ({ onOpenSettings, onOpenMenu }) => {
  const { profile, audio, toggleSound } = useGameStore();
  const { getTotalStars } = useMapStore();

  const totalStars = getTotalStars();

  return (
    <header className="sticky top-0 z-40 w-full max-w-lg mx-auto px-3 pt-3 pb-2 bg-[#0B0F19]/90 backdrop-blur-md border-b border-white/5">
      <div className="flex items-center justify-between gap-2">
        {/* User Info & Avatar — the avatar doubles as the way back to the menu */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onOpenMenu}
            aria-label="القائمة الرئيسية"
            title="القائمة الرئيسية"
            className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#E5A93B]/20 to-[#0EA5E9]/20 border border-[#E5A93B]/40 flex items-center justify-center text-lg shadow-sm hover:border-[#E5A93B] transition-colors"
          >
            {profile.avatar}
          </button>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="text-sm font-black text-white">{profile.name}</h1>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[#E5A93B]/15 text-[#FCD34D] font-bold border border-[#E5A93B]/30">
                {profile.title}
              </span>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-[#94A3B8] font-bold">
              <span className="flex items-center gap-0.5 text-[#F59E0B]">
                <Flame className="w-3 h-3 text-[#F59E0B]" />
                {profile.streakDays} أيام
              </span>
            </div>
          </div>
        </div>

        {/* Currency & Stars HUD Badges */}
        <div className="flex items-center gap-1.5">
          {/* Stars */}
          <div className="flex items-center gap-1 px-2.5 py-1.5 rounded-2xl bg-[#131C2E] border border-[#E5A93B]/30 text-xs font-black text-[#FCD34D] shadow-sm">
            <Star className="w-3.5 h-3.5 text-[#E5A93B] fill-[#E5A93B]" />
            <span>{totalStars}</span>
          </div>

          {/* Dinars */}
          <div className="flex items-center gap-1 px-2.5 py-1.5 rounded-2xl bg-[#131C2E] border border-[#E5A93B]/30 text-xs font-black text-[#FCD34D] shadow-sm">
            <Coins className="w-3.5 h-3.5 text-[#E5A93B]" />
            <span>{profile.dinars}</span>
          </div>

          {/* Sound Toggle */}
          <button
            onClick={toggleSound}
            className="p-2 rounded-2xl bg-[#131C2E] hover:bg-[#1E293B] border border-white/10 text-[#94A3B8] hover:text-white transition-colors"
          >
            {audio.soundEnabled ? (
              <Volume2 className="w-4 h-4 text-[#38BDF8]" />
            ) : (
              <VolumeX className="w-4 h-4 text-[#64748B]" />
            )}
          </button>

          {/* Settings Trigger */}
          <button
            onClick={onOpenSettings}
            className="p-2 rounded-2xl bg-[#131C2E] hover:bg-[#1E293B] border border-white/10 text-[#94A3B8] hover:text-white transition-colors"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
